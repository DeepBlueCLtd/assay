# Feature Specification: Analysis — Discrimination

**Feature Branch**: `claude/next-spec-oh2baf`

**Created**: 2026-07-14

**Status**: Draft

**Input**: SPEC-12: Analysis — discrimination. COA-pair separation over open questions. Research note: `docs/research/08-analysis.md` §3.

**Research Note**: `docs/research/08-analysis.md` §3 (DEC-11 gate satisfied)

**Register Decisions Restated**: DEC-9 (banded honesty), DEC-15 (no distributional claim — rules out Shannon entropy/VOI), DEC-18 (miniature event matrix — the expected_answers per COA), DEC-19 (no numeric weights — cost and value never collapsed)

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Rank open questions by discrimination value (Priority: P1)

The J-2 wants to know: "which unanswered question, if answered, would best distinguish which adversary COA is in play?" The discrimination ranking computes COA-pair separation from the expected-answer bands in the miniature event matrix (DEC-18).

**Why this priority**: This is the core of thesis D — without the ranking, the J-2 cannot prioritise collection. K11 vs K13 is the demonstrator's central collection-management vignette.

**Independent Test**: Run discrimination analysis on K11 and K13 against the R1/R2/R3 COA set; verify K11 ranks above K13.

**Acceptance Scenarios**:

1. **Given** the open questions K11 and K13 with their expected-answer bands, **When** discrimination analysis runs against the R1/R2/R3 COA set, **Then** a ranking is returned with K11 first (positive separation) and K13 second (negative separation).
2. **Given** K11's expected answers R1 `[0.0, 0.2]` and R2 `[0.7, 1.0]`, **When** the R1-R2 pair separation is computed, **Then** the separation is positive (disjoint bands — the gap between 0.2 and 0.7).
3. **Given** K13's expected answers R1 `[40, 90]` and R2 `[50, 110]`, **When** the R1-R2 pair separation is computed, **Then** the separation is negative (overlapping bands — the overlap from 50 to 90).

---

### User Story 2 — See cost alongside discrimination value (Priority: P1)

The J-2 views the S1 "Collect next" queue and sees K11 first (strong discriminator) with its collection cost `[2, 4]` det-days, and K13 second (weak discriminator) with its cost `[0.2, 0.5]` det-days. Value and cost are shown side by side, never collapsed.

**Why this priority**: The cost co-display is part of the thesis-D exit criterion — "value and cost shown side by side, never collapsed" (DEC-19). Without it, the ranking is incomplete.

**Independent Test**: Verify the discrimination output includes both `best_separation` and `cost` as `Band` values; verify they are never combined into a single scalar.

**Acceptance Scenarios**:

1. **Given** K11 with separation `[0.5, 0.8]` and cost `[2, 4]` det-days, **When** rendered on S1, **Then** both values are visible as banded quantities, not collapsed into a ratio or scalar.
2. **Given** K13 with negative separation and cost `[0.2, 0.5]` det-days, **When** rendered on S1, **Then** both values are visible, showing "cheap but uninformative."

---

### User Story 3 — Discrimination per COA pair (Priority: P2)

The J-2 can drill into a question's discrimination entry to see which specific COA pair it separates best. K11 discriminates R1 from R2 but not R2 from R3 (both have mines staged).

**Why this priority**: The per-pair detail enriches the ranking but is not required for the primary exit criterion.

**Independent Test**: Verify K11's pairs array includes an R1-R2 entry with positive separation and an R2-R3 entry with smaller or negative separation.

**Acceptance Scenarios**:

1. **Given** K11's discrimination entry, **When** the pairs list is inspected, **Then** it contains entries for (R1,R2), (R1,R3), and (R2,R3), each with a `separation: Band`.
2. **Given** K11's R1-R2 pair, **Then** separation is positive (disjoint bands). Given K11's R2-R3 pair, **Then** separation is smaller or negative (overlapping bands `[0.7,1.0]` vs `[0.5,0.9]`).

---

### Edge Cases

- What happens when a question has no `expected_answers`? It is excluded from the ranking — discrimination requires the miniature event matrix (DEC-18).
- What happens when only one COA is in the set? No pairs exist; the ranking is empty. This is an honest edge case — discrimination is undefined without alternatives to discriminate.
- What happens when a question has `expected_answers` for only a subset of COAs? Only the pairs with both COA entries present are computed; missing pairs are not fabricated.
- What happens when all open questions have overlapping bands? Every entry has negative separation. The ranking still sorts by "least negative" (closest to discriminating). The J-2 sees that no open question cleanly separates the COAs.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST compute discrimination per open question by measuring band separation for each pair of COAs in the provided set. Separation for a pair `(A, B)` is: if disjoint, the gap between nearest edges (positive); if overlapping, the negative overlap width.
- **FR-002**: The system MUST rank open questions by `best_separation` descending (strongest discriminator first).
- **FR-003**: The system MUST include the collection cost (`Band`) from each question's `collection` field alongside the separation in the ranking output. Cost and value MUST NOT be collapsed into a single metric (DEC-19).
- **FR-004**: The system MUST report per-COA-pair separations for each question, so the J-2 can see which specific pair a question discriminates.
- **FR-005**: The system MUST NOT use scenario weights (K14a–c) in the discrimination computation. The separation is a geometric property of expected-answer bands, not a probabilistic property of the COA set.
- **FR-006**: The system MUST NOT compute Shannon entropy, VOI, or any measure requiring a distributional assumption over the COA set (DEC-15, scenario_weight firewall).
- **FR-007**: The system MUST exclude questions without `expected_answers` from the ranking.
- **FR-008**: The system MUST produce a deterministic stamp over its inputs (question refs, COA refs, engine version).
- **FR-009**: The system MUST reproduce the thesis-D exit on the Meridian fixtures: K11 ranks above K13 on discrimination despite higher cost.

### Key Entities

- **DiscriminationRequest**: `{ questions?: Ref[], coas: Ref[], engine_version: string }` — movement type in `seam.ts`. `questions` defaults to all open KnowledgeObjects with `expected_answers`.
- **DiscriminationEntry**: `{ question: Ref, pairs: { coa_a: string, coa_b: string, separation: Band }[], best_separation: Band, cost: Band }` — one entry per open question.
- **DiscriminationSuccess**: `{ ranking: DiscriminationEntry[], stamp: string }` — the success response.
- **DiscriminationResult**: `DiscriminationSuccess | Refusal` — follows the established pattern.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: K11 ranks above K13 in the discrimination ranking for the Meridian R1/R2/R3 COA set.
- **SC-002**: K11's R1-R2 pair separation is positive (disjoint expected-answer bands).
- **SC-003**: K13's best-pair separation is negative (all pairs overlapping).
- **SC-004**: Cost is present as a `Band` in every entry and is never combined with separation into a single value.
- **SC-005**: No scenario weight, Shannon entropy, or distributional assumption appears in the implementation.
- **SC-006**: All existing tests pass; typecheck clean; no regression.

## Assumptions

- The expected-answer bands in the fixtures (`fixtures/knowledge.json`) are the authoritative source for the discrimination computation. The fixture values match the vignette §5 miniature event matrix.
- The COA set is provided by the caller (the R1/R2/R3 scenario ids). The system does not infer which scenarios exist.
- Collection cost comes from the first entry in the question's `collection` array. If multiple collection options exist, the first is used for the ranking; the full list is available for display.
- No schema changes needed — `ExpectedAnswer` and `CollectionOption` already exist on `KnowledgeObject`.
