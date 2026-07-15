# Research note 06 — Scenario robustness

Stage 5 · per ASSAY-DEC-11 · 2026-07-14 · bounded to hours, one page preferred
Prompts (build plan §Stage 5): robust optimisation postures (minimax, minimax regret, scenario-weighted) and their honesty trade-offs; JP 2-01.3's most-likely/most-dangerous doctrine and its warning against planning solely on most-likely — the demo script should quote it. Output feeds SPEC-10 (multi-scenario scoring, scenario strip, comparability guard on mixed stamps).

Numbering note: the build plan named this `05-robustness.md`, but `05-surfaces.md` (the front-end lane) already occupies that slot. This note takes `06-`; `07-flow-view.md` already exists. The note number is filing, not authority.

## 1. The register has already excluded scenario-weighted optimisation

Three postures dominate the robust-optimisation literature for discrete-scenario planning:

- **Scenario-weighted (expected value):** assign a probability to each scenario, take the probability-weighted metric, optimise the expectation. This is the civilian OR default (Mulvey et al., *Robust Optimization of Large-Scale Systems*, 1995) and the posture that JP 2-01.3's most-likely/most-dangerous doctrine was written to counter.
- **Minimax regret (Savage, 1951):** for each scenario, compute the best achievable metric and the plan's shortfall ("regret"); optimise against the worst-scenario regret.
- **Minimax (Wald, 1950) / worst-case:** evaluate each plan under every scenario; judge the plan by its worst-scenario performance.

Two of the three are ruled out before any implementation question arises:

1. **Scenario-weighted is forbidden.** The vignette §4 is explicit: scenario likelihoods K14a–c are `scenario_weight`s that "never compile into constraint or cost" (knowledge model §9); the compile service firewalls them from every channel by any path (SPEC-06 §3). Computing a weighted-average metric band across scenarios would be *using* the scenario weights as computational inputs — exactly the act the firewall exists to prevent. A probability-weighted band also collapses three interval-valued outcomes into one, violating DEC-15 (no midpoint, no distributional claim) and smuggling a false-precision scalar past DEC-9. So scenario-weighted robustness is out, on the same honesty grounds that excluded weighted CSP from relaxation (note 04 §1).

2. **Minimax regret requires a per-scenario optimum.** Regret is "how far behind the best I could have done under this scenario." Computing it requires solving for the *per-scenario optimal plan* — the best plan for R1, the best for R2, and so on — and then measuring each candidate's shortfall. At v1 scale this is tractable (16 generated plans × 3 scenarios), but the **conceptual problem** is that regret is a relative measure: a plan with poor absolute performance (violated `must`s) can have low regret if the per-scenario optimum is also poor. The commander asking "does this plan survive R2?" does not want "it's only 3 steps worse than the best R2 plan" — they want "C1 and C2 are `violated`." Regret launders absolute failure into relative mediocrity, and that is a violation of banded honesty (DEC-9/G2): the surface would show regret bands where the commander needs verdict bands. So minimax regret is out on presentation grounds.

3. **Minimax (worst-case) survives.** The plan is judged by its *worst scenario's* verdicts. This is the honest posture: the worst-case verdict is a real verdict on a real scenario, not a weighted blend or a relative shortfall. Every scenario strip cell shows the four-stop verdict from a specific scored scenario, traceable back to named knowledge (G3). No information is lost; the per-scenario detail remains visible. The worst case is not "pessimism" — it is a direct answer to "which scenario kills this plan?" and "does any plan survive all three?" That is thesis C.

## 2. JP 2-01.3 and the "don't plan on most-likely" doctrine

JP 2-01.3 §II-9 (JIPOE step 4) distinguishes the most-likely COA and the most-dangerous COA and instructs planners to develop plans that address both. The doctrinal concern is precisely thesis C's: a plan optimised against the most-likely scenario may catastrophically fail under the most-dangerous one. JP 5-0 ch. IV reinforces: "The commander should not plan solely on the most likely enemy COA." The vignette instantiates this: R1 (Fortress Halcyon, K14a 45–70%) is most-likely; R2 (Strait Denial, K14b 20–40%) is most-dangerous to a strait-early plan. A tool that optimises against R1 and never scores against R2 violates the doctrine's explicit warning.

ASSAY's contribution is not the warning itself (that is doctrinal furniture) but making the warning **computable and visible**: the scenario strip shows the R1-optimal plan's verdicts collapsing under R2 as a direct, traceable, banded observation, not as an assertion that "you should consider R2." The demo moment is the doctrine's warning rendered as data: "don't plan on most-likely" becomes "toggle R2 and watch the favourite die." This is honest because the strip shows exactly the scored verdicts — no summarisation, no weighting, no invented robustness metric.

## 3. Multi-scenario scoring: the mechanism, decided

The mechanism is a thin orchestration over the SPEC-07 scorer (DEC-10: the scorer called in a loop, never a separate engine). No new planning maths.

**Input:** a set of plans (from the SPEC-08 handful or from `/relax` candidates) and a set of scenarios (R1, R2, R3 — the vignette's COA set, excluding the R3m branch which is a relaxation excursion, not a robustness scenario).

**Steps:**

1. **Compile one world per scenario.** The compile service (SPEC-06) already supports `scenario?: string`; each `CompileRequest` with a scenario id (R1, R2, R3) produces a `CompiledWorld` with the scenario's excursion overlaid. The BASE world (no excursion) is the fourth: it represents the knowledge base without any adversary assumption, and is the world the handful was generated against. All four share the same consumed knowledge set (same stamp lineage) and differ only in the scenario overlay — a structural guarantee that cross-scenario comparison is apples-to-apples at the knowledge level.

2. **Score each plan against each world.** For `n` plans and `k` scenarios: `n × k` calls to `ScoreService.score()`. Each call is already scenario-labelled (`ScoreRequest.scenario`), and the returned `CommitmentVerdict`s carry the scenario label. The scorer's comparability guard (`stamp_mismatch`) is not triggered because each plan is scored against the world compiled for *that* scenario — the guard prevents scoring a plan against a *mismatched* world, not against multiple matched worlds.

3. **Assemble the scenario matrix.** The result is a `plan × commitment × scenario` tensor of verdicts. For each plan and commitment, the **worst-case verdict** across scenarios is the honest summary (§1: minimax). The worst-case ordering is `violated < tight < marginal < robust` — a plan's robustness verdict for a commitment is the minimum across scenarios. A plan whose worst-case verdict for every `must` commitment is at least `marginal` survives all scenarios; one with any `violated` `must` under any scenario does not.

4. **Identify collapse.** A plan "collapses" under a scenario when its worst-case verdict is strictly worse than its BASE verdict: a commitment that was `robust` under BASE drops to `tight` or `violated` under that scenario. The collapse is **per-commitment, per-scenario** — not a scalar; the strip shows exactly which commitments fail and under which scenario.

5. **No cross-scenario dominance filter.** The build plan says "dominance judged across the scenario-scored bands." After review, this is **not** a new domination concept: the handful's existing domination (SPEC-08, banded ε-non-domination on the criteria vector) already organises plans by their BASE-scenario performance. Stage 5 adds the *scenario dimension* as information — which plans survive, which collapse — but does not re-filter the handful by cross-scenario domination. Why: the handful is the planner's option set; removing a plan because it collapses under R2 would be making the robustness decision *for* the commander, which is the same error as scenario-weighting by another name. The scenario strip **shows** the collapse; the commander **decides** whether to discard the R1-optimal favourite. This matches JP 5-0: comparison is a commander's judgement, not an arithmetic filter.

## 4. The scenario strip component — what it shows and does not show

The scenario strip is a per-plan, per-commitment visualisation: one row per plan, one cell per commitment, one sub-cell per scenario, showing the four-stop verdict chip. The strip is aligned to the S2 matrix: the same plans, the same commitments, but with the scenario dimension fanned out. The BASE column is always shown; toggling a scenario (R1/R2/R3) adds its column.

**Collapse rendering.** When a plan's verdict for a commitment drops from its BASE value under a scenario, the cell renders the worse verdict — the collapse is visible at a glance. No animation, no colour interpolation, no derived "robustness score": the verdict IS the data, at the four-stop scale, traced back to the scored world (G3). The strip may highlight the drop (e.g. a downward transition marker between BASE and the scenario column), but the highlight is presentation chrome, not a new value.

**What the strip does NOT show:**

- **Scenario weights / likelihoods.** K14a–c are firewalled from the computation and the surface. The strip orders scenarios by logical id (the order the vignette defines them), not by probability.
- **A robustness index / score.** No scalar summarising "how robust" a plan is. The honest content is the full verdict tensor; any scalar would collapse it past banded honesty.
- **A recommendation.** The strip shows data; the planner's "don't plan on most-likely" insight is their own, from reading the strip. The demo script may narrate it — the surface does not.

**Comparability guard on mixed stamps.** When the S2 matrix or scenario strip displays verdicts from different stamp lineages (e.g. a plan scored before a recompile mixed with one scored after), mismatched stamps grey the comparison rather than rendering it. This is the existing `stamp_mismatch` guard (score.ts lines 78–81) extended to the display layer: if two verdict sets in the same view carry different `world_stamp` values, the view indicates incomparability visually. The guard is **not** triggered by *different scenarios* on the *same knowledge* — R1 and R2 worlds compiled from the same knowledge set are comparable because the stamp lineage (consumed refs + config + engine version) is shared; only the scenario overlay differs, which is folded into the world's own stamp.

## 5. The R1-optimal collapse on Meridian — the thesis-C exhibit, decided

The vignette §6 (line 103) engineers the robustness trap: the R1-optimal plan sends PACKHORSE through the strait early (R1 doesn't mine); under R2 (Strait Denial — mines Halcyon Strait early and deep), that plan's C1/C2 verdicts collapse to `violated`. The robust alternative sweeps first and enters later — slightly worse against R1, surviving against all three.

In the generated handful (SPEC-08): the `strait_early` approach axis produces plans that route PACKHORSE through cells (26,25) and (32,38) — inside the `halcyon_strait` region (x0=20, y0=20, x1=40, y1=30). Under R2's excursion, the mobility factor in that region drops to `[0.1, 0.4]` and threat rises to `[0.6, 0.95]`. The leg duration through those cells widens dramatically (the route is not severed — mobility is not zero — but the `strait_open_step` band inflates well past the C2 threshold `at_most 28`). The verdict for C2 drops from `robust` (under BASE/R1) to `violated` (under R2). The `sweep_first` alternative avoids the early strait transit, reaching later but safely — C2 stays `marginal` or `robust` under all three scenarios.

This is reproducible from the fixtures: the `halcyon_strait` region geometry, the R2 excursion overrides, the commitment thresholds, and the generated plan routes are all deterministic. The collapse is a provable consequence of the interval arithmetic, not an authored narrative. The demo moment quotes JP 2-01.3: "don't plan on most-likely" — and the scenario strip shows exactly what happens when you do.

## What we will do differently

1. **Adopt the minimax (worst-case) posture for scenario robustness**, rejecting scenario-weighted (forbidden by the `scenario_weight` firewall, DEC-15, DEC-9) and minimax regret (launders absolute failure into relative shortfall, violating banded honesty). The worst-case verdict is a real verdict on a real scenario — no information destroyed.
2. **Multi-scenario scoring is a loop over the SPEC-07 scorer** (DEC-10): compile one world per scenario, score each plan against each world, assemble the `plan × commitment × scenario` tensor. No new planning maths, no new engine.
3. **No cross-scenario dominance filter** on the handful. The handful stays the planner's option set; the scenario strip shows collapse; the commander decides. Removing a plan for robustness failure would be making the commander's judgement — the same error as weighting.
4. **The scenario strip is a per-plan, per-commitment, per-scenario verdict visualisation** — four-stop chips, traced, no robustness score, no recommendation. Collapse is visible; the insight is the reader's.
5. **Comparability guard extends to the display layer**: mismatched stamp lineages grey the comparison; different-scenario, same-knowledge worlds are comparable (same consumed refs, different overlay — the overlay is folded into each world's own stamp).
6. **The demo moment quotes JP 2-01.3** ("don't plan on most-likely") and demonstrates the R1-optimal collapse under R2 from the Meridian fixtures — a provable consequence of the interval arithmetic.

This note asserts **no new register decision**: the minimax posture is forced by the existing `scenario_weight` firewall (knowledge model §9) and the banded honesty invariants (DEC-9/15/19); the scoring mechanism is DEC-10 (scorer in a loop); the strip design is constrained by G2 (no unbanded scalars on surfaces) and G3 (backward trace to named knowledge). Any latitude spent (the presentation of collapse as a per-cell transition, the exclusion of R3m from the robustness scenario set, the ordering of scenario columns by logical id) is within Stage-5 delegated authority under the vignette §6/§7 exit criteria and is recorded here, not asserted in a peer document.

Sources: A. Wald, *Statistical Decision Functions* (1950) — minimax; L. J. Savage, "The Theory of Statistical Decision," *Journal of the American Statistical Association* 46(253), 1951 — minimax regret (date corrected by the 2026-07-15 citation-hardening pass, review A2: the regret criterion is the 1951 JASA paper, not the 1954 *Foundations*); J. M. Mulvey, R. J. Vanderbei & S. A. Zenios, "Robust Optimization of Large-Scale Systems," *Operations Research* 43(2), 1995 — scenario-weighted robust optimisation; JP 2-01.3 *Joint Intelligence Preparation of the Operational Environment* (2014) — most-likely/most-dangerous COA doctrine, step 4, §II-9; JP 5-0 *Joint Planning* (2020) ch. IV — "the commander should not plan solely on the most likely enemy COA" and comparison-as-commander's-judgement; ASSAY register DEC-4/9/10/15/19, knowledge model §9 (scenario_weight firewall), seam contract §5 (scorer)/§6 (handful)/§8 (analysis), vignette §4 (K14a–c)/§6 (thesis C, the R1-optimal collapse)/§7 (coverage matrix row C)/§9 (oracle cases, indirectly — interval arithmetic is the propagation that makes the collapse provable), research notes 02-compile.md §2 (sparse channels)/03-score-plan.md §2–3 (scorer design, signed margin bands)/04-relaxation.md §1 (weighted CSP rejection precedent).
