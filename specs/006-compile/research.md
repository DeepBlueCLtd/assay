# Phase 0 — Research & Design Decisions (SPEC-06)

The doctrinal/representation research is done in `docs/research/02-compile.md` (the DEC-11 gate): it decides the **sparse channel representation** from the Stage-0 benchmark and ATP 2-01.3 MCOO doctrine, treats a COA excursion as a region-override layer, windows time into the overlay (not into a compiled graph), and reuses SPEC-05's edge-derived status for the refusals. This file records the **implementation** decisions the plan rests on; no `NEEDS CLARIFICATION` remain — scope is fixed by the build plan §Stage 2 and the seam contract §4.

## D1 — Sparse channels: `default` + named, time-boxed `RegionOverride`s

- **Decision**: `Channel = { name, kind, default: Band, regions: RegionOverride[] }`, `RegionOverride = { region, value: Band, from_step?, until_step?, source? }`. Dense `Channel.cells` (the current LinkML shape) is **retired**. Region→cell geometry moves to a `VignetteConfig` object; region→cell materialisation is a lazy, unstored, score-time function (Stage 3), never persisted or hashed.
- **Rationale**: A dense Meridian world is ~1.2M cells → 84.9 MB, ~19.4 s serialise+hash per recompile (measured, `npm run bench`) — not viable even in the mock, and stamp determinism (G1) forbids shortcutting the serialisation. MCOO overlays record *deviations from a default*, not per-cell attributes (ATP 2-01.3), so sparse is the doctrinally native shape, not a compression trick. The fixtures already speak it (`coas.json` excursions are `{channel, region, override}`). Kilobytes, not 85 MB.
- **Alternatives**: dense cells (rejected — measured non-viable); run-length regions (rejected — more machinery than named regions need at this scale; named regions are the MCOO idiom and already in the fixtures).

## D2 — The stamp is over inputs, never over materialised cells

- **Decision**: `stamp = SHA-256(canonicalJson({ consumed: refsSortedByLogicalId, config, engine_version, seed? }))`. The CompiledWorld object is stored content-addressed as usual, but its determinism and the Stage-2 exit rest on the *input* hash, not on hashing any dense surface.
- **Rationale**: Seam §1 already defines the stamp over inputs; the dense cost was the cost of *storing* a dense product, not of stamping it. Sorting `consumed` by `logical_id` makes the stamp order-independent (FR-010, AS-2). A scenario excursion changes the stamp because the applied overrides are folded into `config`.
- **Alternatives**: hash the materialised world (rejected — reintroduces the 19 s cost and couples determinism to representation); include wall-clock (rejected — breaks G1, DEC-17).

## D3 — Subject → (channel, region) routing lives in the config, not in string parsing

- **Decision**: The `VignetteConfig` carries a `subject_map: { subject → { channel, region } }`. The compile routes each consumed object's `subject` (a topic key per knowledge model §5) through this map; `scenario.*` subjects are absent from the map and additionally firewalled by explicit guard. A compilable subject the map does not cover is a thrown configuration error (surfaced, not dropped).
- **Rationale**: `subject` is documented as "a compile channel or topic key" (knowledge model §5) — `weather.tide_storm` (K5/K9) must reach the `tide`/`storm` channels, `threat.garrison` the `threat` channel's `garrison` region; a config-owned map states this doctrine explicitly and auditably rather than hiding it in dotted-string parsing. It keeps "which topic feeds which channel region" a configuration concern, where it belongs.
- **Alternatives**: parse the dotted `subject` as `channel.region` (rejected — `weather` is not a ChannelKind; couples topic vocabulary to channel names and can't express one topic feeding two channels); hard-code the routing in `compile.ts` (rejected — buries fixture-specific doctrine in code).

## D4 — Refusals reuse SPEC-05's `isCompilable`/`effectiveStatus`; encoding re-checked for defence in depth

- **Decision**: `contested_knowledge` and `stale_input` are decided by `KnowledgeService.effectiveStatus`/`isCompilable` (SPEC-05), not re-derived. `encoding_violation`/`waiver_required` re-run the pure `checkEncoding` from `src/encoding.ts` on every consumed object. All are first-class `Refusal`s; nothing persists on refusal (the refusal is computed before any world or edge is written).
- **Rationale**: G5 must live in one place (SPEC-05 D7 established `isCompilable` as the single truth); the compile is a *consumer* of that predicate. Re-checking encoding is seam §4's explicit defence-in-depth ("anything the knowledge service let through in an earlier engine version"). Reusing the pure firewall keeps `compile.ts` a thin orchestration and avoids policy drift.
- **Alternatives**: re-implement contested/stale detection in the compile (rejected — duplicates the invariant, invites drift); trust the knowledge service and skip the encoding re-check (rejected — seam §4 mandates the defence-in-depth pass).

## D5 — A COA excursion is a region-override layer applied at compile

- **Decision**: When `scenario` is supplied, load the `ScenarioCOA` and apply each `excursion` entry (`{channel, region, override: Band, from_step?}`) as an additional/replacing `RegionOverride` on the named channel, then fold the applied overrides into the stamp's `config`. The scorer receives a fully-materialisable world, never a base plus a special case (DEC-10).
- **Rationale**: Base channels and excursions share one shape (D1), so "compile a scenario world" is "apply the overrides." Recording them in the stamp keeps two scenario worlds off one base distinct (FR-010, AS-3). This is exactly what `coas.json` already encodes.
- **Alternatives**: a scenario-aware scorer that applies excursions at score time (rejected — DEC-10 keeps the scorer scenario-blind; the world must be self-contained).

## D6 — `source` on RegionOverride complements `compiled_into` edges for the channel-value trace

- **Decision**: Each `RegionOverride` carries `source?: LogicalId` naming the KnowledgeObject that produced it, in addition to the per-object `compiled_into` edge (KnowledgeObject → CompiledWorld). The `source` is a logical-id reference, not a scalar, so it introduces no banded-honesty risk and is deterministic (derived from consumed).
- **Rationale**: G3 wants "any channel cell walks back to named knowledge." The `compiled_into` edges give the world-level backward walk; `source` pins *which* knowledge a *specific region value* came from, which the "open a channel value → trace drawer" UX (build plan §Stage 2 user-observable) needs. One is the graph edge, the other is the inline pointer; together they make the channel-trace surface a projection, not a computation.
- **Alternatives**: reconstruct the region→object mapping from `compiled_into` edges + the subject_map at render time (rejected — makes the surface compute rather than arrange projections, constitution I).

## D7 — Compile publishes no delta

- **Decision**: `/compile` writes trace edges (`compiled_into`, `waives`) but publishes **no** delta. The delta feed is fed by the knowledge acts (SPEC-05) and later by relax/select (SPEC-09/§11).
- **Rationale**: Seam §4 specifies the compile response as `{world, stamp, compiled_from}` with no delta; a compile is a read-of-knowledge producing a world, not a cross-surface knowledge write. The events that drive the S4 feed are the knowledge writes and the commander's acts, not each recompile (which is deterministic and reproducible on demand). Keeping compile delta-free avoids flooding the feed with reproducible artefacts.
- **Alternatives**: publish a `compile` delta (rejected — not in the seam §4 shape; a recompile is not a new fact, and the feed would fill with deterministic noise).

**Output**: all decisions resolved; no NEEDS CLARIFICATION remain. Proceed to Phase 1.
