# Specification Quality Checklist: Compile — knowledge → CompiledWorld (SPEC-06)

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-07-12
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs) — the spec names seam shapes and doctrine, not TS/vitest; implementation lives in plan.md/data-model.md
- [x] Focused on user value and business needs — each story is a Stage-2 exit a watcher can see (contested never compiles; deterministic world; traceable channels)
- [x] Written for non-technical stakeholders — the doctrine (MCOO, contested/stale, waiver) leads; the mechanics are in the plan
- [x] All mandatory sections completed — User Scenarios, Requirements, Success Criteria present

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain — scope fixed by build plan §Stage 2 and seam §4; representation fixed by research note `02-compile.md`
- [x] Requirements are testable and unambiguous — every FR maps to a contract-invariant test (contracts/compile-service.md)
- [x] Success criteria are measurable — SC-001…007 are counts, byte-identity, and a sub-second bound
- [x] Success criteria are technology-agnostic — stated as outcomes (refusal, determinism, traceability, cost), not framework internals
- [x] All acceptance scenarios are defined — five user stories, each with Given/When/Then
- [x] Edge cases are identified — open questions, unmapped subjects, unknown refs, overlapping windows, degenerate observed bands, idempotent recompile
- [x] Scope is clearly bounded — excludes scorer/generator (SPEC-07/08) and the routing-search structure (Stage 3, flagged forward)
- [x] Dependencies and assumptions identified — SPEC-01/02/05, the sparse-channel candidate, the new config fixture, the Stage-3 boundary

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria — FR-001…015 trace to SC-001…007 and the contract tests
- [x] User scenarios cover primary flows — refuse (contested), determinism, traceability, staleness, firewall/waiver
- [x] Feature meets measurable outcomes defined in Success Criteria — the demo moment (SC-001) and the sparse-cost bound (SC-006) are the headline exits
- [x] No implementation details leak into specification — the sparse representation is named as an outcome (no dense cell stored/hashed), with the mechanics deferred to the plan

## Notes

- The one new decision this spec rests on — sparse channels retiring `Channel.cells` — is recorded as a flagged register candidate (concept §6, item 12) and pre-authorised by seam contract open item 2; the spec cites it as an assumption, it does not originate it (DEC-2).
- G4 (least-worst) and G6 (propagation honesty) are explicitly out of Stage-2 scope; the compile carries authored bands into channels and performs no interval arithmetic, so G6 is asserted at the scorer (SPEC-07), not here.
- All checklist items pass; the spec is ready for `/speckit-plan` (already drafted as plan.md) and `/speckit-tasks`.
