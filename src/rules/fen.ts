import type { CastlingRights, Piece, PieceColor, Square } from './types';
import { InvalidPositionError } from './types';
import type { GameState } from './state';

const FILES = 'abcdefgh';
const RANKS = '12345678';

function isSquare(s: string): s is Square {
  return s.length === 2 && FILES.includes(s[0]) && RANKS.includes(s[1]);
}

function fileIndex(f: string): number {
  return FILES.indexOf(f);
}

function parsePiecePlacement(placement: string): readonly (Piece | undefined)[] {
  const board: (Piece | undefined)[] = new Array(64).fill(undefined);
  const ranks = placement.split('/');
  if (ranks.length !== 8) {
    throw new InvalidPositionError(
      `FEN piece placement must have 8 ranks, got ${ranks.length}`,
    );
  }
  // FEN rank 8 (index 0 in split) maps to rank 8 (board rows 56-63)
  for (let rankIdx = 0; rankIdx < 8; rankIdx++) {
    const rank = 8 - rankIdx; // rank 8 down to 1
    const rankStr = ranks[rankIdx];
    let file = 0;
    for (const ch of rankStr) {
      if (file >= 8) {
        throw new InvalidPositionError(`Rank ${rank} exceeds 8 squares`);
      }
      if (ch >= '1' && ch <= '8') {
        file += parseInt(ch, 10);
      } else {
        const piece = charToPiece(ch, rank);
        const idx = (rank - 1) * 8 + file;
        board[idx] = piece;
        file++;
      }
    }
    if (file !== 8) {
      throw new InvalidPositionError(`Rank ${rank} sums to ${file} squares, expected 8`);
    }
  }
  return board;
}

function charToPiece(ch: string, rank: number): Piece {
  const lower = ch.toLowerCase();
  const color: PieceColor = ch === lower ? 'black' : 'white';
  const typeMap: Record<string, Piece['type']> = {
    p: 'pawn',
    n: 'knight',
    b: 'bishop',
    r: 'rook',
    q: 'queen',
    k: 'king',
  };
  const type = typeMap[lower];
  if (!type) {
    throw new InvalidPositionError(`Invalid piece letter '${ch}' at rank ${rank}`);
  }
  return { color, type };
}

function parseCastling(s: string): CastlingRights {
  if (!/^(-|[KQkq]+)$/.test(s)) {
    throw new InvalidPositionError(`Invalid castling string '${s}'`);
  }
  // Ensure no duplicate or unknown chars
  const valid = new Set(['K', 'Q', 'k', 'q', '-']);
  for (const c of s) {
    if (!valid.has(c)) {
      throw new InvalidPositionError(`Invalid castling character '${c}'`);
    }
  }
  return {
    whiteKingside: s.includes('K'),
    whiteQueenside: s.includes('Q'),
    blackKingside: s.includes('k'),
    blackQueenside: s.includes('q'),
  };
}

function parseSideToMove(s: string): PieceColor {
  if (s === 'w') return 'white';
  if (s === 'b') return 'black';
  throw new InvalidPositionError(`Invalid side-to-move token '${s}'`);
}

function parseEnPassant(s: string): Square | undefined {
  if (s === '-') return undefined;
  if (!isSquare(s)) {
    throw new InvalidPositionError(`Invalid en-passant square '${s}'`);
  }
  return s as Square;
}

function parseClock(s: string, name: string): number {
  if (!/^\d+$/.test(s)) {
    throw new InvalidPositionError(`${name} must be a non-negative integer, got '${s}'`);
  }
  return parseInt(s, 10);
}

function validateKingsPresent(board: readonly (Piece | undefined)[]): void {
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
  const board = parsePiecePlacement(placement);
  const sideToMove = parseSideToMove(sideStr);
  const castlingRights = parseCastling(castlingStr);
  const enPassantTarget = parseEnPassant(epStr);
  const halfmoveClock = parseClock(halfStr, 'Halfmove clock');
  const fullmoveNumber = parseClock(fullStr, 'Fullmove number');
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

function pieceToChar(piece: Piece): string {
  const map: Record<Piece['type'], string> = {
    pawn: 'p',
    knight: 'n',
    bishop: 'b',
    rook: 'r',
    queen: 'q',
    king: 'k',
  };
  const ch = map[piece.type];
  return piece.color === 'white' ? ch.toUpperCase() : ch;
}

export function serializeFen(state: GameState): string {
  // Build placement: rank 8 first
  const rankStrs: string[] = [];
  for (let rank = 8; rank >= 1; rank--) {
    let rankStr = '';
    let empty = 0;
    for (let f = 0; f < 8; f++) {
      const idx = (rank - 1) * 8 + f;
      const piece = state.board[idx];
      if (piece === undefined) {
        empty++;
      } else {
        if (empty > 0) {
          rankStr += empty;
          empty = 0;
        }
        rankStr += pieceToChar(piece);
      }
    }
    if (empty > 0) rankStr += empty;
    rankStrs.push(rankStr);
  }
  const placement = rankStrs.join('/');
  const side = state.sideToMove === 'white' ? 'w' : 'b';
  const cr = state.castlingRights;
  let castling = '';
  if (cr.whiteKingside) castling += 'K';
  if (cr.whiteQueenside) castling += 'Q';
  if (cr.blackKingside) castling += 'k';
  if (cr.blackQueenside) castling += 'q';
  if (castling === '') castling = '-';
  const ep = state.enPassantTarget ?? '-';
  return `${placement} ${side} ${castling} ${ep} ${state.halfmoveClock} ${state.fullmoveNumber}`;
}

export function squareToIndex(square: Square): number {
  const f = fileIndex(square[0]);
  const r = parseInt(square[1], 10);
  return (r - 1) * 8 + f;
}
