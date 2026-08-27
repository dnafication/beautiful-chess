# Fixed board with orientation-neutral pieces

The device lies flat on a table between two players who face each other, so the board never flips and never rotates: it behaves like a physical chess set, which each player simply views from their own side. The pieces are drawn **orientation-neutral** — symmetric glyphs that read correctly from both sides at once — because that is how a real 3D set solves this problem. Everything addressed to one player (their Tray, turn indicator, Material Advantage, and the game result) lives on their own Player Edge, rotated to face them. The board itself carries no coordinates, since `a-h` and `1-8` are directional text that cannot be upright for both players, and with no notation panel in v1 they serve no purpose.

## Considered Options

- **Auto-flip the board each turn** — correct for passing a phone back and forth, wrong for a shared board on a table.
- **Rotate the pieces to face the active player** — rejected because it leaves the waiting player looking at an inverted board, which is strictly worse than the physical object it imitates: chess players think hardest on their opponent's time. It also animates 32 glyphs every move, and since most Staunton silhouettes are left-right symmetric, a 180° rotation reads as *upside-down* rather than as facing anyone.

## Consequences

- **No off-the-shelf piece set can be used.** Every standard set (Merida, Cburnett, Alpha) is drawn in one-way Staunton perspective, so the artwork is bespoke and sits on the critical path.
- This also sidesteps a licensing trap, as many popular SVG piece sets are GPL or CC-BY-SA.
- Whether a symmetric glyph still reads instantly as "knight" cannot be settled on paper and must be prototyped on a real device.

## Open question: which glyph system

The recognisability question above is being answered by a throwaway prototype on the
**`prototype/piece-set`** branch (`prototypes/piece-set/index.html`, open it directly in a
browser, or `npx serve prototypes` to reach it from a phone). It offers five candidates,
switchable with the arrow keys:

- **A — Top-down realism.** The literal view down onto a 3D set: the rook a crenellated ring,
  the king a cross, the bishop a slit disc. Its honest weakness is the knight, which from
  directly above is just a blob.
- **B — Mirrored Staunton.** The solution playing cards found: draw the familiar top half,
  then repeat it rotated 180°. Symmetric by construction and the strongest for recognition,
  but every glyph gets half the vertical space.
- **C — Movement semantics.** Draws *how the piece moves* rather than the piece — bishop a
  diagonal cross, rook an orthogonal cross, knight the constellation of its eight
  destinations. Symmetric for free and it teaches the game, but it asks the most of a player
  who already knows chess.
- **D — Diagonal mirror.** B's trick cut corner-to-corner instead of horizontally. The
  diagonal is 1.41× the side, so each half gets far more room, and the halves are stylised
  down to the piece's head alone so the set reads as emblems rather than little statues. Both
  players see their half tilted 45°, and identically so, so neither of them gets the
  upside-down seat.
- **E — Plain Staunton.** The control: ordinary one-way pieces with no mirroring, included so
  the premise of this ADR can be tested rather than assumed.

Two findings so far. **The knight decides this** — it is the only piece that faces a
direction, and it is the piece that fails in A (a featureless blob from above) and that
initially fused into a single wave in both mirrored schemes. In D it was rescued by pulling
the halves apart and adding an eye; that technique is the thing to carry forward.

And **plain Staunton is more defensible than this ADR assumed.** Staunton silhouettes are
left-right symmetric, so a 180° rotation is effectively a vertical flip: inverted pieces stay
*distinguishable*, merely upside-down-looking. The real trade is therefore not "correct
versus broken" but a small permanent learning cost on both players (symmetric glyphs) against
an inversion cost carried by whichever player is looking from the far side (Staunton). Three
things still argue against it: both players watch the board continuously, including on the
opponent's turn, so roughly half of all board-viewing is inverted; the knight is inverted
*and* facing backwards; and a casual audience reads pieces by shape rather than by position.
Above all, this app imitates a physical set on a table, and a physical set has no
upside-down problem at all.

The verdict is a judgement call to be made on a real device, and a mix is legitimate. Record
the answer here once it is made; the artwork is on the critical path.
