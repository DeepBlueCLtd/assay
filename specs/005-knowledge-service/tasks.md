---
description: "Task list for SPEC-05 — Knowledge service & encoding discipline"
---

# Tasks: Knowledge service & encoding discipline (SPEC-05)

**Input**: Design documents from `specs/005-knowledge-service/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/knowledge-service.md, quickstart.md
**Tests**: REQUIRED — constitution quality gate 2 mandates contract-invariant tests written against the seam shapes and **confirmed failing before implementation** (TDD).
**Organization**: by user story (priority order) after a shared foundational substrate. Stage-1 exits (build plan) are the acceptance scenarios.

> **Implementation status (2026-07-12):** built and green. `src/{seam,deltas,encoding,lint,knowledge}.ts` + `src/components/{refusalBanner,s1Table}.ts`; tests `tests/{encoding,lint,knowledge,s1Table}.test.ts` (89 passing, typecheck clean); the S1 table + demo moment render in the fixture-backed gallery (`npm run gallery`). All four Stage-1 exits demonstrated on Meridian. Two build-time refinements from the plan, both documented above: lifecycle status is **edge-derived** (`effectiveStatus`) rather than mutated onto immutable objects (DEC-21); the `waives` edge is a **compile-time** artefact (seam §4), so create records the waiver inline and retrievable rather than fabricating a self-edge. The K10 fixture/vignette drift (`assessed` vs the `encoding_violation` refusal) was corrected to `assumption` per §9.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: parallelizable (different file, no dependency on an incomplete task)
- **[Story]**: US1 (refusal/demo, P1) · US2 (waiver, P2) · US5 (banded rendering, P2) · US3 (supersede, P3) · US4 (contest, P3)

## Path conventions
Single project: `src/`, `tests/` at repo root. Reuse `src/store.ts`, `src/trace.ts`, `src/canonical.ts`, `src/validate.ts`, `src/generated/types.ts`, `src/components/{bandPill,provenanceChip}.ts`. **Never hand-edit `src/generated/types.ts`** — regenerate via `npm run gen`.

---

## Phase 1: Setup

- [ ] T001 Confirm the Stage-0 baseline is green: run `npm run typecheck` and `npm test`; verify `src/store.ts`, `src/trace.ts`, `src/canonical.ts`, `src/validate.ts`, `src/generated/types.ts`, and the Meridian fixtures (SPEC-04) are present and passing. Record any failing baseline before adding Stage-1 code.
- [ ] T002 Confirm the generated types carry everything SPEC-05 needs (no schema change required): `KnowledgeObject.waiver`, `Provenance.single_source`, `TraceEdgeType` includes `supersedes|contests|resolves|waives`, `LifecycleStatus` includes `contested|superseded|stale|resolved|retired` in `src/generated/types.ts`. If any is missing, that is a D2 schema task (`npm run gen`), not a hand-edit.

## Phase 2: Foundational (blocking prerequisites for all stories)

**Purpose**: the shared seam types, delta log, firewall, lint, and service skeleton every story composes.

- [ ] T003 [P] Define shared seam types in `src/seam.ts`: `RefusalReason`, `Refusal`, `WriteResult`, `LintWarning`, `Delta` (per data-model.md). Reuse `Ref` from `src/store.ts`. No behaviour, types only.
- [ ] T004 [P] Implement `DeltaLog` in `src/deltas.ts`: append-only with monotonic `seq`; `publish(op, refs, stamp?, actor, role): Delta`; `since(seq): Delta[]`. `at` is display-only (accept an injected clock for determinism; never hashed).
- [ ] T005 [P] Implement the encoding firewall in `src/encoding.ts`: pure `checkEncoding(ko): Refusal | null` per knowledge model §9 — `assumption`+`hard_constraint` → `encoding_violation` (waiver cannot rescue); `reported`/`assessed`+`hard_constraint` without `waiver` → `waiver_required`; `scenario_weight` may not carry constraint/cost.
- [ ] T006 [P] Implement the confidence lint in `src/lint.ts`: `confidenceLint(ko): LintWarning[]` with `r = (hi−lo)/max(|lo|,|hi|)`, floors low 0.25 / moderate 0.10 / high 0; `observed` and answer-absent objects exempt; returns warnings only (research note `01-knowledge.md`). No midpoint anywhere.
- [ ] T007 Write the encoding firewall tests FIRST and confirm failing — `tests/encoding.test.ts`: K10 (assumption+hard_constraint) → `encoding_violation` even with a waiver present; K8 (assessed+hard_constraint) with/without waiver → accepted / `waiver_required`; K14a `scenario_weight` cannot be constraint/cost. (Depends on T003/T005 shapes existing; run before T005 logic is filled to see red.)
- [ ] T008 Write the lint tests FIRST and confirm failing — `tests/lint.test.ts`: low-confidence narrow band flagged; K6 (low, wide) not flagged; moderate/high boundaries; `observed` never flagged; degenerate band only for observed/high. (Pairs with T006.)
- [ ] T009 Scaffold `KnowledgeService` in `src/knowledge.ts`: constructor composes `ObjectStore`, `TraceStore`, `DeltaLog`; private helpers for "live version of a lineage" and edge writes. No acts yet — just the shell the story phases fill.

**Checkpoint**: types, delta log, firewall, and lint exist and are unit-tested; the service shell compiles.

---

## Phase 3: User Story 1 — The system declines laundered judgement (P1) 🎯 MVP + demo moment

**Goal**: `create` enforces the firewall and returns a first-class `Refusal`, rendered in place. Nothing persists on refusal.
**Independent test**: attempt to create K10 → `encoding_violation`, offending K10, store + delta log unchanged; refusal banner renders reason/ref/explanation.

- [ ] T010 [US1] Write the create-refusal contract test FIRST and confirm failing — `tests/knowledge.test.ts`: `create(K10)` (assumption+hard_constraint) → `Refusal{encoding_violation, offending:[K10]}`; assert store size and delta count unchanged (SC-001); `scenario_weight` create stored but never compilable (FR-003).
- [ ] T011 [US1] Implement `create(ko, actor): WriteResult` in `src/knowledge.ts`: validate → `checkEncoding` (return Refusal, persist nothing) → store (idempotent) → record the inline waiver (retrievable; the `waives` edge is a compile-time artefact, seam §4) → publish exactly one `create` delta (none on byte-identical re-create) → attach `confidenceLint` warnings. Make T010 pass.
- [ ] T012 [P] [US1] Implement `refusalBanner(refusal): string` in `src/components/refusalBanner.ts` (framework-free HTML; reason, offending refs, explanation — ui-design §3.4.1). Types-only import.
- [ ] T013 [US1] Write `tests/s1Table.test.ts` refusal case FIRST and confirm failing, then wire the S1 table to render the banner where a refused save was attempted (the demo moment). Assert the banner appears and no row is added for K10.

**Checkpoint**: the demo moment runs — save K10, watch it refused; MVP delivered.

---

## Phase 4: User Story 2 — A licensed exception is recorded and visible (P2)

**Goal**: the waiver path accepts K8 and every K8 rendering shows waiver + single-source + "assessment, not fact".
**Independent test**: create K8 with W-1 → accepted, waiver retrievable inline; drop the waiver → `waiver_required`.

- [ ] T014 [US2] Extend `tests/knowledge.test.ts` FIRST (confirm failing): `create(K8 with waiver W-1)` accepted, inline waiver retrievable on the stored object; `create(K8 without waiver)` → `waiver_required` (SC-005).
- [ ] T015 [US2] Ensure `create` preserves the inline `waiver` slot and exposes waiver retrieval on the stored object (the `waives` trace edge is written at compile time — SPEC-06 / seam §4).
- [ ] T016 [P] [US2] Implement/extend the provenance chip + a waiver chip in `src/components/provenanceChip.ts` (or a sibling) to render the waiver chip and single-source marking wherever a waived/single-source value renders (FR-013). Confirm no bare scalar leaks.

**Checkpoint**: K8's waiver trail is visible everywhere it appears; removing the waiver flips to a refusal.

---

## Phase 5: User Story 5 — Every assessed number reads as an assessment (P2)

**Goal**: the minimal S1 table renders K1–K14 with band pill + provenance chip; zero bare assessed scalars; the lint caution renders.
**Independent test**: render K1–K14 → every non-`observed` value banded with provenance; K1 (observed) may be unbanded; no bare scalar anywhere.

- [ ] T017 [US5] Write the S1 banded-honesty test FIRST and confirm failing — extend `tests/s1Table.test.ts`: over all K1–K14 rows, assert every non-`observed` answer renders via band pill with a provenance chip and no bare number appears; K1 may be unbanded; the confidence-lint caution renders on any flagged row (SC-002/SC-007).
- [ ] T018 [US5] Implement `s1Table(objects, opts): string` in `src/components/s1Table.ts`: one row per KnowledgeObject — question, `bandPill(answer)` (or unbanded for `observed`), `provenanceChip(provenance)`, lifecycle status, lint caution; no service calls, no private state (FR-015/016). Make T017 pass.
- [ ] T019 [P] [US5] Add the S1 table + band pill + provenance chip entries to the fixture-backed gallery (`npm run gallery`) so the components render over real Meridian objects (SPEC-14 tie-in); confirm the gallery builds.

**Checkpoint**: the SME-facing surface is honest by construction — the band pill "the thing SMEs test first" renders over real fixtures.

---

## Phase 6: User Story 3 — A revised answer stales exactly what it overtakes (P3)

**Goal**: `supersede` writes the edge, stales exactly the prior version (cross-lineage), publishes one delta.
**Independent test**: `supersede(K9, K5)` → `stale == [K5]` exactly; edge present; one delta.

- [ ] T020 [US3] Write the supersede contract test FIRST and confirm failing — extend `tests/knowledge.test.ts`: `supersede(K9, K5)` returns `stale == [K5]` and nothing else; cross-lineage `supersedes` edge present; exactly one delta (SC-003/SC-006).
- [ ] T021 [US3] Implement `supersede(next, priorId, actor)` in `src/knowledge.ts`: firewall `next` → store → write `supersedes` edge next→prior → move prior to `superseded`/`stale` → return exact stale-set → publish one `supersede` delta. Make T020 pass.
- [ ] T022 [P] [US3] Render lifecycle status on the S1 table (K5 stale, K9 live) and confirm the stale marking appears (extend `tests/s1Table.test.ts`).

**Checkpoint**: supersession is exact — the substrate Stage-6 staleness (thesis F) will read.

---

## Phase 7: User Story 4 — A contested pair blocks downstream use (P3)

**Goal**: `contest` marks both `contested` and blocks compile via `isCompilable`; `resolve` lifts it for the survivor.
**Independent test**: `contest(K12a, K12b)` → both contested, `isCompilable` false for both, one delta; `resolve(survivor)` lifts the block; resolving a non-contested version refused.

- [ ] T023 [US4] Write the contest/resolve contract tests FIRST and confirm failing — extend `tests/knowledge.test.ts`: `contest(K12a,K12b)` → both `contested`, `isCompilable(K12a)==false`, one delta; `resolve(K12a)` → `resolves` edge, survivor leaves `contested`; `resolve(unrelated)` refused (SC-004/FR-008).
- [ ] T024 [US4] Implement `contest(aId, bId, actor)`, `resolve(survivor, note, actor)`, and `isCompilable(id)` in `src/knowledge.ts`; each write publishes exactly one delta; `isCompilable` is the single G5 source of truth. Make T023 pass.
- [ ] T025 [P] [US4] Render the contested K12a/K12b pair side by side with the compile-blocking flag on the S1 table (ui-design §3.4.3); extend `tests/s1Table.test.ts` to assert the blocking flag.

**Checkpoint**: contested-never-compiles holds at Stage 1 (mark + block); SPEC-06 completes it at the compile refusal.

---

## Phase 8: Polish & cross-cutting

- [ ] T026 [P] Add the `exposure(id)` act in `src/knowledge.ts` + test in `tests/knowledge.test.ts`: forward walk; unanswered open question (K11) returns empty-but-complete chain, not a dead end (FR-009/G3).
- [ ] T027 Full G2 sweep: assert no service response and no S1 row exposes a bare assessed scalar across the whole K1–K14 set (a single failure is a review-blocking G2 violation). Cross-check against `quickstart.md`.
- [ ] T028 Run `npm run typecheck` and `npm test` clean; run `npm run gallery` and `npm run bench` unaffected. Update `docs/research/01-knowledge.md`-referenced lint numbers only if implementation revealed a mismatch (register conversation, not a silent change).
- [ ] T029 Update the CLAUDE.md current-phase line and close issue #10 references once Stage-1 exits demonstrably pass against Meridian.

---

## Dependencies & execution order

- **Setup (T001–T002)** → **Foundational (T003–T009)** → user stories.
- **Foundational blocks everything.** Within it: T003/T004/T005/T006 are [P]; T007/T008 (tests-first) pair with T005/T006; T009 needs T003/T004.
- **User-story order** is priority: US1 (T010–T013) is the MVP + demo moment and should land first. US2/US5 (P2) then US3/US4 (P3). US2, US5, US3, US4 are largely independent once `create` (T011) and the service shell exist — their service acts touch the same `src/knowledge.ts` (sequential there) but their tests and components are [P].
- **Polish (T026–T029)** last.

## Parallel opportunities
- Foundational: T003 ∥ T004 ∥ T005 ∥ T006 (four files).
- Components across stories: T012 (refusal banner) ∥ T016 (waiver chip) ∥ T018/T019 (S1 table/gallery) — different files.
- `src/knowledge.ts` acts (T011/T021/T024/T026) are **sequential** (same file).

## MVP scope
**User Story 1 only** (T001–T013): a knowledge `create` that refuses laundered judgement and renders the refusal — the Stage-1 demo moment and the first observable proof of thesis A. Everything else is incremental delivery on top.
