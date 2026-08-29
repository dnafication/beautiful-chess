import type { Coordinates } from './coordinates';
import {
  BOARD_SIZE,
  fromIndex,
  indexToSquare,
  squareToIndex,
  toIndex,
} from './coordinates';
import type { GameState } from './state';
import type {
  CastlingRights,
  Move,
  Piece,
  PieceColor,
  PieceType,
  PromotionPieceType,
} from './types';

interface IndexedMove {
  readonly from: number;
  readonly to: number;
  readonly promotion?: PromotionPieceType;
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
const PROMOTION_PIECES: readonly PromotionPieceType[] = [
  'queen',
  'rook',
  'bishop',
  'knight',
];
// Each castle stated once, and the only place the four castles are described.
// `mustBeEmpty` is the whole corridor between king and rook — queenside that
// includes b1/b8, which the rook crosses. `kingPath` is only the king's own
// squares: where it stands, what it crosses and where it lands. Keeping the two
// lists apart is what encodes FIDE 3.8's asymmetry, that the rook may pass
// through an attacked square and the king may not.
//
// A castling right is lost when its king moves, or when its rook's home square
// is vacated or captured on, so `updatedCastlingRights` reads `rookFrom` as the
// rook's home and this table serves that too.
const CASTLES = [
  {
    right: 'whiteKingside',
    color: 'white',
    kingFrom: squareToIndex('e1'),
    kingTo: squareToIndex('g1'),
    rookFrom: squareToIndex('h1'),
    rookTo: squareToIndex('f1'),
    mustBeEmpty: [squareToIndex('f1'), squareToIndex('g1')],
    kingPath: [squareToIndex('e1'), squareToIndex('f1'), squareToIndex('g1')],
  },
  {
    right: 'whiteQueenside',
    color: 'white',
    kingFrom: squareToIndex('e1'),
    kingTo: squareToIndex('c1'),
    rookFrom: squareToIndex('a1'),
    rookTo: squareToIndex('d1'),
    mustBeEmpty: [squareToIndex('b1'), squareToIndex('c1'), squareToIndex('d1')],
    kingPath: [squareToIndex('e1'), squareToIndex('d1'), squareToIndex('c1')],
  },
  {
    right: 'blackKingside',
    color: 'black',
    kingFrom: squareToIndex('e8'),
    kingTo: squareToIndex('g8'),
    rookFrom: squareToIndex('h8'),
    rookTo: squareToIndex('f8'),
    mustBeEmpty: [squareToIndex('f8'), squareToIndex('g8')],
    kingPath: [squareToIndex('e8'), squareToIndex('f8'), squareToIndex('g8')],
  },
  {
    right: 'blackQueenside',
    color: 'black',
    kingFrom: squareToIndex('e8'),
    kingTo: squareToIndex('c8'),
    rookFrom: squareToIndex('a8'),
    rookTo: squareToIndex('d8'),
    mustBeEmpty: [squareToIndex('b8'), squareToIndex('c8'), squareToIndex('d8')],
    kingPath: [squareToIndex('e8'), squareToIndex('d8'), squareToIndex('c8')],
  },
] as const satisfies readonly {
  right: keyof CastlingRights;
  color: PieceColor;
  kingFrom: number;
  kingTo: number;
  rookFrom: number;
  rookTo: number;
  mustBeEmpty: readonly number[];
  kingPath: readonly number[];
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
  for (const { right, color, rookFrom } of CASTLES) {
    const kingMoved = piece.color === color && piece.type === 'king';
    const rookHomeTouched = move.from === rookFrom || move.to === rookFrom;
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

function addPawnMove(
  moves: IndexedMove[],
  from: number,
  to: number,
  promotes: boolean,
): void {
  if (!promotes) {
    moves.push({ from, to });
    return;
  }
  for (const promotion of PROMOTION_PIECES) {
    moves.push({ from, to, promotion });
  }
}

// The square an en-passant capture actually takes from is beside the
// destination, not on it, so the pawn there has to be found before the capture
// can be offered.
function isEnemyPawn(
  state: GameState,
  index: number | undefined,
  color: PieceColor,
): boolean {
  if (index === undefined) return false;
  const piece = state.board[index];
  return piece?.type === 'pawn' && piece.color === other(color);
}

// Castling is generated here rather than left to the legality filter, because
// the filter only ever inspects the position after the move — it can see that
// the king landed in check, but not that it started there or crossed an
// attacked square on the way.
function addCastles(
  state: GameState,
  moves: IndexedMove[],
  from: number,
  color: PieceColor,
): void {
  for (const castle of CASTLES) {
    if (castle.color !== color || castle.kingFrom !== from) continue;
    if (!state.castlingRights[castle.right]) continue;

    // A right is only structurally validated in FEN, so a position can claim
    // one with no rook to exercise it. The rook is looked for, not assumed.
    const rook = state.board[castle.rookFrom];
    if (rook?.type !== 'rook' || rook.color !== color) continue;

    if (castle.mustBeEmpty.some((index) => state.board[index] !== undefined)) continue;
    const attacked = castle.kingPath.some((index) =>
      isSquareAttacked(state, index, other(color)),
    );
    if (attacked) continue;

    moves.push({ from: castle.kingFrom, to: castle.kingTo });
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
      if (oneStep !== undefined && state.board[oneStep] === undefined) {
        addPawnMove(moves, from, oneStep, rank + direction === promotionRank);
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
        if (to === undefined) continue;
        if (
          state.board[to]?.color === other(piece.color) &&
          state.board[to]?.type !== 'king'
        ) {
          addPawnMove(moves, from, to, rank + direction === promotionRank);
        } else if (
          state.enPassantTarget !== undefined &&
          to === squareToIndex(state.enPassantTarget) &&
          state.board[to] === undefined &&
          isEnemyPawn(state, indexAt(file + fileOffset, rank), piece.color)
        ) {
          // The en-passant target square is empty by definition, so the ordinary
          // capture branch above can never see it — the pawn being taken is
          // beside the destination rather than on it. That pawn is looked for
          // rather than assumed, because a position parsed from FEN carries its
          // en-passant field verbatim and may name a square with nothing beside
          // it to take.
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
      addCastles(state, moves, from, piece.color);
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
  board[move.to] =
    move.promotion === undefined ? piece : { color: piece.color, type: move.promotion };
  const isPawnMove = piece.type === 'pawn';
  const { file: fromFile, rank: fromRank } = fromIndex(move.from);
  const { file: toFile, rank: toRank } = fromIndex(move.to);

  // En-passant: pawn changes file onto an empty square — the captured pawn
  // sits on the same file as `to` and the same rank as `from`.
  if (isPawnMove && fromFile !== toFile && captured === undefined) {
    board[toIndex({ file: toFile, rank: fromRank })] = undefined;
  }

  // Castling: the same table that generated the move says where its rook goes,
  // so the geometry is stated once. A king is the only piece that can move two
  // files at once, which is what makes the lookup unambiguous.
  if (piece.type === 'king') {
    const castle = CASTLES.find(
      (candidate) => candidate.kingFrom === move.from && candidate.kingTo === move.to,
    );
    if (castle) {
      board[castle.rookTo] = board[castle.rookFrom];
      board[castle.rookFrom] = undefined;
    }
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
  return {
    from: indexToSquare(move.from),
    to: indexToSquare(move.to),
    ...(move.promotion === undefined ? {} : { promotion: move.promotion }),
  };
}

export function toIndexedMove(move: Move): IndexedMove {
  return {
    from: squareToIndex(move.from),
    to: squareToIndex(move.to),
    ...(move.promotion === undefined ? {} : { promotion: move.promotion }),
  };
}
