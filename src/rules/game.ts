import type {
  CapturedPieces,
  CastlingRights,
  Game,
  Move,
  Piece,
  PieceColor,
  PromotionPieceType,
  Square,
} from './types';
import { parseFen, serializeFen } from './fen';
import { squareToIndex } from './coordinates';
import { fromGameState, toGameState } from './state';
import type { GameState } from './state';
import {
  applyIndexedMove,
  isInCheck,
  legalIndexedMoves,
  toIndexedMove,
  toMove,
} from './moves';
import { IllegalMoveError } from './types';
import { materialAdvantageOf, capturedPiecesOf } from './material';
import { classify, gameStatus, historyOf, repetitionSignature } from './status';

const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export function createGame(): Game {
  return createGameFromFen(STARTING_FEN);
}

export function createGameFromFen(fen: string): Game {
  const state = parseFen(fen);
  const origin: GameState = { ...state, positionHistory: historyOf(state) };
  return fromGameState({ ...origin, origin, moves: [] });
}

export function toFen(game: Game): string {
  return serializeFen(toGameState(game));
}

export function pieceAt(game: Game, square: Square): Piece | undefined {
  return toGameState(game).board[squareToIndex(square)];
}

export function sideToMove(game: Game): PieceColor {
  return toGameState(game).sideToMove;
}

export function castlingRights(game: Game): CastlingRights {
  return toGameState(game).castlingRights;
}

export function enPassantTarget(game: Game): Square | undefined {
  return toGameState(game).enPassantTarget;
}

export function halfmoveClock(game: Game): number {
  return toGameState(game).halfmoveClock;
}

export function fullmoveNumber(game: Game): number {
  return toGameState(game).fullmoveNumber;
}

export function legalMoves(game: Game): readonly Move[] {
  return legalIndexedMoves(toGameState(game)).map(toMove);
}

export function legalDestinations(game: Game, from: Square): readonly Square[] {
  return [
    ...new Set(
      legalMoves(game)
        .filter((move) => move.from === from)
        .map((move) => move.to),
    ),
  ];
}

export function applyMove(game: Game, move: Move): Game {
  const state = toGameState(game);
  // Generated once and handed to everything below: the status check, the
  // legality check and the next position's signature all want the same list,
  // and generating it is the expensive part of making a move.
  const moves = legalIndexedMoves(state);
  // A finished game accepts no further move — a drawn or decided position is
  // over even when pieces on the board could still, in isolation, move.
  if (classify(state, moves).kind !== 'in-progress') {
    throw new IllegalMoveError('Game is finished');
  }
  const indexedMove = toIndexedMove(move);
  const legalMove = moves.find(
    (candidate) =>
      candidate.from === indexedMove.from &&
      candidate.to === indexedMove.to &&
      candidate.promotion === indexedMove.promotion,
  );
  if (!legalMove) throw new IllegalMoveError('Move is not legal');
  const nextState = applyIndexedMove(state, legalMove);
  const origin = state.origin ?? { ...state, origin: undefined, moves: undefined };
  return fromGameState({
    ...nextState,
    positionHistory: [...historyOf(state, moves), repetitionSignature(nextState)],
    origin,
    moves: [...(state.moves ?? []), toMove(legalMove)],
  });
}

// A game exposes an undo only when a move has been played since it began. A
// freshly created game, or one loaded from FEN with nothing yet played, has
// nowhere to step back to — the caller reads that here rather than by catching
// an error.
export function canUndo(game: Game): boolean {
  return (toGameState(game).moves?.length ?? 0) > 0;
}

// Undo is a step back through the list of prior values, not an attempt to
// invert the last move: it replays every move but the last from the position
// the game started at, so it restores the whole observable state — side to
// move, castling rights, the en-passant square, both clocks, repetition
// history and game status — without ever computing an inverse. Rewinding a
// finished game therefore returns it to a playable status. With nothing to
// undo the game is returned unchanged.
export function undo(game: Game): Game {
  const state = toGameState(game);
  const moves = state.moves ?? [];
  if (moves.length === 0 || state.origin === undefined) return game;
  let rewound = fromGameState({ ...state.origin, origin: state.origin, moves: [] });
  for (const move of moves.slice(0, -1)) {
    rewound = applyMove(rewound, move);
  }
  return rewound;
}

export function isCheck(game: Game): boolean {
  const state = toGameState(game);
  return isInCheck(state, state.sideToMove);
}

export function materialAdvantage(game: Game): number {
  return materialAdvantageOf(toGameState(game).board);
}

export function capturedPieces(game: Game): CapturedPieces {
  return capturedPiecesOf(toGameState(game).board);
}

// FEN carries one position and no history, so a serialised game is the position
// it started from plus every move played since. Reading it back replays those
// moves, which rebuilds the undo history and the repetition count exactly — a
// position loaded straight from FEN could never carry either.
const SERIALIZATION_VERSION = 1;

export function serializeGame(game: Game): string {
  const state = toGameState(game);
  const origin = state.origin ?? state;
  return JSON.stringify({
    version: SERIALIZATION_VERSION,
    startingFen: serializeFen(origin),
    moves: (state.moves ?? []).map((move) => ({
      from: move.from,
      to: move.to,
      ...(move.promotion === undefined ? {} : { promotion: move.promotion }),
    })),
  });
}

// Deserialisation treats its input as untrusted: anything that fails to parse,
// fails validation, or replays into an illegal position yields a fresh game
// rather than a crash or a half-restored board.
export function deserializeGame(serialized: string): Game {
  try {
    const data: unknown = JSON.parse(serialized);
    if (
      typeof data !== 'object' ||
      data === null ||
      (data as { version?: unknown }).version !== SERIALIZATION_VERSION
    ) {
      return createGame();
    }
    const { startingFen, moves } = data as { startingFen?: unknown; moves?: unknown };
    if (typeof startingFen !== 'string' || !Array.isArray(moves)) return createGame();
    let game = createGameFromFen(startingFen);
    for (const move of moves) {
      game = applyMove(game, parseStoredMove(move));
    }
    return game;
  } catch {
    return createGame();
  }
}

// A move read from serialised input, shaped but not yet trusted to be legal.
// applyMove is what proves it legal; this only guarantees the fields exist so a
// malformed entry becomes a fresh game rather than an obscure failure.
function parseStoredMove(value: unknown): Move {
  if (typeof value !== 'object' || value === null) {
    throw new IllegalMoveError('Serialised move is not an object');
  }
  const { from, to, promotion } = value as Record<string, unknown>;
  if (typeof from !== 'string' || typeof to !== 'string') {
    throw new IllegalMoveError('Serialised move is missing from/to');
  }
  const move: Move = { from: from as Square, to: to as Square };
  return promotion === undefined
    ? move
    : { ...move, promotion: promotion as PromotionPieceType };
}
