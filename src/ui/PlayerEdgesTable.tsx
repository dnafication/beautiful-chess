import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { applyMove, createGame, isCheck, sideToMove } from '../rules';
import type { Game, Move, Piece, PieceColor, PromotionPieceType, Square } from '../rules';
import { Board } from './Board';
import { PieceGlyph } from './pieces/PieceGlyph';
import {
  calculatePlayerEdgesLayout,
  playerEdgeCheckText,
  playerEdgePresentation,
  type PlayerEdge,
} from './playerEdges';
import { promotionChoice } from './promotion';
import type { PromotionPrompt } from './promotion';
import { PromotionPicker } from './PromotionPicker';
import { moveRelocations, selectionFor, tapSquare } from './selection';
import type { Relocation, Selection } from './selection';
import { trayPresentation } from './tray';

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
  const [game, setGame] = useState<Game>(() => createGame());
  const [selection, setSelection] = useState<Selection | undefined>(undefined);
  const [lastMove, setLastMove] = useState<Move | undefined>(undefined);
  const [arrival, setArrival] = useState<Arrival | undefined>(undefined);
  const [promotion, setPromotion] = useState<PromotionPrompt | undefined>(undefined);
  const nonce = useRef(0);

  const activeColor = sideToMove(game);
  const inCheck = isCheck(game);

  const playMove = useCallback((currentGame: Game, move: Move, animate: boolean) => {
    const relocations = moveRelocations(currentGame, move);
    setGame(applyMove(currentGame, move));
    setLastMove(move);
    setSelection(undefined);
    if (animate) {
      nonce.current += 1;
      setArrival({ relocations, nonce: nonce.current });
    } else {
      setArrival(undefined);
    }
  }, []);

  const handleTapSquare = useCallback(
    (square: Square) => {
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
    [game, selection, playMove],
  );

  const handleDropMove = useCallback(
    (from: Square, to: Square) => {
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
    [game, playMove],
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

  const renderPlayerEdge = (playerEdge: PlayerEdge) => {
    const presentation = playerEdgePresentation(playerEdge, activeColor);
    const checkText = playerEdgeCheckText(presentation.state, inCheck);
    const tray = trayPresentation(game, playerEdge);
    const trayGlyphSize = Math.round(layout.playerEdgeThickness * 0.22);
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
      presentation.turnText,
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
            opacity: presentation.opacity,
            width: layout.playerEdgeWidth,
          },
          presentation.state === 'active'
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
                <PieceGlyph key={index} piece={piece} size={trayGlyphSize} />
              ))}
            </View>
          </View>
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
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: 240,
  },
  materialAdvantageText: {
    color: '#2a2a28',
    fontSize: 20,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
});
