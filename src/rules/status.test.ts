import { describe, expect, it } from 'vitest';
import {
  applyMove,
  createGameFromFen,
  gameStatus,
  halfmoveClock,
  IllegalMoveError,
} from './index';

// ---------------------------------------------------------------------------
// Checkmate
//
// Perft cannot verify anything in this file — it counts nodes and says nothing
// about who has been mated or whether a game has drawn. The safety net here is
// hand-built positions with a known verdict, spelled out in the comments.
// ---------------------------------------------------------------------------

describe('checkmate', () => {
  it("reports checkmate and names the winner (Fool's mate, White is mated)", () => {
    // 1. f3 e5 2. g4 Qh4#. White is to move, in check from the queen on h4
    // along the h4-g3-f2-e1 diagonal, with no escape, block or capture.
    const game = createGameFromFen(
      'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3',
    );
    expect(gameStatus(game)).toEqual({ kind: 'checkmate', winner: 'black' });
  });
});

describe('stalemate', () => {
  it('reports a draw by stalemate, distinct from checkmate', () => {
    // Black king on a8 is not in check, but every square it could move to
    // (a7, b7, b8) is covered by the white queen on b6. No legal move, no
    // check: stalemate.
    const game = createGameFromFen('k7/8/1Q6/8/8/8/8/7K b - - 0 1');
    expect(gameStatus(game)).toEqual({ kind: 'draw', reason: 'stalemate' });
  });

  it('does not classify a position with legal escapes as finished', () => {
    // Black king on a8 is in check from the rook on a1 but can step to b7 or
    // b8, so this is neither checkmate nor stalemate.
    const game = createGameFromFen('k7/8/8/8/8/8/8/R6K b - - 0 1');
    expect(gameStatus(game)).toEqual({ kind: 'in-progress' });
  });
});

describe('insufficient material', () => {
  it('reports a draw for king versus king', () => {
    const game = createGameFromFen('8/8/4k3/8/8/4K3/8/8 w - - 0 1');
    expect(gameStatus(game)).toEqual({
      kind: 'draw',
      reason: 'insufficient-material',
    });
  });

  it('reports a draw for king and knight versus king', () => {
    const game = createGameFromFen('8/8/4k3/8/8/4K3/8/6N1 w - - 0 1');
    expect(gameStatus(game)).toEqual({
      kind: 'draw',
      reason: 'insufficient-material',
    });
  });

  it('reports a draw for king and bishop versus king', () => {
    const game = createGameFromFen('8/8/4k3/8/8/4K3/8/5B2 w - - 0 1');
    expect(gameStatus(game)).toEqual({
      kind: 'draw',
      reason: 'insufficient-material',
    });
  });

  it('reports a draw for king and bishop versus king and bishop when both bishops stand on the same colour square', () => {
    // White bishop c1 and black bishop f8 are both on dark squares.
    const game = createGameFromFen('5b2/8/4k3/8/8/4K3/8/2B5 w - - 0 1');
    expect(gameStatus(game)).toEqual({
      kind: 'draw',
      reason: 'insufficient-material',
    });
  });

  it('does not draw king and bishop versus king and bishop on opposite colours', () => {
    // White bishop c1 (dark) and black bishop c8 (light): mate is possible.
    const game = createGameFromFen('2b5/8/4k3/8/8/4K3/8/2B5 w - - 0 1');
    expect(gameStatus(game)).toEqual({ kind: 'in-progress' });
  });

  // Two bishops on one colour of square cannot mate whichever side owns them,
  // so the rule is about the squares the bishops stand on, not about who holds
  // them. Both of White's bishops here are dark-squared.
  it('reports a draw for two same-coloured bishops on one side', () => {
    const game = createGameFromFen('8/8/4k3/8/8/B3K3/8/2B5 w - - 0 1');
    expect(gameStatus(game)).toEqual({
      kind: 'draw',
      reason: 'insufficient-material',
    });
  });

  it('does not draw king and two knights versus king', () => {
    const game = createGameFromFen('8/8/4k3/8/8/4K3/8/5NN1 w - - 0 1');
    expect(gameStatus(game)).toEqual({ kind: 'in-progress' });
  });

  it('does not treat a lone pawn as insufficient material', () => {
    const game = createGameFromFen('8/8/4k3/8/8/4K3/4P3/8 w - - 0 1');
    expect(gameStatus(game)).toEqual({ kind: 'in-progress' });
  });

  it('does not treat a rook as insufficient material', () => {
    const game = createGameFromFen('8/8/4k3/8/8/4K3/8/R7 w - - 0 1');
    expect(gameStatus(game)).toEqual({ kind: 'in-progress' });
  });
});

describe('fifty-move rule', () => {
  // Draws here are auto-declared. FIDE makes the fifty-move rule claim-based,
  // but in Pass-and-Play there is no player primed to claim it, so the referee
  // declares it. The half-move clock is still tracked exactly as the Laws
  // require; only the claiming step is automated away.
  it('reports a draw once the half-move clock reaches a hundred half-moves', () => {
    const game = createGameFromFen('8/8/4k3/8/8/4K3/8/R7 w - - 100 1');
    expect(gameStatus(game)).toEqual({ kind: 'draw', reason: 'fifty-move-rule' });
  });

  it('declares the draw on the quiet move that reaches a hundred', () => {
    const game = createGameFromFen('8/8/4k3/8/8/4K3/8/R7 w - - 99 1');
    expect(gameStatus(game)).toEqual({ kind: 'in-progress' });
    const after = applyMove(game, { from: 'a1', to: 'a2' });
    expect(halfmoveClock(after)).toBe(100);
    expect(gameStatus(after)).toEqual({ kind: 'draw', reason: 'fifty-move-rule' });
  });

  it('resets the clock on a pawn move, so no draw is declared', () => {
    const game = createGameFromFen('8/8/4k3/8/8/4K3/P7/R7 w - - 99 1');
    const after = applyMove(game, { from: 'a2', to: 'a3' });
    expect(halfmoveClock(after)).toBe(0);
    expect(gameStatus(after)).toEqual({ kind: 'in-progress' });
  });

  it('resets the clock on a capture, so no draw is declared', () => {
    // White rook on a1 captures the black rook on a7; the capture zeroes the
    // clock even though it stood at 99.
    const game = createGameFromFen('8/r7/4k3/8/8/4K3/8/R7 w - - 99 1');
    const after = applyMove(game, { from: 'a1', to: 'a7' });
    expect(halfmoveClock(after)).toBe(0);
    expect(gameStatus(after)).toEqual({ kind: 'in-progress' });
  });
});

describe('threefold repetition', () => {
  // Auto-declared without a claim, another deliberate deviation from the
  // claim-based Laws of Chess for the same Pass-and-Play reason.

  // Shuffle the b-knights out and home. Each full cycle of four half-moves
  // returns the identical position with White to move; the third occurrence is
  // a draw. Only kings and knights are on the board, so there is no capture,
  // no pawn move and no change to castling rights or en-passant to muddy the
  // position's identity.
  const cycle = [
    { from: 'b1', to: 'c3' },
    { from: 'b8', to: 'c6' },
    { from: 'c3', to: 'b1' },
    { from: 'c6', to: 'b8' },
  ] as const;

  it('declares a draw on the third occurrence of a position, not the second', () => {
    let game = createGameFromFen('1n2k1n1/8/8/8/8/8/8/1N2K1N1 w - - 0 1');
    // Starting position is occurrence one.
    for (const move of cycle) game = applyMove(game, move); // occurrence two
    expect(gameStatus(game)).toEqual({ kind: 'in-progress' });
    for (const move of cycle) game = applyMove(game, move); // occurrence three
    expect(gameStatus(game)).toEqual({
      kind: 'draw',
      reason: 'threefold-repetition',
    });
  });
});

describe('position identity for repetition', () => {
  it('does not count positions that differ only in castling rights as the same', () => {
    // White has the queenside castling right (rook a1, king e1); Black only
    // shuffles knights, so Black's identity never changes. White breaks the
    // right early by moving the a-rook out and home again. The starting board
    // therefore recurs with the right present once and absent afterwards, so
    // three identical-looking boards are only two identical positions.
    let game = createGameFromFen('1n2k1n1/8/8/8/8/8/8/RN2K1N1 w Q - 0 1');
    // Occurrence one of the starting board carries the queenside right.
    game = applyMove(game, { from: 'a1', to: 'a2' }); // right lost here
    game = applyMove(game, { from: 'g8', to: 'f6' });
    game = applyMove(game, { from: 'a2', to: 'a1' }); // rook home, right stays lost
    game = applyMove(game, { from: 'f6', to: 'g8' });
    // Starting board again, now without the right: occurrence two.
    expect(gameStatus(game)).toEqual({ kind: 'in-progress' });
    game = applyMove(game, { from: 'b1', to: 'c3' });
    game = applyMove(game, { from: 'b8', to: 'c6' });
    game = applyMove(game, { from: 'c3', to: 'b1' });
    game = applyMove(game, { from: 'c6', to: 'b8' });
    // Occurrence three of the board, but only occurrence two without the right,
    // so it is not yet a draw.
    expect(gameStatus(game)).toEqual({ kind: 'in-progress' });
    game = applyMove(game, { from: 'b1', to: 'c3' });
    game = applyMove(game, { from: 'b8', to: 'c6' });
    game = applyMove(game, { from: 'c3', to: 'b1' });
    game = applyMove(game, { from: 'c6', to: 'b8' });
    // The right-less position has now occurred three times: a draw at last.
    expect(gameStatus(game)).toEqual({
      kind: 'draw',
      reason: 'threefold-repetition',
    });
  });
});

describe('en-passant availability for repetition', () => {
  it('does not count positions that differ only in an available en-passant capture as the same', () => {
    // 1. a2-a4 offers Black a real en-passant capture (b4xa3). Black declines
    // and both sides shuffle knights back home, so the board with pawns on a4
    // and b4 recurs — but the first occurrence, with the capture available, is
    // a different position from the later ones where it has expired.
    let game = createGameFromFen('4k1n1/8/8/8/1p6/8/P7/4K1N1 w - - 0 1');
    game = applyMove(game, { from: 'a2', to: 'a4' }); // occurrence one: ep on a3 available
    game = applyMove(game, { from: 'g8', to: 'f6' });
    game = applyMove(game, { from: 'g1', to: 'f3' });
    game = applyMove(game, { from: 'f6', to: 'g8' });
    game = applyMove(game, { from: 'f3', to: 'g1' }); // occurrence two: no ep
    expect(gameStatus(game)).toEqual({ kind: 'in-progress' });
    game = applyMove(game, { from: 'g8', to: 'f6' });
    game = applyMove(game, { from: 'g1', to: 'f3' });
    game = applyMove(game, { from: 'f6', to: 'g8' });
    game = applyMove(game, { from: 'f3', to: 'g1' }); // occurrence three: no ep
    // Only the two ep-less occurrences match, so no draw yet.
    expect(gameStatus(game)).toEqual({ kind: 'in-progress' });
  });

  it('ignores an en-passant target that no pawn can actually capture', () => {
    // 1. a2-a4 records a4/a3 as the FEN en-passant target, but with no black
    // pawn beside it the capture is not available, so this position is the same
    // as the ep-less ones that follow. Three occurrences therefore draw.
    let game = createGameFromFen('4k1n1/8/8/8/8/8/P7/4K1N1 w - - 0 1');
    game = applyMove(game, { from: 'a2', to: 'a4' }); // occurrence one: ep target, but unusable
    game = applyMove(game, { from: 'g8', to: 'f6' });
    game = applyMove(game, { from: 'g1', to: 'f3' });
    game = applyMove(game, { from: 'f6', to: 'g8' });
    game = applyMove(game, { from: 'f3', to: 'g1' }); // occurrence two
    game = applyMove(game, { from: 'g8', to: 'f6' });
    game = applyMove(game, { from: 'g1', to: 'f3' });
    game = applyMove(game, { from: 'f6', to: 'g8' });
    game = applyMove(game, { from: 'f3', to: 'g1' }); // occurrence three
    expect(gameStatus(game)).toEqual({
      kind: 'draw',
      reason: 'threefold-repetition',
    });
  });
});

describe('a finished game accepts no further move', () => {
  it('rejects a move once the game has drawn, even though pieces could still move', () => {
    // King and knight versus king is an insufficient-material draw, yet the
    // knight still has pseudo-legal moves. The game being over must win over
    // the move being otherwise playable.
    const game = createGameFromFen('8/8/4k3/8/8/4K3/8/6N1 w - - 0 1');
    expect(gameStatus(game).kind).toBe('draw');
    expect(() => applyMove(game, { from: 'g1', to: 'f3' })).toThrow(IllegalMoveError);
  });

  it('rejects a move after checkmate', () => {
    const game = createGameFromFen(
      'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3',
    );
    expect(() => applyMove(game, { from: 'e1', to: 'f2' })).toThrow(IllegalMoveError);
  });
});
