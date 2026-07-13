# Tasks: Interactive system-flow infographic (SPEC-14 · flow-view sub-slice)

Dependency-ordered. All complete (built 2026-07-13). Each maps to the plan's modules and the spec's acceptance intent.

## Phase 1 — the testable core (`src/flow.ts`)

- [x] T001 Define inputs (`FlowFixtures`) and JSON-safe outputs (`StateKey`, `StateData`, `TourBeat`, `FlowModel`).
- [x] T002 `computeState(fx, key, seed)` — seed the answered base via the store (no delta noise); perform the narrative writes (supersede / contest / resolve) through `KnowledgeService` so they publish real, attributable deltas.
- [x] T003 Drive `CompileService` with the excursion; on refusal capture `refusalBanner` + the gate label; persist nothing (honest decline).
- [x] T004 On success: `channelTrace` (L2, terminates in owners, G3), `HandfulService` + `ScoreService` → `handfulStrip` + `s2Matrix` (four-stop, no decimals), real world/handful stamps, live `waives`-edge detection.
- [x] T005 R3m only: `RelaxService` → `s3Cards` with the stated `tie_break` (G4).
- [x] T006 Scripted, labelled staleness fan-out on supersession (`{P1·C2, P2·C1, P2·C2}`, marked not-yet-computed).
- [x] T007 `buildFlowModel` — enumerate the 32-state sandbox + tour beats; `computeComparability` for the G1 guard (real `stamp_mismatch`).

## Phase 2 — the self-contained shell (`src/flowPage.ts`)

- [x] T008 `renderFlowPage(model)` — inline CSS (system-font stack), model inlined as JSON, framework-free `render(view)`.
- [x] T009 L0 orientation (one sentence, no doctrine), L1 heartbeat (four role lanes + gate pulse + scripted labels), L2 detail (backward chain to owners).
- [x] T010 Controls — zoom seg, mode seg, tour prev/next, sandbox toggles, undo (re-seed to the frozen tableau).

## Phase 3 — build + wiring

- [x] T011 `scripts/build-flow.ts` → `docs/assets/flow/index.html`; `npm run flow` and add to `build:site`.
- [x] T012 `scripts/build-site.ts` copies `flow.html`; `docs/assay-home.html` card links it (comms §1.6).

## Phase 4 — acceptance (`tests/flow.test.ts`)

- [x] T013 AS-1…AS-11 as real vitest assertions over the model and the emitted page.

## Phase 5 — propagation & register hygiene

- [x] T014 Batch-propagate: `CLAUDE.md` current-phase line, `docs/status.yml` updates feed, the proposal spec's status, `docs/assay-home.html` card.
- [x] T015 Record the ratify-after debt in concept §6.15; assess home-page-currency (concept §6.12 — no thesis moves planned→demonstrated).
