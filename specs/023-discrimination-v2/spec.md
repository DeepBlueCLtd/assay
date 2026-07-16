# Feature Specification: Collection discrimination v2 — sharper where-to-look (SPEC-23)

**Feature Branch**: `claude/spec-23-0klgiu` (spec authored on `claude/jipoe-c2-process-review-g4kwfn`; spec dir `023-discrimination-v2`)

**Created**: 2026-07-15

**Status**: Implemented — the research-note amendment (`docs/research/08-analysis.md` §7) landed 2026-07-16 and the register candidates are flagged as concept §6.24/§6.25

**Input**: JIPOE/C2 process review (`docs/reviews/2026-07-14-jipoe-c2-process-review.md` §3.4, action B7, addendum §10 slice S-E), plus the knowledge-model open item the review seconds ("does `ExpectedAnswer` need its own provenance?"). Three sharpenings of SPEC-12's band-separation ranking: **(a)** condition the ranking on the **operative pair** — the scenario pair the current plan-set's verdicts actually turn on — rather than best-pair-anywhere, so a question that cleanly separates an inert pair cannot outrank one that moderately separates the pair that matters; **(b)** distinguish **nested** expected bands (can never discriminate, however the observation lands) from **partially overlapping** ones (could discriminate, given a lucky observation) — both score negative today and are epistemically different; **(c)** give `ExpectedAnswer` **provenance** — the event matrix is an assessment ("who says the COA would look like that?") and is currently the only major assessed content without a chip.

**Research Note**: amendment to `docs/research/08-analysis.md` (DEC-11 gate — **to be authored before implementation**; decides the operative-pair derivation, the three-way separation classification, and the ExpectedAnswer provenance shape)

**Register Decisions Restated**: DEC-18 (expected-answer event matrix; discrimination computed from expected-band separation, never asserted), DEC-19 (cost shown alongside, never collapsed with value), DEC-14 (provenance semantics), DEC-15 (bands pure; the separation measure stays geometric and distribution-free)

**Register candidates** *(flagged, not asserted — to be recorded in `docs/assay-concept.md` §6 before build)*: (1) **provenance on `ExpectedAnswer`** (schema change; touches DEC-18); (2) the **operative-pair conditioning rule** (a ranking-semantics decision; touches DEC-18's "never asserted" discipline — the conditioning must itself be computed, not curated).

## Honesty stance

Discrimination v1 is honest but pair-agnostic: it answers "which question separates *some* COAs best," not "which question separates the COAs *this decision* is caught between." The operative pair must be **derived** from the existing verdict tensor (where plans' verdicts diverge across scenarios), never hand-picked — a curated pair would be exactly the authored-artefact failure the horizon note names. And the event matrix's own epistemics must surface: an expected answer is somebody's assessment of what a COA would look like, owed the same chip as every other assessment (G3 applies to the matrix, not just through it).

## User Scenarios & Testing *(mandatory)*

### User Story 1 — The ranking is conditioned on the operative pair (Priority: P1) 🎯 exit

The J-2's collect-next queue ranks open questions by their separation **on the scenario pairs the live decision turns on** — derived from the robustness tensor (SPEC-10): a pair is operative iff some plan in the current set has differing verdicts on some commitment across that pair. All-pairs separations remain visible as context; the operative ranking leads.

**Why this priority**: This is thesis D grown up: not "where could we look" but "where must we look, given what we're deciding."

**Independent Test**: On the frozen tableau, derive the operative pairs from the P1/P2 tensor (P1's C1/C2 flip between R1 and R2 makes {R1,R2} operative); assert K11 (R1 [0,0.2] vs R2 [0.7,1.0], disjoint) tops the operative ranking; construct a fixture question that separates only {R1,R3} strongly and assert v1 would rank it above a moderate {R1,R2} separator while v2 ranks it below — the discriminating case between the two semantics.

**Acceptance Scenarios**:

1. **Given** the current plan set's verdict tensor, **When** the operative pairs are derived, **Then** the derivation is computed from verdict divergence only (no curation, no likelihood input) and is rendered with the ranking ("operative: R1↔R2 — P1's C1/C2 turn on it").
2. **Given** the Meridian fixtures, **Then** K11 ranks above K13 in the operative ranking (v1's exhibit is preserved), with cost still shown alongside as a separate band, never collapsed (DEC-19).
3. **Given** the constructed divergence case, **Then** v2's ordering differs from v1's exactly as specified, and the test pins both orderings.

---

### User Story 2 — Nested and partially-overlapping expectations read differently (Priority: P2)

Each question's per-pair separation carries a three-way classification: **disjoint** (discriminates), **partial overlap** (could discriminate — an observation in the non-shared region would settle it), **nested** (cannot discriminate — every possible observation is consistent with both COAs). K13's overlaps are classified, not just scored negative.

**Why this priority**: Two epistemically different situations currently share one negative number; the J-2 tasking decision differs between them.

**Independent Test**: Assert the classification on the frozen matrix (K13's pairs classified per fixture geometry); assert a nested pair renders "cannot discriminate" and is excluded from could-discriminate tie-breaks; assert the numeric separation is unchanged from v1 (the classification is additive, not a rescore).

**Acceptance Scenarios**:

1. **Given** a nested expected-band pair, **When** the table renders, **Then** the cell reads as *cannot discriminate* (word + mark, legend-keyed), distinct from partial overlap's *weak*.
2. **Given** the v1 numeric separations, **Then** they are byte-identical before and after this slice — presentation and classification only, no metric change without its own register conversation.

---

### User Story 3 — The event matrix carries provenance (Priority: P2)

Every `ExpectedAnswer` carries `{source_class, confidence, owner}` (the standard provenance shape, or a stated subset decided by the note), rendered as a chip wherever expected bands render; trace opens to the named owner.

**Why this priority**: The discrimination ranking is only as honest as the expectations it reads; today those expectations are the one assessed input without a visible author.

**Independent Test**: Regenerate schema; assert every fixture ExpectedAnswer carries provenance; hover an expected band in the discrimination table and assert the chip renders and the trace terminates in a named owner (G3).

**Acceptance Scenarios**:

1. **Given** the updated fixtures, **When** the discrimination table renders K11's R1/R2 expectations, **Then** each shows its chip ("assessed · [confidence] — assessment, not fact").
2. **Given** an ExpectedAnswer authored without provenance, **When** written, **Then** the same lint discipline as knowledge objects applies (severity decided by the note amendment).

---

### Edge Cases

- **No plans scored yet** (no tensor): the operative set is empty; the ranking falls back to all-pairs v1 semantics with a rendered statement ("no live decision — showing all-pairs separation"). Never a fabricated pair.
- **Every pair operative** (verdicts diverge everywhere): v2 degenerates gracefully toward v1 over the operative subset; stated in the rendering.
- **A single live scenario** (others retired): discrimination is meaningless; the queue says so honestly ("one scenario live — nothing to discriminate") rather than ranking noise.
- **Expected bands touching at an endpoint** (`hi_a == lo_b`): the note amendment decides the boundary classification (disjoint-at-zero-separation vs partial); the decision is stated, mirroring O-3's band-edge discipline.
- **R3m as a branch**: whether the branch is a distinct pair member follows SPEC-10's scenario-set convention (R3m is a relaxation excursion, not a robustness scenario) — the operative derivation reads the tensor and inherits its scenario set.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST derive operative scenario pairs from the current verdict tensor: pair (R_i, R_j) is operative iff ∃ plan p, commitment c with differing verdicts across R_i/R_j. The derivation is deterministic, computed, and rendered with its evidence.
- **FR-002**: The collect-next ranking MUST lead with operative-pair separation; all-pairs context remains available; cost stays a separate band, never combined (DEC-19).
- **FR-003**: Each per-pair result MUST carry the three-way classification (disjoint / partial / nested); nested pairs are excluded from could-discriminate emphasis; numeric v1 separations are unchanged.
- **FR-004**: `ExpectedAnswer` MUST gain provenance (shape per the note amendment); schema regen; fixtures updated; chips render wherever expected bands render; traces terminate in named owners (G3).
- **FR-005**: The Meridian exhibit MUST reproduce: K11 above K13 on the operative ranking; and one pinned constructed case MUST demonstrate v2 ≠ v1 ordering under best-pair/operative-pair divergence.
- **FR-006**: Empty/degenerate states (no tensor, one scenario) MUST render their honest statements; nothing is ranked that the inputs cannot support.
- **FR-007**: Likelihood (K14) MUST NOT enter the derivation or ranking (attention tie-breaks, if any, belong to SPEC-22's stated behaviour and stay in the queue layer, never in the separation computation).

### Key Entities

- **ExpectedAnswer.provenance** (schema change — the register candidate).
- **OperativePairs** (derived, seam-visible movement type: `{pairs: [{a, b, evidence: VerdictRef[]}], stamp}`).
- Touches: `src/discrimination.ts`, `src/components/discriminationTable.ts`, `src/app/state.ts` (queue assembly), `schema/` + regen, fixtures, legends, tests.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Operative pairs derive correctly from the frozen tensor ({R1,R2} operative via P1's C1/C2 flips) and render their evidence.
- **SC-002**: K11 > K13 reproduces on the operative ranking; the pinned divergence case shows v2 ≠ v1 exactly as specified.
- **SC-003**: Nested vs partial classification renders on the frozen matrix; v1 numeric separations byte-identical.
- **SC-004**: Every fixture ExpectedAnswer carries provenance; chips + traces verified (G3).
- **SC-005**: Degenerate states render honest statements; `npm run gen`/typecheck/tests clean.

## Assumptions

- The robustness tensor (SPEC-10) is available wherever the queue is assembled; if the tensor is stale relative to the current stamp, the comparability guard applies before derivation (stale tensors grey, never silently condition the ranking).
- Provenance on ExpectedAnswer reuses the existing `Provenance` shape unless the note amendment finds a stated subset sufficient; no third provenance dialect is introduced.
- The three-way classification needs no new metric — it is a geometric predicate over existing band pairs.
