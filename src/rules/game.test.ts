import { describe, expect, it } from 'vitest';
import {
  InvalidPositionError,
  castlingRights,
  createGame,
  createGameFromFen,
  enPassantTarget,
  fullmoveNumber,
  halfmoveClock,
  pieceAt,
  sideToMove,
  toFen,
} from './index';

// ---------------------------------------------------------------------------
// Standard starting position
// ---------------------------------------------------------------------------

describe('createGame', () => {
  it('returns white to move', () => {
    expect(sideToMove(createGame())).toBe('white');
  });

  it('places a white king on e1', () => {
    expect(pieceAt(createGame(), 'e1')).toEqual({ color: 'white', type: 'king' });
  });

  it('places a black king on e8', () => {
    expect(pieceAt(createGame(), 'e8')).toEqual({ color: 'black', type: 'king' });
  });

  it('places a white rook on a1', () => {
    expect(pieceAt(createGame(), 'a1')).toEqual({ color: 'white', type: 'rook' });
  });

  it('places a black rook on h8', () => {
    expect(pieceAt(createGame(), 'h8')).toEqual({ color: 'black', type: 'rook' });
  });

  it('has all castling rights', () => {
    expect(castlingRights(createGame())).toEqual({
      whiteKingside: true,
      whiteQueenside: true,
      blackKingside: true,
      blackQueenside: true,
    });
  });

  it('has no en-passant target', () => {
    expect(enPassantTarget(createGame())).toBeUndefined();
  });

  it('has halfmove clock 0', () => {
    expect(halfmoveClock(createGame())).toBe(0);
  });

  it('has fullmove number 1', () => {
    expect(fullmoveNumber(createGame())).toBe(1);
  });

  it('has nothing on e4', () => {
    expect(pieceAt(createGame(), 'e4')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Round-trip: all six perft positions
// ---------------------------------------------------------------------------

describe('FEN round-trip', () => {
  // Position 1: standard starting position
  it('round-trips position 1 (starting)', () => {
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    expect(toFen(createGameFromFen(fen))).toBe(fen);
  });

  // Position 2: Kiwipete
  // Note: the research doc (docs/research/rules-libraries-by-platform.md §6.3)
  // omits the halfmove and fullmove fields; the canonical six-field form is used
  // here because FEN requires all six fields to round-trip correctly.
  it('round-trips position 2 (Kiwipete)', () => {
    const fen = 'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1';
    expect(toFen(createGameFromFen(fen))).toBe(fen);
  });

  // Position 3: no castling rights at all
  it('round-trips position 3 (no castling)', () => {
    const fen = '8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1';
    expect(toFen(createGameFromFen(fen))).toBe(fen);
  });

  // Position 4: only black castling rights
  it('round-trips position 4 (black castling only)', () => {
    const fen = 'r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1';
    expect(toFen(createGameFromFen(fen))).toBe(fen);
  });

  // Position 5: only white castling rights, non-zero halfmove clock, fullmove 8
  it('round-trips position 5 (white castling only, clocks non-trivial)', () => {
    const fen = 'rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8';
    expect(toFen(createGameFromFen(fen))).toBe(fen);
  });

  // Position 6: no castling rights, fullmove 10
  it('round-trips position 6 (no castling, fullmove 10)', () => {
    const fen =
      'r4rk1/1pp1qppp/p1np1n2/2b1p1B1/2B1P1b1/P1NP1N2/1PP1QPPP/R4RK1 w - - 0 10';
    expect(toFen(createGameFromFen(fen))).toBe(fen);
  });
});

// ---------------------------------------------------------------------------
// Piece placement correctness (asymmetric position)
// ---------------------------------------------------------------------------

describe('pieceAt', () => {
  it('reads piece placement from an asymmetric position', () => {
    // Position 2: a1 has white rook, h8 has black rook
    const game = createGameFromFen(
      'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1',
    );
    expect(pieceAt(game, 'a1')).toEqual({ color: 'white', type: 'rook' });
    expect(pieceAt(game, 'h8')).toEqual({ color: 'black', type: 'rook' });
    expect(pieceAt(game, 'b4')).toEqual({ color: 'black', type: 'pawn' });
    expect(pieceAt(game, 'd5')).toEqual({ color: 'white', type: 'pawn' });
  });

  it('returns undefined for an empty square', () => {
    expect(pieceAt(createGame(), 'e4')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// sideToMove, castlingRights, enPassantTarget
// ---------------------------------------------------------------------------

describe('sideToMove', () => {
  it('parses black to move', () => {
    const game = createGameFromFen(
      'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
    );
    expect(sideToMove(game)).toBe('black');
  });
});

describe('enPassantTarget', () => {
  it('returns the en-passant square verbatim from the FEN', () => {
    const game = createGameFromFen(
      'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
    );
    expect(enPassantTarget(game)).toBe('e3');
  });
});

describe('castlingRights', () => {
  it('parses partial castling rights correctly', () => {
    const game = createGameFromFen(
      'rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8',
    );
    expect(castlingRights(game)).toEqual({
      whiteKingside: true,
      whiteQueenside: true,
      blackKingside: false,
      blackQueenside: false,
    });
  });
});

// ---------------------------------------------------------------------------
// InvalidPositionError — malformed input
// ---------------------------------------------------------------------------

describe('createGameFromFen — malformed input', () => {
  it('throws InvalidPositionError for wrong number of fields (too few)', () => {
    expect(() =>
      createGameFromFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -'),
    ).toThrow(InvalidPositionError);
  });

  it('throws InvalidPositionError for wrong number of fields (too many)', () => {
    expect(() =>
      createGameFromFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1 extra'),
    ).toThrow(InvalidPositionError);
  });

  it('throws InvalidPositionError for wrong number of ranks', () => {
    expect(() =>
      createGameFromFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP w KQkq - 0 1'),
    ).toThrow(InvalidPositionError);
  });

  it('throws InvalidPositionError for rank that sums to fewer than 8 squares', () => {
    expect(() =>
      createGameFromFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPP/RNBQKBNR w KQkq - 0 1'),
    ).toThrow(InvalidPositionError);
  });

  it('throws InvalidPositionError for rank that sums to more than 8 squares', () => {
    expect(() =>
      createGameFromFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPPP/RNBQKBNR w KQkq - 0 1'),
    ).toThrow(InvalidPositionError);
  });

  it('throws InvalidPositionError for invalid piece letter', () => {
    expect(() =>
      createGameFromFen('xnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'),
    ).toThrow(InvalidPositionError);
  });

  it('throws InvalidPositionError for invalid side-to-move token', () => {
    expect(() =>
      createGameFromFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR x KQkq - 0 1'),
    ).toThrow(InvalidPositionError);
  });

  it('throws InvalidPositionError for invalid castling string', () => {
    expect(() =>
      createGameFromFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w XYZ - 0 1'),
    ).toThrow(InvalidPositionError);
  });

  it('throws InvalidPositionError for invalid en-passant square', () => {
    expect(() =>
      createGameFromFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq z9 0 1'),
    ).toThrow(InvalidPositionError);
  });

  it('throws InvalidPositionError for non-numeric halfmove clock', () => {
    expect(() =>
      createGameFromFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - x 1'),
    ).toThrow(InvalidPositionError);
  });

  it('throws InvalidPositionError for negative halfmove clock', () => {
    expect(() =>
      createGameFromFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - -1 1'),
    ).toThrow(InvalidPositionError);
  });

  it('throws InvalidPositionError for non-numeric fullmove number', () => {
    expect(() =>
      createGameFromFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 x'),
    ).toThrow(InvalidPositionError);
  });

  it('throws InvalidPositionError when white king is missing', () => {
    // Replace white king (e1) with a pawn
    expect(() =>
      createGameFromFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQPBNR w KQkq - 0 1'),
    ).toThrow(InvalidPositionError);
  });

  it('throws InvalidPositionError when black king is missing', () => {
    // Replace black king (e8) with a pawn
    expect(() =>
      createGameFromFen('rnbqpbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'),
    ).toThrow(InvalidPositionError);
  });

  it('does not return a partially-built game on error', () => {
    let result: unknown;
    try {
      result = createGameFromFen('bad fen');
    } catch (e) {
      expect(e).toBeInstanceOf(InvalidPositionError);
    }
    expect(result).toBeUndefined();
  });
});
