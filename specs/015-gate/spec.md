# Feature Specification: Spine-Complete Gate Harness

**Feature Directory**: `specs/015-gate`

**Created**: 2026-07-14

**Status**: Draft

**Input**: SPEC-15 — Spine-complete gate harness; the single barrier before Stage 7.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Full Pipeline Gate Assertion (Priority: P1)

A developer merging the final Stage-6 work runs the gate harness and receives a single pass/fail verdict confirming that the entire Meridian pipeline — knowledge capture through analysis — holds all six cross-cutting invariants (G1–G6) end-to-end.

**Why this priority**: The gate is the go/no-go for Stage 7; if the harness does not confirm invariant-level health across the full pipeline, nothing downstream can be trusted.

**Independent Test**: Run `npm test` — the gate harness test file executes the complete pipeline on Meridian fixtures and asserts every invariant. A single failure blocks the gate.

**Acceptance Scenarios**:

1. **Given** the Meridian fixtures (K1–K14, C1–C6, P1–P2, R1–R3m) are loaded and the pipeline runs end-to-end (knowledge → compile → score → handful → relax → robustness → sensitivity → discrimination → staleness), **When** the gate harness executes, **Then** every G1–G6 invariant assertion passes.
2. **Given** the pipeline has run, **When** the harness checks G5 (contested never compiles), **Then** compiling with K12 contested returns a `contested_knowledge` refusal naming K12a and K12b, and no CompiledWorld contains contested knowledge.
3. **Given** the pipeline has run, **When** the harness checks G2 (no bare assessed scalars), **Then** every assessed/reported/assumption value in every seam response is a `Band {lo, hi}` with provenance, and every verdict is on the four-stop scale only.

---

### User Story 2 - Oracle Case Re-Assertion (Priority: P1)

A developer confirms that the four hand-computed oracle cases (O-1 through O-4 from vignette §9) still hold when exercised through the full integrated pipeline, not just in the unit-level oracle test.

**Why this priority**: The oracle cases are the binding correctness contract for the scorer and propagation honesty (G6). They must hold at integration level, not just in isolation (DEC-25).

**Independent Test**: The gate harness re-runs O-1 (interval sum `[9,13]`), O-2 (robust verdict, margin `[15,19]`), O-3 (four-stop sweep changes only at band edges 9/13), and O-4 (propagation honesty under widening) through the integrated pipeline and compares against the hand-computed constants.

**Acceptance Scenarios**:

1. **Given** the Meridian knowledge and plans are loaded through the full pipeline, **When** the harness evaluates O-1, **Then** the interval sum for the designated metric equals `[9, 13]` exactly.
2. **Given** the same pipeline state, **When** the harness evaluates O-2, **Then** the verdict is `robust` with margin band `[15, 19]`.
3. **Given** the same pipeline state, **When** the harness evaluates O-3, **Then** the four-stop verdict transitions occur exactly at the band edges 9 and 13 — no interior cuts.
4. **Given** the same pipeline state, **When** the harness evaluates O-4, **Then** widening any input band never narrows any output band (propagation honesty verified by property-based testing via fast-check).

---

### User Story 3 - Thesis Walkability Confirmation (Priority: P1)

A developer confirms that all six coverage-matrix theses (A–F) are demonstrably walkable on the Meridian fixture data through the integrated pipeline.

**Why this priority**: The build plan requires that all six theses are walkable before Stage 7 begins. Each thesis exercises a distinct analytical capability; missing any one means the spine is incomplete.

**Independent Test**: The gate harness walks each thesis against Meridian and asserts its exit criterion from the vignette coverage matrix (§7).

**Acceptance Scenarios**:

1. **Given** the pipeline has compiled the Meridian world, **When** thesis A (Pipeline) is walked, **Then** every channel traces backward to named KnowledgeObjects via `compiled_into` edges.
2. **Given** the relaxation service has run over R3m, **When** thesis B (Least-worst) is walked, **Then** three inclusion-minimal candidates are returned, sacrificing C4, C3, and C2 respectively, each with non-empty `sacrificed` and command-language narrative (G4).
3. **Given** the robustness service has scored P1 and P2 across scenarios, **When** thesis C (Robustness) is walked, **Then** P1 C1/C2 verdicts are `robust` under BASE but `violated` under R2 (visible collapse), and P2 holds C4 `robust` across scenarios where P1 does not.
4. **Given** the discrimination service has analysed open questions, **When** thesis D (Collection) is walked, **Then** K11 ranks above K13 on discrimination despite higher cost.
5. **Given** the sensitivity service has analysed consumed knowledge, **When** thesis E (Sensitivity) is walked, **Then** K8 tops the sensitivity ranking with `single_source: true`.
6. **Given** the staleness service has walked from K5, **When** thesis F (Staleness) is walked, **Then** exactly the K5-dependent verdicts are flagged and nothing else.

---

### User Story 4 - Content-Addressing and Stamp Determinism (Priority: P2)

A developer confirms that the content-addressing and stamp-determinism properties (G1) hold across the entire pipeline, not just within individual services.

**Why this priority**: Stamp determinism is the foundation for the comparability guard and the "same stamp ⇒ identical result" contract. If it fails at integration level the gate cannot pass.

**Independent Test**: Run the full pipeline twice with identical inputs and assert byte-identical stamps and results. Then change one input and assert the stamp changes.

**Acceptance Scenarios**:

1. **Given** the full pipeline runs twice with the same Meridian inputs, seed, and engine version, **When** the results are compared, **Then** every stamp across compile/score/handful/relax is byte-identical.
2. **Given** the pipeline runs once and produces a stamp, **When** a single knowledge band is widened and the pipeline re-runs, **Then** the compile stamp changes (inputs changed), and the downstream stamps update accordingly.
3. **Given** any computed object is stored, **When** it is retrieved, **Then** its content hash matches the key it was stored under (content-addressing invariant).

---

### Edge Cases

- What happens when the harness detects a G5 violation (contested knowledge reaching a CompiledWorld)? The test must fail with a clear diagnostic naming the contested object and the world it leaked into.
- What happens when stamp determinism breaks (same inputs, different stamps)? The test must fail with both stamps displayed for debugging.
- What happens when a trace chain dead-ends (G3 violation)? The test must flag the specific artefact whose backward trace is incomplete.
- What happens when an oracle case drifts (O-1–O-4)? The test must show the expected hand-computed value and the actual value side by side.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The gate harness MUST run the complete Meridian pipeline end-to-end: `KnowledgeService.create` → `CompileService.compile` → `ScoreService.score` → `HandfulService.handful` → `RelaxService.relax` → `RobustnessService.robustness` → `SensitivityService.analyse` → `DiscriminationService.analyse` → `StalenessService.analyse` (ASSAY-DEC-4, DEC-5, DEC-10).
- **FR-002**: The gate harness MUST assert invariant G1 (determinism): identical stamp and engine version yield byte-identical results; content-addressed objects immutable; all randomness from explicit seeds (seam contract §G, ASSAY-DEC-5, DEC-6).
- **FR-003**: The gate harness MUST assert invariant G2 (no bare assessed scalars): every value from a reported/assessed/assumption source in every seam response is a `Band {lo, hi}` with provenance; every verdict uses the four-stop scale only (ASSAY-DEC-9).
- **FR-004**: The gate harness MUST assert invariant G3 (complete trace chains): every computed artefact is backward-traceable, transitively, to named KnowledgeObjects with named owners; no dead-ends (ASSAY-DEC-5, DEC-6).
- **FR-005**: The gate harness MUST assert invariant G4 (least-worst, never silence): the relaxation report is non-empty; every candidate names `sacrificed` commitments; tie-breaks are stated (ASSAY-DEC-5).
- **FR-006**: The gate harness MUST assert invariant G5 (contested never compiles): knowledge with `status = contested` never reaches any CompiledWorld; compile refuses with `contested_knowledge` naming the contested pair (ASSAY-DEC-5, DEC-6).
- **FR-007**: The gate harness MUST assert invariant G6 (propagation honesty): widening any input band never narrows any output band; the oracle cases O-1 through O-4 from vignette §9 hold (ASSAY-DEC-25).
- **FR-008**: The gate harness MUST re-assert oracle cases O-1 (`[9,13]`), O-2 (robust, margin `[15,19]`), O-3 (four-stop transitions at band edges only), and O-4 (containment under widening) through the integrated pipeline — matching the hand-computed constants exactly. These values are never regenerated from implementation output.
- **FR-009**: The gate harness MUST confirm thesis A (Pipeline): every compiled channel traces backward to named KnowledgeObjects.
- **FR-010**: The gate harness MUST confirm thesis B (Least-worst): three inclusion-minimal candidates under R3m, sacrificing C4, C3, C2 respectively.
- **FR-011**: The gate harness MUST confirm thesis C (Robustness): P1 verdicts collapse under R2; P2 trades differently.
- **FR-012**: The gate harness MUST confirm thesis D (Collection): K11 ranks above K13 on discrimination.
- **FR-013**: The gate harness MUST confirm thesis E (Sensitivity): K8 tops the sensitivity ranking with `single_source: true`.
- **FR-014**: The gate harness MUST confirm thesis F (Staleness): exactly the K5-dependent verdicts flag.
- **FR-015**: The gate harness MUST produce no new runtime code — it is a test-only artefact. No schema change, no new seam types, no new components.
- **FR-016**: The gate harness MUST use the existing Meridian fixtures (`fixtures/knowledge.json`, `fixtures/commitments.json`, `fixtures/plans.json`, `fixtures/coas.json`, `fixtures/vignette-config.json`, `fixtures/force-elements.json`) as its sole data source (ASSAY-DEC-8).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Running `npm test` executes the gate harness and all assertions pass — zero failures across G1–G6, O-1–O-4, and theses A–F.
- **SC-002**: The gate harness runs the full pipeline exactly once for the base case (not once per invariant), re-using the pipeline state across assertion groups for efficiency.
- **SC-003**: Every invariant violation produces a diagnostic message identifying the specific artefact, invariant, expected value, and actual value — no opaque failures.
- **SC-004**: The harness completes within the existing test-suite time budget (under 30 seconds total).
- **SC-005**: No new register decision is required — the gate harness asserts existing decided invariants and theses only.

## Assumptions

- All upstream specifications (SPEC-05 through SPEC-13) are implemented and their individual test suites pass. The gate harness is additive integration verification, not a substitute for per-service tests.
- The Meridian fixtures are complete and stable — they will not change during gate harness development.
- The oracle case expected values (O-1 through O-4) are the hand-computed constants already used in `tests/oracle.test.ts`; the gate harness re-asserts them at integration level.
- No research note is required for SPEC-15 (delivery plan line 63 — the gate is a test harness, not a new capability).
- The test harness runs in-process (Node/vitest) against the same in-memory stores used by all existing tests — no browser or server required.
