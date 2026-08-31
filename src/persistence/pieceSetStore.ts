/**
 * Persistence for the chosen piece set: remembers one `PieceThemeId` across
 * app restarts.
 *
 * Follows the seam style of `./gameStore`: the concrete storage is injected so
 * the logic is testable in plain Node without loading any native module. The
 * stored value is untrusted — an id from a future or past version falls back to
 * the default theme via `pieceThemeById`, which already handles unknown ids.
 *
 * This is intentionally a separate stored slot so the game save format is never
 * changed by a cosmetic preference.
 */

import { defaultPieceTheme, pieceThemeById } from '../ui/pieces/themes';
import type { PieceTheme } from '../ui/pieces/themes';

/**
 * A single string slot, exactly like `GameStorage`. `read` returns the stored
 * text or `null` when nothing has been written yet.
 */
export interface PieceSetStorage {
  read(): Promise<string | null>;
  write(value: string): Promise<void>;
}

/**
 * Saves the chosen theme id. Called whenever the player selects a different
 * set from the picker.
 */
export async function savePieceTheme(
  storage: PieceSetStorage,
  theme: PieceTheme,
): Promise<void> {
  await storage.write(theme.id);
}

/**
 * The stored theme, or the default if nothing has been stored or the stored id
 * is unrecognised. `pieceThemeById` handles the untrusted-input fallback so
 * a value written by a later version of the app never leaves the UI undrawn.
 */
export async function restorePieceTheme(storage: PieceSetStorage): Promise<PieceTheme> {
  const stored = await storage.read();
  return stored !== null ? pieceThemeById(stored) : defaultPieceTheme;
}
