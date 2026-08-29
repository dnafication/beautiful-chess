import { describe, expect, it } from 'vitest';
import { createGame, createGameFromFen } from '../rules';
import {
  capturedForColor,
  materialAdvantageText,
  materialReadingForColor,
  trayPresentation,
} from './tray';

describe('Tray contents', () => {
  it("shows a player their own captured pieces and no one else's", () => {
    // White has captured a single Black pawn; Black has captured nothing.
    const game = createGameFromFen(
      'rnbqkbnr/1ppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    );

    expect(capturedForColor(game, 'white')).toEqual([{ color: 'black', type: 'pawn' }]);
    expect(capturedForColor(game, 'black')).toEqual([]);
  });

  it('holds nothing for either player in the starting position', () => {
    const game = createGame();

    expect(capturedForColor(game, 'white')).toEqual([]);
    expect(capturedForColor(game, 'black')).toEqual([]);
  });
});

describe('Material Advantage reading', () => {
  it('reads each player their own side of the signed board count', () => {
    // White is a full pawn ahead: the rules module reads +1 (positive favours
    // White). Each Player Edge shows its own player's reading, so Black's is the
    // negation.
    const game = createGameFromFen(
      'rnbqkbnr/1ppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    );

    expect(materialReadingForColor(game, 'white')).toBe(1);
    expect(materialReadingForColor(game, 'black')).toBe(-1);
  });

  it('reads level material as zero for both players', () => {
    const game = createGame();

    expect(materialReadingForColor(game, 'white')).toBe(0);
    expect(materialReadingForColor(game, 'black')).toBe(0);
  });
});

describe('Material Advantage text', () => {
  it('shows the count only for the leading player', () => {
    // A leading player reads a positive count and sees it; the trailing player
    // reads a negative count and sees nothing, so the number appears once.
    expect(materialAdvantageText(3)).toBe('3');
    expect(materialAdvantageText(-3)).toBeUndefined();
  });

  it('shows nothing on level material, as absence rather than a zero', () => {
    expect(materialAdvantageText(0)).toBeUndefined();
  });
});

describe('Tray presentation for a Player Edge', () => {
  it('faces the near Player Edge to White, with its captures and reading', () => {
    // White has captured a Black pawn and leads by one point.
    const game = createGameFromFen(
      'rnbqkbnr/1ppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    );

    expect(trayPresentation(game, 'near')).toEqual({
      color: 'white',
      rotation: '0deg',
      captured: [{ color: 'black', type: 'pawn' }],
      materialAdvantageText: '1',
    });
  });

  it('faces the far Player Edge to Black, rotated, and hides the trailing reading', () => {
    const game = createGameFromFen(
      'rnbqkbnr/1ppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    );

    expect(trayPresentation(game, 'far')).toEqual({
      color: 'black',
      rotation: '180deg',
      captured: [],
      materialAdvantageText: undefined,
    });
  });

  it('reflects a promotion made with no captures, both Trays staying empty', () => {
    // A queen made by promotion with no captures at all: the board-derived
    // reading is +8, yet neither side has captured anything. A Tray-derived
    // count would read level and be wrong.
    const promoted = createGameFromFen(
      'rnbqkbnr/pppppppp/8/8/Q7/8/1PPPPPPP/RNBQKBNR b KQkq - 0 1',
    );

    expect(trayPresentation(promoted, 'near')).toEqual({
      color: 'white',
      rotation: '0deg',
      captured: [],
      materialAdvantageText: '8',
    });
    expect(trayPresentation(promoted, 'far')).toEqual({
      color: 'black',
      rotation: '180deg',
      captured: [],
      materialAdvantageText: undefined,
    });
  });

  it('shows no reading on either Player Edge when material is level', () => {
    const game = createGame();

    expect(trayPresentation(game, 'near').materialAdvantageText).toBeUndefined();
    expect(trayPresentation(game, 'far').materialAdvantageText).toBeUndefined();
  });
});
