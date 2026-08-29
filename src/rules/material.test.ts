import { describe, expect, it } from 'vitest';
import {
  applyMove,
  capturedPieces,
  createGame,
  createGameFromFen,
  materialAdvantage,
} from './index';

// ---------------------------------------------------------------------------
// Material Advantage — the signed difference in piece value, derived from the
// pieces standing on the board (never from the Tray). Positive favours White,
// negative favours Black, zero is level material.
// ---------------------------------------------------------------------------

describe('materialAdvantage', () => {
  it('is zero at the starting position (level material)', () => {
    expect(materialAdvantage(createGame())).toBe(0);
  });

  it('is positive when White has more material', () => {
    // White is a full rook up: Black is missing its a8 rook.
    const game = createGameFromFen(
      '1nbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQk - 0 1',
    );
    expect(materialAdvantage(game)).toBe(5);
  });

  it('is negative when Black has more material', () => {
    // Black is a knight up: White is missing its b1 knight.
    const game = createGameFromFen(
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/R1BQKBNR w KQkq - 0 1',
    );
    expect(materialAdvantage(game)).toBe(-3);
  });

  // The forcing case for the whole ticket: a queen made by promotion, with no
  // captures at all. Board-derived reads +8 (a queen worth 9 replaced a pawn
  // worth 1); a Tray-derived count would read "even" because nothing was
  // captured. Only the board-derived answer is the truth.
  it('reflects a promotion made without any captures', () => {
    // White has promoted a pawn to a second queen (on a4): 7 pawns + 2 queens.
    // Black has its full starting complement. Nothing has been captured.
    const promoted = createGameFromFen(
      'rnbqkbnr/pppppppp/8/8/Q7/8/1PPPPPPP/RNBQKBNR b KQkq - 0 1',
    );
    expect(materialAdvantage(promoted)).toBe(8);
  });
});

// ---------------------------------------------------------------------------
// Captured pieces — derived by comparing the board against the full starting
// complement, so a promotion never invents a phantom captured pawn. `byWhite`
// holds the Black pieces White has captured, `byBlack` the White pieces Black
// has captured. Each list is grouped by type in a fixed order, so the Tray
// (#15) has nothing to decide.
// ---------------------------------------------------------------------------

describe('capturedPieces', () => {
  it('reports nothing captured at the starting position', () => {
    expect(capturedPieces(createGame())).toEqual({ byWhite: [], byBlack: [] });
  });

  it('lists a Black pawn once White has captured it', () => {
    // Black is missing its a7 pawn; White has captured one Black pawn.
    const game = createGameFromFen(
      'rnbqkbnr/1ppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    );
    expect(capturedPieces(game)).toEqual({
      byWhite: [{ color: 'black', type: 'pawn' }],
      byBlack: [],
    });
  });

  it('lists a White piece once Black has captured it', () => {
    // White is missing its d1 queen; Black has captured it.
    const game = createGameFromFen(
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNB1KBNR w KQkq - 0 1',
    );
    expect(capturedPieces(game)).toEqual({
      byWhite: [],
      byBlack: [{ color: 'white', type: 'queen' }],
    });
  });

  // The subtle bug this ticket warns about: a promotion leaves the promoting
  // side one pawn short on the board, but that pawn was NOT captured. A naive
  // count of missing pawns would report a phantom captured pawn. It must not.
  it('does not invent a captured pawn for a promotion made without captures', () => {
    const promoted = createGameFromFen(
      'rnbqkbnr/pppppppp/8/8/Q7/8/1PPPPPPP/RNBQKBNR b KQkq - 0 1',
    );
    expect(capturedPieces(promoted)).toEqual({ byWhite: [], byBlack: [] });
  });

  it('groups captured pieces by type in a fixed, deterministic order', () => {
    // Black is missing a queen, a rook, a bishop, a knight and two pawns.
    // Regardless of where they went, the list is ordered pawn, knight,
    // bishop, rook, queen.
    const game = createGameFromFen(
      'rnb1k3/pppppp2/8/8/8/8/PPPPPPPP/RNBQKBNR w KQq - 0 1',
    );
    expect(capturedPieces(game).byWhite).toEqual([
      { color: 'black', type: 'pawn' },
      { color: 'black', type: 'pawn' },
      { color: 'black', type: 'knight' },
      { color: 'black', type: 'bishop' },
      { color: 'black', type: 'rook' },
      { color: 'black', type: 'queen' },
    ]);
  });

  // The limit of board-derivation, pinned rather than papered over. White here
  // has two queens and six pawns. That is equally the story of one promotion
  // with a pawn captured, and of two promotions with the original queen
  // captured. Nothing on the board separates them, so this reads the board as
  // the fewest promotions that explain it and reports the captured pawn. Move
  // history (#10) is what would decide it.
  it('reads an ambiguous board as the fewest promotions that explain it', () => {
    const game = createGameFromFen('4k3/8/8/8/8/8/PPPPPP2/3QQK2 w - - 0 1');

    expect(capturedPieces(game).byBlack).toContainEqual({
      color: 'white',
      type: 'pawn',
    });
    expect(capturedPieces(game).byBlack).not.toContainEqual({
      color: 'white',
      type: 'queen',
    });
  });
});

// Applying a real promoting move (no capture) reflects the promotion in the
// board-derived advantage: the pawn worth 1 becomes a queen worth 9, a gain of
// 8. The no-phantom-captured-pawn guarantee is covered above against a full
// starting complement; this sparse endgame only exercises the advantage.
describe('materialAdvantage after a real promotion', () => {
  it('adds the promotion gain of eight', () => {
    const before = createGameFromFen('4k3/P7/8/8/8/8/8/4K3 w - - 0 1');
    expect(materialAdvantage(before)).toBe(1);

    const after = applyMove(before, { from: 'a7', to: 'a8', promotion: 'queen' });
    expect(materialAdvantage(after)).toBe(9);
  });
});
