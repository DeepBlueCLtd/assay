# Feature Specification: Handful — generate → score → organise into a banded non-dominated handful (SPEC-08)

**Feature Branch**: `claude/next-spec-tkiz9e` (spec dir `008-handful`)

**Created**: 2026-07-13

**Status**: Draft

**Stage**: Build-plan Stage 3 · **Depends on**: SPEC-07 (scorer — `ScoreService`, `CommitmentVerdict.margin`, deterministic stamp), SPEC-06 (compile — CompiledWorld, VignetteConfig geometry), D3 (seam contract §6) · **Research note**: `docs/research/03-score-plan.md` §5 (DEC-11 gate — present; defines banded ε-non-domination and Meridian's four generation axes)

**Input**: `/plan/handful` (`{world, seed, count?} → {plans: Ref[], scores: PlanScore[], organisation: {distinct_because}, stamp}`) — the last unit of the spine (delivery plan §δ). It **generates** candidate plans by a seeded, strategy-biased fan-out over the vignette's four domain axes, **scores** each via the SPEC-07 scorer, and **organises** them by banded ε-non-domination into 3–5 genuinely distinct plans. It is *sacrificial scope* (delivery plan §3): the generator can slip to the gate because a canned handful over the honest scorer already demonstrates four theses — but the honest generator is what makes "3–5 genuinely distinct plans for the Meridian baseline" a computed exit rather than a hand-set one.

## Honesty stance *(the point of this slice)*

The handful is where the demonstrator could most easily cheat: pick a flattering three, call them "the options", and bury the trade. SPEC-08 refuses that by construction.

1. **The organiser never invents precision.** Distinctness is banded ε-non-domination on the scorer's **margin bands** — the conservative interval order (`A ⪯ B` iff `A.hi ≤ B.lo`, research note §5). Two plans whose criteria bands *overlap* are honestly incomparable and both survive; a plan is dropped only when another is conservatively at-or-above it on **every** commitment and strictly separated-above on at least one. No scalar total, no weighted sum, no midpoint (DEC-15, DEC-19) ever decides membership.
2. **The generator is honest fan-out, not cherry-picking.** Candidates come from the domain's own four axes (research note §5.2 — approach, suppression posture, causeway, extraction coupling), enumerated deterministically. The handful is what the organiser leaves standing, not what an author chose to show.
3. **Every member is fully traced.** Each plan is content-addressed and stored; each verdict carries the `scored_from` edge the scorer wrote (G3). A handful member with no backward chain is a defect.
4. **`distinct_because` is derived, not decorative.** Each returned reason names *why* the organiser kept that plan — the commitments it leads on and its axis signature — so the "why is this in the set" question has a computed answer, not a caption.

## User Scenarios & Testing *(mandatory)*

The scenarios play on the Meridian base world (the resolved compile of SPEC-06/07 — K1–K9 + resolved K12a). The handful over the base world is the Stage-3 user-observable; the depth stages (4–6) re-score into the same S2 matrix.

### User Story 1 — 3–5 genuinely distinct plans for the Meridian baseline (Priority: P1) 🎯 exit

`/plan/handful` over the Meridian base world returns **between three and five plans, each genuinely distinct in banded space** — none ε-dominates another across the C1–C6 margin vector. The organiser produced the set; no author hand-picked it.

**Why this priority**: This is the Stage-3 handful exit (build plan §Stage 3, coverage matrix G1 row): "`/plan/handful` returns 3–5 genuinely distinct plans for the Meridian baseline." It is the whole reason the slice exists.

**Independent Test**: Generate over the base world with a fixed seed; assert `3 ≤ plans.length ≤ 5`, that every pair is mutually non-dominated (neither ε-dominates the other on the margin vector), and that each returned plan resolves to a stored `Plan` with a distinct route geometry.

**Acceptance Scenarios**:

1. **Given** the Meridian base world and a fixed seed, **When** `/plan/handful` is called, **Then** it returns 3–5 plan refs, each resolving to a stored `Plan`.
2. **Given** the returned handful, **When** every pair is checked, **Then** neither member of any pair ε-dominates the other on the C1–C6 margin vector (banded non-domination, research note §5).
3. **Given** the returned handful, **When** each plan is scored, **Then** the members occupy genuinely different criteria profiles — at least two commitments on which the handful shows more than one distinct verdict.

---

### User Story 2 — Same stamp + seed ⇒ identical handful (Priority: P1)

Calling `/plan/handful` twice with the same world stamp and the same seed returns a byte-identical stamp, the same plan refs in the same order, and the same `scores`/`organisation`. The handful is a pure function of `(world stamp, seed, count, engine version)`.

**Why this priority**: The Stage-3 exit names it explicitly (coverage matrix G1: "same stamp + seed ⇒ identical handful") and every downstream demo (sensitivity/discrimination/robustness) re-runs the handful; a non-deterministic handful makes those loops theatre (DEC-4). P1 alongside US1 as the two together *are* the exit.

**Independent Test**: Call twice with identical `(world, seed)`; assert identical `stamp`, identical `plans` (same order, same content hashes), identical `scores` and `distinct_because`. Change only the seed; assert the stamp changes (the seed participates in the stamp).

**Acceptance Scenarios**:

1. **Given** a fixed world and seed, **When** `/plan/handful` is called twice, **Then** both calls return the same stamp, the same ordered plan refs, and the same organisation.
2. **Given** the same world and a different seed, **When** called, **Then** the stamp differs (the seed is part of the stamped input) and the handful may differ.
3. **Given** the same seed and a world recompiled to a different stamp, **When** called, **Then** the handful stamp differs (the world stamp is part of the stamped input).

---

### User Story 3 — The organiser drops only conservatively-dominated plans (Priority: P1)

The banded ε-non-domination organiser keeps every plan that any other does not conservatively beat on all criteria. A plan is excluded **only** when another is at-or-above it on every commitment margin (`A ⪯ B` fails nowhere) and strictly separated-above (by ε) on at least one. Overlapping bands are incomparable and both survive.

**Why this priority**: This is the honesty core (stance §1). An organiser that dropped a plan on a scalar total, a midpoint tie-break, or a weighted score would be the false-precision machine ASSAY refuses (DEC-15, DEC-19). It is testable independently of the generator on constructed criteria vectors, so it is P1 and specified against hand-built cases.

**Independent Test**: On constructed banded criteria vectors: assert a strictly-worse-everywhere plan is dominated and dropped; assert two plans with overlapping bands on any criterion are both kept; assert `ε` widening only ever *keeps more* plans (monotone in ε); assert the relation is irreflexive (no plan dominates itself) and asymmetric.

**Acceptance Scenarios**:

1. **Given** plan A whose every C1–C6 margin band is conservatively above plan B's (`B.hi ≤ A.lo` on all, strict on one), **When** organised, **Then** B is dominated and excluded, A retained.
2. **Given** plans A and B whose margin bands overlap on at least one commitment, **When** organised, **Then** neither dominates the other and both are candidates for the handful.
3. **Given** a fixed candidate set, **When** ε is increased, **Then** the non-dominated set never shrinks (ε is the organiser's distinctness knob, research note §5) — more plans read as distinct, never fewer.
4. **Given** any plan, **When** compared to itself, **Then** it does not dominate itself (irreflexive); and if A dominates B then B does not dominate A (asymmetric).

---

### User Story 4 — Generation is honest fan-out over the domain's four axes (Priority: P2)

Candidate plans are produced by a **strategy-biased, seeded** fan-out across the Meridian axes (research note §5.2): **approach** (strait-early vs sweep-first), **suppression posture** (fires-forward vs stand-off), **causeway** (contest vs bypass), **extraction coupling** (pull-out early vs mission-tail). Each candidate is a valid `Plan` (routes for the five force elements, DEC-20); the fan-out is deterministic and reproducible.

**Why this priority**: The four axes are the vignette's own (concept §6.2 gate — REMIT's axes "do not transfer unexamined"), decided in the research note; the generator is the machine that turns them into candidates. P2 because the exit (US1/US2) constrains the *output* of generation, and the axes are the honest *means*; a different valid fan-out that still yields 3–5 distinct plans would satisfy the exit.

**Independent Test**: Generate the candidate set for a fixed seed; assert every candidate validates as a `Plan` against the generated types, that the four axes each vary across the set (both settings of each axis appear), and that generation is deterministic (same seed ⇒ identical candidate list).

**Acceptance Scenarios**:

1. **Given** a fixed seed, **When** the candidate set is generated, **Then** every candidate is a valid `Plan` with routes for the five Meridian force elements (FE-BROOM, FE-PACKHORSE, FE-ANVIL, FE-FALCON, FE-KINGFISHER).
2. **Given** the candidate set, **When** its axis signatures are read, **Then** both settings of each of the four axes appear (the fan-out spans the axes, not one corner).
3. **Given** the same seed, **When** candidates are generated twice, **Then** the two candidate lists are identical (deterministic generation).

---

### User Story 5 — The honest matrix over the generated handful, with `distinct_because` (Priority: P2)

The S2 planner matrix now renders the **generated** handful (replacing the canned P1/P2), each plan a row of four-stop chips (margin on hover, no decimals), alongside a `distinct_because` line per plan naming why the organiser kept it. This is the Stage-3 demo moment made honest end-to-end: *pick a verdict, walk it to the assessment and owner it rests on* — and now, *see why this plan is one of the handful.*

**Why this priority**: It is the user-observable and the surface the depth stages re-score into. P2 because it composes US1–US4's correctness onto the gallery; the S2 matrix component already exists (SPEC-07) and is reused unchanged, fed by the generated handful.

**Independent Test**: Run `/plan/handful` in the gallery build over the resolved base world; render the S2 matrix over the returned plans and a `handfulStrip` over the `organisation`; assert four-stop chips with margin-on-hover and no decimals, and a non-empty `distinct_because` per plan.

**Acceptance Scenarios**:

1. **Given** the generated handful, **When** the S2 matrix renders, **Then** every cell is a four-stop chip, margin appears only on hover, and no verdict cell shows a decimal (G2, ui-design §2).
2. **Given** the returned `organisation`, **When** the handful strip renders, **Then** each plan carries a `distinct_because` reason naming the commitments it leads on and its axis signature.
3. **Given** the gallery build, **When** it runs, **Then** the honest-matrix demo moment is driven by the actual `/plan/handful`, not by hand-authored fixture rows.

---

### Edge Cases

- **Fewer than three non-dominated candidates**: if the honest organiser leaves fewer than three plans standing, that is a *signal*, not something to pad — the service returns what stands and the test surfaces it (for the engineered Meridian base world the axes are designed to yield ≥ 3; this case guards against silent padding).
- **More non-dominated candidates than `count`**: the service caps at `count` (default 5) by a deterministic, seed-driven **diversity** selection over axis signatures — never by a scalar score (that would smuggle a weighting in through the cap). The drop is logged in `distinct_because` framing, never silent.
- **`count` out of the 3–5 band**: a `count` below 3 or above 5 is clamped to the contract band (seam §6), not honoured blindly.
- **A severed / unreachable objective in a candidate** (a route crossing a zero-mobility region): the scorer already returns `violated` with no margin; the organiser treats an absent margin as the worst possible on that criterion (a `violated` plan is conservatively dominated there), never as a gap to skip.
- **World refusal / unknown world ref**: `/plan/handful` refuses `unknown_ref` (first-class, seam §1) when the world cannot be resolved; it never scores against a phantom world.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `/plan/handful` MUST accept `{world: Ref, seed: integer, count?: 3..5}` and return `{plans: Ref[], scores: PlanScore[], organisation: {distinct_because: string[]}, stamp}` or a first-class `Refusal` (seam §6). `count` MUST be clamped to `[3,5]` (default 5).
- **FR-002**: Generation MUST be a seeded, strategy-biased fan-out over the four Meridian axes (research note §5.2). Every candidate MUST be a valid `Plan` (DEC-20) with routes for the five force elements, and generation MUST be deterministic in `(world, seed)`.
- **FR-003**: Each candidate MUST be scored by the SPEC-07 scorer against the given world (reusing `ScoreService`, no re-implementation); the criteria vector for organisation is the per-commitment **margin bands** (satisfied ⟺ margin ≥ 0 — uniform orientation, higher is better).
- **FR-004**: Organisation MUST be banded ε-non-domination on the conservative interval order (research note §5): A ε-dominates B iff A is no worse than B on every criterion (`B.lo ≤ A.hi`) and strictly separated-above by ε on at least one (`A.lo ≥ B.hi + ε`). The handful is the ε-non-dominated set. `ε` defaults to 0 (scale-free conservative non-domination) and MUST be monotone: increasing ε never shrinks the set.
- **FR-005**: The domination relation MUST be irreflexive (no plan dominates itself) and asymmetric (A dom B ⇒ ¬(B dom A)); it MUST NOT use any scalar total, weighted sum, or band midpoint (DEC-15, DEC-19).
- **FR-006**: A `violated` verdict (no margin — an unreachable objective) MUST be treated as the conservatively worst value on that criterion, so a plan failing a `must` is dominated there, never skipped.
- **FR-007**: When the non-dominated set exceeds `count`, the service MUST cap it by a deterministic, seed-driven diversity selection over axis signatures — never by a scalar score. When it is below `count`, the service returns all non-dominated plans (no padding).
- **FR-008**: The handful MUST be deterministic: same `(world stamp, seed, count, engine version)` ⇒ byte-identical stamp and identical ordered `plans`/`scores`/`organisation` (G1). The stamp is a hash over those inputs, never over materialised cells.
- **FR-009**: Every returned plan MUST be content-addressed and stored (so its ref resolves), and MUST carry the scorer's `scored_from` edges on its verdicts, so every handful member opens a complete backward trace chain to named knowledge (G3).
- **FR-010**: `distinct_because` MUST be **derived** from the organisation (the commitments each plan leads on + its axis signature), one entry aligned to each returned plan; it MUST NOT be a hand-authored caption.
- **FR-011**: `/plan/handful` MUST refuse `unknown_ref` (first-class) when the world ref cannot be resolved, and persist nothing on refusal.
- **FR-012**: `/plan/handful` MUST NOT compute a `knowledge_overrides` perturbation (that stays scorer-only — seam §6 open question 3), and MUST NOT call `/relax` (the commitment set stays whole; relaxation is SPEC-09).

### Key Entities

- **Plan / ElementPlan / RouteLeg** (existing LinkML, DEC-20) — the generated candidates; timed routes for the five force elements. Stored and content-addressed.
- **PlanScore** (existing LinkML) — the banded criteria per plan; returned in `scores`.
- **CommitmentVerdict.margin** (existing LinkML, SPEC-07) — the oriented banded criterion the organiser reads; never crosses the seam as a scalar.
- **HandfulRequest / HandfulSuccess / HandfulResult** (service types, `src/seam.ts` — not stored) — the seam §6 movement shapes; `organisation.distinct_because` is a derived view, not a stored object.
- **AxisSignature** (internal, not at the seam) — the four-axis label of a candidate; drives generation and the diversity cap.

## Success Criteria *(mandatory)*

- **SC-001**: `/plan/handful` over the Meridian base world returns 3–5 plans, every pair mutually non-dominated on the C1–C6 margin vector.
- **SC-002**: Same `(world, seed)` ⇒ byte-identical stamp and identical ordered `plans`/`scores`/`organisation`; changing the seed changes the stamp.
- **SC-003**: The organiser drops a strictly-worse-everywhere plan, keeps overlapping-band plans, is monotone in ε, and is irreflexive + asymmetric — proven on constructed criteria vectors.
- **SC-004**: Generation is a deterministic fan-out spanning both settings of all four Meridian axes; every candidate validates as a `Plan`.
- **SC-005**: Every handful member resolves to a stored `Plan` and every verdict opens a complete backward trace chain (G3).
- **SC-006**: `distinct_because` is derived and non-empty per plan; the S2 matrix + handful strip render in the gallery from the actual `/plan/handful` with four-stop chips, margins on hover, and no decimals (G2).
- **SC-007**: `npm run typecheck` clean; `npm test` green (SPEC-07 baseline plus the SPEC-08 suite); no schema change (`npm run gen` not run in this slice).
