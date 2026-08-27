# Fixed board with orientation-neutral pieces

The device lies flat on a table between two players who face each other, so the board never flips and never rotates: it behaves like a physical chess set, which each player simply views from their own side. The pieces are drawn **orientation-neutral** — symmetric glyphs that read correctly from both sides at once — because that is how a real 3D set solves this problem. Everything addressed to one player (their Tray, turn indicator, Material Advantage, and the game result) lives on their own Player Edge, rotated to face them. The board itself carries no coordinates, since `a-h` and `1-8` are directional text that cannot be upright for both players, and with no notation panel in v1 they serve no purpose.

## Considered Options

- **Auto-flip the board each turn** — correct for passing a phone back and forth, wrong for a shared board on a table.
- **Rotate the pieces to face the active player** — rejected because it leaves the waiting player looking at an inverted board, which is strictly worse than the physical object it imitates: chess players think hardest on their opponent's time. It also animates 32 glyphs every move, and since most Staunton silhouettes are left-right symmetric, a 180° rotation reads as *upside-down* rather than as facing anyone.

## Consequences

- **No off-the-shelf piece set can be used.** Every standard set (Merida, Cburnett, Alpha) is drawn in one-way Staunton perspective, so the artwork is bespoke and sits on the critical path.
- This also sidesteps a licensing trap, as many popular SVG piece sets are GPL or CC-BY-SA.
- Whether a symmetric glyph still reads instantly as "knight" cannot be settled on paper and must be prototyped on a real device.
