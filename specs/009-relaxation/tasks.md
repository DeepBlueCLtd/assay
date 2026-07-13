---
description: "Task list for SPEC-09 — Relaxation (least-worst under infeasibility)"
---

# Tasks: Relaxation — least-worst under an infeasible commitment set (SPEC-09)

**Input**: Design documents from `specs/009-relaxation/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/relax-service.md, quickstart.md; research note `docs/research/04-relaxation.md` (DEC-11 gate — present)
**Tests**: REQUIRED — the tier-lexicographic order and inclusion-minimality laws (constructed sacrifice sets) and the R3m relax assertions are written against the seam §7 shape and **confirmed failing before implementation** (TDD; constitution quality gate 2). The R3m candidates are a *computed* product; tests assert the sacrifice sets (`{C4}`,`{C3}`,`{C2}`), never hand-set membership.
**Organization**: the tier/minimality algebra (pure, testable in isolation) and the authored candidate set first, then the service that composes them with the reused scorer, then the surface.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: parallelizable (different file, no dependency on an incomplete task)
- **[Story]**: US1 (three C4/C3/C2, P1) · US2 (minimality/never-empty, P1) · US3 (tier ranking + tie-break, P1) · US4 (cards + trace, P2) · US5 (determinism, P2)

## Path conventions
Single project: `src/`, `tests/`. Reuse `src/{store,trace,canonical,validate,seam,score,metrics,materialise}.ts`, `src/generated/types.ts`. **No schema change** — `RelaxationReport`/`RelaxationCandidate`/`Plan`/`TraceEdge` already exist; do **not** run `npm run gen`.

---

## Phase 1: Setup

- [x] T001 Confirm the SPEC-08 baseline is green: `npm install`, `npm run typecheck`, `npm test`. Record any failing baseline before Stage-4 code.
- [x] T002 Confirm the pieces SPEC-09 reuses exist: `ScoreService` with `CommitmentVerdict.verdict` (four-stop); `Commitment.tier`; `RelaxationReport`/`RelaxationCandidate` in `src/generated/types.ts`; `cited_in`/`sacrificed_in` in `TraceEdgeType`; the R3m COA in `fixtures/coas.json` and the compile scenario overlay (SPEC-06). No new dependency.

## Phase 2: US2 + US3 — the tier / minimality algebra (P1, the honesty core, pure)

**Goal**: lexicographic tier order + inclusion-minimality over sacrifice sets, proven on constructed sets before any pipeline exists.
**Independent test**: constructed sacrifice sets → minimal kept / superset dropped / duplicate collapsed / tier order least-worst-first / tie-break stable.

- [x] T003 Write `tests/tiers.test.ts` FIRST and confirm failing: `tierCost(set, tierOf)` counts `(musts, shoulds, prefers)`; `compareTierCost` orders least-worst first (fewer musts wins, then shoulds, then prefers); `inclusionMinimal(sets)` drops strict supersets, keeps incomparable singletons, collapses duplicates; the id tie-break is stable and total; **no numeric weight anywhere** (DEC-19).
- [x] T004 Implement `src/tiers.ts`: `SacrificeSet`, `TierCost`, `tierCost`, `compareTierCost`, `inclusionMinimal`, and the content-neutral `tieBreakText` helper. Pure functions over commitment ids + a `tierOf` map. Make T003 pass.

## Phase 3: US1 — the R3m-responsive candidate set (P1)

**Goal**: authored candidate `Plan`s that engage the mined water so the scorer computes the C4/C3/C2 sacrifices.
**Independent test**: each candidate a valid `Plan` with the five force elements; the set spans the parallel / fires-forward / sequential postures plus the two dominated supersets; deterministic in seed.

- [x] T005 Write `tests/relax.test.ts` (candidate-set portion) FIRST and confirm failing: `relaxCandidates(seed)` returns valid `Plan`s (each `validateInstance('Plan', p) === []`, five FEs, `RX-*` id); the postures documented cell-by-cell; deterministic.
- [x] T006 Implement `src/relaxCandidates.ts`: per-force-element route builders (documented axis→route mapping — BROOM fast/slow trades C2; ANVIL clean/mined-strait trades C4; FALCON standoff/fires trades C3; PACKHORSE/KINGFISHER constant), the candidate `Plan`s (parallel, fires, sequential, parallel+fires, seq+exposed), and a command-language `narrative` template per posture. Make the T005 portion pass.

## Phase 4: US1 + US2 + US3 + US5 — the relax service (P1/P2)

**Goal**: `/relax` = generate → score → sacrifice → minimal → rank, deterministic, over the R3m world.
**Independent test**: R3m → three candidates `{C4}`/`{C3}`/`{C2}`; supersets excluded; must-sacrifice last; tie_break present; same inputs ⇒ identical; unknown world refuses.

- [x] T007 Add relax service types to `src/seam.ts`: `RelaxRequest`, `RelaxSuccess` (with optional `feasible`), `RelaxResult` (per data-model.md). Types only; reuse `Refusal`/`Ref`.
- [x] T008 Extend `tests/relax.test.ts` FIRST and confirm failing (rig mirrors `handful.test.ts`: compile the R3m world): report non-empty (G4); exactly three candidates with sacrifice sets `{C4}`/`{C3}`/`{C2}`; each `sacrificed` non-empty; re-score confirms exactly those violated (SC-004); `{C2,C4}`/`{C3,C4}` excluded (SC-002); must-sacrifice (C2) ranked last; `tie_break` present naming C3/C4; `cited_in` edges present (G3); same `(world, commitments, seed)` ⇒ identical stamp/report; `unknown_ref` persists nothing.
- [x] T009 Implement `src/relax.ts` `RelaxService`: resolve world (refuse `unknown_ref`), generate candidates → store each → score via `ScoreService` → read `violated` sacrifice sets → surface `feasible` on an empty set → `inclusionMinimal` → rank by `compareTierCost` then id tie-break → build `RelaxationCandidate[]` with narratives → assemble/validate/store `RelaxationReport` → write `cited_in`/`sacrificed_in` edges → stamp over `(world.stamp, sorted ids, seed, engine)`. Make T008 pass.

## Phase 5: US4 — the surface (P2)

**Goal**: the least-worst demo moment ("least-worst, never silence").

- [x] T010 [P] Implement `src/components/s3Cards.ts`: one card per candidate — sacrifice (commitment ids + statements) stated in command language, the narrative, and the `tie_break` note below the set. Arranges projections only (constitution I); no decimal / no verdict-internal token on the card face (G2). Depends on generated types + `Ref`.
- [x] T011 Wire `scripts/build-gallery.ts`: compile the R3m world, call `RelaxService.relax` over C1–C6, render the S3 cards; add the "least-worst, never silence" section naming SPEC-09 (report over R3m, computed not authored). Regenerate `docs/assets/gallery/index.html`.

## Phase 6: Batch propagation & gate

- [x] T012 Sweep the canonical peers in the same change: CLAUDE.md current-phase line; `assay-build-plan.md` / `assay-delivery-plan.md` Stage-4 status; the gallery. Note the research note asserts no new register candidate (the formalism is decided by DEC-19; latitude is Stage-4-delegated under vignette §6/§9).
- [x] T013 Gate: `npm run typecheck` clean; `npm test` green (SPEC-01…08 baseline + SPEC-09 suites); `npm run gallery` renders the S3 cards from the actual `/relax`. No schema regen.

---

## Dependencies & parallelism

- **T003→T004** (tier/minimality) and **T005→T006** (candidates) are independent tracks — run in parallel.
- **T007** (types) unblocks **T008→T009** (service), which depends on T004 + T006.
- **T010** is parallel to the service; **T011** needs T009 + T010.
- **T012/T013** are the closing sweep and gate.
