# Feature Specification: Relaxation — least-worst under an infeasible commitment set (SPEC-09)

**Feature Branch**: `claude/next-spec-12qusu` (spec dir `009-relaxation`)

**Created**: 2026-07-13

**Status**: Draft

**Stage**: Build-plan Stage 4 (least-worst, thesis B live) · **Depends on**: SPEC-07 (scorer — `ScoreService`, `CommitmentVerdict.verdict/margin`, deterministic stamp), SPEC-06 (compile — CompiledWorld with a COA excursion, the R3m world), D3 (seam contract §7) · **Research note**: `docs/research/04-relaxation.md` (DEC-11 gate — present; decides the formalism, the mechanism, `sacrificed` grounding, and the tie-break)

**Input**: `/relax` (`{world, commitments, seed} → {report: RelaxationReport, stamp}`). Called when a commitment set is unsatisfiable against a world (Meridian's R3m: both approaches mined, causeway dropped). It **generates** candidate plans that engage the mined water, **scores** each via the SPEC-07 scorer, reads each plan's **sacrifice set** off the `violated` verdicts, keeps the **inclusion-minimal** correction sets, ranks them lexicographically by commitment tier (least-worst first), and returns one `RelaxationCandidate` per surviving set — each `sacrificed` non-empty, each `narrative` in command language, same-tier orderings stated in `tie_break`. It never returns an empty candidate list and never silently drops a constraint (invariant G4).

## Honesty stance *(the point of this slice)*

Infeasibility is the moment a planner is most tempted to lie — to quietly drop the constraint that will not fit, or to hand back one "optimal" compromise as if the machine had weighed the trade the commander is paid to weigh. SPEC-09 refuses both by construction.

1. **Never silence (G4).** An unsatisfiable set returns a `RelaxationReport` whose candidates each *name* what they give up (`sacrificed`, non-empty). No constraint is dropped without a card saying so; the report is never empty.
2. **Never a weight (DEC-19).** Candidates are ranked by the commander's ordinal tiers (`must / should / prefer`) — never by a numeric sacrifice weight. Weighted CSP / MAX-SAT / Archimedean goal programming are rejected on honesty grounds (research note §1): a weight of 7-on-C3, 5-on-C4 is a ratio the commander never issued.
3. **Surface the frontier, don't pick the optimum.** `/relax` returns *every* inclusion-minimal way to restore feasibility (the minimal-correction-set view, research note §2), ranked least-worst-first — the must-sacrifice included, ranked last, never dropped. The commander weighs; the machine enumerates (JP 5-0: comparison is a commander's judgement).
4. **`sacrificed` is computed, not authored.** A commitment is sacrificed by a plan iff the reused SPEC-07 scorer returns `violated` for it — the strongest, unambiguous claim (the *best* realisation already fails). `tight`/`marginal` are risks, not sacrifices. The candidate route geometry is authored (it must enter the mined water — vignette §8 latitude), but which commitments each plan gives up is the scorer's verdict, not the author's.
5. **The tie-break is content-neutral and stated (DEC-19).** Two same-tier sacrifices (C3 and C4 are both `should`) are ordered by a stable, stated convention (commitment id), explicitly a *placeholder for commander-issued within-tier priority* — because encoding "civil harm outranks own-force exposure" (or the reverse) into code is the value judgement DEC-19 exists to prevent, in non-numeric clothing.

## User Scenarios & Testing *(mandatory)*

The scenarios play against the Meridian **R3m** world — the compile of the base knowledge (K1–K9 + resolved K12a) under the R3m excursion (both approaches mined, causeway dropped). Under R3m no plan satisfies C2, C3 and C4 together (vignette §6, by construction — thesis B).

### User Story 1 — three least-worst candidates, sacrificing C4, C3, C2 (Priority: P1) 🎯 exit

`/relax` over the R3m world returns a `RelaxationReport` with **three inclusion-minimal candidates**, distinguished by which of the mutually-unsatisfiable trio they give up: one sacrifices **C4** (parallel/fast sweep — the amphibious group crosses the mined strait unsuppressed), one sacrifices **C3** (fires forward — clears the berths but fires into the populated district), one sacrifices **C2** (sequential safe sweep — the strait opens two days late). Each `sacrificed` is non-empty; the report is not empty.

**Why this priority**: This is the Stage-4 exit verbatim (build plan §Stage 4; coverage matrix row B): "the R3 mining branch yields three candidates sacrificing C4, C3, C2 respectively; the cards state each sacrifice in command language; no silent constraint drops anywhere." It is the whole reason the slice exists.

**Independent Test**: Compile the R3m world; call `/relax` with C1–C6 and a fixed seed; assert the report has exactly three candidates, that the multiset of distinguishing sacrifices across them is `{C4}, {C3}, {C2}`, that every candidate's `sacrificed` is non-empty, and that each candidate resolves to a stored `Plan` whose verdict on its sacrificed commitment is `violated`.

**Acceptance Scenarios**:

1. **Given** the R3m world and the commitment set C1–C6, **When** `/relax` is called, **Then** it returns a non-empty `RelaxationReport` (G4).
2. **Given** the returned report, **When** the candidates' sacrifice sets are read, **Then** they are the three inclusion-minimal sets `{C4}`, `{C3}`, `{C2}` — one candidate each.
3. **Given** any candidate, **When** its plan is re-scored against R3m, **Then** exactly the commitments in its `sacrificed` list are `violated`, and every commitment *not* sacrificed is satisfied (`robust`/`marginal`).

---

### User Story 2 — no silent drops: minimality and never-empty (Priority: P1)

A candidate that gives up *more* than another (a strict superset of sacrifices) is **inclusion-dominated and excluded** — but the excluded plan's extra sacrifice is never a *silent* drop, because the surviving candidate that gives up less is in the report. And the report is **never empty**: even when every plan sacrifices something, the minimal sacrifices are returned as the least-worst options.

**Why this priority**: G4's two halves — "never empty, never a silent constraint drop" — are the invariant this slice exists to uphold (seam §G). A plan sacrificing `{C2,C4}` must not appear as a distinct option when `{C2}` and `{C4}` already do (that would present a strictly-worse trade as a choice); equally, the machinery must never return `{}` and imply feasibility where there is none.

**Independent Test**: Among the scored candidates include plans sacrificing `{C3,C4}` and `{C2,C4}`; assert neither appears in the report (each is a strict superset of a surviving singleton). Assert the report's candidate count equals the number of inclusion-minimal sacrifice sets, and is ≥ 1.

**Acceptance Scenarios**:

1. **Given** a candidate sacrificing `{C2,C4}` and candidates sacrificing `{C2}` and `{C4}`, **When** organised, **Then** the `{C2,C4}` candidate is excluded (inclusion-dominated) and both singletons survive.
2. **Given** any infeasible commitment set with at least one restorable feasibility, **When** `/relax` is called, **Then** the report has at least one candidate (never empty).
3. **Given** two candidates with the *same* sacrifice set, **When** organised, **Then** only one representative appears (no duplicate cards for the same trade).

---

### User Story 3 — least-worst ordering by tier, with a stated tie-break (Priority: P1)

The report ranks candidates **least-worst first** by the commander's ordinal tiers: a candidate that gives up only `should`s ranks above one that gives up a `must`. The must-sacrifice (C2) is **still returned**, ranked last. When two candidates tie on tier cost — C3 and C4 are both `should` — their order is set by a **stated** `tie_break`, never silently.

**Why this priority**: This is DEC-19 made observable ("within-tier ties in relaxation are broken explicitly and the tie-break is stated") and the lexicographic-priority formalism the research note chose (§2). Ranking a must-sacrifice last but *keeping it* is the difference between least-worst and hiding-the-bad-news.

**Independent Test**: Assert the C2-sacrifice candidate (a `must`) appears after both `should`-sacrifice candidates in the report order; assert the report carries a non-empty `tie_break` string that names the same-tier pair (C3/C4) and the stated convention used to order them.

**Acceptance Scenarios**:

1. **Given** candidates sacrificing `{C3}` (should), `{C4}` (should) and `{C2}` (must), **When** ranked, **Then** the two `should`-sacrifices precede the `must`-sacrifice in the report order.
2. **Given** the two `should`-sacrifices tie on tier cost, **When** ranked, **Then** `tie_break` states how they were ordered (commitment-id convention), flagged as a placeholder for commander priority — not a claim that one `should` outranks the other.
3. **Given** a commitment set whose minimal sacrifices are all the same tier, **When** ranked, **Then** `tie_break` is still present and stated (never a silent ordering).

---

### User Story 4 — every card states its sacrifice in command language, fully traced (Priority: P2)

Each `RelaxationCandidate` carries a `narrative` in **command language** naming the operational consequence — "the strait opens at D+9, two days late," "fires into the harbourfront where the craft berth among the fishing fleet," "the amphibious group crosses the mined strait unsuppressed" — never "C2 margin −6 steps." The banded `margin` the scorer computed rides underneath for the trace drawer (G2: on demand, never a headline). Every candidate opens a complete backward trace to named knowledge (G3).

**Why this priority**: The report *language* is the point of thesis B — infeasibility becomes an argument the commander reads in their own idiom (MDMP / JP 5-0 mission-analysis, research note §5). P2 because US1–US3 fix the *content* (which sacrifices, minimal, ordered); US4 fixes the *voice* and the trace, and renders the S3 least-worst cards.

**Independent Test**: Assert each candidate's `narrative` is non-empty command-language prose that mentions no decimal and no metric-internal token (`margin`, `m_lo`); assert the report writes `cited_in` edges from each candidate's verdicts to the report so a candidate opens a backward chain to knowledge (G3); render the S3 cards and assert one card per candidate naming its sacrifice.

**Acceptance Scenarios**:

1. **Given** a candidate, **When** its card renders, **Then** the sacrifice is stated in command language and no decimal or verdict-internal scalar appears on the card face (G2).
2. **Given** the report, **When** the `cited_in` edges are walked, **Then** each candidate reaches the verdicts it rests on, which reach the world, which reaches named knowledge (G3).
3. **Given** the gallery build, **When** it runs, **Then** the S3 least-worst cards are driven by the actual `/relax` over the R3m world, not by hand-authored fixture rows.

---

### User Story 5 — determinism (Priority: P2)

`/relax` is a pure function of `(world stamp, commitment set, seed, engine version)`: the same inputs return a byte-identical stamp and an identical ordered report.

**Why this priority**: G1 across the demonstrator; every downstream act (the commander's `/select`) cites a specific report, so a non-deterministic report makes the citation meaningless. P2 because US1–US3 are the exit and US5 is the cross-cutting invariant they must not violate.

**Independent Test**: Call `/relax` twice with identical inputs; assert identical `stamp` and identical ordered candidates (same plans, same `sacrificed`, same `narrative`, same `tie_break`). Change the world stamp (a different excursion) and assert the stamp changes.

**Acceptance Scenarios**:

1. **Given** a fixed `(world, commitments, seed)`, **When** `/relax` is called twice, **Then** both return the same stamp and the same ordered report.
2. **Given** a different world stamp, **When** called, **Then** the report stamp differs (the world stamp is part of the stamped input).

---

### Edge Cases

- **The commitment set is already satisfiable**: some candidate sacrifices nothing. `/relax` is defined for the infeasible case (seam §7); when a fully-feasible candidate exists its sacrifice set is empty, which is *not* a valid `RelaxationCandidate` (G4 requires `sacrificed` non-empty). The service returns the feasible plan as a distinct, first-class success signal (`feasible: true` with the satisfying plan), never a candidate with an empty `sacrificed` — feasibility is honestly *not* a relaxation.
- **No candidate restores feasibility** (every plan violates a `must` that cannot be given up): the report still returns the inclusion-minimal sacrifice sets (they will include the `must`) — G4 forbids an empty report, so the least-bad must-sacrifice is surfaced, ranked last, never suppressed.
- **A candidate with a severed route** (a leg crossing a zero-mobility region): the scorer returns `violated` with no margin; that commitment is counted as sacrificed (an unreachable objective is honestly given up), never skipped.
- **World refusal / unknown world ref**: `/relax` refuses `unknown_ref` (first-class, seam §1) when the world cannot be resolved; it never relaxes against a phantom world. A scorer refusal on a candidate (e.g. `stamp_mismatch`) is returned verbatim.
- **Ties across more than two same-tier sacrifices**: `tie_break` states the ordering convention once for all same-tier groups; the convention is stable and content-neutral (id order), so the ordering is reproducible and never a hidden judgement.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `/relax` MUST accept `{world: Ref, commitments: Ref[], seed: integer}` and return `{report: RelaxationReport, stamp}` on success or a first-class `Refusal` (seam §7). The `world` is a CompiledWorld carrying its excursion (scenario-blind, DEC-10).
- **FR-002**: The service MUST generate candidate plans whose routes engage the infeasible world's contested regions (the mined approaches / the timing that trades C2), each a valid `Plan` (DEC-20) with routes for the five Meridian force elements. Generation MUST be deterministic in `(seed)`.
- **FR-003**: Each candidate MUST be scored by the SPEC-07 scorer against the given world (reusing `ScoreService`, no re-implementation). A commitment is `sacrificed` by a candidate iff its scorer verdict is `violated`; `tight` and `marginal` are NOT sacrifices.
- **FR-004**: The service MUST keep the **inclusion-minimal** correction sets: a candidate is excluded iff another candidate's sacrifice set is a strict subset of its own. Candidates whose sacrifice sets are incomparable by inclusion (e.g. different singletons) MUST both survive. Duplicate sacrifice sets collapse to one representative.
- **FR-005**: The report MUST be **never empty** when the set is infeasible (G4): at least one inclusion-minimal candidate is returned. No constraint may be dropped without a candidate naming it in `sacrificed`.
- **FR-006**: Candidates MUST be ranked **least-worst first** by lexicographic tier cost — order by (musts sacrificed, then shoulds, then prefers), ascending. A candidate sacrificing a `must` MUST still be returned (ranked last), never dropped.
- **FR-007**: When two or more candidates tie on tier cost, their order MUST be set by a **stated, content-neutral convention** (commitment-id order) recorded in the report's `tie_break` prose (DEC-19). `tie_break` MUST be present whenever any same-tier ordering occurred and MUST NOT encode a value ranking between same-tier commitments; it is a placeholder for commander-issued within-tier priority.
- **FR-008**: Ranking and organisation MUST NOT use any numeric commitment weight, weighted sum, scalar total, or band midpoint (DEC-19, DEC-15).
- **FR-009**: Each returned `RelaxationCandidate` MUST have a non-empty `sacrificed` (G4) and a `narrative` in command language naming the operational consequence — no decimal, no verdict-internal token on the card face (G2). The banded `margin` stays available for the trace drawer only.
- **FR-010**: The service MUST write `cited_in` edges from each candidate's verdicts (and the scores they rest on) to the `RelaxationReport`, so every candidate opens a complete backward trace to named knowledge (G3, knowledge model §10 — the `cited_in` and `sacrificed_in` edges).
- **FR-011**: `/relax` MUST be deterministic: same `(world stamp, commitment set, seed, engine version)` ⇒ byte-identical stamp and identical ordered report (G1). The stamp is a hash over those inputs, never over materialised cells.
- **FR-012**: `/relax` MUST refuse `unknown_ref` (first-class) when the world ref cannot be resolved and persist nothing on refusal; a scorer refusal on a candidate MUST be returned verbatim.
- **FR-013**: When a fully feasible candidate exists (empty sacrifice set), the service MUST report feasibility as a first-class signal rather than emit a `RelaxationCandidate` with an empty `sacrificed` (G4 — `sacrificed` is non-empty by definition).

### Key Entities

- **RelaxationReport** (existing LinkML, G4) — `{world_stamp, scenario, candidates: RelaxationCandidate[], tie_break}`. Returned as `report`; stored and content-addressed.
- **RelaxationCandidate** (existing LinkML) — `{plan, sacrificed: LogicalId[] (non-empty), narrative}`. One per surviving inclusion-minimal sacrifice set.
- **Commitment** (existing LinkML, DEC-19) — `{tier: must|should|prefer, ...}`; the tiers drive the lexicographic ranking; no numeric weight slot exists.
- **Plan / ElementPlan / RouteLeg** (existing LinkML, DEC-20) — the authored candidate geometry (routes engaging the mined water); stored and content-addressed.
- **CommitmentVerdict.verdict** (existing LinkML, SPEC-07) — the four-stop scale the sacrifice set is read off (`violated` ⇒ sacrificed).
- **RelaxRequest / RelaxSuccess / RelaxResult** (service types, `src/seam.ts` — not stored) — the seam §7 movement shapes.
- **TraceEdge** (`cited_in`, `sacrificed_in`) — written by the relax service so candidates trace back to knowledge (G3).

## Success Criteria *(mandatory)*

- **SC-001**: `/relax` over the Meridian R3m world returns exactly three candidates whose distinguishing sacrifices are `{C4}`, `{C3}`, `{C2}`; each `sacrificed` is non-empty and the report is non-empty (G4). *(Stage-4 exit.)*
- **SC-002**: A candidate sacrificing a strict superset of another's sacrifices is excluded (inclusion-minimal); duplicate sacrifice sets collapse to one; the report is never empty.
- **SC-003**: Candidates are ranked least-worst first by tier (the C2 `must`-sacrifice ranks last but is returned); `tie_break` is present and states the content-neutral ordering of the C3/C4 same-tier pair.
- **SC-004**: For each candidate, re-scoring its plan against R3m marks exactly its `sacrificed` commitments `violated` and every other commitment satisfied — the sacrifices are computed by the scorer, not authored.
- **SC-005**: Every candidate opens a complete backward trace chain (candidate → verdicts → world → named knowledge) via `cited_in`/`scored_from` edges (G3).
- **SC-006**: Same `(world, commitments, seed)` ⇒ byte-identical stamp and identical ordered report; a different world stamp changes the report stamp (G1).
- **SC-007**: The S3 least-worst cards render in the gallery from the actual `/relax` over R3m — one card per candidate, its sacrifice in command language, no decimals on the card face (G2).
- **SC-008**: `npm run typecheck` clean; `npm test` green (SPEC-01…08 baseline plus the SPEC-09 suite); no schema change (`npm run gen` not run — `RelaxationReport`/`RelaxationCandidate`/`Plan` already exist).
