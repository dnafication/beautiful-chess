import type { CastlingRights, Game, Piece, PieceColor, Square } from './types';

export interface GameState {
  readonly board: readonly (Piece | undefined)[];
  readonly sideToMove: PieceColor;
  readonly castlingRights: CastlingRights;
  readonly enPassantTarget: Square | undefined;
  readonly halfmoveClock: number;
  readonly fullmoveNumber: number;
}

export function toGameState(game: Game): GameState {
  return game as unknown as GameState;
}

export function fromGameState(state: GameState): Game {
  return state as unknown as Game;
}
