# AGENTS.md

Beautiful Chess is a Pass-and-Play chess app: two people, one physical device, no computer
opponent and no online play.

## Working a ticket

Tickets are GitHub issues labelled `ready-for-agent`, each a vertical slice declaring its
blocking edges. Work one whose blockers are all closed.

1. **Read `CONTEXT.md` and every ADR in `docs/adr/` before writing code.** Four decisions are
   already made, and two of them are counter-intuitive enough to violate by default.
2. **Build test-first, one red-green slice at a time**: write the failing test, make it pass,
   then take the next slice. `.agents/skills/tdd/` carries the process.
3. **Review your own diff before committing**, along two axes — does it follow the repo's
   standards, and does it do what the ticket asked? `.agents/skills/code-review/` carries the
   process.
4. **Use the `CONTEXT.md` glossary vocabulary** in code, comments, commit messages and UI copy.
   Each term carries an explicit _Avoid_ list.
5. **Write Conventional Commits.**

## Commands

`npm run verify` runs the whole gate — type check, lint, format check, tests — and is exactly
what CI runs. The individual scripts are in `package.json`; `npm test` alone is the fast inner
loop.

Two things the scripts do not tell you:

- **The rules boundary is enforced by lint, not by convention.** Anything under `src/rules`
  that imports React, React Native or Expo, or touches a browser global, fails `npm run lint`
  and therefore fails CI. That is ADR 0002 made mechanical. The suite also collects
  `src/**/*.test.ts` only, never `.tsx`, so a test needing JSX is testing UI — which v1
  verifies by hand.
- **Prettier ignores `docs/`, and lint ignores `.agents/`.** ADRs are decision records and the
  research files are primary-source material, so they stay byte-stable; `.agents` is vendored
  from `mattpocock/skills` and must match its source.

## Decisions already made

Read the ADR covering an area before changing it. Each records the reasoning, which is the part
that is easy to undo by accident.

- **0001** — React Native with Expo.
- **0002** — the chess rules are hand-written, never import React, and run in plain Node. Perft
  is the correctness oracle, verified to depth 4–5.
- **0003** — the board is fixed: it never flips and never rotates. Partially superseded.
- **0004** — plain one-way Staunton pieces, loaded through a single swappable module.

Two consequences look like defects and are not: the board does not flip when the device is
passed over, and Black reads the pieces upside down. Both follow from Table Posture, and both
are accepted costs argued in the ADRs.

## Permanently out of scope

This app has no chess engine, no computer opponent, no move suggestion or evaluation, no
network play and no accounts. Treat work implying any of them as out of scope rather than as
not yet built.

## Agent skills

### Issue tracker

Issues are tracked as GitHub issues via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five canonical triage labels (needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context (`CONTEXT.md` + `docs/adr/` at repo root). See `docs/agents/domain.md`.
