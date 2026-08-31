# Five colourways, one construction

The placeholder Staunton set has been redrawn to a single shared construction, and the
table can now be dressed in one of **five colourways** chosen by either player. Colour is
no longer a property of the artwork: the drawing names its colours by role — `body`,
`accent`, `edge` — and a theme fills those roles in, along with the two square colours the
pieces stand on. One drawing, five dressings, twelve pieces each.

This does not reopen [ADR 0004](./0004-plain-staunton-pieces.md). The pieces are still
plain one-way Staunton, still flat vector silhouettes with no gradients and no perspective
shading, still upright from White's side on a board that never flips. What changed is that
the artwork got the care of a finished set rather than a control in a prototype, and that
the ink became data.

## Why the squares belong to the theme

A piece is only ever legible _against_ a square. Choosing piece colours in one module and
square colours in another is how a set ends up with a black bishop that vanishes on a dark
square — nobody picked that, it fell out of two reasonable choices made separately. So a
theme carries both, plus the board's frame and the colour its markers are tinted with, and
`themes.test.ts` holds the whole thing to legibility floors:

- each side's outline separates it from its own body, which is why black pieces carry a
  **light** rim rather than the dark outline a printed diagram would use: on a dark square a
  dark-outlined dark piece is a hole, and half of every board is dark;
- on every square colour, a piece is separated by its body or by its edge;
- the two sides are far more different from each other than from anything else;
- the markers show on both square colours, so a green marker never lands on a green board.

The check tint is the one colour a theme does not get to choose. It stays red in all five,
because it is a warning rather than decoration.

## Why one construction for six pieces

Every piece now stands on the same baseline, on the same plinth and riser, and carries one
inlaid accent line at its collar. That is what makes six different silhouettes look like six
pieces turned on the same lathe rather than six drawings that happen to share a folder — and
it is also what makes a Tray of captured pieces sit on one line instead of bobbing, which
the previous set did, its plinths sitting at three different heights.

The single inlay is the only ornament, and deliberately so: one line survives being shrunk to
a Tray glyph, where hatching or shading would silt up into a smudge at the sizes this app
actually draws at.

## Consequences

- **Colour is data, so a sixth colourway is a five-line object** and inherits the tested
  legibility floors for free.
- **The commission brief in ADR 0004 gains a requirement**: replacement artwork must name its
  colours by the same three roles rather than shipping fixed hexes, or it can only ever be
  drawn in one colourway.
- **The choice is per table, not per player.** Both players look at one board, so there is one
  set, chosen from either Player Edge and remembered on the device.
- **Still no dark mode.** The five colourways change the board, not the chrome around it; a
  dark UI is a separate decision with its own contrast work.
