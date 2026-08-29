import { describe, expect, it } from 'vitest';
import {
  applyMove,
  canUndo,
  capturedPieces,
  createGame,
  gameStatus,
  materialAdvantage,
  sideToMove,
  toFen,
  undo,
} from '../rules';
import type { Game, Move } from '../rules';
import type { GameStorage } from './gameStore';
import { restoreSession, saveSession } from './gameStore';
import { createSession, resign, tableResult } from '../ui/session';

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

/**
 * An in-memory `GameStorage` standing in for the device, so the whole round
 * trip is exercised without one. It holds a single string, exactly like the
 * real single-key adapter.
 */
function fakeStorage(initial: string | null = null): GameStorage {
  let value = initial;
  return {
    read: () => Promise.resolve(value),
    write: (next) => {
      value = next;
      return Promise.resolve();
    },
  };
}

function play(moves: readonly Move[]): Game {
  return moves.reduce<Game>((game, move) => applyMove(game, move), createGame());
}

// One game exercising castling, an en-passant capture, two promotions and a
// repeated position (the knight shuffle recurs), so the round trip is proven on
// a history a position-only save would silently lose.
const KITCHEN_SINK: readonly Move[] = [
  { from: 'e2', to: 'e4' },
  { from: 'a7', to: 'a5' },
  { from: 'e4', to: 'e5' },
  { from: 'd7', to: 'd5' },
  { from: 'e5', to: 'd6' }, // en passant
  { from: 'a5', to: 'a4' },
  { from: 'f1', to: 'c4' },
  { from: 'a4', to: 'a3' },
  { from: 'g1', to: 'f3' },
  { from: 'a3', to: 'b2' },
  { from: 'e1', to: 'g1' }, // white castles kingside
  { from: 'b2', to: 'a1', promotion: 'queen' }, // black promotes capturing a rook
  { from: 'd6', to: 'c7' },
  { from: 'a1', to: 'b2' },
  { from: 'c7', to: 'b8', promotion: 'queen' }, // white promotes capturing a knight
  { from: 'g8', to: 'f6' },
  { from: 'f3', to: 'g5' },
  { from: 'f6', to: 'g8' },
  { from: 'g5', to: 'f3' }, // position recurs from here on
  { from: 'g8', to: 'f6' },
  { from: 'f3', to: 'g5' },
  { from: 'f6', to: 'g8' },
  { from: 'g5', to: 'f3' },
];

// Fool's mate: the shortest finished game.
const FOOLS_MATE: readonly Move[] = [
  { from: 'f2', to: 'f3' },
  { from: 'e7', to: 'e5' },
  { from: 'g2', to: 'g4' },
  { from: 'd8', to: 'h4' },
];

function rewindToStart(game: Game): { steps: number; game: Game } {
  let steps = 0;
  let current = game;
  while (canUndo(current)) {
    current = undo(current);
    steps += 1;
  }
  return { steps, game: current };
}

describe('saveSession / restoreSession', () => {
  it('restores a game exactly as it was left', async () => {
    const storage = fakeStorage();
    const game = play(KITCHEN_SINK);
    await saveSession(storage, createSession(game));

    const restored = (await restoreSession(storage)).game;

    expect(toFen(restored)).toBe(toFen(game));
    expect(sideToMove(restored)).toBe(sideToMove(game));
    expect(capturedPieces(restored)).toEqual(capturedPieces(game));
    expect(materialAdvantage(restored)).toBe(materialAdvantage(game));
  });

  it('carries the full history, so undo still reaches the start after a resume', async () => {
    const storage = fakeStorage();
    const game = play(KITCHEN_SINK);
    await saveSession(storage, createSession(game));

    const restored = (await restoreSession(storage)).game;

    expect(canUndo(restored)).toBe(true);
    const rewound = rewindToStart(restored);
    expect(rewound.steps).toBe(KITCHEN_SINK.length);
    expect(toFen(rewound.game)).toBe(START_FEN);
  });

  it('restores a finished game as finished, with its result intact', async () => {
    const storage = fakeStorage();
    const game = play(FOOLS_MATE);
    expect(gameStatus(game)).toEqual({ kind: 'checkmate', winner: 'black' });
    await saveSession(storage, createSession(game));

    const restored = (await restoreSession(storage)).game;

    expect(gameStatus(restored)).toEqual({ kind: 'checkmate', winner: 'black' });
  });

  it('replaces the stored game, so starting a new game is what is resumed', async () => {
    const storage = fakeStorage();
    await saveSession(storage, createSession(play(KITCHEN_SINK)));

    await saveSession(storage, createSession(createGame()));
    const restored = (await restoreSession(storage)).game;

    expect(toFen(restored)).toBe(START_FEN);
    expect(canUndo(restored)).toBe(false);
  });

  it('reads back the most recent save', async () => {
    const storage = fakeStorage();
    const afterOne = play([{ from: 'e2', to: 'e4' }]);
    const afterTwo = play([
      { from: 'e2', to: 'e4' },
      { from: 'e7', to: 'e5' },
    ]);

    await saveSession(storage, createSession(afterOne));
    await saveSession(storage, createSession(afterTwo));

    expect(toFen((await restoreSession(storage)).game)).toBe(toFen(afterTwo));
  });
});

describe('an unreadable save yields a fresh game rather than an error state', () => {
  const unreadable: Record<string, string | null> = {
    'nothing stored yet': null,
    empty: '',
    garbage: 'not a game at all',
    'truncated json': '{"start":"rnbqkbnr/pppppppp',
    'a plausible older format': START_FEN,
  };

  for (const [name, stored] of Object.entries(unreadable)) {
    it(`starts fresh from ${name}`, async () => {
      const restored = (await restoreSession(fakeStorage(stored))).game;

      expect(toFen(restored)).toBe(START_FEN);
      expect(canUndo(restored)).toBe(false);
      // Fresh and playable: the players are never stranded.
      expect(toFen(applyMove(restored, { from: 'e2', to: 'e4' }))).toBe(
        'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
      );
    });
  }
});

describe('an ending the players agreed on', () => {
  it('is restored with the game, so a resigned game comes back resigned', async () => {
    // The move list cannot carry a resignation, so a store that kept only the
    // game would hand two players back a game they had already finished.
    const storage = fakeStorage();
    const session = resign(createSession(play([{ from: 'e2', to: 'e4' }])), 'white');
    await saveSession(storage, session);

    const restored = await restoreSession(storage);

    expect(tableResult(restored)).toEqual({
      kind: 'decisive',
      winner: 'black',
      text: 'Black wins by resignation',
    });
  });
});
