import type {
  Board,
  CastlingRights,
  Piece,
  PieceColor,
  PieceType,
  Square,
} from './types';
import { InvalidPositionError } from './types';
import type { GameState } from './state';
import { BOARD_SIZE, SQUARE_COUNT, toIndex, parseSquare } from './coordinates';

interface Codec<T> {
  readonly parse: (text: string) => T;
  readonly serialize: (value: T) => string;
}

// Piece letters stated once; reverse lookup derived from the same object.
const PIECE_LETTERS: Record<PieceType, string> = {
  pawn: 'p',
  knight: 'n',
  bishop: 'b',
  rook: 'r',
  queen: 'q',
  king: 'k',
};

const LETTER_TO_TYPE: Record<string, PieceType> = Object.fromEntries(
  Object.entries(PIECE_LETTERS).map(([type, letter]) => [letter, type as PieceType]),
);

function pieceToChar(piece: Piece): string {
  const ch = PIECE_LETTERS[piece.type];
  return piece.color === 'white' ? ch.toUpperCase() : ch;
}

function charToPiece(ch: string, rankName: number): Piece {
  const lower = ch.toLowerCase();
  const type = LETTER_TO_TYPE[lower];
  if (!type)
    throw new InvalidPositionError(`Invalid piece letter '${ch}' at rank ${rankName}`);
  return { color: ch === lower ? 'black' : 'white', type };
}

function parseRank(text: string, rankName: number): Board {
  const cells: (Piece | undefined)[] = [];
  for (const ch of text) {
    if (ch >= '1' && ch <= '8') {
      const count = parseInt(ch, 10);
      for (let i = 0; i < count; i++) cells.push(undefined);
    } else {
      cells.push(charToPiece(ch, rankName));
    }
  }
  if (cells.length !== BOARD_SIZE) {
    throw new InvalidPositionError(
      `Rank ${rankName} sums to ${cells.length} squares, expected ${BOARD_SIZE}`,
    );
  }
  return cells;
}

function serializeRank(cells: Board): string {
  let result = '';
  let empty = 0;
  for (const cell of cells) {
    if (cell === undefined) {
      empty++;
    } else {
      if (empty > 0) {
        result += empty;
        empty = 0;
      }
      result += pieceToChar(cell);
    }
  }
  if (empty > 0) result += empty;
  return result;
}

// Placement codec — maps over 8 ranks.
// FEN lists rank 8 first; our board array counts from a1 (index 0) upward.
// The reversal here is the single place that aligns those two orderings.
const placementCodec: Codec<Board> = {
  parse(text: string): Board {
    const rankStrings = text.split('/');
    if (rankStrings.length !== BOARD_SIZE) {
      throw new InvalidPositionError(
        `FEN piece placement must have ${BOARD_SIZE} ranks, got ${rankStrings.length}`,
      );
    }
    const board: (Piece | undefined)[] = new Array(SQUARE_COUNT).fill(undefined);
    for (let fenRankIdx = 0; fenRankIdx < BOARD_SIZE; fenRankIdx++) {
      const boardRank = BOARD_SIZE - 1 - fenRankIdx; // 7 down to 0
      const rankName = boardRank + 1; // 8 down to 1 (for error messages)
      const cells = parseRank(rankStrings[fenRankIdx], rankName);
      for (let file = 0; file < BOARD_SIZE; file++) {
        board[toIndex({ file, rank: boardRank })] = cells[file];
      }
    }
    return board;
  },

  serialize(board: Board): string {
    const rankStrings: string[] = [];
    // Emit rank 8 first — the reversal of the array's ascending order.
    for (let boardRank = BOARD_SIZE - 1; boardRank >= 0; boardRank--) {
      const start = toIndex({ file: 0, rank: boardRank });
      rankStrings.push(serializeRank(board.slice(start, start + BOARD_SIZE)));
    }
    return rankStrings.join('/');
  },
};

const sideToMoveCodec: Codec<PieceColor> = {
  parse(text: string): PieceColor {
    if (text === 'w') return 'white';
    if (text === 'b') return 'black';
    throw new InvalidPositionError(`Invalid side-to-move token '${text}'`);
  },
  serialize(color: PieceColor): string {
    return color === 'white' ? 'w' : 'b';
  },
};

// Char↔key correspondence stated once; both parse and serialize read this table.
const CASTLING_FLAGS = [
  ['K', 'whiteKingside'],
  ['Q', 'whiteQueenside'],
  ['k', 'blackKingside'],
  ['q', 'blackQueenside'],
] as const;

const castlingRightsCodec: Codec<CastlingRights> = {
  parse(text: string): CastlingRights {
    if (!/^(-|[KQkq]+)$/.test(text)) {
      throw new InvalidPositionError(`Invalid castling string '${text}'`);
    }
    const rights = {} as Record<keyof CastlingRights, boolean>;
    for (const [ch, key] of CASTLING_FLAGS) rights[key] = text.includes(ch);
    return rights;
  },
  serialize(rights: CastlingRights): string {
    const s = CASTLING_FLAGS.filter(([, key]) => rights[key])
      .map(([ch]) => ch)
      .join('');
    return s === '' ? '-' : s;
  },
};

const enPassantCodec: Codec<Square | undefined> = {
  parse(text: string): Square | undefined {
    if (text === '-') return undefined;
    const sq = parseSquare(text);
    if (!sq) throw new InvalidPositionError(`Invalid en-passant square '${text}'`);
    return sq;
  },
  serialize(sq: Square | undefined): string {
    return sq ?? '-';
  },
};

function clockCodec(name: string): Codec<number> {
  return {
    parse(text: string): number {
      if (!/^\d+$/.test(text)) {
        throw new InvalidPositionError(
          `${name} must be a non-negative integer, got '${text}'`,
        );
      }
      return parseInt(text, 10);
    },
    serialize(n: number): string {
      return String(n);
    },
  };
}

const halfmoveClockCodec = clockCodec('Halfmove clock');
const fullmoveNumberCodec = clockCodec('Fullmove number');

function validateKingsPresent(board: Board): void {
  const hasWhiteKing = board.some((p) => p?.color === 'white' && p?.type === 'king');
  const hasBlackKing = board.some((p) => p?.color === 'black' && p?.type === 'king');
  if (!hasWhiteKing) throw new InvalidPositionError('Position has no white king');
  if (!hasBlackKing) throw new InvalidPositionError('Position has no black king');
}

export function parseFen(fen: string): GameState {
  const parts = fen.trim().split(/\s+/);
  if (parts.length !== 6) {
    throw new InvalidPositionError(`FEN must have exactly 6 fields, got ${parts.length}`);
  }
  const [placement, sideStr, castlingStr, epStr, halfStr, fullStr] = parts;
  const board = placementCodec.parse(placement);
  const sideToMove = sideToMoveCodec.parse(sideStr);
  const castlingRights = castlingRightsCodec.parse(castlingStr);
  const enPassantTarget = enPassantCodec.parse(epStr);
  const halfmoveClock = halfmoveClockCodec.parse(halfStr);
  const fullmoveNumber = fullmoveNumberCodec.parse(fullStr);
  validateKingsPresent(board);
  return {
    board,
    sideToMove,
    castlingRights,
    enPassantTarget,
    halfmoveClock,
    fullmoveNumber,
  };
}

export function serializeFen(state: GameState): string {
  return [
    placementCodec.serialize(state.board),
    sideToMoveCodec.serialize(state.sideToMove),
    castlingRightsCodec.serialize(state.castlingRights),
    enPassantCodec.serialize(state.enPassantTarget),
    halfmoveClockCodec.serialize(state.halfmoveClock),
    fullmoveNumberCodec.serialize(state.fullmoveNumber),
  ].join(' ');
}
