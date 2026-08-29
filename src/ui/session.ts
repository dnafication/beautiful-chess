/**
 * The table session: the one `Game` two players share, plus the endings that
 * come by agreement rather than by rule, and the announcement each Player Edge
 * shows when the game is over.
 *
 * This is plain data logic with no React, no react-native-svg and no browser
 * globals, so it is unit-tested in plain Node (vitest collects `*.test.ts`
 * only). `./PlayerEdgesTable.tsx` holds one of these and renders whatever this
 * module reports.
 *
 * Two kinds of ending meet here. The rules module already detects every ending
 * that comes by rule — checkmate, stalemate, insufficient material, threefold
 * repetition and the fifty-move rule — and `gameStatus` reports them; this
 * module only announces that verdict, never re-derives it. Resignation and a
 * draw by agreement are different: they end the game by agreement, not by rule,
 * and ADR 0002 keeps the rules module a pure chess engine, so they are modelled
 * here on the session instead of in `../rules`. (Adding them to `applyMove`
 * would also be paid on every perft node.)
 */

import { createGame, gameStatus } from '../rules';
import type { Game, PieceColor } from '../rules';
import {
  colorForPlayerEdge,
  rotationForPlayerEdge,
  type PlayerEdge,
  type PlayerEdgeRotation,
} from './playerEdges';

/** An ending reached by agreement rather than by a rule of chess. */
export type AgreedOutcome =
  | { readonly kind: 'resignation'; readonly winner: PieceColor }
  | { readonly kind: 'draw-agreement' };

/**
 * The state of a draw offer: none standing, or one offered by a player and
 * waiting for the other to accept or decline. An accepted offer becomes an
 * `AgreedOutcome` and the offer returns to `none`; a declined one returns to
 * `none` with play continuing.
 */
export type DrawOffer =
  { readonly kind: 'none' } | { readonly kind: 'offered'; readonly by: PieceColor };

/** The one game two players share, with any agreed ending and pending offer. */
export interface TableSession {
  readonly game: Game;
  readonly outcome: AgreedOutcome | undefined;
  readonly drawOffer: DrawOffer;
}

/** The result of the game: in progress, decisively won, or drawn — with text. */
export type GameResult =
  | { readonly kind: 'in-progress' }
  | { readonly kind: 'decisive'; readonly winner: PieceColor; readonly text: string }
  | { readonly kind: 'drawn'; readonly text: string };

const NO_OFFER: DrawOffer = { kind: 'none' };

function other(color: PieceColor): PieceColor {
  return color === 'white' ? 'black' : 'white';
}

function colorLabel(color: PieceColor): string {
  return color === 'white' ? 'White' : 'Black';
}

/** A fresh table: the standard starting position, White to move, no result. */
export function createSession(game: Game = createGame()): TableSession {
  return { game, outcome: undefined, drawOffer: NO_OFFER };
}

/** A brand-new game, discarding whatever the previous session held. */
export function startNewGame(): TableSession {
  return createSession();
}

/**
 * Advances the session to `game` after a move is played, withdrawing any
 * pending draw offer: making a move answers a standing offer by declining it,
 * so a stale offer never lingers into the next position.
 */
export function withGame(session: TableSession, game: Game): TableSession {
  return { game, outcome: session.outcome, drawOffer: NO_OFFER };
}

/**
 * The session returned to play at `game`, with any agreed ending and pending
 * draw offer cleared. Taking back a resignation or an agreed draw is the only
 * way a session that ended by agreement can become playable again, since the
 * rules module never knew it had ended.
 */
export function returnToPlay(session: TableSession, game: Game): TableSession {
  return { game, outcome: undefined, drawOffer: NO_OFFER };
}

/**
 * The whole verdict for the session. A rule-based ending — read from
 * `gameStatus`, never re-derived — takes precedence; only when the position is
 * still in progress by the rules does an agreed outcome apply, because an
 * agreed ending can only be reached while the game is live.
 */
export function tableResult(session: TableSession): GameResult {
  const status = gameStatus(session.game);
  if (status.kind === 'checkmate') {
    return {
      kind: 'decisive',
      winner: status.winner,
      text: `${colorLabel(status.winner)} wins by checkmate`,
    };
  }
  if (status.kind === 'draw') {
    return { kind: 'drawn', text: `Drawn by ${DRAW_REASON_TEXT[status.reason]}` };
  }
  const { outcome } = session;
  if (outcome?.kind === 'resignation') {
    return {
      kind: 'decisive',
      winner: outcome.winner,
      text: `${colorLabel(outcome.winner)} wins by resignation`,
    };
  }
  if (outcome?.kind === 'draw-agreement') {
    return { kind: 'drawn', text: 'Drawn by agreement' };
  }
  return { kind: 'in-progress' };
}

const DRAW_REASON_TEXT = {
  stalemate: 'stalemate',
  'insufficient-material': 'insufficient material',
  'threefold-repetition': 'threefold repetition',
  'fifty-move-rule': 'the fifty-move rule',
} as const;

/** Whether the game has ended, by rule or by agreement. */
export function isSessionFinished(session: TableSession): boolean {
  return tableResult(session).kind !== 'in-progress';
}

/**
 * Records `color` resigning: the other player wins. A game already finished by
 * rule or agreement is returned untouched, since there is nothing to resign.
 */
export function resign(session: TableSession, color: PieceColor): TableSession {
  if (isSessionFinished(session)) {
    return session;
  }
  return {
    game: session.game,
    outcome: { kind: 'resignation', winner: other(color) },
    drawOffer: NO_OFFER,
  };
}

/**
 * Records `color` offering a draw. Ignored when the game is finished or an offer
 * already stands — only one offer is pending at a time.
 */
export function offerDraw(session: TableSession, color: PieceColor): TableSession {
  if (isSessionFinished(session) || session.drawOffer.kind === 'offered') {
    return session;
  }
  return { ...session, drawOffer: { kind: 'offered', by: color } };
}

/** Accepts a pending draw offer, drawing by agreement. Otherwise unchanged. */
export function acceptDraw(session: TableSession): TableSession {
  if (session.drawOffer.kind !== 'offered') {
    return session;
  }
  return { game: session.game, outcome: { kind: 'draw-agreement' }, drawOffer: NO_OFFER };
}

/** Declines a pending draw offer, so play continues. Otherwise unchanged. */
export function declineDraw(session: TableSession): TableSession {
  if (session.drawOffer.kind !== 'offered') {
    return session;
  }
  return { ...session, drawOffer: NO_OFFER };
}

/**
 * Starting a new game while a live game is in progress asks for confirmation
 * first, so a game is never lost to a mistap. From a finished game there is
 * nothing to lose, so a new game is one tap with no confirmation.
 */
export function newGameNeedsConfirmation(session: TableSession): boolean {
  return !isSessionFinished(session);
}

/** What a single Player Edge shows for a pending draw offer, facing its player. */
export type EdgeDrawOffer =
  | { readonly kind: 'none' }
  | { readonly kind: 'offered'; readonly rotation: PlayerEdgeRotation }
  | { readonly kind: 'respond'; readonly rotation: PlayerEdgeRotation };

/**
 * The draw-offer prompt one Player Edge shows: the offering player waits
 * (`offered`), the other player accepts or declines from their own edge
 * (`respond`), and every edge shows nothing when no offer stands or the game is
 * over. The rotation is the one `playerEdges` already computes, reused so both
 * belong to one scheme.
 */
export function drawOfferForPlayerEdge(
  session: TableSession,
  playerEdge: PlayerEdge,
): EdgeDrawOffer {
  if (session.drawOffer.kind !== 'offered' || isSessionFinished(session)) {
    return { kind: 'none' };
  }
  const rotation = rotationForPlayerEdge(playerEdge);
  const kind =
    colorForPlayerEdge(playerEdge) === session.drawOffer.by ? 'offered' : 'respond';
  return { kind, rotation };
}

/** The announcement one Player Edge shows, facing its player, or `undefined`. */
export interface EdgeResult {
  readonly text: string;
  readonly rotation: PlayerEdgeRotation;
}

/**
 * The result one Player Edge shows once the game is over, rotated to face its
 * own player so both read it upright at the same moment (ADR 0003: the board
 * itself still never rotates). `undefined` while the game is in progress.
 */
export function resultForPlayerEdge(
  session: TableSession,
  playerEdge: PlayerEdge,
): EdgeResult | undefined {
  const result = tableResult(session);
  if (result.kind === 'in-progress') {
    return undefined;
  }
  return { text: result.text, rotation: rotationForPlayerEdge(playerEdge) };
}
