import type {
  CapturedPieces,
  CastlingRights,
  Game,
  Move,
  Piece,
  PieceColor,
  Square,
} from './types';
import { parseFen, serializeFen } from './fen';
import { squareToIndex } from './coordinates';
import { fromGameState, toGameState } from './state';
import {
  applyIndexedMove,
  isInCheck,
  legalIndexedMoves,
  toIndexedMove,
  toMove,
} from './moves';
import { IllegalMoveError } from './types';
import { materialAdvantageOf, capturedPiecesOf } from './material';
import { gameStatus, repetitionSignature } from './status';

const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export function createGame(): Game {
  return createGameFromFen(STARTING_FEN);
}

export function createGameFromFen(fen: string): Game {
  const state = parseFen(fen);
  return fromGameState({ ...state, positionHistory: [repetitionSignature(state)] });
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
  // A finished game accepts no further move — a drawn or decided position is
  // over even when pieces on the board could still, in isolation, move.
  if (gameStatus(game).kind !== 'in-progress') {
    throw new IllegalMoveError('Game is finished');
  }
  const state = toGameState(game);
  const indexedMove = toIndexedMove(move);
  const legalMove = legalIndexedMoves(state).find(
    (candidate) =>
      candidate.from === indexedMove.from &&
      candidate.to === indexedMove.to &&
      candidate.promotion === indexedMove.promotion,
  );
  if (!legalMove) throw new IllegalMoveError('Move is not legal');
  const nextState = applyIndexedMove(state, legalMove);
  const history = state.positionHistory ?? [repetitionSignature(state)];
  return fromGameState({
    ...nextState,
    positionHistory: [...history, repetitionSignature(nextState)],
  });
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
