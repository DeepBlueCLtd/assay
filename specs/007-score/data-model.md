# Phase 1 — Data Model (SPEC-07)

Domain entities are generated from LinkML (`src/generated/types.ts`, slice D2) and must not be hand-edited. **SPEC-07 changes no schema** — every stored shape it needs already exists (added by D2 and SPEC-06). This file maps the spec's entities to the existing LinkML shapes and defines the scorer's service types (not stored objects, so not LinkML shapes).

## Existing LinkML types reused (source of truth — do not hand-edit)

| Entity | Shape | Notes |
|---|---|---|
| `Band` | `{lo, hi, unit}` | pure closed interval, no midpoint (DEC-15); the atom of every propagation |
| `Commitment` | `{statement, tier, metric, comparator, threshold, unit, owner, scope?}` | DEC-19; threshold is scalar fact-of-intent (DEC-14) |
| `Comparator` | `at_most \| at_least \| by_step \| never` | reduced to a signed margin band (research note §3) |
| `VerdictBand` | `robust \| marginal \| tight \| violated` | four stops, no decimals (DEC-9) |
| `CommitmentVerdict` | `{plan, commitment, scenario, world_stamp, verdict, margin?, engine_version}` | one per commitment; `margin` on demand |
| `PlanScore` | `{plan, scenario, world_stamp, criterion, score, engine_version}` | banded criteria vector (SPEC-08 organises) |
| `Plan` / `ElementPlan` / `RouteLeg` / `TaskWindow` | timed routes + task windows (DEC-20) | the scorer evaluates stated geometry, never searches |
| `CompiledWorld` / `Channel` / `RegionOverride` | sparse channels (SPEC-06) | materialised lazily at score time; never stored dense |
| `VignetteConfig` / `RegionGeometry` | grid + region geometry | the `RegionName → cell rect` map read by materialisation |
| `TraceEdge` (`scored_from`) | `{from_hash, to_hash, edge_type, stamp?, written_by}` | one per verdict/score → world (G3) |

`scored_from` is already in `TraceEdgeType` (D2). No enum or class edit is required; `npm run gen` is **not** run in this slice.

## Service types added (`src/seam.ts` — movement, not stored objects)

| Type | Shape | Notes |
|---|---|---|
| `KnowledgeOverride` | `{ref: Ref, answer: Band}` | perturbation hook; substitutes for the call only (seam §5) |
| `ScoreRequest` | `{plan: Ref, world: Ref, scenario: LogicalId, knowledge_overrides?: KnowledgeOverride[], engine_version: string}` | scenario is recorded for provenance; the world is already excursioned (DEC-10) |
| `ScoreSuccess` | `{verdicts: CommitmentVerdict[], scores: PlanScore[], stamp: string}` | verdicts canonically ordered by commitment id |
| `ScoreResult` | `ScoreSuccess \| Refusal` | `stamp_mismatch` is the only scorer-specific refusal reason (already in `RefusalReason`) |

## Internal shapes (not exported at the seam)

| Type | Shape | Notes |
|---|---|---|
| `Interval` | operates on `Band` directly | `src/interval.ts`: `add/sub/scaleBy/max/min/contains/width`; unit-checked, rejects non-finite |
| `MetricFn` | `(plan, world, config, commitment) => Band` | `src/metrics.ts`: reach-step / exposure / state families keyed by `Commitment.metric` |
| margin band | `Band` oriented so satisfied ⟺ `lo ≥ 0` | `src/score.ts`: `verdictFor(marginBand) => VerdictBand` is the signs-only mapping |

## Determinism

`stamp = SHA-256(canonicalJson({plan: ref, world: world_stamp, overrides: sortedOverrides, engine_version}))` — over inputs, never over materialised cells (research note §2; seam §1). Overrides sorted by `ref.logical_id`; verdicts returned sorted by `commitment` id. Same inputs ⇒ byte-identical stamp and identical verdicts/scores (G1).
