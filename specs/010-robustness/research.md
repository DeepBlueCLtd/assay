# Research: Scenario Robustness (SPEC-10)

**Date**: 2026-07-14

All technical decisions for this feature are already resolved by the research note (`docs/research/06-robustness.md`) and the existing register. No NEEDS CLARIFICATION items existed in the technical context.

## Decisions

### 1. Robustness posture: minimax (worst-case)

- **Decision**: Judge each plan by its worst-case verdict across scenarios.
- **Rationale**: Scenario-weighted is forbidden (DEC-15/19, `scenario_weight` firewall); minimax regret launders absolute failure into relative shortfall (violates G2). Minimax preserves the four-stop verdict as honest data.
- **Alternatives**: Scenario-weighted (rejected — honesty); minimax regret (rejected — presentation dishonesty); Pareto-over-scenarios (rejected — overcomplicates without adding honest content).

### 2. No cross-scenario dominance filter

- **Decision**: The handful is not re-filtered by cross-scenario performance. The scenario strip shows collapse; the commander decides.
- **Rationale**: Removing a plan because it collapses under one scenario makes the robustness judgement for the commander — same error as weighting (JP 5-0: comparison is a commander's judgement).
- **Alternatives**: Cross-scenario non-domination filter (rejected — usurps commander's role).

### 3. Scenario set: R1, R2, R3 (not R3m)

- **Decision**: The robustness scenario set is R1, R2, R3. R3m is a relaxation excursion (thesis B, SPEC-09).
- **Rationale**: R3m is not a distinct adversary COA — it is a branch of R3 used to engineer the infeasibility conflict. The three COAs in vignette §4 are R1, R2, R3.
- **Alternatives**: Include R3m (rejected — conflates robustness with relaxation).

### 4. Service structure: orchestration over existing scorer

- **Decision**: A `RobustnessService` class that compiles worlds per scenario, scores each plan against each world via `ScoreService.score()`, and assembles the verdict tensor.
- **Rationale**: DEC-10 (scorer is the unit; analysis is a loop). No new scoring engine.
- **Alternatives**: Extend `HandfulService` to multi-scenario (rejected — handful is scenario-agnostic by design; robustness is a downstream consumer).

### 5. Component: pure scenario strip, no interactivity beyond trace

- **Decision**: `scenarioStrip.ts` is a pure component (HTML string from data) showing the verdict tensor. Clicking a cell opens the trace drawer (existing). No scenario-weight display, no robustness score.
- **Rationale**: G2 (no bare scalars), constitution §II. The strip is data, not recommendation.
- **Alternatives**: Interactive "what-if" scenario builder (rejected — out of scope; a later authoring surface).
