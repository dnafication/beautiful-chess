# Beautiful Chess

A chess app for phones and tablets in which two people play each other on a single shared device. There is no computer opponent and no online play.

## Language

**Pass-and-Play**:
The only mode of play: two people taking alternate turns on one physical device. _Avoid_: local multiplayer, hotseat, two-player mode.

**Table Posture**:
The assumed physical arrangement — the device lies flat on a surface between the two players, who face each other from opposite sides. _Avoid_: tabletop mode, flat mode.

**Player Edge**:
The region of the screen belonging to one player, along the side of the board nearest them, holding everything addressed to that player alone. Each player has exactly one. _Avoid_: panel, sidebar, HUD, player area.

**Tray**:
The display of pieces a player has captured, shown on that player's Player Edge. Purely a display; it is never the source of any calculation. _Avoid_: captured pieces bar, graveyard.

**Orientation-Neutral**:
Of a piece glyph: drawn symmetrically so that it reads correctly to both players at once, the way a physical 3D piece does. The property that lets the board stay fixed. _Avoid_: two-way, reversible, symmetric.

**Material Advantage**:
The difference in total piece value between the two sides, derived from the pieces standing on the board rather than from the Tray, so that promotions are reflected. Not a measure of who is winning. _Avoid_: winning edge, score, points, advantage, evaluation.
