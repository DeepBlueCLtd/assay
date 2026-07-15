# Feature Specification: JIPOE anchoring — knowledge names its doctrinal origin (SPEC-21)

**Feature Branch**: `claude/dreamy-thompson-uzjutp` (spec authored on `claude/jipoe-c2-process-review-g4kwfn`; spec dir `021-jipoe-anchoring`)

**Created**: 2026-07-15

**Status**: Implemented 2026-07-15 (research-note amendment authored first — DEC-11 gate honoured; plan.md/tasks.md alongside)

**Input**: JIPOE/C2 process review (`docs/reviews/2026-07-14-jipoe-c2-process-review.md` §4.1, action A7, addendum §10 slice S-A). `docs/research/01-knowledge.md` §3 already audits K1–K14 against the four JIPOE steps and states the discipline gap in its own words: each object *should name its originating JIPOE step, making the claim auditable rather than asserted*. Issue #43 (forward derivation) repeats the demand — step annotation is the first concrete move of the forward-derivation programme. This slice closes that gap.

**Research Note**: amendment to `docs/research/01-knowledge.md` (DEC-11 gate — **to be authored before implementation**; fixes the step vocabulary, the per-object assignments for K1–K14 from the existing §3 audit, and the lint severity)

**Register Decisions Restated**: DEC-6 (the knowledge object is the central new type), DEC-11 (doctrinal claims trace to a research note), DEC-14 (source-class semantics untouched), DEC-21 (schema change ⇒ new content hashes via regen, never mutation)

**Register candidate** *(flagged, not asserted — to be recorded in `docs/assay-concept.md` §6 before build)*: a **`jipoe_step` slot on `KnowledgeObject`** (LinkML enum; schema change; touches DEC-6). Companion comms artefacts (the doctrinal crosswalk page and the divergence register from review §4.1/§4.4) ship alongside under the DEC-30 comms category — they are not features of this spec.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Every Meridian knowledge object names its JIPOE step (Priority: P1) 🎯 exit

A reviewer opens any K-object and sees which of the four JIPOE steps it originates from (define the OE / describe environmental effects / evaluate the adversary / determine adversary COAs). The assignments come from the note-01 §3 audit, now machine-carried instead of prose-asserted.

**Why this priority**: This is the whole slice — "doctrinally shaped, not invented conveniences" becomes checkable the same way every value is traceable to an owner.

**Independent Test**: Load the fixtures; assert every K1–K14 carries a `jipoe_step` and that the assignments match the note-01 §3 audit (e.g. K1 depths → step 2; K4 garrison posture → step 3; K11/K13 indicators and K14 likelihoods → step 4).

**Acceptance Scenarios**:

1. **Given** the regenerated schema and updated fixtures, **When** the fixture-validation suite runs, **Then** every vignette KnowledgeObject carries a valid `jipoe_step` and the suite pins the exact per-object assignments as an oracle-style table (a change is a register/coverage matter, not a casual edit).
2. **Given** K14a–c (`scenario_weight`), **Then** they carry step 4 — likelihood judgements about adversary COAs are step-4 products, and the annotation makes the firewall exhibit's doctrinal home explicit.
3. **Given** retired K10, **Then** it too carries its step — retirement does not erase origin.

---

### User Story 2 — The provenance surface renders the step (Priority: P2)

The provenance chip (or its expansion) and the component legend show the JIPOE step alongside `source_class · confidence`, so the doctrinal origin is visible wherever provenance is visible.

**Why this priority**: An annotation nobody sees changes nothing; the chip is where provenance already lives.

**Independent Test**: Render the S1 table for K8; assert the chip/expansion includes its step; assert the legend (`src/components/legends.ts`) documents the new element.

**Acceptance Scenarios**:

1. **Given** a knowledge row on S1, **When** the provenance chip is inspected, **Then** the JIPOE step renders in words (not a bare number), consistently across all surfaces that show the chip.
2. **Given** the pure-component discipline (SPEC-14), **When** the chip change lands, **Then** the component remains types-in/HTML-out with no app-state coupling.

---

### User Story 3 — A missing step warns at write (Priority: P3)

Creating a KnowledgeObject without a `jipoe_step` produces a warning-level lint (mirroring the confidence-width lint from note 01) — soft in v1, pending SME calibration, never a refusal.

**Why this priority**: The forward-derivation world (issue #43) needs the discipline at write time; the demonstrator needs only the warning.

**Independent Test**: POST a step-less knowledge object; assert the write succeeds with a lint warning naming the missing slot; assert `observed` objects get no exemption (unlike the width lint — origin applies to facts too).

**Acceptance Scenarios**:

1. **Given** a step-less write, **When** it lands, **Then** the response carries the warning and the delta records it; nothing is refused.
2. **Given** the lint, **Then** its severity and rationale are stated in the research-note amendment, not hard-coded folklore.

---

### Edge Cases

- **An object that plausibly spans steps** (e.g. terrain that is both step-2 effect and step-4 COA input): the slot records the *originating* step (where the question was raised), singular by design; the note amendment states this rule and the trace graph carries usage, not the slot.
- **Future non-Meridian fixtures**: the lint (not the fixture suite) is the guard; the oracle table binds Meridian only.
- **Schema regen**: `npm run gen` regenerates types; content hashes change for re-authored fixture objects — fixture identity is vignette-controlled, and the fixture-validation suite is updated in the same change (batch discipline).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The LinkML schema MUST gain a `JipoeStep` enum (`step1_define_oe | step2_describe_effects | step3_evaluate_adversary | step4_determine_adversary_coas`) and an optional `jipoe_step` slot on `KnowledgeObject`; types regenerate via `npm run gen` (generated files never hand-edited).
- **FR-002**: All Meridian fixture KnowledgeObjects (K1–K14, including K10 and K14a–c) MUST carry assignments taken from the note-01 §3 audit, pinned by a fixture test.
- **FR-003**: The provenance chip/expansion and the per-component legend MUST render the step in words wherever provenance renders; components stay pure (SPEC-14).
- **FR-004**: A warning-level lint MUST fire on knowledge writes lacking `jipoe_step`; it MUST NOT refuse; severity and rationale live in the research-note amendment.
- **FR-005**: No banded/scalar semantics change anywhere — the slot is doctrinal metadata; G2/G6 surfaces are untouched by construction.
- **FR-006**: The step vocabulary MUST cite JP 2-01.3's four steps verbatim in the schema description (doctrinal claims trace to sources, DEC-11).

### Key Entities

- **JipoeStep** (new enum, LinkML → generated TS).
- **KnowledgeObject.jipoe_step** (new optional slot; warning-linted).
- Touches: `schema/`, `src/generated/` (regen), `fixtures/`, `src/lint.ts`, `src/components/{provenanceChip,legends}.ts`, fixture-validation tests.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every Meridian K carries a step; the pinned assignment table matches note-01 §3; the suite fails on any drift.
- **SC-002**: The chip renders the step on every provenance-bearing surface; legends updated.
- **SC-003**: Step-less writes warn (never refuse); the warning is visible in the write response and delta.
- **SC-004**: `npm run gen` + `npm run typecheck` + `npm test` clean; no oracle, verdict, or coverage-row change.
- **SC-005**: The note-01 amendment exists before any code, with the step-assignment table and lint rationale.

## Assumptions

- The note-01 §3 audit's step mapping is complete enough to assign all fourteen objects; where it is ambiguous, the amendment resolves it (that resolution is the research work).
- Content-hash churn from fixture re-authoring is acceptable under DEC-21 (supersession-as-regeneration in fixture space, coordinated in one change).
- The companion comms artefacts (crosswalk page, divergence register) are authored under DEC-30 alongside this slice but reviewed separately.
