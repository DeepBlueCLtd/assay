# Tasks: JIPOE anchoring — knowledge names its doctrinal origin (SPEC-21)

Dependency-ordered. `[P]` = parallelisable. **Gate**: the note-01 amendment present (DEC-11) and concept §6 item 23 flagged — Phase A produces both; Phases B–E do not start until Phase A lands.

## Phase A — research amendment & register candidate (the DEC-11 gate)

- [X] **T01** Amend `docs/research/01-knowledge.md`: the `JipoeStep` vocabulary (JP 2-01.3's four steps verbatim), the per-object assignment table for all seventeen fixture objects (resolving K10 → step 3), the singular *originating*-step rule, and the `missing_jipoe_step` lint posture (warning-level, `observed` **not** exempt, recalibrated after Checkpoint 1 / DEC-27).
- [X] **T02** Flag concept §6 item 23 (the `jipoe_step` slot as a register candidate — schema change touching DEC-6); **do not assert** the decision (DEC-2).

## Phase B — schema (after Phase A)

- [X] **T03** `docs/assay-knowledge-model.md`: add `JipoeStep` to the §11 LinkML block (enum description citing JP 2-01.3's four steps verbatim, FR-006) and `jipoe_step` (optional) to the `KnowledgeObject` class + the §4 slot table.
- [X] **T04** `schema/assay-knowledge-model.yaml`: the same change, extracted verbatim (a divergence is a defect).
- [X] **T05** `npm run gen` — regenerate `src/generated/types.ts`; never hand-edited.

## Phase C — fixtures + pinned test (after Phase B)

- [X] **T06** `fixtures/knowledge.json`: every K1–K14 object (including retired K10 and K14a–c) carries its `jipoe_step` per the amendment table (FR-002). Content hashes churn; acceptable under DEC-21.
- [X] **T07** `tests/fixtures.test.ts`: the pinned oracle-style assignment table — exact per-object equality across all seventeen ids; any drift fails (SC-001).

## Phase D — lint + surfaces (after Phase B; [P] with Phase C)

- [X] **T08** `src/seam.ts`: `LintWarning.code` → `'confidence_width_floor' | 'missing_jipoe_step'`; `Delta.warnings?: LintWarning[]`. Sweep seam-contract doc §10 (Delta shape). [P]
- [X] **T09** `src/lint.ts`: `jipoeStepLint` — warning on a missing `jipoe_step`; `observed` **not** exempt; open questions covered.
- [X] **T10** `src/knowledge.ts`: run the lints on `create` and `supersede`; warnings on the write response and the published delta (FR-004; never a refusal).
- [X] **T11** `src/components/provenanceChip.ts`: optional `jipoeStep` argument rendered in words; sweep callers (`s1Table.ts`, `channelTrace.ts`, `src/flow.ts`) to pass `ko.jipoe_step` (FR-003). [P]
- [X] **T12** `src/components/legends.ts`: `jipoe` legend entry; wired into the chip-bearing components' pill sets.
- [X] **T13** Tests: `tests/lint.test.ts` (warn/exemption cases), `tests/knowledge.test.ts` (step-less write succeeds + warning in response and delta), `tests/s1Table.test.ts` (K8 renders its step in words; legend present).

## Phase E — batch propagation & verify

- [X] **T14** Sweep peers: `CLAUDE.md` current-phase line; `docs/status.yml` updates feed entry.
- [X] **T15** Regenerate committed assets that render the chip: `npm run gallery`, `npm run embeds`, `npm run flow`, `npm run build:app`.
- [X] **T16** Verify: `npm run gen` idempotent, `npm run typecheck` clean, `npm test` green; **no oracle, verdict, or coverage-row change** (SC-004).
