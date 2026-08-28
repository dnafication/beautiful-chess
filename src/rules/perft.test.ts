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

  // Depth 2 cannot verify a divide at all: every one of White's twenty first
  // moves has exactly twenty replies, so an even 20x20 split would pass. Depth 3
  // subtotals genuinely differ, so these numbers pin the per-move breakdown.
  it('reports a distinct subtotal for each first move', () => {
    const divide = perftDivide(createGame(), 3);

    expect(divide.size).toBe(20);
    expect([...divide.values()].reduce((total, nodes) => total + nodes, 0)).toBe(8902);
    expect(divide.get('e2e4')).toBe(600);
    expect(divide.get('d2d4')).toBe(560);
    expect(divide.get('a2a3')).toBe(380);
    expect(divide.get('b1c3')).toBe(440);
  });
});
