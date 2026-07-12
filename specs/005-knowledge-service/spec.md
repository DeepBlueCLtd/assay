# Feature Specification: Knowledge service & encoding discipline (SPEC-05)

**Feature Branch**: `claude/specs-review-3yxirx` (spec dir `005-knowledge-service`)

**Created**: 2026-07-12

**Status**: Draft

**Stage**: Build-plan Stage 1 · **Depends on**: SPEC-01 (store), SPEC-02 (trace store), D3 (seam contract) · **Research note**: `docs/research/01-knowledge.md` (DEC-11 gate — present)

**Input**: Knowledge service (`/knowledge`: create, supersede, contest, resolve, exposure) with encoding-discipline enforcement at write time, the band pill + provenance chip components, and a minimal S1 knowledge table — the Stage-1 slice that makes ASSAY's central premise (assessment made honest, judgement never laundered) observable for the first time.

## User Scenarios & Testing *(mandatory)*

The demonstrator's thesis A (an honest JIPOE pipeline) begins here: the point at which a JIPOE answer enters the system, and where the system first *refuses* dishonest encoding. Every scenario below is a Stage-1 exit criterion (build plan §Stage 1) played on the Meridian fixtures (vignette §5), and every value shown to a user is banded with provenance (constitution II / G2).

### User Story 1 — The system declines laundered judgement (Priority: P1)

A J-2 analyst tries to save an assumption as though it were a hard constraint — émigré political chatter, taken up as an analyst supposition that the garrison *will* capitulate by D+5 (K10), claimed as a `hard_constraint`. An `assumption` may never be a hard constraint and no waiver can license one (knowledge model §9). The system refuses the save at the moment it is attempted, names exactly what is wrong, and stores nothing. This is the demonstrator's signature moment: **"the system declines laundered judgement."**

**Why this priority**: This is the Stage-1 demo moment (DEC-23) and the first observable proof of the whole thesis — that honest encoding is enforced, not requested. Without it the remaining stories are bookkeeping; with it, the refusal *is* the product. It is also independently the smallest viable slice: a knowledge write path that can refuse.

**Independent Test**: Attempt to create K10 as authored in the vignette; confirm the write is refused with reason `encoding_violation`, the offending reference names K10, a one-sentence render-ready explanation is returned, and no object and no trace edge is persisted. Retire the withdrawn attempt and confirm it never reaches downstream consumers.

**Acceptance Scenarios**:

1. **Given** an `assumption` (`source_class = assumption`) claiming `hard_constraint`, **When** a J-2 analyst attempts to save it, **Then** the write is refused with `encoding_violation` — an assumption may never be a hard constraint and no waiver can license one — the offending ref is K10, and nothing is stored (DEC-14, DEC-6, knowledge model §9; G2 upstream defence).
2. **Given** the same refusal, **When** it renders on the minimal S1 table, **Then** a refusal banner appears where the save was attempted, carrying the reason, offending ref, and explanation (ui-design §3.4.1) — not a silent failure and not a degraded save.
3. **Given** a `scenario_weight` object (K14a–c, the COA likelihoods), **When** any path attempts to encode it as a constraint or cost, **Then** it is firewalled — it may be stored and shown as attention-ordering weight but never as a compilable constraint (knowledge model §9; DEC-6).
4. **Given** a `reported` or `assessed` value claiming `hard_constraint` **with** a recorded waiver, **When** it is saved, **Then** it is accepted (the licensed path — see Story 2), distinguishing a refused encoding from a waived one.

---

### User Story 2 — A licensed exception is recorded and visible (Priority: P2)

The north approach depends on the Carrick Head battery's fire-control radar being non-operational (K8) — an assessment, from a *single* intercepted maintenance return, that J-3 has chosen to treat as a hard constraint under an explicit waiver (W-1). The system accepts this only because the waiver is recorded, and thereafter shows — everywhere the value appears — that it is an assessment, that it rests on a single source, and that a named waiver licenses its use as a constraint.

**Why this priority**: Waivers are how honest systems permit necessary exceptions without hiding them; K8 is the load-bearing, deceivable assessment (thesis E) and the audit trail SMEs will interrogate ("would you trust the waiver trail?", comms §12). It is second only to the refusal because it proves the discipline bends *visibly*, not silently.

**Independent Test**: Save K8 as a waived `hard_constraint`; confirm it is accepted, the waiver W-1 (author, scope, rationale) is retrievable, and every rendering of K8 carries the waiver chip, the single-source marking, and the "assessment, not fact" marking.

**Acceptance Scenarios**:

1. **Given** an assessed, single-source value claiming `hard_constraint` **with** waiver W-1, **When** it is saved, **Then** it is accepted with the licensing waiver recorded inline on the object and retrievable (the `waives` trace edge is written when the constraint compiles — seam §4) (DEC-14; constitution III).
2. **Given** K8 is stored, **When** it renders on the S1 table, **Then** it carries a waiver chip and a single-source marking, and its value carries the "assessment, not fact" marking (constitution II; G2).
3. **Given** the same value with the waiver **removed**, **When** a save is attempted, **Then** it is refused `waiver_required` — the acceptance in scenario 1 was the waiver's doing, not a leak.

---

### User Story 3 — A revised answer stales exactly what it overtakes (Priority: P3)

The met service issues an updated forecast (K9) that overtakes the expiring one (K5). Saving K9 as a supersession records the relationship as an edge and marks the prior version stale — and *only* the prior version, so that later stages can flag exactly the verdicts K5 was holding up (thesis F) without over- or under-reaching.

**Why this priority**: Supersession-as-edge (DEC-21) is the mechanism the staleness thesis (F) later reads; getting it exact at Stage 1 is what makes Stage 6's "exactly the dependent artefacts, nothing else" achievable. It is P3 because it is not yet user-dramatic on its own — its payoff is downstream.

**Independent Test**: Supersede K5 with K9 (a cross-lineage supersession); confirm a `supersedes` edge is written from K9 to K5, the response names exactly the versions staled (K5 only), and the S1 table shows K5 as stale and K9 as live.

**Acceptance Scenarios**:

1. **Given** a live K5 and a fresh K9, **When** K9 is saved as superseding K5, **Then** a `supersedes` edge is written and the returned stale-set is exactly {K5} (DEC-21; knowledge model §2).
2. **Given** cross-lineage supersession (K9 and K5 have distinct logical ids), **When** it is recorded, **Then** the edge still carries the relationship — supersession is not restricted to same-lineage revisions.
3. **Given** the supersession lands, **When** the delta feed is read, **Then** exactly one delta is published for the act (DEC-5; seam §3, ratified DEC-24).

---

### User Story 4 — A contested pair blocks downstream use (Priority: P3)

Two sources disagree on the garrison's sea-mine stock: a defector debrief (K12a, 30–60) and pre-war manifests (K12b, 140–220). Contesting one against the other marks both `contested`, and contested knowledge is blocked from reaching any compiled world until a resolution lands — the mine-threat channel simply cannot be built on a disputed number.

**Why this priority**: This is the Stage-1 half of invariant G5 (contested never compiles); Stage 2 completes it at the compile refusal. Recording the contest and the blocking flag at write time is the prerequisite. P3 because its dramatic payoff (the compile refusal) belongs to SPEC-06.

**Independent Test**: Contest K12a against K12b; confirm both move to `contested`, a `contests` edge is written, and both render side by side on the S1 table with a compile-blocking flag. Confirm a later resolution moves the surviving version out of `contested`.

**Acceptance Scenarios**:

1. **Given** K12a and K12b, **When** one is contested against the other, **Then** both are marked `contested` and a `contests` edge is written between them (DEC-17; G5).
2. **Given** the contested pair, **When** it renders on the S1 table, **Then** the two objects appear side by side with a blocking flag (ui-design §3.4.3) — the dispute is shown, not averaged away.
3. **Given** a resolution naming the surviving version, **When** it is recorded, **Then** a `resolves` edge is written and the surviving version leaves `contested` (knowledge model §2; seam §3).

---

### User Story 5 — Every assessed number reads as an assessment (Priority: P2)

On the minimal S1 table, each knowledge item renders its value through the band pill (a closed interval with its unit, no midpoint, no decimal false-precision) and its provenance through the provenance chip (source class, confidence, owner, and single-source/"assessment, not fact" markings). A watcher can tell at a glance which numbers are fact and which are judgement.

**Why this priority**: The band pill is "the thing SMEs will test first" (delivery plan §1.3); banded honesty made visible is the surface on which every other story is judged. P2 because it is the shared rendering substrate the P1 refusal and the waiver trail depend on to be legible.

**Independent Test**: Render the full Meridian K1–K14 set on the S1 table; confirm every non-`observed` value appears banded with provenance and markings, `observed` values (K1) may appear unbanded, and no bare assessed scalar appears anywhere on the surface.

**Acceptance Scenarios**:

1. **Given** any assessed/reported/assumption value, **When** it renders, **Then** it renders as a band with its unit and its provenance chip — never as a bare scalar (constitution II; G2).
2. **Given** an `observed` value (K1, charted), **When** it renders, **Then** it may render unbanded and carries no "assessment, not fact" marking (DEC-14).
3. **Given** a low-confidence value paired with a suspiciously narrow band, **When** it is saved, **Then** the confidence lint warns (not refuses) per the research-note floor (low ≥ 0.25 relative width), surfacing the false-precision tell without blocking authoring (research note `01-knowledge.md`; DEC-16).

### Edge Cases

- **Byte-identical re-save**: saving content identical to an existing object is idempotent — same hash, no duplicate, no second delta (knowledge model §2).
- **Supersede a value that is already stale/retired**: recorded as an edge; the stale-set never grows beyond the versions the edge actually overtakes.
- **Contest already-contested knowledge**: adding a third disputant does not silently drop the first; the blocking flag persists until a resolution names a survivor.
- **Resolve without a valid survivor / to a version not in the contest**: refused — a resolution must name a version that was actually contested.
- **`assumption` claiming `hard_constraint`**: refused `encoding_violation` even with a waiver — assumptions may never be hard constraints (knowledge model §9), distinguishing them from `reported`/`assessed` which a waiver can license.
- **Confidence lint on a degenerate band** (`lo == hi`): permitted only for `observed` (or high confidence); a low/moderate confidence degenerate assessed band trips the lint.
- **Exposure query on an unanswered open question** (K11, K13): returns an empty-but-complete forward chain, not a dead-end error (G3).

## Requirements *(mandatory)*

### Functional Requirements

**Knowledge write & encoding discipline**

- **FR-001**: The system MUST enforce the encoding-discipline table (knowledge model §9) at the moment of write: an `assumption` (and any source class) claiming `hard_constraint` without licence is refused `encoding_violation`; a `reported`/`assessed` value claiming `hard_constraint` without a recorded waiver is refused `waiver_required`. (DEC-6, DEC-14)
- **FR-002**: A refused write MUST persist nothing — no object, no trace edge, no delta — and MUST return a first-class refusal `{reason, offending refs, one-sentence explanation}`, never an HTTP-style error and never a degraded/partial save. (seam §1 refusal model)
- **FR-003**: `scenario_weight` objects MUST be firewalled from compilation: storable and displayable as attention-ordering weight, never encodable as a constraint or cost by any path. (knowledge model §9; DEC-6)
- **FR-004**: A `reported`/`assessed` value claiming `hard_constraint` **with** a recorded waiver MUST be accepted, and the licensing waiver MUST be retrievable (author, scope, rationale) and linked to the value. (DEC-14; constitution III)

**Lifecycle**

- **FR-005**: The system MUST support the knowledge lifecycle acts create, supersede, contest, resolve, and exposure, with each object carrying a lifecycle status (`open → answered → superseded | stale | contested → resolved | retired`). (DEC-17)
- **FR-006**: Supersession MUST write a `supersedes` edge and return exactly the versions the edge staled — no more, no fewer — and MUST support cross-lineage supersession (distinct logical ids). (DEC-21)
- **FR-007**: Contesting MUST mark both objects `contested` and write a `contests` edge; contested knowledge MUST be blocked from reaching any compiled world (the Stage-1 half of G5, completed by the SPEC-06 compile refusal). (G5, DEC-17)
- **FR-008**: Resolution MUST write a `resolves` edge and move the named surviving version out of `contested`; a resolution naming a version not in the contest MUST be refused. (knowledge model §2)
- **FR-009**: Exposure MUST return the forward trace chain from a knowledge object to what it drives; an object driving nothing yet returns an empty-but-complete chain, never a dead-end error. (G3)
- **FR-010**: Each of create, supersede, contest, and resolve MUST publish exactly one delta; a byte-identical re-create publishes none (idempotent). (DEC-5; DEC-24; knowledge model §2)

**Banded honesty & provenance rendering**

- **FR-011**: No value derived from a `reported`/`assessed`/`assumption` source may appear unbanded anywhere the service returns it or the S1 table renders it; every such value carries provenance (source class, confidence, owner) and the "assessment, not fact" marking. Only `observed` values may render unbanded. (constitution II; G2; DEC-9, DEC-14)
- **FR-012**: Bands MUST be pure closed intervals `{lo, hi, unit}` with `lo ≤ hi` and no stored midpoint; the band pill MUST render without any decimal point-estimate or distributional claim. (DEC-15)
- **FR-013**: The provenance chip MUST render the single-source marking wherever a single-source value renders, and a waiver chip wherever a waived value renders. (DEC-9; thesis E)
- **FR-014**: On write, the system MUST apply the confidence → band-width lint at **warning** level (not refusal): a value whose confidence level falls below the minimum relative width for that level (`low ≥ 0.25, moderate ≥ 0.10, high ≥ 0`; `r = (hi−lo)/max(|lo|,|hi|)`) is flagged as possible false precision; `observed` is exempt. (research note `01-knowledge.md`; DEC-16)

**Surface**

- **FR-015**: The minimal S1 knowledge table MUST render the Meridian K1–K14 set from stored fixture objects (not mock props), showing each item's question, banded value, provenance, and lifecycle status, and MUST surface the refusal banner, waiver chip, single-source marking, and contested-pair blocking flag in place. (ui-design §3.4; DEC-5 — surfaces arrange projections only)
- **FR-016**: The S1 table MUST NOT compute or hold private derived state — it arranges projections of the store and the knowledge service's responses only. (constitution I; DEC-5)

### Key Entities *(include if feature involves data)*

- **KnowledgeObject**: a quantified JIPOE question-and-answer carrying encoding class, banded value, provenance, criticality, validity window, and lifecycle status; content-addressed with a stable logical id. (DEC-6, DEC-17, DEC-21)
- **Band**: closed interval `{lo, hi, unit}`, `lo ≤ hi`, no midpoint; how every assessed value is carried. (DEC-15)
- **Provenance**: `{source_class, confidence, owner, single_source, collected_at, note}`; travels with every value it describes. (DEC-14, DEC-16)
- **Waiver**: a named, recorded licence (e.g. W-1) permitting a `reported`/`assessed` value to act as a hard constraint; carries author, scope, and rationale.
- **TraceEdge**: `supersedes` / `contests` / `resolves` / `waives` relationships, written at the moment of the act by the service performing it. (constitution III; DEC-21)
- **Refusal**: a first-class outcome `{reason, offending refs, explanation}`; an honest decline, not an error. (seam §1)
- **Delta**: a stamped record of a cross-surface write, published exactly once per act, feeding the S4 activity feed. (DEC-5; DEC-24)
- **Band pill / provenance chip**: shared components rendering a band and its provenance; extractable, depend only on generated LinkML types (SPEC-14 constraint).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The K10 save is refused in a single action, with a legible reason, offending ref, and explanation visible where the save was attempted, and nothing is persisted (0 objects, 0 edges, 0 deltas from the refused write). *(demo moment)*
- **SC-002**: 100% of non-`observed` values on the S1 table render banded with provenance; **zero** bare assessed scalars appear anywhere in service responses or on the surface (G2 spot-check passes).
- **SC-003**: Superseding K9 marks exactly one prior version stale (K5) and no other; the staleness reaches no unrelated object.
- **SC-004**: The contested K12 pair is blocked from any compiled world for as long as it is unresolved; a resolution naming a survivor lifts the block for that version only.
- **SC-005**: K8 renders with its waiver chip, single-source marking, and "assessment, not fact" marking on every appearance; removing the waiver flips the save to a `waiver_required` refusal.
- **SC-006**: Every knowledge-lifecycle act publishes exactly one delta; a byte-identical re-create publishes none.
- **SC-007**: A low-confidence value paired with a band narrower than its floor is flagged by the confidence lint at warning level without blocking the save; `observed` values are never flagged.

## Assumptions

- SPEC-01 (content-addressed store: `PUT/GET/exists/versions`) and SPEC-02 (trace-edge store with forward/backward walks) are in place and provide the persistence and trace primitives this service composes; this slice adds the `/knowledge` semantics on top, not new storage. (delivery plan §2.2)
- The seam contract v0.3/§3 knowledge shapes and the ratified v0.2 additions (delta-on-every-knowledge-write, DEC-24) are the movement contract; this spec states domain behaviour, the plan states the endpoint wiring.
- The Meridian vignette §5 fixtures (K1–K14, W-1, the K12a/K12b pair) are the sole fixture source and are authored against the generated types (SPEC-04); a change that breaks a coverage-matrix row is a register matter (constitution, Fixtures).
- The band pill and provenance chip are delivered here as the first two entries of the SPEC-14 gallery and obey its extractability constraint (components depend only on generated LinkML types).
- The confidence-lint calibration (low 0.25 / moderate 0.10 / high 0) is provisional per research note `01-knowledge.md`, to be recalibrated after SME Checkpoint 1 (DEC-27); shipping it as a warning rather than a refusal is deliberate for exactly this reason.
- "Minimal S1 table" means a read-and-write knowledge list sufficient to exhibit the four discipline moments; the full S1 workbench (collection/verification queues) is later scope, not Stage 1.
