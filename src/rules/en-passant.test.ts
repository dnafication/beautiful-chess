import { describe, expect, it } from 'vitest';
import {
  applyMove,
  createGameFromFen,
  enPassantTarget,
  isCheck,
  legalMoves,
  pieceAt,
} from './index';

describe('en passant generation', () => {
  it('generates the en-passant capture after a double pawn push', () => {
    // After 1.e4, Black's d4 pawn can capture en passant on e3.
    const game = createGameFromFen(
      'rnbqkbnr/pppp1ppp/8/8/3pP3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 2',
    );
    const moves = legalMoves(game);
    expect(moves.some((m) => m.from === 'd4' && m.to === 'e3')).toBe(true);
  });

  it('sets en-passant target after double push and clears it next move', () => {
    const after = createGameFromFen(
      'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
    );
    expect(enPassantTarget(after)).toBe('e3');
    // After Black replies with a non-capturing move, target is cleared.
    const after2 = applyMove(after, { from: 'a7', to: 'a6' });
    expect(enPassantTarget(after2)).toBeUndefined();
  });

  it('removes the captured pawn when en passant is played', () => {
    const game = createGameFromFen(
      'rnbqkbnr/pppp1ppp/8/8/3pP3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 2',
    );
    const after = applyMove(game, { from: 'd4', to: 'e3' });
    expect(pieceAt(after, 'e3')).toEqual({ color: 'black', type: 'pawn' });
    // The white pawn that was on e4 must be gone.
    expect(pieceAt(after, 'e4')).toBeUndefined();
  });
});

describe('en-passant pin (rank-pin)', () => {
  // Standard position for the en-passant pin:
  //   8/8/8/K2pP2q/8/8/8/7k w - d6 0 1
  // White king a5, white pawn e5, black pawn d5, black queen h5, black king h1.
  // exd6 would remove BOTH d5 and e5 from rank 5, leaving the a5 king in check
  // from the h5 queen.  The general mechanism (apply → isInCheck) must catch it.
  it('forbids en-passant that exposes the king along a rank', () => {
    const game = createGameFromFen('8/8/8/K2pP2q/8/8/8/7k w - d6 0 1');
    const moves = legalMoves(game);
    expect(moves.some((m) => m.from === 'e5' && m.to === 'd6')).toBe(false);
    // The king must still have some legal moves so this is not stalemate noise.
    expect(moves.length).toBeGreaterThan(0);
  });

  // The mirror case, and the reason the rule cannot be stated as "en passant is
  // illegal when it clears a rank": clearing the rank is only forbidden when it
  // exposes the mover's own king. Exposing the opponent's is a discovered check
  // and is perfectly legal.
  //   7k/8/8/8/KpP4r/8/8/8 b - c3 0 1
  // Rank 4 holds, in order, the white king on a4, the black pawn on b4, the
  // white pawn on c4 and the black rook on h4. The two pawns are the only thing
  // standing between that rook and that king, and bxc3 removes both at once —
  // the same double clearance as the pin test, aimed the other way.
  it('allows en-passant that discovers check on the opponent king', () => {
    const game = createGameFromFen('7k/8/8/8/KpP4r/8/8/8 b - c3 0 1');
    expect(isCheck(game)).toBe(false);

    const moves = legalMoves(game);
    expect(moves.some((m) => m.from === 'b4' && m.to === 'c3')).toBe(true);

    const after = applyMove(game, { from: 'b4', to: 'c3' });
    expect(pieceAt(after, 'c3')).toEqual({ color: 'black', type: 'pawn' });
    expect(pieceAt(after, 'b4')).toBeUndefined();
    expect(pieceAt(after, 'c4')).toBeUndefined();
    expect(isCheck(after)).toBe(true);
  });
});
