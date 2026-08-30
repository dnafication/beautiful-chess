/**
 * THE swappable piece-set module (ADR 0004).
 *
 * This is the single file an artist swaps to replace the placeholder artwork.
 * No other part of the UI names a specific glyph — the rest of the UI calls
 * `glyphFor` and draws whatever comes back.
 *
 * The module is pure data: no React, no react-native-svg imports. That keeps
 * it testable in plain Node (vitest collects *.test.ts only) and lets the
 * Board use the resolved colours however it likes.
 *
 * Three things are exported and they are the whole contract: `glyphFor`, the
 * `Glyph` it returns, and the `ResolvedShape` union a renderer must be able to
 * draw. Everything above them — the ink roles, the authoring shape kinds, the
 * palette — is this set's own business and a replacement set need not have any
 * of it. `ResolvedShape` stays exported deliberately rather than being derived
 * at the call site: a renderer has to switch on every kind it might be handed,
 * so the list of kinds is part of the contract whether or not it has a name,
 * and naming it means a new kind breaks the switch instead of being ignored.
 *
 * Artwork: Variant E from the piece-set prototype (`prototype/piece-set`
 * branch). Original work written from scratch in this repository. The SVG
 * path data is ported unchanged because it is already valid SVG accepted
 * by react-native-svg.
 */

import type { Piece, PieceColor, PieceType } from '../../rules';

// ── Palette ──────────────────────────────────────────────────────────────────

// Variant E palette from the prototype.
const DARK = '#2a2a28';
const LIGHT = '#f6f4ef';

// ── Ink roles ────────────────────────────────────────────────────────────────
// Shapes name their colours by role rather than by hex value so the same
// drawing serves both white and black pieces. The resolver below maps roles
// to concrete strings before returning.

type InkRole = 'body' | 'accent' | 'edge';

// ── Shape discriminated union ────────────────────────────────────────────────
// Only the three shape kinds Variant E actually uses.

/** A filled-and-stroked path (solid() in the prototype). */
interface FilledPath {
  readonly kind: 'filled-path';
  readonly d: string;
  readonly fill: InkRole;
  readonly stroke: InkRole;
}

/** A filled-and-stroked circle (circle() in the prototype). */
interface FilledCircle {
  readonly kind: 'filled-circle';
  readonly cx: number;
  readonly cy: number;
  readonly r: number;
  readonly fill: InkRole;
  readonly stroke: InkRole;
}

/** A stroke-only path (the bishop's mitre slit in the prototype). */
interface StrokePath {
  readonly kind: 'stroke-path';
  readonly d: string;
  readonly stroke: InkRole;
}

/**
 * A fill-only circle (dot() in the prototype): the knight's eye.
 *
 * It carries no stroke, and that is the whole point of it being its own kind.
 * Drawing it as a stroked circle would add half the stroke width to its radius
 * all the way round, and at radius 3 against a stroke of 3.5 that nearly
 * doubles the eye.
 */
interface Dot {
  readonly kind: 'dot';
  readonly cx: number;
  readonly cy: number;
  readonly r: number;
  readonly fill: InkRole;
}

type Shape = FilledPath | FilledCircle | StrokePath | Dot;

// ── Resolved shape (concrete colours) ────────────────────────────────────────

interface ResolvedFilledPath {
  readonly kind: 'filled-path';
  readonly d: string;
  readonly fill: string;
  readonly stroke: string;
  readonly strokeWidth: number;
  readonly strokeLinejoin: 'round';
  readonly strokeLinecap: 'round';
}

interface ResolvedFilledCircle {
  readonly kind: 'filled-circle';
  readonly cx: number;
  readonly cy: number;
  readonly r: number;
  readonly fill: string;
  readonly stroke: string;
  readonly strokeWidth: number;
}

interface ResolvedStrokePath {
  readonly kind: 'stroke-path';
  readonly d: string;
  readonly stroke: string;
  readonly strokeWidth: number;
  readonly strokeLinecap: 'round';
}

interface ResolvedDot {
  readonly kind: 'dot';
  readonly cx: number;
  readonly cy: number;
  readonly r: number;
  readonly fill: string;
}

export type ResolvedShape =
  ResolvedFilledPath | ResolvedFilledCircle | ResolvedStrokePath | ResolvedDot;

export interface Glyph {
  readonly viewBox: string;
  readonly shapes: readonly ResolvedShape[];
}

// ── Shape constructors ────────────────────────────────────────────────────────

const fp = (d: string): FilledPath => ({
  kind: 'filled-path',
  d,
  fill: 'body',
  stroke: 'edge',
});

const fc = (cx: number, cy: number, r: number): FilledCircle => ({
  kind: 'filled-circle',
  cx,
  cy,
  r,
  fill: 'body',
  stroke: 'edge',
});

/** dot() in the prototype: fill is the INVERSE of the body (accent). */
const dot = (cx: number, cy: number, r: number): Dot => ({
  kind: 'dot',
  cx,
  cy,
  r,
  fill: 'accent',
});

/** The bishop's mitre slit: accent colour, stroke-only. */
const slit = (d: string): StrokePath => ({
  kind: 'stroke-path',
  d,
  stroke: 'accent',
});

// ── Shape lists per piece type (colour-independent) ──────────────────────────
// White and black share the same drawing. The palette resolves at render time.

const KNIGHT_HEAD =
  'M30 75 C32 62 38 55 46 52 C40 50 32 47 24 44 C21 43 20 40 22 37 C26 30 33 23 42 18 C45 16 47 12 47 8 L53 13 C62 19 70 30 73 44 C76 56 75 67 74 75 Z';

// base(x, y, wd) from Variant E: the plinth rectangle.
const base = (x: number, y: number, wd: number): FilledPath =>
  fp(`M${x} ${y} h${wd} v9 h-${wd} z`);

const SHAPES: Record<PieceType, readonly Shape[]> = {
  pawn: [
    fc(50, 26, 11),
    fp('M41 37 Q39 50 33 60 L31 69 h38 l-2 -9 Q61 50 59 37 Z'),
    base(27, 69, 46),
  ],

  rook: [
    fp(
      'M28 22 h9 v8 h9 v-8 h8 v8 h9 v-8 h9 v14 l-6 6 v18 l6 8 v3 h-44 v-3 l6 -8 v-18 l-6 -6 z',
    ),
    base(25, 71, 50),
  ],

  bishop: [
    fc(50, 14, 5),
    fp(
      'M50 20 C60 30 64 40 64 48 C64 56 58 61 50 61 C42 61 36 56 36 48 C36 40 40 30 50 20 Z',
    ),
    slit('M45 45 L57 32'),
    fp('M40 62 Q36 70 30 75 h40 Q64 70 60 62 Z'),
    base(25, 75, 50),
  ],

  knight: [fp(KNIGHT_HEAD), dot(41, 33, 3), base(24, 75, 52)],

  queen: [
    fp('M31 60 L27 28 L36 40 L40 22 L46 38 L50 20 L54 38 L60 22 L64 40 L73 28 L69 60 Z'),
    fc(27, 26, 4),
    fc(40, 20, 4),
    fc(50, 18, 4),
    fc(60, 20, 4),
    fc(73, 26, 4),
    fp('M33 61 Q29 70 24 75 h52 Q71 70 67 61 Z'),
    base(23, 75, 54),
  ],

  king: [
    fp('M46 5 h8 v8 h8 v8 h-8 v8 h-8 v-8 h-8 v-8 h8 z'),
    fp('M31 60 Q29 42 36 33 Q43 27 50 32 Q57 27 64 33 Q71 42 69 60 Z'),
    fp('M33 61 Q29 70 24 75 h52 Q71 70 67 61 Z'),
    base(23, 75, 54),
  ],
};

// ── Palette resolver ──────────────────────────────────────────────────────────

function palette(color: PieceColor): Record<InkRole, string> {
  // White pieces: light body, dark accent (knight's eye, bishop's slit), dark edge.
  // Black pieces: dark body, light accent, dark edge.
  return color === 'white'
    ? { body: LIGHT, accent: DARK, edge: DARK }
    : { body: DARK, accent: LIGHT, edge: DARK };
}

function resolveShape(shape: Shape, ink: Record<InkRole, string>): ResolvedShape {
  switch (shape.kind) {
    case 'filled-path':
      return {
        kind: 'filled-path',
        d: shape.d,
        fill: ink[shape.fill],
        stroke: ink[shape.stroke],
        strokeWidth: 2.5,
        strokeLinejoin: 'round',
        strokeLinecap: 'round',
      };
    case 'filled-circle':
      return {
        kind: 'filled-circle',
        cx: shape.cx,
        cy: shape.cy,
        r: shape.r,
        fill: ink[shape.fill],
        stroke: ink[shape.stroke],
        strokeWidth: 2.5,
      };
    case 'stroke-path':
      return {
        kind: 'stroke-path',
        d: shape.d,
        stroke: ink[shape.stroke],
        strokeWidth: 3.5,
        strokeLinecap: 'round',
      };
    case 'dot':
      return {
        kind: 'dot',
        cx: shape.cx,
        cy: shape.cy,
        r: shape.r,
        fill: ink[shape.fill],
      };
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Resolve a piece to a renderable glyph.
 *
 * This is the ONLY function the rest of the UI calls. To swap the artwork,
 * replace this module keeping this signature; the Board needs no changes.
 */
export function glyphFor(piece: Piece): Glyph {
  const ink = palette(piece.color);
  const shapes = SHAPES[piece.type];
  return {
    viewBox: '0 0 100 100',
    shapes: shapes.map((s) => resolveShape(s, ink)),
  };
}
