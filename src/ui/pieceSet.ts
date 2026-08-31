/**
 * Pure state/presentation logic for the piece-set picker.
 *
 * No React, no react-native: vitest collects `*.test.ts` only, and this module
 * needs to be testable in plain Node. The UI components consume these helpers
 * rather than computing presentation in render.
 */

import { defaultPieceTheme, pieceThemes } from './pieces/themes';
import type { PieceTheme, PieceThemeId } from './pieces/themes';

/** One item in the picker's ordered list of choices. */
export interface PieceSetChoice {
  readonly id: PieceThemeId;
  readonly name: string;
  readonly theme: PieceTheme;
  /** Whether this choice is the currently selected set. */
  readonly isSelected: boolean;
  /** Accessibility label for the swatch button, including selection state. */
  readonly accessibilityLabel: string;
}

/**
 * The ordered list of piece-set choices, each annotated with its selection
 * state relative to `selectedId`. The order comes from `pieceThemes` so the
 * picker always offers themes in the same sequence.
 */
export function pieceSetChoices(
  selectedId: PieceThemeId | undefined,
): readonly PieceSetChoice[] {
  const resolvedId = selectedId ?? defaultPieceTheme.id;
  return pieceThemes.map((theme) => {
    const isSelected = theme.id === resolvedId;
    return {
      id: theme.id,
      name: theme.name,
      theme,
      isSelected,
      accessibilityLabel: isSelected ? `${theme.name}, selected` : `Choose ${theme.name}`,
    };
  });
}
