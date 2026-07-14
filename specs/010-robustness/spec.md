# Feature Specification: Scenario Robustness

**Feature Branch**: `claude/remaining-dev-tasks-rnbjfo`

**Created**: 2026-07-14

**Status**: Draft

**Input**: User description: "SPEC-10: Scenario robustness (thesis C). Multi-scenario scoring across R1/R2/R3 as excursions; scenario strip component; comparability guard on mixed stamps extended to the display."

**Research Note**: `docs/research/06-robustness.md` (DEC-11 gate satisfied)

**Register Decisions Restated**: DEC-4 (scorer honestly real), DEC-9 (banded honesty), DEC-10 (scorer as reusable unit — analysis is a re-scoring loop), DEC-15 (no midpoint), DEC-19 (no numeric weights — scenario weights firewalled)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View plan verdicts across scenarios (Priority: P1)

A planner has generated a handful of plans (via SPEC-08) against the BASE world. They want to see how each plan's commitment verdicts change when scored against R1, R2, and R3 excursions, so they can identify plans that collapse under specific adversary COAs and plans that survive all three.

**Why this priority**: This is the core of thesis C — the ability to see multi-scenario verdicts is the minimal viable feature. Without it, the planner optimises against most-likely and is blind to collapse.

**Independent Test**: Score a handful against BASE, R1, R2, R3 worlds and verify that verdicts differ per scenario; confirm the R1-optimal plan's C2 verdict degrades under R2.

**Acceptance Scenarios**:

1. **Given** a handful of plans scored against the BASE world, **When** the planner requests scoring against R1, R2, and R3, **Then** a `plan × commitment × scenario` verdict tensor is returned with each cell carrying a four-stop verdict and margin band traced to a named world.
2. **Given** the Meridian handful including a `strait_early` plan, **When** scored against R2 (Strait Denial), **Then** the C2 (`strait_open_step at_most 28`) verdict drops to `violated` (the R1-optimal collapse, vignette §6).
3. **Given** the Meridian handful including a `sweep_first` plan, **When** scored against R1, R2, and R3, **Then** all `must`-tier commitments remain at least `marginal` under every scenario (the robust alternative survives).

---

### User Story 2 - Scenario strip on the S2 surface (Priority: P2)

A planner views the S2 honest matrix and wants a visual scenario strip showing how each plan's verdicts behave across toggled scenarios. The strip renders four-stop verdict chips per plan per commitment per scenario, making collapse visible at a glance.

**Why this priority**: The visual surface is the user-observable exit criterion — "P1's scenario strip collapses at a glance when R2 is toggled while P2's holds." Without the strip, the data exists but the demo moment cannot be shown.

**Independent Test**: Render the scenario strip for the Meridian handful and visually confirm that the strait-early plan's C2 cell collapses under R2 while the sweep-first plan's holds.

**Acceptance Scenarios**:

1. **Given** the S2 matrix showing a handful, **When** the planner toggles R2, **Then** the scenario strip adds an R2 column next to BASE and the `strait_early` plan's C2 cell shows a `violated` verdict alongside its BASE `robust` verdict.
2. **Given** the scenario strip showing BASE and R2, **When** the planner toggles R1 and R3, **Then** additional scenario columns appear, each showing the per-plan per-commitment verdicts for that scenario.
3. **Given** any verdict cell in the scenario strip, **When** the planner clicks it, **Then** the trace drawer opens showing a backward trace to the named knowledge and scenario world that produced the verdict (G3).

---

### User Story 3 - Comparability guard on mixed stamps (Priority: P3)

A planner is viewing an S2 matrix or scenario strip that includes verdicts from two different knowledge recompiles (different stamp lineages). The display must indicate incomparability visually rather than silently mixing verdicts from different stamps.

**Why this priority**: Without the guard, a planner could misread stale verdicts as current. The guard is a honesty invariant (G1) but is lower priority because it is a safety net, not the primary workflow.

**Independent Test**: Score a plan against worlds compiled from different knowledge sets (different stamps) and verify the display greys out or flags the incomparable cells.

**Acceptance Scenarios**:

1. **Given** verdicts for plan P1 with world stamp `aaa` and verdicts for plan P2 with world stamp `bbb`, **When** both appear in the same scenario strip, **Then** the display indicates that the two sets are incomparable (e.g. greying, a warning banner, or a comparability icon).
2. **Given** verdicts for plan P1 scored against R1 (stamp lineage X) and R2 (stamp lineage X — same consumed knowledge), **When** both appear in the same scenario strip, **Then** the display treats them as comparable (same stamp lineage, different scenario overlay is valid).

---

### Edge Cases

- What happens when a plan's route passes through a region whose mobility is zeroed by a scenario excursion (e.g. R3's demolished causeway)? The scorer already handles this (severed route → `violated`); the scenario strip must render the `violated` verdict without error.
- How does the strip behave when only one scenario is toggled? It shows BASE + that scenario, two columns. The strip is additive — each toggle adds a column.
- What happens when no plans survive all scenarios? Every plan has at least one `violated` `must` under some scenario. The strip shows this honestly — no "best robust" fallback is invented.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST score each plan in a handful against each scenario's compiled world (R1, R2, R3) by reusing the existing SPEC-07 scorer in a loop (DEC-10). No new scoring engine.
- **FR-002**: The system MUST compile one world per scenario using the existing SPEC-06 compile service with its `scenario?` parameter. All scenario worlds MUST share the same consumed knowledge set.
- **FR-003**: The system MUST assemble a `plan × commitment × scenario` verdict tensor from the per-scenario scoring results. Each cell MUST carry the four-stop verdict and margin band from the SPEC-07 scorer.
- **FR-004**: The system MUST identify the worst-case verdict across scenarios for each plan and commitment (minimax posture — research note §1). The worst-case ordering is `violated < tight < marginal < robust`.
- **FR-005**: The system MUST NOT use scenario likelihoods (K14a–c `scenario_weight`) in any computation or display. The `scenario_weight` firewall (knowledge model §9, SPEC-06) remains in force.
- **FR-006**: The system MUST render a scenario strip component showing per-plan, per-commitment, per-scenario verdicts as four-stop verdict chips. Scenario columns are togglable.
- **FR-007**: The system MUST indicate when verdicts in the same view come from different stamp lineages (different consumed knowledge sets). Incomparable verdicts MUST be visually distinguished (greyed, flagged, or otherwise marked). Different scenarios over the same knowledge set are comparable and MUST NOT trigger the guard.
- **FR-008**: Every verdict cell in the scenario strip MUST be traceable backward through `scored_from` edges to the named world and knowledge that produced it (G3).
- **FR-009**: The system MUST reproduce the thesis-C exit on the Meridian fixtures: the `strait_early` plan's C2 verdict collapses to `violated` under R2; the `sweep_first` alternative's `must`-tier verdicts survive all three scenarios (R1, R2, R3).

### Key Entities

- **ScenarioVerdicts**: The per-plan, per-commitment, per-scenario verdict tensor — the core data structure assembled from multiple scoring passes. Not a new stored schema type; assembled in memory from existing `CommitmentVerdict` objects which already carry a `scenario` field.
- **Scenario Strip**: A display component showing the verdict tensor as a grid of four-stop chips, one column per toggled scenario, aligned to the S2 matrix.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Given the Meridian handful, the `strait_early` plan's C2 verdict under R2 is `violated` while under BASE it is `robust` — the collapse is reproducible from fixtures with no manual authoring.
- **SC-002**: Given the Meridian handful, at least one `sweep_first` plan survives all three scenarios (R1, R2, R3) with all `must`-tier commitments at `marginal` or better.
- **SC-003**: The scenario strip renders the collapse visually at a glance — a `strait_early` plan's R2 column shows degraded verdicts distinguishable from its BASE column without hovering or clicking.
- **SC-004**: No scenario likelihood (K14a–c) appears in any computation input, output, or display surface in the robustness feature.
- **SC-005**: All existing tests pass; typecheck clean; no regression in the SPEC-07 oracle cases (O-1–O-4) or SPEC-08 handful determinism (G1).

## Assumptions

- The SPEC-08 handful generator produces plans with sufficient route diversity to demonstrate the R1-optimal collapse (specifically, at least one `strait_early` plan whose PACKHORSE route passes through the `halcyon_strait` region). The existing generator's four-axis fan-out provides this.
- R3m is excluded from the robustness scenario set — it is a relaxation excursion (thesis B, SPEC-09), not a robustness scenario. The robustness set is R1, R2, R3.
- The scenario strip is added to the existing S2 surface and gallery, not as a new standalone surface.
- The compile service, scorer, and handful service require no schema changes — the existing `CommitmentVerdict.scenario`, `PlanScore.scenario`, and `CompiledWorld.scenario` fields already support multi-scenario labelling.
