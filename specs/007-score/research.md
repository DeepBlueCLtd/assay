# Phase 0 — Research (SPEC-07)

The DEC-11 research gate for this slice is the canonical note **`docs/research/03-score-plan.md`** (Stage 3), present before implementation. This file does not duplicate it; it records the decisions that bind the build, all sourced there.

| Decision | Resolution | Source |
|---|---|---|
| Metric propagation | Classical interval arithmetic on pure closed bands (`+`, `−`, `× scalar`, `max`, `min`); no mean/mid/most-likely ever (DEC-15). Its own tested module. | note §1 |
| Route evaluation | `(cell, time)` resolution over the sparse world (innermost active override, later `from_step` wins); **no** time-expanded graph. The scorer evaluates stated routes, never searches. | note §2 (closes note 02 §3's forward flag) |
| Four-stop verdict | Signed margin band `M`, satisfied ⟺ margin ≥ 0; verdict by **signs only**: `robust` iff `m_lo>0`, `marginal` iff `m_lo=0`, `tight` iff `m_lo<0≤m_hi`, `violated` iff `m_hi<0`. Unique O-3-satisfying, no-interior-cut rule. | note §3 |
| O-2 / O-3 outcomes | O-2 ⇒ robust, margin `[15,19]`; O-3 straddle ⇒ tight, transitions only at band edges 9 & 13. Decided here, not in code. | note §3, vignette §9 |
| G6 / O-4 | Inclusion-monotone + sound (containment) + verdict-monotone; asserted by property-based tests, not only the vignette widening. | note §4 |
| ε-dominance | Reserved for *plan comparison* (SPEC-08 organiser), never for verdicts — a threshold is the commander's, not a tunable margin. | note §3, §5 |
| Handful axes / JP 5-0 | Domain's four generation axes recorded for SPEC-08; four-stop scale cross-checked against suitability/feasibility/acceptability. | note §5 |

**Unknowns resolved**: none outstanding. The generator (SPEC-08), the scenario strip (SPEC-10), and ε-non-domination organisation are explicitly out of this slice; the canned Meridian handful (`fixtures/plans.json`) is the sanctioned fallback (delivery plan §3).
