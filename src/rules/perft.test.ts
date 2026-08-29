import { beforeEach, describe, expect, it } from 'vitest';
import { createGame, createGameFromFen } from './index';
import { perft, perftDivide } from './perft';

// Every perft here is one solid synchronous block, and this file holds enough of
// them to run for over a minute on a slow machine. Vitest's worker talks to the
// runner over an RPC that times out after 60 seconds, so a reply arriving during
// an unbroken minute of perft fails the whole run with `Timeout calling
// "onTaskUpdate"` even though every test passed. Handing the event loop back
// between tests lets those replies land, and costs a tick.
beforeEach(() => new Promise((resolve) => setTimeout(resolve, 0)));

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

// "Kiwipete" is the standard castling position: both sides still hold all four
// rights, both corridors are clear, and the pieces in between generate exactly
// the attacked squares that castling has to notice. It stresses castling, en
// passant and promotion at once, so a wrong count here is unambiguous.
describe('perft from Kiwipete', () => {
  const kiwipete = createGameFromFen(
    'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1',
  );

  it.each([
    [1, 48],
    [2, 2039],
    [3, 97_862],
  ])('matches depth %i', (depth, nodes) => {
    expect(perft(kiwipete, depth)).toBe(nodes);
  });

  // Depth 4 is the first depth at which Kiwipete promotes, so it pins
  // promotion alongside castling and en-passant in one standard oracle.
  it('matches depth 4', () => {
    expect(perft(kiwipete, 4)).toBe(4_085_603);
  }, 120_000);

  // Castling is a single king move in this interface, so the two castles show up
  // in the divide as e1g1 and e1c1 rather than as any notation of their own.
  it('counts both castles among White first moves', () => {
    const divide = perftDivide(kiwipete, 1);

    expect(divide.get('e1g1')).toBe(1);
    expect(divide.get('e1c1')).toBe(1);
  });
});

describe('perft from Position 3', () => {
  const pos3 = createGameFromFen('8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1');

  it('matches depth 5', () => {
    expect(perft(pos3, 5)).toBe(674_624);
  }, 60_000);
});

describe('perft from Position 5', () => {
  const pos5 = createGameFromFen(
    'rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8',
  );

  it.each([
    [3, 62_379],
    [4, 2_103_487],
  ])(
    'matches depth %i',
    (depth, nodes) => {
      expect(perft(pos5, depth)).toBe(nodes);
    },
    120_000,
  );
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
