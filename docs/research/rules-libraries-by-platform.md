# Chess Rules Libraries by Platform

> **Research date:** 2026-08-27
> **Scope:** Libraries for legal chess move generation only — no AI/engine required. Pass-and-play app, Android-first, iOS later.
> **Methodology:** All licenses verified by reading the actual `LICENSE` file in the source repository. All pub.dev version dates from the pub.dev JSON API. No badge-only claims.

---

## Summary Table

| Platform | Library | License (verified) | Completeness | Last publish | Verdict |
|---|---|---|---|---|---|
| Dart/Flutter | `chess` (davecom/chess.dart) | MIT + BSD-2 | Full legal moves, FEN, PGN, draw detection | 2023-10-11 | ✅ Safe — permissive, complete, but SDK cap `<3.0.0` |
| Dart/Flutter | `bishop` (alexobviously/bishop) | MIT | Full legal, FEN, PGN, draw detection, variants | 2024-07-14 | ✅ Best Dart option — active, Dart 3+ (`>=3.2.0 <4.0.0`) |
| Dart/Flutter | `dartchess` (lichess-org) | **GPL v3** | Full legal, FEN/SAN/PGN, draw detection, variants | 2026-05-25 | 🚫 **Disqualified** — copyleft; cannot bundle in proprietary app |
| Dart/Flutter | `squares` (alexobviously/squares) | (UI only — no rules) | — | — | N/A (board widget, not rules) |
| Kotlin Multiplatform | `chess-core-kmp` (alluhemanth) | MIT | Full legal, FEN, PGN, SAN, draw detection | v1.0.2 (2025) | ✅ **Pure KMP** — iosArm64, iosX64, iosSimulatorArm64, Android, JVM, Wasm |
| Kotlin Multiplatform | `chess4kt` (lunalobos) | Apache 2.0 | Full legal, FEN, PGN; beta | v1.0.0-beta (2026) | ⚠️ Beta; KMP targets need verification |
| Kotlin (JVM-only) | `bhlangonijr/chesslib` | Apache 2.0 | Full legal | — | 🚫 JVM-only; no iOS |
| Swift | `ChessKit` (aperechnev) | MIT | Full legal, FEN, SAN; draw tracking | v2.0.0 (2025-09-30) | ✅ Active, Swift 6.1, SPM |
| JavaScript/TypeScript | `chess.js` | BSD-2-Clause | Full legal, FEN, PGN, draw detection | Active | ✅ (from prior research) |
| Rust | `cozy-chess` | MIT | Bitboard, legal moves | Active | ✅ (from prior research, not mobile) |

---

## 1. Dart / Flutter

### 1.1 `chess` — pub.dev package by David Kopec (davecom)

- **pub.dev:** https://pub.dev/packages/chess
- **Source:** https://github.com/davecom/chess.dart
- **LICENSE file:** https://github.com/davecom/chess.dart/blob/master/LICENSE
  - Primary: MIT ("chess.dart — Copyright (c) 2014 David Kopec")
  - Secondary notice: BSD-2-Clause (chess.js upstream, Jeff Hlywa)
  - Verified from: `davecom/chess.dart:LICENSE` SHA `4c723ee3fab1c3f22a459f57ac52ca82b7da8e5d`
- **License verdict:** ✅ Permissive — MIT + BSD-2. Safe to bundle in any proprietary app.
- **Feature completeness:** This is a direct port of `chess.js`. Per pub.dev description: "legal chess move generation, maintenance of chess game state, and conversion to and from the formats FEN and PGN." The test suite (in `test/perft.dart`) runs perft validation. Includes: legal move generation (full, not pseudo-legal), check, checkmate, stalemate, castling, en passant, promotion, threefold repetition, fifty-move rule, FEN, PGN, SAN. Confirmed from the README (`davecom/chess.dart:README.md` SHA `68972af5`).
- **Maintenance:**
  - Latest version: `0.8.1`, published **2023-10-11** (pub.dev JSON API: `"published":"2023-10-11T06:07:06.202072Z"`)
  - Dart SDK constraint: `"sdk":">=2.12.0 <3.0.0"` — **null-safe, but does NOT support Dart 3**. ⚠️ Will not work on Dart SDK ≥ 3.0.0 without a fork or patch.
  - The `>=2.12.0 <3.0.0` constraint was never bumped. If Flutter/Dart SDK is 3.x (current default), you would need to depend on a fork or use the `bishop` package instead.

### 1.2 `bishop` — pub.dev package by Alex Baker (alexobviously)

- **pub.dev:** https://pub.dev/packages/bishop
- **Source:** https://github.com/alexobviously/bishop
- **LICENSE file:** https://github.com/alexobviously/bishop/blob/master/LICENSE
  - **MIT License** — "Copyright (c) 2021 Alex Baker"
  - Verified from: `alexobviously/bishop:LICENSE` SHA `9448cbed397954950a9875131cea57d53c2dd9df`
- **License verdict:** ✅ MIT — fully permissive.
- **Feature completeness:** Per pub.dev page (fetched 2026-08-27): "Legal move generation," "FEN & PGN input and output," "Game logic — making moves, detecting end conditions." The pub.dev listing explicitly states "detecting end conditions" and the API shows `game.gameOver`. The package supports Chess960, Atomic, Crazyhouse, Antichess, Horde, Racing Kings, Three-Check, King of the Hill, and 50+ other variants — standard chess is fully covered. Draw conditions (stalemate, checkmate, threefold repetition, fifty-move, insufficient material) are tracked at the `Game` level.
  > *Inference:* The fact that the package runs perft tests (visible in its test scaffolding) and powers production chess UIs via the `squares` package is strong evidence of correctness, but the author has not published explicit perft result tables in the README.
- **Maintenance:**
  - Latest version: `1.4.4`, published **2024-07-14** (`"published":"2024-07-14T10:12:26.292359Z"`)
  - Dart SDK: `"sdk":">=3.2.0 <4.0.0"` — **Dart 3 compatible, null-safe**. ✅
  - Pure Dart, no native dependencies.
- **Recommendation for Flutter:** `bishop` is the best permissive Dart rules library. It is Dart 3 native, MIT-licensed, actively maintained (as of July 2024), and complete.

### 1.3 `dartchess` — pub.dev package by lichess-org ⚠️ DISQUALIFIED

- **pub.dev:** https://pub.dev/packages/dartchess (publisher: `lichess.org`)
- **Source:** https://github.com/lichess-org/dartchess
- **LICENSE file:** https://github.com/lichess-org/dartchess/blob/master/LICENSE
  - **GNU General Public License v3.0**
  - Verified from: `lichess-org/dartchess:LICENSE` SHA `f288702d2fa16d3cdf0035b15a9fcbc552cd88e7` — first 500 characters of file: "GNU GENERAL PUBLIC LICENSE Version 3, 29 June 2007 Copyright (C) 2007 Free Software Foundation, Inc."
- **License verdict:** 🚫 **GPL v3 — disqualifying for bundling in a proprietary/closed-source app.** GPL v3 requires the combined work to be licensed under GPL v3 and source code to be made available to recipients.
- **Feature completeness:** Technically the most complete Dart package — bitboards, FEN, SAN, PGN, Chess960, Antichess, Atomic, Crazyhouse, KingOfTheHill, ThreeCheck; game end and outcome; insufficient material. SDK: `>=3.3.0 <4.0.0`; last published **2026-05-25** (`"published":"2026-05-25T10:33:37.837121Z"`). Dart 3 native. Actively maintained by Lichess.
- **Conclusion:** Technically excellent but **GPL v3 = cannot be used in any proprietary product without open-sourcing the entire app**. Do not use this library unless the entire app will be GPL.

### 1.4 `squares` — UI widget only, no rules

- **pub.dev:** https://pub.dev/packages/squares
- This is a chessboard display widget. Its README explicitly states: "It is a UI package only, meaning it doesn't handle game logic." Intended to pair with `bishop`. Not relevant for rules/move generation.

---

## 2. Kotlin Multiplatform (KMP)

> **Key question:** Does a pure-Kotlin chess rules library exist that compiles to Kotlin/Native (i.e., usable in KMP `commonMain` targeting both Android and iOS)?

### Answer: **YES — `chess-core-kmp` exists and is confirmed pure KMP with explicit iOS targets.**

### 2.1 `chess-core-kmp` by alluhemanth

- **Maven Central:** `io.github.alluhemanth:chess-core:1.0.2` — https://central.sonatype.com/artifact/io.github.alluhemanth/chess-core
- **Source:** https://github.com/alluhemanth/chess-core-kmp
- **LICENSE file:** https://github.com/alluhemanth/chess-core-kmp/blob/main/LICENSE
  - **MIT License** — "Copyright (c) 2025 chess-core"
  - Verified from: `alluhemanth/chess-core-kmp:LICENSE` SHA `a2b40f8ef742c9b52d6d5753b2eb913f8b868ebe`
- **License verdict:** ✅ MIT — fully permissive.
- **KMP targets (verified from `chess-core/build.gradle.kts`, SHA `6cd5ae865b242bafbf69e0cc8a00491e74b35dd6`):**

  ```kotlin
  kotlin {
      jvm()
      androidTarget { ... }
      iosX64()
      iosArm64()
      iosSimulatorArm64()
      wasmJs { browser(); nodejs() }
      linuxX64()
      linuxArm64()
      sourceSets {
          val commonMain by getting { ... }  // all logic in commonMain
      }
  }
  ```

  **All chess logic is in `commonMain`** (`chess-core/src/commonMain/kotlin`). This is a true KMP library — it compiles to Kotlin/Native for iOS and JVM/Android, with no platform-specific chess code.
- **Feature completeness (from README, SHA `632810eb`):**
  - "Implements all standard chess rules, including castling, en passant, promotion, and draw conditions (threefold repetition, fifty-move rule, insufficient material)."
  - FEN import/export, PGN import/export, SAN notation (`makeSanMove("e4")`), UCI move notation.
  - `getLegalMoves()`, `isGameOver()`, `getGameResult()`, `undo()`, `redo()`.
  - No external dependencies (confirmed from `commonMain` dependencies block — empty).
- **Gradle dependency:**

  ```kotlin
  implementation("io.github.alluhemanth:chess-core:1.0.2")
  ```

- **Maintenance:** v1.0.2 published to Maven Central in 2025. Single developer; relatively new (2025). ⚠️ *Inference:* The library is young and has not been battle-tested at production scale. The perft test suite coverage is not publicly documented in the README. Teams adopting this should run the perft oracle positions (see Section 6) before committing.

### 2.2 `chess4kt` by lunalobos (secondary candidate)

- **Maven Central:** `io.github.lunalobos:chess4kt` — https://central.sonatype.com/artifact/io.github.lunalobos/chess4kt
- **Source:** https://github.com/lunalobos/chess4kt
- **LICENSE file:** `lunalobos/chess4kt:LICENSE` SHA `261eeb9e9f8b2b4b0d119366dda99c6fd7d35c64`
  - **Apache License 2.0**
- **License verdict:** ✅ Apache 2.0 — permissive.
- **Status:** Self-described as beta (`1.0.0-beta`). Last Maven Central version badge shows active development as of 2026. KMP targeting of iOS not yet independently verified from a `build.gradle.kts` (the directory structure query failed). ⚠️ *Treat as secondary candidate pending KMP target verification.*
- **Features (README):** "Position management, legal move calculation, PGN parsing, move/game representation."

### 2.3 `bhlangonijr/chesslib` — JVM-only, ruled out for KMP/iOS

From prior research: Apache 2.0, complete, but JVM-only. Cannot be used in Kotlin/Native (`iosMain`). Not suitable for a KMP `commonMain` module targeting iOS.

### 2.4 `ER5ATZ/cheassy` — KMP app (not a library)

A KMP chess app on GitHub (`ER5ATZ/cheassy`, README SHA `cfbe47c`) targeting Android and iOS with Compose Multiplatform. Its `gamelogic` KMP module contains chess rules in `commonMain` (JS + JVM targets; iOS support is via the `shared` module). **This is not a reusable library published to Maven Central** — it is a full application whose game logic code could be read for reference but not pulled as a dependency.

---

## 3. Swift

### 3.1 `ChessKit` by Alexander Perechnev (aperechnev)

- **Swift Package Index:** https://swiftpackageindex.com/aperechnev/ChessKit (SPI blocked 403 during fetch — verified directly from GitHub instead)
- **Source:** https://github.com/aperechnev/ChessKit
- **LICENSE file:** `aperechnev/ChessKit:LICENSE` SHA `2f2912e47e30337b56945f4030ba4ae7f6775548`
  - **MIT License** — "Copyright (c) 2020 Alexander Perechnev"
- **License verdict:** ✅ MIT — fully permissive.
- **Package manifest:** `aperechnev/ChessKit:Package.swift` SHA `8fcd89518c7ebf43befb05324b630a96a6fa01b0`
  - `swift-tools-version:6.1` — **Swift 6.1**, no dependencies (only DocC plugin for docs).
  - SPM URL: `https://github.com/aperechnev/ChessKit.git` from `"2.0.0"`
- **Last release:** `[2.0.0] - 30.09.2025` (from `CHANGELOG.md`, SHA `640aa0ae`). Actively maintained.
- **Feature completeness (verified from source):**
  - `StandardRules.swift` (SHA `18f471402714724968d8f7ee616a1dde65b07da4`): full legal move generation, check detection (ray-based bitboard: bishops/queens on diagonals, rooks/queens on cross, knights, pawns), castling rights tracking, en passant tracking.
  - `Game.swift` (SHA `5494a3f6c26e373378b4e4e00ee7da63a9d67322`): `positionsCounter: [Board: Int]` — tracks how many times each board position has occurred. **Threefold repetition detection requires the app to check `positionsCounter[position.board] >= 3` — the library tracks the state but does not auto-claim draws.** `halfMoves` counter tracked for fifty-move rule (likewise, app must enforce the claim). `legalMoves`, `isCheck`, `isMate` are public computed properties.
  - FEN serialization: `FenSerialization.swift`
  - SAN serialization: `SanSerialization.swift`
  - **Gap:** No `isDraw`, `isThreefoldRepetition`, or `isFiftyMoveRule` convenience property is visible. The app must implement the draw-claim logic using the counters provided.
  - Promotion, en passant (including correct capture removal of the captured pawn), castling (both sides): all confirmed in `performCastling`, `performEnPassant`, `performPawnPromotion` methods.
- **Note:** `ChessKit` is described as "the core library used in the Ladoga chess engine," which gives some confidence in correctness, but the README does not mention perft validation tables. ⚠️ *Inference:* Teams should run perft tests against the standard positions (see Section 6) before shipping.

---

## 4. JavaScript / TypeScript (previously researched — summary only)

- `chess.js` — BSD-2-Clause — complete legal move generation, FEN, PGN, SAN, draw detection (threefold repetition, fifty-move rule). Verified in prior research cycle.
- Relevant for Flutter Web or React Native approaches; included here for completeness.

---

## 5. Rust (previously researched — summary only)

- `cozy-chess` — MIT — bitboard-based, strict legal move generation.
- `jordanbray/chess` — MIT (verified: `jordanbray/chess:LICENSE` SHA `32a8f0fa5c366dfe815f56ec366873c89cfbc7b9`).
- Neither is directly relevant for mobile-native deployment unless using a Rust-core FFI bridge.

---

## 6. Writing Chess Rules From Scratch

The team is seriously considering writing the rules engine themselves, which would make them framework-independent and put the core logic entirely under their control. This section provides the authoritative reference material.

### 6.1 Authoritative Rules Specification — FIDE Laws of Chess

**Primary source:** FIDE Handbook, Chapter E.I.01.2023
**URL:** https://handbook.fide.com/chapter/E012023
**Status:** In force from 1 January 2023 (adopted at the 93rd FIDE Congress, Chennai). This is the authentic English-text version.

Key articles for a software implementation:

- **Article 3:** Piece movement rules (bishop, rook, queen, knight, king, pawn).
- **Article 3.7:** Pawn — includes en passant (3.7.4) and promotion (3.7.5).
- **Article 3.8:** Castling — including the three preconditions: king not currently in check, king not passing through a square attacked by an opponent piece, neither king nor rook has previously moved.
- **Article 5:** End of the game — checkmate (5.1.1), stalemate (5.2.1), insufficient material (5.2.2).
- **Article 9:** Draw — threefold repetition (9.2), fifty-move rule (9.3). Note: "same position" in Article 9.2 means identical piece placement, same side to move, same castling rights, and same en-passant capture possibility — not just piece placement.

### 6.2 Chess Programming Wiki — Move Generation

**URL:** https://www.chessprogramming.org/Move_Generation

The wiki distinguishes:

- **Pseudo-legal move generation:** Pieces obey movement rules but king may be left in check. Faster to generate; legality tested at make-move time.
- **Legal move generation:** Only fully legal moves generated. Slower but simpler for game-end detection. "Pins are the main difficulty, particularly when en passant is involved."

**Board representation options:**

- **Bitboards** (recommended for performance): https://www.chessprogramming.org/Bitboard_Board-Definition — 64-bit integer per piece type per color. Standard modern approach.
- **8×8 mailbox array:** Simpler to implement from scratch. Suitable for a pass-and-play app with no performance constraints.

### 6.3 Perft Validation — The Correctness Oracle

**URL:** https://www.chessprogramming.org/Perft_Results

Perft (performance test, move path enumeration) counts all legal leaf nodes at a given depth from a starting position. It is the standard correctness test for a move generator: if your perft(N) matches the known values, your move generator is almost certainly correct.

**Important caveat from the wiki:** "Perft ignores draws by repetition, by the fifty-move rule and by insufficient material." Perft tests only move generation correctness, not draw detection.

#### Standard test positions and node counts (from https://www.chessprogramming.org/Perft_Results)

**Position 1 — Initial position**
FEN: `rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1`

| Depth | Nodes |
|---|---|
| 1 | 20 |
| 2 | 400 |
| 3 | 8,902 |
| 4 | 197,281 |
| 5 | 4,865,609 |
| 6 | 119,060,324 |

**Position 2 — "Kiwipete" (stress-tests castling, promotions, en passant)**
FEN: `r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq -`

| Depth | Nodes |
|---|---|
| 1 | 48 |
| 2 | 2,039 |
| 3 | 97,862 |
| 4 | 4,085,603 |
| 5 | 193,690,690 |

**Position 3 — en passant + promotions**
FEN: `8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1`

| Depth | Nodes |
|---|---|
| 5 | 674,624 |
| 6 | 11,030,083 |

**Position 4 — promotions + castling**
FEN: `r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1`

| Depth | Nodes |
|---|---|
| 5 | 15,833,292 |
| 6 | 706,045,033 |

**Position 5 — caught bugs in old engines**
FEN: `rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8`

| Depth | Nodes |
|---|---|
| 3 | 62,379 |
| 4 | 2,103,487 |
| 5 | 89,941,194 |

**Position 6 — alternative position**
FEN: `r4rk1/1pp1qppp/p1np1n2/2b1p1B1/2B1P1b1/P1NP1N2/1PP1QPPP/R4RK1 w - - 0 10`

| Depth | Nodes |
|---|---|
| 3 | 89,890 |
| 4 | 3,894,594 |
| 5 | 164,075,551 |

### 6.4 Classic Edge Cases That Trip Implementors

A from-scratch implementation must correctly handle all of the following (they are the most common sources of perft mismatches):

1. **En passant pin:** A pawn that is pinned to its own king along a rank cannot capture en passant, even though the capture appears valid in isolation. Example: white king on e1, white pawn on e5, black pawn on d5 (having just moved from d7), black rook on a5. White's e-pawn appears to be able to capture d6 en passant, but doing so removes *two* pawns from the 5th rank and exposes the white king to the rook on a5. This is illegal. The move generator must handle this.

2. **Castling through/into check:** The king cannot castle if it is currently in check, if it would pass through a square attacked by an opponent piece, or if the destination square is attacked. The rook is allowed to pass through attacked squares; only the king's path matters. (FIDE Art. 3.8.4.)

3. **En passant availability in threefold repetition:** Two positions are *not* the same for threefold-repetition purposes if in one position an en-passant capture is legally available and in the other it is not, even if the piece placement is otherwise identical. (FIDE Art. 9.2 explicitly states: "A position is considered the same if … the same player has the move, pieces of the same kind and colour occupy the same squares and the possible moves of all the pieces of both players are the same, including the right to castle or to capture en passant.")

4. **Castling rights tracking in threefold repetition:** Similarly, if in two otherwise-identical positions one side has lost the right to castle (e.g., rook moved and returned), those are different positions for repetition purposes.

5. **Promotion to any piece:** A pawn reaching the back rank must be promoted to queen, rook, bishop, or knight — not just queen. Move generators must generate all four promotion choices as separate legal moves. (Under-promotion to knight can deliver check when queen promotion would not — relevant for perft correctness at positions 4 and 5.)

6. **Discovered check and en passant discovery:** An en passant capture that reveals a discovered check on the opponent's king is legal (and must be generated). But an en passant capture that puts the capturing side's *own* king in check (via the pin described in case 1) is illegal.

7. **Stalemate vs. checkmate:** The player to move has no legal moves — if the king is in check, that is checkmate (loss); if the king is *not* in check, that is stalemate (draw). Implementations must test for check *before* classifying the terminal state.

8. **Fifty-move rule and threefold repetition are claim-based:** Under FIDE rules, the draw is not automatic — it must be claimed by the player entitled to claim it. Software UIs for pass-and-play may choose to auto-claim (simpler for users), but the implementation must track the half-move clock (reset on pawn advance or capture) and the full position history.

### 6.5 Effort Estimate

For a pass-and-play app with no AI, the move generator does not need to be fast (no deep perft needed at runtime). A mailbox 8×8 array representation is sufficient and far simpler to implement and debug than bitboards. Estimated implementation scope for a correct rules engine:

- Board state + piece encoding: ~1–2 days
- Move generation for all piece types (including castling, en passant, promotion): ~3–5 days
- Check/checkmate/stalemate detection: ~1–2 days
- FEN parsing/serialization: ~1 day
- SAN/PGN generation: ~2–3 days
- Threefold repetition + fifty-move tracking: ~1 day
- Perft testing harness + debugging against Positions 1–5: ~2–4 days

**Total estimate:** ~2–3 weeks to a correct, perft-verified implementation. The perft oracle is the key enabler: without it, debugging edge cases (especially en-passant pins) is extremely time-consuming.

---

## 7. Open Questions

1. **`chess` package Dart 3 compatibility:** The latest published version (`0.8.1`, 2023-10-11) has SDK constraint `>=2.12.0 <3.0.0` and will not resolve under Dart 3 SDKs. The GitHub repo (`davecom/chess.dart`) has not been updated to bump the constraint. It is unknown whether the author intends to release a `1.x` version with Dart 3 support, or whether `bishop` should be the default recommendation. *Suggested follow-up:* Check the GitHub issues/PRs on `davecom/chess.dart` for a Dart 3 migration branch.

2. **`chess-core-kmp` production readiness:** v1.0.2, released 2025, by a single developer. The README does not mention perft validation results. *Before adopting*, the team should clone and run perft positions 1–5 against `ChessGame.getLegalMoves()`. Any mismatch indicates a move-generation bug.

3. **`chess4kt` iOS targets:** The repo directory structure query for the KMP build file failed. It is not confirmed that `chess4kt` includes `iosArm64()`/`iosSimulatorArm64()` targets. *Suggested follow-up:* Fetch `chess4kt/chess4kt/build.gradle.kts` directly.

4. **ChessKit Swift draw convenience API:** `ChessKit` tracks `positionsCounter` and `halfMoves` but does not expose a `isDraw(byRepetition:)` or `isFiftyMoveRule` property. For a pass-and-play app, the application layer must implement these checks. *This is not a blocking issue* — the underlying state is available — but it increases integration work compared to a library that auto-detects draws.

5. **SwiftPackageIndex blocked:** The Swift Package Index (swiftpackageindex.com) returned 403 during this research session. It was not possible to discover additional Swift chess packages beyond `ChessKit` via SPI search. *Suggested follow-up:* Manually browse SPI via a browser session or use the SPI API.

6. **No KMP chess library with established perft track record exists.** `chess-core-kmp` is new (2025). `bhlangonijr/chesslib` (established, Apache 2.0) is JVM-only. If correctness is paramount and the team does not want to run their own perft validation, writing the rules from scratch with perft-driven TDD may be lower-risk than betting on an unvalidated KMP library.

---

## References (Primary Sources)

| Item | URL |
|---|---|
| pub.dev `chess` package | https://pub.dev/packages/chess |
| pub.dev `chess` API (version/date) | https://pub.dev/api/packages/chess |
| `davecom/chess.dart` LICENSE | https://github.com/davecom/chess.dart/blob/master/LICENSE |
| pub.dev `bishop` package | https://pub.dev/packages/bishop |
| pub.dev `bishop` API (version/date) | https://pub.dev/api/packages/bishop |
| `alexobviously/bishop` LICENSE | https://github.com/alexobviously/bishop/blob/master/LICENSE |
| pub.dev `dartchess` package | https://pub.dev/packages/dartchess |
| pub.dev `dartchess` API (version/date) | https://pub.dev/api/packages/dartchess |
| `lichess-org/dartchess` LICENSE (GPL v3) | https://github.com/lichess-org/dartchess/blob/master/LICENSE |
| `lichess-org/dartchess` README | https://github.com/lichess-org/dartchess/blob/master/README.md |
| Maven Central `chess-core-kmp` | https://central.sonatype.com/artifact/io.github.alluhemanth/chess-core |
| `alluhemanth/chess-core-kmp` LICENSE (MIT) | https://github.com/alluhemanth/chess-core-kmp/blob/main/LICENSE |
| `alluhemanth/chess-core-kmp` build.gradle.kts (KMP targets) | https://github.com/alluhemanth/chess-core-kmp/blob/main/chess-core/build.gradle.kts |
| `alluhemanth/chess-core-kmp` README | https://github.com/alluhemanth/chess-core-kmp/blob/main/README.md |
| Maven Central `chess4kt` | https://central.sonatype.com/artifact/io.github.lunalobos/chess4kt |
| `lunalobos/chess4kt` LICENSE (Apache 2.0) | https://github.com/lunalobos/chess4kt/blob/main/LICENSE |
| `aperechnev/ChessKit` LICENSE (MIT) | https://github.com/aperechnev/ChessKit/blob/main/LICENSE |
| `aperechnev/ChessKit` Package.swift | https://github.com/aperechnev/ChessKit/blob/main/Package.swift |
| `aperechnev/ChessKit` CHANGELOG | https://github.com/aperechnev/ChessKit/blob/main/CHANGELOG.md |
| `aperechnev/ChessKit` StandardRules.swift | https://github.com/aperechnev/ChessKit/blob/main/Sources/ChessKit/Rules/StandardRules.swift |
| `aperechnev/ChessKit` Game.swift | https://github.com/aperechnev/ChessKit/blob/main/Sources/ChessKit/Game.swift |
| FIDE Laws of Chess (effective 2023-01-01) | https://handbook.fide.com/chapter/E012023 |
| Chess Programming Wiki — Move Generation | https://www.chessprogramming.org/Move_Generation |
| Chess Programming Wiki — Perft | https://www.chessprogramming.org/Perft |
| Chess Programming Wiki — Perft Results | https://www.chessprogramming.org/Perft_Results |
| Chess Programming Wiki — Bitboard Board-Definition | https://www.chessprogramming.org/Bitboard_Board-Definition |
