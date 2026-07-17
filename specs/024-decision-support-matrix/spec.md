# Feature Specification: The Decision Support Matrix surface — decisions in time (SPEC-24)

**Feature Branch**: `claude/spec-24-9pywc3` (spec authored on `claude/jipoe-c2-process-review-g4kwfn`; spec dir `024-decision-support-matrix`)

**Created**: 2026-07-15 · **Picked up**: 2026-07-16

**Status**: Built — `src/decisionSupport.ts` + `src/components/dsmTable.ts`, wired as the commander "decisions in time" panel; `tests/decisionSupport.test.ts` pins the Meridian exhibit; 493 tests, typecheck clean. Research note `docs/research/12-decision-support.md` authored (the DEC-11 gate); ratified as ASSAY-DEC-45/46 (register batch 8, closing concept §6.27/§6.28).

**Input**: JIPOE/C2 process review (`docs/reviews/2026-07-14-jipoe-c2-process-review.md` §4.2, mockup M1, action B1, addendum §10 slice S-D). JIPOE earns its keep in doctrine at the artefact ASSAY stops one step short of: the **decision support template/matrix** — decision points tied to the intelligence that discriminates them, with a latest time the information is of value (LTIOV). ASSAY has quietly built every ingredient: a commitment whose verdict is scenario-divergent or `tight` *is* a decision point; the discriminating open question *is* the NAI's indicator; `collection.earliest_result` against the plan's commit step *is* the LTIOV calculation; staleness flags *are* DSM re-validation. Missing is only the artefact that assembles them — the one a J-3 actually recognises. Per DEC-5 (surfaces are config-declared projections) this slice is **a projection plus one derivation rule**, not a new engine.

**Research Note**: `docs/research/12-decision-support.md` (DEC-11 gate — **to be authored before implementation**; decides the decision-point derivation rule, the commit-step identification, and the LTIOV computation; cites JP 2-01.3's DST/DSM and event-matrix doctrine and JP 5-0's CCIR linkage)

**Register Decisions Restated**: DEC-5 (surfaces are projections; trace graph first-class), DEC-10 (analysis services are thin orchestrations — scorer-in-a-loop + trace walk; no new engine), DEC-18 (discrimination computed, never asserted), DEC-19 (no weights; nothing collapsed), DEC-17 (scenario clock only), G3 (every cell trace-walkable to named owners)

**Register candidates** *(flagged, not asserted — to be recorded in `docs/assay-concept.md` §6 before build)*: (1) the **decision-point derivation rule** (which verdict patterns constitute a DP — a ranking/semantics decision of the same class as DEC-18); (2) a **new derived surface** (a fifth tab, or an S2/S3 mode — the note recommends; DEC-32's four-tab decision is extended either way); (3) a **seam addition** `POST /analyse/decision-support` (DEC-24-style contract growth).

## Honesty stance

The DSM is doctrine's bridge from intelligence to command, and it is also where a tool most wants to *task* people. ASSAY's DSM must rank and derive, never task and never decide: the system says "this commitment turns on that question, answerable in time by this collection, until step N" — tasking the collection is a human act with its own commitment consequences (the walkthrough's KINGFISHER/C6 discipline, unchanged). Three rules bind: every row is **derived** (from verdicts, discrimination, validity windows, plan geometry — no authored rows); every quantity is **banded or a step count**, never a synthesised urgency score (DEC-19); and a decision that *cannot* be informed in time renders as exactly that — the honest red state, never dropped, never softened (G4's spirit at the collection layer).

## User Scenarios & Testing *(mandatory)*

### User Story 1 — The derivation rule, decided and gated (Priority: P1) 🎯 gate

Before any pixel: the research note decides (a) **what constitutes a decision point** — candidate rule: commitment c on plan p is a DP iff its verdict diverges across live scenarios in the tensor, or is `tight`/`marginal` under the selected world (i.e. new information could change what the commander must do); (b) **the commit step** — the plan-geometry step at which p irrevocably commits to the branch bearing on c (e.g. the leg entering the strait region for C2-class decisions), derived from routes/task windows via the verdict's trace; (c) **LTIOV** — the latest step at which an answer can still inform the decision, and the answerable-in-time predicate `collection.earliest_result ≤ commit_step − lead`, with `lead` stated (0 in v1 unless the note decides otherwise).

**Why this priority**: The derivation rule *is* the register candidate; everything else is rendering. Research-first is non-negotiable here — this is where a synthesised urgency scalar would sneak in.

**Independent Test**: The note exists, decides (a)–(c) with doctrinal citations (JP 2-01.3 DST/DSM, event matrix, NAI/LTIOV; JP 5-0 CCIRs), states what it deliberately does not model (TAIs, execution), and names the Meridian exhibit rows it predicts.

**Acceptance Scenarios**:

1. **Given** the note, **Then** the DP rule is stated as a computable predicate over existing objects (verdict tensor, margin bands, selected world) with no free parameters beyond stated ones.
2. **Given** the note, **Then** LTIOV is defined on the scenario clock only (DEC-17) and the answerable-in-time predicate has an explicit honest-red branch.

---

### User Story 2 — The derivation service (Priority: P1)

`POST /analyse/decision-support {plan, world, commitments}` returns the derived DSM rows: per decision point — the commitment at stake, its verdict pattern (the evidence it *is* a DP), the discriminating open question(s) from SPEC-12 (operative-pair-conditioned once SPEC-23 lands), the collection option(s) with banded cost, `earliest_result` vs commit step (in-time or the red "cannot answer in time"), and the validity-window tripwires (which currently-consumed knowledge lapses before the commit step). Deterministic, stamped, trace-edged.

**Why this priority**: The computation is the deliverable; the surface is its projection.

**Independent Test**: Run the service on P2 over the current world; assert the Meridian exhibit: C2's strait-commitment DP appears (scenario-divergent under R2), K11 attached as its discriminator, KINGFISHER's collection (earliest step 8) evaluated against P2's strait-entry commit step, and the K9 validity window surfaced as a tripwire where it lapses before a commit step; assert byte-identical output on re-run (G1).

**Acceptance Scenarios**:

1. **Given** the frozen tableau and P2 selected, **When** the service runs, **Then** the rows match the note's predicted exhibit exactly — derived, not authored (a fixture test pins them).
2. **Given** a DP whose only collection cannot answer in time, **Then** the row renders the red state with the arithmetic visible (`earliest_result` vs commit step), never dropped.
3. **Given** the result, **Then** every row element opens a trace terminating in named knowledge and owners (G3), and the result carries `cited_in`-class edges written at compute time.

---

### User Story 3 — The surface (Priority: P2)

The DSM renders as a surface (fifth tab or S2/S3 mode per the note's recommendation): one row per decision point, band pills and step counts throughout, chips on every assessed element, staleness tripwires live, and the same comparability guard as every other surface (mixed stamps grey).

**Why this priority**: The artefact a commander and J-3 recognise — the review's strongest doctrinal exhibit — but strictly a projection of US2.

**Independent Test**: Render from the US2 result; assert no scalar urgency/priority number exists anywhere in the DOM; assert rows re-derive (and glow, G6) when the underlying world recompiles; assert the tasking absence — no "task this collection" button, only the trace to the collection option and its cost band.

**Acceptance Scenarios**:

1. **Given** the surface, **When** K9 supersedes K5 upstream, **Then** affected rows re-derive on recompile and glow exactly where displayed values moved (G6), and tripwire states update.
2. **Given** the legend, **Then** the DSM's marks (DP evidence, in-time/red, tripwire) are keyed like every component legend.

---

### Edge Cases

- **No decision points** (all verdicts robust and scenario-stable): the surface renders the honest empty state — "no verdict turns on open information" — which is itself decision-relevant, never padded.
- **A DP with no discriminating question** (nothing in the KB separates the operative scenarios): rendered as a named intelligence *gap* — the doctrinally correct output (gap → collection requirement), not an empty cell.
- **Multiple collections for one question**: all render with their banded costs and in-time states; the system ranks by the existing discrimination/attention machinery, never by a combined cost-value scalar (DEC-19).
- **Commit step ambiguous** (a commitment whose metric reads no route geometry, e.g. a horizon-state metric): the note's rule must assign the horizon step or declare the DP class unsupported in v1 — stated, not improvised.
- **Contested/stale inputs**: the DSM inherits compile-firewall behaviour — a row cannot silently rest on refused knowledge; the refusal surfaces in the row's trace state.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The DP predicate, commit-step rule, and LTIOV computation MUST be implemented exactly as the research note decides, cited from the code, with no additional heuristics.
- **FR-002**: The service MUST be a thin orchestration over existing machinery — verdict tensor (SPEC-10), discrimination (SPEC-12/23), validity windows, plan geometry, `TraceStore` — with no new scoring engine (DEC-10).
- **FR-003**: Every derived quantity MUST be a band, a step, or a verdict — no synthesised urgency, priority, or risk scalar anywhere (DEC-19); costs stay separate bands.
- **FR-004**: Rows MUST be trace-complete (G3): DP evidence → verdicts; discriminator → expected answers; tripwires → validity windows; each terminating in named owners.
- **FR-005**: The cannot-answer-in-time state MUST render with its arithmetic; no row is dropped for being red (G4's spirit).
- **FR-006**: The result MUST be deterministic and stamped over its inputs (G1); the surface MUST honour the comparability guard and re-derive + glow on recompile (G6).
- **FR-007**: The surface MUST NOT task: no write affordance beyond the traces; collection tasking remains a human act outside this surface (the KINGFISHER/C6 discipline).
- **FR-008**: The Meridian exhibit rows MUST be pinned by fixture test (the note's predicted rows are the oracle-style table; changing them is a register/coverage matter).

### Key Entities

- **DecisionSupportRequest** `{plan: Ref, world: Ref, commitments: Ref[]}` and **DecisionSupportResult** `{rows: DecisionPointRow[], stamp}` — seam movement types (the seam-addition register candidate).
- **DecisionPointRow** `{commitment, evidence: VerdictRef[], discriminators: {question, separation_class, collection: {option, cost: Band, earliest_result, in_time: boolean}}[], commit_step, ltiov, tripwires: {knowledge, lapses_at}[]}` — all refs trace-walkable.
- Touches: new `src/decisionSupport.ts`, `src/components/dsmTable.ts` (pure), `src/app/{state,shell}.ts` (tab/mode), `src/components/legends.ts`, seam contract doc at ratification, tests.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The note exists first and decides DP/commit-step/LTIOV with citations; its predicted Meridian rows become the pinned fixture table.
- **SC-002**: The service reproduces the exhibit deterministically: C2's strait DP with K11 attached and KINGFISHER's in-time evaluation; the K9 tripwire where applicable; byte-identical re-runs.
- **SC-003**: The surface renders with zero synthesised scalars, full chips/traces, honest empty and red states, and G6 glow on recompile.
- **SC-004**: No tasking affordance exists; typecheck/tests clean; coverage matrix gains the DSM row via batch propagation at ratification.

## Assumptions

- SPEC-23's operative-pair conditioning improves the discriminator column but is not a dependency — v1 may attach best-pair discriminators with the conditioning noted as pending.
- The selected plan comes from `/select` where a selection exists; absent one, the surface derives for a viewer-chosen plan with the absence of commitment stated (no fabricated "the commander's plan").
- The seam addition follows the DEC-24 precedent (contract defects/additions ratified in batch); the mock implements it in-browser like every other service.
