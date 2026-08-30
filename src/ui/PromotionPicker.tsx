/**
 * The promotion picker: when a pawn reaches the far rank, the promoting player
 * chooses which piece it becomes here.
 *
 * All the deciding lives in `./promotion` — which pieces are offered, in what
 * order, drawn in whose colour, and which way the prompt faces. This component
 * only lays that out and reports the tapped piece back. The glyphs come from
 * the swappable pieces module via `PieceGlyph`, so no artwork is named here.
 *
 * The prompt is unavoidable rather than dismissible (ADR 0003 / #14): it covers
 * the board so play cannot continue behind it, and it offers no way out but a
 * choice. Nothing has been applied yet — the pawn is still on the rank it came
 * from — so there is nothing to undo, only a piece to pick.
 *
 * It is rotated to face the promoting player using the same rotation as their
 * Player Edge, so each player reads it upright from their own seat.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { PromotionPieceType } from '../rules';
import { PieceGlyph } from './pieces/PieceGlyph';
import { PressableScale } from './PressableScale';
import type { PromotionPrompt } from './promotion';
import { fontFamily } from './typography';

interface PromotionPickerProps {
  readonly prompt: PromotionPrompt;
  readonly size: number;
  readonly onChoose: (piece: PromotionPieceType) => void;
}

export function PromotionPicker({
  prompt,
  size,
  onChoose,
}: PromotionPickerProps): React.ReactElement {
  const optionSize = Math.min(96, Math.max(56, size / 5));

  return (
    <View style={[styles.overlay, { width: size, height: size }]} pointerEvents="auto">
      <View style={[styles.card, { transform: [{ rotate: prompt.rotation }] }]}>
        <Text style={styles.prompt}>Promote to</Text>
        <View style={styles.options}>
          {prompt.options.map((piece) => (
            <PressableScale
              key={piece.type}
              accessibilityRole="button"
              accessibilityLabel={`Promote to ${piece.type}`}
              onPress={() => onChoose(piece.type)}
              style={({ pressed }) => [
                styles.option,
                { width: optionSize, height: optionSize },
                pressed && styles.optionPressed,
              ]}
            >
              <PieceGlyph piece={piece} size={optionSize * 0.82} />
            </PressableScale>
          ))}
        </View>
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
    gap: 12,
    padding: 16,
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
  prompt: {
    color: '#2a2a28',
    fontFamily: fontFamily.semiBold,
    fontSize: 16,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  options: {
    flexDirection: 'row',
    gap: 8,
  },
  option: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#d8d1c4',
    backgroundColor: '#e8e0d0',
    shadowColor: '#2a2a28',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  optionPressed: {
    borderColor: '#2a2a28',
    backgroundColor: '#d8d1c4',
  },
});
