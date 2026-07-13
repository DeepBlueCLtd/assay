# Requirements checklist — SPEC-07 (Score)

Traceability from spec requirements to acceptance. Every box is a committed test or a rendered surface.

## Correctness leg (the reason SPEC-07 exists)

- [ ] O-1 — `start 2 + A[4,6] + B[3,5] = [9,13]` exactly (FR-002, SC-001)
- [ ] O-2 — `[9,13]` vs `at_most 28` ⇒ **robust**, margin `[15,19]` (FR-003, SC-002)
- [ ] O-3 — `[9,13]` vs `at_most 12` ⇒ **tight** (neither robust nor violated) (FR-003, SC-003)
- [ ] O-3 sweep — threshold 8→14 changes verdict only at edges 9 and 13; sweep yields violated/tight/marginal/robust (FR-003, SC-003)
- [ ] O-4 — `A` widened `[4,6]→[3,7]` ⇒ `[8,14] ⊇ [9,13]` (FR-005, SC-004)
- [ ] O-4 property — superset-under-widening, point-realisation membership, verdict-monotonicity over random inputs (fast-check) (FR-005, SC-004)
- [ ] Oracle constants are committed, never regenerated from the scorer (SC-009)

## Honest matrix (demo moment)

- [ ] A Meridian plan scores to one four-stop verdict per C1–C6, each with a margin band (FR-001/003/004, SC-005)
- [ ] Every verdict opens a complete backward trace chain to named owners via `scored_from` (FR-007, SC-005)
- [ ] S2 matrix renders four-stop chips, margin-on-hover, no decimals in verdict cells (FR-004, SC-008)
- [ ] The gallery shows the honest-matrix moment run by the actual scorer (SC-008)
- [ ] R1-early-strait plan scores healthier under R1 than R2 (thesis-C direction; correct scoring, not the strip) (US3.4)

## Discipline & determinism

- [ ] Same inputs ⇒ byte-identical stamp and identical verdicts/scores; commitment order irrelevant (FR-008, SC-006)
- [ ] `knowledge_overrides` re-scores without persisting the override or writing a knowledge edge (FR-009, SC-007)
- [ ] `stamp_mismatch` refuses across incompatible stamps, persists nothing (FR-010, SC-007)
- [ ] Severed route ⇒ `violated` reach, never a non-finite band; unit mismatch ⇒ score-time error (FR-011)
- [ ] Scorer is scenario-blind — reads the excursioned world, does not re-derive it (FR-012)
- [ ] No mean/mid/most-likely operation exists anywhere in the scorer (FR-002, DEC-15)

## Gates

- [ ] Research note `03-score-plan.md` present before implementation (DEC-11)
- [ ] Oracle/contract tests written and confirmed failing before scorer behaviour (constitution quality gate 2)
- [ ] `npm run typecheck` clean; `npm test` green (SPEC-06 baseline + SPEC-07) (SC-009)
- [ ] Batch propagation: CLAUDE.md phase line, build/delivery peers, gallery swept in one change
