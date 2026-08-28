export type PieceColor = 'white' | 'black';
export type PieceType = 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king';
export interface Piece {
  readonly color: PieceColor;
  readonly type: PieceType;
}

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
