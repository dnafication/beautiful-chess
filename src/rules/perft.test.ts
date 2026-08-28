import { describe, expect, it } from 'vitest';
import { createGame } from './index';
import { perft, perftDivide } from './perft';

describe('perft from the initial position', () => {
  it.each([
    [1, 20],
    [2, 400],
    [3, 8902],
    [4, 197281],
  ])('matches depth %i', (depth, nodes) => {
    expect(perft(createGame(), depth)).toBe(nodes);
  });

  it('reports a subtotal for each first move', () => {
    const divide = perftDivide(createGame(), 2);

    expect(divide.size).toBe(20);
    expect([...divide.values()].reduce((total, nodes) => total + nodes, 0)).toBe(400);
  });
});
