export type PieceColor = 'white' | 'black';
export type PieceType = 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king';
export type PromotionPieceType = 'knight' | 'bishop' | 'rook' | 'queen';
export interface Piece {
  readonly color: PieceColor;
  readonly type: PieceType;
}

export interface Move {
  readonly from: Square;
  readonly to: Square;
  readonly promotion?: PromotionPieceType;
}

export type DrawReason =
  'stalemate' | 'insufficient-material' | 'threefold-repetition' | 'fifty-move-rule';

export type GameStatus =
  | { readonly kind: 'in-progress' }
  | { readonly kind: 'checkmate'; readonly winner: PieceColor }
  | { readonly kind: 'draw'; readonly reason: DrawReason };

export type File = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h';
export type Rank = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8';
export type Square = `${File}${Rank}`;

export type Board = readonly (Piece | undefined)[];

export interface CastlingRights {
  readonly whiteKingside: boolean;
  readonly whiteQueenside: boolean;
  readonly blackKingside: boolean;
  readonly blackQueenside: boolean;
}

export interface CapturedPieces {
  readonly byWhite: readonly Piece[];
  readonly byBlack: readonly Piece[];
}

declare const gameBrand: unique symbol;
export interface Game {
  readonly [gameBrand]: never;
}

export class InvalidPositionError extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = 'InvalidPositionError';
  }
}

export class IllegalMoveError extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = 'IllegalMoveError';
  }
}
