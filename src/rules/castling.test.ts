import { describe, expect, it } from 'vitest';
import type { Square } from './index';
import {
  applyMove,
  castlingRights,
  createGameFromFen,
  halfmoveClock,
  legalDestinations,
  pieceAt,
} from './index';

// An empty back rank behind both kings, so castling is available to each side
// in both directions and nothing else clutters the position.
const BOTH_SIDES_FREE = 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1';

const canCastle = (fen: string, from: Square, to: Square): boolean =>
  legalDestinations(createGameFromFen(fen), from).includes(to);

describe('castling as a single king move', () => {
  it('offers the king two squares toward each rook', () => {
    const destinations = legalDestinations(createGameFromFen(BOTH_SIDES_FREE), 'e1');
    expect(destinations).toContain('g1');
    expect(destinations).toContain('c1');
  });

  it('moves the rook to its castled square when the king castles kingside', () => {
    const after = applyMove(createGameFromFen(BOTH_SIDES_FREE), {
      from: 'e1',
      to: 'g1',
    });
    expect(pieceAt(after, 'g1')).toEqual({ color: 'white', type: 'king' });
    expect(pieceAt(after, 'f1')).toEqual({ color: 'white', type: 'rook' });
    expect(pieceAt(after, 'e1')).toBeUndefined();
    expect(pieceAt(after, 'h1')).toBeUndefined();
  });

  it('moves the rook to its castled square when the king castles queenside', () => {
    const after = applyMove(createGameFromFen(BOTH_SIDES_FREE), {
      from: 'e1',
      to: 'c1',
    });
    expect(pieceAt(after, 'c1')).toEqual({ color: 'white', type: 'king' });
    expect(pieceAt(after, 'd1')).toEqual({ color: 'white', type: 'rook' });
    expect(pieceAt(after, 'e1')).toBeUndefined();
    expect(pieceAt(after, 'a1')).toBeUndefined();
    // b1 is only ever vacated, never occupied: the rook passes over it.
    expect(pieceAt(after, 'b1')).toBeUndefined();
  });

  it('castles Black the same way, toward its own back rank', () => {
    const black = createGameFromFen('r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 1');
    const after = applyMove(black, { from: 'e8', to: 'c8' });
    expect(pieceAt(after, 'c8')).toEqual({ color: 'black', type: 'king' });
    expect(pieceAt(after, 'd8')).toEqual({ color: 'black', type: 'rook' });
    expect(pieceAt(after, 'a8')).toBeUndefined();
  });
});

describe('castling preconditions', () => {
  it('does not castle without the right, even with the pieces still home', () => {
    // Same pieces on the same squares as BOTH_SIDES_FREE; only the rights differ.
    expect(canCastle('r3k2r/8/8/8/8/8/8/R3K2R w - - 0 1', 'e1', 'g1')).toBe(false);
    expect(canCastle('r3k2r/8/8/8/8/8/8/R3K2R w - - 0 1', 'e1', 'c1')).toBe(false);
  });

  it('does not castle through an occupied square', () => {
    // A bishop on f1 blocks kingside; a knight on b1 blocks queenside.
    expect(canCastle('r3k2r/8/8/8/8/8/8/R3KB1R w KQkq - 0 1', 'e1', 'g1')).toBe(false);
    expect(canCastle('r3k2r/8/8/8/8/8/8/RN2K2R w KQkq - 0 1', 'e1', 'c1')).toBe(false);
  });

  it('does not castle out of check', () => {
    // A black rook on e8 bears down the e-file onto the white king.
    expect(canCastle('4r3/8/7k/8/8/8/8/R3K2R w KQ - 0 1', 'e1', 'g1')).toBe(false);
    expect(canCastle('4r3/8/7k/8/8/8/8/R3K2R w KQ - 0 1', 'e1', 'c1')).toBe(false);
  });

  it('does not castle through an attacked square', () => {
    // A black rook on f8 attacks f1, the square the king crosses kingside.
    expect(canCastle('5r2/8/7k/8/8/8/8/R3K2R w KQ - 0 1', 'e1', 'g1')).toBe(false);
    // A black rook on d8 attacks d1, the square the king crosses queenside.
    expect(canCastle('3r4/8/7k/8/8/8/8/R3K2R w KQ - 0 1', 'e1', 'c1')).toBe(false);
  });

  it('does not castle onto an attacked square', () => {
    // A black rook on g8 attacks g1, where the king would land kingside.
    expect(canCastle('6r1/8/7k/8/8/8/8/R3K2R w KQ - 0 1', 'e1', 'g1')).toBe(false);
    // A black rook on c8 attacks c1, where the king would land queenside.
    expect(canCastle('2r5/8/7k/8/8/8/8/R3K2R w KQ - 0 1', 'e1', 'c1')).toBe(false);
  });

  it('does not castle when the rook is missing despite the right', () => {
    // FEN validation is structural, so a position can claim a right whose rook
    // is not there. The rook is looked for rather than assumed.
    expect(canCastle('4k3/8/8/8/8/8/8/4K2R w Q - 0 1', 'e1', 'c1')).toBe(false);
  });
});

describe('the rook may pass through an attacked square', () => {
  // The asymmetry that is easiest to get wrong: only the king's path is
  // constrained. Queenside, the rook crosses b1 and the king never touches it.
  it('castles queenside when only b1 is attacked', () => {
    // A black rook on b8 attacks b1, which the a1 rook crosses. c1 and d1, the
    // squares the king actually uses, are clear of attack.
    expect(canCastle('1r6/8/7k/8/8/8/8/R3K2R w KQ - 0 1', 'e1', 'c1')).toBe(true);
  });

  it('castles queenside when the rook itself is attacked', () => {
    // A black rook on a8 attacks a1, the castling rook's own square.
    expect(canCastle('r7/8/7k/8/8/8/8/R3K2R w KQ - 0 1', 'e1', 'c1')).toBe(true);
  });
});

describe('castling rights are rights, not inferences', () => {
  it('loses both rights permanently when the king moves', () => {
    const moved = applyMove(createGameFromFen(BOTH_SIDES_FREE), {
      from: 'e1',
      to: 'e2',
    });
    expect(castlingRights(moved).whiteKingside).toBe(false);
    expect(castlingRights(moved).whiteQueenside).toBe(false);
    // Black is untouched.
    expect(castlingRights(moved).blackKingside).toBe(true);
  });

  it('loses one right when its rook moves', () => {
    const moved = applyMove(createGameFromFen(BOTH_SIDES_FREE), {
      from: 'h1',
      to: 'h5',
    });
    expect(castlingRights(moved).whiteKingside).toBe(false);
    expect(castlingRights(moved).whiteQueenside).toBe(true);
  });

  it('loses the right when the rook is captured on its home square', () => {
    // Black's a8 rook takes the white rook on a1 down the open a-file.
    const game = createGameFromFen('r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 1');
    const moved = applyMove(game, { from: 'a8', to: 'a1' });
    expect(castlingRights(moved).whiteQueenside).toBe(false);
    expect(castlingRights(moved).whiteKingside).toBe(true);
  });

  it('does not restore the right when the rook returns home', () => {
    let game = createGameFromFen(BOTH_SIDES_FREE);
    game = applyMove(game, { from: 'h1', to: 'h5' }); // rook out
    game = applyMove(game, { from: 'a8', to: 'a5' }); // Black passes the time
    game = applyMove(game, { from: 'h5', to: 'h1' }); // rook home again
    game = applyMove(game, { from: 'a5', to: 'a8' }); // and so does Black's

    expect(castlingRights(game).whiteKingside).toBe(false);
    expect(legalDestinations(game, 'e1')).not.toContain('g1');
    // The other side's right survived the round trip untouched.
    expect(castlingRights(game).whiteQueenside).toBe(true);
    expect(legalDestinations(game, 'e1')).toContain('c1');
  });

  it('gives up both rights when the king castles', () => {
    const after = applyMove(createGameFromFen(BOTH_SIDES_FREE), {
      from: 'e1',
      to: 'g1',
    });
    expect(castlingRights(after).whiteKingside).toBe(false);
    expect(castlingRights(after).whiteQueenside).toBe(false);
  });

  it('counts castling as a quiet move on the halfmove clock', () => {
    // Neither a capture nor a pawn move, so the clock keeps running.
    const game = createGameFromFen('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 7 20');
    expect(halfmoveClock(applyMove(game, { from: 'e1', to: 'g1' }))).toBe(8);
  });
});
