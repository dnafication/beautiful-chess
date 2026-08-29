/**
 * The device-backed `GameStorage`: the one stored game lives under a single key
 * in AsyncStorage, a dependency Expo supports for exactly this kind of small
 * persisted value.
 *
 * This is the only file that reaches for the platform. It is kept apart from the
 * tested logic in `./gameStore` so the plain-Node suite never loads a native
 * module — vitest collects `*.test.ts` and this file is imported only by the
 * `.tsx` app surface (AGENTS.md: the rules and their consumers run in plain
 * Node; UI is verified by hand in v1).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GameStorage } from './gameStore';

// One game is stored, so one key. Namespaced to this app to avoid colliding
// with anything else sharing the device's store.
const STORED_GAME_KEY = 'beautiful-chess/game';

export const asyncStorageGameStore: GameStorage = {
  read: () => AsyncStorage.getItem(STORED_GAME_KEY),
  write: (value) => AsyncStorage.setItem(STORED_GAME_KEY, value),
};
