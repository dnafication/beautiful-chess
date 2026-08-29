import { describe, expect, it } from 'vitest';
import {
  applyMove,
  capturedPieces,
  createGame,
  createGameFromFen,
  gameStatus,
  IllegalMoveError,
  InvalidPositionError,
  legalDestinations,
  legalMoves,
  materialAdvantage,
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

  it('castling block is accurate', () => {
    const game = createGameFromFen('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');

    expect(legalDestinations(game, 'e1')).toContain('g1');
    expect(legalDestinations(game, 'e1')).toContain('c1');
    expect(legalDestinations(game, 'e1')).not.toContain('h1');

    const after = applyMove(game, { from: 'e1', to: 'g1' });
    expect(pieceAt(after, 'g1')).toEqual({ color: 'white', type: 'king' });
    expect(pieceAt(after, 'f1')).toEqual({ color: 'white', type: 'rook' });
    expect(pieceAt(after, 'h1')).toBeUndefined();
  });

  it('promotion block is accurate', () => {
    const game = createGameFromFen('4k3/P7/8/8/8/8/8/4K3 w - - 0 1');

    expect(
      legalMoves(game).filter((move) => move.from === 'a7' && move.to === 'a8'),
    ).toEqual([
      { from: 'a7', to: 'a8', promotion: 'queen' },
      { from: 'a7', to: 'a8', promotion: 'rook' },
      { from: 'a7', to: 'a8', promotion: 'bishop' },
      { from: 'a7', to: 'a8', promotion: 'knight' },
    ]);

    const after = applyMove(game, { from: 'a7', to: 'a8', promotion: 'knight' });
    expect(pieceAt(after, 'a8')).toEqual({ color: 'white', type: 'knight' });
    expect(legalDestinations(game, 'a7')).toEqual(['a8']);
  });

  it('game status block is accurate', () => {
    const mated = createGameFromFen(
      'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3',
    );
    expect(gameStatus(mated)).toEqual({ kind: 'checkmate', winner: 'black' });

    // A finished game accepts no move, even one that is otherwise playable.
    const drawn = createGameFromFen('8/8/4k3/8/8/4K3/8/6N1 w - - 0 1');
    expect(gameStatus(drawn).kind).toBe('draw');
    expect(() => applyMove(drawn, { from: 'g1', to: 'f3' })).toThrow(IllegalMoveError);
  });

  it('opacity and Square typing claims hold', () => {
    const game = createGame();
    // @ts-expect-error - README: "game.board does not compile"
    game.board;
    // @ts-expect-error - README: "pieceAt(game, 'j9') does not compile"
    pieceAt(game, 'j9');
  });

  it('Material Advantage block is accurate', () => {
    expect(materialAdvantage(createGame())).toBe(0);

    const promoted = createGameFromFen(
      'rnbqkbnr/pppppppp/8/8/Q7/8/1PPPPPPP/RNBQKBNR b KQkq - 0 1',
    );
    expect(materialAdvantage(promoted)).toBe(8);
    expect(capturedPieces(promoted)).toEqual({ byWhite: [], byBlack: [] });

    const game = createGameFromFen(
      'rnbqkbnr/1ppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    );
    expect(capturedPieces(game)).toEqual({
      byWhite: [{ color: 'black', type: 'pawn' }],
      byBlack: [],
    });
  });
});
