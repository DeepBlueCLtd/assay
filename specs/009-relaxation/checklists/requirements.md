# Requirements checklist — SPEC-09 Relaxation

Traceability of the spec's requirements to the invariants and the research note. Checked as the slice lands.

## G4 — least-worst, never silence (the invariant this slice upholds)

- [x] Report is **never empty** on an infeasible set (FR-005, SC-002)
- [x] Every candidate's `sacrificed` is **non-empty** (FR-009, SC-001)
- [x] No constraint dropped without a card naming it (FR-005) — a strict-superset sacrifice is excluded *because a lesser one is shown* (FR-004, SC-002)
- [x] Same-tier ordering is **stated** in `tie_break`, never silent (FR-007, SC-003)
- [x] A `must`-sacrifice is **returned, ranked last**, never suppressed (FR-006, SC-003)

## DEC-19 — ordinal tiers, no weights, stated tie-break

- [x] Ranking uses tier lexicography only — **no numeric weight / scalar total / midpoint** (FR-008)
- [x] Tie-break is **content-neutral** (id order), flagged as a commander-priority placeholder, not a value ranking (FR-007, note §4)

## G2 — banded honesty at the seam

- [x] Sacrifice set read from the four-stop `verdict`, not a scalar (FR-003)
- [x] Card face carries **no decimal / no verdict-internal token**; `margin` stays for the trace drawer (FR-009, SC-007)

## G3 — complete trace chains

- [x] `cited_in` edges written from each candidate's verdicts/scores to the report (FR-010, SC-005)
- [x] `sacrificed_in` edges written from each sacrificed commitment to its candidate (FR-010)

## G1 — determinism

- [x] Same `(world, commitments, seed, engine)` ⇒ byte-identical stamp and identical ordered report (FR-011, SC-006)
- [x] Stamp is over inputs, never over materialised cells (FR-011)

## DEC-10 / DEC-11 — reuse & research-first

- [x] Scorer reused, not re-implemented (FR-003); sacrifices computed, not authored (SC-004)
- [x] `docs/research/04-relaxation.md` present before implementation (gate)

## Refusals

- [x] `unknown_ref` on an unresolvable world, persists nothing (FR-012)
- [x] A scorer refusal on a candidate returned verbatim (FR-012)

## Gate

- [x] `npm run typecheck` clean; `npm test` green (SPEC-01…08 baseline + SPEC-09); no `npm run gen` (SC-008)
