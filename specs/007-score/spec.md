# Feature Specification: Score — plan × world → verdicts + banded scores (SPEC-07)

**Feature Branch**: `claude/next-spec-bbbs94` (spec dir `007-score`)

**Created**: 2026-07-13

**Status**: Draft

**Stage**: Build-plan Stage 3 · **Depends on**: SPEC-01 (store), SPEC-02 (trace store), SPEC-06 (compile — CompiledWorld, sparse channels, VignetteConfig geometry), D3 (seam contract §5) · **Research note**: `docs/research/03-score-plan.md` (DEC-11 gate — present)

**Input**: The scorer unit (`POST /score`: plan × world × scenario → `CommitmentVerdict[]` + `PlanScore[]`, with the `knowledge_overrides` perturbation hook) — the delivery linchpin (DEC-10). It propagates banded metrics by interval arithmetic, maps each commitment to a four-stop verdict against a signed margin band, and writes `scored_from` edges so every verdict opens a complete trace chain. Its correctness leg is the vignette §9 oracle cases (O-1–O-3 reproduced exactly, O-4 as a property) — a deterministic, traced scorer that propagated intervals wrongly would pass every other exit while being exactly the false-precision machine ASSAY refuses.

## User Scenarios & Testing *(mandatory)*

Thesis A (an honest JIPOE pipeline) reaches the scorer here. SPEC-05 made the *knowledge* honest; SPEC-06 made the *world* honest; SPEC-07 makes the *judgement of a plan against that world* honest — banded, four-stop, backward-traceable to named owners, and monotone under uncertainty (G6). Every scenario is played on the Meridian fixtures (vignette §4–§6) except the oracle cases, which are the deliberately-abstract independent correctness leg (vignette §9). No assessed scalar crosses the seam unbanded (G2); verdicts cross only as the four-stop scale with `margin` shown on demand.

### User Story 1 — The scorer reproduces the oracle cases exactly (Priority: P1) 🎯 correctness leg

The scorer's inner loop is interval arithmetic and threshold comparison. The vignette §9 oracle cases pin exactly those parts, hand-computed on paper and binding on acceptance: O-1 (`start 2 + A[4,6] + B[3,5] = [9,13]`), O-2 (`[9,13]` vs `at_most 28` ⇒ **robust**, margin **[15,19]**), O-3 (`[9,13]` vs `at_most 12` ⇒ **neither robust nor violated**, and as the threshold sweeps 8→14 the verdict changes only at the band edges 9 and 13). The four-stop mapping is decided by research note `03-score-plan.md` §3 (signed margin bands, signs-only); this story is where that decision is proven against the oracle.

**Why this priority**: This is the whole reason SPEC-07 exists ahead of the generator (DEC-10, build plan §Stage 3): a scorer that is deterministic and fully traced but arithmetically wrong is the exact failure ASSAY is built to refuse, and it would pass every other exit criterion. The oracle is the independent leg that no other test provides.

**Independent Test**: Feed the abstract two-segment metric (`strait_open_step = start + dur(A) + dur(B)`) and the C2-style thresholds directly to the interval module and the verdict mapping; assert O-1's `[9,13]`, O-2's **robust** + `[15,19]`, and O-3's straddle verdict plus the band-edge-only transitions across the sweep. Expected values are the hand-computed constants, never regenerated from the scorer.

**Acceptance Scenarios**:

1. **Given** `start = 2`, `A = [4,6]`, `B = [3,5]` (assessed, banded — G2), **When** the metric is propagated, **Then** `strait_open_step = [9,13]` exactly — pure interval addition (O-1).
2. **Given** metric band `[9,13]` and commitment `at_most 28`, **When** it is scored, **Then** the verdict is **robust** and the `margin` band is `[15,19]` (O-2).
3. **Given** metric band `[9,13]` and commitment `at_most 12`, **When** it is scored, **Then** the verdict is **tight** — neither robust nor violated, both outcomes inside the band (O-3).
4. **Given** metric band `[9,13]` and `at_most T` for `T` swept 8→14, **When** each is scored, **Then** the verdict changes only at `T = 9` and `T = 13` and is constant between and outside them (O-3); the sweep yields violated (T<9), tight (9≤T<13), marginal (T=13), robust (T>13).

---

### User Story 2 — Propagation honesty holds under widening (Priority: P1)

Widening any input band never narrows any output metric band, and every point-realisation of the inputs scores inside the output band (candidate G6 / oracle O-4). This is banded honesty stated as a theorem: the scorer must be inclusion-monotone and sound, or its bands are decoration.

**Why this priority**: G6 is the machine-checkable form of the constitution's banded-honesty invariant (seam §G). It is P1 alongside US1 because the two together are SPEC-07's correctness leg — O-1–O-3 pin specific values, O-4 pins the property across all values.

**Independent Test**: Re-run O-1 with `A` widened `[4,6] → [3,7]`; assert `strait_open_step = [8,14] ⊇ [9,13]`. Then property-based (fast-check): for random bands, widenings, comparators and thresholds, assert output-superset-under-widening, point-realisation membership, and verdict-monotonicity (widening never yields a *more* confident verdict).

**Acceptance Scenarios**:

1. **Given** O-1 with `A` widened to `[3,7]`, **When** propagated, **Then** `strait_open_step = [8,14]` and `[8,14] ⊇ [9,13]` (O-4).
2. **Given** any input bands and any widening of one of them, **When** the metric is propagated, **Then** the output band contains the un-widened output band (inclusion monotonicity).
3. **Given** any point-realisation of the input bands (a scalar in each), **When** the metric is evaluated at those points, **Then** the scalar result lies within the banded output (soundness).
4. **Given** any commitment and a widening of the metric band, **When** re-scored, **Then** the verdict does not move toward *more* confidence (robust ← marginal ← tight ← violated is the only permitted direction of movement).

---

### User Story 3 — The honest matrix over real Meridian output (Priority: P2)

A commander looks at the S2 planner matrix: a handful of plans × the commitments C1–C6, each cell a four-stop chip, margin bands on hover, no decimals anywhere. Clicking any verdict opens a complete why-chain — verdict → the plan and the world it was scored against → the compiled channels → the named knowledge and its owners. This is the demo moment: **"the honest matrix — pick a verdict, walk it to the assessment and owner it rests on."**

**Why this priority**: It is the Stage-3 user-observable and the surface every depth stage (4–6) re-scores into. P2 because it composes US1/US2's correctness onto real fixture plans; the canned handful (2–3 hand-authored Meridian plans) is the sanctioned fallback for the generator (delivery plan §3) — a real scorer over a canned handful keeps every downstream consumer honest.

**Independent Test**: Score a hand-authored Meridian plan against the compiled base world; assert one `CommitmentVerdict` per commitment on the four-stop scale, each carrying a `margin` Band; assert a `scored_from` edge from each verdict to the world (and to the plan), so a backward trace walk reaches named knowledge; render the S2 matrix component and assert four-stop chips with margin-on-hover and no bare decimals in verdict cells.

**Acceptance Scenarios**:

1. **Given** a Meridian plan, the compiled base world, and the commitments C1–C6, **When** `/score` is called, **Then** it returns one `CommitmentVerdict` per commitment (four-stop `verdict`, `margin` Band) and the `PlanScore[]` banded criteria, with a stamp (seam §5).
2. **Given** a returned verdict, **When** its trace is walked backward, **Then** it reaches the CompiledWorld, the consumed knowledge, and the named owners — a complete chain (G3); a verdict with no backward chain is a defect.
3. **Given** the S2 matrix render, **When** it is inspected, **Then** every cell is a four-stop chip, `margin` appears only on hover as a band, and no verdict cell shows a decimal (ui-design §2, G2).
4. **Given** the robustness-trap plan under R1 vs R2 (thesis C), **When** both are scored, **Then** the R1-early-strait plan's C1/C2 verdicts are healthier under R1 than under R2 — the honest matrix shows the collapse the later Stage-5 exit dramatises (demonstrated here only as correct scoring, not yet as the scenario strip).

---

### User Story 4 — Determinism: same inputs, identical verdicts (Priority: P2)

Scoring the same plan against the same world with the same overrides yields a byte-identical stamp and identical verdicts and scores. The scorer is a pure function of its stamped inputs.

**Why this priority**: Every depth demo (sensitivity, discrimination, robustness) is a re-scoring loop; if the same inputs can produce two verdicts, the loops are theatre (DEC-4). P2 as it underwrites US3's reproducibility.

**Independent Test**: Score a plan twice against the same world; assert identical stamp, identical verdict list, identical margin bands. Present the commitment set in a different order; assert the returned verdicts are canonicalised to a fixed order and the stamp is unchanged.

**Acceptance Scenarios**:

1. **Given** a fixed plan, world, and (absent or fixed) overrides, **When** `/score` is called twice, **Then** both return the same stamp and the same verdicts/scores (G1; seam §5).
2. **Given** the commitments presented in a different order, **When** scored, **Then** the returned `CommitmentVerdict[]` is in a fixed canonical order and the stamp is unchanged.

---

### User Story 5 — The perturbation hook and the comparability guard (Priority: P3)

Sensitivity (Stage 6) is a re-scoring loop, not a fork: `knowledge_overrides` substitutes an answer *for this call only* — nothing is stored, no edge is written except on the returned artefacts' own lineage. And the scorer refuses to compare across incompatible stamps: if a plan's assumptions and the world disagree on stamp, `/score` refuses `stamp_mismatch` (the comparability guard), a first-class `Refusal` like every other seam decline.

**Why this priority**: The hook is what makes Stages 4–6 cheap re-scoring loops over one honest evaluator (delivery plan §critical-path); the guard is what stops the matrix silently comparing worlds that cannot be compared. P3 because the base scorer (US1–US4) stands without them, but they are in the seam §5 contract and cheap to land now.

**Independent Test**: Score with a `knowledge_overrides` entry substituting a wider band for one answer; assert the verdict moves toward uncertainty (US2 direction) and that the store and trace graph are unchanged apart from the returned verdict/score lineage. Score a plan carrying a stamp that disagrees with the world's; assert `Refusal{stamp_mismatch}` naming the disagreeing refs.

**Acceptance Scenarios**:

1. **Given** a `knowledge_overrides` entry widening one answer band, **When** `/score` is called, **Then** the affected verdict moves no more confident (G6) and **nothing is stored** beyond the returned verdict/score artefacts — the override is not persisted and writes no knowledge edge (seam §5).
2. **Given** a plan whose stamp lineage disagrees with the world's stamp, **When** `/score` is called, **Then** it refuses `stamp_mismatch`, `offending` naming the disagreeing refs, and persists nothing.

---

### Edge Cases

- **Severed route** (R3 zeroes `mobility.causeway` from its demolition step): a reach-step metric over a leg crossing a zero-mobility region has an unbounded duration — surfaced as a `violated` reach (the objective is unreachable), never an `Infinity` leaking into a band or a canonical-JSON throw.
- **Unit mismatch** in a metric composition (a fixture defect) is surfaced as an error at score time, never silently coerced (mirrors compile's config-defect surfacing).
- **Answer-absent knowledge** referenced by a metric: the metric reads the channel default (the world already dropped answer-absent objects at compile), so an open question does not crash scoring — it scores against the quiet baseline, which is itself banded.
- **Point band** (`lo = hi`) is a legal degenerate interval; a threshold exactly on it yields `marginal` (worst = best = on the line), consistent with the signs-only mapping.
- **`at_least`/`never`/`by_step`** comparators reduce to the signed margin band per research note §3; each is exercised (C5 `at_least`, C3 `at_most 0` behaving as a never-fire bound).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `/score` MUST accept `{plan: Ref, world: Ref, scenario: Ref, knowledge_overrides?: {ref, answer: Band}[]}` and return `{verdicts: CommitmentVerdict[], scores: PlanScore[], stamp}` or a first-class `Refusal` (seam §5).
- **FR-002**: Metric propagation MUST be interval arithmetic on pure closed bands (DEC-15) — `+`, `−`, `× scalar`, `max`, `min`, unit-checked — with **no** mean/mid/most-likely operation anywhere. It MUST reproduce O-1 (`[9,13]`) exactly.
- **FR-003**: Each commitment MUST be scored to a four-stop `verdict` via the signed margin band mapping (research note §3): `robust` iff `m_lo > 0`, `marginal` iff `m_lo = 0 ≤ m_hi`, `tight` iff `m_lo < 0 ≤ m_hi`, `violated` iff `m_hi < 0`. It MUST reproduce O-2 and O-3.
- **FR-004**: Every `CommitmentVerdict` MUST carry a `margin` Band; verdicts MUST cross the seam only as the four-stop scale (G2); no decimal appears in a verdict cell on any surface (ui-design §2).
- **FR-005**: The scorer MUST satisfy G6 (oracle O-4): inclusion-monotone under widening, sound under point-realisation, verdict-monotone toward uncertainty — asserted by property-based tests, not only the vignette instance.
- **FR-006**: Route metrics MUST be evaluated by `(cell, time)` resolution over the sparse world (research note §2) — lazy materialisation of the innermost active `RegionOverride` (later `from_step` wins) or the channel default — building no time-expanded graph and touching only cells a plan occupies.
- **FR-007**: On success the scorer MUST write a `scored_from` edge from each verdict/score to the world it was scored against, so every verdict opens a complete backward trace chain to named knowledge (G3).
- **FR-008**: The scorer MUST be deterministic: same plan + world + overrides ⇒ byte-identical stamp and identical, canonically-ordered verdicts/scores (G1). The stamp is a hash over inputs (plan ref, world stamp, overrides, engine version), never over materialised cells.
- **FR-009**: `knowledge_overrides` MUST substitute answers for the call only — persisting nothing and writing no knowledge edge; only the returned verdict/score artefacts join the store/trace on their own lineage (seam §5).
- **FR-010**: The scorer MUST refuse `stamp_mismatch` when a plan's assumption lineage and the world disagree on stamp (the comparability guard), naming the disagreeing refs and persisting nothing.
- **FR-011**: A severed route (zero-mobility region on a leg) MUST surface as a `violated` reach, never a non-finite band; unit mismatches MUST surface as a score-time error (config/fixture defect), never a silent coercion.
- **FR-012**: The scorer MUST be scenario-blind (DEC-10): it reads the already-excursioned world and does not re-derive the excursion; the `scenario` field is recorded on the verdicts for provenance only.

### Key Entities

- **CommitmentVerdict** (existing LinkML) — `{plan, commitment, scenario, world_stamp, verdict: VerdictBand, margin?: Band, engine_version}`. `verdict` is the four-stop scale; `margin` is on-demand only.
- **PlanScore** (existing LinkML) — `{plan, scenario, world_stamp, criterion, score: Band, engine_version}`. The banded criteria vector SPEC-08 will organise by non-domination.
- **Plan / ElementPlan / RouteLeg / TaskWindow** (existing LinkML, DEC-20) — timed routes + task windows; the scorer evaluates, never searches.
- **ScoreRequest / ScoreSuccess / ScoreResult** (service types, `src/seam.ts` — not stored) — the seam §5 movement shapes.
- **Band** (existing, DEC-15) — pure closed interval `{lo, hi, unit}`, no midpoint; the atom of every propagation.

## Success Criteria *(mandatory)*

- **SC-001**: O-1 reproduced exactly — `start 2 + A[4,6] + B[3,5] = [9,13]`.
- **SC-002**: O-2 reproduced exactly — verdict **robust**, margin **[15,19]**.
- **SC-003**: O-3 reproduced exactly — straddle verdict is neither robust nor violated, and the swept-threshold verdict changes only at band edges 9 and 13.
- **SC-004**: O-4 holds — `[8,14] ⊇ [9,13]` on the vignette widening, and the containment/monotonicity/soundness property holds under property-based testing.
- **SC-005**: A Meridian plan scores to one four-stop verdict per commitment C1–C6, each with a margin band; every verdict opens a complete backward trace chain to named owners.
- **SC-006**: Scoring the same inputs twice yields a byte-identical stamp and identical verdicts/scores; commitment order does not affect the stamp.
- **SC-007**: `knowledge_overrides` re-scores without persisting the override; `stamp_mismatch` refuses across incompatible stamps and persists nothing.
- **SC-008**: The S2 matrix renders four-stop chips with margin-on-hover and no decimals in verdict cells; the gallery shows the honest-matrix demo moment run by the actual scorer.
- **SC-009**: `npm run typecheck` clean; `npm test` green (SPEC-06 baseline plus the SPEC-07 suite); oracle expected values are committed constants, never regenerated.
