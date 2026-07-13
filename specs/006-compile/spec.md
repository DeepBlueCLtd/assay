# Feature Specification: Compile — knowledge → CompiledWorld (SPEC-06)

**Feature Branch**: `claude/next-spec-gfmn70` (spec dir `006-compile`)

**Created**: 2026-07-12

**Status**: Draft

**Stage**: Build-plan Stage 2 · **Depends on**: SPEC-01 (store), SPEC-02 (trace store), SPEC-05 (knowledge service — `isCompilable`/`effectiveStatus`, encoding firewall), D3 (seam contract §4) · **Research note**: `docs/research/02-compile.md` (DEC-11 gate — present)

**Input**: Compile service (`POST /compile`: knowledge subset + vignette config → CompiledWorld with mobility/tide/storm/civil-density/sensor/threat channels), a deterministic stamp, `compiled_into` edges per consumed object, and the compile refusal paths (`contested_knowledge`, `stale_input`, encoding defence-in-depth) — the Stage-2 slice that turns typed knowledge into the deterministic, fully-traceable world every downstream service scores against, and completes invariant G5 (contested never compiles) at the compile refusal.

## User Scenarios & Testing *(mandatory)*

Thesis A (an honest JIPOE pipeline) continues here: SPEC-05 made the *knowledge* honest at write time; SPEC-06 makes the *world built from it* honest — deterministic, backward-traceable to named owners, and refusing to be built on contested or stale judgement. Every scenario below is a Stage-2 exit criterion (build plan §Stage 2) played on the Meridian fixtures (vignette §4–§5); every channel value crosses the seam as a `Band` with provenance (constitution II / G2), and no dense per-cell surface is ever stored or hashed (research note `02-compile.md`).

### User Story 1 — Contested knowledge never compiles (Priority: P1)

Two sources disagree on the garrison's sea-mine stock — a defector debrief (K12a, 30–60) and pre-war manifests (K12b, 140–220) — and the pair is `contested` (SPEC-05). A planner attempts to compile the Meridian world. The compile **refuses**, naming the K12 pair, because the mine-threat channel cannot be built on a disputed number. When the analyst resolves the contest (naming a surviving version), the recompile succeeds and the mine-threat channel is built from the survivor alone. This is the demonstrator's Stage-2 signature moment: **"contested never compiles."**

**Why this priority**: This is the Stage-2 demo moment (DEC-23) and the completion of invariant G5 — SPEC-05 marked and blocked the pair; the *refusal to compile* is where the block becomes visible discipline. It is also the smallest viable slice with teeth: a compile that can refuse before it can succeed.

**Independent Test**: With K12a/K12b contested, call `/compile` over the Meridian knowledge set; confirm a `Refusal{contested_knowledge}` whose `offending` names both K12a and K12b, a render-ready one-sentence explanation, and that no CompiledWorld and no `compiled_into` edge is persisted. Resolve the contest to K12a; recompile; confirm success and that the mine-threat channel's region derives from K12a only.

**Acceptance Scenarios**:

1. **Given** a knowledge set containing the contested K12a/K12b pair, **When** `/compile` is called, **Then** it refuses `contested_knowledge`, `offending` = {K12a, K12b}, and nothing is stored — no CompiledWorld, no edge, no delta (G5; seam §4; knowledge model §9).
2. **Given** the same refusal, **When** it renders, **Then** a compile refusal banner names the K12 pair with a "view contest" side-by-side (ui-design §3.4.3) — the dispute is shown, not averaged into a channel.
3. **Given** the contest is resolved naming K12a as the survivor, **When** `/compile` is called again, **Then** it succeeds and the mine-threat channel's `mine_stock` region derives from K12a alone, backward-traceable to K12a's named owner.
4. **Given** the resolved recompile, **When** its stamp is compared to a compile of the identical resolved set, **Then** the two stamps are byte-identical (determinism survives the resolve).

---

### User Story 2 — The same knowledge compiles to a byte-identical stamp (Priority: P2)

A world is compiled from a fixed knowledge subset and vignette config. Compiling the identical inputs again — same knowledge versions, same config, same engine version — yields a byte-identical `stamp` and a byte-identical CompiledWorld. Applying a COA excursion (a scenario variant) yields a **different** stamp, because the excursion overrides are folded into the stamp's config, so no two materially different worlds ever collide.

**Why this priority**: Determinism (G1) is the property every downstream demo rests on — sensitivity, robustness, and staleness are re-scoring loops that mean nothing if the same inputs can produce two worlds. It is P2 because it is the invariant that makes Story 1's "resolve then recompile" reproducible and the Stage-3 scorer trustworthy.

**Independent Test**: Compile the resolved Meridian base twice; assert identical `stamp` and identical stored world hash. Compile the R2 (Strait Denial) excursion; assert its `stamp` differs from the base and is itself reproducible.

**Acceptance Scenarios**:

1. **Given** a fixed knowledge subset + config + engine version, **When** `/compile` is called twice, **Then** both calls return the same `stamp` and the same CompiledWorld content hash (G1; seam §1).
2. **Given** the stamp is a hash over consumed refs + config + engine version, **When** the consumed set is presented in a different iteration order, **Then** the stamp is unchanged (consumed refs are canonicalised in a fixed order).
3. **Given** a ScenarioCOA excursion (R2), **When** `/compile` is called with `scenario = R2`, **Then** the excursion's channel overrides are applied and recorded in the stamp's config, and the resulting stamp differs from the base world's while remaining reproducible for R2.
4. **Given** any CompiledWorld, **When** it is canonicalised and hashed in-browser, **Then** it materialises in well under one second (sparse channels — research note `02-compile.md`), never the ~19 s a dense representation would cost.

---

### User Story 3 — Every channel traces backward to named knowledge (Priority: P2)

A watcher opens any channel value in the compiled world and walks it backward: the value came from a named region override, which came from a specific KnowledgeObject, which has a named owner. No channel value is orphaned; every one terminates in named knowledge with a named owner (G3). The compile writes one `compiled_into` edge per consumed object at the moment it builds the world.

**Why this priority**: Traceability terminating in named knowledge (constitution III / G3) is what separates ASSAY from a black-box optimiser; it is the substrate the whole trace-drawer UX and the Stage-6 staleness thesis read. P2 because it is co-equal with determinism as a Stage-2 exit and a precondition for every later "why" chain.

**Independent Test**: Compile the resolved Meridian base; for every channel region override, confirm a `source` naming the KnowledgeObject it derives from and a `compiled_into` edge from that object to the world; walk `/trace/backward` from the world and confirm every chain terminates in a KnowledgeObject with a named owner (`complete: true`).

**Acceptance Scenarios**:

1. **Given** a successful compile, **When** the world is built, **Then** exactly one `compiled_into` edge is written per consumed KnowledgeObject (KnowledgeObject → CompiledWorld), and none for firewalled or unconsumed objects (DEC-21; knowledge model §10).
2. **Given** any channel region override, **When** its provenance is inspected, **Then** it names the KnowledgeObject (`source`) that produced it, and that object carries a named owner (G2/G3).
3. **Given** the compiled world, **When** a backward trace is walked from it, **Then** every chain terminates in a named KnowledgeObject and no chain is a dead end (`complete: true`); a dead end is a surfaced error, never hidden (G3; seam §9).

---

### User Story 4 — Stale knowledge never compiles silently (Priority: P3)

The met forecast K5 has been superseded by K9 (SPEC-05), so K5 is `stale`. A compile that would consume the stale K5 **refuses** `stale_input` rather than quietly building a world on an expired forecast. Recompiling past staleness is an explicit human act — swap in K9, or re-validate — never a silent skip.

**Why this priority**: Staleness-as-refusal (knowledge model §9) is the compile-time guard that makes the Stage-6 staleness thesis (F) honest: a superseded input cannot leak into a fresh world. P3 because its dramatic payoff — the delta feed flagging exactly the K5-dependent verdicts — lands at Stage 6; here it is the guard that prevents the leak.

**Independent Test**: With K5 superseded by K9, call `/compile` over a set that names K5; confirm `Refusal{stale_input}` naming K5 and that nothing is stored. Call `/compile` over the set that names K9 instead; confirm success.

**Acceptance Scenarios**:

1. **Given** K5 has been superseded (its `effectiveStatus` is `stale`/`superseded`), **When** a compile consumes K5, **Then** it refuses `stale_input` naming K5 and stores nothing (knowledge model §9).
2. **Given** the same scenario, **When** the compile consumes K9 (the live forecast) instead, **Then** it succeeds and the tide/storm channels derive from K9's surge window (validity steps 8–36).
3. **Given** a stale input, **When** the refusal renders, **Then** it names the stale object and states that recompiling requires an explicit re-validation or supersession — not a degraded world.

---

### User Story 5 — The compile firewall holds: weights never compile, waivers are recorded, violations are caught (Priority: P3)

The COA likelihoods (K14a–c) are `scenario_weight` and never enter any channel by any path — they order attention and reporting only. K8 (the battery radar assessment, treated as a hard constraint under waiver W-1) compiles **and** records a `waives` edge where the constraint bites. As defence in depth, the compile re-checks the encoding-discipline table and refuses anything an earlier engine version might have let through.

**Why this priority**: The firewall (knowledge model §9) is the honesty spine of the compile; the `scenario_weight` firewall is the vignette's dedicated exhibit (K14), and the `waives` edge is where SPEC-05's inline waiver finally earns its trace edge (seam §4). P3 because the P1 refusal already proves the firewall's teeth; this generalises it across the remaining rows.

**Independent Test**: Compile the Meridian set; confirm no `scenario_weight` object (K14a–c) appears as any channel region and no `compiled_into` edge is written for one; confirm K8 compiles with a `waives` edge from K8 to the constraint it licenses; construct an `assumption`-as-`hard_constraint` object in the consumed set and confirm the compile refuses `encoding_violation`.

**Acceptance Scenarios**:

1. **Given** the Meridian knowledge set including K14a–c, **When** it compiles, **Then** no `scenario_weight` value reaches any channel and no `compiled_into` edge is written for K14a–c — the firewall holds by omission and by explicit guard (knowledge model §9; DEC-6).
2. **Given** K8 (assessed, `hard_constraint`, waiver W-1) in the consumed set, **When** it compiles, **Then** the constraint is built and a `waives` edge is written from K8 to the constraint use it licenses, so the waiver renders wherever the constraint bites (seam §4; constitution III).
3. **Given** a consumed object that is `assumption` claiming `hard_constraint` (or `reported`/`assessed` without a waiver), **When** the compile runs its defence-in-depth check, **Then** it refuses `encoding_violation` (or `waiver_required`) even though the knowledge service should have caught it upstream (seam §4).

### Edge Cases

- **Open/unanswered questions in the set** (K11, K13): carry no answer, so they are *not consumed* — no channel, no `compiled_into` edge, and not an error (an unanswered question has nothing to compile).
- **A subject the config maps to no channel region**: a fixture/config completeness defect surfaced (a thrown configuration error), never a silently dropped input (research note `02-compile.md` — "surfaced, not silently dropped").
- **Unknown ref in the requested knowledge set**: refused `unknown_ref` naming the missing ref.
- **A COA excursion naming a region the config does not know**: a fixture defect surfaced, not a silent no-op.
- **Overlapping time windows on one region** (K5 steps 0–16 vs K9 steps 8–36 if both consumed): the later `from_step` wins at the overlap, deterministically (research note `02-compile.md` §3) — though in Meridian K5 is stale by the time K9 is live, so US4 refuses the mixed set anyway.
- **A degenerate band from an `observed` input** (K1 charted approach): compiles as a degenerate (`lo == hi`) channel band — fact, permitted unbanded upstream but carried as a `Band` at the seam (G2).
- **Recompiling the identical world**: idempotent at the store — the same content hash, no duplicate world; edges are not duplicated for an already-present world.

## Requirements *(mandatory)*

### Functional Requirements

**Compile & channel construction**

- **FR-001**: The system MUST expose a compile act — `POST /compile {knowledge: Ref[] | selector, scenario?: Ref, config, engine_version} → {world: Ref, stamp, compiled_from: Ref[]} | Refusal` — that transforms a knowledge subset and vignette config into a CompiledWorld with the six channels (`mobility, tide, storm, civil_density, sensor, threat`). (seam §4; knowledge model §7)
- **FR-002**: Channels MUST be stored **sparse**: each channel carries a `default: Band` and a set of named, optionally time-boxed `RegionOverride`s; no dense per-cell channel is ever stored or hashed. Region→cell geometry lives once in the vignette config, not per world. (research note `02-compile.md`; resolves seam open item 2; concept §6 candidate)
- **FR-003**: Each consumed KnowledgeObject's `subject` MUST route, via the vignette config, to a `(channel, region)` address, and its banded answer MUST become that region's override `value`; a validity window MUST become the override's `{from_step, until_step}`. An `observed` answer compiles as a degenerate band (fact), still carried as a `Band` at the seam. (knowledge model §5/§7/§9; G2)
- **FR-004**: A COA excursion (`ScenarioCOA.excursion`), when a `scenario` is supplied, MUST be applied as additional/replacing `RegionOverride` layers and recorded in the stamp's config, keeping the scorer scenario-blind (it is handed a fully-materialisable world, not a base plus a special case). (knowledge model §6; DEC-10)

**Refusals (the compile firewall)**

- **FR-005**: The compile MUST refuse `contested_knowledge` if any consumed object's `effectiveStatus` is `contested`, naming the contested pair in `offending`, and MUST persist nothing on refusal. It MUST consult SPEC-05's `isCompilable`/`effectiveStatus` as the single source of truth for G5, not re-derive contested status. (G5; seam §4; knowledge model §9)
- **FR-006**: The compile MUST refuse `stale_input` if any consumed object's `effectiveStatus` is `stale`/`superseded`, naming the stale object; recompiling past staleness is an explicit human act (re-validation or supersession), never a silent skip. (knowledge model §9)
- **FR-007**: As defence in depth, the compile MUST re-run the encoding-discipline check on every consumed object and refuse `encoding_violation`/`waiver_required` for anything an earlier engine version may have let through. (seam §4)
- **FR-008**: `scenario_weight` objects MUST be firewalled from compilation by any path — never a channel region, never a `compiled_into` edge; they order attention and reporting only. (knowledge model §9; DEC-6)
- **FR-009**: A requested ref with no live version MUST be refused `unknown_ref`; a subject or excursion region the config maps to nothing MUST surface as a configuration error, never a silent drop. (research note `02-compile.md`)

**Determinism, trace, and edges**

- **FR-010**: The `stamp` MUST be a hash over `{consumed refs (in a fixed canonical order), config, engine_version, seed?}`; identical inputs MUST yield a byte-identical stamp and a byte-identical CompiledWorld; a scenario excursion MUST change the stamp via the recorded config. (G1; seam §1)
- **FR-011**: On success, the compile MUST write exactly one `compiled_into` edge per consumed object (KnowledgeObject → CompiledWorld) and a `waives` edge from each waiver-carrying object to the constraint use it licenses; no edge for firewalled or unconsumed objects. (DEC-21; knowledge model §10; seam §4)
- **FR-012**: Every channel region override MUST name the KnowledgeObject it derives from (`source`), so a backward walk from the world terminates in named KnowledgeObjects with named owners and no dead ends (`complete: true`). (G3; constitution III; seam §9)
- **FR-013**: No channel value derived from a `reported`/`assessed`/`assumption` source may cross the seam or render unbanded; every channel value is a `Band` with provenance reachable through its `source`. Only `observed`-derived values may be degenerate. (constitution II; G2; DEC-9/14)

**Surface**

- **FR-014**: The compile refusal MUST render as a first-class banner where the compile was attempted, naming the reason and offending refs (the K12 pair, with a "view contest" side-by-side for `contested_knowledge`); a refusal is never a silent failure or a degraded world. (ui-design §3.4.3; seam §1)
- **FR-015**: A minimal channel-trace surface MUST render each compiled channel's regions with their band pill, provenance, and backing KnowledgeObject (the backward trace), holding no private derived state and arranging projections of the compile response only. (constitution I; DEC-5; ui-design)

### Key Entities *(include if feature involves data)*

- **CompiledWorld**: the deterministic compile product `{grid, channels, consumed, scenario?, engine_version, stamp}`; content-addressed and stamped. (DEC-5; knowledge model §7)
- **Channel** (sparse): `{name, kind, default: Band, regions: RegionOverride[]}` — the MCOO decomposed into a typed layer of deviations from a default (research note `02-compile.md`).
- **RegionOverride**: `{region, value: Band, from_step?, until_step?, source?}` — one named, optionally time-boxed deviation, naming the KnowledgeObject it derives from.
- **VignetteConfig**: `{grid, channels (defaults), regions (geometry), subject_map}` — the single home of `RegionName → cells` geometry and `subject → (channel, region)` routing; kept once, not copied per world.
- **ConsumedRef**: `{logical_id, content_hash}` — the exact knowledge versions the compile read; the stamp's substance. (knowledge model §7)
- **TraceEdge**: `compiled_into` (KnowledgeObject → CompiledWorld) and `waives` (waiver-carrying object → the constraint it licenses), written at compile time. (DEC-21; knowledge model §10)
- **Refusal**: a first-class outcome `{reason, offending refs, explanation}`; `contested_knowledge | stale_input | encoding_violation | waiver_required | unknown_ref`. (seam §1)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: With K12 contested, `/compile` refuses `contested_knowledge` naming both K12a and K12b in a single action, with a legible explanation, and persists nothing (0 worlds, 0 edges, 0 deltas from the refused compile); after a resolve, the recompile succeeds. *(demo moment)*
- **SC-002**: Compiling identical inputs twice yields a byte-identical `stamp` and world hash; a COA excursion (R2) yields a different but reproducible stamp. **100%** stamp reproducibility across repeated compiles.
- **SC-003**: **Every** channel region override in the compiled Meridian base names its backing KnowledgeObject and has a `compiled_into` edge; a backward walk from the world terminates in named owners with **zero** dead-end chains.
- **SC-004**: A compile consuming stale K5 refuses `stale_input`; the same compile consuming live K9 succeeds — staleness never leaks into a world silently.
- **SC-005**: **Zero** `scenario_weight` values (K14a–c) appear in any channel and **zero** `compiled_into` edges are written for them; K8's waiver produces exactly one `waives` edge.
- **SC-006**: Any compiled Meridian world canonicalises and hashes in well under one second in-browser (sparse channels), versus the measured ~19 s a dense world costs — a ≥ 20× headroom against the target.
- **SC-007**: **Zero** bare assessed scalars appear in any compile response or on the channel-trace surface; every non-`observed` channel value is a `Band` with provenance (G2 spot-check passes).

## Assumptions

- SPEC-01 (store), SPEC-02 (trace store), and SPEC-05 (`KnowledgeService` with `isCompilable`/`effectiveStatus`, the pure encoding firewall `checkEncoding`, and edge-derived lifecycle) are in place and are composed, not re-implemented; the compile reuses the firewall and the G5 predicate rather than duplicating policy.
- The sparse channel representation and the retirement of dense `Channel.cells` are decided by research note `02-compile.md` (the DEC-11 gate) and recorded as a flagged register candidate (concept §6, item 12); SPEC-06 builds against it under seam open item 2's delegated authority, pending batch ratification.
- The Meridian vignette §4–§5 fixtures (K1–K14, the K12a/K12b pair, the R1/R2/R3/R3m excursions in `fixtures/coas.json`) are the sole fixture source; a new `fixtures/vignette-config.json` supplies grid, per-channel defaults, region geometry, and the `subject → (channel, region)` map. A change breaking a §7 coverage row is a register matter (constitution, Fixtures).
- The routing-search structure (time-expanded subgraph vs `(cell, time)` state) is a Stage-3 concern flagged forward to `03-score-plan.md`; SPEC-06 lays the time-windowed sparse surface only and commits to no search model.
- `POST /compile` is the mock's synchronous in-browser function with the seam §4 shape; a real transport can replace it without client change (DEC-4). No delta is specified for compile in the seam (compile is a read-of-knowledge that produces a world, not a knowledge write); the delta feed continues to be fed by the knowledge acts.
