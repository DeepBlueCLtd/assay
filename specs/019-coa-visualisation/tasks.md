# Tasks: Spatial & temporal COA visualisation (SPEC-19)

Dependency-ordered. `[P]` = parallelisable. **Gate**: research note `10-spatial-temporal.md` present (DEC-11) and concept §6 item 21 flagged — Phase A produces both; Phases B–D do not start until Phase A lands.

## Phase A — research & review invitation (US1, US2) — the DEC-11 gate

- **T01** Author `docs/research/10-spatial-temporal.md`: decide the **banded-surface rule** (no single-stop cell for an assessed channel) and the **temporal rule** (validity/task windows, no interpolated certainty), each traced to a cited convention (uncertainty visualisation, cartographic interval conventions, space-time cube / Shneiderman) alongside the JIPOE MCOO doctrine (concept §7).
- **T02** In the note, survey **≥3 perspectives** (map; temporal/exposure timeline; a novel cross-cut — exposure profile / handful small-multiples / space-time cube), each with a false-precision-risk appraisal; recommend one (or a composed pair) and name the concrete Meridian exhibit it newly reveals (US2). [P after T01 skeleton]
- **T03** Close the note with an explicit **spatial-and-temporal review invitation** (the two questions) pointing at the US3 mockups, and a comms §12 checkpoint hook.
- **T04** Record concept §6 item 21 as a **flagged candidate** (banded-surface convention; drag-to-recompute geometry edit; standing spatial/temporal surface); add a research §7 starting-points cluster; **do not assert** any decision (DEC-2). *(Done in this PR.)*

## Phase B — pure, testable rendering seams (US3) — after Phase A

- **T05** `src/mapProject.ts` — grid→viewport projection + region/route hit-geometry (which regions a leg enters); pure, no DOM. [P]
- **T06** `src/components/coaMap.ts` — regions as banded channel surfaces (extent/two-stop, never a single stop for an assessed channel) + routes overlaid + keyed legend; types-in, string-out; reuse `bandPill`/`provenanceChip` payloads.
- **T07** `src/components/coaTimeline.ts` — validity windows (`K5`/`K9` + supersession edge), task windows, storm ridge as banded extents; no interpolation. [P]
- **T08** Tests: `tests/mapProject.test.ts` (projection; P1 `FE-ANVIL` ∈ `fac_waters`, ∉ `air_defence`; storm band peaks 20–28), renderer shape tests (every assessed channel emits a band — no bare scalar; every region matches its box).

## Phase C — mockups over Meridian, reviewable (US3 exit) — after Phase A

- **T09** Build script → self-contained mockup(s) (`docs/assets/coa-viz/` or a gallery entry): P1/P2 over the map + temporal companion, from real fixtures; offline-clean, dated-frozen, Meridian disclaimer.
- **T10** Wire reachability: a card on `assay-home.html` + copy step in `scripts/build-site.ts` (comms §6 rule 6 — clickable, not URL-typed).
- **T11** Evidence captures (Playwright, light + dark) per spec Blog & Evidence Plan → `docs/blog/evidence/spec-19/`.

## Phase D — interaction: input + understanding (US4) — after Phase A; promotion after review

- **T12** Scrub/hover (understanding): step slider in `src/app/state.ts` selects world-at-step; hover emits banded payloads. Reuse the compiled world; no recompute.
- **T13** Drag/shift (input): a drag session authors a new `Plan` version and calls the SPEC-16 recompute path → glow diff (`src/app/glow.ts`, reused); infeasible/dishonest input → `refusalBanner`, nothing persists (G2/G5).
- **T14** App-bootstrap smoke (Node, `crypto.subtle` ≥19): edit P1 `FE-ANVIL` clear of `fac_waters`, re-score, assert C4 margin changes, glow set equals changed-hash set, and the result is byte-identical to a from-scratch run (G1).
- **T15** *(post-review)* Promote to a standing surface (S2/S4 mode or a fifth tab) per the US1 SME reaction; DEC-31(d) "never silently optimise" binds any auto-behaviour. **Not in this slice's exit — tracked.**

## Phase E — comms & batch propagation

- **T16** Blog article (spec Blog & Evidence Plan) embedding the mockup; add to the blog index + `status.yml` updates feed.
- **T17** Sweep peers: delivery-plan SPEC-19 row + status note (done in this PR); `CLAUDE.md` current-phase line and `status.yml` when Phases B–E land.
- **T18** Verify: `npm run typecheck` clean; `npm test` green; mockup builds offline-clean; oracle O-1…O-4 reproduce.
