# Research note 03 — Score, then plan

Stage 3 · per ASSAY-DEC-11 · 2026-07-13 · bounded to hours, one page preferred
Prompts (build plan §Stage 3): banded/epsilon-dominance and the NSGA-II family — what "distinct in banded space" means formally; JP 5-0 COA comparison criteria (suitability, feasibility, acceptability) as a cross-check that verdict semantics match staff practice; **define the four-stop verdict mapping against banded margins** so the vignette §9 oracle outcomes (O-2/O-3) are decided by the note, not discovered in code. Also owed here: the routing-search structure flagged forward from note 02 §3, and the handful strategy axes for this domain (concept §6.2).

## 1. Metric propagation is interval arithmetic, and nothing more

The scorer's inner loop turns a plan and a compiled world into a **metric band** for each commitment's `metric`, then compares that band to the commitment's threshold. The propagation is classical interval arithmetic (Moore, *Interval Analysis*, 1966): a metric is built from banded inputs by `+`, `−`, `×` scalar, and `max`/`min`, and each operator has the textbook rule on closed intervals — `[a,b] + [c,d] = [a+c, b+d]`, `[a,b] − [c,d] = [a−d, b−c]`, `max([a,b],[c,d]) = [max(a,c), max(b,d)]`. Metric bands carry a `unit`; combining mismatched units is a fixture/config defect surfaced, never silently coerced (the compile already units its channels). This is the whole of oracle O-1: `strait_open_step = start + duration(A) + duration(B) = 2 + [4,6] + [3,5] = [9,13]`, exactly, by interval addition — **any other band is a propagation defect, not a design choice** (vignette §9). The scorer implements interval arithmetic as a small, separately-tested module (`src/interval.ts`) precisely so O-1 tests the arithmetic, not the plumbing around it.

The honesty content of DEC-15 lives here: bands are pure closed intervals with **no midpoint**, so the scorer may never take a mean, a mid, or a "most likely" — every operation is worst-and-best-case on the interval. A scorer that collapsed `[4,6]` to `5` to "simplify" would pass no oracle and violate G6 (below). Interval arithmetic is not a nicety; it is the representation of DEC-15 in the compute layer.

## 2. Route metrics: `(cell, time)` resolution, not a time-expanded graph

Note 02 §3 flagged forward *"whether the scorer walks routes over a `(cell, time)` state search or a locally time-expanded subgraph is a Stage-3 decision."* **Decided: `(cell, time)` resolution over the sparse world, no graph expansion.** A `Plan` (DEC-20) is already timed geometry — `RouteLeg[]` with `enter_step`/`exit_step` and `TaskWindow[]` — so the scorer does not *search* for routes; it *evaluates* the routes the plan states. For each leg the scorer resolves `channel(x, y, t)` by the lazy materialisation function note 02 §2.2 defined: pick, for that cell and timestep, the innermost active `RegionOverride` (later `from_step` wins on overlap — note 02 §3's documented tie order), else the channel default. A metric is then a reduction over the leg's `(cell, time)` samples:

- **reach-step metrics** (`strait_open_step`, `port_open_step`, `extraction_step`) — `start + Σ leg durations`, where a leg's duration band is its distance divided by the leg's banded mobility factor (interval division on positive factors; a zeroed mobility region — R3's demolished causeway — makes the band unbounded, i.e. the route is severed, surfaced as a `violated` reach rather than an infinity in a cell).
- **exposure metrics** (`threat_exposure(FE)`, `civil_harm_exposure`) — `Σ over the element's occupied (cell, time) samples of the threat/civil band × dwell`, scoped to the element or district the commitment names (`scope`). Exposure accumulates as a band because the channel it reads is banded.
- **state metrics** (`causeway_intact`) — a banded boolean read of the relevant channel/region at the relevant step.

No time-expanded graph is ever built: expansion re-materialises the 60×60×56 dense world note 02 retired, times the horizon, for no gain when the plan already fixes the route. The scorer touches only the cells a plan actually occupies — tens to hundreds of `(cell,time)` samples per plan, not 200k nodes. This keeps DEC-4's "scorer honestly real even in the mock" affordable: sensitivity, discrimination, and robustness are re-scoring loops over this cheap evaluator, not searches.

## 3. The four-stop verdict mapping — signed margin bands (the note's binding decision)

A commitment is `metric comparator threshold` (DEC-19; the threshold is scalar fact-of-intent, DEC-14). Reduce every comparator to a **signed margin band** `M = [m_lo, m_hi]`, oriented so that **satisfied ⟺ margin ≥ 0**:

| comparator | satisfied when | margin(v) | margin band M |
|---|---|---|---|
| `at_most T` | v ≤ T | T − v | `[T − hi, T − lo]` |
| `by_step T` | v ≤ T (completion step) | T − v | `[T − hi, T − lo]` |
| `at_least T` | v ≥ T | v − T | `[lo − T, hi − T]` |
| `never` | metric stays ≤ 0 (no occurrence) | −v | `[−hi, −lo]` |

(`v = [lo, hi]` is the metric band; the worst realisation for `at_most`/`by_step`/`never` is `hi`, for `at_least` is `lo` — the table orients each so `m_lo` is always the worst case.) Oracle O-2 checks the arithmetic: `strait_open_step [9,13]` vs C2-style `at_most 28` gives `M = [28−13, 28−9] = [15,19]` — the required margin band, exactly.

**The verdict is a pure function of the signs of the margin-band endpoints — no interior cut, no invented ε:**

| condition | meaning | verdict |
|---|---|---|
| `m_lo > 0` | worst realisation satisfies with room | **robust** |
| `m_lo = 0 ≤ m_hi` | worst realisation exactly meets the line; none violate | **marginal** |
| `m_lo < 0 ≤ m_hi` | the band straddles the line — violation is possible | **tight** |
| `m_hi < 0` | best realisation already fails | **violated** |

This is the honest scale. The *only* boundaries at which the verdict changes are where a margin-band endpoint crosses zero — and an endpoint of `M` crosses zero exactly when the threshold crosses a **band edge** of the metric. It is therefore impossible to draw a marginal/tight line *inside* the band, because the band gives no honest interior point to draw it at (DEC-15: no midpoint, ever). A "closeness" rule — marginal if the margin is within one band-width of zero, say — would put a transition at a threshold value that is *not* a band edge, and O-3 forbids exactly that. The signs-only rule is the unique mapping that (a) is monotone from robust to violated, (b) uses the four stops the register froze (DEC-9), and (c) satisfies O-3.

**O-3, decided here and re-verified.** Metric band `[9,13]`, `at_most T`, `M = [T−13, T−9]`. Sweep the threshold 8 → 14:

| T | M | signs | verdict |
|---|---|---|---|
| 8 | [−5,−1] | m_hi < 0 | violated |
| 9 | [−4, 0] | m_lo<0, m_hi=0 | tight |
| 10–12 | [−3,1]…[−1,3] | m_lo<0<m_hi | tight |
| 13 | [0, 4] | m_lo=0 | marginal |
| 14 | [1, 5] | m_lo>0 | robust |

The verdict transitions only at **T = 9** (`m_hi` crosses 0 — the lower band edge) and **T = 13** (`m_lo` crosses 0 — the upper band edge), and is constant between and outside them — *"the verdict changes only at the band edges (9, 13), never inside the band"* (O-3), satisfied. At the note's cited threshold `at_most 12` the verdict is **tight** — "neither robust nor violated (both outcomes lie inside the band)", as O-3 requires. The sweep also happens to exercise all four stops on one metric, which is a good sign the scale is not over-fitted to the marginal case.

**Why not epsilon-dominance for the *verdict*.** Laumanns et al.'s ε-dominance (2002) is the right tool for *comparing plans* (§4), where an ε makes "distinct" decidable on a continuum. It is the wrong tool for a *verdict against a commander's threshold*: an ε there is a false-precision knob — it would let a plan that violates a `must` read as "close enough" by a tunable margin the commander never set. The threshold is fact-of-intent (DEC-14); the honest verdict asks only *does the band clear it, straddle it, or fail it*, and the signs of `M` answer exactly that. ε belongs in plan comparison, not in commitment verdicts.

## 4. Banded honesty as a theorem — the containment property (G6, oracle O-4)

The mapping above is only honest if the propagation under it is monotone. State it as the property the scorer must satisfy, which is candidate G6 / oracle O-4:

> **Containment / monotonicity.** Widening any input band never narrows any output metric band, and every point-realisation of the inputs scores inside the output band.

Interval arithmetic gives this by construction: each operator is inclusion-monotone (`A ⊆ A′ ⇒ A ∘ B ⊆ A′ ∘ B`), so a wider input yields a superset output; and each operator is *sound* (contains every real combination), so every point-realisation lands inside. O-4 instances it: re-running O-1 with `A` widened `[4,6] → [3,7]` gives `strait_open_step = 2 + [3,7] + [3,5] = [8,14] ⊇ [9,13]`, exactly. The verdict mapping preserves the honest direction too: widening an input can only move `m_lo` down and `m_hi` up, so a verdict can only move *toward* uncertainty (robust → marginal → tight) or stay — **more input uncertainty never buys a more confident verdict**. That is banded honesty stated as a theorem rather than typographically (seam §G, G6): a scorer could satisfy every other invariant while propagating intervals wrongly, and would be exactly the false-precision machine ASSAY refuses. SPEC-07 asserts O-1–O-3 as hand-computed instances and O-4 as a **property-based test** over random bands and thresholds (fast-check style: generate `[lo,hi]`, a widening, a comparator, a threshold; assert superset and point-membership and verdict-monotonicity), not just the one widening in the vignette.

## 5. Distinctness in banded space, and the JP 5-0 cross-check (folds into SPEC-08)

*What "genuinely distinct" means (concept §6.2; gates SPEC-08).* Two plans are **distinct in banded space** when neither ε-dominates the other across the criteria vector of banded scores — banded/ε-non-domination in the sense of Laumanns et al. (2002), the NSGA-II family's diversity mechanism (Deb et al., 2002) adapted to intervals: `A` dominates `B` if `A` is no worse than `B` on every criterion band and strictly better (by more than ε) on at least one, where "no worse" on bands uses the conservative order (`A ⪯ B` iff `A.hi ≤ B.lo`, i.e. the bands do not overlap in the wrong direction). The handful is the ε-non-dominated set, capped at 3–5; ε is the *organiser's* distinctness knob and lives here, never in a verdict (§3). This is recorded for SPEC-08; SPEC-07 owes only the scorer whose banded criteria vectors SPEC-08 will organise.

*Handful strategy axes for this domain (concept §6.2 — REMIT's time/exposure/robustness/completeness axes "do not transfer unexamined").* The Meridian vignette's four genuine axes, read off C1–C6 and the force elements, are:
1. **approach** — strait-early vs sweep-first-enter-late (the thesis-C robustness trap: PACKHORSE timing);
2. **suppression posture** — fires-forward (risks C3 civil harm) vs stand-off (risks C4 exposure / C2 tempo);
3. **causeway** — contest intact (C5) vs bypass by sea;
4. **extraction coupling** — KINGFISHER pull-out early vs mission-tail (C6 vs tempo).
These are the strategy-biased fan-out axes for the seeded generator; they are the domain's own, not REMIT's imported. Recorded for SPEC-08.

*JP 5-0 cross-check.* JP 5-0 (*Joint Planning*, ch. on COA comparison) evaluates COAs on **suitability, feasibility, acceptability**. The four-stop scale must read as staff language, and it does: a `violated` **must** is *infeasible* (the COA cannot accomplish the task within the constraint); a `tight`/`marginal` verdict is the *acceptability* question (risk the commander must weigh — the band straddles the line); `robust` is *suitable and feasible with margin*. Crucially JP 5-0 keeps comparison a **commander's judgement**, not an arithmetic total — which is why ASSAY refuses a weighted scalar score (DEC-19: ordinal tiers, no weights) and surfaces banded verdicts for a human to weigh, rather than a single ranked number. The scale matches practice; the honesty is that ASSAY declines to do the commander's weighing for them.

## What we will do differently

1. **Implement interval arithmetic as its own module** (`src/interval.ts`: `add`, `sub`, `scaleBy`, `max`, `min`, `contains`, `width`, unit-checked), separately tested, so oracle O-1 tests the arithmetic and the scorer composes it. No mean/mid/most-likely operation exists anywhere (DEC-15).
2. **Evaluate stated routes by `(cell, time)` resolution over the sparse world** — the lazy materialisation function of note 02 §2.2 — and build no time-expanded graph (note 02 §3's forward-flagged decision, now made). The scorer touches only occupied cells.
3. **Map verdicts by signed margin bands, signs-only** (§3): `robust` iff `m_lo>0`, `marginal` iff `m_lo=0`, `tight` iff `m_lo<0≤m_hi`, `violated` iff `m_hi<0`. This is the mapping O-2/O-3 are decided against; it is the unique O-3-satisfying, no-interior-cut, four-stop rule. `margin` returns as a `Band` shown only on demand (knowledge model §108); verdicts cross the seam only as the four-stop scale (G2).
4. **Assert G6 as a property-based test** (O-4): superset-under-widening, point-realisation membership, and verdict-monotonicity across random bands/thresholds — not only the vignette's single widening. Oracle expected values stay hand-computed and are never regenerated from the scorer (vignette §9 rule).
5. **Keep ε out of verdicts and reserve it for plan comparison** (§3, §5): the `at_least/at_most` line is the commander's, not a tunable margin; distinctness in banded space is ε-non-domination and belongs to SPEC-08's organiser, recorded here with the domain's four generation axes.
6. **Honour DEC-10's scenario-blindness and the perturbation hook**: `/score` takes an already-excursioned world and a `knowledge_overrides?` list that substitutes answers *for the call only* (seam §5), writing nothing; and refuses `stamp_mismatch` when a plan's assumptions and the world disagree on stamp (the comparability guard), a first-class `Refusal` like every other seam decline.

Sources: R. E. Moore, *Interval Analysis* (1966) — closed-interval arithmetic and inclusion monotonicity; K. Deb et al., "A Fast and Elitist Multiobjective Genetic Algorithm: NSGA-II," *IEEE TEC* 6(2), 2002 — non-dominated sorting and diversity; M. Laumanns et al., "Combining Convergence and Diversity in Evolutionary Multiobjective Optimization," *Evol. Comput.* 10(3), 2002 — ε-dominance; JP 5-0 *Joint Planning* (2020) ch. on COA comparison — suitability/feasibility/acceptability and comparison-as-commander's-judgement; JP 2-01.3 (2014) — most-likely/most-dangerous (forward to note 05); ASSAY register DEC-4/9/10/14/15/19/20, knowledge model §4/§6 (materialisation)/§108, seam contract §5/§6/§G (G6), vignette §6 (C1–C6)/§9 (oracle O-1–O-4), research note 02-compile.md §2–3, concept §6.2.
