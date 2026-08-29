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
import { returnToPlay } from './session';
import type { TableSession } from './session';
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
  session: TableSession,
  playerEdge: PlayerEdge,
): UndoControlPresentation {
  return {
    available: canUndoSession(session),
    label: UNDO_LABEL,
    rotation: rotationForPlayerEdge(playerEdge),
  };
}

/** The session after an undo, and whether anything actually changed. */
export interface UndoResult {
  readonly session: TableSession;
  readonly changed: boolean;
}

/**
 * Whether there is anything to take back: either an ending the players agreed
 * on, or a move played.
 */
function canUndoSession(session: TableSession): boolean {
  return session.outcome !== undefined || canUndo(session.game);
}

/**
 * Takes back the last thing that happened at the table.
 *
 * When the players ended the game by agreement — a resignation or an agreed
 * draw — that agreement *is* the last thing that happened, so undo takes back
 * the agreement and leaves the position untouched, returning a finished game to
 * play. The rules module never knew the game had ended, so nothing there needs
 * stepping back. Otherwise undo steps the game back one move.
 *
 * `changed` lets the caller drop anything that pointed at the old position — a
 * selected piece or an open promotion prompt — so nothing lingers over a board
 * that no longer exists. Undo at the start of a game is not an error: the
 * session is returned unchanged with `changed` false.
 */
export function applyUndo(session: TableSession): UndoResult {
  if (session.outcome !== undefined) {
    return { session: returnToPlay(session, session.game), changed: true };
  }
  if (!canUndo(session.game)) {
    return { session, changed: false };
  }
  return { session: returnToPlay(session, undo(session.game)), changed: true };
}
