# Tasks: Compile-overlay precedence — excursions beat base (SPEC-20)

Dependency-ordered. `[P]` = parallelisable. **Gate**: the `02-compile.md` §6 amendment present (DEC-11) and concept §6 item 22 flagged — Phase A produces both; Phases B–D do not start until Phase A lands.

## Phase A — research amendment & register candidate — the DEC-11 gate

- [X] **T01** Amend `docs/research/02-compile.md` (new §6): decide **layered precedence** (excursion beats base; window first; within-layer tie order unchanged), state that the layer is **derived** (`source === world.scenario`, no schema change), audit the frozen tableau for every excursion/base coincidence (same-region and geometric), and record the `engine_version` bump rationale. Add the "what we will do differently" line.
- [X] **T02** Add the resolution pointer to `docs/research/04-relaxation.md` §3's parenthetical (the admission that originated this slice). [P]
- [X] **T03** Record concept §6 item 22 as a **flagged candidate** (precedence semantics; consequences; engine bump); **do not assert** (DEC-2).

## Phase B — the fix (US1) — after Phase A

- [X] **T04** `src/engine.ts` — `ENGINE_VERSION = '0.2.0'`, documented against note 02 §6; consume it from `src/app/state.ts`, `src/flow.ts`, `src/app/coaViz.ts`, and the build scripts (retire the scattered `'0.1.0'` literals).
- [X] **T05** `src/materialise.ts` — `channelAt` resolves active candidates **by layer first** (excursion iff `source === world.scenario`), then the unchanged §3 tie order; comment cites `02-compile.md §6` (FR-001/002/003). `src/compile.ts` doc comment notes that excursion `source` is the layer key.
- [X] **T06** `RobustnessService.#stampsCompatible` includes `engine_version` in the lineage key (FR-005).
- [X] **T07** Tests (`tests/materialise.test.ts` + `tests/compile.test.ts`): R3m causeway read = demolition band; BASE read = K2 band, byte-identical world; windowed excursion respects its window; within-layer tie order unchanged; same inputs at 0.1.0 vs 0.2.0 ⇒ different stamps; mixed-engine tensor ⇒ `stamps_compatible === false` + incompatibility banner.

## Phase C — consequence management (US2, US3) — after Phase B

- [X] **T08** `src/relaxCandidates.ts` — narratives mention the causeway state in command language (no decimals, no verdict tokens); sacrifices stay computed.
- [X] **T09** Update pinned expectations: `tests/relax.test.ts`, `tests/gate.test.ts`, `tests/flow.test.ts` — sets {C4,C5}/{C3,C5}/{C2,C5}; supersets `{C2,C4,C5}`/`{C3,C4,C5}` still dropped; C2-set last; C3/C4 tie-break stated; every-candidate-mentions-causeway assertion (US3).
- [X] **T10** Re-assert the invariants: O-1…O-4 reproduce exactly; the G6 `fast-check` property passes under the new precedence (FR-008); no other frozen-tableau verdict moved (full suite green).

## Phase D — batch propagation & artifacts (FR-007) — after Phase C

- [X] **T11** Sweep canonical text: vignette §6 narrative + §7 coverage rows; walkthrough beat 4 + sequence diagram; `docs/assay-build-plan.md` Stage-4 exit annotation; `docs/assay-flow-infographic-spec.md`; the two wireframes HTML files; `src/narratives.ts` beat text; gallery/flow captions (`scripts/build-gallery.ts`, `src/flow.ts`).
- [X] **T12** Regenerate checked-in artifacts: `npm run gallery`, `npm run flow`, `npm run coa-viz`, `npm run build:app`, `npm run embeds` (stamps + the R3m exhibit move).
- [X] **T13** `CLAUDE.md` current-phase line + `docs/status.yml` updates entry (the exhibit changed because the world got more honest — say so).
- [X] **T14** Verify: `npm run typecheck` clean; `npm test` green; commit with the register trail; PR references review action A5 / slice S-B.
