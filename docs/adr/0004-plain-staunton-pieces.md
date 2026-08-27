# Plain Staunton pieces, drawn one way

ADR 0003 committed us to orientation-neutral pieces: symmetric glyphs readable from both
sides at once, on the reasoning that this is how a physical 3D set solves a shared board. Five
glyph systems were prototyped, four of them orientation-neutral, plus plain one-way Staunton
as a control. **None of the orientation-neutral systems was liked, and the control won.** We
are therefore drawing ordinary Staunton pieces, in one orientation, upright from White's side,
which is the universal convention for 2D chess diagrams. The board itself is unchanged: it
still never flips and never rotates.

The prototype is the reason we can say this rather than guess it, and it also showed why the
symmetric route was harder than it looked: the knight is the only piece that faces a
direction, and it was the piece that failed in every symmetric scheme.

## Considered Options

- **The four orientation-neutral systems** (top-down realism, mirrored Staunton, movement
  semantics, diagonal mirror) — all prototyped, all rejected on looks. They are recorded on
  the `prototype/piece-set` branch rather than described here, because the screenshots are the
  argument.
- **Auto-flipping the board** — still rejected, for the reason given in ADR 0003: both players
  see the board simultaneously on a table, so there is no moment at which a flip is correct.

## Consequences

- **One seat is permanently the wrong way up, and that is a real cost we are accepting.** Under
  ADR 0003 neither player was disadvantaged; now Black reads inverted pieces for the whole
  game. It is tolerable because Staunton silhouettes are left-right symmetric, so inversion is
  effectively a vertical flip and pieces stay *distinguishable* rather than ambiguous — you
  never mistake a rook for a queen. It evens out across a session as players swap colours. If
  it grates in real use, the cheap fallback is a setting choosing which Player Edge is upright;
  we are not building that in v1.
- **Only the board suffers this.** Because each Player Edge is rotated to face its owner, the
  Tray, turn indicator, Material Advantage and result are upright for the player they address.
  The inversion is confined to the 64 squares.
- **The licensing trap that ADR 0003 sidestepped is back.** Off-the-shelf sets are now
  technically usable, and the popular ones — Merida, Cburnett, Alpha — are GPL or CC-BY-SA,
  which we cannot absorb into a closed-source app. Since the artwork is being commissioned from
  human artists, the brief must require original work not traced or derived from an existing
  set, and the agreement must assign us the rights.
- **Implementation is not blocked on the artists.** The Staunton set drawn for variant E of the
  prototype is original work written from scratch in this repository, so it can ship as a
  placeholder and be swapped out later. Pieces should therefore be loaded through a single
  swappable module rather than referenced individually across the UI.
- **Still no board coordinates.** ADR 0003 justified this partly by arguing that `a-h` and
  `1-8` cannot be upright for both players. That specific argument no longer disqualifies
  them, since the pieces are not upright for both players either — but the other reason
  stands: there is no notation panel in v1, so coordinates would serve no purpose.

## The artists' brief

Constraints the commission has to respect, all of which come from decisions already made:

- Renders legibly at roughly 44 px, the size of one square at phone width in portrait.
- Both colours must stay distinct on both light and dark squares.
- Must remain distinguishable when viewed upside down, which is half the time.
- Flat vector silhouettes, no perspective shading, to suit the unornamented visual language.
- Delivered as SVG paths usable by `react-native-svg`.
