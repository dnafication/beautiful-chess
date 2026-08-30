/**
 * The chess board — 8×8, standard starting position, fixed orientation.
 *
 * The board NEVER flips and NEVER rotates (ADR 0003). The device lies flat on
 * a table between two players facing each other; there is no moment at which a
 * flip would be correct. Tested while holding the phone in one hand it will
 * feel wrong — that posture is not the product. White's first rank stays at
 * the bottom of the screen for the whole game.
 *
 * This component only draws and reports gestures; it holds no rules knowledge.
 * The selection state machine in `./selection` decides what a tap or a drop
 * means, and the table above owns the `Game`. Both tap-then-tap and dragging
 * feed the one selection model rather than being two implementations.
 *
 * Piece artwork comes entirely from `glyphFor` in the swappable module. No
 * glyph is named here — swapping the artwork is a change to one file.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, View } from 'react-native';
import { pieceAt } from '../rules';
import type { File, Game, Move, Rank, Square } from '../rules';
import { PieceGlyph } from './pieces/PieceGlyph';
import { checkedKingSquare, selectionFor } from './selection';
import type { Destination, Relocation, Selection } from './selection';

// ── Square colours ─────────────────────────────────────────────────────────
// Restrained pair that sits with the #2a2a28 / #f6f4ef piece palette:
// warm off-white for light squares, desaturated warm brown for dark squares.
// Both are muted so neither competes with the pieces themselves.
const SQUARE_LIGHT = '#e8e0d0';
const SQUARE_DARK = '#9e8b72';

// ── Marker colours ───────────────────────────────────────────────────────────
// Translucent so the square colour and any piece still read through them.
const SELECTED_TINT = 'rgba(90, 140, 90, 0.55)';
const LAST_MOVE_TINT = 'rgba(120, 150, 90, 0.40)';
const CHECK_TINT = 'rgba(190, 60, 50, 0.60)';
const DESTINATION_MARK = 'rgba(40, 40, 38, 0.30)';

// ── Layout ─────────────────────────────────────────────────────────────────

const FILES: readonly File[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
// Ranks ordered top→bottom on screen: rank 8 (Black's back rank) at top,
// rank 1 (White's back rank) at bottom. Fixed; never reordered.
const RANKS_TOP_TO_BOTTOM: readonly Rank[] = ['8', '7', '6', '5', '4', '3', '2', '1'];

function fileIndexOf(file: File): number {
  return FILES.indexOf(file);
}

function rankRowOf(rank: Rank): number {
  return RANKS_TOP_TO_BOTTOM.indexOf(rank);
}

function topLeftOf(square: Square, squareSize: number): { left: number; top: number } {
  const file = square[0] as File;
  const rank = square[1] as Rank;
  return { left: fileIndexOf(file) * squareSize, top: rankRowOf(rank) * squareSize };
}

function squareAt(x: number, y: number, squareSize: number): Square {
  const clamp = (value: number) =>
    Math.max(0, Math.min(7, Math.floor(value / squareSize)));
  const file = FILES[clamp(x)];
  const rank = RANKS_TOP_TO_BOTTOM[clamp(y)];
  return `${file}${rank}`;
}

// ── Board component ─────────────────────────────────────────────────────────

interface Arrival {
  readonly relocations: readonly Relocation[];
  readonly nonce: number;
}

interface BoardProps {
  /**
   * The board's edge length in pixels. Required, and deliberately not derived
   * here: the Player Edges own the layout, so board size has exactly one
   * source. Two sources would let the board resize itself as edge contents
   * change, which is the one thing the layout must never do.
   */
  readonly size: number;
  /** The position to draw and the referee for every gesture. */
  readonly game: Game;
  /** The piece picked up by tapping, or `undefined` when nothing is selected. */
  readonly selection: Selection | undefined;
  /** The move just played, both of whose squares stay marked until the next. */
  readonly lastMove: Move | undefined;
  /** The relocations to animate on arrival, re-fired whenever `nonce` changes. */
  readonly arrival: Arrival | undefined;
  /** A tap on a square, for tap-then-tap play. */
  readonly onTapSquare: (square: Square) => void;
  /** A drag released from one square onto another, for drag play. */
  readonly onDropMove: (from: Square, to: Square) => void;
}

interface DragState {
  readonly from: Square;
  readonly destinations: readonly Destination[];
  readonly pointer: Animated.ValueXY;
}

const DRAG_THRESHOLD = 8;

export function Board({
  size,
  game,
  selection,
  lastMove,
  arrival,
  onTapSquare,
  onDropMove,
}: BoardProps): React.ReactElement {
  const squareSize = size / 8;
  const checkedSquare = checkedKingSquare(game);
  const [drag, setDrag] = useState<DragState | undefined>(undefined);
  // The gesture handlers are rebuilt only when the position or geometry
  // changes, so they cannot read `drag` from their closure without going stale.
  // They read this ref instead. That matters for correctness and not just for
  // freshness: reading the drag inside a `setDrag` updater would put the parent
  // callbacks below into React's render phase, where updating another component
  // is precisely what React warns about.
  const dragRef = useRef<DragState | undefined>(undefined);
  const changeDrag = useCallback((next: DragState | undefined) => {
    dragRef.current = next;
    setDrag(next);
  }, []);
  const arrivalValue = useState(() => new Animated.Value(0))[0];
  const [settledNonce, setSettledNonce] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (arrival === undefined || arrival.relocations.length === 0) {
      return;
    }
    arrivalValue.setValue(0);
    const { nonce } = arrival;
    const animation = Animated.timing(arrivalValue, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (finished) {
        setSettledNonce(nonce);
      }
    });
    return () => animation.stop();
    // Re-run only when a new arrival is announced, keyed by its nonce.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrival?.nonce, arrivalValue]);

  const arrivalRelocations =
    arrival !== undefined && arrival.nonce !== settledNonce ? arrival.relocations : [];

  // `react-hooks/refs` sees a ref passed into a function during render and
  // cannot tell that these are gesture handlers, run by the responder system
  // long after this render. Rebuilding the responder when the drag changes
  // instead would be worse than the warning it silences: `PanResponder.create`
  // holds the accumulated gesture state, so a responder replaced mid-gesture
  // reports dx/dy of zero and every drop is mistaken for a tap.
  const panResponder = React.useMemo(
    () =>
      // eslint-disable-next-line react-hooks/refs
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          const { locationX, locationY } = event.nativeEvent;
          const from = squareAt(locationX, locationY, squareSize);
          const grabbed = selectionFor(game, from);
          if (grabbed === undefined) {
            return;
          }
          const pointer = new Animated.ValueXY({ x: locationX, y: locationY });
          changeDrag({ from, destinations: grabbed.destinations, pointer });
        },
        onPanResponderMove: (event) => {
          const { locationX, locationY } = event.nativeEvent;
          // The pointer is an animated value, so moving it drives the drag
          // without a re-render and there is no state to update here.
          dragRef.current?.pointer.setValue({ x: locationX, y: locationY });
        },
        onPanResponderRelease: (event, gesture) => {
          const { locationX, locationY } = event.nativeEvent;
          const movedFar =
            Math.abs(gesture.dx) > DRAG_THRESHOLD ||
            Math.abs(gesture.dy) > DRAG_THRESHOLD;
          const released = dragRef.current;
          changeDrag(undefined);
          if (released !== undefined && movedFar) {
            onDropMove(released.from, squareAt(locationX, locationY, squareSize));
          } else {
            onTapSquare(squareAt(locationX, locationY, squareSize));
          }
        },
        onPanResponderTerminate: () => changeDrag(undefined),
      }),
    // Rebuild when the position or geometry changes so gestures read the
    // current game rather than a stale closure.
    [game, squareSize, onTapSquare, onDropMove, changeDrag],
  );

  // Destinations to show: the dragged piece's while dragging, else the
  // tapped selection's. One model, two triggers.
  const shownDestinations = drag?.destinations ?? selection?.destinations;
  const selectedSquare = drag?.from ?? selection?.from;
  const hiddenSquares = new Set<Square>();
  if (drag !== undefined) {
    hiddenSquares.add(drag.from);
  }
  if (arrivalRelocations.length > 0) {
    for (const relocation of arrivalRelocations) {
      hiddenSquares.add(relocation.to);
    }
  }

  return (
    <View style={{ width: size, height: size }} {...panResponder.panHandlers}>
      {RANKS_TOP_TO_BOTTOM.map((rank, rankIndex) =>
        FILES.map((file, fileIndex) => {
          const square: Square = `${file}${rank}`;
          // Light square when file+rank indices sum to an even number,
          // matching standard chess board colouring (a1 is always dark).
          const isLight = (fileIndex + rankIndex) % 2 === 0;
          const piece = pieceAt(game, square);
          const destination = shownDestinations?.find((d) => d.square === square);
          const isLastMove =
            lastMove !== undefined &&
            (square === lastMove.from || square === lastMove.to);
          const isChecked = square === checkedSquare;
          const isSelected = square === selectedSquare;

          const tint = isChecked
            ? CHECK_TINT
            : isSelected
              ? SELECTED_TINT
              : isLastMove
                ? LAST_MOVE_TINT
                : undefined;

          return (
            <View
              key={square}
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: fileIndex * squareSize,
                top: rankIndex * squareSize,
                width: squareSize,
                height: squareSize,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isLight ? SQUARE_LIGHT : SQUARE_DARK,
              }}
            >
              {tint !== undefined && (
                <View
                  style={{
                    position: 'absolute',
                    width: squareSize,
                    height: squareSize,
                    backgroundColor: tint,
                  }}
                />
              )}
              {piece !== undefined && !hiddenSquares.has(square) && (
                <PieceGlyph piece={piece} size={squareSize} />
              )}
              {destination !== undefined &&
                (destination.isCapture ? (
                  <View
                    style={{
                      position: 'absolute',
                      width: squareSize,
                      height: squareSize,
                      borderRadius: squareSize / 2,
                      borderWidth: squareSize * 0.09,
                      borderColor: DESTINATION_MARK,
                    }}
                  />
                ) : (
                  <View
                    style={{
                      position: 'absolute',
                      width: squareSize * 0.3,
                      height: squareSize * 0.3,
                      borderRadius: squareSize * 0.15,
                      backgroundColor: DESTINATION_MARK,
                    }}
                  />
                ))}
            </View>
          );
        }),
      )}

      {arrivalRelocations.map((relocation) => {
        const piece = pieceAt(game, relocation.to);
        if (piece === undefined) {
          return null;
        }
        const from = topLeftOf(relocation.from, squareSize);
        const to = topLeftOf(relocation.to, squareSize);
        const translateX = arrivalValue.interpolate({
          inputRange: [0, 1],
          outputRange: [from.left - to.left, 0],
        });
        const translateY = arrivalValue.interpolate({
          inputRange: [0, 1],
          outputRange: [from.top - to.top, 0],
        });
        return (
          <Animated.View
            key={`${relocation.from}-${relocation.to}`}
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: to.left,
              top: to.top,
              width: squareSize,
              height: squareSize,
              transform: [{ translateX }, { translateY }],
            }}
          >
            <PieceGlyph piece={piece} size={squareSize} />
          </Animated.View>
        );
      })}

      {drag !== undefined &&
        (() => {
          const piece = pieceAt(game, drag.from);
          if (piece === undefined) {
            return null;
          }
          return (
            <Animated.View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: Animated.subtract(drag.pointer.x, squareSize / 2),
                top: Animated.subtract(drag.pointer.y, squareSize / 2),
                width: squareSize,
                height: squareSize,
              }}
            >
              <PieceGlyph piece={piece} size={squareSize} />
            </Animated.View>
          );
        })()}
    </View>
  );
}
