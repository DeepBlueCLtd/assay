# Feature Specification: Analysis — Sensitivity

**Feature Branch**: `claude/next-spec-oh2baf`

**Created**: 2026-07-14

**Status**: Draft

**Input**: SPEC-11: Analysis — sensitivity. Band-edge perturbation loop over the scorer (DEC-10); single-source flag co-display. Research note: `docs/research/08-analysis.md` §1–2.

**Research Note**: `docs/research/08-analysis.md` §1–2 (DEC-11 gate satisfied)

**Register Decisions Restated**: DEC-4 (honestly real), DEC-9 (banded honesty), DEC-10 (scorer as reusable unit — sensitivity is a re-scoring loop), DEC-14 (observed vs assessed), DEC-15 (no midpoint, no distributional claim — rules out Monte Carlo/Sobol)

## User Scenarios & Testing *(mandatory)*

### User Story 1 — View which knowledge items most endanger the plan (Priority: P1)

A planner has scored a handful against the current world. They want to know: "if any single assessment is wrong, which one changes the plan's verdicts?" The sensitivity ranking answers this by perturbing each answered K at its band edges and measuring verdict movement.

**Why this priority**: This is the core of thesis E — without the ranking, the planner cannot know which assessments are load-bearing. K8's single-source exposure is invisible.

**Independent Test**: Score P2 against the BASE world; run sensitivity; verify K8 tops the ranking with the highest changed_count.

**Acceptance Scenarios**:

1. **Given** a scored plan P2 against the BASE Meridian world, **When** sensitivity analysis runs, **Then** a ranking of knowledge items is returned, sorted by the number of commitment verdicts that change under band-edge perturbation.
2. **Given** K8 (battery fire-control radar, single-source), **When** perturbed to "operational" (the worst-case edge), **Then** at least one commitment verdict (C4, threat exposure) changes — K8's changed_count is ≥ 1.
3. **Given** K1 (charted depths, observed/high), **When** perturbed at its band edges, **Then** no commitment verdicts change — K1's changed_count is 0 (charted fact, unbanded, insensitive).

---

### User Story 2 — See the single-source flag on the sensitivity ranking (Priority: P1)

The J-2 views the S1 "Verify next" queue and sees K8 at the top with a `single_source` badge. The badge says "one intercepted maintenance return" — the deception-exposure warning compounds the sensitivity warning.

**Why this priority**: The single-source flag is the thesis-E exit criterion. Without it, the ranking is useful but the deception doctrine (JP 2-01.3 ch. IV) is not exercised.

**Independent Test**: Confirm K8's `single_source: true` renders as a badge/flag alongside its ranking position; confirm no other K in Meridian carries the flag.

**Acceptance Scenarios**:

1. **Given** K8 at the top of the sensitivity ranking, **When** rendered on S1, **Then** a `single_source` badge is visible alongside the ranking position.
2. **Given** K3 (NGO census, `single_source: false`) in the ranking, **When** rendered, **Then** no single-source badge appears.

---

### User Story 3 — Sensitivity refreshes on recompile (Priority: P2)

After the planner recompiles with K9 (superseding K5), the sensitivity ranking updates against the new world and new scores. K items that were previously insensitive may now be sensitive (or vice versa) because the world has changed.

**Why this priority**: The ranking must reflect the current state, not a stale snapshot. Lower priority because it is a refresh mechanic, not the initial ranking.

**Independent Test**: Run sensitivity against W1, then against W2 (post-K9 recompile), and verify the ranking changes reflect the new world.

**Acceptance Scenarios**:

1. **Given** a recompiled world W2 consuming K9 instead of K5, **When** sensitivity runs against W2, **Then** K5 no longer appears in the ranking (it was not consumed) and K9 does.
2. **Given** the updated ranking, **When** K8 is still consumed and its perturbation still changes verdicts, **Then** K8 remains at the top.

---

### Edge Cases

- What happens when an answered K has a degenerate band (`lo === hi`, e.g. charted depths)? Perturbation at the edges produces the same world — no verdict changes. The K appears at the bottom of the ranking with `changed_count: 0`. This is correct: a fact with no uncertainty is not sensitive.
- What happens when a K's perturbation produces a severed route (mobility → 0)? The scorer already returns `violated` for severed routes. The perturbation correctly registers a verdict change from the baseline.
- What happens when no perturbation changes any verdict? The ranking is returned with all `changed_count: 0`. This is an honest outcome: the plan is robust to all individual knowledge uncertainties.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST score the selected plan against the current world at baseline (no overrides) to establish `V₀`, the baseline verdict vector.
- **FR-002**: For each answered K consumed by the world, the system MUST re-score with `knowledge_overrides` substituting the K's answer at both band edges (lo and hi of the confidence-derived range). This produces two perturbed verdict vectors per K.
- **FR-003**: The system MUST count the number of commitments whose verdict changes between baseline and the worst-case perturbation for each K. This is `changed_count`.
- **FR-004**: The system MUST rank knowledge items by `changed_count` descending, breaking ties by worst-case margin proximity (smallest absolute margin at the perturbed edge).
- **FR-005**: The system MUST carry the `single_source` flag from the KnowledgeObject's provenance through to the ranking output. The flag MUST NOT influence the ranking arithmetic.
- **FR-006**: The system MUST NOT use Monte Carlo sampling, Sobol indices, or gradient-based sensitivity methods (DEC-15: no distributional assumptions; G1: determinism).
- **FR-007**: The system MUST refuse with `unknown_ref` if the plan or world reference cannot be resolved, following the established refusal pattern.
- **FR-008**: The system MUST produce a deterministic stamp over its inputs (plan ref, world ref, scenario, engine version).
- **FR-009**: The system MUST reproduce the thesis-E exit on the Meridian fixtures: K8 tops the ranking with `changed_count ≥ 1` and `single_source: true`.

### Key Entities

- **SensitivityRequest**: `{ plan: Ref, world: Ref, scenario: string, engine_version: string }` — movement type in `seam.ts`.
- **SensitivityRanking**: `{ knowledge: Ref, baseline_verdicts: VerdictBand[], perturbed_verdicts: VerdictBand[], changed_count: number, single_source: boolean }` — one entry per consumed K.
- **SensitivitySuccess**: `{ ranking: SensitivityRanking[], stamp: string }` — the success response.
- **SensitivityResult**: `SensitivitySuccess | Refusal` — follows the established pattern.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: K8 tops the sensitivity ranking for plan P2 against the BASE Meridian world, with `changed_count ≥ 1` and `single_source: true`.
- **SC-002**: K1 (observed, charted) has `changed_count: 0` — facts are not sensitive.
- **SC-003**: The ranking is deterministic: same inputs produce the same ranking, same stamp (G1).
- **SC-004**: No distributional assumption, no Monte Carlo, no Sobol indices appear in the implementation.
- **SC-005**: All existing tests pass; typecheck clean; no regression in SPEC-07 oracle cases or prior specs.

## Assumptions

- The perturbation range for each K is its answer band's `lo` and `hi` values. For the v1 sensitivity loop, this is sufficient; wider perturbation ranges (e.g. confidence-band-scaled) are deferred.
- K items that are not consumed by the world (e.g. open questions, retired K10) do not appear in the ranking — they have no channel path to perturb.
- The sensitivity analysis runs per-plan, not per-handful. If sensitivity for the whole handful is desired, the caller runs it per-plan (scorer-in-a-loop, same as robustness).
- No schema changes are needed — the movement types are seam types in `seam.ts`, not LinkML stored objects.
