# Phase 1 — Data Model (SPEC-09)

Domain entities are generated from LinkML (`src/generated/types.ts`, slice D2) and must not be hand-edited. **SPEC-09 changes no schema** — every stored shape it needs already exists (D2). This file maps the spec's entities to the existing LinkML shapes and defines the relaxation service's movement types.

## Existing LinkML types reused (source of truth — do not hand-edit)

| Entity | Shape | Notes |
|---|---|---|
| `RelaxationReport` | `{logical_id, version, world_stamp, scenario, candidates[], tie_break?}` (extends StoredObject) | returned as `report`; stored & content-addressed |
| `RelaxationCandidate` | `{plan, sacrificed: LogicalId[] (non-empty), narrative}` | one per surviving inclusion-minimal sacrifice set |
| `Commitment` | `{..., tier: must\|should\|prefer, ...}` (DEC-19) | tiers drive the lexicographic ranking; **no weight slot** |
| `Plan` / `ElementPlan` / `RouteLeg` | timed routes for the five force elements (DEC-20) | the authored candidate geometry; stored & content-addressed |
| `CommitmentVerdict` | `{plan, commitment, scenario, world_stamp, verdict, margin?, engine_version}` | `verdict` (`violated`) is read for the sacrifice set; `margin` for the trace drawer only |
| `TraceEdge` (`cited_in`, `sacrificed_in`) | written by the relax service | candidates trace back to knowledge (G3) |

No enum or class edit is required; `npm run gen` is **not** run in this slice.

## Service types added (`src/seam.ts` — movement, not stored objects)

| Type | Shape | Notes |
|---|---|---|
| `RelaxRequest` | `{world: Ref, commitments: Ref[], seed: number, engine_version: string}` | seam §7 request shape; scenario derived from the world (DEC-10) |
| `RelaxSuccess` | `{report: RelaxationReport, stamp: string, feasible?: {plan: Ref}}` | `feasible` set only when a candidate needs no sacrifice (FR-013 — never a candidate with empty `sacrificed`) |
| `RelaxResult` | `RelaxSuccess \| Refusal` | `unknown_ref` is the only relax-specific refusal reason (already in `RefusalReason`); scorer refusals pass through |

## Internal shapes (not exported at the seam)

| Type | Shape | Notes |
|---|---|---|
| `SacrificeSet` | `string[]` (sorted commitment ids) | `src/tiers.ts`: a candidate's `violated` commitments |
| `TierCost` | `[musts, shoulds, prefers]` counts | `src/tiers.ts`: the lexicographic key (ascending = least-worst first) |
| `RelaxCandidate` (internal) | `{plan, planRef, sacrificed, narrative, verdicts}` | `src/relax.ts`: a scored candidate before organisation |

## Determinism

`stamp = SHA-256(canonicalJson({world: world.stamp, commitments: sorted ids, seed, engine_version}))` — over inputs, never over materialised cells (seam §1). The candidate set is a pure function of `(seed)`; scoring is the deterministic SPEC-07 scorer; inclusion-minimality and tier ranking are pure functions of the scored sacrifice sets, with the content-neutral id tie-break making the order total. Same inputs ⇒ byte-identical stamp and identical ordered report (G1).
