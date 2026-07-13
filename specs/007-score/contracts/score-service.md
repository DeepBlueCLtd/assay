# Contract — Score service (`POST /score`, seam §5)

Independently callable (DEC-10), scenario-blind, honestly real even in the mock (DEC-4). Propagates bands (DEC-15); verdicts return on the four-stop scale with `margin` bands. All declines are first-class `Refusal`s (seam §1).

## Request

```
POST /score
{
  plan: Ref,                                  // the plan to score (stated routes; not searched)
  world: Ref,                                 // an already-excursioned CompiledWorld (DEC-10)
  scenario: LogicalId,                        // recorded on verdicts for provenance only
  knowledge_overrides?: {ref: Ref, answer: Band}[],  // perturbation hook — for this call only
  engine_version: string
}
```

## Response

```
→ { verdicts: CommitmentVerdict[], scores: PlanScore[], stamp }        // success
| Refusal { refused: true, reason, offending: Ref[], explanation }      // decline
```

## Behavioural contract

1. **Verdicts** — one `CommitmentVerdict` per commitment, `verdict ∈ {robust, marginal, tight, violated}` via the signed-margin-band mapping (research note §3), `margin` a `Band` shown on demand. Verdicts crossing the seam are the four-stop scale only (G2). Returned canonically ordered by `commitment` id.
2. **Scores** — banded `PlanScore[]` (criteria vector); no scalar, no weighted total (DEC-19).
3. **Metric propagation** — interval arithmetic on pure bands; reproduces O-1 exactly. Route metrics by `(cell,time)` resolution over the sparse world (research note §2).
4. **Trace** — one `scored_from` edge from each returned verdict/score to the `world` (G3); a backward walk from any verdict reaches named knowledge and owners. A verdict with no backward chain is a defect.
5. **Determinism** — `stamp = hash(inputs)` (plan ref, world stamp, sorted overrides, engine version); same inputs ⇒ byte-identical stamp and identical verdicts/scores (G1). Never hashes materialised cells.
6. **Perturbation hook** — `knowledge_overrides` substitutes answers for the call only; **nothing is stored** and no knowledge edge is written; only the returned verdict/score artefacts join the store/trace on their own lineage.
7. **Comparability guard** — mixed stamps between the plan's assumptions and the `world` refuse `stamp_mismatch`, naming the disagreeing refs; persists nothing.
8. **Honesty (G6)** — widening any input band never narrows any output band; every point-realisation scores inside the output band; a widening never yields a more confident verdict. Binding via oracle O-1–O-4 (vignette §9).
9. **No delta** — scoring is a read-of-world producing verdicts, not a knowledge write; it publishes no delta (seam §10 is for cross-surface *writes*).

## Refusals (all first-class, persist nothing)

| reason | when |
|---|---|
| `stamp_mismatch` | plan's assumption lineage disagrees with the world's stamp (comparability guard) |
| `unknown_ref` | `plan` or `world` names no live object |

Everything else (a valid plan scoring `violated` on a `must`) is a **success** carrying honest verdicts — a failing plan is not a refusal.
