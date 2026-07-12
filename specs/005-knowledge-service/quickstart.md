# Quickstart — Validate SPEC-05

Prerequisites: `npm install` once; SPEC-01/02/03/04 in place (store, trace store, typegen, fixtures).

## Commands

```
npm run gen        # regenerate types if the LinkML schema changed (never hand-edit generated/)
npm run typecheck  # tsc --noEmit
npm test           # vitest — includes the SPEC-05 contract-invariant suites
```

## What "done" looks like (maps to Success Criteria)

Run `npm test` and confirm the Stage-1 suites are green. Each maps to an acceptance scenario:

| Check | Scenario | Criterion |
|---|---|---|
| K10 create refused `encoding_violation`; store + delta log unchanged | US1 / demo moment | SC-001 |
| Every non-`observed` K renders banded with provenance; no bare scalar in any response or S1 row | US5 | SC-002 |
| supersede(K9, K5) returns `stale == [K5]`, nothing else | US3 | SC-003 |
| contest(K12a, K12b) blocks compile (`isCompilable` false) until resolve | US4 | SC-004 |
| K8 renders waiver chip + single-source + "assessment, not fact"; drop the waiver → `waiver_required` | US2 | SC-005 |
| each act publishes exactly one delta; idempotent create publishes none | US3/US4 | SC-006 |
| low-confidence narrow band flagged by lint at warning level; `observed` never flagged | US5 | SC-007 |

## The demo moment (DEC-23) — "the system declines laundered judgement"

1. Render the minimal S1 table over the Meridian K1–K14 fixtures (the gallery/demo harness).
2. Attempt to save K10 (garrison *will* capitulate by D+5 — assessed, claimed `hard_constraint`, no waiver).
3. Observe: the refusal banner appears where the save was attempted, naming `encoding_violation`, the offending ref (K10), and the one-sentence explanation. Nothing is stored.
4. Contrast with K8: the same "hard constraint from an assessment" shape, but with waiver W-1 recorded — accepted, and rendered with its waiver chip and single-source marking.

The contrast *is* the thesis: honest encoding is enforced, and the one licensed exception is visible, not hidden.

## Manual G2 spot-check (banded honesty)

Scan every S1 row and every service response in the tests: no value from a `reported`/`assessed`/`assumption` source appears as a bare number — each is a `Band` with a provenance chip. `observed` (K1) is the only class permitted unbanded. A single bare assessed scalar anywhere is a G2 violation and a failing review (constitution II).

References: [spec.md](./spec.md), [plan.md](./plan.md), [contracts/knowledge-service.md](./contracts/knowledge-service.md), [data-model.md](./data-model.md), research note `docs/research/01-knowledge.md`.
