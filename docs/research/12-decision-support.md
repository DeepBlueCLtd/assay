# Research note 12 — Decision support: decision points, commit steps, and LTIOV, derived

Review slice S-D (SPEC-24) · per ASSAY-DEC-11 · 2026-07-16 · the keystone slice of the review series
Prompts (review `docs/reviews/2026-07-14-jipoe-c2-process-review.md` §4.2, mockup M1, action B1, addendum §10 slice S-D): JIPOE earns its keep in doctrine at the artefact ASSAY stops one step short of — the **decision support template/matrix (DST/DSM)**: decision points tied to the intelligence that discriminates them, with a latest time the information is of value (LTIOV). ASSAY has quietly built every ingredient; missing is only the artefact that assembles them — the one a J-3 actually recognises. This note decides the three derivation rules the artefact needs: **(a)** what constitutes a decision point, **(b)** the commit step, **(c)** the LTIOV computation with its answerable-in-time predicate and honest red branch. Output feeds SPEC-24 (`specs/024-decision-support-matrix/`). Per DEC-5 the slice is a projection plus these derivation rules, not a new engine (DEC-10).

## 1. The doctrinal frame — what a DSM is, and what ASSAY may honestly compute of it

JP 2-01.3 (JIPOE step 4) hands the planning process a linked product set: adversary COAs (situation templates), the **event template/matrix** — named areas of interest (NAIs) with the *indicators* that confirm or deny each COA and the time windows in which they are observable — and, joined to the friendly plan through wargaming (JP 5-0 ch. III; FM 6-0 ch. 9), the **decision support template/matrix**: for each *decision point*, the decision at stake, the NAI whose indicator informs it, and the **latest time information is of value** — the time by which the answer must reach the commander to still matter (ATP 2-01, collection management, computes LTIOV against the decision point's time). CCIRs/PIRs are exactly the questions elevated because a commander's decision hangs on them (JP 5-0). Doctrine asks staffs to *eyeball* this assembly; every ingredient in it is something ASSAY already holds as a typed object:

| DSM ingredient (doctrine) | ASSAY object, already built |
|---|---|
| decision point | a commitment whose verdict turns on open information — scenario-divergent or on the margin (SPEC-07/10 verdicts) |
| NAI indicator | the open question's `expected_answers` event matrix (DEC-18, SPEC-12/23) |
| collection asset & timing | `CollectionOption` with banded `cost` and `earliest_result` (knowledge model §4) |
| LTIOV | `earliest_result` vs the plan-geometry step at which the branch closes (DEC-20 stated routes) |
| DSM re-validation | validity windows + staleness flags (SPEC-13, thesis F) |

The one genuinely new thing is the **derivation rule** joining them. That rule is a ranking/semantics decision of the same class as DEC-18 (computed, never asserted) and is where a synthesised urgency scalar would sneak in — hence this note, research-first, before any pixel.

**The honesty stance, restated as three binding rules.** The DSM is where a tool most wants to *task* people. ASSAY's DSM ranks and derives, never tasks and never decides: (1) every row is **derived** — from verdicts, discrimination, validity windows, and plan geometry; no authored rows; (2) every quantity is a **band, a step, or a verdict** — no urgency, priority, or risk scalar anywhere (DEC-19), costs stay separate bands; (3) a decision that cannot be informed in time renders as exactly that — the honest **red** state with its arithmetic, never dropped, never softened (G4's spirit at the collection layer). Tasking the collection remains a human act with its own commitment consequences — the walkthrough's KINGFISHER/C6 discipline, unchanged: committing DET KINGFISHER against K11 is scored by C6 (extraction by D+12), and only a human weighs that.

## 2. The decision-point predicate, decided

**A commitment `c` on plan `p` is a decision point iff new information could change what the commander must do.** Two computable evidence classes, either sufficient, both carried when both hold:

- **(i) Scenario-divergent**: there exists a pair of adversary COAs `{a, b}` in the live tensor (SPEC-10) with `verdict(p, c, a) ≠ verdict(p, c, b)`. The decision turns on *which world we are in* — the classic branch DP, and exactly SPEC-23's operative-pair derivation applied per-row (verdict divergence only; no curation, no likelihood — K14 never enters, the §9 firewall). Divergence is measured over the **adversary COA vocabulary** (R1/R2/R3): a divergence against the un-excursioned BASE world is real evidence about the plan but names no adversary COA and no `expected_answers` row exists for it by construction (note 08 §7.1) — the BASE-only-divergence case is out of scope for v1, stated.
- **(ii) Margin-class**: the verdict under the **selected world** is `tight` or `marginal` — the margin band straddles or touches the line (note 03 §3), so a changed answer could tip it. The decision turns on *the width of what we know*, not on scenario identity.

**Non-DPs, decided (the honest empty state's grammar):** uniformly `robust` — nothing turns on open information; uniformly `violated` with no divergence — a plan defect, not a decision; the honest surface for that is the matrix and `/relax` (G4), never a DSM row that would dress a dead commitment as a live decision. When no commitment qualifies, the surface renders "**no verdict turns on open information**" — itself decision-relevant, never padded.

**Row order is stated presentation order** — commitment `logical_id` — carrying no priority claim. Any "which decision is most urgent" ordering is a value judgement over incomparable bands and steps; the arithmetic (commit steps, slack, red states) is displayed per row and the ranking is the commander's act (DEC-19). This is the same latitude note 11 §2 spent on within-layer order.

## 3. The commit step, decided

Doctrine anchors a DP in time and place: the decision must be taken **before the force is committed** to the branch. ASSAY's plans are stated routes with task windows (DEC-20), so commitment is geometric and derivable:

- **Scenario-divergent DP on a route-reading metric** (`reach`, `exposure` — the metric registry names the responsible element, fixed or via the commitment's `scope`): the **commit step is the `enter_step` of the first route leg whose metric-channel read differs across the live COA worlds** — `channelAt(world, kind, leg.x, leg.y, leg.enter_step)` compared across R1/R2/R3, exactly the points the scorer reads (`metrics.ts`). From that step the element is inside geometry the scenarios disagree about; the branch is taken and later information can steer nothing. For these metric kinds a divergent verdict implies a divergent leg read by construction (the metric is interval arithmetic over exactly these reads); the defensive branch — divergence with no divergent leg found — renders a **stated absence** ("commit step underivable"), never an invented step. A `fires` metric reads only the plan's own geometry and cannot scenario-diverge; it can reach the DSM only as margin-class.
- **Scenario-divergent DP on a `state` metric** (no route; the world answers at the horizon — C5's causeway): the DP is **world-decided** — no plan branch forecloses it. The commit step is assigned the **horizon step** (the read time), rendered in words as world-decided: information is of value until the horizon read, but no route commits. (The review's edge case, decided per the spec's stated option, not improvised.)
- **Margin-class-only DP** (no scenario divergence): there is no scenario branch and no divergent geometry to enter. **No commit step and no LTIOV exist**; the row renders the stated absence — "margin-class: turns on the width of answered knowledge, not on scenario identity — see the sensitivity ranking (thesis E)" — and its discriminator column is empty by the same logic (no COA pair to separate). Assigning these rows a fabricated step would manufacture urgency; the honest content of the row is the margin band itself.

## 4. LTIOV and answerable-in-time, decided

**LTIOV = commit_step − lead, with lead = 0 in v1, stated.** LTIOV is defined on the **scenario clock only** (DEC-17) — steps, never wall time. A non-zero `lead` (decision-cycle latency: how long between the answer arriving and the order taking effect) is a real quantity, but it is an *assessment someone must author*, with provenance and a band, not a constant the engine invents — deferred, stated on the surface as "lead 0 (v1)".

**The answerable-in-time predicate**, per collection option on each attached question:

```
in_time(option) ⟺ option.earliest_result ≤ ltiov
```

with three rendered states, never collapsed: **in time** (`earliest_result ≤ ltiov`, slack = `ltiov − earliest_result` shown as a step count); **cannot answer in time** — the honest **red** state, rendered with its arithmetic visible (`earliest_result 8 > commit step 2`), never dropped for being red (a foreclosed decision is exactly what a J-3 needs to see); and **unstated** — a collection option with no `earliest_result` renders "no earliest result stated", never assumed answerable: absence of assessment is not an assessment (note 11 §2's rule, applied to time). Where several collection options exist, **all** render with their banded costs and in-time states; no combined cost-value scalar orders them (DEC-19) — the existing discrimination separation is the only ranking, and it ranks questions, not assets.

## 5. Discriminators and tripwires — reuse, not invention

**Discriminators (the NAI-indicator column).** For each scenario-divergent DP, the evidence pairs are the COA pairs its verdicts diverge across — the DP's *own* operative pairs, sharper than SPEC-23's global derivation because the row itself is the witness. The attached discriminators are the open questions (`expected_answers` present) whose bands could settle at least one evidence pair — classification via the existing `classifySeparation` (note 08 §7.2): `disjoint` or `partial` can discriminate; `nested` cannot and is excluded from attachment emphasis exactly as SPEC-23 excludes it from could-discriminate. Questions order within the row by best separation over the evidence pairs (the SPEC-12/23 machinery, untouched), ties by `logical_id`. **A DP whose evidence pairs no question can settle renders as a named intelligence gap** — "no knowledge in the KB separates R_a from R_b" — the doctrinally correct output (gap → collection requirement, JP 2-01.3), never an empty cell.

**Tripwires (DSM re-validation).** A tripwire on a DP row is a consumed knowledge object whose validity window **lapses before the row's commit step** (`valid_until < commit_step`): at the moment the commander must commit, the world the verdict rests on will contain lapsed knowledge — re-validate before deciding (thesis F's discipline at the decision layer; lapse marked, never carried — note 10 §2). Scope is the **selected world's consumed set**, which is the trace graph's real granularity (verdict → `scored_from` → world → `compiled_into` → knowledge); per-verdict channel-level dependency is *not* claimed — the row says "the world under this decision lapses", not "this verdict reads K9", and the rendering words it that way (no over-report, G6's spirit in attribution).

## 6. What this deliberately does not model, stated

- **TAIs and execution** — no engagement options, no synchronization matrix, no execution model (out of scope for the demonstrator, as the crosswalk already states).
- **NAI geography** — a `CollectionOption` has no geographic anchor (review §4.1); the NAI analogue is the *question*, textual. A later increment can locate DPs on the SPEC-19 map (a decision point is a place and a time); v1 does not.
- **Decision-cycle lead** — `lead = 0`, stated (§4).
- **Branch plans** — the DSM points at a decision; it does not hold the branch COA. `/select` and branches are later work.
- **Tasking** — no write affordance beyond the traces (FR-007; the KINGFISHER/C6 discipline, §1).
- **BASE-only divergence** — out of scope v1 (§2), stated.

## 7. The predicted Meridian exhibit (the pinned fixture table)

Derived by hand from the frozen tableau (fixtures at engine 0.2.0; selected world BASE; tensor over the canned P1/P2 × {BASE, R1, R2, R3}; adversary vocabulary {R1, R2, R3}; timestep 6 h, 4 steps/day). K11's collection: DET KINGFISHER close reconnaissance, cost [2,4] det-days, `earliest_result` 8. K13's: standoff intercept, cost [0.2,0.5] det-days, `earliest_result` 4. K9 validity [8, 36].

**P2 · Sweep-first / fires-forward** — three decision points:

| DP | evidence | commit step | LTIOV | discriminators (evidence-pair classes) | in-time | tripwires |
|---|---|---|---|---|---|---|
| C1 (must) | divergent: R2 `violated` vs R1/R3 `robust` (pairs {R1,R2}, {R2,R3}) | **10** — FE-PACKHORSE enters the strait leg (26,25) at step 10; mobility reads R2 [0.1,0.4] vs [1,1] | 10 | K11 ({R1,R2} disjoint, sep +0.5; {R2,R3} partial), K13 (partial) | KINGFISHER **in time** (8 ≤ 10, slack 2 steps); intercept in time (4 ≤ 10) | — |
| C2 (must) | divergent: same pairs | **2** — FE-BROOM enters the strait at step 2 | 2 | K11, K13 (as above) | KINGFISHER **red** (8 > 2); intercept **red** (4 > 2) — the sweeper is committed before any collection can report; sweep-first *is* the hedge | — |
| C5 (prefer) | divergent: R3 `violated` vs R1/R2 `marginal` (pairs {R1,R3}, {R2,R3}) **and** margin-class (BASE `marginal`) | **56** — world-decided (`state` metric, horizon read) | 56 | K11 ({R1,R3} disjoint; {R2,R3} partial), K13 (partial) | both in time trivially | **K9 lapses at 36 < 56** — the world under the horizon read rests on a lapsed forecast |

Non-DPs on P2, by the predicate: C3 (uniformly `violated` — plan defect, relax's business), C4 and C6 (uniformly `robust`).

**P1 · Strait-early / battery-suppression** — five decision points: C1 and C2 divergent with **commit step 4** (FE-PACKHORSE and FE-BROOM enter the strait at step 4) — KINGFISHER **red** (8 > 4) on both; C3 margin-class only (`marginal` everywhere — no commit step, stated absence, see sensitivity); C4 divergent (R2 `robust` vs `tight`) and margin-class (BASE `tight`), **commit step 8** (FE-ANVIL enters (32,22) at step 8) — KINGFISHER in time **exactly at the boundary** (8 ≤ 8, slack 0); C5 as P2's.

**The thesis moment the artefact buys:** P1 forecloses the port/strait decision at step 4 — a day before KINGFISHER can report (step 8 = D+2) — while P2 holds it open to step 10. The DSM shows, derived not drawn, *why sweep-first buys decision space*: the strongest doctrinal exhibit available to the future C2 application, and it is arithmetic a J-3 can check on their fingers.

## 8. The surface, recommended: an S2-adjacent commander panel, not a sixth tab

The DSM is a commander/J-3 artefact projected from the same tensor the scenario strip renders. Recommendation: a **"Decisions in time" panel on the commander tab**, directly beneath the scenario strip (an S2-adjacent mode), *not* a new top-level tab — DEC-32's four role tabs stand unextended (the Spatial tab was a cross-role *surface*; this is a commander projection, exactly what the commander tab is for). One row per DP; band pills and step counts throughout; provenance chips on every assessed element (expected answers carry their SPEC-23 chips; tripwires carry the knowledge chip); the in-time/red/unstated states and the tripwire mark keyed in the per-component legend; the same comparability guard as every surface (a mixed-stamp tensor cannot derive divergence — margin-class rows only, stated); rows re-derive and glow value-keyed on recompile (G6). **No tasking affordance** — the collection option renders with its cost band and its trace, and nothing else (FR-007).

## What we will do differently

1. **Adopt the two-class DP predicate** — scenario-divergent (per-row operative pairs, verdict divergence only, adversary vocabulary) or margin-class (`tight`/`marginal` under the selected world) — with uniform-`robust` and uniform-`violated` explicitly non-DPs and the honest empty state worded. No free parameters beyond the stated ones.
2. **Derive the commit step from plan geometry via the metric's own reads**: first divergent-read leg's `enter_step` for route-reading metrics; horizon step, worded world-decided, for `state` metrics; stated absence for margin-class-only rows — never an invented step, never a fabricated urgency.
3. **Compute LTIOV = commit_step − lead (lead 0, stated) on the scenario clock only** (DEC-17), with the three-state answerable-in-time predicate — in time (slack shown), **red with visible arithmetic**, unstated — and no row ever dropped for being red (FR-005).
4. **Reuse, not invent**: divergence from the SPEC-10 tensor; discriminator classification from SPEC-12/23 (`classifySeparation`, nested excluded); tripwires from validity windows at the trace graph's honest world-level granularity; a thin orchestration end to end (DEC-10) — the service scores nothing new and stores only its result envelope, `cited_in`-edged to its evidence (G3).
5. **Pin the §7 exhibit as the oracle-style fixture table** (FR-008): P2's {C1 in-time slack 2, C2 red, C5 world-decided + K9 tripwire}, P1's {C1/C2 red at commit 4, C3 stated absence, C4 boundary in-time, C5 tripwire}; byte-identical re-runs (G1); changing these rows is a register/coverage matter.

**Register candidates** (flagged, not asserted — DEC-2; recorded in concept §6): **(1)** the DP derivation rule of §2–§5 (a ranking/semantics decision of DEC-18's class); **(2)** the derived surface as an S2-adjacent commander panel plus the seam addition `POST /analyse/decision-support` (DEC-24-style contract growth; DEC-32 untouched by the recommendation). This note asserts no register decision: the predicate and rules are forced by DEC-15/17/19 and G3/G4 once the doctrinal artefact is required at all; the reuse posture is DEC-10; latitude spent (row order by `logical_id`, lead = 0, the world-decided horizon assignment, world-level tripwire scope) is review-slice presentation/process latitude recorded here, not asserted in a peer document.

Sources: JP 2-01.3 *Joint Intelligence Preparation of the Operational Environment* (2014) ch. II/IV — the DST as a JIPOE step-4 support product; event template/matrix, NAIs, indicators, most-likely/most-dangerous; ch. IV on deception shaping indicators (why `single_source` matters on discriminators); ATP 2-01.3 *Intelligence Preparation of the Operational Environment* ch. 6 — DST/DSM construction, decision points tied to NAIs; ATP 2-01 *Plan Requirements and Assess Collection* — LTIOV computed against the decision point's time; FM 6-0 *Commander and Staff Organization and Operations* ch. 9 — the DSM format (decision point × NAI × LTIOV) as a wargaming product; JP 5-0 *Joint Planning* (2020) ch. III — CCIRs/PIRs as decision-hung questions; wargaming's decision-support outputs; ASSAY register DEC-2/5/9/10/11/15/17/18/19/20, constitution II/G1–G6, knowledge model §4 (`CollectionOption`, validity windows), review 2026-07-14 §4.2/M1/B1/slice S-D, research notes 03-score-plan.md §3 (verdict mapping), 08-analysis.md §7 (operative pairs, separation classes), 10-spatial-temporal.md §2 (lapse marked, never carried), 11-attention.md §2 (absence of assessment is not an assessment), walkthrough beat 6 (the KINGFISHER/C6 tasking discipline).
