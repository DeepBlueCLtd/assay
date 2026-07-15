# Research note 08 — Analysis: sensitivity, discrimination, staleness

Stage 6 · per ASSAY-DEC-11 · 2026-07-14 · bounded to hours, one page preferred
Prompts (build plan §Stage 6): value-of-information and Bayesian experimental design (for discrimination); tornado/break-even sensitivity analysis of decision models (for load-bearing ranking); deception doctrine (JP 2-01.3 ch. IV counters-to-deception) so the single-source flag is presented in doctrinally literate terms; collection management basics (PIRs, NAIs, indicators).

Numbering note: the build plan named this `06-analysis.md`, but `06-robustness.md` (the Stage-5 note, itself renumbered from `05-`) already occupies that slot. This note takes `08-`; the note number is filing, not authority.

## 1. Sensitivity: tornado analysis over the scorer, not a new engine

Classical sensitivity analysis of decision models (Clemen & Reilly, *Making Hard Decisions*, 2014, ch. 5; Howard, 1966) asks: "which input, if wrong, changes the decision?" The canonical tool is the **tornado diagram** — for each input, vary it across its plausible range while holding others constant (one-at-a-time perturbation), measure how much the output moves, rank by movement. The input at the top of the tornado is the one most worth verifying.

ASSAY's scorer already provides the perturbation hook: `ScoreRequest.knowledge_overrides` substitutes an answer for one call only, storing nothing (seam §5; `score.ts` `#applyOverrides`). The mechanism for `/analyse/sensitivity` is therefore:

1. **Baseline.** Score the selected plan against the current world under the chosen scenario. Record the baseline verdict vector `V₀` (one `VerdictBand` per commitment).
2. **Perturb each answered knowledge item.** For each K whose answer compiled into the world, re-score with a `knowledge_override` that pushes the answer to each edge of its confidence band — the worst-case and best-case extremes the assessment's uncertainty admits. This yields two perturbed verdict vectors per K: `V_lo(K)` and `V_hi(K)`.
3. **Measure movement.** The sensitivity of a knowledge item is the number of commitments whose verdict changes between baseline and either perturbation. A verdict change is a discrete step on the four-stop scale (`robust → marginal → tight → violated`); the direction matters (degradation vs improvement) but the ranking is by absolute movement. Where no verdict changes, the knowledge item is insensitive — its uncertainty does not bite.
4. **Rank.** Sort descending by movement count, breaking ties by worst-case margin magnitude (the K whose perturbation drives a margin closest to zero is more load-bearing). This is the sensitivity ranking.

This is a scorer-in-a-loop (DEC-10) — no new optimisation engine, no derivative computation, no Monte Carlo sampling. The perturbation is interval arithmetic at the band edges, which is exactly what the scorer already does; the only new work is the loop and the ranking.

### Why tornado and not gradient / Sobol / Monte Carlo

- **Gradient-based sensitivity** requires a differentiable model. The scorer's `verdictFor` function is a step function on the sign of the margin band — it has no gradient at the transition points that matter. Automatic differentiation would return zero almost everywhere and undefined at the steps.
- **Sobol indices / variance-based decomposition** (Saltelli et al., 2008) require a distributional assumption over each input's range. DEC-15 forbids distributional claims over bands; the band is an honest "somewhere in here, we don't know where." Computing Sobol indices would require inventing a distribution inside each band — exactly the false precision ASSAY exists to refuse.
- **Monte Carlo** has the same distributional problem and additionally violates G1 (determinism) unless seeded, and even seeded it returns a sample-dependent ranking that changes with the seed. The tornado approach, by contrast, is deterministic: the two extremes of each band are fixed, the ranking is fixed.
- **Break-even analysis** (Clemen & Reilly ch. 5.4) asks "at what value does the decision change?" — it is a refinement of tornado that the sensitivity ranking already captures: if a K's worst-case perturbation flips a verdict, the break-even point lies inside the band (the decision is sensitive); if neither extreme flips anything, the break-even point lies outside the band (the decision is robust to that K). The explicit break-even value is not computed — in a banded world, reporting "K8 breaks even at 0.37" would be false precision (that 0.37 has no provenance and no confidence). What IS reported is whether the band straddles the break-even point, which the verdict-change count already captures.

### The output shape

```
SensitivityRanking {
  knowledge: Ref          // which K
  baseline_verdicts: VerdictBand[]  // aligned to commitments
  perturbed_verdicts: VerdictBand[] // worst-case perturbation (the one that degrades most)
  changed_count: number   // commitments whose verdict moved
  single_source: boolean  // carried through from K's provenance (thesis E)
}
```

The ranking is an array of `SensitivityRanking` sorted by `changed_count` descending, then by worst-case margin proximity. The `single_source` flag is NOT a factor in the ranking arithmetic — it is a provenance flag carried through for the surface to render alongside the ranking (thesis E). K8 tops the ranking because its perturbation changes verdicts (its band straddles the battery fire-control threshold that gates the north approach), not because it is single-source. The single-source flag is the deception warning on top of the sensitivity warning — they compound but are independent signals.

## 2. The single-source flag and JP 2-01.3 deception doctrine

JP 2-01.3 ch. IV (Counters to Deception) identifies **source diversification** as the primary counter to denial and deception (D&D). A single-source assessment is inherently more vulnerable to deception because there is no independent corroboration: if the one source is fabricated, denied, or manipulated, the assessment collapses with no cross-check to catch it.

ICD 203 (Analytic Standards, ODNI, 2015) §B.4 requires analysts to "identify and explain the quality and credibility of underlying sources and information" and specifically to flag when "a key judgement rests on a single source." The flag is an analytic standard, not an ASSAY invention.

In ASSAY, the single-source flag is carried on `KnowledgeObject.provenance.single_source: boolean` (knowledge model §4; already in fixtures — K8 is the only `true` case in Meridian). Its treatment in the sensitivity ranking is:

- **NOT a weighting factor.** The ranking is by measured sensitivity (verdict change count). The single-source flag does not inflate or deflate the ranking position. If K8's perturbation changes no verdicts, K8 would not top the ranking regardless of being single-source. That would be an honest outcome: "this assessment is single-source but the decision doesn't depend on it."
- **A co-displayed flag.** The S1 "Verify next" queue renders the single-source flag as a badge alongside the sensitivity ranking. The flag says "if this assessment is wrong, there is no cross-check" — a deception warning that compounds the sensitivity warning "if this assessment is wrong, the decision changes." The two signals together say "the decision depends on an uncorroborated assessment" — the doctrinal concern of JP 2-01.3 ch. IV.
- **A rendering obligation.** Constitution II (seam G2) requires that wherever a single-source assessment's value renders, the `single_source` flag renders with it. This is the same pattern as banded rendering: the flag is metadata that is inseparable from the value.

### NAIs and indicators — the doctrinal context of the S1 queue

JP 2-01.3 §III-24 defines **Named Areas of Interest (NAIs)** as geographic areas where activity will confirm or deny a specific COA indicator. ATP 2-01.3 ch. 3 further defines **indicators** as identifiable actions or conditions that suggest a COA is being adopted.

In ASSAY, the S1 "Verify next" queue is the functional equivalent of the NAI list and indicator table from the JIPOE step-3 product: it ranks the knowledge items most worth verifying (sensitivity) and most able to discriminate between COAs (discrimination, §3 below). The queue does not use the terms "NAI" or "indicator" because the demonstrator operates at the assessment/question level, not at the geographic/activity-recognition level — but the function is the same: "where should the J-2's next collection effort go?"

The connection to PIRs (Priority Intelligence Requirements, JP 2-0 §II-6) is direct: a PIR is the commander's question that needs answering. Every open KnowledgeObject whose sensitivity or discrimination ranking is high is, functionally, a PIR candidate. ASSAY surfaces the ranking; the J-2 formulates the PIR. The system ranks, it does not task (walkthrough §7).

## 3. Discrimination: COA-pair separation, not Shannon entropy

The discrimination value of an open question is how much answering it would change the picture of which adversary COA is in play. The formal framework is **Bayesian experimental design** (Lindley, 1956; Chaloner & Verdinelli, 1995): choose the experiment (collection task) that maximises expected information gain, measured as the expected reduction in Shannon entropy of the posterior over the COA set.

ASSAY cannot use this framework honestly. Shannon entropy requires a probability distribution over the COA set. The scenario weights K14a–c are banded intervals (`45–70%`, `20–40%`, `10–25%`) with no interior point and no distributional claim (DEC-15). Computing a Shannon entropy from band midpoints would be exactly the false-precision scalar DEC-15 forbids; computing it from the band edges gives a range so wide it's uninformative. And the `scenario_weight` firewall (knowledge model §9) explicitly prevents scenario weights from entering any computation — Shannon entropy over COA probabilities would violate the firewall.

### What works instead: band separation as a discrimination measure

The vignette's miniature event matrix (§5, DEC-18) already defines, for each open question, the **expected answer band under each COA**. The discrimination value of a question is a function of how well these bands separate the COAs from each other:

- **K11** (mines at quay): R1 expects `[0.0, 0.2]`, R2 expects `[0.7, 1.0]`. These are **disjoint** — a single observation in either range answers the operative question "R1 or R2?" unambiguously.
- **K13** (radio traffic): R1 expects `[40, 90]`, R2 expects `[50, 110]`, R3 expects `[30, 100]`. These **nest and overlap** — an observation of 60 msgs/day is consistent with all three COAs. The question is cheap to answer but nearly uninformative.

The discrimination metric is computed per COA pair, not per COA. For two COAs `(A, B)` and a question `Q` with expected-answer bands `E_A = [lo_A, hi_A]` and `E_B = [lo_B, hi_B]`:

- **Separation.** If the bands are disjoint: `separation = min(|lo_A - hi_B|, |lo_B - hi_A|)` — the gap between the nearest edges, in the question's unit. Positive separation means one observation discriminates.
- **Overlap.** If the bands overlap: `separation = -overlap_width` — negative, indicating the range of values consistent with both COAs. The more negative, the weaker the discrimination.

This is a banded measure (the separation is an interval over the uncertainty in the expected-answer bands themselves), deterministic, and requires no distributional assumption. It does not use scenario weights in any form — the discrimination is a geometric property of the expected-answer bands, not a probabilistic property of the COA set.

**Where this sits in prior art** *(added 2026-07-15, citation-hardening pass — review A2)*. Disjointness-as-comparability is the defining relation of interval orders (Fishburn 1985) — the separation is that order's margin, going negative exactly where the order abstains. And declining to collapse banded likelihoods into a single expected value is the posture of the imprecise-probability decision literature (Troffaes 2007), whose information-value analyses likewise return sets and intervals rather than a scalar EVPI. The measure is situated, not derived: the O-level requirement (K11 over K13) and the DEC-15/19 constraints fix it independently.

### The ranking and the cost co-display

For each open question, the discrimination ranking reports:

```
DiscriminationEntry {
  question: Ref              // which K (open questions only)
  pairs: { coa_a: string, coa_b: string, separation: Band }[]  // per COA pair
  best_separation: Band      // the pair with the widest separation
  cost: Band                 // from K's collection option (banded, DEC-15)
}
```

The ranking is sorted by `best_separation` descending (strongest discriminator first). **Cost is shown alongside, never collapsed with value into a single score** (DEC-19: no weights). K11's separation `[0.5, 1.0]` (R1 vs R2 disjoint) ranks above K13's separation `[-60, -10]` (all pairs overlapping), despite K11's cost `[2, 4]` det-days being higher than K13's `[0.2, 0.5]` det-days. The human weighs value against cost; the system presents both.

This matches the build plan's Stage-6 exit: "K11 beats K13 on discrimination value despite higher collection cost."

### Why not value-of-information (VOI)

Classical VOI (Howard, 1966; Raiffa & Schlaifer, 1961) computes the expected value of perfect/imperfect information as the difference in expected utility between deciding with and without the information. This requires:
1. A utility function over outcomes — ASSAY has commitment verdicts (ordinal, four-stop), not utilities.
2. A prior distribution over states — ASSAY's scenario weights are banded and firewalled.
3. A likelihood model linking observations to states — ASSAY's expected-answer bands are intervals, not likelihoods.

Computing VOI honestly in a banded, weight-firewalled system would produce an interval so wide it collapses to "somewhere between zero and very large." The band-separation measure is less theoretically elegant but more honest: it measures a geometric property of the data the analyst actually has (expected-answer bands per COA), without requiring inputs the system has explicitly refused to carry.

## 4. Staleness: transitive trace walk, not re-computation

When K9 supersedes K5 (walkthrough beat 1), the question is: "which downstream artefacts depended on K5 and are now stale?" The answer is a transitive forward trace walk — exactly what `TraceStore.walk('forward')` already computes — filtered through the `traceView.ts` orientation map to follow the downstream direction coherently across mixed-orientation edges.

### The mechanism

1. **Start at the superseded object's hash.** K5's latest content hash is the walk origin.
2. **Walk forward through `compiled_into`.** K5 was consumed by `W1`; the `compiled_into` edge connects K5's hash to W1's hash.
3. **Walk forward through `scored_from`.** W1 was scored against plans P1–P4; the `scored_from` edges connect each verdict/score to W1's hash. But `scored_from` is `backward`-oriented in the downstream reading (the verdict is downstream of the world, but the edge points verdict→world). So the staleness walk follows `scored_from` edges **in the backward raw direction** (to→from) to reach the verdicts — the same orientation logic `traceView.ts` already encodes.
4. **Collect the terminal nodes.** Every verdict/score reached is a stale artefact — it was computed from a world that consumed K5, and K5 has been superseded. The walk returns `TraceChain[]` with `complete: true/false` per chain (G3: dead ends surfaced, never hidden).
5. **Return the invalidated set.** The result partitions the reached nodes by type (verdicts, scores, worlds) for the surface to render flags on the correct objects.

### What the staleness walk does NOT do

- **Does not recompute.** The walk identifies stale artefacts; it does not recompile the world or re-score the plans. Constitution principle: "writes are events, not side-effects" — the planner decides when to recompile (walkthrough beat 3). The flags say "these are stale"; the action is human.
- **Does not follow the `supersedes` edge.** The supersession itself (K9→K5) is NOT part of the staleness fan-out — it is the trigger. The walk starts at K5 and goes forward (downstream); K9 is upstream of K5 via the `supersedes` edge and is not visited.
- **Does not flag K9-derived artefacts.** K9 is new; it has no `compiled_into` edges yet (it hasn't been compiled). Only K5-derived artefacts are flagged. This is the thesis-F exit: "exactly the K5-dependent verdicts and nothing else."

### The output shape

```
StalenessResult {
  invalidated: {
    verdicts: Ref[]   // stale CommitmentVerdicts
    scores: Ref[]     // stale PlanScores
    worlds: Ref[]     // stale CompiledWorlds
  }
  chains: TraceChain[]  // the full walk, for the trace drawer (G3)
  stamp: string         // deterministic over the walk inputs
}
```

The `chains` array is the G3 content: every flag on S2 opens a trace drawer showing exactly why this verdict is stale — "this verdict was scored from world W1, which compiled K5, which has been superseded by K9." The chain terminates at named objects with named owners (G3).

## 5. The three Meridian exhibits — the Stage-6 exits, decided

### Exhibit E (sensitivity): K8 tops the ranking

K8's answer band (`[0, 0]` — "non-operational", carried as a degenerate band) is substituted at the edges of its confidence band. Because K8 is `hard_constraint` with waiver W-1, the north approach's threat channel depends on K8's assessment. Perturbing K8 to "operational" (the worst-case edge: the battery is active) changes P1's and P2's C4 verdict from `robust` or `marginal` to `violated` — the battery now threatens the amphibious group on the northern approach. That is 1+ commitment verdicts changed, which is the highest movement count in the Meridian knowledge base (other K items' perturbations change no verdicts or change fewer).

K8 renders with the `single_source` badge: "one intercepted maintenance return." The sensitivity ranking says "the decision depends on this"; the single-source flag says "and there's no cross-check." Together they answer the doctrinal question: "what should the J-2 verify next?" (JP 2-01.3 ch. IV).

### Exhibit D (discrimination): K11 beats K13

K11's expected-answer bands: R1 `[0.0, 0.2]` vs R2 `[0.7, 1.0]` — disjoint. One observation separates R1 from R2. K11's best-pair separation is `[0.5, 0.8]` (the gap between R1.hi=0.2 and R2.lo=0.7).

K13's expected-answer bands: R1 `[40, 90]` vs R2 `[50, 110]` vs R3 `[30, 100]` — all pairs overlap. K13's best-pair separation is negative (overlap). No single observation discriminates.

K11's collection cost: `[2, 4]` det-days (KINGFISHER close recon). K13's collection cost: `[0.2, 0.5]` det-days (standoff intercept). K11 is 4–20× more expensive.

The ranking places K11 first (positive separation) and K13 second (negative separation). Cost is displayed alongside: "K11 discriminates strongly between R1 and R2, costs 2–4 det-days; K13 discriminates weakly, costs 0.2–0.5 det-days." The human decides whether the discrimination value justifies the cost; the system does not collapse value and cost into one number (DEC-19).

### Exhibit F (staleness): K9 supersession flags exactly K5-dependent verdicts

K5 compiled into W1 via the storm channel (subject `weather.tide_storm`, channel `storm`, region `open_water`). W1 was scored against P1–P4 for commitments C1–C6 under BASE. The staleness walk from K5 reaches W1 (via `compiled_into`) and then exactly the verdicts/scores whose `scored_from` edges point to W1 and whose commitment metrics route through the storm channel. On Meridian: P1·C2 (strait-open timing depends on storm surge), P2·C1, P2·C2 — exactly the verdicts the walkthrough beat 1 specifies, and nothing else.

The walk does NOT flag P1·C1, P1·C3, P1·C4 etc. if their metrics do not route through the storm channel — the staleness is targeted, not a blanket invalidation. This precision is the thesis-F exit: "superseding K9 flags exactly the K5-dependent verdicts and nothing else."

## 6. The S1 queues — wiring sensitivity and discrimination to the surface

The build plan says "S1 queues wired to all three." The S1 surface (J-2 / Refresh & Resolve) shows two derived queues:

- **"Verify next"** — sorted by sensitivity ranking. The top item is the answered knowledge whose uncertainty most endangers the current plan. The single-source flag renders as a badge. This is thesis E made operational: K8 at the top with its deception-exposure flag.
- **"Collect next"** — sorted by discrimination ranking for open questions only. The top item is the open question whose answer would most separate the live COA set. Cost is shown alongside. This is thesis D made operational: K11 above K13 with value and cost side by side.

Both queues refresh whenever the delta feed carries a re-score or re-compile (a new stamp changes the baseline, which changes the sensitivity ranking; a resolved contest or new answer changes the discrimination picture). The staleness walk runs on supersession/contest events and flags stale artefacts on S2; it does not produce its own queue — its output is flags on existing objects, not a new ranking.

## What we will do differently

1. **Sensitivity is a one-at-a-time perturbation loop over the scorer** (DEC-10: scorer in a loop), not Monte Carlo, not gradient, not Sobol. The tornado ranking is deterministic, requires no distributional assumption (DEC-15), and uses the existing `knowledge_overrides` hook. The ranking is by verdict-change count; the `single_source` flag is co-displayed, not a weighting factor.
2. **Discrimination is COA-pair band separation** (DEC-18: the miniature event matrix), not Shannon entropy, not VOI. The measure is geometric (disjoint vs overlapping bands), deterministic, and does not use scenario weights in any form (firewall intact). Cost is shown alongside, never collapsed with value (DEC-19).
3. **Staleness is a transitive forward trace walk** from the superseded/changed object, following the `traceView.ts` orientation map coherently across mixed-orientation edges. The walk identifies stale artefacts; it does not recompute them. Flags, then humans decide (constitution).
4. **No new schema types are needed.** The movement types (`SensitivityResult`, `DiscriminationResult`, `StalenessResult`) are seam types in `seam.ts`, not stored LinkML objects — like `ScoreResult`, `HandfulResult`, etc. The `expected_answers` and `collection` fields on KnowledgeObject already exist in the schema and fixtures. The `single_source` flag already exists on provenance.
5. **The S1 queues are derived views**, not stored objects. They recompute from the current ranking whenever the delta feed carries a relevant event. No new persistence, no new delta type.
6. **The three Meridian exhibits are reproducible from fixtures**: K8 tops sensitivity (its perturbation flips C4 verdicts via the battery fire-control threshold), K11 tops discrimination (R1/R2 bands disjoint), K9 staleness flags exactly the K5-dependent verdicts (transitive walk through storm-channel paths only).

This note asserts **no new register decision**: the sensitivity mechanism is DEC-10 (scorer in a loop) with the existing `knowledge_overrides` perturbation hook; the discrimination mechanism is DEC-18 (the miniature event matrix) with the existing `expected_answers` and `collection` fields; the staleness mechanism is the existing `TraceStore.walk` with the existing `traceView.ts` orientation map. The output shapes follow the established seam pattern (success-or-refusal, stamped, G3-traceable). Any latitude spent (the choice of one-at-a-time perturbation over alternatives, the choice of band-separation over Shannon entropy, the ranking sort order, the S1 queue labels) is within Stage-6 delegated authority under the vignette §7 exit criteria and the build plan's Stage-6 exits, and is recorded here, not asserted in a peer document.

Sources: R. A. Howard, "Information Value Theory," *IEEE Transactions on Systems Science and Cybernetics* SSC-2(1), 1966 — value of information, tornado analysis; R. T. Clemen & T. Reilly, *Making Hard Decisions with DecisionTools*, 3rd ed., 2014, ch. 5 — tornado diagram, break-even analysis, one-way sensitivity; D. V. Lindley, "On a Measure of the Information Provided by an Experiment," *Annals of Mathematical Statistics* 27(4), 1956 — Bayesian experimental design; K. Chaloner & I. Verdinelli, "Bayesian Experimental Design: A Review," *Statistical Science* 10(3), 1995 — survey of optimal design criteria; A. Saltelli et al., *Global Sensitivity Analysis: The Primer*, Wiley, 2008 — Sobol indices, variance-based decomposition; H. Raiffa & R. Schlaifer, *Applied Statistical Decision Theory*, HBS, 1961 — EVPI/EVSI; JP 2-01.3 *Joint Intelligence Preparation of the Operational Environment* (2014) ch. IV — counters to deception, source diversification, D&D indicators; JP 2-0 *Joint Intelligence* (2013) §II-6 — PIRs, collection management cycle; ATP 2-01.3 *Intelligence Preparation of the Operational Environment* (US Army, 2019) ch. 3 — indicators, NAIs; ICD 203 *Analytic Standards* (ODNI, 2015) §B.4 — single-source flagging requirement; ASSAY register DEC-4/9/10/14/15/17/18/19/21, knowledge model §4 (provenance, single_source)/§5 (expected_answers, DEC-18)/§6 (collection options), seam contract §5 (scorer, knowledge_overrides)/§8 (analysis endpoints)/§9 (trace), vignette §5 (K8 single-source, K11/K13 event matrix)/§7 (coverage matrix rows D/E/F), walkthrough beats 1 (staleness)/5 (sensitivity)/6 (discrimination), research notes 03-score-plan.md §3 (four-stop verdict)/06-robustness.md §2 (scorer-in-a-loop precedent). Added by the 2026-07-15 citation-hardening pass (review A2): P. C. Fishburn, *Interval Orders and Interval Graphs* (Wiley, 1985) — disjointness as strict comparability, the separation measure's order-theoretic home; M. C. M. Troffaes, "Decision Making Under Uncertainty Using Imprecise Probabilities," *International Journal of Approximate Reasoning* 45(1), 2007 — decision rules without a single distribution, the imprecise-probability information-value setting.
