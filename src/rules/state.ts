import type { Board, CastlingRights, Game, Piece, PieceColor, Square } from './types';

export interface GameState {
  readonly board: Board;
  readonly sideToMove: PieceColor;
  readonly castlingRights: CastlingRights;
  readonly enPassantTarget: Square | undefined;
  readonly halfmoveClock: number;
  readonly fullmoveNumber: number;
  // Repetition signatures of every position that has occurred in this game,
  // the current one last. Threefold repetition needs the history the six FEN
  // fields cannot carry; it is optional because a position parsed from FEN
  // begins its history fresh, with itself as the sole entry.
  readonly positionHistory?: readonly string[];
}

export function toGameState(game: Game): GameState {
  return game as unknown as GameState;
}

export function fromGameState(state: GameState): Game {
  return state as unknown as Game;
}
