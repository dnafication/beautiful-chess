import { describe, expect, it } from 'vitest';
import {
  applyMove,
  canUndo,
  castlingRights,
  createGame,
  createGameFromFen,
  deserializeGame,
  enPassantTarget,
  gameStatus,
  halfmoveClock,
  legalMoves,
  materialAdvantage,
  serializeGame,
  sideToMove,
  toFen,
  undo,
} from './index';
import type { Game } from './index';

function observable(game: Game) {
  return {
    fen: toFen(game),
    sideToMove: sideToMove(game),
    castlingRights: castlingRights(game),
    enPassantTarget: enPassantTarget(game),
    halfmoveClock: halfmoveClock(game),
    materialAdvantage: materialAdvantage(game),
    status: gameStatus(game),
    legalMoves: legalMoves(game),
    canUndo: canUndo(game),
  };
}

// Play the whole undo chain out and record what the game looked like at each
// step, so two games can be compared move for move and not merely at their tip.
function rewoundStates(game: Game) {
  const states = [observable(game)];
  let current = game;
  while (canUndo(current)) {
    current = undo(current);
    states.push(observable(current));
  }
  return states;
}

describe('serializeGame / deserializeGame', () => {
  it('round-trips a fresh game', () => {
    const game = createGame();
    expect(observable(deserializeGame(serializeGame(game)))).toEqual(observable(game));
  });

  it('round-trips a game loaded mid-position from FEN', () => {
    const game = createGameFromFen('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
    expect(observable(deserializeGame(serializeGame(game)))).toEqual(observable(game));
  });

  it('round-trips a game carrying castling, en passant, promotion and repetition', () => {
    let game = createGame();
    // Castling rights in play, and a shuffle that will repeat the position.
    game = applyMove(game, { from: 'g1', to: 'f3' });
    game = applyMove(game, { from: 'g8', to: 'f6' });
    game = applyMove(game, { from: 'f3', to: 'g1' });
    game = applyMove(game, { from: 'f6', to: 'g8' }); // start position, second time
    game = applyMove(game, { from: 'e2', to: 'e4' }); // en-passant target appears
    expect(enPassantTarget(game)).toBe('e3');

    const resumed = deserializeGame(serializeGame(game));

    expect(observable(resumed)).toEqual(observable(game));
    // The whole undo history, not just the tip, survives the round-trip.
    expect(rewoundStates(resumed)).toEqual(rewoundStates(game));
  });

  it('preserves a repetition count so a resumed game still draws by threefold', () => {
    let game = createGame();
    game = applyMove(game, { from: 'b1', to: 'c3' });
    game = applyMove(game, { from: 'g8', to: 'f6' });
    game = applyMove(game, { from: 'c3', to: 'b1' });
    game = applyMove(game, { from: 'f6', to: 'g8' }); // occurrence two
    game = applyMove(game, { from: 'b1', to: 'c3' });
    game = applyMove(game, { from: 'g8', to: 'f6' });
    game = applyMove(game, { from: 'c3', to: 'b1' });

    const resumed = deserializeGame(serializeGame(game));
    // One more move completes the third occurrence; the resumed game must know
    // it has repeated twice already, which FEN alone could never carry.
    const drawn = applyMove(resumed, { from: 'f6', to: 'g8' });
    expect(gameStatus(drawn)).toEqual({
      kind: 'draw',
      reason: 'threefold-repetition',
    });
  });

  it('round-trips a promotion so Material Advantage resumes correctly', () => {
    let game = createGameFromFen('4k3/P7/8/8/8/8/8/4K3 w - - 0 1');
    game = applyMove(game, { from: 'a7', to: 'a8', promotion: 'queen' });

    const resumed = deserializeGame(serializeGame(game));
    expect(materialAdvantage(resumed)).toBe(materialAdvantage(game));
    expect(observable(resumed)).toEqual(observable(game));
  });

  it('yields a fresh game from empty input', () => {
    expect(observable(deserializeGame(''))).toEqual(observable(createGame()));
  });

  it('yields a fresh game from malformed JSON', () => {
    expect(observable(deserializeGame('{not json'))).toEqual(observable(createGame()));
  });

  it('yields a fresh game from truncated serialised input', () => {
    const full = serializeGame(applyMove(createGame(), { from: 'e2', to: 'e4' }));
    const truncated = full.slice(0, Math.floor(full.length / 2));
    expect(observable(deserializeGame(truncated))).toEqual(observable(createGame()));
  });

  it('yields a fresh game when a serialised move is illegal', () => {
    const tampered = JSON.stringify({
      version: 1,
      startingFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      moves: [{ from: 'e2', to: 'e5' }], // not a legal move
    });
    expect(observable(deserializeGame(tampered))).toEqual(observable(createGame()));
  });

  it('yields a fresh game when the starting position is invalid', () => {
    const bad = JSON.stringify({ version: 1, startingFen: 'not a fen', moves: [] });
    expect(observable(deserializeGame(bad))).toEqual(observable(createGame()));
  });
});
