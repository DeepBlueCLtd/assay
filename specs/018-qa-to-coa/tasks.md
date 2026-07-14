# Tasks: From Q&A to COA (SPEC-18)

Dependency-ordered. `[P]` = parallelisable. Gate: the investigation (spec §1) and its instrumented proof (`tests/k3-trace.test.ts`, 10 tests) are **already merged** — the research-spike gate is satisfied. This slice builds only the deliverable (spec §2 US6, §3). **No `src/` change** beyond one embed build script (spec §4).

## Phase A — the embed (real components, real pipeline)

- **T01** `scripts/build-embeds-qa.ts` — peer of `scripts/build-embeds.ts`. Load fixtures; build the BASE `CompiledWorld` with the real `CompileService`; score P1/P2 × C3/C4 with the real `ScoreService`. Pre-render every reachable state:
  - **Panel 1 (K3 → C3):** `bandPill(K3.answer)` + `provenanceChip` + a `channelTrace` slice showing the `civil_density` override; the P1/P2 × C3 `s2Matrix`; the with-K3 / without-K3 `fires` bands (identical) as the "gap" proof.
  - **Panel 2 (K6 → C4):** `bandPill(K6.answer)` + provenance; the P1/P2 × C4 `s2Matrix`; a **slider frame set** — re-score P1×C4 over a sweep of K6 override bands via `knowledge_overrides`, capturing each frame's real exposure + margin + four-stop verdict.
  - **Panel 3 (K7 → C4):** `bandPill(K7.answer)` + provenance; the `threat`/`air_defence` override; the FE-ANVIL-misses-region callout (P1 & P2 zero effect).
- **T02** Emit `docs/blog/embeds/qa-to-coa/index.html` — self-contained, offline-clean, no runtime crypto, no bundler; three panels side-by-side, responsive collapse to stacked on narrow viewports; only Panel 2's slider is embed-local chrome.

## Phase B — the article

- **T03** `docs/blog/posts/2026-07-14-qa-to-coa.html` — self-contained post (comms §6.2), mounting the embed via one `<iframe>`. Narrative: the investigation question → the five-stage pipeline → the three-pattern taxonomy → the honest gap (K3), the propagating case (K6, G6), the near-miss (K7) → the "what could change" sidebar (spec §5.1, framed as an SME-raisable possibility, not a register candidate). Honesty labels, source/trace links, fictional-vignette framing.

## Phase C — wire in + publish

- **T04** `package.json` `embeds` script runs `build-embeds-qa.ts` alongside `build-embeds.ts` (so `build:site` picks it up).
- **T05** Add the article to the blog index `docs/blog/index.html` (top of the list) and add a `docs/blog/backlog.md` row marking it shipped.

## Phase D — verify

- **T06** `npm run embeds` succeeds; `npm run typecheck` clean; `npm test` green (the merged `k3-trace` suite still passes). Drive the article in Chromium **offline**: no console errors; the three panels are visually distinct; the K6 slider widens C4's margin live (G6). Reproduce the spec's traced values (K3 gap identical; K6 `[-24,0]`→`[-36,6]`; K7 zero effect).
