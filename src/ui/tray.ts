/**
 * The Tray's logic: which captured pieces each Player Edge shows, in what order,
 * and the Material Advantage reading rendered for the player it faces.
 *
 * This is plain data logic with no React, no react-native-svg and no browser
 * globals, so it is unit-tested in plain Node (vitest collects `*.test.ts`
 * only). The `.tsx` Player Edge renders whatever this module reports.
 *
 * Both values come from the rules module, which derives Material Advantage from
 * the pieces standing on the board, never from the Tray (CONTEXT.md, the rules
 * README's "Material Advantage" section). The Tray is display-only: a promotion
 * with no captures shifts the balance while both Trays stay empty, so counting
 * the Tray would be wrong. Material Advantage is a factual count of what stands
 * on the board, not a judgement of who is winning, and is never presented as
 * one.
 */

import { capturedPieces, materialAdvantage } from '../rules';
import type { Game, Piece, PieceColor } from '../rules';
import { colorForPlayerEdge, rotationForPlayerEdge } from './playerEdges';
import type { PlayerEdge, PlayerEdgeRotation } from './playerEdges';

/** Everything one Player Edge's Tray and Material Advantage reading render. */
export interface TrayPresentation {
  readonly color: PieceColor;
  readonly rotation: PlayerEdgeRotation;
  readonly captured: readonly Piece[];
  readonly materialAdvantageText: string | undefined;
}

/**
 * The pieces a player has captured, in the fixed order the rules module groups
 * them (pawn, knight, bishop, rook, queen), so the Tray has nothing to decide
 * and never re-sorts. White's Tray holds the Black pieces White has captured,
 * and Black's the White pieces Black has captured.
 */
export function capturedForColor(game: Game, color: PieceColor): readonly Piece[] {
  const captured = capturedPieces(game);
  return color === 'white' ? captured.byWhite : captured.byBlack;
}

/**
 * The Material Advantage a Player Edge shows, given that player's reading. The
 * number appears only for the leading player, so a positive reading renders as
 * the bare count and anything else — level or behind — renders as absence. A
 * level position is communicated by showing nothing rather than a zero, which
 * is quieter and reads faster; there is no "+0" and no "0". It is a plain
 * material count with no sign, never dressed as an evaluation of who is winning.
 */
export function materialAdvantageText(reading: number): string | undefined {
  return reading > 0 ? String(reading) : undefined;
}

/**
 * The Material Advantage from one player's point of view. The rules module
 * returns a signed count in which positive favours White, so Black's reading is
 * the negation. Each Player Edge shows its own player's reading.
 */
export function materialReadingForColor(game: Game, color: PieceColor): number {
  const advantage = materialAdvantage(game);
  if (color === 'white' || advantage === 0) {
    return advantage;
  }
  return -advantage;
}

/**
 * The Tray and Material Advantage a single Player Edge shows, facing its own
 * player. The pieces and reading both come from the rules module — the Tray
 * never counts itself — and the rotation is the one `playerEdges` already
 * computes, reused rather than reinvented so both belong to one scheme.
 */
export function trayPresentation(game: Game, playerEdge: PlayerEdge): TrayPresentation {
  const color = colorForPlayerEdge(playerEdge);
  return {
    color,
    rotation: rotationForPlayerEdge(playerEdge),
    captured: capturedForColor(game, color),
    materialAdvantageText: materialAdvantageText(materialReadingForColor(game, color)),
  };
}
