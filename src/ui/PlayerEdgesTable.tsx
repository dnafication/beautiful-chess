import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import type { PieceColor } from '../rules';
import { Board } from './Board';
import {
  calculatePlayerEdgesLayout,
  nextTurnColor,
  playerEdgePresentation,
  type PlayerEdge,
} from './playerEdges';

function colorLabel(color: PieceColor): string {
  return color === 'white' ? 'White' : 'Black';
}

export function PlayerEdgesTable(): React.ReactElement {
  const viewport = useWindowDimensions();
  const layout = calculatePlayerEdgesLayout(viewport);
  const [activeColor, setActiveColor] = useState<PieceColor>('white');
  const advanceTurn = () => setActiveColor((color) => nextTurnColor(color));
  const renderPlayerEdge = (playerEdge: PlayerEdge) => {
    const presentation = playerEdgePresentation(playerEdge, activeColor);

    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${colorLabel(presentation.color)} Player Edge, ${presentation.turnText}`}
        key={playerEdge}
        onPress={advanceTurn}
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
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.screen}>
      <View
        style={[styles.table, { height: layout.tableHeight, width: layout.boardSize }]}
      >
        {renderPlayerEdge('far')}
        <Board size={layout.boardSize} />
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
});
