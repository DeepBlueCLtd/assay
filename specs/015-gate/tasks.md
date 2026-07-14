# Tasks: Spine-Complete Gate Harness

**Input**: Design documents from `specs/015-gate/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Tests**: The gate harness IS the test — every task produces test code. No separate test tasks needed.

**Organization**: Tasks are grouped by assertion concern. The gate is a single test file (`tests/gate.test.ts`) with a shared pipeline rig and assertion-group describe blocks.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup

**Purpose**: Create the gate test file with shared rig — the full Meridian pipeline instantiated once

- [ ] T001 Create `tests/gate.test.ts` with fixture loading (all six fixture files: `fixtures/knowledge.json`, `fixtures/commitments.json`, `fixtures/plans.json`, `fixtures/coas.json`, `fixtures/vignette-config.json`, `fixtures/force-elements.json`), imports for all nine services (`KnowledgeService`, `CompileService`, `ScoreService`, `HandfulService`, `RelaxService`, `RobustnessService`, `SensitivityService`, `DiscriminationService`, `StalenessService`), and the standard helper functions (`load`, `K`, `answered`, `ref`, `byId`, `ok`) following the established rig pattern from `tests/robustness.test.ts`
- [ ] T002 Implement `beforeAll` shared rig in `tests/gate.test.ts`: seed BASE knowledge (K1–K9 answered), create K12a/K12b, contest, resolve K12a, load COAs/commitments/plans into store, then run the full pipeline — compile BASE world, score P1 and P2, run handful, compile R3m world and run relax, compile R1/R2/R3 worlds and run robustness, run sensitivity/discrimination/staleness — capturing all results into a shared `Gate` interface

**Checkpoint**: The shared rig runs the complete pipeline. `npm run typecheck` passes. Running `npm test -- tests/gate.test.ts` executes the rig with no assertion failures (no assertions yet).

---

## Phase 2: Invariant Assertions — G1–G6 (Priority: P1)

**Goal**: Assert all six cross-cutting invariants hold end-to-end on the integrated pipeline results

**Independent Test**: `npm test -- tests/gate.test.ts` — all G1–G6 describe blocks pass

### Implementation

- [ ] T003 [US1] Add `describe('G1 — determinism')` block in `tests/gate.test.ts`: re-run the full pipeline with identical inputs and assert byte-identical stamps on compile, score, handful, and relax results; verify every stored object's content hash matches its storage key
- [ ] T004 [US1] Add `describe('G2 — no bare assessed scalars')` block in `tests/gate.test.ts`: implement a recursive structural walker that inspects every compile/score/handful/relax/robustness result; assert every value from an assessed/reported/assumption source is a `Band {lo, hi}` (never a bare number); assert every verdict field is one of the four-stop values (`robust`, `marginal`, `tight`, `violated`)
- [ ] T005 [US1] Add `describe('G3 — complete trace chains')` block in `tests/gate.test.ts`: for every compiled world, every score result, and every relaxation candidate, perform a backward trace walk via `TraceStore` and assert every chain terminates in a named `KnowledgeObject` with a named owner; assert no chain has `complete: false` (dead-end)
- [ ] T006 [US1] Add `describe('G4 — least-worst, never silence')` block in `tests/gate.test.ts`: assert the R3m relaxation report is non-empty; assert every relaxation candidate has non-empty `sacrificed` array; assert `tie_break` text is present on candidates with same-tier sacrifices
- [ ] T007 [US1] Add `describe('G5 — contested never compiles')` block in `tests/gate.test.ts`: re-contest K12 (create fresh KnowledgeService, seed, contest K12a/K12b WITHOUT resolving), attempt compile, and assert it returns a `Refusal` with `reason: 'contested_knowledge'` naming K12a and K12b in `offending`
- [ ] T008 [US1] Add `describe('G6 — propagation honesty')` block in `tests/gate.test.ts`: re-assert oracle O-4 (containment under widening) through the integrated pipeline using fast-check property-based testing — widening any input band must never narrow any output band, and every point-realisation of inputs must score inside the output band

**Checkpoint**: All six invariant blocks pass. `npm test -- tests/gate.test.ts` green for G1–G6.

---

## Phase 3: Oracle Re-Assertion — O-1 through O-4 (Priority: P1)

**Goal**: Re-assert the four hand-computed oracle cases at integration level

**Independent Test**: `npm test -- tests/gate.test.ts` — the oracle describe block passes with exact hand-computed constants

### Implementation

- [ ] T009 [US2] Add `describe('Oracle re-assertion')` block in `tests/gate.test.ts`: re-assert O-1 (interval sum `[9,13]`), O-2 (robust verdict, margin `[15,19]`), O-3 (four-stop sweep transitions at band edges 9 and 13 only — no interior cuts), and O-4 (propagation honesty under widening via fast-check) through the integrated pipeline results, matching the hand-computed constants from `tests/oracle.test.ts` exactly

**Checkpoint**: Oracle cases pass at integration level. Constants match the hand-computed values.

---

## Phase 4: Thesis Walkability — A through F (Priority: P1)

**Goal**: Confirm all six coverage-matrix theses are walkable on Meridian

**Independent Test**: `npm test -- tests/gate.test.ts` — all six thesis describe blocks pass

### Implementation

- [ ] T010 [P] [US3] Add `describe('Thesis A — pipeline')` block in `tests/gate.test.ts`: assert every compiled channel in the BASE world has `compiled_into` trace edges that trace backward to named `KnowledgeObject`s
- [ ] T011 [P] [US3] Add `describe('Thesis B — least-worst')` block in `tests/gate.test.ts`: assert the R3m relaxation returns exactly three inclusion-minimal candidates sacrificing C4, C3, and C2 respectively; each has non-empty `sacrificed` and command-language `narrative`
- [ ] T012 [P] [US3] Add `describe('Thesis C — robustness')` block in `tests/gate.test.ts`: assert P1 C1/C2 verdicts are `robust` under BASE but `violated` under R2 (strait denial collapse); P2 holds C4 `robust` across scenarios where P1 does not
- [ ] T013 [P] [US3] Add `describe('Thesis D — collection')` block in `tests/gate.test.ts`: assert K11 ranks above K13 on discrimination despite higher cost
- [ ] T014 [P] [US3] Add `describe('Thesis E — sensitivity')` block in `tests/gate.test.ts`: assert K8 tops the sensitivity ranking with `single_source: true`
- [ ] T015 [P] [US3] Add `describe('Thesis F — staleness')` block in `tests/gate.test.ts`: assert staleness walk from K5 flags exactly the K5-dependent verdicts (P1-C2, P2-C1, P2-C2) and nothing else

**Checkpoint**: All six theses pass. The coverage matrix is fully walked.

---

## Phase 5: Stamp Determinism (Priority: P2)

**Goal**: Confirm content-addressing and stamp determinism hold across the full pipeline

**Independent Test**: `npm test -- tests/gate.test.ts` — the determinism describe block passes

### Implementation

- [ ] T016 [US4] Add `describe('Stamp determinism')` block in `tests/gate.test.ts`: run the full pipeline twice with identical inputs (same seed, same engine version) and assert every stamp (compile, score, handful, relax) is byte-identical across the two runs; then widen one knowledge band and re-run, asserting the compile stamp changes and downstream stamps update accordingly

**Checkpoint**: Determinism verified at integration level.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, typecheck, test-suite integration

- [ ] T017 Run `npm run typecheck` and fix any type errors in `tests/gate.test.ts`
- [ ] T018 Run `npm test` (full suite) and confirm the gate harness passes alongside all existing 267+ tests with no regressions
- [ ] T019 Run quickstart.md validation: execute `npm test -- tests/gate.test.ts` and confirm all assertion groups pass per the quickstart table

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (G1–G6)**: Depends on Phase 1 (shared rig must exist)
- **Phase 3 (Oracles)**: Depends on Phase 1 (shared rig); can run in parallel with Phase 2
- **Phase 4 (Theses)**: Depends on Phase 1 (shared rig); can run in parallel with Phase 2 and 3
- **Phase 5 (Determinism)**: Depends on Phase 1 (shared rig); can run in parallel with Phases 2–4
- **Phase 6 (Polish)**: Depends on all prior phases

### User Story Dependencies

- **US1 (G1–G6)**: Depends on Phase 1 only — no cross-story dependencies
- **US2 (Oracles)**: Depends on Phase 1 only — independent of US1
- **US3 (Theses)**: Depends on Phase 1 only — independent of US1 and US2
- **US4 (Determinism)**: Depends on Phase 1 only — independent of all others

### Within Each Phase

All thesis tasks (T010–T015) are marked [P] — they can run in parallel since they write separate describe blocks in the same file but touch no overlapping logic.

### Parallel Opportunities

- T010, T011, T012, T013, T014, T015 (all thesis assertions) can run in parallel
- Phases 2, 3, 4, 5 can all run in parallel after Phase 1 completes

---

## Implementation Strategy

### MVP First (Phase 1 + Phase 2)

1. Complete Phase 1: Shared rig
2. Complete Phase 2: G1–G6 invariant assertions
3. **STOP and VALIDATE**: `npm test -- tests/gate.test.ts` — invariants hold
4. The gate's primary purpose (invariant assertion) is met

### Incremental Delivery

1. Phase 1 → Rig runs → Foundation ready
2. Phase 2 → G1–G6 pass → Core gate functional
3. Phase 3 → Oracles re-asserted → Correctness leg confirmed
4. Phase 4 → Theses walked → Coverage matrix validated
5. Phase 5 → Determinism verified → Full gate complete
6. Phase 6 → Polish → Gate merged

---

## Notes

- All tasks produce code in a single file: `tests/gate.test.ts`
- The shared rig uses `beforeAll` (not `beforeEach`) — the pipeline is deterministic (G1), so re-running per block wastes time
- Oracle constants (O-1–O-4) are HAND-COMPUTED and NEVER regenerated from implementation output
- No new runtime code, no schema change, no new seam types, no new components
