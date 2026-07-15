# Tasks: Spatial & temporal COA visualisation (SPEC-19)

Dependency-ordered. `[P]` = parallelisable. **Gate**: research note `10-spatial-temporal.md` present (DEC-11) and concept §6 item 21 flagged — Phase A produces both; Phases B–D do not start until Phase A lands.

## Phase A — research & review invitation (US1, US2) — the DEC-11 gate

- [X] **T01** Author `docs/research/10-spatial-temporal.md`: decide the **banded-surface rule** (no single-stop cell for an assessed channel) and the **temporal rule** (validity/task windows, no interpolated certainty), each traced to a cited convention (uncertainty visualisation, cartographic interval conventions, space-time cube / Shneiderman) alongside the JIPOE MCOO doctrine (concept §7).
- [X] **T02** In the note, survey **≥3 perspectives** (map; temporal/exposure timeline; a novel cross-cut — exposure profile / handful small-multiples / space-time cube), each with a false-precision-risk appraisal; recommend one (or a composed pair) and name the concrete Meridian exhibit it newly reveals (US2). [P after T01 skeleton] *(Note §4: five perspectives; map + timeline composed, exposure profile as connective tissue; exhibit = the `[12,36]` fac_waters riser / untouched air_defence / unread K3.)*
- [X] **T03** Close the note with an explicit **spatial-and-temporal review invitation** (the two questions) pointing at the US3 mockups, and a comms §12 checkpoint hook.
- [X] **T04** Record concept §6 item 21 as a **flagged candidate** (banded-surface convention; drag-to-recompute geometry edit; standing spatial/temporal surface); add a research §7 starting-points cluster; **do not assert** any decision (DEC-2). *(Done in the spec PR.)*

## Phase B — pure, testable rendering seams (US3) — after Phase A

- [X] **T05** `src/mapProject.ts` — grid→viewport projection + region/route hit-geometry (which regions a leg enters); pure, no DOM. [P]
- [X] **T06** `src/components/coaMap.ts` — regions as banded channel surfaces (extent/two-stop, never a single stop for an assessed channel) + routes overlaid + keyed legend; types-in, string-out; reuse `bandPill`/`provenanceChip` payloads.
- [X] **T07** `src/components/coaTimeline.ts` — validity windows (`K5`/`K9` + supersession edge), task windows, storm ridge as banded extents; no interpolation. [P]
- [X] **T08** Tests: `tests/mapProject.test.ts` (projection; P1 `FE-ANVIL` ∈ `fac_waters`, ∉ `air_defence`; storm band peaks 20–28), renderer shape tests (every assessed channel emits a band — no bare scalar; every region matches its box). *(Also `tests/coaMap.test.ts`, `tests/coaTimeline.test.ts`.)*

## Phase C — mockups over Meridian, reviewable (US3 exit) — after Phase A

- [X] **T09** Build script → self-contained mockup(s) (`docs/assets/coa-viz/` or a gallery entry): P1/P2 over the map + temporal companion, from real fixtures; offline-clean, dated-frozen, Meridian disclaimer. *(`scripts/build-coa-viz.ts`, `npm run coa-viz` — an esbuild bundle running the real pipeline in-browser, the SPEC-16 build-app pattern.)*
- [X] **T10** Wire reachability: a card on `assay-home.html` + copy step in `scripts/build-site.ts` (comms §6 rule 6 — clickable, not URL-typed). *(Copied to `site/coa-viz.html` and `site/assets/coa-viz/` for the article iframe.)*
- [X] **T11** Evidence captures (Playwright, light + dark) per spec Blog & Evidence Plan → `docs/blog/evidence/spec-19/`.

## Phase D — interaction: input + understanding (US4) — after Phase A; promotion after review

- [X] **T12** Scrub/hover (understanding): step slider selects world-at-step (pure selection over the compiled world, `CoaVizState.setStep` — no recompute, no glow); hover emits banded payloads (`bandPill` + named source).
- [X] **T13** Drag/shift (input): a drag session authors a new `Plan` version (`CoaVizState.moveWaypoint`/`shiftWindow`) and re-scores through the SPEC-16 recompute path → glow diff (`src/app/glow.ts`, reused); infeasible/dishonest input → `refusalBanner`, nothing persists (G2/G5).
- [X] **T14** App-bootstrap smoke (Node, `crypto.subtle` ≥19): edit P1 `FE-ANVIL` clear of `fac_waters`, re-score, assert C4 margin changes, glow set equals changed-hash set, and the result is byte-identical to a from-scratch run (G1). *(`tests/coa-viz-state.test.ts`; also verified end-to-end in Chromium.)*
- [X] **T15** *(post-review)* Promote to a standing surface (S2/S4 mode or a fifth tab) per the US1 SME reaction; DEC-31(d) "never silently optimise" binds any auto-behaviour. *(SME endorsed the UI model 2026-07-15 — findings ledger ASSAY-FIND-7; ratified as ASSAY-DEC-36 (register batch 6, closing concept §6.21(a)–(d)); built as the fifth shared "Spatial · COA" tab over the app's single store: `src/app/state.ts` (coa panels, `setStep`/`moveWaypoint`/`shiftWindow`) + `src/app/shell.ts` (tab, spatial clock, drag wiring, glow-silent scrub) + `tests/app-coa-tab.test.ts`; the map refuses with the compile while K12 is contested (G5) and appears, glowing, on resolve.)*

## Phase E — comms & batch propagation

- [X] **T16** Blog article (spec Blog & Evidence Plan) embedding the mockup; add to the blog index + `status.yml` updates feed. *(`posts/2026-07-15-where-the-plan-meets-the-water.html`.)*
- [X] **T17** Sweep peers: delivery-plan SPEC-19 row + status note (done in the spec PR); `CLAUDE.md` current-phase line and `status.yml` when Phases B–E land.
- [X] **T18** Verify: `npm run typecheck` clean; `npm test` green; mockup builds offline-clean; oracle O-1…O-4 reproduce.
