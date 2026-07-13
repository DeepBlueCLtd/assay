# Phase 1 — Data Model (SPEC-08)

Domain entities are generated from LinkML (`src/generated/types.ts`, slice D2) and must not be hand-edited. **SPEC-08 changes no schema** — every stored shape it needs already exists (D2, SPEC-06, SPEC-07). This file maps the spec's entities to the existing LinkML shapes and defines the handful's service types (movement, not stored objects).

## Existing LinkML types reused (source of truth — do not hand-edit)

| Entity | Shape | Notes |
|---|---|---|
| `Plan` / `ElementPlan` / `RouteLeg` | timed routes for the five force elements (DEC-20) | the generated candidates; stored & content-addressed |
| `PlanScore` | `{plan, scenario, world_stamp, criterion, score, engine_version}` | banded criteria; returned in `scores` |
| `CommitmentVerdict` | `{plan, commitment, scenario, world_stamp, verdict, margin?, engine_version}` | `margin` is the oriented criterion the organiser reads |
| `Band` | `{lo, hi, unit}` | pure closed interval (DEC-15); compared by the conservative interval order |
| `CompiledWorld` | sparse channels + `stamp` + `scenario?` | the world the handful is planned against; `stamp` seeds determinism |
| `TraceEdge` (`scored_from`) | written by the scorer per verdict → world | every handful member opens a backward chain (G3) |

No enum or class edit is required; `npm run gen` is **not** run in this slice.

## Service types added (`src/seam.ts` — movement, not stored objects)

| Type | Shape | Notes |
|---|---|---|
| `HandfulRequest` | `{world: Ref, seed: number, count?: number, engine_version: string}` | `count` clamped to `[3,5]` (default 5); scenario is derived from the world (seam §6 request shape) |
| `HandfulOrganisation` | `{distinct_because: string[]}` | derived reasons, index-aligned to `plans` |
| `HandfulSuccess` | `{plans: Ref[], scores: PlanScore[], organisation, stamp}` | the seam §6 return shape |
| `HandfulResult` | `HandfulSuccess \| Refusal` | `unknown_ref` is the only handful-specific refusal reason (already in `RefusalReason`) |

## Internal shapes (not exported at the seam)

| Type | Shape | Notes |
|---|---|---|
| `AxisSignature` | `{approach, suppression, causeway, extraction}` | `src/generate.ts`: the four Meridian axes (research note §5.2); drives generation + the diversity cap |
| `Criterion` / `CriteriaVector` | `Band \| null` / `Criterion[]` | `src/dominance.ts`: a plan's per-commitment margin vector; `null` = `violated` (worst) |
| `Candidate` | `{sig, planRef, vector, scores}` | `src/handful.ts`: a scored candidate before organisation |

## Determinism

`stamp = SHA-256(canonicalJson({world: world.stamp, seed, count, engine_version}))` — over inputs, never over materialised cells (seam §1). The generator is a pure function of `(config, seed)`; the organiser and diversity cap are pure functions of the scored vectors + seed. Same inputs ⇒ byte-identical stamp and identical ordered `plans`/`scores`/`organisation` (G1).
