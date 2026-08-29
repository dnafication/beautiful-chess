/**
 * The promotion picker's logic: when a pawn reaches the far rank, which piece
 * it becomes is the player's choice, and this module decides when to ask, what
 * to offer, which way the prompt faces, and what a choice resolves to.
 *
 * Like `./selection` this is plain data logic — no React, no react-native-svg,
 * no browser globals — so it is unit-tested in plain Node (vitest collects
 * `*.test.ts` only). `./PromotionPicker.tsx` renders whatever this reports and
 * hands a chosen piece back in.
 *
 * A promotion is ONE move (ADR 0002's rules already carry `Move.promotion`):
 * the pawn does not step to the far rank and then transform. Nothing is applied
 * until a piece is chosen, so a prompt that is never answered leaves the
 * position exactly as it was — the pawn is still on the rank it started from.
 * That is why the prompt is unavoidable rather than dismissible: there is no
 * legal position with a pawn sitting un-promoted on the far rank.
 */

import { legalMoves, sideToMove } from '../rules';
import type { Game, Move, Piece, PromotionPieceType, Square } from '../rules';
import {
  playerEdgeForColor,
  rotationForPlayerEdge,
  type PlayerEdgeRotation,
} from './playerEdges';

// Queen first — the choice in the overwhelming majority of games — then the
// under-promotions. All four are offered because under-promotion is a real
// move and is occasionally the only winning one; the rules module generates
// every one of them and none is filtered out here.
const PROMOTION_ORDER: readonly PromotionPieceType[] = [
  'queen',
  'rook',
  'bishop',
  'knight',
];

/**
 * A pending promotion: the pawn's move, the pieces it may become drawn in the
 * promoting player's colour, and the rotation that faces that player from their
 * own seat — the same rotation as their Player Edge.
 */
export interface PromotionPrompt {
  readonly from: Square;
  readonly to: Square;
  readonly options: readonly Piece[];
  readonly rotation: PlayerEdgeRotation;
}

/**
 * The prompt for the move landing on `to`, or `undefined` when that move is not
 * a promotion. Detection comes from the rules module rather than from guessing
 * at ranks, so promotion by capture is caught exactly like a straight advance.
 */
export function promotionPrompt(
  game: Game,
  from: Square,
  to: Square,
): PromotionPrompt | undefined {
  const promotes = legalMoves(game).some(
    (move) => move.from === from && move.to === to && move.promotion !== undefined,
  );
  if (!promotes) {
    return undefined;
  }
  const color = sideToMove(game);
  const options = PROMOTION_ORDER.map((type): Piece => ({ type, color }));
  return {
    from,
    to,
    options,
    rotation: rotationForPlayerEdge(playerEdgeForColor(color)),
  };
}

/** The single move a chosen piece resolves to. */
export function promotionChoice(
  prompt: PromotionPrompt,
  piece: PromotionPieceType,
): Move {
  return { from: prompt.from, to: prompt.to, promotion: piece };
}
