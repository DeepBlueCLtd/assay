# Research: Spine-Complete Gate Harness

**Date**: 2026-07-14 | **Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

## Scope

The delivery plan (line 63) exempts SPEC-15 from a research note: "Research note: none required." This document records the technical decisions for the harness structure, not doctrinal research.

## Decision 1: Single test file, shared rig

**Decision**: One test file (`tests/gate.test.ts`) with a `beforeAll` shared rig that runs the full pipeline once. Assertion groups share the pipeline state.

**Rationale**: The gate must verify invariants end-to-end on the same pipeline run — not on 12 separate pipeline runs. A shared rig ensures that G3 trace chains, G1 stamps, and G2 band assertions all examine the same artefacts. The `beforeAll` pattern (vs `beforeEach`) is deliberate: the pipeline is deterministic (G1), so re-running it per describe block wastes time without improving coverage.

**Alternatives considered**: (a) Multiple test files (one per invariant) — rejected because the integration point is the shared pipeline state; splitting would require either re-running the pipeline or sharing state across files. (b) Extending `tests/app-bootstrap.test.ts` — rejected because the gate is a formal barrier with its own scope, not an extension of the app-bootstrap tests.

## Decision 2: G2 structural walk

**Decision**: Walk every `Band` and `VerdictBand` in every seam response structurally (recursive property inspection) rather than spot-checking known fields.

**Rationale**: Spot-checking is brittle to schema evolution — a new field added in a future stage could carry a bare scalar and evade the gate. A structural walk over the response objects catches any assessed value that lacks `{lo, hi}` structure.

**Alternatives considered**: Spot-checking known fields — rejected because it would need maintenance on every schema change and does not protect against regressions.

## Decision 3: Oracle re-assertion at integration level

**Decision**: Re-assert O-1 through O-4 through the full integrated pipeline, not just via the `marginBand`/`verdictFor` functions. The hand-computed constants are the same values used in `tests/oracle.test.ts`.

**Rationale**: The existing oracle test exercises the scorer functions in isolation. The gate must confirm that the integrated pipeline (knowledge → compile → score) produces the same values — i.e., that the pipeline's wiring does not distort the scorer's output.

**Alternatives considered**: Relying on the existing `tests/oracle.test.ts` alone — rejected because the gate's purpose is integration-level confirmation, not unit-level.

## Decision 4: Thesis walkability via existing service results

**Decision**: Each thesis is walked by asserting properties of the results already produced by the shared rig's pipeline run. No additional pipeline runs are needed for theses A–F (the rig already runs compile, score, handful, relax, robustness, sensitivity, discrimination, staleness).

**Rationale**: The theses are defined as exit criteria for the stages that are already built. The gate confirms they hold at integration level, not that they can be set up — the rig's pipeline run IS the integration walk.
