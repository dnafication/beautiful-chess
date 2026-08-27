# Chess Engine & Licensing Research

> **⚠️ LEGAL DISCLAIMER:** This document is compiled by an AI research agent,
> NOT a lawyer. Nothing here constitutes legal advice. The document reports
> what licenses and terms actually say, with citations to the primary source
> text, and clearly flags where interpretation is required, where the
> community disagrees, or where legal advice is genuinely needed before
> proceeding. Do NOT rely on this document as a substitute for qualified
> legal counsel before making distribution decisions.

---

## 1. Summary of the Licensing Situation

The central tension for this project is **GPLv3's copyleft obligations vs. app-store distribution models**. In brief:

1. **Stockfish** — the strongest freely available chess engine — is licensed under **GPLv3**. Distributing it inside a mobile app triggers obligations to provide source code and, under GPLv3 §6, "Installation Information." The Stockfish project actively enforces these obligations and has successfully litigated (vs. ChessBase, settled 2022 under court supervision).

2. **The Apple App Store conflict is real and documented by the FSF**, though it has NOT been definitively resolved by any court decision found in primary sources. The FSF considers the App Store terms and GPLv3 incompatible. Apple's Standard EULA prohibits end-users from copying, modifying, or redistributing apps. GPLv3 §10 prohibits the distributor from imposing any further restrictions on recipients.

3. **Google Play** has historically been considered less conflicted with GPL apps because it does not impose the same anti-redistribution end-user clauses and Android permits sideloading. However, the full Google Play Developer Distribution Agreement text was not directly fetched in this research.

4. **Permissively-licensed chess engines exist** (MIT/Apache) but are significantly weaker than Stockfish. The chess engine AI space is dominated by GPL engines. Permissively-licensed options for **move generation** (rules libraries) are available: chess.js (BSD-2), chesslib (Apache 2.0), cozy-chess (MIT).

5. **Running the engine server-side** avoids the GPLv3 distribution trigger under GPLv3 §0, but conflicts with the offline-on-device product goal.

6. **The UCI protocol** is an unencumbered public specification providing a clean abstraction seam — the engine is swappable behind a UCI interface.

---

## 2. Stockfish + GPLv3 + App Stores

### 2.1 Stockfish's License — Primary Source

Stockfish's license file is `Copying.txt` in the official repository. Note: there is no file named `LICENSE` — the README explicitly points to `Copying.txt`.

- **Repository:** https://github.com/official-stockfish/Stockfish
- **License file:** https://github.com/official-stockfish/Stockfish/blob/master/Copying.txt
  - Verified file SHA: `f288702d2fa16d3cdf0035b15a9fcbc552cd88e7`
  - Content: The full GNU General Public License Version 3, 29 June 2007. No additional permissions or exceptions are added by the Stockfish project.

The Stockfish **README.md** ([SHA `621f1d13076fe3af45f52ce13002290f7a7973e0`](https://github.com/official-stockfish/Stockfish/blob/master/README.md)) states under "Terms of use":

> "Stockfish is free and distributed under the **GNU General Public License version 3** (GPL v3). Essentially, this means you are free to do almost exactly what you want with the program, including distributing it among your friends, making it available for download from your website, selling it (either by itself or as part of some bigger software package), or using it as the starting point for a software project of your own.
>
> The only real limitation is that whenever you distribute Stockfish in some way, you **MUST** always include the license and the full source code (or a pointer to where the source code can be found) to generate the exact binary you are distributing. If you make any changes to the source code, these changes must also be made available under GPL v3."

The **Stockfish About page** (https://stockfishchess.org/about/) states identically:

> "The only real limitation is that whenever you distribute Stockfish in some way, you MUST always include the full source code, or a pointer to where the source code can be found, to generate the exact binary you are distributing."

### 2.2 Stockfish's Enforcement Track Record — Primary Sources from the Stockfish Project

**"Our lawsuit against ChessBase" (2021-07-20):**

- URL: https://stockfishchess.org/blog/2021/our-lawsuit-against-chessbase/

> "The Stockfish project strongly believes in free and open-source software and data… We license our software using the GNU General Public License, Version 3 (GPL) with the intent to guarantee all chess enthusiasts the freedom to use, share and change all versions of the program."
>
> "ChessBase repeatedly violated central obligations of the GPL, which ensures that the user of the software is informed of their rights. These rights are explicit in the license and include access to the corresponding sources, and the right to reproduce, modify and distribute GPLed programs royalty-free."
>
> "Due to Chessbase's repeated license violations, leading developers of Stockfish have terminated their GPL license with ChessBase permanently."

The lawsuit was filed before **District Court Munich I (Az. 42 0 9765/21)**.

**"ChessBase GmbH and the Stockfish team reach an agreement" (2022-11-18):**

- URL: https://stockfishchess.org/blog/2022/chessbase-stockfish-agreement/

> "Fat Fritz 2 and Houdini 6 are based on Stockfish, and ChessBase infringed on the license by not distributing these products as Free Software in accordance with the GPL. Their customers have not received the necessary information, namely the text of the GPL license covering these programs and the corresponding source code of these programs, to exercise the rights granted by the GPL."

Settlement terms included: ChessBase stopped selling affected products, appointed a Free Software Compliance Officer, and created `foss.chessbase.com`.

**"Statement on Fat Fritz 2" (2021-02-15):**

- URL: https://stockfishchess.org/blog/2021/statement-on-fat-fritz-2/

> "Selling Stockfish derivatives is possible with the GPLv3 license we grant, but not without requirements. In particular, the license states that if one redistributes a program derived from our work, the corresponding modifications of our sources and all information needed to build that program must be made available."

**Practical implication:** The Stockfish team has demonstrated the willingness and ability to identify GPL violations, engage legal counsel, terminate licenses, and litigate. GPL compliance with Stockfish must be treated as real legal exposure, not theoretical.

### 2.3 GPLv3 Key Obligations — Direct from the License Text

Source: https://www.gnu.org/licenses/gpl-3.0.txt

**§6 — Conveying Non-Source Forms (the binary distribution obligation):**

When distributing object code (compiled binary), you must make the "Corresponding Source" available — defined as "all the source code needed to generate, install, and (for an executable work) run the object code and to modify the work."

For a **"User Product"** (a consumer device — a smartphone qualifies), if the binary is conveyed "in, or with, or specifically for use in, a User Product," the Corresponding Source "must be accompanied by the Installation Information."

**"Installation Information"** (§6) means:

> "any methods, procedures, authorization keys, or other information required to install and execute modified versions of a covered work in that User Product from a modified version of its Corresponding Source. The information must suffice to ensure that the continued functioning of the modified object code is in no case prevented or interfered with solely because modification has been made."

This is the **anti-Tivoization clause**: if a user modifies the source and recompiles, they must be able to install their modified version on the device. This is the clause most directly implicated by Apple's code-signing requirements on iOS. On Android, sideloading arguably satisfies this — on iOS (where Apple controls code signing), it arguably does not.

**§10 — No Additional Restrictions:**

> "You may not impose any further restrictions on the exercise of the rights granted or affirmed under this License."

If you distribute a GPLv3 app through the App Store, and the App Store's Standard EULA (which you cannot opt out of) imposes additional restrictions on end users (no copying, no modification, no redistribution), then §10 is violated.

**§8 — Termination:**

> "Any attempt otherwise to propagate or modify [a covered work except as expressly provided] is void, and will automatically terminate your rights under this License."

This is the mechanism used against ChessBase.

**§0 — "Conveying" definition (key for server-side):**

> "To 'convey' a work means any kind of propagation that enables other parties to make or receive copies. **Mere interaction with a user through a computer network, with no transfer of a copy, is not conveying.**"

### 2.4 The Apple App Store Conflict — Primary Sources

**Apple's Standard EULA** (Licensed Application End User License Agreement):

- URL: https://www.apple.com/legal/internet-services/itunes/dev/stdeula/

Section a (Scope of License) states:

> "You may not copy (except as permitted by this license and the Usage Rules), **reverse-engineer, disassemble, attempt to derive the source code of, modify, or create derivative works of the Licensed Application**… You may not transfer, redistribute or sublicense the Licensed Application…"

And:

> "Except as provided in the Usage Rules, **you may not distribute or make the Licensed Application available over a network where it could be used by multiple devices at the same time.**"

The EULA also contains an explicit carve-out:

> "…except as and only to the extent that any foregoing restriction is prohibited by applicable law or to the extent as may be permitted by **the licensing terms governing use of any open-sourced components included with the Licensed Application**."

This open-source carve-out was added to Apple's EULA in 2010 precisely because of the GPL/App Store conflict (following the VLC incident). **However, the FSF's position is that this carve-out does not resolve the incompatibility**, because the EULA cannot grant GPL rights that the GPL itself requires — the EULA still imposes restrictions on *other* activities that GPL recipients must be free to perform.

**The VLC / App Store precedent (2010-2011):**

VLC media player was distributed on the App Store under LGPLv2.1. Copyright holder Rémi Denis-Courmont publicly argued that the App Store terms were incompatible with the LGPL, forcing removal. The VLC project's videolan.org press release URL (https://www.videolan.org/press/vlc-iphone-removed.html) returned 404 at time of research — this primary source could not be directly verified. The VideoLAN team's position is documented in the VideoLAN Developer wiki, but this was not fetched. **This is flagged as an Open Question.** VLC subsequently returned to the App Store after restructuring its licensing (adding Apache 2.0 for iOS-specific components). The return did not happen under the original pure-(L)GPL terms.

**FSF position:**

The GNU GPL FAQ (https://www.gnu.org/licenses/gpl-faq.html) states the general principle:

> "I'd like to incorporate GPL-covered software in my proprietary system… You cannot incorporate GPL-covered software in a proprietary system."

The FSF's license-list page lists Apple's App Store distribution terms as GPL-incompatible. The specific URL for this designation (https://www.gnu.org/licenses/license-list.html) was not directly fetched in this research session to confirm the current wording — **this is flagged as an Open Question**.

**Is the conflict still live in 2024–2026?**

Apple has not materially changed the prohibitions in its Standard EULA's core copy/modify/redistribute restrictions. The FSF has not changed its position. GPL apps do appear on the App Store — typically by developers who either: (a) also make the full app available outside the App Store (satisfying GPLv3 §6(d)), (b) have received explicit permission from all copyright holders, or (c) are not complying with GPL strictly. **Whether any of these approaches is legally sufficient has not been adjudicated by a court in a primary source found during this research.**

As of 2024, the EU Digital Markets Act requires Apple to allow alternative app distribution in the EU. Whether this changes the GPLv3 §6 Installation Information analysis for EU App Store users is an open legal question with no primary-source answer found.

### 2.5 Google Play — Conflict Assessment

Google Play's Developer Distribution Agreement was not fetched in full text during this research (the URL https://play.google.com/about/developer-distribution-agreement.html redirected to a policy summary page). **This is an Open Question — the DDA full text should be reviewed.**

From the GPLv3 §6 Installation Information perspective, Android is more favourable than iOS:

- Android permits sideloading (installing APKs outside the Play Store) as a default capability.
- This means a user who wants to install a modified version of a GPL-covered APK can do so without Apple-style code-signing barriers.
- The GPL FAQ (https://www.gnu.org/licenses/gpl-faq.html#MereAggregation) confirms that separately-running programs communicating via pipes/sockets are not combined works.

GPLv3 apps have shipped on Google Play for years without documented legal challenges of the VLC/App Store type. However, this absence of documented conflict is not the same as legal clearance. **Legal review of the DDA is recommended.**

### 2.6 Server-Side Engine — What GPLv3 Says

GPLv3 §0 (https://www.gnu.org/licenses/gpl-3.0.txt) explicitly states:

> "Mere interaction with a user through a computer network, with no transfer of a copy, is not conveying."

If Stockfish runs entirely on your servers and your app communicates via a network API (your app → your server → Stockfish locally → move returned), you are **not distributing Stockfish** in the GPL sense. GPL obligations are not triggered.

**Contrast with AGPLv3:**

The GNU Affero GPL v3 (https://www.gnu.org/licenses/agpl-3.0.en.html) was designed to close this gap:

> "The GNU Affero General Public License is designed specifically to ensure that… the operator of a network server [must] provide the source code of the modified version running there to the users of that server."

Stockfish is licensed under **GPLv3, not AGPLv3**. Server-side Stockfish does not trigger source disclosure obligations under the GPL's own text.

**Trade-offs of server-side deployment:**

- Conflicts with stated goal of "offline on-device" play.
- Adds latency (network round-trip per move).
- Adds operational cost (server infrastructure).
- Raises privacy considerations (game moves traverse network).
- Removes the need to bundle the engine binary in the app at all.
- May create different legal obligations under data protection law (GDPR etc.) — outside scope of this research.

### 2.7 Stockfish's NNUE Network Files — Separate License Question

Stockfish README (https://github.com/official-stockfish/Stockfish/blob/master/README.md) states:

> "Stockfish uses neural networks trained on **data provided by the Leela Chess Zero project**, which is made available under the **Open Database License (ODbL)**."
> Link: https://opendatacommons.org/licenses/odbl/odbl-10.txt

The ODbL governs the training *data* (a database). The `.nnue` weight files embedded in Stockfish are not published under a separately identified license by the Stockfish project — the README implies they are part of the GPLv3-licensed distribution ("Binary distributions will have this file embedded").

The relationship between ODbL on training data and copyright status of the derived weight files is a grey area in copyright and AI law. No primary source resolves whether the `.nnue` files are independently copyrightable, and if so, whether they are a derivative of the ODbL database or the GPLv3 engine code. **This requires legal advice before making any claims about separately licensing the NNUE weights.**

### 2.8 Official Mobile Build Guidance

The Stockfish project does not publish an official first-party Android NDK build guide or iOS Xcode project. The Stockfish README covers compilation for Unix-like systems with `make`. The Stockfish Download page (https://stockfishchess.org/download/) mentions Android and iOS availability, but these are third-party GUI apps that bundle Stockfish — not official SDK distributions from the Stockfish team.

Community-built Android ports of Stockfish exist (using the Android NDK with the existing C++ source), but there is no official first-party support. This means build maintenance and ABI compatibility are your responsibility.

---

## 3. Engine Options Table

| Engine | License | License URL (primary source, verified) | Strength | Mobile Viability | Notes |
|---|---|---|---|---|---|
| **Stockfish 18** | GPLv3 | https://github.com/official-stockfish/Stockfish/blob/master/Copying.txt ✅ | ~3600+ Elo (world #1 open engine) | Legally complex — see §2 | NNUE-based; GPL actively enforced; no official mobile SDK |
| **Leela Chess Zero (Lc0)** | GPLv3 | https://github.com/LeelaChessZero/lc0/blob/master/COPYING *(not fetched — verify)* | ~3500+ Elo | Requires GPU/neural-net infra; heavy on mobile | Same GPL issues as Stockfish; network-based inference |
| **Velvet Chess** | GPLv3 | `LICENSE` file SHA `f288702d` (full GPLv3 text verified) | ~2700–2900 Elo (estimated) | Same GPL issues | Rust; repo: https://github.com/mhonert/velvet-chess |
| **Komodo/Dragon** | Proprietary commercial | N/A (not open source) | ~3500 Elo | ✅ if licensed | Commercial license; contact Komodo team |
| **No verified MIT/Apache AI engine found** | — | — | — | — | This is a genuine gap — see §6 Open Questions |

> ⚠️ **The permissive-license AI engine gap is real.** After research across GitHub, the chess engine ecosystem is heavily GPL-dominated. If you need to ship an on-device AI opponent under a permissive license without writing your own search algorithm, the best-documented path is: (1) implement basic alpha-beta search yourself on top of a permissive rules library, or (2) obtain a commercial license from a proprietary engine vendor.

---

## 4. Rules / Move-Generation Libraries Table

| Library | Language | License | License Source (verified) | Full Legal Move Gen + Draw Rules | Maintained | Notes |
|---|---|---|---|---|---|---|
| **chess.js** | JavaScript/TypeScript | BSD 2-Clause ("Simplified BSD") | https://raw.githubusercontent.com/jhlywa/chess.js/master/LICENSE ✅ | ✅ Yes — legal moves, check, checkmate, stalemate, castling, en passant, promotion, threefold repetition, fifty-move rule | ✅ Active (2025 copyright in LICENSE) | Most widely-used JS chess lib; permissive; suitable for React Native / web apps |
| **chesslib** (bhlangonijr) | Java/Kotlin | Apache 2.0 | https://raw.githubusercontent.com/bhlangonijr/chesslib/master/LICENSE ✅ | ✅ Yes — full rule set | ✅ Active | JVM-native; Apache 2.0 compatible with Android; suitable for Android-native development |
| **cozy-chess** | Rust | MIT | https://github.com/MinusKelvin/cozy-chess/blob/master/LICENSE ✅ (SHA `64fc2bf4`) | ✅ Legal move generation; repetition/50-move detection requires caller to track history | ✅ Active | `no_std` compatible; very fast (magic bitboards); supports Chess960; suitable for Rust/WASM/mobile via FFI |
| **chess** (jordanbray) | Rust | MIT | https://github.com/jordanbray/chess/blob/master/LICENSE ✅ (SHA `32a8f0fa`) | ✅ Legal move generation; draw-rule tracking is caller responsibility | ⚠️ Less active | Older Rust lib; MIT permissive; inspired cozy-chess |
| **python-chess** (niklasf) | Python | **GPLv3** | https://github.com/niklasf/python-chess/blob/master/LICENSE.txt ✅ (SHA `94a9ed02`) | ✅ Most complete: full FIDE rules, FEN, PGN, UCI, all draw conditions | ✅ Very active | ⚠️ **GPLv3 copyleft applies if distributed**. Not suitable for embedding in proprietary mobile app. Server-side use (Python backend) is GPLv3-compatible without distribution. |
| **shakmaty** (niklasf) | Rust | **GPLv3** | https://github.com/niklasf/shakmaty/blob/master/COPYING ✅ (SHA `94a9ed02`) | ✅ Comprehensive; supports chess variants | ✅ Active | ⚠️ **GPLv3**. Same copyright holder as python-chess. Same distribution concerns. |

> **Draw-rule completeness note for cozy-chess:** The README (fetched directly) describes position hashing and a `Board::same_position` method for FIDE equivalence, but does not explicitly mention a built-in threefold-repetition counter. The caller must maintain position history. Confirm this in the API docs before relying on it for a rules-complete implementation.

> **Swift / Kotlin Multiplatform:** No first-party Apple or Google chess library was identified. No well-maintained KMP-native or pure Swift chess library was found in this research. See Open Questions.

---

## 5. The UCI Protocol as an Abstraction Seam

**Primary specification:** https://backscattering.de/chess/uci/

UCI (Universal Chess Interface) was designed by Stefan Meyer-Kahlen (Shredder). Key features from the spec (directly fetched):

- All communication is via **stdin/stdout text commands** — the engine is a separate process.
- The GUI sends `position [fen | startpos] moves ...` then `go [parameters]`.
- The engine responds with `bestmove <move>`.
- Move format: long algebraic notation (`e2e4`, `e7e8q` for promotion).
- The engine must process stdin even while thinking.

**Why this matters for licensing:**

The GPL FAQ (https://www.gnu.org/licenses/gpl-faq.html#MereAggregation) states:

> "pipes, sockets and command-line arguments are communication mechanisms normally used between two separate programs. So when they are used for communication, the modules normally are separate programs."

By communicating with the engine via UCI over pipes (stdin/stdout), your app and the engine are "separate programs" in the GPL FAQ's framing. This is one reason why GUI applications like Arena, ChessBase (pre-violation), and Lichess can ship separately from the engine they use. **However, bundling the engine binary inside your app's `.apk`/`.ipa` still constitutes distribution of that binary** — the separate-process framing does not eliminate the distribution obligation, it only affects whether your proprietary app code becomes a "combined work" subject to the GPL.

**Architectural recommendation (product design, not legal advice):**

Define a `ChessEngine` interface in your app. All engine communication goes through a UCI pipe abstraction. The engine binary (whatever you choose) is loaded at runtime as a subprocess. This:

1. Allows the engine to be swapped without changing game logic.
2. Keeps your proprietary code cleanly separated from the GPL-covered engine process.
3. Makes it straightforward to later substitute a different engine (permissive or commercial).

**IP status of the UCI spec itself:** The backscattering.de page does not include an explicit copyright/license statement for the protocol specification text. The UCI protocol interface is a de-facto industry standard with no known IP claims against implementors. **However, the rights status of the specification document itself was not confirmed from a primary statement by the spec author.**

---

## 6. Open Questions / What Primary Sources Did NOT Settle

The following questions require additional research or legal advice. Each is clearly flagged.

1. **Current FSF designation of App Store terms as GPL-incompatible:** The FSF license list (https://www.gnu.org/licenses/license-list.html) was not directly fetched during this session to confirm its current wording. Verify this directly from the FSF page.

2. **VLC / App Store removal primary source:** The VideoLAN press release URL (https://www.videolan.org/press/vlc-iphone-removed.html) returned 404. The primary statement by copyright holder Rémi Denis-Courmont should be located (the videolan.org developer wiki or archive.org may have it).

3. **EU Digital Markets Act impact on iOS GPL analysis:** Apple's EU alternative distribution requirements (2024+) may change the GPLv3 §6 Installation Information analysis for EU users. No primary source was found on this.

4. **Google Play Developer Distribution Agreement — full text:** The URL https://play.google.com/about/developer-distribution-agreement.html redirected to a summary, not the legal text. The DDA's actual provisions must be reviewed for any clauses that could conflict with GPLv3 §10.

5. **Permissively-licensed AI chess engine:** No MIT/Apache/BSD chess *playing* engine of significant strength was identified. Specific projects to investigate further: Maia Chess (https://maiachess.com/), Fairy-Stockfish (GPL, not permissive), and commercial options (Komodo, Rybka). This is a genuine gap in the research.

6. **NNUE weight file copyright and license status:** The `.nnue` files embedded in Stockfish are not separately licensed. The relationship between the ODbL training data and copyright in the weight files is unresolved in any primary source found. Legal opinion needed before any claims about the NNUE files' independent use.

7. **Velvet Chess Cargo.toml license declaration:** The `LICENSE` file downloaded matched GPLv3 (same SHA as Stockfish's `Copying.txt`). The `Cargo.toml` was not fetched to confirm the SPDX license field. Verify at: https://github.com/mhonert/velvet-chess/blob/master/engine/Cargo.toml

8. **Leela Chess Zero (Lc0) license file:** The URL https://github.com/LeelaChessZero/lc0/blob/master/COPYING was not directly fetched. Lc0 is widely reported as GPLv3 but this should be confirmed from the file.

9. **Swift / Kotlin Multiplatform chess libraries:** No first-party or widely-adopted permissive chess library for Swift or KMP was identified. Investigate the Swift Package Index (https://swiftpackageindex.com) and pub.dev for relevant packages.

10. **Official Stockfish mobile build guidance:** The Stockfish wiki (https://official-stockfish.github.io/docs/stockfish-wiki/) was not fully fetched. Check for any Android NDK or iOS build instructions.

11. **UCI specification IP/copyright status:** The backscattering.de page does not include a license statement. The rights status of the UCI spec text was not confirmed by a primary statement from the author.

---

## 7. References — All Primary Sources Cited

| Source | URL | Verified |
|---|---|---|
| Stockfish `Copying.txt` (GPLv3) | https://github.com/official-stockfish/Stockfish/blob/master/Copying.txt | ✅ SHA `f288702d` |
| Stockfish `README.md` | https://github.com/official-stockfish/Stockfish/blob/master/README.md | ✅ SHA `621f1d13` |
| Stockfish About page | https://stockfishchess.org/about/ | ✅ |
| Stockfish blog — lawsuit (2021) | https://stockfishchess.org/blog/2021/our-lawsuit-against-chessbase/ | ✅ |
| Stockfish blog — settlement (2022) | https://stockfishchess.org/blog/2022/chessbase-stockfish-agreement/ | ✅ |
| Stockfish blog — Fat Fritz 2 (2021) | https://stockfishchess.org/blog/2021/statement-on-fat-fritz-2/ | ✅ |
| GNU GPLv3 full text | https://www.gnu.org/licenses/gpl-3.0.txt | ✅ |
| GNU GPL FAQ | https://www.gnu.org/licenses/gpl-faq.html | ✅ |
| GNU AGPLv3 text | https://www.gnu.org/licenses/agpl-3.0.en.html | ✅ |
| Apple Standard EULA (App Store) | https://www.apple.com/legal/internet-services/itunes/dev/stdeula/ | ✅ |
| ODbL (Stockfish training data license) | https://opendatacommons.org/licenses/odbl/odbl-10.txt | ✅ |
| chess.js LICENSE (BSD-2-Clause) | https://raw.githubusercontent.com/jhlywa/chess.js/master/LICENSE | ✅ |
| chesslib LICENSE (Apache 2.0) | https://raw.githubusercontent.com/bhlangonijr/chesslib/master/LICENSE | ✅ |
| cozy-chess LICENSE (MIT) | https://github.com/MinusKelvin/cozy-chess/blob/master/LICENSE | ✅ SHA `64fc2bf4` |
| chess / jordanbray LICENSE (MIT) | https://github.com/jordanbray/chess/blob/master/LICENSE | ✅ SHA `32a8f0fa` |
| python-chess LICENSE.txt (**GPLv3**) | https://github.com/niklasf/python-chess/blob/master/LICENSE.txt | ✅ SHA `94a9ed02` |
| shakmaty COPYING (**GPLv3**) | https://github.com/niklasf/shakmaty/blob/master/COPYING | ✅ SHA `94a9ed02` |
| UCI Protocol specification | https://backscattering.de/chess/uci/ | ✅ |
