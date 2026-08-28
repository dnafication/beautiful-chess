import { describe, expect, it } from 'vitest';
import {
  applyMove,
  createGame,
  createGameFromFen,
  castlingRights,
  enPassantTarget,
  IllegalMoveError,
  isCheck,
  legalDestinations,
  legalMoves,
  pieceAt,
  sideToMove,
  toFen,
} from './index';

describe('legalMoves', () => {
  it('generates the 20 opening moves', () => {
    expect(legalMoves(createGame())).toHaveLength(20);
  });

  it('generates ordinary moves and captures for every piece type', () => {
    const game = createGameFromFen('4k3/8/2p5/3r4/3Q4/2P5/8/4K3 w - - 0 1');

    expect(legalDestinations(game, 'd4')).toEqual(
      expect.arrayContaining(['d5', 'c5', 'c4', 'd3', 'e3', 'e4', 'e5']),
    );
    expect(legalDestinations(game, 'c3')).toEqual(['c4']);

    const knight = createGameFromFen('4k3/8/8/8/3N4/8/8/4K3 w - - 0 1');
    expect(legalDestinations(knight, 'd4')).toEqual(
      expect.arrayContaining(['b3', 'b5', 'c2', 'c6', 'e2', 'e6', 'f3', 'f5']),
    );

    const bishop = createGameFromFen('4k3/8/8/8/3B4/8/8/4K3 w - - 0 1');
    expect(legalDestinations(bishop, 'd4')).toEqual(
      expect.arrayContaining(['a1', 'a7', 'g1', 'g7']),
    );

    const rook = createGameFromFen('4k3/8/8/8/3R4/8/8/4K3 w - - 0 1');
    expect(legalDestinations(rook, 'd4')).toEqual(
      expect.arrayContaining(['d1', 'd8', 'a4', 'h4']),
    );

    const king = createGameFromFen('8/8/8/8/8/8/3k4/4K3 w - - 0 1');
    expect(legalDestinations(king, 'e1')).toEqual(['f1', 'f2']);
  });

  it('filters pinned pieces and king destinations that are attacked', () => {
    const filePin = createGameFromFen('4r1k1/8/8/8/8/8/4R3/4K3 w - - 0 1');
    expect(legalDestinations(filePin, 'e2')).toEqual(
      expect.arrayContaining(['e3', 'e4', 'e5', 'e6', 'e7', 'e8']),
    );
    expect(legalDestinations(filePin, 'e2')).not.toContain('d2');

    const rankPin = createGameFromFen('6k1/8/8/8/8/8/4KR1r/8 w - - 0 1');
    expect(legalDestinations(rankPin, 'f2')).not.toContain('f3');

    const diagonalPin = createGameFromFen('6k1/8/8/8/7b/6B1/5K2/8 w - - 0 1');
    expect(legalDestinations(diagonalPin, 'g3')).not.toContain('f4');

    const king = createGameFromFen('4k3/8/8/8/8/8/3r4/4K3 w - - 0 1');
    expect(legalDestinations(king, 'e1')).not.toContain('d1');
  });

  it('reports check for the side to move', () => {
    expect(isCheck(createGameFromFen('4r1k1/8/8/8/8/8/8/4K3 w - - 0 1'))).toBe(true);
    expect(isCheck(createGame())).toBe(false);
  });
});

describe('applyMove', () => {
  it('returns a new game and updates state without mutating the original', () => {
    const game = createGame();
    const next = applyMove(game, { from: 'e2', to: 'e4' });

    expect(pieceAt(game, 'e2')).toEqual({ color: 'white', type: 'pawn' });
    expect(pieceAt(next, 'e4')).toEqual({ color: 'white', type: 'pawn' });
    expect(sideToMove(next)).toBe('black');
    expect(enPassantTarget(next)).toBe('e3');
    expect(toFen(next)).toBe(
      'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
    );
  });

  it('rejects moves that are not legal', () => {
    expect(() => applyMove(createGame(), { from: 'e2', to: 'e5' })).toThrow(
      IllegalMoveError,
    );
    expect(() => applyMove(createGame(), { from: 'a7', to: 'a6' })).toThrow(
      IllegalMoveError,
    );
  });

  it('removes castling rights after a king or rook moves', () => {
    const game = createGameFromFen('4k3/8/8/8/8/8/8/R3K2R w KQ - 0 1');

    expect(castlingRights(applyMove(game, { from: 'h1', to: 'h2' }))).toEqual({
      whiteKingside: false,
      whiteQueenside: true,
      blackKingside: false,
      blackQueenside: false,
    });
    expect(castlingRights(applyMove(game, { from: 'e1', to: 'e2' }))).toEqual({
      whiteKingside: false,
      whiteQueenside: false,
      blackKingside: false,
      blackQueenside: false,
    });
  });
});
