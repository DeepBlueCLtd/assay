# Tasks: Collection discrimination v2 — sharper where-to-look (SPEC-23)

Dependency-ordered. `[P]` = parallelisable. **Gate**: the note-08 §7 amendment present (DEC-11) and concept §6 items 25/26 flagged — Phase A produces both; Phases B–F do not start until Phase A lands.

## Phase A — research amendment & register candidates (the DEC-11 gate)

- [X] **T01** Amend `docs/research/08-analysis.md` (§7): the operative-pair derivation rule (verdict divergence only; COA-vocabulary restriction; comparability guard first; the five degenerate states decided), the three-way classification (disjoint/partial/nested; endpoint-touching → partial; endpoint-sharing containment → nested; the honest one-sidedness of "cannot discriminate"), the ExpectedAnswer provenance shape (full `Provenance`, optional slot, `missing_expected_answer_provenance` warning lint) and the Meridian fixture assignments.
- [X] **T02** Flag concept §6 items 25 (ExpectedAnswer provenance — schema change touching DEC-18/DEC-9) and 26 (operative-pair conditioning — ranking semantics touching DEC-18); **do not assert** either decision (DEC-2).

## Phase B — schema (after Phase A)

- [X] **T03** `docs/assay-knowledge-model.md`: add optional `provenance` to the `ExpectedAnswer` class in the §11 LinkML block + the §4 slot-table row; strike the §12 open item (resolved by §6.25, pending ratification).
- [X] **T04** `schema/assay-knowledge-model.yaml`: the same change, extracted verbatim (a divergence is a defect).
- [X] **T05** `npm run gen` — regenerate `src/generated/types.ts`; never hand-edited.

## Phase C — fixtures + lint (after Phase B)

- [X] **T06** `fixtures/knowledge.json`: every `ExpectedAnswer` on K11 and K13 carries provenance per the amendment (K11: assessed · moderate · J-2 red cell; K13: assessed · low · J-2 red cell; neither single-source). Content hashes churn; acceptable under DEC-21.
- [X] **T07** `src/lint.ts`: `expectedAnswerProvenanceLint` — warning per provenance-less row; wired into `src/knowledge.ts` `#lints` (create + supersede; response and delta). `src/seam.ts` `LintWarning.code` widens. [P]
- [X] **T08** `tests/fixtures.test.ts`: every fixture ExpectedAnswer carries provenance (SC-004); `tests/lint.test.ts` + `tests/knowledge.test.ts` lint cases.

## Phase D — seam + service (after Phase A; [P] with B/C)

- [X] **T09** `src/seam.ts`: `SeparationClass`, `OperativePairEvidence`, `OperativePair`, `OperativePairs`; `CoaPairSeparation.classification`; `DiscriminationEntry.operative_best?`; `DiscriminationSuccess.{mode, operative?, statement?}`; `DiscriminationRequest.tensor?`. Sweep seam-contract §8.
- [X] **T10** `src/discrimination.ts`: `deriveOperativePairs(tensor, coas)` (verdict divergence only, evidence carried, stamped); `classifySeparation(a, b)`; comparability guard; the five degenerate states with statements; operative-led sort (nested excluded from could-discriminate emphasis and tie-breaks); **`computeSeparation` untouched** (byte-identical v1 numerics).

## Phase E — surfaces (after Phase D)

- [X] **T11** `src/components/discriminationTable.ts`: mode/statement line with operative witnesses; operative-best leading column; per-pair classification word + mark; expected-answers block with band pill + provenance chip per COA (G3 owner named).
- [X] **T12** `src/components/legends.ts`: `separation_class` + `operative_pair` entries; `discriminationTable` pill set gains them + `provenance`.
- [X] **T13** `src/app/state.ts`: capture the SPEC-10 tensor during snapshot assembly; pass it to `analyse`; deps include the robustness stamp so the panel re-renders when the tensor moves.

## Phase F — tests, batch propagation & verify

- [X] **T14** `tests/discrimination.test.ts` v2 suite: operative derivation + evidence (SC-001); K11 > K13 operative (SC-002); the pinned v1≠v2 divergence case (both orderings); classification on the frozen matrix incl. K13 R1/R3 nested + touching-endpoint boundary (SC-003); degenerate statements (SC-005); determinism (G1); no-likelihood (FR-007).
- [X] **T15** Sweep peers: seam-contract §8; vignette §5 (event-matrix provenance note); `CLAUDE.md` current-phase line; `docs/status.yml` updates feed entry.
- [X] **T16** Regenerate committed assets that render the table: `npm run gallery`, `npm run build:app` (+ `npm run flow` / `npm run embeds` if touched).
- [X] **T17** Verify: `npm run gen` idempotent, `npm run typecheck` clean, `npm test` green; v1 separations byte-identical; no oracle/verdict/coverage-row change.
