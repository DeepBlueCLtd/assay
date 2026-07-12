# Contract — Compile service (SPEC-06)

The seam §4 compile act, expressed as a typed async function on `CompileService`
(the mock runs synchronously in-browser; the signature is async so a real transport
can replace it without client change — DEC-4, seam §1). The act either returns its
success shape or a first-class `Refusal` (never throws for a domain refusal; a
configuration/fixture defect — e.g. an unmapped subject — is a thrown error, not a
domain refusal). Shapes reference `src/generated/types.ts` (post-regen) and the seam
types in `data-model.md`.

## `compile(req: CompileRequest): CompileResult`
Seam: `POST /compile`.

- **Request**: `{ knowledge: Ref[] | selector, scenario?: Ref, config: VignetteConfig, engine_version, seed? }`.
- **Pre**: each requested ref has a live version (else `unknown_ref`); `config.subject_map` covers every consumable subject (else a thrown configuration error — surfaced, not dropped).
- **Refuses** (first-class `Refusal`, persists nothing):
  - `contested_knowledge` — any consumed object's `effectiveStatus` is `contested`; `offending` names the contested pair (via SPEC-05 `isCompilable`). **(G5)**
  - `stale_input` — any consumed object's `effectiveStatus` is `stale`/`superseded`; `offending` names it (via `effectiveStatus`).
  - `encoding_violation` / `waiver_required` — defence-in-depth re-check via the pure `checkEncoding` (seam §4).
  - `unknown_ref` — a requested ref has no live version.
- **Firewall**: `scenario_weight` objects (K14a–c) are never consumed — no channel region, no `compiled_into` edge (knowledge model §9).
- **Skips**: objects with no `answer` (open/unanswered — K11, K13) are not consumed and are not an error.
- **On success**: builds the six sparse channels (per-channel `default` from config; a `RegionOverride{region, value, from_step?, until_step?, source}` per consumed object routed by `subject_map`); applies the `scenario` excursion as overlay overrides folded into the stamp's config; computes `stamp = hash({consumed: sortByLogicalId(refs), config, engine_version, seed?})`; stores the CompiledWorld (idempotent); writes exactly one `compiled_into` edge per consumed object and a `waives` edge per waiver-carrying object; returns `{ world: Ref, stamp, compiled_from: Ref[] }`.
- **Publishes**: **no delta** (compile is a read-of-knowledge producing a world, not a knowledge write — seam §4, research D7).
- **Invariants**: FR-001…013; G1 (deterministic stamp), G2 (banded channel values), G3 (`compiled_into` + `source`, backward-complete), G5 (contested never compiles — completed here).

## `isCompilable` / `effectiveStatus` (reused, not redefined)
- The compile consults `KnowledgeService.isCompilable(id)` and `.effectiveStatus(id)` (SPEC-05) as the single source of truth for contested/stale status. SPEC-06 adds no parallel status logic.

## Contract-invariant tests (write first, confirm failing — constitution gate 2)

`tests/compile.test.ts` asserts, before implementation:

1. **Contested never compiles**: with K12a/K12b contested, `compile` refuses `contested_knowledge`, `offending` = {K12a, K12b}; store world-count and edge-count unchanged. After `resolve(K12a)`, `compile` succeeds and the `mine_stock` region's `source` is K12a. **(SC-001, G5)**
2. **Deterministic stamp**: two compiles of the identical resolved set return the same `stamp` and the same world hash; presenting `knowledge` in a different order does not change the stamp. **(SC-002, G1)**
3. **Excursion changes the stamp**: `compile(scenario = R2)` applies the strait overrides, folds them into the stamp's config, and yields a different-but-reproducible stamp from the base. **(SC-002)**
4. **Backward-traceable**: every `RegionOverride` names a `source`; exactly one `compiled_into` edge exists per consumed object; a backward walk from the world terminates in named owners with `complete: true` and no dead ends. **(SC-003, G3)**
5. **Stale never compiles**: with K5 superseded by K9, `compile` over a set naming K5 refuses `stale_input` (offending K5); over a set naming K9 it succeeds. **(SC-004)**
6. **Weights firewalled**: no K14a–c value appears in any channel and no `compiled_into` edge is written for one. **(SC-005, knowledge model §9)**
7. **Waiver edge**: K8 compiles and exactly one `waives` edge is written from K8 to the constraint it licenses. **(SC-005, seam §4)**
8. **Encoding defence-in-depth**: a consumed `assumption`-as-`hard_constraint` object → `compile` refuses `encoding_violation` even though the knowledge service would have caught it. **(FR-007)**
9. **No bare scalar**: no compile response carries a bare assessed scalar — every channel value is a `Band`; only `observed`-derived values may be degenerate. **(SC-007, G2)**
10. **Sparse cost**: a compiled Meridian world canonicalises + hashes in well under one second (asserted as an upper bound in the test), never the dense ~19 s. **(SC-006)**
