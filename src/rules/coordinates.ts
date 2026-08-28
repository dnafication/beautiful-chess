import type { Square } from './types';

export const BOARD_SIZE = 8;
export const SQUARE_COUNT = BOARD_SIZE * BOARD_SIZE; // 64

export interface Coordinates {
  readonly file: number; // 0 = a .. 7 = h
  readonly rank: number; // 0 = rank 1 .. 7 = rank 8
}

const FILES = 'abcdefgh';
const RANKS = '12345678';

export function toIndex(c: Coordinates): number {
  return c.rank * BOARD_SIZE + c.file;
}

export function fromIndex(index: number): Coordinates {
  return { file: index % BOARD_SIZE, rank: Math.floor(index / BOARD_SIZE) };
}

export function squareToIndex(square: Square): number {
  return toIndex({ file: FILES.indexOf(square[0]), rank: RANKS.indexOf(square[1]) });
}

export function indexToSquare(index: number): Square {
  const { file, rank } = fromIndex(index);
  return `${FILES[file]}${RANKS[rank]}` as Square;
}

export function parseSquare(text: string): Square | undefined {
  if (text.length !== 2) return undefined;
  const f = FILES.indexOf(text[0]);
  const r = RANKS.indexOf(text[1]);
  if (f === -1 || r === -1) return undefined;
  return text as Square;
}
