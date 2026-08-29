import type {
  Board,
  CastlingRights,
  Game,
  Move,
  Piece,
  PieceColor,
  Square,
} from './types';

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
  // The position the game started from — the standard start, or whatever FEN
  // it was loaded from. Undo rewinds by replaying `moves` from here, never
  // before it, so a game resumed mid-position cannot be stepped back past its
  // own beginning. It carries neither `origin` nor `moves`, so the chain does
  // not nest.
  readonly origin?: GameState;
  // Every move played since `origin`, in order. History is a list of prior
  // values rather than an inverse-move calculation: undo drops the last move
  // and replays the rest, which is why it cannot forget to restore castling
  // rights, the en-passant square or either clock.
  readonly moves?: readonly Move[];
}

export function toGameState(game: Game): GameState {
  return game as unknown as GameState;
}

export function fromGameState(state: GameState): Game {
  return state as unknown as Game;
}
