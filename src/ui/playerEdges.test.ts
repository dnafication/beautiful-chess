import { describe, expect, it } from 'vitest';
import {
  calculatePlayerEdgesLayout,
  colorForPlayerEdge,
  nextTurnColor,
  playerEdgeCheckText,
  playerEdgeForColor,
  playerEdgePresentation,
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
      playerEdgeThickness: 72,
      playerEdgeWidth: 390,
      tableHeight: 534,
    });
  });

  it('reserves fixed Player Edge space before sizing the board on shorter viewports', () => {
    expect(calculatePlayerEdgesLayout({ width: 844, height: 390 })).toEqual({
      boardSize: 246,
      playerEdgeThickness: 72,
      playerEdgeWidth: 246,
      tableHeight: 390,
    });
  });

  it('caps large Player Edges so tablet layouts still prioritize the board', () => {
    expect(calculatePlayerEdgesLayout({ width: 1024, height: 1366 })).toEqual({
      boardSize: 1024,
      playerEdgeThickness: 128,
      playerEdgeWidth: 1024,
      tableHeight: 1280,
    });
  });

  it('never returns a negative board size', () => {
    expect(calculatePlayerEdgesLayout({ width: 100, height: 100 })).toEqual({
      boardSize: 0,
      playerEdgeThickness: 72,
      playerEdgeWidth: 0,
      tableHeight: 144,
    });
  });
});
