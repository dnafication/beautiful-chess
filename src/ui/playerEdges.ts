import type { PieceColor } from '../rules';

export type PlayerEdge = 'far' | 'near';
export type PlayerEdgeRotation = '0deg' | '180deg';
export type PlayerEdgeState = 'active' | 'waiting';

export interface ViewportSize {
  readonly width: number;
  readonly height: number;
}

export interface PlayerEdgesLayout {
  readonly boardSize: number;
  readonly playerEdgeThickness: number;
  readonly playerEdgeWidth: number;
  readonly tableHeight: number;
}

export interface PlayerEdgePresentation {
  readonly color: PieceColor;
  readonly rotation: PlayerEdgeRotation;
  readonly state: PlayerEdgeState;
  readonly opacity: number;
  readonly turnText: 'To move' | 'Waiting';
}

// The Player Edge carries the turn indicator, the check notice, the player's
// Tray of captured pieces and their Material Advantage reading, so the band
// reserves room for all of it. That room is fixed by the viewport and never by
// the Tray's contents: a full Tray and an empty one size the board identically,
// so captures never move the board (#15).
const MIN_PLAYER_EDGE_THICKNESS = 108;
const MAX_PLAYER_EDGE_THICKNESS = 128;
const PLAYER_EDGE_VIEWPORT_FRACTION = 0.16;
const WAITING_PLAYER_EDGE_OPACITY = 0.38;

export function playerEdgeForColor(color: PieceColor): PlayerEdge {
  return color === 'white' ? 'near' : 'far';
}

export function colorForPlayerEdge(playerEdge: PlayerEdge): PieceColor {
  return playerEdge === 'near' ? 'white' : 'black';
}

export function rotationForPlayerEdge(playerEdge: PlayerEdge): PlayerEdgeRotation {
  return playerEdge === 'near' ? '0deg' : '180deg';
}

export function nextTurnColor(activeColor: PieceColor): PieceColor {
  return activeColor === 'white' ? 'black' : 'white';
}

/**
 * The check notice shown on a Player Edge. Only the player to move can be in
 * check, so the notice appears on the active Player Edge and nowhere else.
 */
export function playerEdgeCheckText(
  state: PlayerEdgeState,
  inCheck: boolean,
): 'In check' | undefined {
  return state === 'active' && inCheck ? 'In check' : undefined;
}

export function playerEdgePresentation(
  playerEdge: PlayerEdge,
  activeColor: PieceColor,
): PlayerEdgePresentation {
  const color = colorForPlayerEdge(playerEdge);
  const active = color === activeColor;

  return {
    color,
    rotation: rotationForPlayerEdge(playerEdge),
    state: active ? 'active' : 'waiting',
    opacity: active ? 1 : WAITING_PLAYER_EDGE_OPACITY,
    turnText: active ? 'To move' : 'Waiting',
  };
}

export function calculatePlayerEdgesLayout(viewport: ViewportSize): PlayerEdgesLayout {
  const shorterSide = Math.min(viewport.width, viewport.height);
  const preferredPlayerEdgeThickness = Math.round(
    shorterSide * PLAYER_EDGE_VIEWPORT_FRACTION,
  );
  const playerEdgeThickness = Math.min(
    MAX_PLAYER_EDGE_THICKNESS,
    Math.max(MIN_PLAYER_EDGE_THICKNESS, preferredPlayerEdgeThickness),
  );
  const boardSize = Math.max(
    0,
    Math.min(viewport.width, viewport.height - playerEdgeThickness * 2),
  );

  return {
    boardSize,
    playerEdgeThickness,
    playerEdgeWidth: boardSize,
    tableHeight: boardSize + playerEdgeThickness * 2,
  };
}
