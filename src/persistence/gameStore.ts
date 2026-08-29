/**
 * Auto-save and resume: the one stored game that survives the app closing.
 *
 * This is plain data logic with no React, no react-native and no Expo, so it is
 * unit-tested in plain Node (vitest collects `*.test.ts` only). The concrete,
 * device-backed storage lives in `./asyncStorageGameStore`, behind the
 * `GameStorage` seam this module takes as a parameter — storage is injected
 * rather than reached for directly, so saving and restoring are verifiable
 * without a device.
 *
 * What is stored is the table session, encoded by `../ui/session`: the game as
 * the rules module's own full-history serialisation — the starting position and
 * every move, not a lone position, so undo keeps working after a resume — plus
 * any ending the players agreed on, which the move list cannot carry. Stored
 * text is untrusted throughout, so a truncated, malformed or older-format save
 * yields a fresh game rather than a broken screen (src/rules/README.md, "Undo
 * and serialisation").
 */

import { deserializeSession, serializeSession } from '../ui/session';
import type { TableSession } from '../ui/session';

/**
 * A single slot holding one string. `read` returns the stored text, or `null`
 * when nothing has been written yet; `write` replaces it. Exactly one game is
 * stored, so there is one slot and no key or save list to choose here.
 */
export interface GameStorage {
  read(): Promise<string | null>;
  write(value: string): Promise<void>;
}

/**
 * Persists the session as the one stored game, replacing whatever was there.
 * Called whenever the session changes, so a played move, an undo, a resignation
 * and starting a new game are all stored the same way, with no save UI for
 * either player to learn.
 */
export async function saveSession(
  storage: GameStorage,
  session: TableSession,
): Promise<void> {
  await storage.write(serializeSession(session));
}

/**
 * The stored session, replayed with its full history so undo still reaches the
 * start and a finished game returns finished — whether it ended by rule or by
 * the players agreeing. Empty, truncated, malformed or
 * older-format storage yields a fresh, playable game, so the players are never
 * stranded on a broken board.
 */
export async function restoreSession(storage: GameStorage): Promise<TableSession> {
  const stored = await storage.read();
  return deserializeSession(stored ?? '');
}
