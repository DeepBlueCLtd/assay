# Phase 1 — Data Model (SPEC-06)

Domain entities are generated from LinkML (`src/generated/types.ts`, slice D2) and must not be hand-edited. This slice **changes the schema** (the sparse-channel decision, research note `02-compile.md`) and then regenerates types via `npm run gen`. This file maps the spec's entities to the (revised) LinkML shapes and defines the compile service types this slice adds (not stored objects, so not LinkML shapes).

## Schema change (LinkML `schema/*.yaml`, then `npm run gen`)

The sparse-channel decision retires dense `Channel.cells` and adds the config shapes. **Never hand-edit `src/generated/types.ts`** — edit the LinkML source and regenerate.

| Class | Change | Shape |
|---|---|---|
| `Channel` | **replace** `cells: ChannelCell[]` | `{ name, kind: ChannelKind, default: Band, regions: RegionOverride[] }` |
| `RegionOverride` | **new** | `{ region: RegionName, value: Band, from_step?: Timestep, until_step?: Timestep, source?: LogicalId }` |
| `ChannelCell` | **remove** | (was `{x, y, t, value}`; no longer stored — materialisation is a lazy score-time function) |
| `VignetteConfig` | **new** (StoredObject) | `{ grid: GridSpec, channels: ChannelDefault[], regions: RegionGeometry[], subject_map: SubjectMapEntry[] }` |
| `ChannelDefault` | **new** | `{ kind: ChannelKind, default: Band }` |
| `RegionGeometry` | **new** | `{ name: RegionName, x0, y0, x1, y1 }` — bounding rect on the grid (a demonstrator-sufficient geometry) |
| `SubjectMapEntry` | **new** | `{ subject, channel: ChannelKind, region: RegionName }` — routes a knowledge subject to a channel region |
| `CompiledWorld` | unchanged shape | `{ grid, channels (now sparse), consumed, scenario?, engine_version, stamp }` |

`ChannelKind` (`mobility, tide, storm, civil_density, sensor, threat`) and `Band {lo, hi, unit}` (no midpoint, DEC-15) are unchanged. `RegionName` is a string alias for readability.

## Existing LinkML types reused (source of truth — do not hand-edit)

| Entity | Type | Notes |
|---|---|---|
| KnowledgeObject | `KnowledgeObject` | consumed by the compile; `subject`, `answer?: Band`, `provenance`, `validity?`, `waiver?`, `encoding_class`, `status`. |
| ScenarioCOA | `ScenarioCOA` | `{ name, narrative, excursion: ChannelOverride[], likelihood }` — the excursion layers (R1/R2/R3/R3m). |
| ChannelOverride | `ChannelOverride` | `{ channel, region?, override: Band }` — a COA's compile-time channel override (knowledge model §6). |
| GridSpec | `GridSpec` | `{ cols, rows, cell_km, timestep_hours, horizon_steps }` (Meridian 60×60, 2 km, 6 h, 56). |
| ConsumedRef | `ConsumedRef` | `{ logical_id, content_hash }` — the stamp's substance. |
| TraceEdge | `TraceEdge` | `compiled_into`, `waives` written at compile (DEC-21). |
| Band / Provenance | `Band` / `Provenance` | every channel value is a `Band` with provenance via `source` (G2). |

## Compile flow (the service orchestration)

```
compile(knowledgeRefs | selector, scenario?, config, engine_version):
  1. resolve refs → live KnowledgeObjects; unknown ref → Refusal{unknown_ref}
  2. for each consumed object (via KnowledgeService):
       effectiveStatus == contested  → Refusal{contested_knowledge, offending: pair}
       effectiveStatus in {stale, superseded} → Refusal{stale_input, offending}
       checkEncoding(ko) != null     → that Refusal (defence in depth)
  3. partition: scenario_weight → firewalled (never consumed);
                answer absent (open/unanswered) → skipped (not consumed);
                else → consumable
  4. build channels: per ChannelKind, default from config; for each consumable ko:
       (channel, region) = config.subject_map[ko.subject]  (missing → config error, thrown)
       push RegionOverride{ region, value: ko.answer, from/until from ko.validity, source: ko.logical_id }
  5. if scenario: load ScenarioCOA; apply each excursion as a RegionOverride; fold into stamp config
  6. stamp = hash({ consumed: sortByLogicalId(refs), config, engine_version, seed? })
  7. world = { grid, channels, consumed, scenario?, engine_version, stamp }; store (idempotent)
  8. write one compiled_into edge per consumed ko (ko.hash → world.hash);
     write a waives edge per waiver-carrying consumed ko
  9. return { world: Ref, stamp, compiled_from: consumedRefs }   // no delta (D7)
```

## New compile service types (not stored; defined in `src/compile.ts` / reuse `src/seam.ts`)

```ts
// Refusal, RefusalReason, Ref reused from src/seam.ts and src/store.ts (SPEC-05)

interface CompileRequest {
  knowledge: Ref[];                 // or a selector resolved to refs
  scenario?: Ref;                   // a ScenarioCOA logical id/ref (R1/R2/R3/R3m)
  config: VignetteConfig;           // grid, defaults, geometry, subject_map
  engine_version: string;
  seed?: number;
}

interface CompileSuccess {
  world: Ref;                       // stored CompiledWorld
  stamp: string;                    // hash over consumed + config + engine_version + seed?
  compiled_from: Ref[];             // exactly the consumed knowledge versions
}

type CompileResult = CompileSuccess | Refusal;   // reason ∈ contested_knowledge | stale_input
                                                 //        | encoding_violation | waiver_required | unknown_ref
```

## Validation / invariant rules (enforced by the compile)

| Rule | Source | Where |
|---|---|---|
| contested consumed → `contested_knowledge`, persist nothing | FR-005; G5 | `compile.ts` (via `isCompilable`) |
| stale/superseded consumed → `stale_input`, persist nothing | FR-006; km §9 | `compile.ts` (via `effectiveStatus`) |
| encoding re-check → `encoding_violation`/`waiver_required` | FR-007; seam §4 | `compile.ts` (via `checkEncoding`) |
| `scenario_weight` never a channel/edge | FR-008; km §9 | `compile.ts` partition + guard |
| unknown ref → `unknown_ref`; unmapped subject → config error | FR-009 | `compile.ts` |
| stamp over sorted consumed + config + engine; excursion changes it | FR-010; G1 | `compile.ts` (canonical hash) |
| one `compiled_into` per consumed; `waives` per waiver | FR-011; DEC-21 | `compile.ts` + `TraceStore` |
| every RegionOverride names its `source`; backward walk complete | FR-012; G3 | `compile.ts` + `TraceStore.backward` |
| no bare assessed scalar; every channel value a `Band` | FR-013; G2 | schema (`value: Band`) + surface uses band pill |
| channels stored sparse; no dense cell persisted/hashed | FR-002; note 02 | schema (Channel default+regions) |
