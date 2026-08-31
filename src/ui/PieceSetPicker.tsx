/**
 * The piece-set picker: an overlay that lets a player choose one of the five
 * colourways for the whole table.
 *
 * It appears over the board and is rotated to face the Player Edge that opened
 * it, so each player reads it upright from their own seat — the same pattern
 * as the `confirmingNewGame` card in `PlayerEdgesTable`.
 *
 * Each swatch shows a live preview: two `PieceGlyph`s (one white piece, one
 * black) on that theme's light and dark square colours. The selected theme is
 * marked by both a visible outline and its accessibility state, never colour
 * alone.
 *
 * Pure presentation: the caller owns which theme is selected and supplies the
 * callbacks. The picker holds no state.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { PlayerEdge } from './playerEdges';
import { rotationForPlayerEdge } from './playerEdges';
import { PieceGlyph } from './pieces/PieceGlyph';
import type { PieceTheme, PieceThemeId } from './pieces/themes';
import { pieceSetChoices } from './pieceSet';
import { PressableScale } from './PressableScale';
import { fontFamily } from './typography';

interface PieceSetPickerProps {
  /** The Player Edge whose player opened the picker; overlay faces them. */
  readonly playerEdge: PlayerEdge;
  /** The board edge length, used to size the overlay to cover the board. */
  readonly boardSize: number;
  /** The currently selected theme id. */
  readonly selectedId: PieceThemeId;
  /** Called when the player taps a theme swatch. */
  readonly onSelectTheme: (theme: PieceTheme) => void;
  /** Called when the player dismisses without changing anything. */
  readonly onDismiss: () => void;
}

// Preview pieces: one white pawn on a light square, one black pawn on a dark
// square. Pawns are compact and readable at small sizes.
const PREVIEW_PIECE_WHITE = { color: 'white', type: 'pawn' } as const;
const PREVIEW_PIECE_BLACK = { color: 'black', type: 'pawn' } as const;
const PREVIEW_SIZE = 32;

export function PieceSetPicker({
  playerEdge,
  boardSize,
  selectedId,
  onSelectTheme,
  onDismiss,
}: PieceSetPickerProps): React.ReactElement {
  const choices = pieceSetChoices(selectedId);
  const rotation = rotationForPlayerEdge(playerEdge);

  return (
    <View
      style={[styles.overlay, { width: boardSize, height: boardSize }]}
      accessibilityViewIsModal
      pointerEvents="auto"
    >
      <View style={[styles.card, { transform: [{ rotate: rotation }] }]}>
        <Text style={styles.title}>Pieces</Text>
        <View style={styles.swatches}>
          {choices.map((choice) => (
            <PressableScale
              key={choice.id}
              accessibilityRole="button"
              accessibilityLabel={choice.accessibilityLabel}
              accessibilityState={{ selected: choice.isSelected }}
              onPress={() => onSelectTheme(choice.theme)}
              style={({ pressed }) => [
                styles.swatch,
                choice.isSelected && styles.swatchSelected,
                pressed && styles.swatchPressed,
              ]}
            >
              {/* Live preview: white pawn on light square / black pawn on dark */}
              <View style={styles.preview}>
                <View
                  style={[
                    styles.previewSquare,
                    { backgroundColor: choice.theme.squareLight },
                  ]}
                >
                  <PieceGlyph
                    piece={PREVIEW_PIECE_WHITE}
                    size={PREVIEW_SIZE}
                    theme={choice.theme}
                  />
                </View>
                <View
                  style={[
                    styles.previewSquare,
                    { backgroundColor: choice.theme.squareDark },
                  ]}
                >
                  <PieceGlyph
                    piece={PREVIEW_PIECE_BLACK}
                    size={PREVIEW_SIZE}
                    theme={choice.theme}
                  />
                </View>
              </View>
              <Text style={styles.swatchName}>{choice.name}</Text>
              {/* Visible selection mark — never colour alone (accessibility). */}
              {choice.isSelected && <View style={styles.selectionDot} />}
            </PressableScale>
          ))}
        </View>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Close piece picker"
          onPress={onDismiss}
          style={({ pressed }) => [
            styles.dismissButton,
            pressed && styles.controlPressed,
          ]}
        >
          <Text style={styles.dismissText}>Close</Text>
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(42, 42, 40, 0.55)',
  },
  card: {
    alignItems: 'center',
    gap: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d8d1c4',
    backgroundColor: '#f6f4ef',
    shadowColor: '#2a2a28',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    color: '#2a2a28',
    fontFamily: fontFamily.extraBold,
    fontSize: 16,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  swatches: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  swatch: {
    // 44×44 minimum touch target
    minWidth: 64,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d8d1c4',
    backgroundColor: '#e8e0d0',
  },
  swatchSelected: {
    // Visible outline marks the selected set — distinguishable without colour.
    borderColor: '#2a2a28',
    borderWidth: 2.5,
    backgroundColor: '#f6f4ef',
  },
  swatchPressed: {
    borderColor: '#4a4845',
    backgroundColor: '#d8d1c4',
  },
  preview: {
    flexDirection: 'row',
    borderRadius: 6,
    overflow: 'hidden',
  },
  previewSquare: {
    width: PREVIEW_SIZE,
    height: PREVIEW_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchName: {
    color: '#2a2a28',
    fontFamily: fontFamily.semiBold,
    fontSize: 11,
    letterSpacing: 0.4,
  },
  // A small dot below the name reinforces selection without relying on colour.
  selectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2a2a28',
  },
  dismissButton: {
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#d8d1c4',
    backgroundColor: '#e8e0d0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#2a2a28',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  controlPressed: {
    borderColor: '#2a2a28',
    backgroundColor: '#d8d1c4',
  },
  dismissText: {
    color: '#2a2a28',
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
  },
});
