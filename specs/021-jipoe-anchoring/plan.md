# Implementation Plan: JIPOE anchoring — knowledge names its doctrinal origin (SPEC-21)

**Spec**: `specs/021-jipoe-anchoring/spec.md` · **Research note**: amendment to `docs/research/01-knowledge.md` (**DEC-11 gate — authored first**; fixes the step vocabulary, the K1–K14 assignments, the singular-origin rule, and the lint posture) · **Register**: concept §6 item 23 (flagged, not asserted; schema change touches DEC-6)

## Shape — the note decides, the code carries

```
Phase A  note-01 amendment + concept §6.23        ── vocabulary, assignments, K10 resolution, lint posture
   ▼
Phase B  schema (doc §11 → yaml → regen)          ── JipoeStep enum + optional jipoe_step slot (DEC-21 regen)
   ▼
Phase C  fixtures + pinned oracle-style test      ── all seventeen K objects carry their step
   ▼
Phase D  lint + surfaces                          ── missing_jipoe_step warning; chip/legend render the step
   ▼
Phase E  batch propagation + regen assets + verify
```

Nothing in B–E starts before the amendment lands (DEC-11). No register decision is asserted — the slot is a **flagged candidate** (concept §6.23) awaiting the next batch (DEC-2).

## The load-bearing facts

- **The assignments already exist as prose** — note 01 §3 audits K1–K14 against the four JIPOE steps; the amendment restates them one object at a time (resolving K10, which §3 skipped) so the fixture annotation is a transcription, not fresh analysis.
- **The schema flows one way**: `docs/assay-knowledge-model.md` §11 is the source of truth → `schema/assay-knowledge-model.yaml` (extracted verbatim) → `npm run gen` → `src/generated/types.ts` (never hand-edited). Both doc and yaml change in the same commit (the extraction-verbatim rule).
- **Content-hash churn is expected and acceptable** (DEC-21, spec Assumptions): fixture identity is vignette-controlled (`logical_id` + `version`), the store address changes with the bytes. No test pins a hash constant; compile stamps are compared run-to-run, never against literals.
- **No banded/scalar semantics change** (FR-005): the slot is doctrinal metadata. Compile, score, and every G2/G6 surface are untouched by construction — no `src/compile.ts`/`score.ts` edit exists in this slice.

## Lint — mirror the width lint, minus the observed exemption

- `src/lint.ts` gains `jipoeStepLint(ko)` → `missing_jipoe_step` warning (never a refusal; severity decided in the amendment, recalibrated after Checkpoint 1 / DEC-27).
- **`observed` is NOT exempt** (unlike `confidence_width_floor`): origin applies to facts too; open questions likewise covered (they are the step-1-gap-origin objects).
- `src/seam.ts`: `LintWarning.code` widens to a two-member union; `Delta` gains optional `warnings?: LintWarning[]` so the delta records the warning (spec US3 AS-1) — swept into seam-contract §10 in the same change.
- `src/knowledge.ts`: `create` and `supersede` both run the lints; warnings ride the write response and the published delta.

## Surfaces — the chip is where provenance lives

- `src/components/provenanceChip.ts` gains an optional `jipoeStep` argument rendered **in words** (e.g. `JIPOE 3 · evaluate the adversary`), one chip style, all surfaces consistent. Signature stays types-in/HTML-out; no app-state coupling (SPEC-14).
- Callers swept: `src/components/s1Table.ts`, `src/components/channelTrace.ts`, `src/flow.ts` pass `ko.jipoe_step`.
- `src/components/legends.ts`: new `jipoe` legend entry; added to the pill sets of the chip-bearing components (`s1Table`, `channelTrace`).

## Testable seams (Node, vitest)

- `tests/fixtures.test.ts` — the **pinned assignment table** (oracle-style: exact per-object equality for all seventeen ids; drift fails).
- `tests/lint.test.ts` — step-less write warns; observed **not** exempt; step-carrying object silent.
- `tests/knowledge.test.ts` — step-less `create` succeeds with the warning in the response **and** on the delta; nothing refused.
- `tests/s1Table.test.ts` (+ chip-level assertions) — K8's row renders the step in words; legend documents it.

## Out of scope / deferred (tracked)

- **Companion comms artefacts** (crosswalk page, divergence register, citation-hardening, README status fix) — DEC-30 category, not spec features; shipped alongside in the same PR at owner direction (they remain comms artefacts, never cited as authority).
- **Register ratification** of the slot — next batch; until then it is concept §6.23, flagged.
- **Forward derivation** (issue #43) — this slice is its first concrete step, nothing more.
