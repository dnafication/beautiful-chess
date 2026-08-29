import { applyMove, legalMoves, type Game, type Move } from './index';

function promotionKey(move: Move): string {
  if (move.promotion === undefined) return '';
  return move.promotion === 'knight' ? 'n' : move.promotion[0];
}

function moveKey(move: Move): string {
  return `${move.from}${move.to}${promotionKey(move)}`;
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
