# Tasks: Scenario Robustness (SPEC-10)

**Input**: Design documents from `specs/010-robustness/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Tests**: Tests are included — the spec requires fixture-based validation of the thesis-C exit (SC-001, SC-002) and oracle case preservation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Add seam types for the robustness feature

- [X] T001 Add `RobustnessRequest`, `RobustnessResult`, and `ScenarioVerdictTensor` movement types to `src/seam.ts` — the orchestration's input/output types per `data-model.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The multi-scenario scoring orchestration that all user stories depend on

- [X] T002 Implement `RobustnessService` in `src/robustness.ts` — the thin orchestration: accept a set of plan refs and a set of scenario-keyed world refs; score each plan against each world via the existing `ScoreService.score()` (DEC-10, no new engine); assemble the `plan × commitment × scenario` verdict tensor; compute worst-case verdict per plan×commitment (minimax — research note §1: `violated < tight < marginal < robust`); set `stamps_compatible` by comparing consumed-knowledge stamp lineages across worlds; compute a deterministic stamp over inputs
- [X] T003 Write tests for `RobustnessService` in `tests/robustness.test.ts` — thesis-C exit on Meridian fixtures: (a) `strait_early` plan's C2 verdict is `robust` under BASE, `violated` under R2; (b) at least one `sweep_first` plan survives all three scenarios with all `must`-tier verdicts at `marginal` or better; (c) `stamps_compatible` is `true` when all worlds share the same consumed knowledge set; (d) `stamps_compatible` is `false` when worlds come from different knowledge sets; (e) deterministic stamp — same inputs produce identical stamp; (f) existing oracle cases O-1–O-4 still pass (regression guard)

**Checkpoint**: Multi-scenario scoring works and the thesis-C collapse is reproducible from fixtures

---

## Phase 3: User Story 1 — View plan verdicts across scenarios (Priority: P1) 🎯 MVP

**Goal**: Score the handful across R1/R2/R3 and return the verdict tensor showing which plans collapse and which survive

**Independent Test**: Call `RobustnessService` with the Meridian handful and R1/R2/R3 worlds; verify the `strait_early` plan collapses under R2 and the `sweep_first` alternative survives all three

- [X] T004 [US1] Wire `RobustnessService` into the app bootstrap (`src/app/bootstrap.ts` or equivalent) — compile BASE/R1/R2/R3 worlds from the same knowledge set, generate the handful against BASE, then call the robustness service with the handful plans and scenario worlds
- [X] T005 [US1] Add an integration test in `tests/robustness.test.ts` that exercises the full pipeline: knowledge → compile (×4 scenarios) → handful → robustness scoring → verify the verdict tensor matches the thesis-C exit criteria (SC-001, SC-002)

**Checkpoint**: The multi-scenario verdict tensor is computed end-to-end from fixtures

---

## Phase 4: User Story 2 — Scenario strip on S2 surface (Priority: P2)

**Goal**: Render a visual scenario strip showing per-plan, per-commitment, per-scenario verdicts as four-stop chips, making collapse visible at a glance

**Independent Test**: Render the scenario strip for the Meridian handful and visually confirm the `strait_early` plan's C2 cell collapses under R2

- [X] T006 [P] [US2] Create the scenario strip pure component in `src/components/scenarioStrip.ts` — takes the `ScenarioVerdictTensor` and renders an HTML table: one row per plan, one cell per commitment, one sub-cell (or column group) per toggled scenario, each showing a four-stop verdict chip (reuse existing `bandPill` patterns); highlight verdict drops from BASE; include `data-glow-id`/`data-glow-sig` attributes for the glow system (SPEC-16 pattern)
- [X] T007 [P] [US2] Add a legend entry for the scenario strip in `src/components/legends.ts` — the "data pill key" for scenario columns and collapse indicators
- [X] T008 [US2] Wire the scenario strip into the gallery (`scripts/build-gallery.ts` or equivalent) — render the strip for the Meridian handful scored across BASE/R1/R2/R3 so the demo moment is visible in `docs/assets/gallery/index.html`
- [X] T009 [US2] Add unit tests for `scenarioStrip` rendering in `tests/robustness.test.ts` — verify the component produces correct HTML structure: correct number of scenario columns, correct verdict chips per cell, collapse markers present on degraded cells

**Checkpoint**: The scenario strip renders in the gallery; the "don't plan on most-likely" demo moment is visible

---

## Phase 5: User Story 3 — Comparability guard on mixed stamps (Priority: P3)

**Goal**: When verdicts from different stamp lineages appear in the same view, indicate incomparability visually

**Independent Test**: Score plans against worlds from different knowledge sets and verify the strip renders a comparability warning

- [X] T010 [US3] Extend the scenario strip component (`src/components/scenarioStrip.ts`) to render a visual incomparability indicator when `stamps_compatible` is `false` — e.g. a greyed overlay, a warning banner, or a comparability icon on affected cells
- [X] T011 [US3] Add a test in `tests/robustness.test.ts` for the comparability guard rendering — verify the indicator appears when `stamps_compatible` is `false` and is absent when `true`

**Checkpoint**: Mixed-stamp views are flagged; same-knowledge different-scenario views render cleanly

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T012 Run `npm run typecheck` and fix any type errors across all new and modified files
- [X] T013 Run `npm test` and verify all existing tests pass (no regressions — oracle O-1–O-4, handful G1, all prior SPEC tests)
- [X] T014 Run `npm run gallery` and visually verify the scenario strip renders correctly in the gallery
- [X] T015 Update `CLAUDE.md` "Current phase" line to record Stage 5 completion status and SPEC-10 implementation details

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — can start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user stories
- **Phase 3 (US1)**: Depends on Phase 2
- **Phase 4 (US2)**: Depends on Phase 2 (can run in parallel with US1; the component takes the tensor as data)
- **Phase 5 (US3)**: Depends on Phase 4 (extends the scenario strip component)
- **Phase 6 (Polish)**: Depends on all user stories being complete

### Within Each User Story

- Service/data before component
- Component before integration/wiring
- Tests alongside or after implementation

### Parallel Opportunities

- T006 and T007 can run in parallel (different files)
- US1 and US2 can proceed in parallel after Phase 2 (US1 wires the service, US2 builds the component — both consume the same tensor type)

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational (T002, T003)
3. Complete Phase 3: US1 (T004, T005)
4. **STOP and VALIDATE**: The thesis-C collapse is reproducible from tests
5. The feature works without the visual surface

### Incremental Delivery

1. Setup + Foundational → scoring works
2. US1 → full pipeline wired → thesis-C exit provable
3. US2 → scenario strip visible → demo moment renderable
4. US3 → comparability guard → safety net for mixed stamps
5. Polish → typecheck, tests, gallery, CLAUDE.md update

---

## Notes

- No schema changes — all types exist; only new movement types in `src/seam.ts`
- No new seam endpoint — robustness is a client-side orchestration over `POST /score`
- The scenario strip reuses existing component patterns (bandPill, s2Matrix) — follow the pure-component convention (HTML string from data, no DOM manipulation)
- R3m is excluded from the robustness scenario set (it is a relaxation excursion)
- Scenario weights (K14a–c) must not appear anywhere in computation or display (FR-005)
