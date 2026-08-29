import { describe, expect, it } from 'vitest';
import { createGame, createGameFromFen } from '../rules';
import { promotionChoice, promotionPrompt } from './promotion';

describe('recognising a promotion', () => {
  it('offers no prompt for an ordinary move', () => {
    const game = createGame();
    expect(promotionPrompt(game, 'e2', 'e4')).toBeUndefined();
  });

  it('offers no prompt for a pawn that has not reached the far rank', () => {
    const game = createGameFromFen('4k3/P7/8/8/8/8/8/4K3 w - - 0 1');
    expect(promotionPrompt(game, 'a7', 'a7')).toBeUndefined();
  });

  it('prompts when a pawn advances to the far rank', () => {
    const game = createGameFromFen('4k3/P7/8/8/8/8/8/4K3 w - - 0 1');
    const prompt = promotionPrompt(game, 'a7', 'a8');
    expect(prompt?.from).toBe('a7');
    expect(prompt?.to).toBe('a8');
  });

  it('prompts when a pawn promotes by capturing onto the far rank', () => {
    const game = createGameFromFen('1n2k3/P7/8/8/8/8/8/4K3 w - - 0 1');
    const prompt = promotionPrompt(game, 'a7', 'b8');
    expect(prompt?.from).toBe('a7');
    expect(prompt?.to).toBe('b8');
  });
});

describe('the pieces on offer', () => {
  it('offers queen, rook, bishop and knight, so under-promotion is reachable', () => {
    const game = createGameFromFen('4k3/P7/8/8/8/8/8/4K3 w - - 0 1');
    const prompt = promotionPrompt(game, 'a7', 'a8');
    expect(prompt?.options.map((option) => option.type)).toEqual([
      'queen',
      'rook',
      'bishop',
      'knight',
    ]);
  });

  it('offers the pieces in the promoting player’s colour', () => {
    const white = createGameFromFen('4k3/P7/8/8/8/8/8/4K3 w - - 0 1');
    const black = createGameFromFen('4k3/8/8/8/8/8/p7/4K3 b - - 0 1');
    expect(
      promotionPrompt(white, 'a7', 'a8')?.options.every((o) => o.color === 'white'),
    ).toBe(true);
    expect(
      promotionPrompt(black, 'a2', 'a1')?.options.every((o) => o.color === 'black'),
    ).toBe(true);
  });
});

describe('facing the promoting player', () => {
  it('faces White upright and Black rotated, matching their Player Edge', () => {
    const white = createGameFromFen('4k3/P7/8/8/8/8/8/4K3 w - - 0 1');
    const black = createGameFromFen('4k3/8/8/8/8/8/p7/4K3 b - - 0 1');
    expect(promotionPrompt(white, 'a7', 'a8')?.rotation).toBe('0deg');
    expect(promotionPrompt(black, 'a2', 'a1')?.rotation).toBe('180deg');
  });
});

describe('resolving a choice into a move', () => {
  const game = createGameFromFen('4k3/P7/8/8/8/8/8/4K3 w - - 0 1');

  it('turns the queen choice into the promoting move', () => {
    const prompt = promotionPrompt(game, 'a7', 'a8');
    expect(promotionChoice(prompt!, 'queen')).toEqual({
      from: 'a7',
      to: 'a8',
      promotion: 'queen',
    });
  });

  it('turns an under-promotion choice into the promoting move', () => {
    const prompt = promotionPrompt(game, 'a7', 'a8');
    expect(promotionChoice(prompt!, 'knight')).toEqual({
      from: 'a7',
      to: 'a8',
      promotion: 'knight',
    });
  });
});
