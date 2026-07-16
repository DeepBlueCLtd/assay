# Tasks: Attention ordering — the scenario-weight firewall's positive half (SPEC-22)

Dependency-ordered. `[P]` = parallelisable. **Gate**: research note `docs/research/11-attention.md` present (DEC-11) and concept §6 item 24 flagged — Phase A produces both; Phases B–E do not start until Phase A lands.

## Phase A — research note & register candidate (the DEC-11 gate)

- [X] **T01** Author `docs/research/11-attention.md`: the interval-order rule (every scalar sort key rejected — DEC-15/19), attention-layer stratification (longest chain; incomparables level; missing/contested unranked), the queue tie-break (exact band equality trigger; conservative pair lift; stated rendering; DEC-18 never overridden; queue-assembly placement), and the machine-checkable meaning of "attention only".
- [X] **T02** Flag concept §6 item 24 (the two-behaviour sharpening as a register candidate — no schema change); **do not assert** the decision (DEC-2).

## Phase B — the attention seam (after Phase A)

- [X] **T03** `src/attention.ts`: `strictlyAbove` (unit-guarded delegate to `dominance.strictlyBetter(a, b, 0)` — no new comparison machinery, FR-002), `attentionLayers` (layers + unranked), `pairRanksAbove` (conservative pair lift), `weightTieBreak` (exact-equality groups only; statements returned for rendering).

## Phase C — surfaces (after Phase B)

- [X] **T04** `src/components/scenarioStrip.ts`: optional `likelihoods` opt → the attention block above the verdict grid — layer rows on a shared 0–100 % `bandPill` track (visibly overlapping), provenance chip welded (DEC-9), `data-logical-id` trace hooks (G3), contest marks, "no assessment" for weightless scenarios, persistent "orders attention — never compiles" label; verdict grid byte-identical when opts omitted (FR-001, US1 AS-2). [P]
- [X] **T05** `src/components/discriminationTable.ts`: optional `tieBreaks` opt → stated "tie broken by scenario weight (attention only)" line on affected rows; unchanged without it (FR-003). [P]
- [X] **T06** `src/components/legends.ts`: `attention` legend entry; wired into the `scenarioStrip` and `discriminationTable` pill sets.

## Phase D — queue assembly & app wiring (after Phase C)

- [X] **T07** `src/app/state.ts`: seed K14a–c (legal `scenario_weight` writes — the compile partition skips them); assemble per-scenario likelihoods (latest version + contested flag from effective status) for the commander strip panel; add K14 hashes to the panel's glow deps (G6); compose `weightTieBreak` around the untouched `DiscriminationService` for the J-2 queue panel (FR-003, note §3.5).
- [X] **T08** `scripts/build-gallery.ts`: pass the same `likelihoods` so the banked SPEC-10 demo moment shows the exhibit. [P]

## Phase E — tests & batch propagation

- [X] **T09** `tests/attention.test.ts`: the Meridian exhibit (R1 above level {R2,R3}); all-overlap, nesting, missing, contested edge cases; pair lift ({R1,R2} > {R2,R3}; {R1,R2} vs {R1,R3} unranked); tie-break fires only at exact equality, never reorders unequal entries, falls back stated across overlap (SC-003).
- [X] **T10** `tests/scenarioStrip.test.ts`: attention block structure (layers, label, chips, hooks), no scalar sort key in the DOM, verdict grid unchanged with/without likelihoods (SC-001).
- [X] **T11** `tests/attention-firewall.test.ts`: FR-004 — a K14 band edit changes zero stamps and zero verdict panels while the attention block moves (SC-002); import isolation both directions (FR-005/US3); existing firewall suites pass unchanged.
- [X] **T12** Sweep peers: `CLAUDE.md` current-phase line; `docs/status.yml` updates feed entry.
- [X] **T13** Regenerate committed assets that render the strip: `npm run gallery`, `npm run build:app` (+ `npm run flow`, `npm run embeds`, `npm run coa-viz` if their outputs move).
- [X] **T14** Verify: `npm run typecheck` clean, `npm test` green; **no oracle, verdict, or coverage-row change** (SC-004).
