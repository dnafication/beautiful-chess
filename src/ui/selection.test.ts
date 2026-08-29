import { describe, expect, it } from 'vitest';
import { createGame, createGameFromFen } from '../rules';
import { checkedKingSquare, moveRelocations, selectionFor, tapSquare } from './selection';

describe('picking up a piece', () => {
  it('selects a piece of the side to move and reports its legal destinations', () => {
    const game = createGame();
    const selection = selectionFor(game, 'e2');

    expect(selection).toEqual({
      from: 'e2',
      destinations: [
        { square: 'e3', isCapture: false },
        { square: 'e4', isCapture: false },
      ],
    });
  });

  it('will not pick up an empty square', () => {
    const game = createGame();
    expect(selectionFor(game, 'e4')).toBeUndefined();
  });

  it("will not pick up the opponent's piece", () => {
    const game = createGame();
    expect(selectionFor(game, 'e7')).toBeUndefined();
  });

  it('distinguishes capturing destinations from empty ones', () => {
    const game = createGameFromFen(
      'rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 2',
    );
    const selection = selectionFor(game, 'e4');

    expect(selection?.destinations).toEqual([
      { square: 'e5', isCapture: false },
      { square: 'd5', isCapture: true },
    ]);
  });

  it('marks an en passant destination as a capture even though its square is empty', () => {
    const game = createGameFromFen('4k3/8/8/4Pp2/8/8/8/4K3 w - f6 0 1');
    const selection = selectionFor(game, 'e5');

    expect(selection?.destinations).toContainEqual({ square: 'f6', isCapture: true });
  });
});

describe('tapping with nothing selected', () => {
  it('picks up a piece of the side to move', () => {
    const game = createGame();
    expect(tapSquare(game, undefined, 'e2')).toEqual({
      kind: 'select',
      selection: selectionFor(game, 'e2'),
    });
  });

  it('does nothing when tapping an empty square', () => {
    const game = createGame();
    expect(tapSquare(game, undefined, 'e4')).toEqual({ kind: 'none' });
  });

  it("does nothing when tapping the opponent's piece", () => {
    const game = createGame();
    expect(tapSquare(game, undefined, 'e7')).toEqual({ kind: 'none' });
  });
});

describe('tapping with a piece selected', () => {
  it('plays the move when tapping a legal destination', () => {
    const game = createGame();
    const selection = selectionFor(game, 'e2');
    expect(tapSquare(game, selection, 'e4')).toEqual({
      kind: 'move',
      move: { from: 'e2', to: 'e4' },
    });
  });

  it('deselects when tapping the picked-up piece again', () => {
    const game = createGame();
    const selection = selectionFor(game, 'e2');
    expect(tapSquare(game, selection, 'e2')).toEqual({ kind: 'clear' });
  });

  it("switches selection directly when tapping another of the player's pieces", () => {
    const game = createGame();
    const selection = selectionFor(game, 'e2');
    expect(tapSquare(game, selection, 'd2')).toEqual({
      kind: 'select',
      selection: selectionFor(game, 'd2'),
    });
  });

  it('does nothing when tapping an illegal destination, keeping the selection', () => {
    const game = createGame();
    const selection = selectionFor(game, 'e2');
    expect(tapSquare(game, selection, 'e5')).toEqual({ kind: 'none' });
  });

  it("does nothing when tapping the opponent's non-capturable piece", () => {
    const game = createGame();
    const selection = selectionFor(game, 'e2');
    expect(tapSquare(game, selection, 'e7')).toEqual({ kind: 'none' });
  });

  it('defaults promotion to a queen until the promotion picker exists', () => {
    const game = createGameFromFen('4k3/P7/8/8/8/8/8/4K3 w - - 0 1');
    const selection = selectionFor(game, 'a7');
    expect(tapSquare(game, selection, 'a8')).toEqual({
      kind: 'move',
      move: { from: 'a7', to: 'a8', promotion: 'queen' },
    });
  });
});

describe('the checked king square', () => {
  it('reports nothing when the side to move is not in check', () => {
    expect(checkedKingSquare(createGame())).toBeUndefined();
  });

  it('reports the square of the checked king', () => {
    const game = createGameFromFen('4k3/8/8/8/8/8/8/r3K3 w - - 0 1');
    expect(checkedKingSquare(game)).toBe('e1');
  });
});

describe('the pieces relocated by a move', () => {
  it('reports the single relocation of an ordinary move', () => {
    const game = createGame();
    expect(moveRelocations(game, { from: 'e2', to: 'e4' })).toEqual([
      { from: 'e2', to: 'e4' },
    ]);
  });

  it('reports both king and rook when castling', () => {
    const game = createGameFromFen('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
    const relocations = moveRelocations(game, { from: 'e1', to: 'g1' });
    expect(relocations).toContainEqual({ from: 'e1', to: 'g1' });
    expect(relocations).toContainEqual({ from: 'h1', to: 'f1' });
    expect(relocations).toHaveLength(2);
  });

  it('reports the mover only for an en passant capture', () => {
    const game = createGameFromFen('4k3/8/8/4Pp2/8/8/8/4K3 w - f6 0 1');
    expect(moveRelocations(game, { from: 'e5', to: 'f6' })).toEqual([
      { from: 'e5', to: 'f6' },
    ]);
  });

  // A capture of a like piece — pawn takes pawn, rook takes rook — leaves the
  // same kind of piece standing on the target square. Only the colour changed,
  // so a diff blind to colour sees nothing move and the board renders a capture
  // as if nothing happened. These are the most ordinary captures in chess.
  it('reports the mover when a piece captures one of its own kind', () => {
    const game = createGameFromFen('4k3/8/8/3p4/4P3/8/8/4K3 b - - 0 1');
    expect(moveRelocations(game, { from: 'd5', to: 'e4' })).toEqual([
      { from: 'd5', to: 'e4' },
    ]);
  });

  it('reports the promoting pawn as a relocation to the far square', () => {
    const game = createGameFromFen('4k3/P7/8/8/8/8/8/4K3 w - - 0 1');
    expect(moveRelocations(game, { from: 'a7', to: 'a8', promotion: 'queen' })).toEqual([
      { from: 'a7', to: 'a8' },
    ]);
  });
});

// A finished game is over even when pieces could still, in isolation, move.
// King and bishop against king is a draw by insufficient material, and the
// bishop has seven legal moves in it — but `applyMove` refuses every one of
// them. Offering a destination the rules module will then reject is how a tap
// turns into a crash, so nothing is offered at all.
describe('a finished game', () => {
  const drawn = createGameFromFen('4k3/8/8/8/8/8/8/2B1K3 w - - 0 1');

  it('lets no piece be picked up', () => {
    expect(selectionFor(drawn, 'c1')).toBeUndefined();
  });

  it('resolves any tap to nothing', () => {
    expect(tapSquare(drawn, undefined, 'c1')).toEqual({ kind: 'none' });
  });

  it('puts down a selection made before the game ended', () => {
    const selection = { from: 'c1' as const, destinations: [] };
    expect(tapSquare(drawn, selection, 'b2')).toEqual({ kind: 'clear' });
  });
});
