import type { Board, CapturedPieces, Piece, PieceColor, PieceType } from './types';

const PIECE_VALUE: Readonly<Record<PieceType, number>> = {
  pawn: 1,
  knight: 3,
  bishop: 3,
  rook: 5,
  queen: 9,
  king: 0,
};

// Kings are excluded throughout: they are never captured and never leave the
// board. CAPTURABLE_TYPES is also the deterministic order captured lists are
// reported in, so the Tray (#15) has nothing to decide.
const CAPTURABLE_TYPES: readonly PieceType[] = [
  'pawn',
  'knight',
  'bishop',
  'rook',
  'queen',
];

// The full starting complement of one side.
const STARTING_COUNT: Readonly<Record<PieceType, number>> = {
  pawn: 8,
  knight: 2,
  bishop: 2,
  rook: 2,
  queen: 1,
  king: 0,
};

export function materialAdvantageOf(board: Board): number {
  let advantage = 0;
  for (const piece of board) {
    if (!piece) continue;
    const value = PIECE_VALUE[piece.type];
    advantage += piece.color === 'white' ? value : -value;
  }
  return advantage;
}

export function capturedPiecesOf(board: Board): CapturedPieces {
  return {
    byWhite: missingPieces(board, 'black'),
    byBlack: missingPieces(board, 'white'),
  };
}

// The pieces of `color` that have left the board, derived by comparing what
// stands against the starting complement. Promotions are accounted for so no
// phantom captured pawn is reported: every non-pawn piece beyond the starting
// count is a promoted pawn, and each one explains one absent pawn.
function missingPieces(board: Board, color: PieceColor): readonly Piece[] {
  const onBoard = countByType(board, color);

  let promotedPawns = 0;
  for (const type of CAPTURABLE_TYPES) {
    if (type === 'pawn') continue;
    promotedPawns += Math.max(0, onBoard[type] - STARTING_COUNT[type]);
  }

  const missing: Piece[] = [];
  for (const type of CAPTURABLE_TYPES) {
    let gone = STARTING_COUNT[type] - onBoard[type];
    if (type === 'pawn') gone -= promotedPawns;
    for (let i = 0; i < gone; i++) missing.push({ color, type });
  }
  return missing;
}

function countByType(board: Board, color: PieceColor): Record<PieceType, number> {
  const counts: Record<PieceType, number> = {
    pawn: 0,
    knight: 0,
    bishop: 0,
    rook: 0,
    queen: 0,
    king: 0,
  };
  for (const piece of board) {
    if (piece && piece.color === color) counts[piece.type]++;
  }
  return counts;
}
