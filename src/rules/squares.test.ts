import { describe, expect, it } from 'vitest';
import { createGame, createGameFromFen, pieceAt, toFen } from './index';

// ---------------------------------------------------------------------------
// Absolute orientation — standard starting position landmarks.
// A mirrored or rank-inverted board would place pieces on the wrong squares.
// ---------------------------------------------------------------------------

describe('board orientation', () => {
  it('a1 is a white rook', () => {
    expect(pieceAt(createGame(), 'a1')).toEqual({ color: 'white', type: 'rook' });
  });
  it('e1 is the white king', () => {
    expect(pieceAt(createGame(), 'e1')).toEqual({ color: 'white', type: 'king' });
  });
  it('d1 is the white queen', () => {
    expect(pieceAt(createGame(), 'd1')).toEqual({ color: 'white', type: 'queen' });
  });
  it('e8 is the black king', () => {
    expect(pieceAt(createGame(), 'e8')).toEqual({ color: 'black', type: 'king' });
  });
  it('d8 is the black queen', () => {
    expect(pieceAt(createGame(), 'd8')).toEqual({ color: 'black', type: 'queen' });
  });
  it('h8 is a black rook', () => {
    expect(pieceAt(createGame(), 'h8')).toEqual({ color: 'black', type: 'rook' });
  });
});

// ---------------------------------------------------------------------------
// Coordinate bijection — every square round-trips through FEN.
//
// Strategy: place a white queen on the square under test (so it is
// distinguishable), plus the two kings on fixed out-of-the-way squares
// (a8 = black king, h1 = white king).  For those two king squares, we
// instead verify the piece is a king of the right colour.
// ---------------------------------------------------------------------------

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'] as const;

// Kings sit at fixed positions so neither conflicts with the probe piece.
// a8 = black king (rank 8, file a), h1 = white king (rank 1, file h).
const BLACK_KING_SQUARE = 'a8' as const;
const WHITE_KING_SQUARE = 'h1' as const;

// Build a minimal FEN with white queen on `sq`, kings at their fixed spots.
// '8' for every other rank keeps things simple; we spell out the two ranks
// that hold one of the three pieces.
function fenForSquare(file: string, rank: string): string {
  const sq = `${file}${rank}`;
  // We need: black king on a8, white king on h1, white queen on sq.
  // Build each rank as a piece-placement string.
  const rows: string[] = [];
  for (let r = 8; r >= 1; r--) {
    const cells: string[] = Array(8).fill('.');
    if (r === 8) cells[0] = 'k'; // black king on a8
    if (r === 1) cells[7] = 'K'; // white king on h1
    // Place probe queen only when it doesn't collide with a king.
    const isKingSquare = sq === BLACK_KING_SQUARE || sq === WHITE_KING_SQUARE;
    if (!isKingSquare && String(r) === rank) cells['abcdefgh'.indexOf(file)] = 'Q';
    // collapse to FEN rank notation
    let row = '';
    let empty = 0;
    for (const c of cells) {
      if (c === '.') {
        empty++;
      } else {
        if (empty) {
          row += empty;
          empty = 0;
        }
        row += c;
      }
    }
    if (empty) row += empty;
    rows.push(row);
  }
  return `${rows.join('/')} w - - 0 1`;
}

describe('coordinate bijection', () => {
  for (const file of FILES) {
    for (const rank of RANKS) {
      const sq = `${file}${rank}` as `${typeof file}${typeof rank}`;

      it(`square ${sq} round-trips through FEN`, () => {
        const fen = fenForSquare(file, rank);
        const game = createGameFromFen(fen);
        expect(toFen(game)).toBe(fen);
      });

      if (sq === BLACK_KING_SQUARE) {
        it(`${sq} is the black king (fixed king square)`, () => {
          const fen = fenForSquare(file, rank);
          expect(pieceAt(createGameFromFen(fen), sq)).toEqual({
            color: 'black',
            type: 'king',
          });
        });
      } else if (sq === WHITE_KING_SQUARE) {
        it(`${sq} is the white king (fixed king square)`, () => {
          const fen = fenForSquare(file, rank);
          expect(pieceAt(createGameFromFen(fen), sq)).toEqual({
            color: 'white',
            type: 'king',
          });
        });
      } else {
        it(`pieceAt finds the probe queen on ${sq}`, () => {
          const fen = fenForSquare(file, rank);
          expect(pieceAt(createGameFromFen(fen), sq)).toEqual({
            color: 'white',
            type: 'queen',
          });
        });
      }
    }
  }
});
