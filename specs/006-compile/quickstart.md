# Quickstart — Validate SPEC-06

Prerequisites: `npm install` once; SPEC-01/02/05 in place (store, trace store, knowledge service). This slice changes the LinkML schema — run `npm run gen` before typecheck/test.

## Commands

```
npm run gen        # regenerate types after the sparse-channel schema change (never hand-edit generated/)
npm run typecheck  # tsc --noEmit
npm test           # vitest — includes the SPEC-06 compile contract-invariant suites
npm run gallery    # regenerate the fixture-backed gallery (adds the compile demo moment)
npm run bench      # dense-world counterfactual — still ~19 s; SPEC-06 stores nothing dense
```

## What "done" looks like (maps to Success Criteria)

Run `npm test` and confirm the Stage-2 suites are green. Each maps to an acceptance scenario:

| Check | Scenario | Criterion |
|---|---|---|
| K12 contested → `compile` refuses `contested_knowledge` naming both; resolve → recompile succeeds; nothing stored on refusal | US1 / demo moment | SC-001 |
| Identical inputs → byte-identical stamp + world hash; different `knowledge` order → same stamp; R2 excursion → different reproducible stamp | US2 | SC-002 |
| Every channel region names its `source`; one `compiled_into` edge per consumed object; backward walk complete, no dead ends | US3 | SC-003 |
| Compile consuming stale K5 → `stale_input`; consuming live K9 → succeeds | US4 | SC-004 |
| Zero `scenario_weight` values in any channel; zero `compiled_into` edges for K14a–c; K8 → exactly one `waives` edge | US5 | SC-005 |
| A compiled Meridian world canonicalises + hashes in well under 1 s (sparse) | US2 | SC-006 |
| No bare assessed scalar in any compile response or on the channel-trace surface | US1/US3 | SC-007 |

## The demo moment (DEC-23) — "contested never compiles"

1. Render the Meridian knowledge base (the SPEC-05 S1 table) with K12a/K12b contested.
2. Attempt to compile the world (the gallery/demo harness calls `/compile`).
3. Observe: the compile refusal banner appears where the compile was attempted, naming `contested_knowledge`, the offending K12 pair, and a one-sentence explanation — the K12a/K12b pair shown side by side ("view contest"). Nothing is stored.
4. Resolve the contest (name K12a the survivor), then recompile: the world builds, the mine-threat channel's `mine_stock` region derives from K12a alone, and opening that channel value walks back to K12a with its named owner (J-2 red cell).

The contrast *is* the invariant: a disputed number cannot become a world; resolving the dispute — an explicit human act — is what lets the world be built, and the built world names exactly what it rests on.

## Manual G2/G3 spot-check

- **G2 (banded honesty)**: scan every channel value in a compile response and on the channel-trace surface — each is a `Band` with provenance via its `source`; only `observed`-derived values (K1 charted approach) may be degenerate. A bare assessed scalar anywhere is a failing review (constitution II).
- **G3 (traceability)**: walk `/trace/backward` from the compiled world — every chain terminates in a named KnowledgeObject with a named owner (`complete: true`). A dead end is a surfaced error, never hidden (seam §9).

References: [spec.md](./spec.md), [plan.md](./plan.md), [contracts/compile-service.md](./contracts/compile-service.md), [data-model.md](./data-model.md), research note `docs/research/02-compile.md`.
