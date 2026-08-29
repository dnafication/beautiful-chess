import React, { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { applyMove, isCheck, sideToMove } from '../rules';
import type { Game, Move, Piece, PieceColor, PromotionPieceType, Square } from '../rules';
import { Board } from './Board';
import { PieceGlyph } from './pieces/PieceGlyph';
import {
  calculatePlayerEdgesLayout,
  playerEdgeCheckText,
  playerEdgePresentation,
  rotationForPlayerEdge,
  type PlayerEdge,
} from './playerEdges';
import { promotionChoice } from './promotion';
import type { PromotionPrompt } from './promotion';
import { PromotionPicker } from './PromotionPicker';
import { moveRelocations, selectionFor, tapSquare } from './selection';
import type { Relocation, Selection } from './selection';
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
  withGame,
} from './session';
import type { TableSession } from './session';
import { trayGlyphMetrics, trayPresentation } from './tray';
import { applyUndo, undoControlPresentation } from './undo';

function colorLabel(color: PieceColor): string {
  return color === 'white' ? 'White' : 'Black';
}

interface Arrival {
  readonly relocations: readonly Relocation[];
  readonly nonce: number;
}

/**
 * Owns the one `Game`, so the turn indicator and the check notice read the real
 * side to move from the rules module rather than a private copy. Both input
 * methods drive the same selection model in `./selection`; this component only
 * applies what that model resolves and re-renders.
 */
export function PlayerEdgesTable(): React.ReactElement {
  const viewport = useWindowDimensions();
  const layout = calculatePlayerEdgesLayout(viewport);
  const [session, setSession] = useState<TableSession>(() => createSession());
  const [selection, setSelection] = useState<Selection | undefined>(undefined);
  const [lastMove, setLastMove] = useState<Move | undefined>(undefined);
  const [arrival, setArrival] = useState<Arrival | undefined>(undefined);
  const [promotion, setPromotion] = useState<PromotionPrompt | undefined>(undefined);
  // The Player Edge that asked for a new game while one was still in progress,
  // held so the confirmation faces the seat that tapped. `undefined` means no
  // confirmation is pending.
  const [confirmingNewGame, setConfirmingNewGame] = useState<PlayerEdge | undefined>(
    undefined,
  );
  const nonce = useRef(0);

  const game = session.game;
  const finished = isSessionFinished(session);
  const activeColor = sideToMove(game);
  const inCheck = isCheck(game);

  const playMove = useCallback((currentGame: Game, move: Move, animate: boolean) => {
    const relocations = moveRelocations(currentGame, move);
    setSession((current) => withGame(current, applyMove(currentGame, move)));
    setLastMove(move);
    setSelection(undefined);
    if (animate) {
      nonce.current += 1;
      setArrival({ relocations, nonce: nonce.current });
    } else {
      setArrival(undefined);
    }
  }, []);

  const beginNewGame = useCallback(() => {
    setSession(startNewGame());
    setSelection(undefined);
    setLastMove(undefined);
    setArrival(undefined);
    setPromotion(undefined);
    setConfirmingNewGame(undefined);
  }, []);

  const handleNewGame = useCallback(
    (playerEdge: PlayerEdge) => {
      if (newGameNeedsConfirmation(session)) {
        setConfirmingNewGame(playerEdge);
      } else {
        beginNewGame();
      }
    },
    [session, beginNewGame],
  );

  const handleResign = useCallback((color: PieceColor) => {
    setSelection(undefined);
    setSession((current) => resign(current, color));
  }, []);

  const handleOfferDraw = useCallback((color: PieceColor) => {
    setSession((current) => offerDraw(current, color));
  }, []);

  const handleAcceptDraw = useCallback(() => {
    setSelection(undefined);
    setSession((current) => acceptDraw(current));
  }, []);

  const handleDeclineDraw = useCallback(() => {
    setSession((current) => declineDraw(current));
  }, []);

  const handleTapSquare = useCallback(
    (square: Square) => {
      // An agreed ending — resignation or a draw by agreement — leaves the
      // rules module still reporting the game in progress, so the board is held
      // fast here rather than by the rules. A rule-based ending is refused by
      // `tapSquare` itself.
      if (finished) {
        return;
      }
      const outcome = tapSquare(game, selection, square);
      switch (outcome.kind) {
        case 'select':
          setSelection(outcome.selection);
          break;
        case 'clear':
          setSelection(undefined);
          break;
        case 'move':
          playMove(game, outcome.move, true);
          break;
        case 'promote':
          // Nothing is applied yet: the pawn stays put and the picker decides
          // the piece before the one move is played.
          setSelection(undefined);
          setPromotion(outcome.prompt);
          break;
        case 'none':
          break;
      }
    },
    [finished, game, selection, playMove],
  );

  const handleDropMove = useCallback(
    (from: Square, to: Square) => {
      if (finished) {
        return;
      }
      const outcome = tapSquare(game, selectionFor(game, from), to);
      if (outcome.kind === 'move') {
        // The drag already carried the piece to its square, so a settling
        // animation from the origin would read as a backward jump.
        playMove(game, outcome.move, false);
      } else if (outcome.kind === 'promote') {
        setPromotion(outcome.prompt);
      }
      setSelection(undefined);
    },
    [finished, game, playMove],
  );

  const handleChoosePromotion = useCallback(
    (piece: PromotionPieceType) => {
      if (promotion === undefined) {
        return;
      }
      playMove(game, promotionChoice(promotion, piece), true);
      setPromotion(undefined);
    },
    [game, promotion, playMove],
  );

  // Undo steps the whole game back one move (rules module), so it may pull the
  // board out from under a selected piece or an open promotion prompt. Both are
  // dropped so nothing lingers over a position that no longer exists, and the
  // last-move highlight and arrival animation clear with them.
  const handleUndo = useCallback(() => {
    const result = applyUndo(session);
    if (!result.changed) {
      return;
    }
    setSession(result.session);
    setSelection(undefined);
    setPromotion(undefined);
    setLastMove(undefined);
    setArrival(undefined);
  }, [session]);

  const renderPlayerEdge = (playerEdge: PlayerEdge) => {
    const presentation = playerEdgePresentation(playerEdge, activeColor);
    const checkText = playerEdgeCheckText(presentation.state, inCheck);
    const undoControl = undoControlPresentation(session, playerEdge);
    const edgeResult = resultForPlayerEdge(session, playerEdge);
    const edgeDrawOffer = drawOfferForPlayerEdge(session, playerEdge);
    const tray = trayPresentation(game, playerEdge);
    const trayMetrics = trayGlyphMetrics(
      tray.captured.length,
      layout.boardSize,
      Math.round(layout.playerEdgeThickness * 0.22),
    );
    const trayDescription =
      tray.captured.length === 0
        ? 'Tray empty'
        : `Tray: ${tray.captured.length} captured`;
    const materialDescription =
      tray.materialAdvantageText === undefined
        ? undefined
        : `Material Advantage ${tray.materialAdvantageText}`;
    const label = [
      `${colorLabel(presentation.color)} Player Edge`,
      edgeResult?.text,
      edgeResult === undefined ? presentation.turnText : undefined,
      checkText,
      trayDescription,
      materialDescription,
    ]
      .filter((part) => part !== undefined)
      .join(', ');

    return (
      <View
        accessibilityLabel={label}
        key={playerEdge}
        style={[
          styles.playerEdge,
          {
            height: layout.playerEdgeThickness,
            opacity: finished ? 1 : presentation.opacity,
            width: layout.playerEdgeWidth,
          },
          finished
            ? styles.finishedPlayerEdge
            : presentation.state === 'active'
              ? styles.activePlayerEdge
              : styles.waitingPlayerEdge,
        ]}
      >
        <View
          style={[
            styles.playerEdgeContents,
            { transform: [{ rotate: presentation.rotation }] },
          ]}
        >
          <Text style={styles.colorText}>{colorLabel(presentation.color)}</Text>
          <Text
            style={[
              styles.turnText,
              presentation.state === 'active'
                ? styles.activeTurnText
                : styles.waitingTurnText,
            ]}
          >
            {presentation.turnText}
          </Text>
          {checkText !== undefined && <Text style={styles.checkText}>{checkText}</Text>}
          <View style={styles.trayRow}>
            {tray.materialAdvantageText !== undefined && (
              <Text style={styles.materialAdvantageText}>
                {tray.materialAdvantageText}
              </Text>
            )}
            <View style={styles.trayGlyphs}>
              {tray.captured.map((piece: Piece, index: number) => (
                <View
                  key={index}
                  style={{
                    marginLeft:
                      index === 0 ? 0 : trayMetrics.step - trayMetrics.glyphSize,
                  }}
                >
                  <PieceGlyph piece={piece} size={trayMetrics.glyphSize} />
                </View>
              ))}
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={undoControl.label}
            accessibilityState={{ disabled: !undoControl.available }}
            disabled={!undoControl.available}
            onPress={handleUndo}
            style={({ pressed }) => [
              styles.undoControl,
              undoControl.available
                ? styles.undoControlAvailable
                : styles.undoControlUnavailable,
              pressed && undoControl.available && styles.undoControlPressed,
            ]}
          >
            <Text
              style={[
                styles.undoControlText,
                undoControl.available
                  ? styles.undoControlTextAvailable
                  : styles.undoControlTextUnavailable,
              ]}
            >
              {undoControl.label}
            </Text>
          </Pressable>
          {edgeResult !== undefined ? (
            <View style={styles.controls}>
              <Text style={styles.resultText}>{edgeResult.text}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="New game"
                onPress={() => handleNewGame(playerEdge)}
                style={({ pressed }) => [
                  styles.control,
                  styles.primaryControl,
                  pressed && styles.controlPressed,
                ]}
              >
                <Text style={styles.primaryControlText}>New game</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.controls}>
              {edgeDrawOffer.kind === 'respond' && (
                <>
                  <Text style={styles.offerText}>Draw offered</Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Accept draw"
                    onPress={handleAcceptDraw}
                    style={({ pressed }) => [
                      styles.control,
                      pressed && styles.controlPressed,
                    ]}
                  >
                    <Text style={styles.controlText}>Accept</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Decline draw"
                    onPress={handleDeclineDraw}
                    style={({ pressed }) => [
                      styles.control,
                      pressed && styles.controlPressed,
                    ]}
                  >
                    <Text style={styles.controlText}>Decline</Text>
                  </Pressable>
                </>
              )}
              {edgeDrawOffer.kind === 'offered' && (
                <Text style={styles.offerText}>Draw offered</Text>
              )}
              {edgeDrawOffer.kind === 'none' && (
                <>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Offer draw"
                    onPress={() => handleOfferDraw(presentation.color)}
                    style={({ pressed }) => [
                      styles.control,
                      pressed && styles.controlPressed,
                    ]}
                  >
                    <Text style={styles.controlText}>Offer draw</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Resign"
                    onPress={() => handleResign(presentation.color)}
                    style={({ pressed }) => [
                      styles.control,
                      pressed && styles.controlPressed,
                    ]}
                  >
                    <Text style={styles.controlText}>Resign</Text>
                  </Pressable>
                </>
              )}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="New game"
                onPress={() => handleNewGame(playerEdge)}
                style={({ pressed }) => [
                  styles.control,
                  pressed && styles.controlPressed,
                ]}
              >
                <Text style={styles.controlText}>New game</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <View
        style={[styles.table, { height: layout.tableHeight, width: layout.boardSize }]}
      >
        {renderPlayerEdge('far')}
        <View style={{ width: layout.boardSize, height: layout.boardSize }}>
          <Board
            size={layout.boardSize}
            game={game}
            selection={selection}
            lastMove={lastMove}
            arrival={arrival}
            onTapSquare={handleTapSquare}
            onDropMove={handleDropMove}
          />
          {promotion !== undefined && (
            <PromotionPicker
              prompt={promotion}
              size={layout.boardSize}
              onChoose={handleChoosePromotion}
            />
          )}
          {confirmingNewGame !== undefined && (
            <View
              style={[
                styles.overlay,
                { width: layout.boardSize, height: layout.boardSize },
              ]}
              pointerEvents="auto"
            >
              <View
                style={[
                  styles.confirmCard,
                  { transform: [{ rotate: rotationForPlayerEdge(confirmingNewGame) }] },
                ]}
              >
                <Text style={styles.confirmPrompt}>Start a new game?</Text>
                <Text style={styles.confirmBody}>The game in progress will be lost.</Text>
                <View style={styles.confirmActions}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Start new game"
                    onPress={beginNewGame}
                    style={({ pressed }) => [
                      styles.control,
                      styles.primaryControl,
                      pressed && styles.controlPressed,
                    ]}
                  >
                    <Text style={styles.primaryControlText}>Start new game</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Keep playing"
                    onPress={() => setConfirmingNewGame(undefined)}
                    style={({ pressed }) => [
                      styles.control,
                      pressed && styles.controlPressed,
                    ]}
                  >
                    <Text style={styles.controlText}>Keep playing</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )}
        </View>
        {renderPlayerEdge('near')}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f6f4ef',
  },
  table: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerEdge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  activePlayerEdge: {
    backgroundColor: '#f6f4ef',
    borderColor: '#2a2a28',
  },
  waitingPlayerEdge: {
    backgroundColor: '#d8d1c4',
    borderColor: '#d8d1c4',
  },
  finishedPlayerEdge: {
    backgroundColor: '#f6f4ef',
    borderColor: '#2a2a28',
  },
  playerEdgeContents: {
    alignItems: 'center',
    gap: 6,
  },
  colorText: {
    color: '#2a2a28',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  turnText: {
    borderRadius: 999,
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingVertical: 5,
    fontSize: 16,
    fontWeight: '700',
  },
  activeTurnText: {
    backgroundColor: '#2a2a28',
    color: '#f6f4ef',
  },
  waitingTurnText: {
    backgroundColor: '#c7bdaa',
    color: '#2a2a28',
  },
  checkText: {
    color: '#be3c32',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  trayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trayGlyphs: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  materialAdvantageText: {
    color: '#2a2a28',
    fontSize: 20,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  undoControl: {
    borderRadius: 999,
    borderWidth: 2,
    paddingHorizontal: 16,
    paddingVertical: 5,
  },
  undoControlAvailable: {
    borderColor: '#2a2a28',
    backgroundColor: '#e8e0d0',
  },
  undoControlUnavailable: {
    borderColor: '#c7bdaa',
    backgroundColor: 'transparent',
  },
  undoControlPressed: {
    backgroundColor: '#d8d1c4',
  },
  undoControlText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  undoControlTextAvailable: {
    color: '#2a2a28',
  },
  undoControlTextUnavailable: {
    color: '#b7ad9a',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  resultText: {
    color: '#2a2a28',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  offerText: {
    color: '#2a2a28',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  control: {
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#c7bdaa',
    backgroundColor: '#e8e0d0',
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  controlPressed: {
    borderColor: '#2a2a28',
    backgroundColor: '#d8d1c4',
  },
  controlText: {
    color: '#2a2a28',
    fontSize: 14,
    fontWeight: '700',
  },
  primaryControl: {
    borderColor: '#2a2a28',
    backgroundColor: '#2a2a28',
  },
  primaryControlText: {
    color: '#f6f4ef',
    fontSize: 14,
    fontWeight: '800',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(42, 42, 40, 0.55)',
  },
  confirmCard: {
    alignItems: 'center',
    gap: 12,
    padding: 20,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#2a2a28',
    backgroundColor: '#f6f4ef',
  },
  confirmPrompt: {
    color: '#2a2a28',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  confirmBody: {
    color: '#2a2a28',
    fontSize: 14,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 10,
  },
});
