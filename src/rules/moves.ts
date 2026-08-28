import type { Coordinates } from './coordinates';
import {
  BOARD_SIZE,
  fromIndex,
  indexToSquare,
  squareToIndex,
  toIndex,
} from './coordinates';
import type { GameState } from './state';
import type { CastlingRights, Move, Piece, PieceColor, PieceType } from './types';

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
// A castling right is lost when its king moves, or when its rook's home square
// is vacated or captured on. Stating the four squares once keeps the mapping
// between a right and its rook in one place.
const CASTLING_RIGHT_SOURCES = [
  { right: 'whiteKingside', color: 'white', rookHome: squareToIndex('h1') },
  { right: 'whiteQueenside', color: 'white', rookHome: squareToIndex('a1') },
  { right: 'blackKingside', color: 'black', rookHome: squareToIndex('h8') },
  { right: 'blackQueenside', color: 'black', rookHome: squareToIndex('a8') },
] as const satisfies readonly {
  right: keyof CastlingRights;
  color: PieceColor;
  rookHome: number;
}[];

function other(color: PieceColor): PieceColor {
  return color === 'white' ? 'black' : 'white';
}

function updatedCastlingRights(
  state: GameState,
  piece: Piece,
  move: IndexedMove,
): CastlingRights {
  const rights: Record<keyof CastlingRights, boolean> = { ...state.castlingRights };
  for (const { right, color, rookHome } of CASTLING_RIGHT_SOURCES) {
    const kingMoved = piece.color === color && piece.type === 'king';
    const rookHomeTouched = move.from === rookHome || move.to === rookHome;
    if (kingMoved || rookHomeTouched) rights[right] = false;
  }
  return rights;
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
        if (to === undefined || rank + direction === promotionRank) continue;
        if (
          state.board[to]?.color === other(piece.color) &&
          state.board[to]?.type !== 'king'
        ) {
          moves.push({ from, to });
        } else if (
          state.enPassantTarget !== undefined &&
          to === squareToIndex(state.enPassantTarget) &&
          state.board[to] === undefined
        ) {
          // The en-passant target square is empty by definition, so the ordinary
          // capture branch above can never see it — the pawn being taken is
          // beside the destination rather than on it.
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

// A stepping attacker (knight, king) sits at a fixed offset. A sliding attacker
// (bishop, rook, queen) is found by walking until the first piece blocks. Both
// shapes appear twice in isSquareAttacked, so each is stated once here.
function isAttackedByStepper(
  state: GameState,
  origin: Coordinates,
  by: PieceColor,
  offsets: readonly (readonly [number, number])[],
  type: PieceType,
): boolean {
  for (const [fileOffset, rankOffset] of offsets) {
    const index = indexAt(origin.file + fileOffset, origin.rank + rankOffset);
    if (index === undefined) continue;
    const piece = state.board[index];
    if (piece?.color === by && piece.type === type) return true;
  }
  return false;
}

function isAttackedBySlider(
  state: GameState,
  origin: Coordinates,
  by: PieceColor,
  directions: readonly (readonly [number, number])[],
  slider: PieceType,
): boolean {
  for (const [fileStep, rankStep] of directions) {
    for (let distance = 1; ; distance++) {
      const index = indexAt(
        origin.file + fileStep * distance,
        origin.rank + rankStep * distance,
      );
      if (index === undefined) break;
      const piece = state.board[index];
      if (!piece) continue;
      if (piece.color === by && (piece.type === slider || piece.type === 'queen')) {
        return true;
      }
      break;
    }
  }
  return false;
}

export function isSquareAttacked(
  state: GameState,
  square: number,
  by: PieceColor,
): boolean {
  const origin = fromIndex(square);
  const pawnRank = origin.rank + (by === 'white' ? -1 : 1);
  for (const pawnFile of [origin.file - 1, origin.file + 1]) {
    const pawn = indexAt(pawnFile, pawnRank);
    if (pawn === undefined) continue;
    const piece = state.board[pawn];
    if (piece?.color === by && piece.type === 'pawn') return true;
  }

  return (
    isAttackedByStepper(state, origin, by, KNIGHT_OFFSETS, 'knight') ||
    isAttackedByStepper(state, origin, by, KING_OFFSETS, 'king') ||
    isAttackedBySlider(state, origin, by, BISHOP_DIRECTIONS, 'bishop') ||
    isAttackedBySlider(state, origin, by, ROOK_DIRECTIONS, 'rook')
  );
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
  const { file: fromFile, rank: fromRank } = fromIndex(move.from);
  const { file: toFile, rank: toRank } = fromIndex(move.to);

  // En-passant: pawn changes file onto an empty square — the captured pawn
  // sits on the same file as `to` and the same rank as `from`.
  if (isPawnMove && fromFile !== toFile && captured === undefined) {
    board[toIndex({ file: toFile, rank: fromRank })] = undefined;
  }
  const enPassantTarget =
    isPawnMove && Math.abs(toRank - fromRank) === 2
      ? indexToSquare(toIndex({ file: fromFile, rank: (fromRank + toRank) / 2 }))
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
  return { from: squareToIndex(move.from), to: squareToIndex(move.to) };
}
