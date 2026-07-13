---
description: "Task list for SPEC-08 — Handful (generate → score → organise)"
---

# Tasks: Handful — generate → score → organise into a banded non-dominated handful (SPEC-08)

**Input**: Design documents from `specs/008-handful/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/handful-service.md, quickstart.md; research note `docs/research/03-score-plan.md` §5 (DEC-11 gate — present)
**Tests**: REQUIRED — the organiser's non-domination laws and the determinism assertions are written against the seam §6 shape and **confirmed failing before implementation** (TDD; constitution quality gate 2). The Meridian handful is a *computed* product; tests assert its shape (3–5, mutually non-dominated, deterministic), never hand-set membership.
**Organization**: the organiser (pure, testable in isolation) and the generator first, then the service that composes them, then the surface. Stage-3 handful exit is the acceptance.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: parallelizable (different file, no dependency on an incomplete task)
- **[Story]**: US1 (3–5 distinct, P1) · US2 (determinism, P1) · US3 (organiser laws, P1) · US4 (fan-out, P2) · US5 (matrix + strip, P2)

## Path conventions
Single project: `src/`, `tests/`. Reuse `src/{store,trace,canonical,validate,seam,score,interval}.ts`, `src/generated/types.ts`, `src/components/s2Matrix.ts`. **No schema change** — `Plan`/`PlanScore`/`CommitmentVerdict`/`Band`/`TraceEdge` already exist; do **not** run `npm run gen`.

---

## Phase 1: Setup

- [x] T001 Confirm the SPEC-07 baseline is green: `npm install`, `npm run typecheck`, `npm test`. Record any failing baseline before Stage-3 code.
- [x] T002 Confirm the pieces SPEC-08 reuses exist: `ScoreService` (`src/score.ts`) with `CommitmentVerdict.margin`; `Plan`/`PlanScore` in `src/generated/types.ts`; `scored_from` in `TraceEdgeType`; the sparse world shapes SPEC-06 produced. No new dependency (the generator is deterministic fan-out — no PRNG library).

## Phase 2: US3 — the organiser laws (P1, the honesty core, pure)

**Goal**: banded ε-non-domination on the conservative interval order, proven on constructed vectors before any pipeline exists.
**Independent test**: constructed margin vectors → dominated/kept/monotone/irreflexive/asymmetric.

- [x] T003 Write `tests/dominance.test.ts` FIRST and confirm failing: `noWorse`/`strictlyBetter` on the conservative order incl. `null` (violated) as worst; `dominates` drops strictly-worse-everywhere, keeps trade-offs, is irreflexive + asymmetric, throws on misaligned lengths; `nonDominated` monotone in ε.
- [x] T004 Implement `src/dominance.ts`: `Criterion`/`CriteriaVector`, `noWorse`, `strictlyBetter(a,b,ε=0)`, `dominates(a,b,ε=0)`, `distinct`, `nonDominated(vectors,ε=0)`. Maximisation on margins; strict-above gate (`a.lo > b.hi + ε`) so equal/overlap is never "strictly better" (DEC-15). Make T003 pass.

## Phase 3: US4 — the seeded fan-out generator (P2)

**Goal**: deterministic candidates over Meridian's four axes, each a valid `Plan`.
**Independent test**: 16 valid plans, span all axes, deterministic in `(config, seed)`.

- [x] T005 Write `tests/generate.test.ts` FIRST and confirm failing: 16 candidates, each `validateInstance('Plan', p) === []` with the five force elements and a `P-*` id; both settings of all four axes appear; same seed ⇒ identical list; id encodes the signature.
- [x] T006 Implement `src/generate.ts`: `AxisSignature`, `AXES`, `signatureId`/`signatureName`, per-force-element route builders (documented axis→route mapping — reach cells avoid banded-mobility regions so reaches stay clean; C4 exercises the banded threat channel), `planFor`, `allSignatures`, `generateCandidates(config, seed)`. Make T005 pass.

## Phase 4: US1 + US2 — the handful service (P1)

**Goal**: `/plan/handful` = generate → score → organise → cap, deterministic, over the Meridian base world.
**Independent test**: base world → 3–5 mutually non-dominated plans; same (world, seed) ⇒ identical; count clamps; unknown world refuses.

- [x] T007 Add handful service types to `src/seam.ts`: `HandfulRequest`, `HandfulOrganisation`, `HandfulSuccess`, `HandfulResult` (per data-model.md). Types only; reuse `Refusal`/`Ref`.
- [x] T008 Write `tests/handful.test.ts` FIRST and confirm failing (rig mirrors `score.test.ts`: resolved base world): 3–5 stored plans; every pair `distinct`; ≥2 commitments vary; same (world, seed) ⇒ identical stamp/plans/scores/organisation; different seed ⇒ different stamp; `distinct_because` derived & aligned; verdict→world→knowledge chain (G3); `count` clamp; `unknown_ref` persists nothing.
- [x] T009 Implement `src/handful.ts` `HandfulService`: resolve world (refuse `unknown_ref`), clamp `count` to `[3,5]`, generate → store each candidate → score via `ScoreService` → build margin vectors → `nonDominated` → diversity cap (axis Hamming, seed FNV-1a tie-break) → derive `distinct_because` → stamp over `(world.stamp, seed, count, engine)`. Make T008 pass.

## Phase 5: US5 — the surface (P2)

**Goal**: the honest-matrix demo moment, now over the generated handful.

- [x] T010 [P] Implement `src/components/handfulStrip.ts`: one row per plan — id, axis-signature name, derived `distinct_because`. Arranges projections only; depends on generated types + `Ref`.
- [x] T011 Wire `scripts/build-gallery.ts`: replace the canned P1/P2 scoring with `HandfulService.handful` over the resolved base world; render the strip above the reused `s2Matrix`; update the section copy to name SPEC-08 (organised, not authored). Regenerate `docs/assets/gallery/index.html`.

## Phase 6: Batch propagation & gate

- [x] T012 Sweep the canonical peers in the same change: CLAUDE.md current-phase line; `assay-build-plan.md` / `assay-delivery-plan.md` Stage-3 status; the gallery. Note the concept §6.2 handful-axes open question is closed by research note §5.2 (no new register candidate — the note holds the decision under Stage-3 latitude).
- [x] T013 Gate: `npm run typecheck` clean; `npm test` green (SPEC-07 baseline + SPEC-08 suites); `npm run gallery` renders the generated handful. No schema regen.

---

## Dependencies & parallelism

- **T003→T004** (organiser) and **T005→T006** (generator) are independent tracks — run in parallel.
- **T007** (types) unblocks **T008→T009** (service), which depends on T004 + T006.
- **T010** is parallel to the service; **T011** needs T009 + T010.
- **T012/T013** are the closing sweep and gate.
