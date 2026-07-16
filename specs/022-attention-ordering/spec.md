# Feature Specification: Attention ordering — the scenario-weight firewall's positive half (SPEC-22)

**Feature Branch**: `claude/spec-22-v0zm00` (spec authored on `claude/jipoe-c2-process-review-g4kwfn`; spec dir `022-attention-ordering`)

**Created**: 2026-07-15

**Status**: Implemented 2026-07-16 (research note `docs/research/11-attention.md` authored first — DEC-11; register candidate concept §6.24 flagged — DEC-2)

**Input**: JIPOE/C2 process review (`docs/reviews/2026-07-14-jipoe-c2-process-review.md` §3.5, mockup M11, addendum §10 slice S-C). The register's firewall language says scenario weights "**order attention and reporting**, and never compile into a constraint or cost." The negative half (never compiles) is exercised by K14 and test-asserted. The positive half has **no visible implementation anywhere**: no surface renders the K14 likelihood bands, and nothing orders by them. Doctrine (JP 2-01.3) *requires* a likelihood rank-ordering of adversary COAs as a J-2 product; ASSAY's honest answer — the ordering exists, is banded, is contestable, and influences attention, never arithmetic — is currently only half-shown. An SME will read "you hold likelihoods and do nothing with them" as a gap, not a discipline.

**Research Note**: `docs/research/11-attention.md` (DEC-11 gate — **to be authored before implementation**; decides the honest ordering rule for overlapping bands and the exact queue behaviours)

**Register Decisions Restated**: DEC-15 (bands pure; no midpoint — so no scalar sort key exists), DEC-19 (no numeric weights in any decision arithmetic), knowledge-model §9 firewall (scenario_weight never compiles), DEC-9 (banded honesty on every surface)

**Register candidate** *(flagged, not asserted — to be recorded in `docs/assay-concept.md` §6 before build)*: **sharpen "order attention and reporting" into two named behaviours** — (a) the scenario strip renders the likelihood bands under the interval order, (b) the S1 collection queue may tie-break on scenario weight — and nothing else. Any third use is a new candidate, not an extension.

## Honesty stance

Ordering bands is where a midpoint sneaks back in: any scalar sort key (`lo`, `hi`, centre) is a collapse. The honest ordering is the **interval order** already used by the dominance machinery: R_a ranks strictly above R_b iff `lo(R_a) > hi(R_b)`; overlapping bands are **honestly incomparable and render level**. On Meridian this produces the exhibit the firewall deserves: R1 (45–70%) strictly above the level pair {R2 (20–40%), R3 (10–25%)} — R2/R3 overlap, so the system visibly refuses to rank them. The strip must also say, in so many words, that this ordering feeds attention only: the verdicts to its right owe it nothing.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — The scenario strip shows banded likelihoods under the interval order (Priority: P1) 🎯 exit

An observer sees each scenario's likelihood band rendered on the scenario strip — banded bars, visibly overlapping where they overlap — ordered by the interval order with incomparables level, and labelled as attention-only ("orders attention — never compiles").

**Why this priority**: This is the positive half made visible; the strip is where scenarios already live (SPEC-10).

**Independent Test**: Render the scenario strip from the frozen fixtures; assert R1 renders above a level {R2, R3} group; assert every likelihood renders as a band via `bandPill` (no scalar, no midpoint); assert the attention-only label is present.

**Acceptance Scenarios**:

1. **Given** K14a–c, **When** the strip renders, **Then** R1 (45–70%) is strictly above the level pair R2/R3, whose bands visibly overlap; no scalar sort key is derivable from the DOM.
2. **Given** the strip, **When** the minimax verdicts render alongside, **Then** their content and order are unchanged from SPEC-10 — likelihood moves nothing but position and emphasis in the attention layer.
3. **Given** a K14 hover, **Then** the full band + provenance chip renders ("assessed · moderate — assessment, not fact"), and the trace opens back to the J-2 fusion owner (G3).

---

### User Story 2 — The S1 collection queue may tie-break on scenario weight, and says so (Priority: P2)

Where two open questions have equal discrimination standing, the S1 queue orders the one bearing on the more-likely scenario pair first — with the tie-break **stated in the rendering** (DEC-19 style: stated, never silent), and applying only where the interval order actually ranks the scenarios involved.

**Why this priority**: The one legitimate *process* use of likelihood: it directs scarce collection attention, never a verdict.

**Independent Test**: Construct a fixture case with two equal-separation open questions bearing on differently-ranked scenario pairs; assert the queue orders by the interval order on those pairs and renders the stated tie-break; assert overlapping-likelihood pairs produce no tie-break (honest incomparability ⇒ fall back to the existing stated order).

**Acceptance Scenarios**:

1. **Given** two equal-discrimination questions, **When** their scenario pairs are strictly ordered by the interval order, **Then** the queue prefers the higher pair and renders "tie broken by scenario weight (attention only)".
2. **Given** overlapping likelihood bands on the pairs, **Then** no weight tie-break applies and the fallback order (existing, stated) is used — the system never manufactures a ranking the bands don't support.
3. **Given** the primary ranking (discrimination separation, DEC-18), **Then** it is never overridden by weight — weight breaks ties only.

---

### User Story 3 — The firewall's negative half stays test-pinned (Priority: P2)

The existing guarantees are re-asserted alongside the new behaviours: no code path lets a scenario weight reach any channel, cost, constraint, dominance comparison, or verdict.

**Why this priority**: Adding the positive half is precisely when a leak would be introduced.

**Independent Test**: The existing firewall tests pass unchanged; a new test asserts the strip/queue modules import no scoring machinery and the scorer/compiler import nothing from them.

**Acceptance Scenarios**:

1. **Given** the new attention code, **When** the firewall suite runs, **Then** `scenario_weight` still refuses to compile by every path (`encoding_violation` semantics unchanged).
2. **Given** identical stamps and seeds, **When** K14 bands are edited (a legal knowledge write), **Then** no verdict, score, handful membership, or relaxation output changes — only strip emphasis and queue tie-breaks may move (the machine-checkable meaning of "attention only").

---

### Edge Cases

- **All three likelihoods overlapping**: the strip renders all level — the honest "we cannot rank these" is itself the exhibit.
- **A K14 object contested or superseded**: normal lifecycle applies; a contested weight renders with its contest mark and drops out of tie-breaking until resolved (it never compiled anyway).
- **A scenario with no likelihood object**: renders unranked ("no assessment"), never defaulted to a uniform weight — absence of judgement is not a judgement.
- **Likelihood band spanning another entirely (nesting)**: nesting is overlap; level rendering applies.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The scenario strip MUST render each ScenarioCOA's likelihood band via `bandPill`, ordered by the interval order (`lo_a > hi_b` ⇒ above), incomparables level, with a persistent "orders attention — never compiles" label keyed in the legend.
- **FR-002**: No scalar derived from a likelihood band may exist anywhere in the implementation (no midpoint, no `lo`/`hi` sort key standing alone) — ordering is pairwise interval comparison only (DEC-15).
- **FR-003**: The S1 queue MAY tie-break equal-discrimination questions by the interval order on their scenario pairs; the tie-break MUST be rendered where applied and MUST NOT apply across overlapping bands.
- **FR-004**: Editing K14 bands MUST provably change no verdict, score, handful, or relaxation output (test: byte-identical stamps and results before/after a weight edit, given the same seed).
- **FR-005**: The existing firewall refusals and tests MUST pass unchanged; new modules MUST NOT be imported by compile/score/dominance/relax code.
- **FR-006**: The two behaviours above are the *complete* set licensed by the sharpened register language; the code MUST NOT add further weight-consuming behaviours without a new register entry.

### Key Entities

- No schema change. Touches: `src/components/scenarioStrip.ts` (banded likelihood row + label), the S1 queue assembly in `src/app/state.ts` (or its service), `src/components/legends.ts`, tests.
- Reuses: `bandPill`, `provenanceChip`, the interval-order comparison from `src/dominance.ts` (or `interval.ts`) — no new comparison machinery.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The Meridian strip shows R1 above a level, visibly-overlapping {R2, R3}; attention-only label present; all values banded.
- **SC-002**: A weight edit changes zero computational outputs (stamp-identical) while the strip/queue presentation moves — demonstrated in one test.
- **SC-003**: The queue tie-break renders its statement where applied and never applies across overlap.
- **SC-004**: Firewall suite green; typecheck clean; no coverage-row change.
- **SC-005**: `docs/research/11-attention.md` exists first, deciding the interval-order rule and the queue behaviours, cited from the code.

## Assumptions

- The interval order (already the conservative comparison in `dominance.ts`) is the right honest ordering; the research note confirms or replaces it — if replaced, with something equally midpoint-free.
- The register candidate is ratified as a *sharpening* of existing firewall language, not a new power; if the register instead reads the current language as already licensing these behaviours, the candidate collapses to a clarification and the build proceeds identically.
