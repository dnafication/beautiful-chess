/**
 * The five colourways a table can be dressed in.
 *
 * A theme is the whole visual surface of the game in one value: the ink the
 * two sides' pieces are drawn in, and the two square colours they stand on.
 * Squares live here rather than in the Board because a piece is only ever
 * legible *against* a square — choosing the two independently is how a set
 * ends up with black pieces that disappear on a dark square.
 *
 * Pure data, like the piece module beside it: no React, no react-native-svg,
 * so the contrast guarantees below are testable in plain Node.
 *
 * Each theme obeys four rules, enforced by `themes.test.ts`:
 *
 * - Both sides carry an `edge` that contrasts with their own `body`, so the
 *   silhouette survives on either square colour. This is why black pieces get
 *   a light rim rather than the dark outline a printed diagram would use: on a
 *   dark square a dark-on-dark piece is a hole, and half of every board is
 *   dark.
 * - `accent` is the inverse of `body`, since it draws the marks cut *into* the
 *   piece — the knight's eye, the bishop's mitre slit, the collar lines.
 * - The two square colours differ enough to read as a chequer at arm's length
 *   on a table.
 * - Neither body matches either square, so no piece merges into what it
 *   stands on.
 */

/**
 * The three roles a set's artwork names its colours by. Held here rather than
 * in the artwork module because it is the theme that fills them in.
 */
export interface Ink {
  /** The bulk of the piece. */
  readonly body: string;
  /** Marks cut into the body: the knight's eye, the bishop's slit, collars. */
  readonly accent: string;
  /** The outline that carries the silhouette against any square. */
  readonly edge: string;
}

export type PieceThemeId = 'ivory' | 'walnut' | 'slate' | 'emerald' | 'rosewood';

export interface PieceTheme {
  readonly id: PieceThemeId;
  /** Shown to players in the set picker. Two words, no jargon. */
  readonly name: string;
  /** White's pieces. */
  readonly white: Ink;
  /** Black's pieces. */
  readonly black: Ink;
  /** The light squares of the board. */
  readonly squareLight: string;
  /** The dark squares of the board. */
  readonly squareDark: string;
  /**
   * The board's outer frame — the slab the 64 squares are inlaid into. Darker
   * than both squares in every theme, so the board reads as an object with an
   * edge rather than a rectangle of colour bleeding into the table.
   */
  readonly boardFrame: string;
  /**
   * The colour markers are tinted with over a square: selection, the last move
   * and the destination dots. Given per theme so a green marker never lands on
   * a green board.
   */
  readonly marker: string;
}

/**
 * Ivory and ink: the warm, paper-and-graphite default the app has always worn.
 */
const ivory: PieceTheme = {
  id: 'ivory',
  name: 'Ivory',
  white: { body: '#f7f4ec', accent: '#2a2a28', edge: '#3b3936' },
  black: { body: '#2f2d2a', accent: '#f4f1e8', edge: '#bfbbba' },
  squareLight: '#e9e1d1',
  squareDark: '#a08a6f',
  boardFrame: '#6f5c48',
  marker: '#2f5d3a',
};

/** Walnut: a warm brown board with cream and espresso pieces. */
const walnut: PieceTheme = {
  id: 'walnut',
  name: 'Walnut',
  white: { body: '#f3e6cd', accent: '#3a2718', edge: '#4a3323' },
  black: { body: '#33200f', accent: '#f3e6cd', edge: '#c9a071' },
  squareLight: '#e3cba4',
  squareDark: '#a1723f',
  boardFrame: '#5c3a21',
  marker: '#1f4d3d',
};

/** Slate: cool greys, the closest the set comes to a monochrome print. */
const slate: PieceTheme = {
  id: 'slate',
  name: 'Slate',
  white: { body: '#f2f4f6', accent: '#242a30', edge: '#2f3740' },
  black: { body: '#2b3238', accent: '#eef1f4', edge: '#b0bdc9' },
  squareLight: '#dfe4e9',
  squareDark: '#7f8d99',
  boardFrame: '#4c5761',
  marker: '#2a4a63',
};

/** Emerald: a deep green board with alabaster and forest pieces. */
const emerald: PieceTheme = {
  id: 'emerald',
  name: 'Emerald',
  white: { body: '#f4f1e4', accent: '#1e3a2c', edge: '#274534' },
  black: { body: '#1f3b2d', accent: '#f4f1e4', edge: '#a8ceb8' },
  squareLight: '#dfe6d2',
  squareDark: '#6f8f6a',
  boardFrame: '#3f5b41',
  marker: '#2a4a63',
};

/** Rosewood: a red-brown board with sand and oxblood pieces. */
const rosewood: PieceTheme = {
  id: 'rosewood',
  name: 'Rosewood',
  white: { body: '#f6eadb', accent: '#3d2020', edge: '#4c2727' },
  black: { body: '#40211f', accent: '#f6eadb', edge: '#d4a898' },
  squareLight: '#eddac2',
  squareDark: '#a16a5c',
  boardFrame: '#6b3f38',
  marker: '#1f4d3d',
};

/**
 * Every theme, in the order the picker offers them. Ordered warm → cool → warm
 * rather than alphabetically, so neighbouring swatches never look alike.
 */
export const pieceThemes: readonly PieceTheme[] = [
  ivory,
  walnut,
  slate,
  emerald,
  rosewood,
];

/** The set a table starts on, and the fallback for anything unrecognised. */
export const defaultPieceTheme: PieceTheme = ivory;

/**
 * The theme with this id, or the default. Takes `string | null | undefined`
 * deliberately: its caller is stored text from a previous version of the app,
 * which is untrusted, and an unknown id should dress the table in the default
 * rather than leave it undrawn.
 */
export function pieceThemeById(id: string | null | undefined): PieceTheme {
  return pieceThemes.find((theme) => theme.id === id) ?? defaultPieceTheme;
}
