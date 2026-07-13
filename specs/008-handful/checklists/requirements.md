# Requirements checklist — SPEC-08 (Handful)

Traceability from spec requirements to acceptance. Every box is a committed test or a rendered surface.

## The exit (build plan Stage 3 · the reason SPEC-08 exists)

- [x] `/plan/handful` over the Meridian base world returns **3–5 plans**, each resolving to a stored `Plan` (FR-001/002, SC-001) — `tests/handful.test.ts`
- [x] Every pair in the handful is mutually **non-dominated** on the C1–C6 margin vector (FR-004, SC-001)
- [x] The handful shows more than one distinct verdict on at least two commitments — genuinely different profiles (US1-3)
- [x] **Same (world, seed) ⇒ identical** stamp, plans, scores, organisation (FR-008, SC-002)
- [x] A different seed changes the stamp (seed participates in the stamp) (FR-008, SC-002)

## The organiser (the honesty core)

- [x] Drops a strictly-worse-everywhere plan; keeps a genuine trade-off; irreflexive + asymmetric (FR-004/005, SC-003) — `tests/dominance.test.ts`
- [x] `violated` (no margin) treated as the conservatively worst value on its criterion (FR-006)
- [x] Monotone in ε — increasing ε never shrinks the non-dominated set (FR-004, SC-003)
- [x] No scalar total / weighted sum / midpoint anywhere in the organiser (FR-005, DEC-19/15)
- [x] The diversity cap trims by axis spread (seed-tie-broken), never by a scalar; below `count` returns all, no padding (FR-007) — `count=3` cap test

## Generation (honest fan-out)

- [x] 16 candidates, each a valid `Plan` with all five force elements (FR-002, SC-004) — `tests/generate.test.ts`
- [x] The candidate set spans both settings of all four axes (US4-2)
- [x] Deterministic in `(config, seed)` — same seed ⇒ identical candidate list (FR-002, SC-004)

## Trace, surface & discipline

- [x] Every handful member opens a complete trace chain verdict → world → knowledge (G3, SC-005)
- [x] `distinct_because` is derived and non-empty per plan, aligned to `plans` (FR-010, SC-006)
- [x] The gallery renders the generated handful: S2 four-stop chips (margin-on-hover, no decimals) + the handful strip (SC-006)
- [x] `unknown_ref` refuses first-class when the world cannot be resolved; persists nothing (FR-011)
- [x] No `knowledge_overrides` on the handful; no `/relax` call (FR-012)

## Gate

- [x] `npm run typecheck` clean; `npm test` green (SPEC-07 baseline + SPEC-08 suite); no schema regen (SC-007)
