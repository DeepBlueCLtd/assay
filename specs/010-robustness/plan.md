# Implementation Plan: Scenario Robustness (SPEC-10)

**Branch**: `claude/remaining-dev-tasks-rnbjfo` | **Date**: 2026-07-14 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/010-robustness/spec.md`

## Summary

Multi-scenario scoring of the SPEC-08 handful across R1/R2/R3 excursions, demonstrating thesis C (robustness): the R1-optimal plan visibly collapses under R2 while a robust alternative survives all three. Implementation is a thin orchestration over the existing SPEC-07 scorer (DEC-10) plus a scenario strip component for the S2 surface, with the comparability guard extended to the display layer. Research note `docs/research/06-robustness.md` decides the minimax (worst-case) posture — scenario-weighted and minimax-regret rejected on honesty grounds.

## Technical Context

**Language/Version**: TypeScript (strict, ESM)

**Primary Dependencies**: Existing `ScoreService` (SPEC-07), `CompileService` (SPEC-06), `HandfulService` (SPEC-08), generated types from LinkML schema, `src/interval.ts`, `src/dominance.ts`

**Storage**: In-browser `ObjectStore` (content-addressed, SPEC-01) — no new schema types needed; existing `CommitmentVerdict.scenario` and `PlanScore.scenario` fields already support multi-scenario labelling

**Testing**: Vitest — oracle case preservation (O-1–O-4), fixture-based scenario-collapse test, component rendering

**Target Platform**: In-browser, offline-capable (DEC-4)

**Project Type**: In-browser demonstrator behind a seam contract

**Performance Goals**: N/A at v1 scale — 16 plans × 3 scenarios × 6 commitments = 288 score calls, each touching tens of cells

**Constraints**: No schema changes; no new stored object types; reuse the scorer, never reimplement (DEC-10)

**Scale/Scope**: Meridian vignette only — 3 scenarios (R1, R2, R3), 16 generated plans, 6 commitments

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Seam Contract Is the Invariant | PASS | Multi-scenario scoring reuses `POST /score` (seam §5) in a loop — no new endpoint, no surface-side computation. The scenario strip arranges existing verdict projections. |
| II. Banded Honesty | PASS | All verdicts use the four-stop scale with margin bands; no robustness index or scalar summary. Scenario weights (K14a–c) are firewalled from computation and display (FR-005). |
| III. Traceability | PASS | Every per-scenario verdict carries `scored_from` edges to its scenario world; trace chains terminate in named knowledge (FR-008, G3). |
| IV. Determinism | PASS | Same plans + same scenario worlds + same engine → byte-identical verdict tensors. The comparability guard (FR-007) prevents silent cross-stamp comparison. |
| V. Research Before Implementation | PASS | Research note `docs/research/06-robustness.md` exists, cites sources, ends with "what we will do differently." |
| VI. Register Supremacy | PASS | No new register decisions asserted. Minimax posture forced by existing DEC-9/15/19 and the `scenario_weight` firewall. |
| G1–G6 invariants | PASS | G1 (determinism via stamp); G2 (no bare scalars — verdict chips only); G3 (trace to named knowledge); G5 (contested never compiles — inherited from SPEC-06); G6 (interval arithmetic unchanged — no new scoring maths). G4 is not exercised (relaxation, not robustness). |

No violations — no complexity tracking needed.

## Project Structure

### Documentation (this feature)

```text
specs/010-robustness/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
src/
├── robustness.ts        # NEW — the multi-scenario orchestration service
├── score.ts             # EXISTING — reused, not modified
├── compile.ts           # EXISTING — reused, not modified
├── handful.ts           # EXISTING — reused, not modified
├── seam.ts              # MODIFIED — add RobustnessRequest/RobustnessResult types
└── components/
    └── scenarioStrip.ts # NEW — the scenario strip pure component

tests/
└── robustness.test.ts   # NEW — thesis-C exit, collapse detection, comparability guard
```

**Structure Decision**: Single new service file (`src/robustness.ts`) orchestrating existing services in a loop, plus one new pure component (`src/components/scenarioStrip.ts`). Follows the established pattern: one service file per seam endpoint, one component file per visual element.
