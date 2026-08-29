import type { GameState } from './state';
import { toGameState } from './state';
import { fromIndex, squareToIndex } from './coordinates';
import { serializeFen } from './fen';
import { isInCheck, legalIndexedMoves } from './moves';
import type { Board, Game, GameStatus, PieceColor } from './types';

function other(color: PieceColor): PieceColor {
  return color === 'white' ? 'black' : 'white';
}

// En passant counts toward a position's identity only when a capture is
// actually available to the side to move, not merely because the FEN records a
// target square. FEN names a target after any double pawn push whether or not a
// pawn can answer it; two positions that differ only by an unusable target are
// the same position for repetition, so the target is dropped unless a legal en
// passant capture exists.
function availableEnPassant(state: GameState): string {
  const target = state.enPassantTarget;
  if (target === undefined) return '-';
  const targetIndex = squareToIndex(target);
  const canCapture = legalIndexedMoves(state).some(
    (move) =>
      move.to === targetIndex &&
      state.board[move.from]?.type === 'pawn' &&
      state.board[move.to] === undefined,
  );
  return canCapture ? target : '-';
}

// Two positions are the same for repetition only when the same side is to move,
// the same pieces stand on the same squares, and the same castling rights and
// en-passant possibilities exist. Piece placement alone is not enough. The
// half-move and full-move clocks are deliberately excluded — they never affect
// whether a position has recurred.
export function repetitionSignature(state: GameState): string {
  const [placement, side, castling] = serializeFen(state).split(' ');
  return `${placement} ${side} ${castling} ${availableEnPassant(state)}`;
}

// A state parsed from FEN carries no history, because the six FEN fields cannot
// hold one. Such a game starts counting afresh, with itself as the sole entry.
// This is the single place that rule is stated.
export function historyOf(state: GameState): readonly string[] {
  return state.positionHistory ?? [repetitionSignature(state)];
}

function isThreefoldRepetition(state: GameState): boolean {
  const history = historyOf(state);
  const current = history[history.length - 1];
  return history.filter((signature) => signature === current).length >= 3;
}

// The only material that can never force checkmate, so a draw is declared: a
// lone king, king and a single minor piece, or bishops that all stand on one
// colour of square — which covers king and bishop against king and bishop on
// the same colour, and a pair of same-coloured bishops on one side. A pawn,
// rook or queen — or any richer combination, two knights included — leaves mate
// possible and is not a draw here.
function isInsufficientMaterial(board: Board): boolean {
  const bishops: number[] = [];
  let knights = 0;
  for (let index = 0; index < board.length; index++) {
    const piece = board[index];
    if (!piece || piece.type === 'king') continue;
    if (piece.type === 'bishop') {
      const { file, rank } = fromIndex(index);
      bishops.push((file + rank) % 2);
    } else if (piece.type === 'knight') {
      knights += 1;
    } else {
      return false;
    }
  }
  const minors = knights + bishops.length;
  if (minors <= 1) return true; // K vs K, KN vs K, KB vs K
  if (knights === 0 && bishops.length === 2) {
    return bishops[0] === bishops[1]; // two bishops, all on one colour of square
  }
  return false;
}

// The whole verdict for a position. Order matters: a side with no legal move
// has either been mated or stalemated and the game is over before any draw by
// material, repetition or the clock is considered.
function classify(state: GameState): GameStatus {
  if (legalIndexedMoves(state).length === 0) {
    // Check is tested here, not assumed, so checkmate and stalemate are never
    // confused: same "no legal moves", opposite verdicts.
    if (isInCheck(state, state.sideToMove)) {
      return { kind: 'checkmate', winner: other(state.sideToMove) };
    }
    return { kind: 'draw', reason: 'stalemate' };
  }
  if (isInsufficientMaterial(state.board)) {
    return { kind: 'draw', reason: 'insufficient-material' };
  }
  // Auto-declared, like threefold below. FIDE makes the fifty-move rule
  // claim-based; Pass-and-Play has no player waiting to claim it, so the
  // referee declares it once a hundred half-moves (fifty full moves) pass with
  // no capture and no pawn move. applyIndexedMove resets this clock on either.
  if (state.halfmoveClock >= 100) {
    return { kind: 'draw', reason: 'fifty-move-rule' };
  }
  // Auto-declared without a claim, for the same Pass-and-Play reason as the
  // fifty-move rule above.
  if (isThreefoldRepetition(state)) {
    return { kind: 'draw', reason: 'threefold-repetition' };
  }
  return { kind: 'in-progress' };
}

export function gameStatus(game: Game): GameStatus {
  return classify(toGameState(game));
}
