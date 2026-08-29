/**
 * The chess board — 8×8, standard starting position, fixed orientation.
 *
 * The board NEVER flips and NEVER rotates (ADR 0003). The device lies flat on
 * a table between two players facing each other; there is no moment at which a
 * flip would be correct. Tested while holding the phone in one hand it will
 * feel wrong — that posture is not the product. White's first rank stays at
 * the bottom of the screen for the whole game.
 *
 * Piece artwork comes entirely from `glyphFor` in the swappable module. No
 * glyph is named here — swapping the artwork is a change to one file.
 */

import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { createGame, pieceAt } from '../rules';
import type { File, Rank, Square } from '../rules';
import { glyphFor } from './pieces/staunton';
import type { ResolvedShape } from './pieces/staunton';

// ── Square colours ─────────────────────────────────────────────────────────
// Restrained pair that sits with the #2a2a28 / #f6f4ef piece palette:
// warm off-white for light squares, desaturated warm brown for dark squares.
// Both are muted so neither competes with the pieces themselves.
const SQUARE_LIGHT = '#e8e0d0';
const SQUARE_DARK = '#9e8b72';

// ── Layout ─────────────────────────────────────────────────────────────────

const FILES: File[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
// Ranks ordered top→bottom on screen: rank 8 (Black's back rank) at top,
// rank 1 (White's back rank) at bottom. Fixed; never reordered.
const RANKS_TOP_TO_BOTTOM: Rank[] = ['8', '7', '6', '5', '4', '3', '2', '1'];

// ── Shape renderer ─────────────────────────────────────────────────────────

function renderShape(shape: ResolvedShape, index: number): React.ReactElement {
  switch (shape.kind) {
    case 'filled-path':
      return (
        <Path
          key={index}
          d={shape.d}
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
          strokeLinejoin={shape.strokeLinejoin}
          strokeLinecap={shape.strokeLinecap}
        />
      );
    case 'filled-circle':
      return (
        <Circle
          key={index}
          cx={shape.cx}
          cy={shape.cy}
          r={shape.r}
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
        />
      );
    case 'stroke-path':
      return (
        <Path
          key={index}
          d={shape.d}
          fill="none"
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
          strokeLinecap={shape.strokeLinecap}
        />
      );
    case 'dot':
      return (
        <Circle key={index} cx={shape.cx} cy={shape.cy} r={shape.r} fill={shape.fill} />
      );
  }
}

// ── Board component ─────────────────────────────────────────────────────────

const game = createGame();

interface BoardProps {
  /**
   * The board's edge length in pixels. Required, and deliberately not derived
   * here: the Player Edges own the layout, so board size has exactly one
   * source. Two sources would let the board resize itself as edge contents
   * change, which is the one thing the layout must never do.
   */
  readonly size: number;
}

export function Board({ size }: BoardProps): React.ReactElement {
  const squareSize = size / 8;

  return (
    <View style={{ width: size, height: size }}>
      {RANKS_TOP_TO_BOTTOM.map((rank, rankIndex) =>
        FILES.map((file, fileIndex) => {
          const square: Square = `${file}${rank}`;
          // Light square when file+rank indices sum to an even number,
          // matching standard chess board colouring (a1 is always dark).
          const isLight = (fileIndex + rankIndex) % 2 === 0;
          const piece = pieceAt(game, square);

          return (
            <View
              key={square}
              style={{
                position: 'absolute',
                left: fileIndex * squareSize,
                top: rankIndex * squareSize,
                width: squareSize,
                height: squareSize,
                backgroundColor: isLight ? SQUARE_LIGHT : SQUARE_DARK,
              }}
            >
              {piece !== undefined && (
                <Svg viewBox="0 0 100 100" width={squareSize} height={squareSize}>
                  {glyphFor(piece).shapes.map((shape, i) => renderShape(shape, i))}
                </Svg>
              )}
            </View>
          );
        }),
      )}
    </View>
  );
}
