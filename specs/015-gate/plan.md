# Implementation Plan: Spine-Complete Gate Harness

**Branch**: `claude/spine-complete-gate-harness-giq5c1` | **Date**: 2026-07-14 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/015-gate/spec.md`

## Summary

SPEC-15 is a single integration test file (`tests/gate.test.ts`) that runs the complete Meridian pipeline end-to-end — from knowledge capture through all six analysis services — and asserts every cross-cutting invariant (G1–G6), the four oracle cases (O-1–O-4), and the six coverage-matrix theses (A–F). No new runtime code, no schema change, no new seam types. The pipeline runs once for the shared rig; assertion groups re-use the pipeline state.

## Technical Context

**Language/Version**: TypeScript (strict), matching existing `tsconfig.json`

**Primary Dependencies**: vitest (test runner), fast-check (property-based testing for O-4/G6), existing ASSAY services (KnowledgeService, CompileService, ScoreService, HandfulService, RelaxService, RobustnessService, SensitivityService, DiscriminationService, StalenessService)

**Storage**: In-memory ObjectStore and TraceStore (same as all existing tests)

**Testing**: vitest — the gate harness IS the test artefact

**Target Platform**: Node.js (vitest in-process)

**Project Type**: Test harness (test-only artefact, no runtime code)

**Performance Goals**: Completes within 30 seconds as part of `npm test`

**Constraints**: Offline, deterministic, no browser or server required

**Scale/Scope**: One test file, one vignette (Meridian), six fixtures

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I — Seam Contract Is the Invariant
**PASS.** The gate harness exercises services through their public seam interfaces. It creates no private back-doors, no alternate compute paths. Every assertion targets the seam's documented shapes and invariants.

### Principle II — Banded Honesty (NON-NEGOTIABLE)
**PASS.** FR-003 explicitly asserts G2 end-to-end: no bare assessed scalar crosses the seam. The harness verifies bands on every assessed value in every response and verifies verdicts are four-stop only.

### Principle III — Traceability Terminates in Named Knowledge
**PASS.** FR-004 asserts G3: every computed artefact backward-traces to named KnowledgeObjects with named owners; dead-ends are failures.

### Principle IV — Determinism and Content Addressing
**PASS.** FR-002 asserts G1: run-twice-compare for byte-identical stamps; content-hash verification on every stored object.

### Principle V — Research Before Implementation
**PASS.** The delivery plan (line 63) explicitly exempts SPEC-15 from a research note: "Research note: none required." The gate is a test harness, not a new capability.

### Principle VI — Register Supremacy
**PASS.** Every invariant asserted (G1–G6) and every oracle case (O-1–O-4) traces to register entries (DEC-4 through DEC-25). No new decisions are introduced.

### Invariant G1 (Determinism)
**ASSERTED** by the harness (FR-002): identical inputs → identical stamps; content-addressing verified.

### Invariant G2 (No bare assessed scalars)
**ASSERTED** by the harness (FR-003): structural walk of every seam response.

### Invariant G3 (Complete trace chains)
**ASSERTED** by the harness (FR-004): backward trace from every computed artefact.

### Invariant G4 (Least-worst, never silence)
**ASSERTED** by the harness (FR-005): relaxation report non-empty, `sacrificed` populated, tie-breaks stated.

### Invariant G5 (Contested never compiles)
**ASSERTED** by the harness (FR-006): compile refuses with `contested_knowledge` when K12 is contested.

### Invariant G6 (Propagation honesty)
**ASSERTED** by the harness (FR-007/FR-008): oracle cases O-1–O-4 re-asserted at integration level.

**No violations. No complexity justifications required.**

## Project Structure

### Documentation (this feature)

```text
specs/015-gate/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output (minimal — no research note required)
├── data-model.md        # Phase 1 output (no new data model)
├── quickstart.md        # Phase 1 output (validation guide)
├── checklists/
│   └── requirements.md  # Quality checklist
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code (repository root)

```text
tests/
└── gate.test.ts         # The gate harness — single new file
```

**Structure Decision**: One new test file in the existing `tests/` directory. No new source files, no new directories. The gate harness follows the established test-rig pattern (fixture loading → service instantiation → pipeline execution → assertion groups).

## Test File Architecture

The gate harness (`tests/gate.test.ts`) is structured as:

1. **Shared rig setup** (`beforeAll`): Load all six Meridian fixture files, instantiate every service (KnowledgeService → CompileService → ScoreService → HandfulService → RelaxService → RobustnessService → SensitivityService → DiscriminationService → StalenessService), run the full pipeline once, capture all results. This follows the existing rig pattern in `tests/robustness.test.ts` but extends it to every service.

2. **Assertion groups** (one `describe` block per concern):
   - `G1 — Determinism`: re-run pipeline with same inputs, assert byte-identical stamps; verify content hashes.
   - `G2 — No bare assessed scalars`: structural walk of compile/score/handful/relax/robustness results; assert every assessed value is `{lo, hi}` with provenance; assert every verdict is one of the four-stop values.
   - `G3 — Complete trace chains`: backward walk from every compiled world, every score, every relaxation candidate; assert chain terminates in named KnowledgeObjects.
   - `G4 — Least-worst, never silence`: assert relaxation report is non-empty; every candidate has non-empty `sacrificed`; tie-break text present.
   - `G5 — Contested never compiles`: re-contest K12, assert compile refuses with `contested_knowledge`.
   - `G6 — Propagation honesty / Oracles`: re-assert O-1 through O-4 using the integrated pipeline's interval arithmetic; re-run O-4 property-based tests through the full pipeline.
   - `Thesis A — Pipeline`: assert `compiled_into` edges from every channel back to knowledge.
   - `Thesis B — Least-worst`: assert three inclusion-minimal candidates sacrificing C4, C3, C2.
   - `Thesis C — Robustness`: assert P1 collapse under R2; P2 survives.
   - `Thesis D — Collection`: assert K11 ranks above K13 on discrimination.
   - `Thesis E — Sensitivity`: assert K8 tops ranking with `single_source: true`.
   - `Thesis F — Staleness`: assert exactly K5-dependent verdicts flagged.

3. **Determinism leg** (separate `describe`): run pipeline twice, compare all stamps.
