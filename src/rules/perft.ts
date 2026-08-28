import { applyMove, legalMoves, type Game } from './index';

function moveKey(move: { readonly from: string; readonly to: string }): string {
  return `${move.from}${move.to}`;
}

export function perftDivide(game: Game, depth: number): ReadonlyMap<string, number> {
  if (!Number.isInteger(depth) || depth < 1) {
    throw new RangeError('Perft depth must be a positive integer');
  }
  return new Map(
    legalMoves(game).map((move) => [
      moveKey(move),
      depth === 1 ? 1 : perft(applyMove(game, move), depth - 1),
    ]),
  );
}

export function perft(game: Game, depth: number): number {
  if (depth === 0) return 1;
  return [...perftDivide(game, depth).values()].reduce(
    (total, nodes) => total + nodes,
    0,
  );
}
