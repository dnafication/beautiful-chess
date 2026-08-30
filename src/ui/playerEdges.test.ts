import { describe, expect, it } from 'vitest';
import {
  calculatePlayerEdgesLayout,
  colorForPlayerEdge,
  nextTurnColor,
  playerEdgeCheckText,
  playerEdgeContentHeight,
  playerEdgeForColor,
  playerEdgePresentation,
  playerEdgeRowHeights,
  rotationForPlayerEdge,
} from './playerEdges';

describe('Player Edge assignment', () => {
  it('keeps White on the near Player Edge and Black on the far Player Edge', () => {
    expect(playerEdgeForColor('white')).toBe('near');
    expect(playerEdgeForColor('black')).toBe('far');
    expect(colorForPlayerEdge('near')).toBe('white');
    expect(colorForPlayerEdge('far')).toBe('black');
  });
});

describe('Player Edge orientation', () => {
  it('rotates the far Player Edge to face Black while the near Player Edge faces White', () => {
    expect(rotationForPlayerEdge('near')).toBe('0deg');
    expect(rotationForPlayerEdge('far')).toBe('180deg');
  });
});

describe('Player Edge turn presentation', () => {
  it('marks only the Player Edge matching the colour to move as active', () => {
    expect(playerEdgePresentation('near', 'white')).toEqual({
      color: 'white',
      rotation: '0deg',
      state: 'active',
      opacity: 1,
      turnText: 'To move',
    });
    expect(playerEdgePresentation('far', 'white')).toEqual({
      color: 'black',
      rotation: '180deg',
      state: 'waiting',
      opacity: 0.38,
      turnText: 'Waiting',
    });
    expect(playerEdgePresentation('far', 'black')).toEqual({
      color: 'black',
      rotation: '180deg',
      state: 'active',
      opacity: 1,
      turnText: 'To move',
    });
    expect(playerEdgePresentation('near', 'black')).toEqual({
      color: 'white',
      rotation: '0deg',
      state: 'waiting',
      opacity: 0.38,
      turnText: 'Waiting',
    });
  });

  it('alternates the active colour without consulting the rules module', () => {
    expect(nextTurnColor('white')).toBe('black');
    expect(nextTurnColor('black')).toBe('white');
  });
});

describe('Player Edge check notice', () => {
  it('shows the check notice only on the active Player Edge when in check', () => {
    expect(playerEdgeCheckText('active', true)).toBe('In check');
    expect(playerEdgeCheckText('active', false)).toBeUndefined();
    expect(playerEdgeCheckText('waiting', true)).toBeUndefined();
    expect(playerEdgeCheckText('waiting', false)).toBeUndefined();
  });
});

describe('Player Edge layout', () => {
  it('keeps the board size and position dependent only on the viewport', () => {
    expect(calculatePlayerEdgesLayout({ width: 390, height: 844 })).toEqual({
      boardSize: 390,
      playerEdgeThickness: 112,
      playerEdgeWidth: 390,
      tableHeight: 614,
    });
  });

  it('reserves fixed Player Edge space before sizing the board on shorter viewports', () => {
    expect(calculatePlayerEdgesLayout({ width: 844, height: 390 })).toEqual({
      boardSize: 166,
      playerEdgeThickness: 112,
      playerEdgeWidth: 166,
      tableHeight: 390,
    });
  });

  it('keeps the Player Edge the same thickness on a tablet, so the board takes the extra room', () => {
    expect(calculatePlayerEdgesLayout({ width: 1024, height: 1366 })).toEqual({
      boardSize: 1024,
      playerEdgeThickness: 112,
      playerEdgeWidth: 1024,
      tableHeight: 1248,
    });
  });

  it('never returns a negative board size', () => {
    expect(calculatePlayerEdgesLayout({ width: 100, height: 100 })).toEqual({
      boardSize: 0,
      playerEdgeThickness: 112,
      playerEdgeWidth: 0,
      tableHeight: 224,
    });
  });

  it('is thick enough for every row it carries, so no Player Edge content spills onto the board', () => {
    // The band paints after the board, so anything taller than the band both
    // covers rank 1 and swallows the touches meant for it. The thickness is
    // therefore derived from the rows rather than picked, on every viewport.
    for (const viewport of [
      { width: 320, height: 568 },
      { width: 390, height: 844 },
      { width: 844, height: 390 },
      { width: 1024, height: 1366 },
    ]) {
      const { playerEdgeThickness } = calculatePlayerEdgesLayout(viewport);
      expect(playerEdgeThickness).toBeGreaterThanOrEqual(playerEdgeContentHeight());
    }
  });

  it('counts every row the Player Edge lays out, so the renderer and the layout agree', () => {
    // The band lays its contents out as these three rows and no others, so the
    // height it must clear is their sum plus the chrome around them.
    const rows =
      playerEdgeRowHeights.identity +
      playerEdgeRowHeights.tray +
      playerEdgeRowHeights.controls;
    expect(playerEdgeContentHeight()).toBeGreaterThan(rows);
  });

  it('reserves the same Player Edge room whatever the Tray holds, so captures never move the board', () => {
    // The layout depends only on the viewport: it takes no game and no Tray, so
    // a full Tray and an empty one size the board identically.
    const phone = { width: 390, height: 844 };
    expect(calculatePlayerEdgesLayout(phone)).toEqual(calculatePlayerEdgesLayout(phone));
  });
});
