---
description: "Task list for SPEC-06 — Compile (knowledge → CompiledWorld)"
---

# Tasks: Compile — knowledge → CompiledWorld (SPEC-06)

**Input**: Design documents from `specs/006-compile/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/compile-service.md, quickstart.md
**Tests**: REQUIRED — constitution quality gate 2 mandates contract-invariant tests written against the seam §4 shape and **confirmed failing before implementation** (TDD).
**Organization**: by user story (priority order) after a shared foundational substrate (the schema change + service skeleton). Stage-2 exits (build plan) are the acceptance scenarios.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: parallelizable (different file, no dependency on an incomplete task)
- **[Story]**: US1 (contested/demo, P1) · US2 (determinism, P2) · US3 (trace, P2) · US4 (stale, P3) · US5 (firewall/waiver, P3)

## Path conventions
Single project: `src/`, `tests/`, `fixtures/`, `schema/` at repo root. Reuse `src/{store,trace,canonical,validate,seam,encoding,knowledge}.ts`, `src/generated/types.ts`, `src/components/{bandPill,provenanceChip,refusalBanner}.ts`. **Never hand-edit `src/generated/types.ts`** — edit `schema/*.yaml` and regenerate via `npm run gen`.

---

## Phase 1: Setup

- [ ] T001 Confirm the Stage-1 baseline is green: `npm install`, `npm run typecheck`, `npm test` (89 SPEC-05 tests). Record any failing baseline before Stage-2 code.
- [ ] T002 Confirm the pieces SPEC-06 reuses exist: `KnowledgeService.isCompilable`/`effectiveStatus` (`src/knowledge.ts`), the pure `checkEncoding` (`src/encoding.ts`), `TraceEdgeType` includes `compiled_into|waives`, and `fixtures/coas.json` carries the R1/R2/R3/R3m excursions.

## Phase 2: Foundational (schema change + service skeleton — blocks all stories)

**Purpose**: the sparse-channel schema, regenerated types, the vignette config fixture, and the compile service shell every story composes.

- [ ] T003 Edit `schema/*.yaml` for the sparse-channel decision (research note `02-compile.md`, data-model.md): replace `Channel.cells` with `default: Band` + `regions: RegionOverride[]`; add `RegionOverride {region, value: Band, from_step?, until_step?, source?}`, `VignetteConfig {grid, channels: ChannelDefault[], regions: RegionGeometry[], subject_map: SubjectMapEntry[]}`, `ChannelDefault {kind, default: Band}`, `RegionGeometry {name, x0, y0, x1, y1}`, `SubjectMapEntry {subject, channel, region}`; remove `ChannelCell`. Then `npm run gen` and `npm run typecheck` (expect the bench script — dense-only — still to compile; it is the documented counterfactual).
- [ ] T004 Author `fixtures/vignette-config.json`: Meridian grid (60×60, 2 km, 6 h, 56); per-channel `default` bands (quiet defaults for mobility/tide/storm/civil_density/sensor/threat); region geometry rects for every region the fixtures name (`approach`, `causeway`, `port_district`, `garrison`, `air_defence`/Carrick strip, `battery`/Carrick Head, `mine_stock`, `halcyon_strait`, `carrick`, `voss_chain`, `fac_waters`, `open_water`); and a `subject_map` routing every compilable K subject to its `(channel, region)` (`mobility.approach`→mobility/approach; `mobility.causeway`→mobility/causeway; `civil_density.port_district`→civil_density/port_district; `threat.garrison`→threat/garrison; `weather.tide_storm`→storm/open_water; `threat.fac_sorties`→threat/fac_waters; `threat.air_defence`→threat/air_defence; `threat.battery`→sensor/battery; `threat.mine_stock`→threat/mine_stock). `scenario.likelihood` is **absent** from the map (firewalled). Extend `tests/fixtures.test.ts` to validate it against the generated types.
- [ ] T005 [P] Add compile service types to `src/seam.ts`: `CompileRequest`, `CompileSuccess`, `CompileResult` (per data-model.md). Reuse `Refusal`/`RefusalReason`/`Ref`. Types only.
- [ ] T006 Scaffold `CompileService` in `src/compile.ts`: constructor composes `ObjectStore`, `TraceStore`, and a `KnowledgeService` (for `isCompilable`/`effectiveStatus`); private helpers for ref-resolution, subject routing, and edge writes. No behaviour yet — the shell the story phases fill.

**Checkpoint**: sparse-channel types generated; config fixture validates; the compile shell compiles.

---

## Phase 3: User Story 1 — Contested knowledge never compiles (P1) 🎯 MVP + demo moment

**Goal**: `compile` runs the refusal gates before building anything; the contested pair refuses `contested_knowledge`; resolve → recompile succeeds. Nothing persists on refusal.
**Independent test**: `compile` with K12 contested → `Refusal{contested_knowledge, offending:[K12a,K12b]}`, world/edge counts unchanged; `resolve(K12a)` → recompile succeeds, `mine_stock` region sourced from K12a.

- [ ] T007 [US1] Write the compile-refusal contract tests FIRST and confirm failing — `tests/compile.test.ts`: `compile` (K12 contested) → `contested_knowledge` naming both; assert store world-count and edge-count unchanged (SC-001); `unknown_ref` for a missing ref; nothing stored on any refusal.
- [ ] T008 [US1] Implement the refusal gates + success path in `src/compile.ts`: resolve refs (`unknown_ref`) → `contested_knowledge` via `isCompilable` → `stale_input` via `effectiveStatus` → `encoding_violation`/`waiver_required` via `checkEncoding` → partition (firewall `scenario_weight`, skip answer-absent) → build sparse channels (defaults + `RegionOverride`s routed by `subject_map`, `source` set, validity → windows) → stamp → store (idempotent) → write `compiled_into` per consumed + `waives` per waiver → return `{world, stamp, compiled_from}`. Make T007 pass; no delta (D7).
- [ ] T009 [US1] Add the resolve→recompile case to `tests/compile.test.ts`: after `KnowledgeService.resolve(K12a)`, `compile` succeeds and the `threat` channel's `mine_stock` region's `source` is K12a (SC-001).
- [ ] T010 [P] [US1] Wire the compile refusal into the gallery/demo harness reusing `src/components/refusalBanner.ts` — the contested K12 pair rendered side by side ("view contest", ui-design §3.4.3). The demo moment: attempt compile, watch it refused.

**Checkpoint**: the demo moment runs — contested never compiles; resolve, recompile; MVP delivered.

---

## Phase 4: User Story 2 — Deterministic stamp (P2)

**Goal**: identical inputs → byte-identical stamp + world hash; order-independent; excursion changes the stamp reproducibly.
**Independent test**: compile the resolved base twice → identical stamp/world hash; compile R2 → different, reproducible stamp.

- [ ] T011 [US2] Write the determinism tests FIRST and confirm failing — extend `tests/compile.test.ts`: two compiles of the identical resolved set → same `stamp` and world hash; `knowledge` presented in a different order → same stamp (consumed sorted by `logical_id`); `compile(scenario=R2)` → different-but-reproducible stamp (SC-002).
- [ ] T012 [US2] Ensure the stamp is `contentHash({consumed: sortByLogicalId(refs), config, engine_version, seed?})` and the R2 excursion overrides are folded into the stamp's `config` (FR-004/010). Make T011 pass.
- [ ] T013 [P] [US2] Add a sparse-cost assertion to `tests/compile.test.ts`: a compiled Meridian world canonicalises + hashes in well under one second (an upper-bound guard, SC-006) — the sparse counter to the dense ~19 s bench.

**Checkpoint**: the world is reproducible and cheap — the property every downstream demo rests on.

---

## Phase 5: User Story 3 — Every channel traces backward to named knowledge (P2)

**Goal**: one `compiled_into` edge per consumed object; every `RegionOverride` names its `source`; backward walk complete.
**Independent test**: compile the base → every region override has a `source`; one `compiled_into` per consumed object; `/trace/backward` from the world terminates in named owners, no dead ends.

- [ ] T014 [US3] Write the trace tests FIRST and confirm failing — extend `tests/compile.test.ts`: exactly one `compiled_into` edge per consumed object and none for firewalled/unconsumed; every `RegionOverride.source` names a stored KnowledgeObject with a named owner; a backward walk from the world is `complete: true` with no dead ends (SC-003, G3).
- [ ] T015 [US3] Ensure the success path writes the edges and sets `source` exactly (T008 covers writing; this hardens the "exactly one, none for firewalled" and the backward-complete assertions). Make T014 pass.
- [ ] T016 [P] [US3] Implement `channelTrace(world, config): string` in `src/components/channelTrace.ts` (framework-free HTML; per channel, per region: `bandPill(value)`, `provenanceChip` of the backing object, and the `source` logical id) and write `tests/channelTrace.test.ts` FIRST (no bare scalar; every region names its backing knowledge). Types-only import.
- [ ] T017 [P] [US3] Add the channel-trace surface to the fixture-backed gallery (`npm run gallery`) over the resolved Meridian base, alongside the compile demo moment; confirm the gallery builds.

**Checkpoint**: every channel value walks back to named knowledge with a named owner — the trace-drawer substrate.

---

## Phase 6: User Story 4 — Stale knowledge never compiles silently (P3)

**Goal**: `stale_input` when a consumed object is stale/superseded; consuming the live version succeeds.
**Independent test**: with K5 superseded by K9, `compile` naming K5 → `stale_input`; naming K9 → succeeds.

- [ ] T018 [US4] Write the stale test FIRST and confirm failing — extend `tests/compile.test.ts`: `supersede(K9, K5)` then `compile` over a set naming K5 → `Refusal{stale_input, offending:[K5]}`, nothing stored; over a set naming K9 → succeeds, tide/storm channels from K9's window (SC-004).
- [ ] T019 [US4] Confirm the `stale_input` gate (T008) reads `effectiveStatus ∈ {stale, superseded}` and orders after `contested_knowledge` and before construction. Make T018 pass.

**Checkpoint**: staleness cannot leak into a world silently — the Stage-6 staleness thesis stays honest.

---

## Phase 7: User Story 5 — The compile firewall holds (P3)

**Goal**: `scenario_weight` never compiles; K8's waiver writes a `waives` edge; encoding re-checked as defence in depth.
**Independent test**: no K14a–c in any channel and no `compiled_into` for one; K8 → one `waives` edge; a consumed `assumption`-as-`hard_constraint` → `encoding_violation`.

- [ ] T020 [US5] Write the firewall/waiver tests FIRST and confirm failing — extend `tests/compile.test.ts`: zero K14a–c values in any channel and zero `compiled_into` edges for them (SC-005); K8 compiles with exactly one `waives` edge K8 → constraint (seam §4); a consumed `assumption`+`hard_constraint` object → `encoding_violation` (FR-007).
- [ ] T021 [US5] Confirm the partition firewalls `scenario_weight`, the success path writes a `waives` edge per waiver-carrying consumed object, and the defence-in-depth `checkEncoding` runs on every consumed object (T008 covers the wiring; this locks the assertions). Make T020 pass.

**Checkpoint**: the whole firewall (contested/stale/encoding/weight/waiver) holds at the compile — G5 completed, G2/G3 maintained.

---

## Phase 8: Polish & cross-cutting

- [ ] T022 Full G2 sweep: assert no compile response and no channel-trace row exposes a bare assessed scalar across the whole compiled Meridian base (a single failure is a review-blocking G2 violation). Cross-check against `quickstart.md`.
- [ ] T023 Run `npm run gen` (clean), `npm run typecheck`, `npm test` all green; `npm run gallery` builds with the compile demo moment; `npm run bench` still runs (documented dense counterfactual, unused by the compile path).
- [ ] T024 Batch-propagate the canonical docs in the same change: `docs/assay-knowledge-model.md` §7 (sparse Channel + VignetteConfig shapes) and its LinkML block; `docs/assay-seam-contract.md` open item 2 (mark resolved by `02-compile.md`, note the shape change); `docs/assay-vignette.md` §11 note if channel-cell latitude wording needs it; the CLAUDE.md current-phase line (Stage 2 built).
- [ ] T025 Confirm the register candidate (concept §6, item 12) is recorded and flagged; leave ratification to the next batch (do not self-ratify — DEC-2).

---

## Dependencies & execution order

- **Setup (T001–T002)** → **Foundational (T003–T006)** → user stories. **The schema change (T003) + config fixture (T004) block everything** — no channel can be built until the sparse types exist and the config maps subjects to regions.
- **User-story order** is priority: US1 (T007–T010) is the MVP + demo moment and lands first. US2/US3 (P2) then US4/US5 (P3). The service acts all live in `src/compile.ts` (sequential there); their tests and the `channelTrace` component are [P].
- **Polish (T022–T025)** last, including the batch propagation.

## Parallel opportunities
- Foundational: T005 (seam types) ∥ T004 (config fixture) once T003's schema+regen lands.
- Components/gallery: T010 (refusal banner reuse) ∥ T016 (channelTrace) ∥ T017 (gallery) — different files.
- `src/compile.ts` logic (T008/T012/T015/T019/T021) is **sequential** (same file).

## MVP scope
**User Story 1 only** (T001–T010): a `/compile` that refuses to build a world on contested knowledge and renders the refusal — the Stage-2 demo moment and the completion of G5. Everything else (determinism proof, trace edges, staleness, firewall generalisation) is incremental delivery on top.
