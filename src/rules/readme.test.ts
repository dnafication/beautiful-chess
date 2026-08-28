import { describe, expect, it } from 'vitest';
import {
  createGame,
  createGameFromFen,
  InvalidPositionError,
  pieceAt,
  sideToMove,
  toFen,
} from './index';

describe('README examples stay true', () => {
  it('quick start block is accurate', () => {
    const game = createGame();
    expect(sideToMove(game)).toBe('white');
    expect(pieceAt(game, 'e1')).toEqual({ color: 'white', type: 'king' });
    expect(pieceAt(game, 'e4')).toBeUndefined();
    expect(toFen(game)).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');

    const endgame = createGameFromFen('8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1');
    expect(pieceAt(endgame, 'a5')).toEqual({ color: 'white', type: 'king' });
  });

  it('four-field FEN really is rejected, as the README claims', () => {
    expect(() =>
      createGameFromFen(
        'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq -',
      ),
    ).toThrow(InvalidPositionError);
  });

  it('every rejection the README lists actually throws', () => {
    const bad = [
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -', // field count
      'rnbqkbnr/pppppppp/8/8/8/8/RNBQKBNR w KQkq - 0 1', // rank count
      'rnbqkbnr/ppppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', // rank sum
      'rnbqkbnr/pppppppx/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', // piece letter
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR x KQkq - 0 1', // side to move
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w XY - 0 1', // castling
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq j9 0 1', // ep square
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - -1 1', // negative clock
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQ1BNR w KQkq - 0 1', // no white king
    ];
    for (const fen of bad) {
      expect(() => createGameFromFen(fen), fen).toThrow(InvalidPositionError);
    }
  });

  it('opacity and Square typing claims hold', () => {
    const game = createGame();
    // @ts-expect-error - README: "game.board does not compile"
    game.board;
    // @ts-expect-error - README: "pieceAt(game, 'j9') does not compile"
    pieceAt(game, 'j9');
  });
});
