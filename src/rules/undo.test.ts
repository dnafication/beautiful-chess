import { describe, expect, it } from 'vitest';
import {
  applyMove,
  canUndo,
  capturedPieces,
  castlingRights,
  createGame,
  createGameFromFen,
  enPassantTarget,
  fullmoveNumber,
  gameStatus,
  halfmoveClock,
  legalMoves,
  materialAdvantage,
  sideToMove,
  toFen,
  undo,
} from './index';
import type { Game } from './index';

// Everything a caller can observe about a game, gathered so a test can assert
// that an undone game is indistinguishable from the game as it stood before.
function observable(game: Game) {
  return {
    fen: toFen(game),
    sideToMove: sideToMove(game),
    castlingRights: castlingRights(game),
    enPassantTarget: enPassantTarget(game),
    halfmoveClock: halfmoveClock(game),
    fullmoveNumber: fullmoveNumber(game),
    materialAdvantage: materialAdvantage(game),
    capturedPieces: capturedPieces(game),
    status: gameStatus(game),
    legalMoves: legalMoves(game),
  };
}

describe('canUndo', () => {
  it('is false at the start of a game', () => {
    expect(canUndo(createGame())).toBe(false);
  });

  it('is false for a game loaded from FEN with no moves played', () => {
    const game = createGameFromFen('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
    expect(canUndo(game)).toBe(false);
  });

  it('is true once a move has been played', () => {
    const game = applyMove(createGame(), { from: 'e2', to: 'e4' });
    expect(canUndo(game)).toBe(true);
  });
});

describe('undo', () => {
  it('returns the game as it stood before the last move', () => {
    const start = createGame();
    const before = observable(start);
    const after = applyMove(start, { from: 'e2', to: 'e4' });

    expect(observable(undo(after))).toEqual(before);
  });

  it('at the start of a game returns the game unchanged rather than erroring', () => {
    const start = createGame();
    expect(observable(undo(start))).toEqual(observable(start));
    expect(canUndo(undo(start))).toBe(false);
  });

  it('restores every observable field, including a double-push en-passant target', () => {
    const start = createGameFromFen(
      'rnbqkbnr/ppp1pppp/8/3p4/8/8/PPPPPPPP/RNBQKBNR w KQkq d6 0 2',
    );
    const before = observable(start);
    const after = applyMove(start, { from: 'e2', to: 'e4' });

    expect(observable(after).enPassantTarget).toBe('e3');
    expect(observable(undo(after))).toEqual(before);
  });

  it('restores castling rights lost by moving a rook', () => {
    const start = createGameFromFen('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
    const before = observable(start);
    const after = applyMove(start, { from: 'a1', to: 'a2' });

    expect(castlingRights(after).whiteQueenside).toBe(false);
    expect(observable(undo(after))).toEqual(before);
  });

  it('restores captured pieces and Material Advantage after a capture', () => {
    const start = createGameFromFen(
      'rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 3',
    );
    const before = observable(start);
    const after = applyMove(start, { from: 'e4', to: 'd5' });

    expect(materialAdvantage(after)).toBe(1);
    expect(observable(undo(after))).toEqual(before);
  });

  it('can be repeated all the way back to the start of the game', () => {
    const moves = [
      { from: 'e2', to: 'e4' },
      { from: 'e7', to: 'e5' },
      { from: 'g1', to: 'f3' },
      { from: 'b8', to: 'c6' },
      { from: 'f1', to: 'c4' },
    ] as const;
    const start = createGame();
    const snapshots = [observable(start)];
    let game = start;
    for (const move of moves) {
      game = applyMove(game, move);
      snapshots.push(observable(game));
    }

    for (let ply = moves.length; ply > 0; ply--) {
      game = undo(game);
      expect(observable(game)).toEqual(snapshots[ply - 1]);
    }
    expect(canUndo(game)).toBe(false);
  });

  it('rewinds a finished game back into a playable status', () => {
    // Fool's mate: 1. f3 e5 2. g4 Qh4#.
    let game = createGame();
    game = applyMove(game, { from: 'f2', to: 'f3' });
    game = applyMove(game, { from: 'e7', to: 'e5' });
    game = applyMove(game, { from: 'g2', to: 'g4' });
    game = applyMove(game, { from: 'd8', to: 'h4' });

    expect(gameStatus(game)).toEqual({ kind: 'checkmate', winner: 'black' });

    const reopened = undo(game);
    expect(gameStatus(reopened)).toEqual({ kind: 'in-progress' });
    expect(legalMoves(reopened).length).toBeGreaterThan(0);
  });

  it('only rewinds to a position loaded from FEN, never before it', () => {
    const start = createGameFromFen('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
    const after = applyMove(start, { from: 'e1', to: 'g1' });

    const back = undo(after);
    expect(observable(back)).toEqual(observable(start));
    expect(canUndo(back)).toBe(false);
  });

  it('preserves repetition history so an undone game still counts repeats', () => {
    // Build a game that reaches a threefold repetition, then undo the last move
    // and replay it: the count must still fire, proving history survived undo.
    let game = createGame();
    game = applyMove(game, { from: 'b1', to: 'c3' });
    game = applyMove(game, { from: 'g8', to: 'f6' });
    game = applyMove(game, { from: 'c3', to: 'b1' });
    game = applyMove(game, { from: 'f6', to: 'g8' }); // occurrence two of start
    game = applyMove(game, { from: 'b1', to: 'c3' });
    game = applyMove(game, { from: 'g8', to: 'f6' });
    game = applyMove(game, { from: 'c3', to: 'b1' });
    const beforeThird = game;
    game = applyMove(game, { from: 'f6', to: 'g8' }); // occurrence three of start
    expect(gameStatus(game)).toEqual({ kind: 'draw', reason: 'threefold-repetition' });

    const rewound = undo(game);
    expect(gameStatus(rewound)).toEqual(observable(beforeThird).status);
    const replayed = applyMove(rewound, { from: 'f6', to: 'g8' });
    expect(gameStatus(replayed)).toEqual({
      kind: 'draw',
      reason: 'threefold-repetition',
    });
  });
});
