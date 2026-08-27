# Hand-written rules engine instead of a library

Permissively licensed chess rules libraries exist and would give us a playable board in days — `chess.js` (BSD-2-Clause) is the obvious one for a TypeScript codebase. We are writing our own anyway, in `src/rules/`, as a self-contained TypeScript module that never imports React. The reason is that the rules *are* the domain here: this app is a rules engine plus a beautiful surface, with no engine, no network and no accounts, so owning the core outright is owning the product. Crucially, correctness is not a matter of hope — perft node counts for the standard test positions give an objective pass/fail oracle, which turns this from a risky rewrite into a well-specified TDD exercise.

## Consequences

- There is no playable board for roughly the first two to three weeks.
- Perft is verified to depth 4–5 in the routine test suite; depth 6 is 119M nodes and far too slow for TypeScript in CI, so it is run manually if ever needed.
- The rules module stays runnable in plain Node, so tests are fast and a future framework change cannot touch the core.
- The notorious edge cases must be covered deliberately: en-passant pins, castling through attacked squares, under-promotion, and position identity for threefold repetition including castling and en-passant rights.

See `docs/research/rules-libraries-by-platform.md` for the library survey and the perft reference data.
