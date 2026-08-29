/**
 * The undo control's logic: whether take-back is available right now, the label
 * it carries, and which way it faces on each Player Edge.
 *
 * Like `./selection` and `./promotion` this is plain data logic — no React, no
 * react-native-svg, no browser globals — so it is unit-tested in plain Node
 * (vitest collects `*.test.ts` only). `./PlayerEdgesTable.tsx` renders whatever
 * this reports and calls back in.
 *
 * Undo is not reinvented here. The rules module already steps a game back to
 * its previous value (rules README, "Undo and serialisation"), which restores
 * everything observable — position, side to move, castling and en-passant
 * rights, both clocks, Material Advantage, both Trays and the game status — and
 * steps a finished game back into play. This module only wires that referee to
 * a control on each seat: it never inverts a move itself.
 *
 * The control appears on both Player Edges, each rotated to face its own player
 * using the very rotation `playerEdges` already computes, so both belong to one
 * scheme and the board itself still never rotates (ADR 0003). Take-back needs no
 * confirmation from the opponent: two people at one table settle it by talking,
 * so there is no approval prompt here to build (#17).
 */

import { canUndo, undo } from '../rules';
import type { Game } from '../rules';
import { rotationForPlayerEdge } from './playerEdges';
import type { PlayerEdge, PlayerEdgeRotation } from './playerEdges';

const UNDO_LABEL = 'Undo';

/** Everything one Player Edge's undo control renders. */
export interface UndoControlPresentation {
  readonly available: boolean;
  readonly label: string;
  readonly rotation: PlayerEdgeRotation;
}

/**
 * The undo control a single Player Edge shows, facing its own player. It is
 * unavailable — not present and inert — when there is nothing to undo, so the
 * `available` flag is a real distinction the renderer disables the control on
 * rather than merely greying it.
 */
export function undoControlPresentation(
  game: Game,
  playerEdge: PlayerEdge,
): UndoControlPresentation {
  return {
    available: canUndo(game),
    label: UNDO_LABEL,
    rotation: rotationForPlayerEdge(playerEdge),
  };
}

/** The game after an undo, and whether anything actually changed. */
export interface UndoResult {
  readonly game: Game;
  readonly changed: boolean;
}

/**
 * Steps the game back one move, or reports that there was nothing to step back.
 * `changed` lets the caller drop anything that pointed at the old position — a
 * selected piece or an open promotion prompt — so nothing lingers over a board
 * that no longer exists. Undo at the start of a game is not an error: the game
 * is returned unchanged with `changed` false.
 */
export function applyUndo(game: Game): UndoResult {
  if (!canUndo(game)) {
    return { game, changed: false };
  }
  return { game: undo(game), changed: true };
}
