# Implementation Plan: Collection discrimination v2 — sharper where-to-look (SPEC-23)

**Spec**: `specs/023-discrimination-v2/spec.md` · **Research note**: `docs/research/08-analysis.md` **§7 amendment** (**DEC-11 gate — authored first**; decides the operative-pair derivation, the three-way classification incl. the endpoint-touching boundary, and the ExpectedAnswer provenance shape + lint posture) · **Register**: concept §6 items 25 (ExpectedAnswer provenance — schema change, touches DEC-18/DEC-9) and 26 (operative-pair conditioning — ranking semantics, touches DEC-18's "computed, never asserted" discipline); both flagged, not asserted (DEC-2)

## Shape — the note decides, the code carries

```
Phase A  note-08 §7 amendment + concept §6.25/§6.26   ── derivation rule, classification, provenance shape, lint posture
   ▼
Phase B  schema (doc §4/§11 → yaml → regen)           ── optional provenance slot on ExpectedAnswer (DEC-21 regen)
   ▼
Phase C  fixtures + lint                              ── K11/K13 rows carry provenance; missing_expected_answer_provenance warning
   ▼
Phase D  seam + service                               ── OperativePairs derivation; classification; mode/statement; v1 numerics untouched
   ▼
Phase E  surfaces                                     ── table v2 (operative lead, class words, expected-band chips); legends; app wiring
   ▼
Phase F  tests + batch propagation + regen assets + verify
```

Nothing in B–F starts before the amendment lands (DEC-11). No register decision is asserted — both candidates are **flagged** (concept §6.25/§6.26) awaiting the next batch (DEC-2).

## The load-bearing facts

- **The tensor already exists** (SPEC-10 `ScenarioVerdictTensor`) and is computed in the app snapshot *before* the discrimination panel assembles — the operative derivation is a fold over it (DEC-10 posture: no new engine). It is passed into `DiscriminationRequest` as an optional field; absent tensor = v1 all-pairs semantics with the stated fallback.
- **v1 numerics are frozen**: `computeSeparation` is not edited. The classification is a separate predicate; `operative_best` is a new field; `best_separation` keeps v1 semantics (all-pairs best) so existing consumers and tests read unchanged values byte-for-byte (spec US2 AS-2).
- **The schema flows one way**: `docs/assay-knowledge-model.md` §11 → `schema/assay-knowledge-model.yaml` (verbatim) → `npm run gen`. Both doc and yaml change in the same commit. Content-hash churn on K11/K13 is expected and acceptable (DEC-21); no test pins a hash constant.
- **The comparability guard precedes derivation** (spec Assumptions): `stamps_compatible: false` → all-pairs fallback with the reason stated, never a silently conditioned ranking.
- **K14 never enters** (FR-007): the derivation reads verdicts only; there is no likelihood input anywhere in the service.

## Seam types (movement, not stored LinkML)

- `OperativePairEvidence {plan, commitment, verdict_a, verdict_b}` — the witness a pair renders.
- `OperativePair {a, b, evidence[]}` · `OperativePairs {pairs[], stamp}` — derived, seam-visible (spec Key Entities).
- `SeparationClass = 'disjoint' | 'partial' | 'nested'` — carried on each `CoaPairSeparation`.
- `DiscriminationEntry` gains `operative_best?: Band` (present iff some could-discriminate operative pair has expected answers) and per-pair `classification`.
- `DiscriminationSuccess` gains `mode: 'operative' | 'all_pairs' | 'degenerate'`, `operative?: OperativePairs`, `statement?: string` (the honest fallback/degenerate sentence, render-ready).
- `DiscriminationRequest` gains `tensor?: ScenarioVerdictTensor`.
- `LintWarning.code` widens by `'missing_expected_answer_provenance'`; sweep seam-contract §8 (discrimination response shape) and the lint list.

## Ranking (note §7.1, restated)

Operative mode leads with `operative_best` (lo desc, hi desc — v1's comparator restricted to could-discriminate operative pairs); entries without one sort after, by all-pairs `best_separation`; residual ties by could-discriminate operative-pair count, then `logical_id` (stated, content-neutral, deterministic — G1). Nested pairs never enter `operative_best` or tie-breaks. Cost stays a separate band (DEC-19).

## Surfaces — the chip is where provenance lives

- `src/components/discriminationTable.ts`: a mode line above the table (operative pairs + witnesses, or the fallback/degenerate statement); an "operative" leading column in operative mode; per-pair classification word + mark (✓ discriminates / ~ weak — could discriminate / ✕ cannot discriminate), legend-keyed; an expected-answers block per row (band pill **+ provenance chip** per COA — reuses `provenanceChip`, G3 owner named).
- `src/components/legends.ts`: `separation_class` and `operative_pair` entries; `discriminationTable` pill set gains them + `provenance`.
- `src/app/state.ts`: capture the robustness tensor during snapshot assembly and pass it to `analyse`; panel renders the statement/mode line.

## Testable seams (Node, vitest)

- `tests/discrimination.test.ts` — v1 suite untouched and green (byte-identical separations); v2 suite: operative derivation from a tensor with P1's C1/C2 flipping across {R1,R2} (SC-001, evidence pinned); K11 > K13 on the operative ranking (SC-002); the **pinned divergence case** — strong-{R1,R3}-only vs moderate-{R1,R2}: v1 ranks the former first, v2 the latter (both orderings asserted); classification table on the frozen matrix incl. K13 R1/R3 **nested** and the touching-endpoint boundary (SC-003); degenerate states render their statements (SC-005); K14 absence (FR-007).
- `tests/lint.test.ts` — provenance-less ExpectedAnswer warns; provenance-carrying row silent; `tests/knowledge.test.ts` — warning on write response and delta.
- `tests/fixtures.test.ts` — every fixture ExpectedAnswer carries provenance (SC-004).
- Component assertions — classification words render; chips render on expected bands; mode/statement lines render.

## Out of scope / deferred (tracked)

- **Register ratification** of §6.25/§6.26 — next batch.
- **SPEC-22 attention ordering** (likelihood tie-breaks in the queue layer) — separate slice; nothing here reads K14.
- **S-D decision-support matrix** — consumes this slice's ranking; not built here.
