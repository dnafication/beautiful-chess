/**
 * The device-backed `PieceSetStorage`: the chosen piece set's id lives under
 * a single key in AsyncStorage.
 *
 * Kept apart from the tested logic in `./pieceSetStore` for the same reason
 * `asyncStorageGameStore` is kept apart from `gameStore`: the plain-Node suite
 * never loads a native module.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PieceSetStorage } from './pieceSetStore';

const STORED_PIECE_SET_KEY = 'beautiful-chess/piece-set';

export const asyncStoragePieceSetStore: PieceSetStorage = {
  read: () => AsyncStorage.getItem(STORED_PIECE_SET_KEY),
  write: (value) => AsyncStorage.setItem(STORED_PIECE_SET_KEY, value),
};
