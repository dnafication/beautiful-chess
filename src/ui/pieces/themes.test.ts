/**
 * The contrast guarantees every colourway has to keep (issue: premium piece
 * design).
 *
 * A theme is chosen for looks, which is exactly why it needs a test: the
 * failure mode of a pretty palette is a black bishop that vanishes into a dark
 * square, and that is not something you notice while admiring the swatch. Each
 * rule below is a legibility floor rather than a taste judgement, so a sixth
 * theme added later inherits the same floor for free.
 *
 * Runs in plain Node (no React, no DOM), like everything else the vitest suite
 * collects.
 */

import { describe, expect, it } from 'vitest';
import { defaultPieceTheme, pieceThemeById, pieceThemes } from './themes';
import type { PieceTheme } from './themes';

function channel(hex: string, start: number): number {
  return parseInt(hex.slice(start, start + 2), 16) / 255;
}

/** WCAG relative luminance, the standard basis for a contrast ratio. */
function luminance(hex: string): number {
  const linear = (value: number) =>
    value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  return (
    0.2126 * linear(channel(hex, 1)) +
    0.7152 * linear(channel(hex, 3)) +
    0.0722 * linear(channel(hex, 5))
  );
}

/** WCAG contrast ratio, 1 (identical) to 21 (black on white). */
function contrast(a: string, b: string): number {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

const colorsOf = (theme: PieceTheme): readonly [string, string][] => [
  ['white.body', theme.white.body],
  ['white.accent', theme.white.accent],
  ['white.edge', theme.white.edge],
  ['black.body', theme.black.body],
  ['black.accent', theme.black.accent],
  ['black.edge', theme.black.edge],
  ['squareLight', theme.squareLight],
  ['squareDark', theme.squareDark],
  ['boardFrame', theme.boardFrame],
  ['marker', theme.marker],
];

describe('the five colourways', () => {
  it('offers exactly five, with unique ids and names', () => {
    expect(pieceThemes).toHaveLength(5);
    expect(new Set(pieceThemes.map((theme) => theme.id)).size).toBe(5);
    expect(new Set(pieceThemes.map((theme) => theme.name)).size).toBe(5);
  });

  it('starts on one of the five', () => {
    expect(pieceThemes).toContain(defaultPieceTheme);
  });

  it('resolves a stored id, and falls back to the default for anything else', () => {
    for (const theme of pieceThemes) {
      expect(pieceThemeById(theme.id)).toBe(theme);
    }
    // Storage is untrusted: an id from an older or newer build, or none at
    // all, must still dress the table rather than leave it undrawn.
    expect(pieceThemeById('a-set-we-removed')).toBe(defaultPieceTheme);
    expect(pieceThemeById(null)).toBe(defaultPieceTheme);
    expect(pieceThemeById(undefined)).toBe(defaultPieceTheme);
  });

  it('states every colour as a six-digit hex', () => {
    for (const theme of pieceThemes) {
      for (const [role, value] of colorsOf(theme)) {
        expect(HEX_COLOR.test(value), `${theme.id} ${role} is "${value}"`).toBe(true);
      }
    }
  });
});

describe('legibility floors', () => {
  it('outlines each side against its own body, so the silhouette survives', () => {
    // The edge is what holds a piece's shape together on a square close to its
    // own colour. Black's edge is the light one here: on a dark square a
    // dark-outlined dark piece is a hole, and half the board is dark.
    for (const theme of pieceThemes) {
      for (const side of ['white', 'black'] as const) {
        const ink = theme[side];
        expect(
          contrast(ink.body, ink.edge),
          `${theme.id} ${side}: edge against body`,
        ).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('cuts the accent marks clear of the body they are cut into', () => {
    // The knight's eye, the bishop's slit and the collar inlays are drawn in
    // the accent, and are hairlines: they need more separation than a filled
    // shape would, not less.
    for (const theme of pieceThemes) {
      for (const side of ['white', 'black'] as const) {
        const ink = theme[side];
        expect(
          contrast(ink.body, ink.accent),
          `${theme.id} ${side}: accent against body`,
        ).toBeGreaterThanOrEqual(7);
      }
    }
  });

  it('keeps both sides clear of both square colours', () => {
    // Every piece stands on both square colours over a game, so all four
    // pairings have to hold — not just the flattering two. It is the body OR
    // the edge that has to carry each pairing, not both: a cream piece on a
    // cream square is the classic set and reads perfectly well, because its
    // outline is what separates it. What is forbidden is a piece where neither
    // does.
    for (const theme of pieceThemes) {
      for (const side of ['white', 'black'] as const) {
        for (const square of ['squareLight', 'squareDark'] as const) {
          const ink = theme[side];
          const separation = Math.max(
            contrast(ink.body, theme[square]),
            contrast(ink.edge, theme[square]),
          );
          expect(
            separation,
            `${theme.id}: ${side} on ${square}, by body or by edge`,
          ).toBeGreaterThanOrEqual(3);
        }
      }
    }
  });

  it('separates the two sides from each other far more than from anything else', () => {
    // Telling whose piece it is has to be instant and never a judgement call,
    // including for a player reading the board upside down from across it.
    for (const theme of pieceThemes) {
      expect(
        contrast(theme.white.body, theme.black.body),
        `${theme.id}: white against black`,
      ).toBeGreaterThanOrEqual(7);
    }
  });

  it('reads as a chequer, and frames the board darker than either square', () => {
    for (const theme of pieceThemes) {
      expect(
        contrast(theme.squareLight, theme.squareDark),
        `${theme.id}: light against dark squares`,
      ).toBeGreaterThanOrEqual(1.8);
      expect(
        luminance(theme.boardFrame),
        `${theme.id}: frame darker than the dark square`,
      ).toBeLessThan(luminance(theme.squareDark));
    }
  });

  it('marks a square with a colour that shows on both squares', () => {
    // The selection, last-move and destination marks are drawn in the marker
    // colour over a square, so a marker that matches its own board is a mark
    // nobody can see.
    for (const theme of pieceThemes) {
      for (const square of ['squareLight', 'squareDark'] as const) {
        expect(
          contrast(theme.marker, theme[square]),
          `${theme.id}: marker on ${square}`,
        ).toBeGreaterThanOrEqual(1.8);
      }
    }
  });
});
