/**
 * Acceptance tests for the swappable piece-set module (issue #11).
 *
 * Runs in plain Node via vitest (no React, no DOM). This file is the
 * acceptance criterion: all twelve piece-and-colour combinations must resolve
 * through a single module to a concrete, renderable glyph.
 */

import { describe, expect, it } from 'vitest';
import type { Piece, PieceColor, PieceType } from '../../rules';
import { glyphFor } from './staunton';

const TYPES: PieceType[] = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'];
const COLORS: PieceColor[] = ['white', 'black'];

const allPieces: Piece[] = TYPES.flatMap((type) =>
  COLORS.map((color): Piece => ({ type, color })),
);

// A concrete colour string: # followed by 3 or 6 hex digits.
const HEX_COLOR = /^#[0-9a-f]{3}([0-9a-f]{3})?$/i;

describe('glyphFor', () => {
  it('resolves all twelve piece-and-colour combinations to a non-empty shape list', () => {
    for (const piece of allPieces) {
      const glyph = glyphFor(piece);
      expect(
        glyph.shapes.length,
        `${piece.color} ${piece.type} should have at least one shape`,
      ).toBeGreaterThan(0);
    }
  });

  it('returns viewBox "0 0 100 100" for every piece', () => {
    for (const piece of allPieces) {
      expect(glyphFor(piece).viewBox).toBe('0 0 100 100');
    }
  });

  it('resolves every colour on every shape to a concrete colour string (no role leaks)', () => {
    for (const piece of allPieces) {
      const { shapes } = glyphFor(piece);
      for (const shape of shapes) {
        // All shape kinds have at least a stroke colour.
        expect(
          HEX_COLOR.test(shape.stroke),
          `${piece.color} ${piece.type}: stroke on ${shape.kind} is not a hex colour: "${shape.stroke}"`,
        ).toBe(true);

        if (shape.kind === 'filled-path' || shape.kind === 'filled-circle') {
          expect(
            HEX_COLOR.test(shape.fill),
            `${piece.color} ${piece.type}: fill on ${shape.kind} is not a hex colour: "${shape.fill}"`,
          ).toBe(true);
        }
      }
    }
  });

  it('white and black resolve to different fill colours for the same type', () => {
    for (const type of TYPES) {
      const white = glyphFor({ type, color: 'white' });
      const black = glyphFor({ type, color: 'black' });
      // The first filled shape carries the body colour — body is always
      // different between white and black.
      const firstFilled = (glyph: typeof white) =>
        glyph.shapes.find((s) => s.kind === 'filled-path' || s.kind === 'filled-circle');
      const wShape = firstFilled(white);
      const bShape = firstFilled(black);
      expect(wShape).toBeDefined();
      expect(bShape).toBeDefined();
      // TypeScript narrowing after the expects above.
      if (
        wShape &&
        bShape &&
        (wShape.kind === 'filled-path' || wShape.kind === 'filled-circle') &&
        (bShape.kind === 'filled-path' || bShape.kind === 'filled-circle')
      ) {
        expect(wShape.fill).not.toBe(bShape.fill);
      }
    }
  });

  it('the six piece types resolve to distinct shape lists (same colour)', () => {
    // Different types have different shape data — verified by checking that
    // the serialised shapes differ for at least one pair.
    const serialised = TYPES.map((type) =>
      JSON.stringify(glyphFor({ type, color: 'white' }).shapes),
    );
    const unique = new Set(serialised);
    expect(unique.size).toBe(TYPES.length);
  });
});
