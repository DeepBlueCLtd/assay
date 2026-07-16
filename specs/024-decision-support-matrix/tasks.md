# Tasks: The Decision Support Matrix surface — decisions in time (SPEC-24)

Dependency-ordered. `[P]` = parallelisable. **Gate**: research note `docs/research/12-decision-support.md` present (DEC-11) and concept §6 items 27/28 flagged — Phase A produces both; Phases B–E do not start until Phase A lands.

## Phase A — research note & register candidates (the DEC-11 gate)

- [X] **T01** Author `docs/research/12-decision-support.md`: the two-class DP predicate (scenario-divergent over the adversary vocabulary / margin-class under the selected world; uniform robust and uniform violated explicitly non-DPs); the commit-step rule per metric kind (first divergent-read leg / world-decided horizon / stated absence); LTIOV = commit_step − lead (lead 0 stated) on the scenario clock (DEC-17) with the three-state answerable-in-time predicate and the honest red branch; discriminator reuse (SPEC-12/23 classification, nested excluded, named gap); world-level tripwire scope; the deliberately-unmodelled list (TAIs, execution, NAI geography, lead, branches, tasking); the predicted Meridian exhibit table; doctrinal citations (JP 2-01.3 DST/event matrix/NAIs, ATP 2-01.3 ch. 6, ATP 2-01 LTIOV, FM 6-0 ch. 9, JP 5-0 CCIRs).
- [X] **T02** Flag concept §6 items 27 (the DP derivation rule — DEC-18-class semantics) and 28 (the derived surface + `POST /analyse/decision-support` seam growth); **do not assert** either decision (DEC-2).

## Phase B — seam + service (after Phase A)

- [X] **T03** `src/seam.ts`: `DecisionSupportRequest`, `DpEvidence`, `DsmCollection`, `DsmDiscriminator`, `DecisionPointRow`, `DecisionSupportSuccess`, `DecisionSupportResult` — movement types per plan.md; no schema change.
- [X] **T04** `src/decisionSupport.ts` — `DecisionSupportService`: robustness tensor over `{plan} × worlds` (reuses `RobustnessService`, refusals first-class); comparability guard before derivation; DP predicate; commit step from plan geometry via `channelAt` at the metric's own read points; LTIOV + three-state in-time; discriminators via `classifySeparation`/`computeSeparation` (exported, untouched); named-gap sentence; tripwires from `consumed` × `validity`; deterministic stamp; result envelope stored + `cited_in` edges to evidence verdicts, discriminator questions, tripwire knowledge (G3). Rows in commitment logical-id order; no urgency scalar anywhere (FR-003).

## Phase C — surface (after Phase B; component itself [P] with Phase D)

- [X] **T05** `src/components/dsmTable.ts` (pure): rows with evidence words + pair witnesses, commit step/LTIOV step counts + commit detail in words, discriminator blocks (classification marks, expected-answer pills + provenance chips, collection lines with cost pill + in-time/red/unstated states with visible arithmetic), tripwire lines with knowledge chips, honest empty state, mixed-stamps statement, `data-glow-id`/`data-glow-sig` per row; **no tasking affordance** — no button, no imperative verb (FR-007).
- [X] **T06** `src/components/legends.ts`: `decision_point`, `ltiov_state`, `tripwire` entries; `dsmTable` pill set. [P]

## Phase D — app wiring (after Phase B)

- [X] **T07** `src/app/state.ts`: commander panel `dsm` ("Commander · decisions in time") beneath the scenario strip — derives for the canned P2 lineage over the live scenario worlds, the absence of a `/select` selection stated; deps carry row glow sigs + stamps so rows re-derive and glow on recompile (G6); the panel refuses with the compile (G5).

## Phase E — gallery, tests, batch propagation & verify

- [X] **T08** `scripts/build-gallery.ts`: the DSM demo moment ("decisions in time — derived, not drawn") rendered from the same fixture run. [P]
- [X] **T09** `tests/decisionSupport.test.ts`: the pinned P2/P1 exhibit rows (FR-008; the note §7 table is the oracle); byte-identical re-run (G1); trace-completeness (G3); degenerate states (empty, mixed-stamps, gap, unstated earliest_result); structural no-scalar assertion; non-DP absences.
- [X] **T10** Component + app tests: DOM no-scalar/no-tasking assertions (SC-003/FR-007); red arithmetic rendered; K9-supersede glow (US3 AS-1); compile-refusal inheritance.
- [X] **T11** Sweep peers: `CLAUDE.md` current-phase line; `docs/status.yml` updates entry; seam-contract "Open items" gains the `POST /analyse/decision-support` candidate (full §8 sweep at ratification).
- [X] **T12** Regenerate committed assets that render the new panel: `npm run gallery`, `npm run build:app`.
- [X] **T13** Verify: `npm run typecheck` clean, `npm test` green; no oracle/verdict/coverage-row change; the exhibit reproduces from a cold start.
