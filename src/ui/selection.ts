/**
 * The selection state machine that turns taps and drags into chess moves.
 *
 * This is plain data logic with no React, no react-native-svg and no browser
 * globals, so it is unit-tested in plain Node (vitest collects `*.test.ts`
 * only). The `.tsx` board renders whatever this module reports and calls back
 * in; it holds no rules knowledge of its own.
 *
 * One selection model serves both input methods. Tap-then-tap and dragging
 * both grab a piece with `selectionFor` and settle on a destination with
 * `tapSquare`, so the two are one behaviour with two triggers rather than two
 * parallel implementations.
 *
 * The rules module is the only referee. Every destination shown and every move
 * played comes from `legalDestinations` / `legalMoves`, so an illegal move is
 * impossible here rather than merely discouraged.
 */

import {
  applyMove,
  enPassantTarget,
  gameStatus,
  isCheck,
  legalDestinations,
  pieceAt,
  sideToMove,
} from '../rules';
import type { File, Game, Move, Piece, Rank, Square } from '../rules';
import { promotionPrompt } from './promotion';
import type { PromotionPrompt } from './promotion';

const FILES: readonly File[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS: readonly Rank[] = ['1', '2', '3', '4', '5', '6', '7', '8'];

const ALL_SQUARES: readonly Square[] = RANKS.flatMap((rank) =>
  FILES.map((file): Square => `${file}${rank}`),
);

/** A square a selected piece may move to, and whether landing there captures. */
export interface Destination {
  readonly square: Square;
  readonly isCapture: boolean;
}

/** A picked-up piece and every square it may legally reach. */
export interface Selection {
  readonly from: Square;
  readonly destinations: readonly Destination[];
}

/** Two squares a single move relocates a piece between (e.g. king and rook). */
export interface Relocation {
  readonly from: Square;
  readonly to: Square;
}

/**
 * What a tap resolves to given the current selection. `select` sets or switches
 * the picked-up piece, `move` plays a legal move, `promote` lands a pawn on the
 * far rank and hands off to the promotion picker for the piece it becomes,
 * `clear` puts the piece back down, and `none` is a tap that changes nothing.
 */
export type TapOutcome =
  | { readonly kind: 'select'; readonly selection: Selection }
  | { readonly kind: 'move'; readonly move: Move }
  | { readonly kind: 'promote'; readonly prompt: PromotionPrompt }
  | { readonly kind: 'clear' }
  | { readonly kind: 'none' };

// A drawn or decided game accepts no move, and some of them still have legal
// moves to offer: king and bishop against king is drawn by insufficient
// material while the bishop can still move. Offering a destination the rules
// module will then refuse is how a tap becomes a crash, so a finished game
// offers nothing and every tap merely puts the pieces down.
function isFinished(game: Game): boolean {
  return gameStatus(game).kind !== 'in-progress';
}

function isCaptureMove(game: Game, from: Square, to: Square): boolean {
  if (pieceAt(game, to) !== undefined) {
    return true;
  }
  // En passant lands on an empty square yet still captures.
  const piece = pieceAt(game, from);
  return piece?.type === 'pawn' && to === enPassantTarget(game);
}

/**
 * Picks up the piece on `square`, or returns `undefined` when the square is
 * empty or holds the opponent's piece. A player can never grab a piece that is
 * not theirs to move.
 */
export function selectionFor(game: Game, square: Square): Selection | undefined {
  if (isFinished(game)) {
    return undefined;
  }
  const piece = pieceAt(game, square);
  if (piece === undefined || piece.color !== sideToMove(game)) {
    return undefined;
  }
  const destinations = legalDestinations(game, square).map((to): Destination => ({
    square: to,
    isCapture: isCaptureMove(game, square, to),
  }));
  return { from: square, destinations };
}

/**
 * Resolves a tap on `square` against the current selection into an outcome the
 * board can act on. With nothing selected a tap only picks up one of the
 * player's own pieces. With a piece selected: tapping it again clears it,
 * tapping a legal destination plays the move — or, when that move lands a pawn
 * on the far rank, hands off to the promotion picker rather than choosing a
 * piece for the player — tapping another of the player's pieces switches
 * selection directly, and anything else is left untouched.
 */
export function tapSquare(
  game: Game,
  selection: Selection | undefined,
  square: Square,
): TapOutcome {
  if (isFinished(game)) {
    return selection === undefined ? { kind: 'none' } : { kind: 'clear' };
  }
  if (selection === undefined) {
    const picked = selectionFor(game, square);
    return picked === undefined
      ? { kind: 'none' }
      : { kind: 'select', selection: picked };
  }
  if (square === selection.from) {
    return { kind: 'clear' };
  }
  if (selection.destinations.some((destination) => destination.square === square)) {
    // The prompt is built here rather than merely detected, so the picker uses
    // the very prompt this outcome was decided by instead of deriving a second
    // one that could disagree with it.
    const prompt = promotionPrompt(game, selection.from, square);
    return prompt !== undefined
      ? { kind: 'promote', prompt }
      : { kind: 'move', move: { from: selection.from, to: square } };
  }
  const switched = selectionFor(game, square);
  return switched === undefined
    ? { kind: 'none' }
    : { kind: 'select', selection: switched };
}

/** The square of the checked king, or `undefined` when nobody is in check. */
export function checkedKingSquare(game: Game): Square | undefined {
  if (!isCheck(game)) {
    return undefined;
  }
  const color = sideToMove(game);
  return ALL_SQUARES.find((square) => {
    const piece = pieceAt(game, square);
    return piece?.type === 'king' && piece.color === color;
  });
}

/**
 * The from/to pairs a move relocates a piece between, computed by diffing the
 * position before and after. Most moves relocate one piece; castling relocates
 * the king and the rook, so animation must not assume one piece per move.
 */
// Two squares hold the same thing only when the colour matches as well as the
// type. Comparing types alone makes a pawn taking a pawn look like no change at
// all, which is the most ordinary capture in chess.
function samePiece(left: Piece | undefined, right: Piece | undefined): boolean {
  if (left === undefined || right === undefined) return left === right;
  return left.color === right.color && left.type === right.type;
}

export function moveRelocations(game: Game, move: Move): readonly Relocation[] {
  const after = applyMove(game, move);
  const departures: Square[] = [];
  const arrivals: Square[] = [];

  for (const square of ALL_SQUARES) {
    const before = pieceAt(game, square);
    const now = pieceAt(after, square);
    if (before !== undefined && !samePiece(before, now)) {
      departures.push(square);
    }
    if (now !== undefined && !samePiece(before, now)) {
      arrivals.push(square);
    }
  }

  const relocations: Relocation[] = [];
  const unmatchedDepartures = new Set(departures);

  const claim = (matches: (from: Square) => boolean, to: Square): boolean => {
    for (const from of unmatchedDepartures) {
      if (matches(from)) {
        unmatchedDepartures.delete(from);
        relocations.push({ from, to });
        return true;
      }
    }
    return false;
  };

  // Pair each arrival with the departure of a same-coloured, same-typed piece
  // first (king with king, rook with rook), then fall back to colour alone so a
  // promoting pawn still pairs with the piece it became.
  for (const to of arrivals) {
    const arrived = pieceAt(after, to);
    if (arrived === undefined) {
      continue;
    }
    const paired = claim((from) => {
      const left = pieceAt(game, from);
      return left?.color === arrived.color && left.type === arrived.type;
    }, to);
    if (!paired) {
      claim((from) => pieceAt(game, from)?.color === arrived.color, to);
    }
  }

  return relocations;
}
