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
// Tray of captured pieces, their Material Advantage reading and the controls
// they can reach without turning the device. It lays those out as three fixed
// rows, and the band is exactly thick enough to hold them.
//
// The thickness is derived from those rows rather than picked from the
// viewport, because the band paints after the board: content taller than the
// band both covers rank 1 and swallows the touches meant for it. Deriving it
// keeps that impossible.
//
// The room is fixed by the rows and never by the Tray's contents: a full Tray
// and an empty one size the board identically, so captures never move the
// board (#15).

/** The height each of the Player Edge's rows is laid out at. */
export const playerEdgeRowHeights = {
  /** Colour name, turn indicator and check notice. */
  identity: 30,
  /** Material Advantage reading and the Tray of captured pieces. */
  tray: 26,
  /** The Undo control, alone on its own row. */
  undo: 32,
  /** The table's actions: draw, resign and new game (or their responses). */
  actions: 36,
} as const;

const PLAYER_EDGE_ROW_GAP = 6;
const WAITING_PLAYER_EDGE_OPACITY = 0.38;

/**
 * The Player Edge's border width. A single source of truth: the style that
 * draws it and the formula that derives the band's thickness both read this,
 * so a border that grew in one place could never silently overflow in the
 * other the way two independent numbers could.
 */
export const playerEdgeBorderWidth = 1;

/**
 * The vertical padding inside the Player Edge's border, above its first row
 * and below its last. Also a single source of truth with the style that
 * applies it.
 */
export const playerEdgeVerticalPadding = 6;

/** The space the Player Edge leaves between its rows. */
export const playerEdgeRowGap = PLAYER_EDGE_ROW_GAP;

/** How tall the Player Edge's rows stack, including the chrome around them. */
export function playerEdgeContentHeight(): number {
  const rows =
    playerEdgeRowHeights.identity +
    playerEdgeRowHeights.tray +
    playerEdgeRowHeights.undo +
    playerEdgeRowHeights.actions;
  const gaps = PLAYER_EDGE_ROW_GAP * 3;
  const chrome = (playerEdgeBorderWidth + playerEdgeVerticalPadding) * 2;
  return rows + gaps + chrome;
}

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
  const playerEdgeThickness = playerEdgeContentHeight();
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
