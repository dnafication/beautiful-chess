/**
 * The one React renderer for a piece glyph, shared by every surface that draws
 * a piece — the board and the promotion picker alike.
 *
 * Artwork still comes entirely from `glyphFor` in the swappable module (ADR
 * 0004); this component only turns the `ResolvedShape`s it returns into
 * react-native-svg elements, so no glyph is named here either. Keeping it in
 * one place means a new shape kind breaks one switch rather than several.
 */

import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import type { Piece } from '../../rules';
import { glyphFor } from './staunton';
import type { ResolvedShape } from './staunton';

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

export function PieceGlyph({
  piece,
  size,
}: {
  readonly piece: Piece;
  readonly size: number;
}): React.ReactElement {
  return (
    <Svg viewBox="0 0 100 100" width={size} height={size}>
      {glyphFor(piece).shapes.map((shape, index) => renderShape(shape, index))}
    </Svg>
  );
}
