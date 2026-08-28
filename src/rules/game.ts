import type { CastlingRights, Game, Piece, PieceColor, Square } from './types';
import { parseFen, serializeFen } from './fen';
import { squareToIndex } from './coordinates';
import { fromGameState, toGameState } from './state';

const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export function createGame(): Game {
  return createGameFromFen(STARTING_FEN);
}

export function createGameFromFen(fen: string): Game {
  const state = parseFen(fen);
  return fromGameState(state);
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
