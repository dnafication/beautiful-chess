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
 * Artwork: original flat Staunton set drawn from scratch for this repository.
 * The SVG path data is valid SVG accepted by react-native-svg.
 */

import type { Piece, PieceColor, PieceType } from '../../rules';
import { defaultPieceTheme, pieceThemes } from './themes';
import type { Ink, PieceTheme } from './themes';

// Re-exported so the visual preview script (render.mjs) can iterate every
// theme without importing themes.ts directly.
export { pieceThemes };

// ── Ink roles ────────────────────────────────────────────────────────────────
// Shapes name their colours by role rather than by hex value so one drawing
// serves both sides in all five colourways. The resolver below maps roles to
// the concrete strings the chosen theme supplies.

type InkRole = keyof Ink;

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
// White and black share the same drawing; the theme resolves the ink at render
// time. Every piece is drawn to one construction so the set reads as one set:
//
//   y = 88  the baseline. Every piece stands on it, so a row of pieces — on the
//           board or in a Tray — sits on one line instead of bobbing.
//   y = 88..82  the plinth: a flat foot shared by all six pieces, width scales
//           with rank (pawn narrowest, king/queen widest) so the base already
//           signals the hierarchy before the silhouette registers.
//   y = 82..77  the riser: a small bevelled step that lifts the body off the
//           plinth and gives every piece the same ground-contact language.
//   y = 77..  the piece's own body. Height and width grow with rank.
//
// One accent line is inlaid at the transition between the body and the skirt
// of every piece. It is the set's signature detail: a single horizontal line
// survives at Tray size where hatching or shading would silt into a smudge.
//
// Left/right symmetry is maintained everywhere except the knight — it is what
// makes a piece readable from the far side of the table when the whole board
// is upside-down (ADR 0004). The knight faces right; inverted it stays
// unmistakably a knight because nothing else in the set has a muzzle.

/** The plinth and bevelled riser: shared base for every piece. */
const base = (halfWidth: number): readonly Shape[] => [
  // Flat foot: the full-width ground slab.
  fp(`M${50 - halfWidth} 88 h${2 * halfWidth} v-6 h-${2 * halfWidth} z`),
  // Bevelled riser: steps inward by 4 on each side and tapers up 5 units.
  fp(`M${50 - halfWidth + 4} 82 h${2 * halfWidth - 8} l-2 -5 h-${2 * halfWidth - 12} z`),
];

/** A single horizontal accent line inlaid across a collar at height y. */
const inlay = (x1: number, x2: number, y: number): StrokePath =>
  slit(`M${x1} ${y} H${x2}`);

/**
 * The knight's head and neck: the one asymmetric silhouette in the set.
 *
 * The body is a single closed path: chest bottom-left → up the breast →
 * muzzle protrudes forward-left → jaw turns up → forehead rises to the
 * rounded crown → back of head descends → crest of neck sweeps down to the
 * chest bottom-right. The crown is smooth here so the separate ear shape can
 * rise from it cleanly as a pointed spike rather than a kink in the outline.
 */
const KNIGHT_HEAD =
  // Breast: chest left, rising toward shoulder
  'M30 77 C29 64 33 54 41 49' +
  // Muzzle: protrudes forward-left, jaw turns upward at the chin
  ' C34 47 27 43 23 39 C20 36 21 32 25 29' +
  // Forehead: rises from the eye area to the rounded crown
  ' C29 24 37 17 45 12 C46 9 47 6 46 5' +
  // Poll and back of head: descend from the crown
  ' C51 5 57 10 61 16' +
  // Neck: crest sweeps down to the chest right
  ' C68 27 72 43 72 57 C72 66 71 73 70 77 Z';

const SHAPES: Record<PieceType, readonly Shape[]> = {
  // ── Pawn ────────────────────────────────────────────────────────────────────
  // The simplest silhouette: a ball head, narrow neck, gently flared skirt.
  // The neck is just wide enough to feel stable at 44 px.
  pawn: [
    // Ball head: centred, radius 11 so it reads boldly at small sizes.
    fc(50, 25, 11),
    // Neck collar: a narrow band bridging head to body.
    fp('M41 36 h18 l-2 5 h-14 z'),
    // Skirt: sweeps from the collar outward to the riser, concave at the waist
    // for a classic Staunton profile.
    fp('M43 41 C43 54 39 65 35 77 h30 C61 65 57 54 57 41 z'),
    // Collar accent line — the set's signature detail.
    inlay(42, 58, 38.5),
    ...base(16),
  ],

  // ── Rook ─────────────────────────────────────────────────────────────────────
  // Three merlons with two embrasures. Each embrasure is 6 units wide — enough
  // to read as a clear notch at 44 px without eating into the merlon mass.
  // The battlements are exactly as wide as the plinth (x = 30..70) so the
  // piece has a single clean left and right edge all the way down.
  rook: [
    // Battlements: left merlon (9) | embrasure (6) | centre merlon (10) |
    // embrasure (6) | right merlon (9) = 40 units, x=30..70.
    fp('M30 22 h9 v7 h6 v-7 h10 v7 h6 v-7 h9 v15 h-40 z'),
    // Collar step between parapet top and tower body.
    fp('M32 37 h36 l-3 5.5 h-30 z'),
    // Tower body: near-vertical walls taper gently inward then flare to skirt.
    fp('M35 42.5 C34 55 33 66 31 77 h38 C67 66 66 55 65 42.5 z'),
    // Inlaid accent at the collar.
    inlay(33, 67, 40.5),
    ...base(20),
  ],

  // ── Bishop ───────────────────────────────────────────────────────────────────
  // Tall pointed mitre with a ball finial. The diagonal slit runs lower-left
  // to upper-right, the canonical Staunton mark that distinguishes this piece
  // from any other at a glance.
  bishop: [
    // Ball finial at the tip.
    fc(50, 9, 4.5),
    // Mitre body: rises to a point and widens toward its base.
    fp(
      'M50 14 C61 25 66 38 66 48 C66 57 59 63 50 63 C41 63 34 57 34 48 C34 38 39 25 50 14 z',
    ),
    // Diagonal slit: lower-left to upper-right.
    slit('M44 50 L57 33'),
    // Collar between mitre and skirt.
    fp('M38 63 h24 l-2 6 h-20 z'),
    // Skirt: gently curved flanks, same family as the pawn.
    fp('M40 69 C39 72 36 75 31 77 h38 C64 75 61 72 60 69 z'),
    // Inlaid accent at the collar.
    inlay(39, 61, 66),
    ...base(17),
  ],

  // ── Knight ───────────────────────────────────────────────────────────────────
  // The only asymmetric piece; faces right. The mane line replaces the collar
  // inlay that every other piece carries — the same single-accent-mark role,
  // but following the horse's anatomy rather than the lathe's.
  knight: [
    fp(KNIGHT_HEAD),
    // Ear: a sharp triangular spike rising from the crown. The base points sit
    // on the crown surface (y≈6 at x=48, y≈10 at x=57) so the outline reads
    // as a spike rather than a bump half-buried in the silhouette.
    fp('M48 7 L52 1 L57 10 z'),
    // Eye: a solid accent dot, mid-face between brow and muzzle.
    dot(42, 35, 3.5),
    // Mane: a curved accent stroke tracing the crest from poll to withers.
    slit('M62 16 C71 29 75 46 74 63'),
    ...base(20),
  ],

  // ── Queen ────────────────────────────────────────────────────────────────────
  // Five spiked coronet points, tallest at centre, each capped with a bead.
  // The outer two points are shorter and their beads smaller so the crown reads
  // as a deliberate arc rather than a row of equal spikes.
  queen: [
    // Coronet: five spikes rising from a shared base at y=57.
    fp('M31 57 L28 34 L38 46 L42 26 L47 41 L50 21 L53 41 L58 26 L62 46 L72 34 L69 57 z'),
    // Beads: outer and inner slightly enlarged so all five read at 44 px;
    // centre stays largest to preserve the graduated crown silhouette.
    fc(28, 31, 4.0),
    fc(42, 23, 4.2),
    fc(50, 18, 4.5),
    fc(58, 23, 4.2),
    fc(72, 31, 4.0),
    // Waist collar.
    fp('M30 57 h40 l-3 8 h-34 z'),
    // Skirt: wide curved flanks.
    fp('M33 65 C32 70 29 74 25 77 h50 C71 74 68 70 67 65 z'),
    // Inlaid accent at the waist collar.
    inlay(31, 69, 61),
    ...base(21),
  ],

  // ── King ─────────────────────────────────────────────────────────────────────
  // The largest piece. The cross finial has 6-unit-wide arms: thin enough to
  // read as elegant at 88 px, thick enough to read as a cross and not a blur
  // at 44 px upside-down.
  king: [
    // Cross: equal-arm plus, 6 units wide, 20×20 overall (x=40..60, y=3..23).
    fp('M47 3 h6 v7 h7 v6 h-7 v7 h-6 v-7 h-7 v-6 h7 z'),
    // Body: hourglass from below the cross to the skirt. Shoulders at y=28
    // overlap the cross base (y=23) by 5 units so there is no floating gap.
    fp('M33 57 C31 45 34 34 42 28 C45 26 55 26 58 28 C66 34 69 45 67 57 z'),
    // Waist collar.
    fp('M31 57 h38 l-3 8 h-32 z'),
    // Skirt: matches the queen's width so they read as a pair.
    fp('M33 65 C32 70 29 74 25 77 h50 C71 74 68 70 67 65 z'),
    // Inlaid accent at the waist collar.
    inlay(32, 68, 61),
    ...base(21),
  ],
};

// ── Palette resolver ──────────────────────────────────────────────────────────

function palette(color: PieceColor, theme: PieceTheme): Ink {
  return color === 'white' ? theme.white : theme.black;
}

function resolveShape(shape: Shape, ink: Ink): ResolvedShape {
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
 *
 * The theme supplies the ink. It is optional so a caller that does not care
 * which colourway is in use — a test, a preview — still gets a drawable glyph.
 */
export function glyphFor(piece: Piece, theme: PieceTheme = defaultPieceTheme): Glyph {
  const ink = palette(piece.color, theme);
  const shapes = SHAPES[piece.type];
  return {
    viewBox: '0 0 100 100',
    shapes: shapes.map((s) => resolveShape(s, ink)),
  };
}
