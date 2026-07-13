# Quickstart — SPEC-07 (Score)

## Run it

```
npm install            # picks up fast-check (dev dep for O-4 property tests)
npm run typecheck
npm test               # SPEC-06 baseline + SPEC-07 (interval, oracle, score, s2Matrix)
npm run gallery        # regenerates the gallery incl. the honest-matrix demo moment
```

## The oracle, by hand (never regenerate these)

```
O-1  strait_open_step = 2 + [4,6] + [3,5] = [9,13]
O-2  [9,13] vs at_most 28  ->  M = [28-13, 28-9] = [15,19]  ->  robust
O-3  [9,13] vs at_most 12  ->  M = [12-13, 12-9] = [-1, 3]  ->  tight   (neither robust nor violated)
     sweep at_most T, T=8..14:  8→violated  9..12→tight  13→marginal  14→robust  (changes only at 9,13)
O-4  A widened [4,6]→[3,7]:  2 + [3,7] + [3,5] = [8,14]  ⊇  [9,13]
```

## The verdict mapping (research note §3)

Reduce a commitment to a signed margin band `M = [m_lo, m_hi]`, satisfied ⟺ margin ≥ 0:

```
at_most/by_step T:  M = [T - hi, T - lo]
at_least T:         M = [lo - T, hi - T]
never:              M = [-hi, -lo]

verdict:  m_lo > 0            -> robust
          m_lo = 0 ≤ m_hi     -> marginal
          m_lo < 0 ≤ m_hi     -> tight
          m_hi < 0            -> violated
```

## Score a Meridian plan

```ts
import { ScoreService } from '../src/score.js';
const scorer = new ScoreService({ store, trace });
const result = await scorer.score({
  plan: planRef, world: worldRef, scenario: 'R1', engine_version: '0.1.0',
});
// result.verdicts: one per C1..C6, four-stop + margin band
// result.scores:   banded criteria vector
// backward trace from any verdict reaches the named knowledge + owners (G3)
```

`knowledge_overrides` re-scores for the call only (persists nothing). A plan whose stamp disagrees with the world refuses `stamp_mismatch`. A plan that fails a `must` is a **success** with a `violated` verdict — a failing plan is honest output, not a refusal.
