# Implementation Plan: Score — plan × world → verdicts + banded scores (SPEC-07)

**Branch**: `claude/next-spec-bbbs94` · **Spec dir**: `specs/007-score/` · **Date**: 2026-07-13
**Spec**: `specs/007-score/spec.md` · **Research note (DEC-11 gate)**: `docs/research/03-score-plan.md` (present)

## Summary

Build the scorer unit (DEC-10, the delivery linchpin): plan × world × scenario → `CommitmentVerdict[]` + `PlanScore[]`. Propagate banded metrics by interval arithmetic (its own tested module), evaluate stated routes by `(cell, time)` resolution over the sparse world, map each commitment to a four-stop verdict against a signed margin band (research note §3), write `scored_from` edges, and be deterministic. The acceptance leg is the vignette §9 oracle cases (O-1–O-3 exact, O-4 as a property). No schema change: `CommitmentVerdict`, `PlanScore`, `Plan`, `Band` all exist (D2). The demo moment ("the honest matrix") renders via a new `s2Matrix` component over a canned Meridian handful (sanctioned generator fallback, delivery plan §3).

## Technical Context

**Language**: TypeScript (ESM, `type: module`), Node ≥ 22, in-browser-capable (no Node-only APIs in `src/`).
**Testing**: vitest; `fast-check` added as a dev dependency for the O-4 property tests (property-based, per research note §4).
**Reuse (do not re-implement)**: `src/{store,trace,canonical,validate,seam}.ts`, `src/generated/types.ts`, `src/knowledge.ts` (for override resolution), `src/compile.ts` (world shape), `src/components/{bandPill,provenanceChip}.ts`. The sparse-channel materialisation is new (score-time) but reads the same `Channel`/`RegionOverride`/`VignetteConfig` shapes SPEC-06 produced.
**New source**: `src/interval.ts` (interval arithmetic), `src/materialise.ts` (score-time `(cell,time)` channel resolution), `src/metrics.ts` (the C1–C6 + abstract-oracle metric registry), `src/score.ts` (the service), `src/components/s2Matrix.ts` (S2 chips). New fixtures: `fixtures/plans.json` (canned Meridian handful).
**Constraints**: banded honesty at the seam (G2); no midpoint anywhere (DEC-15); determinism over inputs, never over cells (G1); scenario-blind scorer (DEC-10); first-class refusals (seam §1).

## Constitution Check

- **Register-first (DEC-2)**: SPEC-07 introduces no new decision — the four-stop mapping is *decided in the research note* under the latitude vignette §9/O-3 explicitly delegated to Stage-3 research; no peer document asserts a decision. No new register candidate is required by the scorer itself (the sparse-channel candidate from Stage 2, concept §6 item 12, remains the only open one and is unaffected).
- **Research-first (DEC-11)**: `docs/research/03-score-plan.md` present before implementation — gate satisfied.
- **Banded honesty (G2)**: verdicts cross as the four-stop scale, margins as bands; the scorer has no scalar-emitting path. Interval arithmetic *is* DEC-15 in the compute layer.
- **Frozen identifiers**: C1–C6, R1/R2/R3/R3m, FE-*, O-1–O-4 rendered as-is; canned plans use P* identifiers (vignette §8 frozen family), clearly marked demonstrator scaffolding.
- **Batch propagation**: the current-phase line (CLAUDE.md), build/delivery peers, and the gallery sweep in the same change.

## Project Structure (this slice)

```
docs/research/03-score-plan.md        # DEC-11 gate (done)
specs/007-score/{spec,plan,tasks,data-model,research,quickstart}.md
specs/007-score/contracts/score-service.md
specs/007-score/checklists/requirements.md
src/interval.ts        # +,-,scaleBy,max,min,contains,width,unit-checked
src/materialise.ts     # channelAt(world, config, kind, x, y, t) -> Band
src/metrics.ts         # metric registry: reach-step / exposure / state + abstract oracle
src/score.ts           # ScoreService: /score, verdict mapping, guards, edges, stamp
src/components/s2Matrix.ts
fixtures/plans.json     # canned Meridian handful (P1/P2)
tests/{interval,score,oracle,s2Matrix}.test.ts
```

## Design decisions (from the research note)

1. **Interval arithmetic is its own module** so O-1 tests the arithmetic, not the plumbing. Operators are the textbook closed-interval rules; every op checks units and rejects non-finite results (a severed route is caught before it produces `Infinity`).
2. **`(cell, time)` resolution, no graph expansion** (note §2): `channelAt` picks the innermost active `RegionOverride` (later `from_step` wins) or the default; metrics reduce over a plan's stated leg samples.
3. **Signed margin bands, signs-only verdict** (note §3): reduce comparator to `M = [m_lo, m_hi]` with satisfied ⟺ margin ≥ 0, then map by the signs of the endpoints. Unique O-3-satisfying four-stop rule with no interior cut.
4. **G6 as a property** (note §4): fast-check over random bands/widenings/thresholds for superset, membership, and verdict-monotonicity.
5. **ε stays out of verdicts** (note §3/§5): distinctness/ε-non-domination is SPEC-08's organiser, recorded in the note, not built here.

## Complexity Tracking

Metric library scope is bounded to exactly what C1–C6 and the abstract oracle need (reach-step, exposure, state families). No general optimiser, no generator (SPEC-08), no scenario strip (SPEC-10). `fast-check` is the only new dependency, justified by FR-005/O-4 (a hand-rolled random-property loop would be weaker and unaudited).

## Phase Gates

- Research complete (DEC-11): ✅ `03-score-plan.md`.
- Spec approved: this slice.
- Tests-first: oracle + contract tests written and confirmed failing before `src/score.ts` behaviour (constitution quality gate 2).
- Green: typecheck + full suite; oracle constants never regenerated.
