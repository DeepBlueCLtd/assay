---
description: "Task list for SPEC-07 — Score (plan × world → verdicts + banded scores)"
---

# Tasks: Score — plan × world → verdicts + banded scores (SPEC-07)

**Input**: Design documents from `specs/007-score/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/score-service.md, quickstart.md; research note `docs/research/03-score-plan.md` (DEC-11 gate — present)
**Tests**: REQUIRED — the oracle cases (vignette §9) and the contract invariants are written against the seam §5 shape and **confirmed failing before implementation** (TDD; constitution quality gate 2). Oracle expected values are committed constants, never regenerated from the scorer.
**Organization**: shared substrate (interval arithmetic + service skeleton), then by user story in priority order. Stage-3 exits are the acceptance scenarios.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: parallelizable (different file, no dependency on an incomplete task)
- **[Story]**: US1 (oracle O-1..O-3, P1) · US2 (G6/O-4, P1) · US3 (honest matrix, P2) · US4 (determinism, P2) · US5 (hook + guard, P3)

## Path conventions
Single project: `src/`, `tests/`, `fixtures/`. Reuse `src/{store,trace,canonical,validate,seam,knowledge,compile}.ts`, `src/generated/types.ts`, `src/components/{bandPill,provenanceChip}.ts`. **No schema change** — `CommitmentVerdict`/`PlanScore`/`Plan`/`Band` already exist; do **not** run `npm run gen`.

---

## Phase 1: Setup

- [ ] T001 Confirm the SPEC-06 baseline is green: `npm install`, `npm run typecheck`, `npm test` (107 tests). Record any failing baseline before Stage-3 code.
- [ ] T002 Add `fast-check` as a dev dependency (`package.json`), for the O-4 property tests (research note §4). `npm install`.
- [ ] T003 Confirm the pieces SPEC-07 reuses exist: `CommitmentVerdict`/`PlanScore`/`Plan`/`Band` in `src/generated/types.ts`; `scored_from` in `TraceEdgeType`; `stamp_mismatch` in `RefusalReason` (`src/seam.ts`); the sparse `Channel`/`RegionOverride`/`VignetteConfig` shapes SPEC-06 produced.

## Phase 2: Foundational (interval arithmetic + service skeleton — blocks all stories)

**Purpose**: the tested arithmetic module, the score-time materialiser, and the service shell every story composes.

- [ ] T004 Write `tests/interval.test.ts` FIRST and confirm failing: add/sub/scaleBy/max/min on closed bands; unit-checked; rejects non-finite; O-1 (`2 + [4,6] + [3,5] = [9,13]`) and O-4 widening (`[8,14] ⊇ [9,13]`); `contains`/`width`.
- [ ] T005 Implement `src/interval.ts`: `add`, `sub`, `scaleBy`, `max`, `min`, `contains`, `width`, `scalar(n, unit)` — textbook closed-interval rules on `Band`; unit-checked; reject non-finite (a severed route is caught here). Make T004 pass. **No mean/mid operation** (DEC-15).
- [ ] T006 [P] Implement `src/materialise.ts`: `channelAt(world, config, kind, x, y, t) => Band` — innermost active `RegionOverride` whose geometry contains `(x,y)` and whose window contains `t` (later `from_step` wins), else the channel default. Pure; reads config geometry; stores nothing (research note §2).
- [ ] T007 [P] Add scorer service types to `src/seam.ts`: `KnowledgeOverride`, `ScoreRequest`, `ScoreSuccess`, `ScoreResult` (per data-model.md). Types only; reuse `Refusal`/`Ref`.
- [ ] T008 Implement `src/metrics.ts`: a registry keyed by `Commitment.metric` — reach-step (`strait_open_step`/`port_open_step`/`extraction_step` = start + Σ leg durations via interval division on mobility), exposure (`threat_exposure`/`civil_harm_exposure` = Σ over occupied (cell,time) of channel band × dwell, scoped), state (`causeway_intact` = banded read). Plus the abstract oracle metric (start + dur(A) + dur(B)) for O-1. Each returns a `Band`; unknown metric surfaces a defect.
- [ ] T009 Scaffold `ScoreService` in `src/score.ts`: constructor composes `ObjectStore` + `TraceStore`; private helpers for override resolution, the verdict mapping, and edge writes. No behaviour yet.

**Checkpoint**: interval tests green; materialiser + metric registry compile; the scorer shell compiles.

---

## Phase 3: User Story 1 — the scorer reproduces the oracle (P1) 🎯 correctness leg

**Goal**: interval arithmetic reproduces O-1; the signed-margin-band mapping reproduces O-2 and O-3 including the swept-threshold band-edge-only transitions.
**Independent test**: abstract two-segment metric + C2-style thresholds → O-1/O-2/O-3 constants.

- [ ] T010 [US1] Write `tests/oracle.test.ts` FIRST and confirm failing: O-1 `[9,13]`; O-2 robust + margin `[15,19]`; O-3 tight; O-3 sweep `at_most T` 8→14 → transitions only at 9,13 and the violated/tight/marginal/robust sequence. Constants hand-typed from vignette §9.
- [ ] T011 [US1] Implement `marginBand(comparator, threshold, valueBand)` and `verdictFor(marginBand)` in `src/score.ts` (research note §3 mapping). Make O-1/O-2/O-3 pass. Verdicts cross only as the four-stop scale; `margin` returned as a Band (G2).

## Phase 4: User Story 2 — propagation honesty (G6/O-4) (P1)

**Goal**: containment under widening, soundness, verdict-monotonicity — the vignette instance and the property.
**Independent test**: O-4 widening + fast-check property.

- [ ] T012 [US2] Extend `tests/oracle.test.ts` FIRST and confirm failing: O-4 `[8,14] ⊇ [9,13]`; fast-check — for random `[lo,hi]`, widening, comparator, threshold: output-superset-under-widening, point-realisation membership, verdict never more confident under widening.
- [ ] T013 [US2] Verify/adjust `src/interval.ts` + verdict mapping so the property holds by construction (inclusion-monotone operators; signs-only mapping is monotone). Make T012 pass. No code should special-case the property — it must fall out of the design.

## Phase 5: User Story 3 — the honest matrix (P2)

**Goal**: score a canned Meridian plan against the base world → four-stop verdicts + margins + `scored_from` edges; render the S2 matrix.
**Independent test**: score P1 vs base world; one verdict per C1–C6; backward trace reaches named owners; matrix chips render.

- [ ] T014 [US3] Author `fixtures/plans.json`: a canned Meridian handful (P1 "strait-early", P2 "sweep-first" — the thesis-C pair), each a `Plan` with `elements` of timed `RouteLeg`s over BROOM/PACKHORSE/ANVIL/KINGFISHER, using region-consistent cells. Validate against generated types in `tests/fixtures.test.ts`.
- [ ] T015 [US3] Write `tests/score.test.ts` FIRST and confirm failing: `/score(P1, baseWorld, R1)` → one `CommitmentVerdict` per C1–C6 on the four-stop scale, each with a `margin` Band; a `scored_from` edge per verdict/score to the world; backward trace from a verdict reaches K-owners (G3); P1 healthier under R1 than R2 on C1/C2 (thesis-C direction).
- [ ] T016 [US3] Implement the full `score()` in `src/score.ts`: resolve plan+world (`unknown_ref`), apply `knowledge_overrides` (call-only), evaluate each commitment's metric via `src/metrics.ts` + `src/materialise.ts`, map to verdict + margin, build `PlanScore[]`, stamp (over inputs), store verdicts/scores, write `scored_from` edges, return canonically-ordered results. Make T015 pass; no delta (contract §9).
- [ ] T017 [US3] Implement `src/components/s2Matrix.ts`: plans × commitments grid of four-stop chips (one colour language, ui-design §2), `margin` band on hover via `bandPill`, no decimals in cells; click-through affordance to the trace. Write `tests/s2Matrix.test.ts`: chip per cell, margin-on-hover markup present, assert no bare decimal in any verdict cell.

## Phase 6: User Story 4 — determinism (P2)

- [ ] T018 [US4] Extend `tests/score.test.ts` FIRST and confirm failing: score P1 twice → identical stamp + identical verdicts/scores; commitments in shuffled order → identical stamp and canonically-ordered verdicts.
- [ ] T019 [US4] Ensure `src/score.ts` stamps over sorted inputs and returns verdicts sorted by `commitment` id. Make T018 pass.

## Phase 7: User Story 5 — perturbation hook + comparability guard (P3)

- [ ] T020 [US5] Extend `tests/score.test.ts` FIRST and confirm failing: `knowledge_overrides` widening one answer → affected verdict no more confident (G6) and store/trace unchanged apart from the returned artefacts; a stamp-disagreeing plan → `Refusal{stamp_mismatch}` naming the refs, nothing persisted.
- [ ] T021 [US5] Implement the hook (substitute answer for the call only; persist nothing) and the `stamp_mismatch` guard in `src/score.ts`. Make T020 pass.

## Phase 8: Gallery + docs sweep (batch propagation)

- [ ] T022 Wire the honest-matrix demo moment into `scripts/build-gallery.ts`: run the actual scorer over P1/P2 against the resolved base world, render `s2Matrix`, add the "pick a verdict, walk it" caption. `npm run gallery`.
- [ ] T023 Batch-propagate canonical docs in this change: CLAUDE.md current-phase line (Stage 3 SPEC-07 built); build/delivery peers where they name SPEC-07 status; note that SPEC-08 (generator) remains sacrificial next. No register candidate (SPEC-07 asserts no new decision).
- [ ] T024 Green gate: `npm run typecheck`, `npm test` (SPEC-06 baseline + SPEC-07), `npm run gallery`. Confirm oracle constants unchanged and the gallery renders the matrix.

---

## Dependencies

- Phase 2 (interval + materialiser + metrics + shell) blocks all stories.
- US1 (verdict mapping) and US2 (property) are the correctness leg — land before US3 consumes them.
- US3 (matrix) depends on the full `score()` and the plan fixtures; US4/US5 extend `score()`.
- Gallery (T022) depends on US3; docs sweep (T023) and green gate (T024) last.
