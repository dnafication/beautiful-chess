import { describe, expect, it } from 'vitest';
import { defaultPieceTheme, pieceThemes } from '../ui/pieces/themes';
import type { PieceSetStorage } from './pieceSetStore';
import { restorePieceTheme, savePieceTheme } from './pieceSetStore';

function fakeStorage(initial: string | null = null): PieceSetStorage {
  let value = initial;
  return {
    read: () => Promise.resolve(value),
    write: (next) => {
      value = next;
      return Promise.resolve();
    },
  };
}

describe('savePieceTheme / restorePieceTheme', () => {
  it('restores the saved theme', async () => {
    for (const theme of pieceThemes) {
      const storage = fakeStorage();
      await savePieceTheme(storage, theme);
      const restored = await restorePieceTheme(storage);
      expect(restored.id).toBe(theme.id);
    }
  });

  it('returns the default theme when nothing has been stored', async () => {
    const storage = fakeStorage(null);
    const restored = await restorePieceTheme(storage);
    expect(restored.id).toBe(defaultPieceTheme.id);
  });

  it('returns the default theme for an unrecognised stored id', async () => {
    const storage = fakeStorage('not-a-real-theme');
    const restored = await restorePieceTheme(storage);
    expect(restored.id).toBe(defaultPieceTheme.id);
  });

  it('returns the default theme for an empty stored string', async () => {
    const storage = fakeStorage('');
    const restored = await restorePieceTheme(storage);
    expect(restored.id).toBe(defaultPieceTheme.id);
  });

  it('reads back the most recently saved theme', async () => {
    const storage = fakeStorage();
    const [first, second] = pieceThemes;
    await savePieceTheme(storage, first);
    await savePieceTheme(storage, second);
    const restored = await restorePieceTheme(storage);
    expect(restored.id).toBe(second.id);
  });
});
