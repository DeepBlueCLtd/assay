# Research note 02 — Compile

Stage 2 · per ASSAY-DEC-11 · 2026-07-12 · bounded to hours, one page preferred
Prompts (build plan §Stage 2): MCOO construction in ATP 2-01.3 — how doctrine layers obstacles, mobility corridors, and avenues of approach into a combined product; time-varying cost surfaces in the routing literature (time-expanded graphs vs (cell, time) state); **channel representation** — sparse (deviation-from-default or run-length regions, as MCOO overlays naturally are) vs dense, decided against the Stage-0 cost numbers before `Channel.cells` is implemented (seam contract open item 2).

## 1. MCOO construction: doctrine builds by overlay, not by cell

ATP 2-01.3, *Intelligence Preparation of the Battlefield* (Mar 2019), ch. 5, constructs the **modified combined obstacle overlay** by layering, onto a base terrain map, a small set of *marked* features: obstacles (existing and reinforcing), then the **mobility corridors** and **avenues of approach** those obstacles shape, classified by trafficability into `unrestricted / restricted / severely restricted` (SEVERELY-RESTRICTED "no-go", RESTRICTED "slow-go"). The signal fact for ASSAY: **the overlay records deviations, not attributes of every cell.** Most of the battlespace is the unrestricted default; the product names the handful of regions that differ — a wadi here, a minefield there, a corridor between two ridgelines. AAs and corridors are *named regions* (polygons/lanes with a mobility class), never per-cell paint. Weather and civil considerations enter the same way (ATP 2-01.3 ch. 4–6): a surge window, a populated district — bounded regions with a validity time, laid over an otherwise-quiet map.

Note 00 §1 already fixed that our six channels (`mobility, tide, storm, civil_density, sensor, threat`) are the MCOO decomposed into typed layers. This note adds the shape doctrine implies: **each channel is a default plus a sparse set of named, optionally time-boxed region overrides** — precisely how the fixtures already speak. Every knowledge `subject` is a `channel.region` address (`mobility.causeway`, `civil_density.port_district`, `threat.battery`); every COA `excursion` is a `{channel, region, override: Band}` layer (`coas.json`). The representation was latent in the vignette; doctrine confirms it is the honest one, not a compression trick.

## 2. The representation decision (closing seam open item 2)

**Dense is dead, by measurement.** A dense Meridian world is 60×60 × 56 × 6 ≈ 1.2M banded cells. Re-run on this session's machine (`npm run bench`, Node 22): canonical JSON **84.9 MB**, canonicalise **~9.3 s**, SHA-256 **~10.1 s** — **~19.4 s serialise+hash per recompile**, per scenario excursion world, before browser-tab memory pressure. This confirms note 00 §3; stamp determinism (G1) forbids shortcutting the serialisation, so no caching escape exists. Dense channels are not viable even in the mock.

**Adopted: sparse channels.** A channel becomes

```
Channel        = { name, kind: ChannelKind, default: Band, regions: RegionOverride[] }
RegionOverride = { region: RegionName, value: Band, from_step?: Timestep, until_step?: Timestep }
```

Region *geometry* (the `RegionName → cell set` map) lives **once** in a `VignetteConfig` object (the `config: VignetteConfigRef` the compile already takes — seam §4), never copied into every CompiledWorld. Meridian is ~6 channels × a handful of regions × the odd time window ≈ tens of overrides, not 1.2M cells: the CompiledWorld canonicalises in well under a millisecond and round-trips through the store like any other object. The demonstrator's target (note 00 §3: "well under one second per recompile") is met with three orders of magnitude to spare.

**Two consequences that make this honest, not just cheap:**

1. **The stamp is over inputs, never over materialised cells.** The seam already defines `stamp = hash(consumed refs + config + engine_version + seed?)` (§1). So determinism *never* required hashing 1.2M cells — the dense cost was the cost of *storing* a dense product, not of stamping it. Sparse removes the former without touching the latter; the Stage-2 exit ("same knowledge set ⇒ byte-identical stamp") is unaffected by representation.
2. **Region → per-cell materialisation is a lazy, unstored, score-time function.** When the Stage-3 scorer needs `channel(x, y, t)` it resolves, for that cell and timestep, the innermost active region override (or the default), reading geometry from the config. This is a pure function of `(sparse channels, config geometry)`; it produces no stored object, writes no edge, and participates in no content addressing. Nothing dense is ever persisted or hashed anywhere in the system.

**A COA excursion is a region-override layer.** Because base channels and excursions share one shape, compiling a scenario world is: take the base channel set, then apply the ScenarioCOA's `excursion` entries as additional/replacing `RegionOverride`s (R2 raises `threat.halcyon_strait`; R3 zeroes `mobility.causeway` from its demolition step via a `from_step`; R3m adds `threat.voss_chain`). The applied overrides are recorded in the stamp's config so two scenario worlds off the same base still stamp distinctly (seam §4). This unifies "compile" and "excursion" into one operation and keeps DEC-10's scenario-blind scorer honest: it is handed a fully-materialisable world, not a base plus a special case.

## 3. Time-varying cost surfaces: window the overlay, don't expand the graph

The routing literature offers two idioms for time-dependent cost: a **time-expanded graph** (replicate the grid once per timestep — here 60×60×56 ≈ 200k nodes — and connect layers), or **`(cell, time)` search state** over a single graph whose edge costs are functions of arrival time. The time-expanded graph is the wrong tool at *compile* time: it re-materialises the dense world we just refused, times 56. The honest compile product is a **time-boxed sparse surface** — a `RegionOverride` carries an optional `{from_step, until_step}`, so K5's surge (validity steps 0–16), K9's replacement (8–36), and R3's causeway demolition (zeroed from its demolition step onward) are each one windowed override, not a per-step channel copy. Resolving `channel(x, y, t)` picks the override whose window contains `t`; overlapping windows resolve innermost-wins with a documented tie order (later `from_step` wins), so the surge transition at the K5/K9 seam is deterministic.

**Flagged forward to `03-score-plan.md`:** *whether the scorer walks routes over a `(cell, time)` state search or a locally time-expanded subgraph is a Stage-3 decision, not a Stage-2 one.* Compile's contract is only to lay the windowed surface down truthfully; it commits to no search structure. Recording that boundary here is the point of the note — Stage 2 must not smuggle a routing model into the world representation.

## 4. Refusal paths and edges (grounding SPEC-06)

Compile is a firewall as much as a transform (knowledge model §9). Its refusals, all first-class `Refusal`s (seam §1), reuse SPEC-05's edge-derived lifecycle rather than re-deriving status:

- **`contested_knowledge` (G5).** Any consumed object whose `effectiveStatus` is `contested` refuses the whole compile, naming the pair — K12a/K12b block the mine-threat channel until a `resolves` edge lands. `KnowledgeService.isCompilable` (SPEC-05) is already the single truth; compile calls it, it does not re-implement G5.
- **`stale_input`.** A consumed object whose `effectiveStatus` is `stale`/`superseded` (K5 once K9 supersedes it) refuses `stale_input`. Recompiling past staleness is an explicit human act — re-validation or supersession — never a silent skip (knowledge model §9).
- **`waiver_required` / `encoding_violation` (defence in depth).** Re-check the encoding table at compile, catching anything an earlier engine version let through. K8's waived `hard_constraint` compiles *and* writes a **`waives` edge** at the point the constraint bites (seam §4) — the waiver renders wherever the constraint does.
- **`scenario_weight` firewall.** K14a–c reach no channel by any path; a `subject = scenario.likelihood` object is never resolved into a `RegionOverride`. Weights order attention and reporting only (knowledge model §9).

On success, compile writes **one `compiled_into` edge per consumed object** (KnowledgeObject → CompiledWorld), so every channel value is backward-traceable to named knowledge with named owners (G3, Stage-2 exit). The `subject`'s `channel.region` prefix is the address the compile writes into: `threat.garrison` sets the `threat` channel's `garrison` region, `weather.tide_storm` feeds the `tide`/`storm` channels' surge windows. Knowledge whose subject names no channel the config knows is a fixture defect surfaced, not silently dropped.

## 5. Determinism, restated for the sparse world

`stamp = SHA-256(canonicalJson({ consumed: sortedRefs, config, engine_version, seed? }))` (seam §1). Sorting `consumed` by `logical_id` makes the stamp independent of knowledge-set iteration order; bands are pure intervals (DEC-15) so a channel value is two numbers and a unit, canonicalised deterministically (note 00 §2). The same knowledge set + config + engine version yields a byte-identical stamp and a byte-identical CompiledWorld — the Stage-2 exit — now at kilobytes, not 85 MB.

## What we will do differently

1. **Adopt the sparse channel representation** — `{ default: Band, regions: RegionOverride[] }` with optional `{from_step, until_step}` windows — and **retire dense `Channel.cells`**. This changes a canonical LinkML shape, so it is recorded as a **flagged candidate in `assay-concept.md` §6** for the next register batch (DEC-2), resolving seam contract open item 2 (which pre-delegated the representation choice to this note and warned `Channel.cells` "may change as a result").
2. **Never store or hash materialised cells.** The stamp is over inputs; region→cell materialisation is a lazy, unstored, score-time pure function. Nothing dense is persisted anywhere.
3. **Treat a COA excursion as a region-override layer** applied at compile and recorded in the stamp's config — one shape for base channels and excursions, keeping the scorer scenario-blind (DEC-10). The fixtures already speak this language (`coas.json`).
4. **Window time into the overlay, not into the graph.** Time-boxed `RegionOverride`s carry K5/K9 validity and R3's demolition step; the routing-search structure (time-expanded subgraph vs `(cell, time)` state) is flagged forward to `03-score-plan.md` and *not* decided at compile.
5. **Reuse SPEC-05's edge-derived status** (`isCompilable` / `effectiveStatus`) for the `contested_knowledge` and `stale_input` refusals; re-check the encoding table at compile as defence in depth; write one `compiled_into` edge per consumed object and a `waives` edge where a waiver licenses a constraint.

Sources: ATP 2-01.3 (Mar 2019) ch. 4–6 (MCOO construction; mobility-corridor/AA classification `unrestricted/restricted/severely restricted`; weather and civil overlays); JP 2-01.3 (2014) ch. II (four-step process, step-2 products); routing literature on time-dependent shortest paths (time-expanded networks vs time-dependent edge-cost state) — orientation for the Stage-3 boundary only; Stage-0 microbenchmark (`scripts/bench-canonical.ts`, re-measured this session); ASSAY register DEC-5/10/15/21, knowledge model §6/§7/§9, seam contract §1/§4 and open item 2, vignette §4/§5.
