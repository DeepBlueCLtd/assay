# Implementation Plan: Attention ordering — the scenario-weight firewall's positive half (SPEC-22)

**Spec**: `specs/022-attention-ordering/spec.md` · **Research note**: `docs/research/11-attention.md` (**DEC-11 gate — authored first**; decides the interval-order rule, the attention-layer stratification, the queue tie-break trigger and pair lift, and the contested/missing-weight postures) · **Register**: concept §6 item 24 (flagged, not asserted; sharpens knowledge-model §9's "order attention and reporting" — no schema change)

## Shape — the note decides, the code carries

```
Phase A  note 11 + concept §6.24                 ── ordering rule, layers, tie-break, edge cases
   ▼
Phase B  src/attention.ts (pure seam)            ── interval order reused from dominance.ts; layers; pair lift
   ▼
Phase C  surfaces                                ── scenarioStrip attention block; discriminationTable stated tie-break; legends
   ▼
Phase D  queue assembly + app wiring             ── state.ts seeds K14a–c, passes likelihoods, composes the tie-break
   ▼
Phase E  tests (both halves) + batch propagation ── weight-edit-changes-nothing; import isolation; regen assets
```

Nothing in B–E starts before the note lands (DEC-11). No register decision is asserted — the sharpening is a **flagged candidate** (concept §6.24) awaiting the next batch (DEC-2).

## The load-bearing facts

- **The comparison already exists**: `dominance.ts` `strictlyBetter(a, b, 0)` is exactly the interval order's `lo(a) > hi(b)` (note 03 §5). `src/attention.ts` delegates to it — no new comparison machinery, no scalar sort key anywhere (FR-002).
- **The compile firewall is untouched**: `scenario_weight` is filtered at the compile partition (`mayCompileAsConstraintOrCost`) and K14 writes pass `checkEncoding` — so seeding K14a–c into the app store is a legal knowledge write whose edits provably move no stamp (FR-004). No `src/compile.ts`/`score.ts`/`materialise.ts`/`metrics.ts` edit exists in this slice.
- **The analysis service stays weight-free** (note §3.5): the tie-break composes in the queue assembly (`src/app/state.ts`), around an untouched `DiscriminationService` — its ranking and stamp never see a weight. This keeps "attention only" machine-checkable and DEC-18 intact.
- **The verdict grid does not move** (spec US1 AS-2): the attention block renders *above* the SPEC-10 strip; scenario columns keep their logical-id order (note 06 §4); cells, worst-case column, collapse markers all byte-unchanged for the same tensor.
- **Import isolation is structural** (FR-005/US3): `attention.ts` + `scenarioStrip.ts` import no scoring machinery; `compile`/`score`/`dominance`/`relax` import nothing from them — asserted by a source-reading test, not convention.

## Module design

- `src/attention.ts` (new, pure):
  - `strictlyAbove(a: Band, b: Band): boolean` — unit-guarded delegate to `dominance.strictlyBetter(a, b, 0)`.
  - `attentionLayers(items)` → `{ layers: string[][], unranked: string[] }` — longest-chain stratification; contested/missing bands → `unranked`; level scenarios in logical-id order (stated).
  - `pairRanksAbove(pairA, pairB, bandsById)` — the conservative pair lift over the symmetric difference.
  - `weightTieBreak(ranking, bearsOn, bandsById)` → `{ order, statements }` — reorders **only** adjacent exact-equal `best_separation` groups; returns the DEC-19-style statement per moved/preferred entry; never touches unequal entries.
- `src/components/scenarioStrip.ts`: optional `opts.likelihoods` (`{scenario, name?, logical_id, band?, provenance?, jipoe_step?, contested?}[]`) → the attention block: layer rows on a shared 0–100 % track (`bandPill` with `trackLo: 0, trackHi: 100`), provenance chip welded on (DEC-9), `data-logical-id` for the G3 trace, contest marks, "no assessment" row, persistent **"orders attention — never compiles"** label. Omitted opts ⇒ byte-identical SPEC-10 output (backwards compatible for flow/existing callers).
- `src/components/discriminationTable.ts`: optional `opts.tieBreaks: Map<questionId, string>` → a stated tie-break line on the affected rows. No opts ⇒ unchanged output.
- `src/components/legends.ts`: `attention` entry ("orders attention — never compiles…") + `scenarioStrip` pill set gains it; `discriminationTable` set gains the tie-break gloss via the same entry.
- `src/app/state.ts`: seed K14a–c (legal writes; deltas expected); commander strip panel gets `likelihoods` assembled from each ScenarioCOA's `likelihood` ref (latest version, effective status → contested flag) with K14 hashes added to panel deps (glow, G6); the J-2 discrimination panel composes `weightTieBreak` and passes `tieBreaks` down.
- `scripts/build-gallery.ts`: same `likelihoods` wiring so the banked demo moment shows the exhibit.

## Testable seams (Node, vitest)

- `tests/attention.test.ts` — layers: R1 above level {R2,R3} (the Meridian exhibit); all-overlap ⇒ one layer; nesting ⇒ level; missing ⇒ unranked never defaulted; contested ⇒ unranked + excluded. Pair lift: {R1,R2} > {R2,R3}; {R1,R2} vs {R1,R3} unranked. Tie-break: fires only at exact band equality; never reorders unequal entries (DEC-18 primary never overridden); overlap ⇒ stated fallback.
- `tests/scenarioStrip.test.ts` — attention block: bands via the shared track, layer structure (R1's row above the R2/R3 row), label present, provenance chips welded, `data-logical-id` hooks, verdict grid byte-identical with and without likelihoods; no scalar sort attribute in the DOM.
- `tests/attention-firewall.test.ts` — **FR-004**: seed app → snapshot → edit K14a band (legal write) → snapshot: all stamps identical (world, r3m, handful, relax, robustness, sensitivity, discrimination, staleness), verdict panels unchanged; strip attention block moved. **Import isolation**: read `src/{attention,components/scenarioStrip}.ts` — no scoring imports; read `src/{compile,score,dominance,relax,materialise,metrics}.ts` — no attention/strip imports. Existing firewall suites (`encoding`, `compile`) pass unchanged.

## Out of scope / deferred (tracked)

- **Register ratification** of the sharpening — next batch; until then it is concept §6.24, flagged.
- **Any third weight-consuming behaviour** (FR-006) — a new candidate, never an extension.
- **Discrimination v2** (operative-pair conditioning, `specs/023-discrimination-v2/`) — separate slice; the tie-break composes with whatever primary ranking that slice decides.
