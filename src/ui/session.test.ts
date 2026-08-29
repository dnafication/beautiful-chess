import { describe, expect, it } from 'vitest';
import { applyMove, createGame, createGameFromFen, sideToMove } from '../rules';
import {
  acceptDraw,
  createSession,
  declineDraw,
  drawOfferForPlayerEdge,
  isSessionFinished,
  newGameNeedsConfirmation,
  offerDraw,
  resign,
  resultForPlayerEdge,
  startNewGame,
  tableResult,
  withGame,
} from './session';

const FOOLS_MATE = 'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3';
const STALEMATE = 'k7/8/1Q6/8/8/8/8/7K b - - 0 1';
const KING_VS_KING = '8/8/4k3/8/8/4K3/8/8 w - - 0 1';
const FIFTY_MOVE = '8/8/4k3/8/8/4K3/8/R7 w - - 100 1';
const THREEFOLD_START = '1n2k1n1/8/8/8/8/8/8/1N2K1N1 w - - 0 1';

describe('a fresh session', () => {
  it('starts from the standard position with White to move and no result', () => {
    const session = createSession();
    expect(sideToMove(session.game)).toBe('white');
    expect(tableResult(session)).toEqual({ kind: 'in-progress' });
    expect(isSessionFinished(session)).toBe(false);
  });
});

describe('rule-based endings are announced, not re-derived', () => {
  it('announces checkmate naming the winner and how', () => {
    const session = createSession(createGameFromFen(FOOLS_MATE));
    expect(tableResult(session)).toEqual({
      kind: 'decisive',
      winner: 'black',
      text: 'Black wins by checkmate',
    });
    expect(isSessionFinished(session)).toBe(true);
  });

  it('announces a draw by stalemate and why', () => {
    const session = createSession(createGameFromFen(STALEMATE));
    expect(tableResult(session)).toEqual({
      kind: 'drawn',
      text: 'Drawn by stalemate',
    });
  });

  it('announces a draw by insufficient material', () => {
    const session = createSession(createGameFromFen(KING_VS_KING));
    expect(tableResult(session)).toEqual({
      kind: 'drawn',
      text: 'Drawn by insufficient material',
    });
  });

  it('announces a draw by the fifty-move rule', () => {
    const session = createSession(createGameFromFen(FIFTY_MOVE));
    expect(tableResult(session)).toEqual({
      kind: 'drawn',
      text: 'Drawn by the fifty-move rule',
    });
  });

  it('announces a draw by threefold repetition', () => {
    let game = createGameFromFen(THREEFOLD_START);
    const cycle = [
      { from: 'b1', to: 'c3' },
      { from: 'b8', to: 'c6' },
      { from: 'c3', to: 'b1' },
      { from: 'c6', to: 'b8' },
    ] as const;
    for (const move of cycle) game = applyMove(game, move);
    for (const move of cycle) game = applyMove(game, move);
    const session = createSession(game);
    expect(tableResult(session)).toEqual({
      kind: 'drawn',
      text: 'Drawn by threefold repetition',
    });
  });
});

describe('resignation is an ending by agreement, held on the session', () => {
  it('gives the win to the other player when one resigns', () => {
    const session = resign(createSession(), 'white');
    expect(tableResult(session)).toEqual({
      kind: 'decisive',
      winner: 'black',
      text: 'Black wins by resignation',
    });
    expect(isSessionFinished(session)).toBe(true);
  });

  it('lets Black resign in favour of White', () => {
    const session = resign(createSession(), 'black');
    expect(tableResult(session)).toEqual({
      kind: 'decisive',
      winner: 'white',
      text: 'White wins by resignation',
    });
  });

  it('does nothing once the game is already finished by rule', () => {
    const finished = createSession(createGameFromFen(FOOLS_MATE));
    expect(resign(finished, 'white')).toBe(finished);
  });
});

describe('a draw offer is a three-state affair', () => {
  it('offers, then the other player accepts, drawing by agreement', () => {
    const offered = offerDraw(createSession(), 'white');
    expect(offered.drawOffer).toEqual({ kind: 'offered', by: 'white' });
    expect(isSessionFinished(offered)).toBe(false);

    const drawn = acceptDraw(offered);
    expect(tableResult(drawn)).toEqual({
      kind: 'drawn',
      text: 'Drawn by agreement',
    });
    expect(drawn.drawOffer).toEqual({ kind: 'none' });
  });

  it('offers, then the other player declines, and play continues', () => {
    const offered = offerDraw(createSession(), 'black');
    const declined = declineDraw(offered);
    expect(declined.drawOffer).toEqual({ kind: 'none' });
    expect(tableResult(declined)).toEqual({ kind: 'in-progress' });
  });

  it('ignores a second offer while one is already pending', () => {
    const offered = offerDraw(createSession(), 'white');
    expect(offerDraw(offered, 'black')).toBe(offered);
  });

  it('ignores accept or decline when no offer stands', () => {
    const session = createSession();
    expect(acceptDraw(session)).toBe(session);
    expect(declineDraw(session)).toBe(session);
  });

  it('does not let a finished game be offered a draw', () => {
    const finished = createSession(createGameFromFen(STALEMATE));
    expect(offerDraw(finished, 'white')).toBe(finished);
  });

  it('withdraws a pending offer once a move is played', () => {
    const offered = offerDraw(createSession(), 'white');
    const advanced = withGame(offered, applyMove(offered.game, { from: 'e2', to: 'e4' }));
    expect(advanced.drawOffer).toEqual({ kind: 'none' });
    expect(sideToMove(advanced.game)).toBe('black');
  });
});

describe('the draw offer each Player Edge shows', () => {
  it('asks the offering player to wait and the other to respond', () => {
    const offered = offerDraw(createSession(), 'white');
    // White is on the near Player Edge, Black on the far one.
    expect(drawOfferForPlayerEdge(offered, 'near')).toEqual({
      kind: 'offered',
      rotation: '0deg',
    });
    expect(drawOfferForPlayerEdge(offered, 'far')).toEqual({
      kind: 'respond',
      rotation: '180deg',
    });
  });

  it('shows nothing on either edge when no offer stands', () => {
    const session = createSession();
    expect(drawOfferForPlayerEdge(session, 'near').kind).toBe('none');
    expect(drawOfferForPlayerEdge(session, 'far').kind).toBe('none');
  });

  it('shows nothing once the game is finished', () => {
    const drawn = acceptDraw(offerDraw(createSession(), 'white'));
    expect(drawOfferForPlayerEdge(drawn, 'near').kind).toBe('none');
    expect(drawOfferForPlayerEdge(drawn, 'far').kind).toBe('none');
  });
});

describe('the result shown on each Player Edge faces its own player', () => {
  it('shows the same text rotated to each seat', () => {
    const session = createSession(createGameFromFen(FOOLS_MATE));
    expect(resultForPlayerEdge(session, 'near')).toEqual({
      text: 'Black wins by checkmate',
      rotation: '0deg',
    });
    expect(resultForPlayerEdge(session, 'far')).toEqual({
      text: 'Black wins by checkmate',
      rotation: '180deg',
    });
  });

  it('shows nothing while the game is in progress', () => {
    const session = createSession();
    expect(resultForPlayerEdge(session, 'near')).toBeUndefined();
    expect(resultForPlayerEdge(session, 'far')).toBeUndefined();
  });
});

describe('starting a new game', () => {
  it('returns to the standard starting position with White to move', () => {
    const played = withGame(
      createSession(),
      applyMove(createGame(), { from: 'e2', to: 'e4' }),
    );
    const fresh = startNewGame();
    expect(sideToMove(fresh.game)).toBe('white');
    expect(tableResult(fresh)).toEqual({ kind: 'in-progress' });
    expect(played.game).not.toBe(fresh.game);
  });

  it('needs confirmation while a game is in progress', () => {
    expect(newGameNeedsConfirmation(createSession())).toBe(true);
  });

  it('needs no confirmation once the game has a result', () => {
    expect(newGameNeedsConfirmation(createSession(createGameFromFen(FOOLS_MATE)))).toBe(
      false,
    );
    expect(newGameNeedsConfirmation(resign(createSession(), 'white'))).toBe(false);
  });
});
