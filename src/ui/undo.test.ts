import { describe, expect, it } from 'vitest';
import {
  applyMove,
  capturedPieces,
  castlingRights,
  createGame,
  createGameFromFen,
  enPassantTarget,
  gameStatus,
  materialAdvantage,
  sideToMove,
  toFen,
} from '../rules';
import type { Game, Move } from '../rules';
import { applyUndo, undoControlPresentation } from './undo';

function play(game: Game, ...moves: readonly Move[]): Game {
  return moves.reduce((current, move) => applyMove(current, move), game);
}

describe('undo control presentation', () => {
  it('faces each Player Edge at its own player, reusing the Player Edge rotation', () => {
    const game = applyMove(createGame(), { from: 'e2', to: 'e4' });
    expect(undoControlPresentation(game, 'near').rotation).toBe('0deg');
    expect(undoControlPresentation(game, 'far').rotation).toBe('180deg');
  });

  it('carries the same label on both Player Edges', () => {
    const game = applyMove(createGame(), { from: 'e2', to: 'e4' });
    expect(undoControlPresentation(game, 'near').label).toBe('Undo');
    expect(undoControlPresentation(game, 'far').label).toBe('Undo');
  });

  it('is unavailable at the start of a game, when there is nothing to undo', () => {
    const game = createGame();
    expect(undoControlPresentation(game, 'near').available).toBe(false);
    expect(undoControlPresentation(game, 'far').available).toBe(false);
  });

  it('becomes available once a move has been played', () => {
    const game = applyMove(createGame(), { from: 'e2', to: 'e4' });
    expect(undoControlPresentation(game, 'near').available).toBe(true);
    expect(undoControlPresentation(game, 'far').available).toBe(true);
  });
});

describe('applying undo', () => {
  it('reverses the last move, restoring the position and the side to move', () => {
    const start = createGame();
    const played = applyMove(start, { from: 'e2', to: 'e4' });

    const result = applyUndo(played);

    expect(result.changed).toBe(true);
    expect(sideToMove(result.game)).toBe('white');
    expect(toFen(result.game)).toBe(toFen(start));
  });

  it('repeats back to the start of the game', () => {
    const start = createGame();
    let game = play(
      start,
      { from: 'e2', to: 'e4' },
      { from: 'e7', to: 'e5' },
      { from: 'g1', to: 'f3' },
    );

    game = applyUndo(game).game;
    game = applyUndo(game).game;
    game = applyUndo(game).game;

    expect(toFen(game)).toBe(toFen(start));
    expect(applyUndo(game).changed).toBe(false);
  });

  it('does nothing when there is nothing to undo', () => {
    const start = createGame();
    const result = applyUndo(start);
    expect(result.changed).toBe(false);
    expect(result.game).toBe(start);
  });

  it('restores both Trays and Material Advantage after a capture', () => {
    // 1. e4 d5 2. exd5 — White captures a pawn.
    const before = play(createGame(), { from: 'e2', to: 'e4' }, { from: 'd7', to: 'd5' });
    const captured = applyMove(before, { from: 'e4', to: 'd5' });
    expect(capturedPieces(captured).byWhite).toHaveLength(1);
    expect(materialAdvantage(captured)).toBe(1);

    const result = applyUndo(captured);

    expect(capturedPieces(result.game).byWhite).toHaveLength(0);
    expect(materialAdvantage(result.game)).toBe(0);
    expect(toFen(result.game)).toBe(toFen(before));
  });

  it('restores castling rights lost by a move', () => {
    const before = createGameFromFen('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
    const castled = applyMove(before, { from: 'e1', to: 'g1' });
    expect(castlingRights(castled).whiteKingside).toBe(false);

    const result = applyUndo(castled);

    expect(castlingRights(result.game)).toEqual(castlingRights(before));
    expect(toFen(result.game)).toBe(toFen(before));
  });

  it('restores en-passant availability', () => {
    const before = createGameFromFen(
      'rnbqkbnr/ppp1pppp/8/8/3p4/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    );
    const doublePush = applyMove(before, { from: 'e2', to: 'e4' });
    expect(enPassantTarget(doublePush)).toBe('e3');

    const result = applyUndo(doublePush);

    expect(enPassantTarget(result.game)).toBe(enPassantTarget(before));
    expect(toFen(result.game)).toBe(toFen(before));
  });

  it('steps a finished game back into play', () => {
    // Fool's mate: 1. f3 e5 2. g4 Qh4#.
    const mated = play(
      createGame(),
      { from: 'f2', to: 'f3' },
      { from: 'e7', to: 'e5' },
      { from: 'g2', to: 'g4' },
      { from: 'd8', to: 'h4' },
    );
    expect(gameStatus(mated)).toEqual({ kind: 'checkmate', winner: 'black' });

    const result = applyUndo(mated);

    expect(result.changed).toBe(true);
    expect(gameStatus(result.game).kind).toBe('in-progress');
    expect(undoControlPresentation(result.game, 'near').available).toBe(true);
  });
});
