import { describe, expect, it } from 'vitest';
import { createGame, createGameFromFen } from './index';
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

  it('matches depth 5 (includes en-passant captures)', () => {
    expect(perft(createGame(), 5)).toBe(4_865_609);
  }, 60_000);

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

describe('perft from Position 6', () => {
  const pos6 = createGameFromFen(
    'r4rk1/1pp1qppp/p1np1n2/2b1p1B1/2B1P1b1/P1NP1N2/1PP1QPPP/R4RK1 w - - 0 10',
  );

  it('matches depth 3', () => {
    expect(perft(pos6, 3)).toBe(89_890);
  });

  it('matches depth 4', () => {
    expect(perft(pos6, 4)).toBe(3_894_594);
  }, 120_000);
});
