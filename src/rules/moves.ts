import { BOARD_SIZE, fromIndex, indexToSquare, toIndex } from './coordinates';
import type { GameState } from './state';
import type { Move, Piece, PieceColor } from './types';

interface IndexedMove {
  readonly from: number;
  readonly to: number;
}

const KNIGHT_OFFSETS = [
  [-1, -2],
  [1, -2],
  [-2, -1],
  [2, -1],
  [-2, 1],
  [2, 1],
  [-1, 2],
  [1, 2],
] as const;
const KING_OFFSETS = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
] as const;
const BISHOP_DIRECTIONS = [
  [-1, -1],
  [1, -1],
  [-1, 1],
  [1, 1],
] as const;
const ROOK_DIRECTIONS = [
  [0, -1],
  [-1, 0],
  [1, 0],
  [0, 1],
] as const;

function other(color: PieceColor): PieceColor {
  return color === 'white' ? 'black' : 'white';
}

function updatedCastlingRights(state: GameState, piece: Piece, move: IndexedMove) {
  return {
    whiteKingside:
      state.castlingRights.whiteKingside &&
      !(piece.color === 'white' && piece.type === 'king') &&
      move.from !== 7 &&
      move.to !== 7,
    whiteQueenside:
      state.castlingRights.whiteQueenside &&
      !(piece.color === 'white' && piece.type === 'king') &&
      move.from !== 0 &&
      move.to !== 0,
    blackKingside:
      state.castlingRights.blackKingside &&
      !(piece.color === 'black' && piece.type === 'king') &&
      move.from !== 63 &&
      move.to !== 63,
    blackQueenside:
      state.castlingRights.blackQueenside &&
      !(piece.color === 'black' && piece.type === 'king') &&
      move.from !== 56 &&
      move.to !== 56,
  };
}

function indexAt(file: number, rank: number): number | undefined {
  if (file < 0 || file >= BOARD_SIZE || rank < 0 || rank >= BOARD_SIZE) return undefined;
  return toIndex({ file, rank });
}

function canLand(state: GameState, color: PieceColor, index: number): boolean {
  const target = state.board[index];
  return target?.color !== color && target?.type !== 'king';
}

function addSteps(
  state: GameState,
  moves: IndexedMove[],
  from: number,
  color: PieceColor,
  offsets: readonly (readonly [number, number])[],
): void {
  const { file, rank } = fromIndex(from);
  for (const [fileOffset, rankOffset] of offsets) {
    const to = indexAt(file + fileOffset, rank + rankOffset);
    if (to !== undefined && canLand(state, color, to)) moves.push({ from, to });
  }
}

function addSlides(
  state: GameState,
  moves: IndexedMove[],
  from: number,
  color: PieceColor,
  directions: readonly (readonly [number, number])[],
): void {
  const { file, rank } = fromIndex(from);
  for (const [fileStep, rankStep] of directions) {
    let nextFile = file + fileStep;
    let nextRank = rank + rankStep;
    for (;;) {
      const to = indexAt(nextFile, nextRank);
      if (to === undefined) break;
      const target = state.board[to];
      if (target?.color === color) break;
      if (target?.type !== 'king') moves.push({ from, to });
      if (target !== undefined) break;
      nextFile += fileStep;
      nextRank += rankStep;
    }
  }
}

function pseudoLegalMoves(state: GameState): IndexedMove[] {
  const moves: IndexedMove[] = [];
  for (let from = 0; from < state.board.length; from++) {
    const piece = state.board[from];
    if (!piece || piece.color !== state.sideToMove) continue;
    const { file, rank } = fromIndex(from);

    if (piece.type === 'pawn') {
      const direction = piece.color === 'white' ? 1 : -1;
      const startRank = piece.color === 'white' ? 1 : 6;
      const promotionRank = piece.color === 'white' ? 7 : 0;
      const oneStep = indexAt(file, rank + direction);
      if (
        oneStep !== undefined &&
        state.board[oneStep] === undefined &&
        rank + direction !== promotionRank
      ) {
        moves.push({ from, to: oneStep });
        const twoStep = indexAt(file, rank + direction * 2);
        if (
          rank === startRank &&
          twoStep !== undefined &&
          state.board[twoStep] === undefined
        ) {
          moves.push({ from, to: twoStep });
        }
      }
      for (const fileOffset of [-1, 1]) {
        const to = indexAt(file + fileOffset, rank + direction);
        if (
          to !== undefined &&
          rank + direction !== promotionRank &&
          state.board[to]?.color === other(piece.color) &&
          state.board[to]?.type !== 'king'
        ) {
          moves.push({ from, to });
        }
      }
    } else if (piece.type === 'knight') {
      addSteps(state, moves, from, piece.color, KNIGHT_OFFSETS);
    } else if (piece.type === 'bishop') {
      addSlides(state, moves, from, piece.color, BISHOP_DIRECTIONS);
    } else if (piece.type === 'rook') {
      addSlides(state, moves, from, piece.color, ROOK_DIRECTIONS);
    } else if (piece.type === 'queen') {
      addSlides(state, moves, from, piece.color, [
        ...BISHOP_DIRECTIONS,
        ...ROOK_DIRECTIONS,
      ]);
    } else {
      addSteps(state, moves, from, piece.color, KING_OFFSETS);
    }
  }
  return moves;
}

export function isSquareAttacked(
  state: GameState,
  square: number,
  by: PieceColor,
): boolean {
  const { file, rank } = fromIndex(square);
  const pawnRank = rank + (by === 'white' ? -1 : 1);
  for (const pawnFile of [file - 1, file + 1]) {
    const pawn = indexAt(pawnFile, pawnRank);
    if (
      pawn !== undefined &&
      state.board[pawn]?.color === by &&
      state.board[pawn]?.type === 'pawn'
    ) {
      return true;
    }
  }

  for (const [fileOffset, rankOffset] of KNIGHT_OFFSETS) {
    const index = indexAt(file + fileOffset, rank + rankOffset);
    if (
      index !== undefined &&
      state.board[index]?.color === by &&
      state.board[index]?.type === 'knight'
    ) {
      return true;
    }
  }

  for (const [fileStep, rankStep] of BISHOP_DIRECTIONS) {
    for (let distance = 1; ; distance++) {
      const index = indexAt(file + fileStep * distance, rank + rankStep * distance);
      if (index === undefined) break;
      const piece = state.board[index];
      if (!piece) continue;
      if (piece.color === by && (piece.type === 'bishop' || piece.type === 'queen'))
        return true;
      break;
    }
  }
  for (const [fileStep, rankStep] of ROOK_DIRECTIONS) {
    for (let distance = 1; ; distance++) {
      const index = indexAt(file + fileStep * distance, rank + rankStep * distance);
      if (index === undefined) break;
      const piece = state.board[index];
      if (!piece) continue;
      if (piece.color === by && (piece.type === 'rook' || piece.type === 'queen'))
        return true;
      break;
    }
  }
  for (const [fileOffset, rankOffset] of KING_OFFSETS) {
    const index = indexAt(file + fileOffset, rank + rankOffset);
    if (
      index !== undefined &&
      state.board[index]?.color === by &&
      state.board[index]?.type === 'king'
    ) {
      return true;
    }
  }
  return false;
}

export function isInCheck(state: GameState, color: PieceColor): boolean {
  const king = state.board.findIndex(
    (piece) => piece?.color === color && piece.type === 'king',
  );
  return isSquareAttacked(state, king, other(color));
}

export function applyIndexedMove(state: GameState, move: IndexedMove): GameState {
  const board = [...state.board];
  const piece = board[move.from] as Piece;
  const captured = board[move.to];
  board[move.from] = undefined;
  board[move.to] = piece;
  const isPawnMove = piece.type === 'pawn';
  const { rank: fromRank } = fromIndex(move.from);
  const { rank: toRank } = fromIndex(move.to);
  const enPassantTarget =
    isPawnMove && Math.abs(toRank - fromRank) === 2
      ? indexToSquare(
          toIndex({ file: fromIndex(move.from).file, rank: (fromRank + toRank) / 2 }),
        )
      : undefined;
  return {
    board,
    sideToMove: other(state.sideToMove),
    castlingRights: updatedCastlingRights(state, piece, move),
    enPassantTarget,
    halfmoveClock: isPawnMove || captured ? 0 : state.halfmoveClock + 1,
    fullmoveNumber: state.fullmoveNumber + (state.sideToMove === 'black' ? 1 : 0),
  };
}

export function legalIndexedMoves(state: GameState): IndexedMove[] {
  return pseudoLegalMoves(state).filter(
    (move) => !isInCheck(applyIndexedMove(state, move), state.sideToMove),
  );
}

export function toMove(move: IndexedMove): Move {
  return { from: indexToSquare(move.from), to: indexToSquare(move.to) };
}

export function toIndexedMove(move: Move): IndexedMove {
  return {
    from: toIndex({
      file: move.from.charCodeAt(0) - 97,
      rank: move.from.charCodeAt(1) - 49,
    }),
    to: toIndex({ file: move.to.charCodeAt(0) - 97, rank: move.to.charCodeAt(1) - 49 }),
  };
}
