import { describe, expect, it } from 'vitest';
import { defaultPieceTheme, pieceThemes } from './pieces/themes';
import type { PieceThemeId } from './pieces/themes';
import { pieceSetChoices } from './pieceSet';

describe('pieceSetChoices', () => {
  it('returns one choice for every available theme', () => {
    const choices = pieceSetChoices(defaultPieceTheme.id);
    expect(choices).toHaveLength(pieceThemes.length);
  });

  it('marks only the selected theme as isSelected', () => {
    for (const theme of pieceThemes) {
      const choices = pieceSetChoices(theme.id);
      const selected = choices.filter((c) => c.isSelected);
      expect(selected).toHaveLength(1);
      expect(selected[0].id).toBe(theme.id);
    }
  });

  it('falls back to the default when selectedId is undefined', () => {
    const choices = pieceSetChoices(undefined);
    const selected = choices.find((c) => c.isSelected);
    expect(selected?.id).toBe(defaultPieceTheme.id);
  });

  it('provides an accessibility label that mentions the name', () => {
    const choices = pieceSetChoices(defaultPieceTheme.id);
    for (const choice of choices) {
      expect(choice.accessibilityLabel).toContain(choice.name);
    }
  });

  it('labels the selected choice differently from unselected ones', () => {
    const choices = pieceSetChoices(defaultPieceTheme.id);
    const selected = choices.find((c) => c.isSelected);
    const unselected = choices.filter((c) => !c.isSelected);
    expect(selected?.accessibilityLabel).toContain('selected');
    for (const choice of unselected) {
      expect(choice.accessibilityLabel).not.toContain('selected');
    }
  });

  it('includes the theme object on each choice', () => {
    const choices = pieceSetChoices(defaultPieceTheme.id);
    for (const choice of choices) {
      expect(choice.theme.id).toBe(choice.id);
    }
  });

  it('preserves the order from pieceThemes', () => {
    const choices = pieceSetChoices(defaultPieceTheme.id);
    expect(choices.map((c) => c.id)).toEqual(pieceThemes.map((t) => t.id));
  });
});
