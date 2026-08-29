# The rules module

Everything this app knows about chess. It is hand-written, has no dependencies, and runs in
plain Node — it never imports React, React Native or Expo. See
[ADR 0002](../../docs/adr/0002-hand-written-rules-engine.md) for why.

**This is not a chess engine.** There is no evaluation, no search, no move suggestion and no
computer opponent, and there never will be — see _Permanently out of scope_ in
[`AGENTS.md`](../../AGENTS.md). It is a referee: it knows what the rules permit, and nothing
about what is a good idea.

## Importing

Always import from the module root. Never reach into `./fen`, `./state`, `./game` or
`./coordinates` — those are internal and will change.

```ts
import { createGame, pieceAt, sideToMove } from '../rules';
```

There are no path aliases configured, so the specifier is relative to your file.

## Quick start

```ts
import { createGame, createGameFromFen, pieceAt, sideToMove, toFen } from '../rules';

const game = createGame();

sideToMove(game); // 'white'
pieceAt(game, 'e1'); // { color: 'white', type: 'king' }
pieceAt(game, 'e4'); // undefined
toFen(game); // 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

const endgame = createGameFromFen('8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1');
pieceAt(endgame, 'a5'); // { color: 'white', type: 'king' }
```

## API

### Creating a game

| Function                 | Returns | Notes                                                     |
| ------------------------ | ------- | --------------------------------------------------------- |
| `createGame()`           | `Game`  | The standard starting position, White to move.            |
| `createGameFromFen(fen)` | `Game`  | Any position. Throws `InvalidPositionError` on bad input. |
| `toFen(game)`            | string  | The position as FEN. Round-trips exactly.                 |

### Reading a game

| Function                | Returns               | Notes                                          |
| ----------------------- | --------------------- | ---------------------------------------------- |
| `pieceAt(game, square)` | `Piece \| undefined`  | `undefined` means the square is empty.         |
| `sideToMove(game)`      | `PieceColor`          | `'white'` or `'black'`.                        |
| `castlingRights(game)`  | `CastlingRights`      | Four booleans; see below.                      |
| `enPassantTarget(game)` | `Square \| undefined` | The FEN field verbatim; see the caveat below.  |
| `halfmoveClock(game)`   | number                | Halfmoves since the last capture or pawn move. |
| `fullmoveNumber(game)`  | number                | Starts at 1, increments after Black moves.     |

### Making moves

| Function                        | Returns             | Notes                                                       |
| ------------------------------- | ------------------- | ----------------------------------------------------------- |
| `legalMoves(game)`              | `readonly Move[]`   | Every legal move available to the side to move.             |
| `legalDestinations(game, from)` | `readonly Square[]` | Legal destination squares for the piece on `from`.          |
| `applyMove(game, move)`         | `Game`              | Returns a new game; throws `IllegalMoveError` if not legal. |
| `isCheck(game)`                 | boolean             | Whether the side to move is in check.                       |

#### Castling is one move, not two

A `Move` is a single `from`/`to` pair, and castling is expressed as the **king** moving two
squares toward its rook. There is no separate rook move to make and none appears in
`legalMoves` — the rook is relocated for you:

```ts
const game = createGameFromFen('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');

legalDestinations(game, 'e1'); // includes 'g1' and 'c1'
legalDestinations(game, 'e1'); // does NOT include 'h1' - you do not move king onto rook

const after = applyMove(game, { from: 'e1', to: 'g1' });
pieceAt(after, 'g1'); // { color: 'white', type: 'king' }
pieceAt(after, 'f1'); // { color: 'white', type: 'rook' }
pieceAt(after, 'h1'); // undefined
```

Two consequences for anything drawing a board: a castle animates **two** pieces from **one**
`Move`, and a king dragged onto its own rook is not a castle — the destination is `g1`/`c1`, the
king's square, never `h1`/`a1`.

`castlingRights` reports rights, not possibilities. A right is lost permanently the moment its
king or rook moves and is **not** restored by the rook returning home, so a position can have
every piece on its home square with no castling available. That distinction is why the rights
are tracked rather than inferred from the board, and #8 needs it again: two identical-looking
positions with different rights are different positions for repetition.

### Types

```ts
type PieceColor = 'white' | 'black';
type PieceType = 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king';
interface Piece {
  readonly color: PieceColor;
  readonly type: PieceType;
}

type File = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h';
type Rank = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8';
type Square = `${File}${Rank}`; // exactly the 64 strings 'a1'..'h8'

interface CastlingRights {
  readonly whiteKingside: boolean;
  readonly whiteQueenside: boolean;
  readonly blackKingside: boolean;
  readonly blackQueenside: boolean;
}

interface Move {
  readonly from: Square;
  readonly to: Square;
}
```

`Square` is a template literal type, so a typo is a compile error rather than a runtime
surprise:

```ts
pieceAt(game, 'e4'); // fine
pieceAt(game, 'j9'); // does not compile
```

## `Game` is opaque on purpose

A `Game` is a value you hold and pass back in. You cannot read its fields:

```ts
const game = createGame();
game.board; // does not compile - there is no public shape
```

This is deliberate. The internal representation — currently a 64-slot mailbox array — will grow
as move generation, undo and repetition tracking land, and nothing outside this module should
break when it does. Everything you need is available through the reader functions above; if
something is missing, add a function to the module rather than opening up the value.

The same rule applies to tests. They import from the module root like any other consumer.

The one exception is `perft.ts`, the correctness oracle for move generation. It is a test tool
rather than app surface, so it is not re-exported from `index.ts` and `perft.test.ts` imports it
directly. `perft.ts` itself imports only from `./index`, which is what makes "perft runs against
the public interface" visible in one line rather than merely claimed.

## FEN notes

Two things differ from what you may expect.

**All six fields are required.** `rnbq... w KQkq -` is rejected; you need
`rnbq... w KQkq - 0 1`. Shortened four-field FEN is common in published test positions but
cannot round-trip, and round-tripping is a guarantee this module makes. If you are copying a
position from the Chess Programming Wiki, append the two clocks.

**`enPassantTarget` is the literal FEN field.** FEN records a target square after _any_ double
pawn push, whether or not a capture is actually available. It does not tell you an en passant
capture is legal. The stricter notion — availability in the legal sense, which
[threefold repetition needs](../../docs/adr/0002-hand-written-rules-engine.md) — is a separate
concept and is not this field.

## Errors

`createGameFromFen` throws `InvalidPositionError` and never returns a half-built game. Either
you get a sound position or you get an exception. `applyMove` likewise throws
`IllegalMoveError` rather than applying a move that is not legal.

```ts
import { createGameFromFen, InvalidPositionError } from '../rules';

try {
  createGameFromFen(untrustedInput);
} catch (error) {
  if (error instanceof InvalidPositionError) {
    // error.message says which field was wrong
  }
}
```

Rejected: the wrong number of fields; the wrong number of ranks; a rank that does not sum to 8
squares; an unknown piece letter; a bad side-to-move token, castling string or en-passant
square; a non-numeric or negative clock; and a position missing either king.

Not rejected: deeper chess illegality, such as pawns on the first rank or a side-to-move
delivering check to a king that cannot be captured. Validation here is structural. The two
kings are the one semantic check, because everything downstream assumes they exist.

## Not built yet

Position setup, reading, move generation, en passant and castling exist today. Still to come,
each behind this same interface:

| Feature                                           | Ticket |
| ------------------------------------------------- | ------ |
| Promotion                                         | #7     |
| Game-end classification, Material Advantage, undo | #8–#12 |

Until promotion lands, a pawn reaching the last rank has **no legal move at all** — the
generator omits the move rather than promoting to a queen by default. Kiwipete perft is pinned
short by exactly that shortfall; see `perft.test.ts`.

Applying a move will return a _new_ game rather than mutating, which is what makes unlimited
undo correct: history is a list of prior values, so undo cannot forget to restore castling
rights or the en-passant square.

## Working on this module

- **Never import React, React Native or Expo, and never touch a browser global.** `npm run lint`
  fails if you do — the boundary is mechanical, not a convention.
- **Tests are `.ts`, never `.tsx`**, run in the `node` environment, and import from `./index`.
  A test needing JSX is testing UI, which v1 verifies by hand.
- **Perft is the correctness oracle** for move generation. Node counts for the six standard
  positions are in
  [the research doc](../../docs/research/rules-libraries-by-platform.md), and a mismatch is
  unambiguous.
- **Round-trip tests cannot catch a mirrored board** — parse and serialise would be wrong in
  exactly cancelling ways. `squares.test.ts` pins absolute orientation for this reason. Keep it.

Internal layout, smallest dependency first:

| File             | Owns                                                         |
| ---------------- | ------------------------------------------------------------ |
| `types.ts`       | The vocabulary. Depends on nothing.                          |
| `coordinates.ts` | The `Square` ↔ `0..63` bijection, and all index arithmetic.  |
| `fen.ts`         | Six codecs, one per FEN field, each holding both directions. |
| `state.ts`       | The internal shape, and the opaque-cast pair.                |
| `game.ts`        | The public functions.                                        |
| `index.ts`       | The barrel. The only thing the rest of the app may import.   |
