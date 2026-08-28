import { expect, it } from 'vitest';
import { createGameFromFen, isCheck, legalMoves, applyMove, toFen } from './index';
it('discovered check on opponent', () => {
  const g = createGameFromFen('7k/8/8/8/KpP4r/8/8/8 b - c3 0 1');
  expect(isCheck(g)).toBe(false);
  const ms = legalMoves(g);
  console.log(
    'bxc3 generated:',
    ms.some((m) => m.from === 'b4' && m.to === 'c3'),
  );
  const after = applyMove(g, { from: 'b4', to: 'c3' });
  console.log('fen after:', toFen(after), 'white in check:', isCheck(after));
});
