# Implementation Plan: Handful — generate → score → organise (SPEC-08)

**Branch**: `claude/next-spec-tkiz9e` · **Spec dir**: `specs/008-handful/` · **Date**: 2026-07-13
**Spec**: `specs/008-handful/spec.md` · **Research note (DEC-11 gate)**: `docs/research/03-score-plan.md` §5 (present)

## Summary

Build the handful unit (delivery plan §δ, the last of the spine): `/plan/handful` = generate → score → organise. A seeded, strategy-biased **generator** fans out over the vignette's four axes into candidate `Plan`s; the SPEC-07 **scorer** (reused, not re-implemented) turns each into a C1–C6 margin vector; a banded ε-non-domination **organiser** reduces them to 3–5 genuinely distinct plans, capped by seed-driven axis diversity. Deterministic over `(world stamp, seed, count, engine)`; every member stored and traced. No schema change — `Plan`, `PlanScore`, `CommitmentVerdict.margin`, `TraceEdge` all exist. The demo moment ("the honest matrix") now renders the *generated* handful plus a `distinct_because` strip, replacing the canned P1/P2.

## Technical Context

**Language**: TypeScript (ESM, `type: module`), Node ≥ 22, in-browser-capable (no Node-only APIs in `src/`).
**Testing**: vitest (existing). No new dependency — the generator is deterministic fan-out (no PRNG library; the seed drives ordering/tie-breaks over a fixed enumeration).
**Reuse (do not re-implement)**: `src/{store,trace,canonical,validate,seam}.ts`, `src/score.ts` (`ScoreService` — the scorer is called, never re-built), `src/generated/types.ts`, `src/components/s2Matrix.ts` (reused unchanged), `src/interval.ts` (band helpers for the organiser). The margin vector comes straight off the scorer's `CommitmentVerdict.margin`.
**New source**: `src/dominance.ts` (banded ε-non-domination + diversity cap), `src/generate.ts` (seeded axis fan-out → candidate Plans), `src/handful.ts` (the `HandfulService`), `src/components/handfulStrip.ts` (the `distinct_because` view). New seam types in `src/seam.ts`. No new fixtures — candidates are generated, not authored; `fixtures/plans.json` (the canned handful) stays as a documented fallback and for the SPEC-07 suite.
**Constraints**: banded honesty at the seam (G2); no midpoint/scalar-total/weighted-sum anywhere in the organiser (DEC-15, DEC-19); determinism over inputs, never over cells (G1); first-class refusals (seam §1); frozen identifiers — generated plans stay in the `P*` family, clearly marked generator scaffolding (vignette §8).

## Constitution Check

- **Register-first (DEC-2)**: SPEC-08 introduces no new decision. The distinctness rule (banded ε-non-domination) and the four generation axes are *decided in the research note* (`03-score-plan.md` §5), under the concept §6.2 open question that the note explicitly closes for this domain. No peer document asserts a new decision; the sparse-channel candidate (concept §6 item 12) remains the only open one and is unaffected.
- **Research-first (DEC-11)**: `docs/research/03-score-plan.md` §5 present before implementation — gate satisfied (the same note that gated SPEC-07 reserved §5 for SPEC-08).
- **Banded honesty (G2)**: the organiser reads margin *bands* and compares them by the conservative interval order — it never collapses a band to a point. Verdicts still cross the seam only as the four-stop scale; `distinct_because` names commitments and axes, never a decimal.
- **Frozen identifiers**: C1–C6, R1/R2/R3, FE-* rendered as-is; generated plans use `P*` ids encoding their axis signature, clearly marked demonstrator scaffolding (as the canned P1/P2 were).
- **Batch propagation**: the current-phase line (CLAUDE.md), the build/delivery peers, and the gallery sweep in the same change.

## Project Structure (this slice)

```
docs/research/03-score-plan.md        # DEC-11 gate (done — §5 is SPEC-08's)
specs/008-handful/{spec,plan,tasks,data-model,research,quickstart}.md
specs/008-handful/contracts/handful-service.md
specs/008-handful/checklists/requirements.md
src/dominance.ts       # conservative interval order; εDominates; nonDominated; diversityCap
src/generate.ts        # AxisSignature; generateCandidates(config, seed) -> Plan[]
src/handful.ts         # HandfulService: /plan/handful (generate -> score -> organise)
src/components/handfulStrip.ts
tests/{dominance,generate,handful}.test.ts
```

## Design decisions (from the research note §5)

1. **Distinctness = banded ε-non-domination on the conservative interval order** (note §5). Maximisation on the scorer's margin bands (satisfied ⟺ margin ≥ 0 gives uniform "higher is better" across all comparators). `A ε-dominates B` iff `∀i: B.lo_i ≤ A.hi_i` (A no worse) and `∃j: A.lo_j ≥ B.hi_j + ε` (A strictly separated-above). `ε` defaults to 0 — scale-free, since criteria have incommensurate units and no absolute ε is honest. Two plans with overlapping bands are incomparable and both survive. This is DEC-15 in the organiser: overlap = honestly-indistinguishable = keep both.
2. **The margin vector, not the raw metric, is the criteria vector.** The scorer already orients each comparator to a signed margin (`at_most`/`at_least`/`never`/`by_step` → margin ≥ 0 iff satisfied). Reading margins gives one uniform maximisation order and needs no per-criterion orientation table. A `violated` verdict (no margin) maps to the conservatively-worst sentinel on that criterion.
3. **Generation is deterministic fan-out over four binary axes** (note §5.2), 2⁴ = 16 candidates via documented route templates; the seed orders the enumeration and breaks ties in the diversity cap — no PRNG, so no hidden non-determinism. Route geometry is fixture-authoring latitude *within* the constraints (vignette §8): the axis→route mapping is documented in `generate.ts`.
4. **The cap is diversity, never score** (note §5, spec FR-007): when > `count` plans are non-dominated, greedily select for maximal axis-signature spread, seed as tie-break. Capping by any scalar would smuggle a weighting past DEC-19.
5. **ε stays the organiser's knob, out of verdicts** (note §3/§5): SPEC-07 kept ε out of the four-stop scale; SPEC-08 is where ε lives, and it defaults to 0 so the honest baseline is pure conservative non-domination.

## Complexity Tracking

Scope is bounded to exactly the contract §6 movement: generate (fixed 16-candidate fan-out), score (reuse SPEC-07), organise (non-domination + diversity cap). No optimiser, no PRNG dependency, no `/relax` awareness (SPEC-09), no scenario strip (SPEC-10), no `knowledge_overrides` on the handful (seam §6 open question 3 — stays scorer-only). The only new surface is `handfulStrip`; the S2 matrix is reused unchanged.

## Phase Gates

- Research complete (DEC-11): ✅ `03-score-plan.md` §5.
- Spec approved: this slice.
- Tests-first: the organiser's non-domination laws (constructed vectors) and the determinism assertions are written and confirmed failing before `src/handful.ts` behaviour (constitution quality gate 2).
- Green: typecheck + full suite; the Meridian base handful is 3–5 distinct, computed not hand-set; no schema regen in this slice.
