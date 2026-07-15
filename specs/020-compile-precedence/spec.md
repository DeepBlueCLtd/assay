# Feature Specification: Compile-overlay precedence — excursions beat base (SPEC-20)

**Feature Branch**: TBD at pickup (spec authored on `claude/jipoe-c2-process-review-g4kwfn`; spec dir `020-compile-precedence`)

**Created**: 2026-07-15

**Status**: Draft — queued (fix-class; implementation gates on the research-note amendment below)

**Input**: JIPOE/C2 process review (`docs/reviews/2026-07-14-jipoe-c2-process-review.md` §3.6, addendum §10 slice S-B), originating from the admission in `docs/research/04-relaxation.md` §3: under R3m the causeway-demolition excursion override coincides with the base engineering estimate's region, innermost-wins keeps the base value, and **C5 ("Ledger causeway taken intact") scores satisfied in a world whose story says the causeway is down**. This is the one place the computed world and the canonical vignette narrative disagree — exactly the defect class the walkthrough's §0 rule exists to catch.

**Research Note**: amendment to `docs/research/02-compile.md` (DEC-11 gate — **to be authored before implementation**; decides the layered precedence rule below and its tie order)

**Register Decisions Restated**: DEC-29 (sparse channels: `default` + `RegionOverride[]`; lazy unstored materialisation), DEC-8 (scenario excursions are compile-time channel overrides per ScenarioCOA), DEC-15 (bands stay pure intervals through every layer), G1 (stamp determinism), G6 (propagation honesty)

**Register candidate** *(flagged, not asserted — to be recorded in `docs/assay-concept.md` §6 before build; this spec may not be cited as authority)*: compile-overlay **precedence semantics** — excursion-layer overrides take precedence over base-knowledge overrides on the same region; the full tie order is stated and deterministic.

## Honesty stance

A compiled world that contradicts its own scenario's story is a quiet lie downstream: every verdict scored against it inherits the contradiction, and the trace graph will happily attribute the wrong band to the right knowledge. The fix is semantic, not cosmetic — and it must be honest about its own blast radius: making C5 score `violated` under R3m changes the Stage-4 relaxation exhibit (see §Downstream consequences), which is a coverage-row matter (vignette §7), not a silent test update.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — The R3m world reflects the demolition (Priority: P1) 🎯 exit

A planner compiles the R3m excursion world. The causeway channel over the causeway region returns the demolition state, not the base engineering estimate — the excursion layer wins on the region it deliberately overrides.

**Why this priority**: This is the defect. Everything else in the slice is consequence management.

**Independent Test**: Compile BASE and R3m from the frozen fixtures; materialise the causeway-bearing channel at the causeway region for both; assert BASE returns the K2-derived band and R3m returns the demolition override.

**Acceptance Scenarios**:

1. **Given** the R3m excursion with its causeway-demolition override, **When** the world compiles and `channelAt` is read over the causeway region, **Then** the demolition band/state is returned, not the base K2-derived value.
2. **Given** the BASE world (no excursion), **When** the same read runs, **Then** the K2-derived value is returned unchanged — the fix alters excursion semantics only.
3. **Given** the layered rule, **When** two overrides within the *same* layer overlap in region and window, **Then** the existing documented tie order (later `from_step` wins) still applies within that layer.

---

### User Story 2 — C5 scores what the narrative says (Priority: P1)

Scoring any R3m-responsive plan against the corrected R3m world yields `violated` for C5 (`causeway_intact at_least 1`) — the causeway is down; a `prefer` that cannot hold scores as such.

**Why this priority**: The user-observable symptom. The walkthrough and vignette say R3m drops the causeway; the honest matrix must agree.

**Independent Test**: Score the SPEC-09 candidate set against the corrected R3m world; assert every candidate's C5 verdict is `violated`.

**Acceptance Scenarios**:

1. **Given** the corrected R3m world, **When** any plan is scored, **Then** C5's verdict is `violated` with a margin band consistent with the demolition state.
2. **Given** the BASE world, **When** the same plans are scored, **Then** C5 verdicts are unchanged from today (no regression outside the excursion).

---

### User Story 3 — The relaxation exhibit is updated honestly, not silently (Priority: P2)

Because `sacrificed` ≡ exactly the `violated` commitments (SPEC-09), C5 now joins every R3m candidate's sacrifice set. The Stage-4 exhibit's sacrifice sets change from {C4}, {C3}, {C2} to {C4,C5}, {C3,C5}, {C2,C5}; inclusion-minimality still holds (C5 is common to all, so relative minimality between candidates is preserved). This change is propagated to the affected canonical text (vignette §7 coverage row, walkthrough beat 4, gallery captions) in the same change — batch propagation, never a silent test edit.

**Why this priority**: G4's spirit at the documentation layer: the exhibit changed because the world got more honest; saying so is the point.

**Independent Test**: `/relax` over the corrected R3m world returns three inclusion-minimal candidates whose sacrifice sets are {C4,C5}, {C3,C5}, {C2,C5}, ranked least-worst-first with the must-sacrifice last; the same-tier C3/C4 tie-break is still stated.

**Acceptance Scenarios**:

1. **Given** the corrected world, **When** `/relax` runs, **Then** every returned candidate's `sacrificed` includes C5 and the candidate narratives mention the causeway state in command language.
2. **Given** the coverage matrix (vignette §7), **When** this slice lands, **Then** the affected rows are updated in the same change, with the register/propagation trail showing why.

---

### Edge Cases

- **An excursion override on a region the base never overrode**: behaves as today (it is the only override; layering changes nothing).
- **An excursion override with a time window** (`from_step`/`until_step`): the excursion wins only inside its window; outside it, base semantics resume — a demolition at step *n* leaves the causeway intact before *n*.
- **Two excursion-layer overrides overlapping**: within-layer tie order applies (later `from_step` wins), documented unchanged.
- **Stamp stability**: the stamp is over inputs (consumed refs, config, engine version); the precedence fix changes engine behaviour, so `engine_version` bumps — old stamps remain honest about what computed them (G1), and the comparability guard greys mixed-lineage artefacts as designed.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Channel materialisation MUST apply overrides in layered precedence: **excursion-layer overrides take precedence over base-knowledge-derived overrides** on the same region and step; the `default` band applies only where no override is active.
- **FR-002**: Within a layer, the existing documented tie order (later `from_step` wins) MUST be preserved unchanged.
- **FR-003**: The full precedence rule (layer order + within-layer tie order) MUST be stated in the research-note amendment and referenced from the code — a stated rule, never an emergent one.
- **FR-004**: The BASE world's materialisation MUST be byte-identical to today's for all channels (no regression outside excursion semantics); oracles O-1…O-4 remain reproducible.
- **FR-005**: `engine_version` MUST bump; recompiled worlds carry new stamps; the comparability guard behaviour (`stamp_mismatch`, greying) is exercised by test.
- **FR-006**: The Meridian exhibit MUST reproduce: R3m causeway reads return the demolition state; every R3m candidate's C5 verdict is `violated`; `/relax` sacrifice sets become {C4,C5}, {C3,C5}, {C2,C5} with ranking and tie-break rules unchanged.
- **FR-007**: All affected canonical text (vignette §7 coverage rows, walkthrough beat 4, gallery/demo captions citing the Stage-4 sacrifice sets) MUST be swept in the same change (batch propagation).
- **FR-008**: G6 MUST be re-asserted: widening any input band under the new precedence never narrows any output band (property-based test re-run).

### Key Entities

- No new types. Touches: `src/materialise.ts` (`channelAt` layering), `src/compile.ts` (override provenance so the materialiser knows an override's layer), `fixtures` untouched except where the excursion representation needs a layer tag.
- If a layer tag on `RegionOverride` is needed, that is a schema change and rides the register candidate above.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: R3m causeway-region reads return the demolition state; BASE reads unchanged.
- **SC-002**: Every R3m candidate scores C5 `violated`; BASE C5 verdicts unchanged.
- **SC-003**: `/relax` over corrected R3m returns three inclusion-minimal candidates with sacrifice sets {C4,C5}, {C3,C5}, {C2,C5}, least-worst-first, must-sacrifice last, tie-break stated.
- **SC-004**: O-1…O-4 reproduce exactly; G6 property tests pass; typecheck clean; no other verdict in the frozen tableau changes.
- **SC-005**: The coverage-matrix and walkthrough updates land in the same change with the register trail.

## Assumptions

- The excursion's overrides are identifiable as a distinct layer at compile time (they arrive via the ScenarioCOA excursion path, DEC-8); if the current representation discards that distinction, restoring it is in scope.
- The research-note amendment confirms no *other* excursion/base coincidence exists in the frozen tableau beyond the causeway case; if one does, it is listed and covered by the same tests.
- The relaxation machinery (SPEC-09) needs no change — the corrected sacrifice sets fall out of honest scoring.
