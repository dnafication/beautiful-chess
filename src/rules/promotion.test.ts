import { describe, expect, it } from 'vitest';
import {
  applyMove,
  createGameFromFen,
  IllegalMoveError,
  isCheck,
  legalDestinations,
  legalMoves,
  pieceAt,
} from './index';
import { perftDivide } from './perft';

describe('promotion generation', () => {
  it('generates one legal move for each promotion piece on a quiet move', () => {
    const game = createGameFromFen('4k3/P7/8/8/8/8/8/4K3 w - - 0 1');
    const promotions = legalMoves(game).filter(
      (move) => move.from === 'a7' && move.to === 'a8',
    );

    expect(promotions).toHaveLength(4);
    expect(promotions.map((move) => move.promotion).sort()).toEqual([
      'bishop',
      'knight',
      'queen',
      'rook',
    ]);
  });

  it('generates one legal move for each promotion piece on a capture', () => {
    const game = createGameFromFen('3rk3/4P3/8/8/8/8/8/4K3 w - - 0 1');
    const promotions = legalMoves(game).filter(
      (move) => move.from === 'e7' && move.to === 'd8',
    );

    expect(promotions).toHaveLength(4);
    expect(promotions.map((move) => move.promotion).sort()).toEqual([
      'bishop',
      'knight',
      'queen',
      'rook',
    ]);
  });

  it('reports a promoting pawn destination once', () => {
    const game = createGameFromFen('4k3/P7/8/8/8/8/8/4K3 w - - 0 1');

    expect(legalDestinations(game, 'a7')).toEqual(['a8']);
  });

  it('keeps each promotion choice distinct in perft divide', () => {
    const game = createGameFromFen('4k3/P7/8/8/8/8/8/4K3 w - - 0 1');
    const divide = perftDivide(game, 1);

    expect(divide.get('a7a8q')).toBe(1);
    expect(divide.get('a7a8r')).toBe(1);
    expect(divide.get('a7a8b')).toBe(1);
    expect(divide.get('a7a8n')).toBe(1);
  });
});

describe('promotion application', () => {
  it('requires the player to choose a promotion piece', () => {
    const game = createGameFromFen('4k3/P7/8/8/8/8/8/4K3 w - - 0 1');

    expect(() => applyMove(game, { from: 'a7', to: 'a8' })).toThrow(IllegalMoveError);
  });

  it('rejects a promotion piece on a non-promoting move', () => {
    const game = createGameFromFen('4k3/8/8/8/8/8/4K3/8 w - - 0 1');

    expect(() => applyMove(game, { from: 'e2', to: 'e3', promotion: 'queen' })).toThrow(
      IllegalMoveError,
    );
  });

  it('makes a knight promotion give knight check rather than queen check', () => {
    const game = createGameFromFen('8/4k1P1/8/8/8/8/8/K7 w - - 0 1');

    expect(isCheck(applyMove(game, { from: 'g7', to: 'g8', promotion: 'knight' }))).toBe(
      true,
    );
    expect(isCheck(applyMove(game, { from: 'g7', to: 'g8', promotion: 'queen' }))).toBe(
      false,
    );
  });

  it('lets a promoted bishop capture as a bishop on a later turn', () => {
    let game = createGameFromFen('7k/1P6/8/8/8/6n1/8/K7 w - - 0 1');
    game = applyMove(game, { from: 'b7', to: 'b8', promotion: 'bishop' });
    game = applyMove(game, { from: 'h8', to: 'h7' });

    expect(legalMoves(game)).toContainEqual({ from: 'b8', to: 'g3' });

    const after = applyMove(game, { from: 'b8', to: 'g3' });
    expect(pieceAt(after, 'g3')).toEqual({ color: 'white', type: 'bishop' });
    expect(pieceAt(after, 'b8')).toBeUndefined();
  });
});
