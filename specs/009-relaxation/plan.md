# Implementation Plan: Relaxation — least-worst under infeasibility (SPEC-09)

**Branch**: `claude/next-spec-12qusu` · **Spec dir**: `specs/009-relaxation/` · **Date**: 2026-07-13
**Spec**: `specs/009-relaxation/spec.md` · **Research note (DEC-11 gate)**: `docs/research/04-relaxation.md` (present)

## Summary

Build the least-worst unit (delivery plan §ε, Stage 4): `POST /relax {world, commitments, seed} → {report, stamp}`. On an infeasible world (Meridian R3m), a small **R3m-responsive candidate set** (authored geometry that routes into the mined water) is **scored** by the SPEC-07 scorer (reused, not re-implemented); each candidate's **sacrifice set** is read off its `violated` verdicts; the **inclusion-minimal** correction sets survive; they are **ranked lexicographically by commitment tier** (least-worst first) with same-tier orderings stated in `tie_break`; and one `RelaxationCandidate` is emitted per surviving set, each `sacrificed` non-empty (G4), each `narrative` in command language, each traced to knowledge via `cited_in`/`sacrificed_in`. No schema change — `RelaxationReport`, `RelaxationCandidate`, `Plan`, `TraceEdge` all exist (D2). The demo moment ("least-worst, never silence") renders the S3 cards from the actual `/relax` over R3m.

## Technical Context

**Language**: TypeScript (ESM, `type: module`), Node ≥ 22, in-browser-capable (no Node-only APIs in `src/`).
**Testing**: vitest (existing). No new dependency — the candidate set is a fixed authored fan-out; the seed orders enumeration/ties (no PRNG library).
**Reuse (do not re-implement)**: `src/{store,trace,canonical,validate,seam}.ts`, `src/score.ts` (`ScoreService` — the scorer is CALLED, never re-built), `src/generated/types.ts`, `src/metrics.ts`/`src/materialise.ts` (via the scorer). The four-stop `verdict` the sacrifice set reads comes straight off the scorer's `CommitmentVerdict`.
**New source**: `src/relaxCandidates.ts` (authored R3m-responsive candidate `Plan`s + per-candidate command-language narrative), `src/tiers.ts` (tier-lexicographic order + inclusion-minimality over sacrifice sets — pure, testable in isolation), `src/relax.ts` (the `RelaxService`), `src/components/s3Cards.ts` (the least-worst cards). New seam types in `src/seam.ts`. No new fixtures file — candidates are code (documented route geometry, as `src/generate.ts` is), the commitments/coas fixtures already exist.
**Constraints**: G4 (never empty, never a silent drop, tie-break stated); banded honesty at the seam (G2 — no decimal/margin on the card face); no numeric weight / scalar total / midpoint anywhere in ranking (DEC-19, DEC-15); determinism over inputs, never over cells (G1); first-class refusals (seam §1); frozen identifiers — candidate plans stay in the `P*`/`RX-*` family, clearly marked relaxation scaffolding (vignette §8).

## Constitution Check

- **Register-first (DEC-2)**: SPEC-09 introduces **no new decision**. The formalism (lexicographic priority, no weights) is decided *by* DEC-19; the report shape *by* knowledge model §5/§8 and seam §7/§G (G4); the tie-break rule *by* DEC-19's own "state it explicitly" instruction. The research note asserts no register candidate; any latitude (the singleton tie-break convention; the authored candidate geometry) is within Stage-4 delegated authority under the vignette §6/§9 exit and is recorded in the note, not asserted in a peer document.
- **Research-first (DEC-11)**: `docs/research/04-relaxation.md` present before implementation — gate satisfied. The note also corrects course honestly: the SPEC-08 BASE generator routes clear of the banded regions and cannot surface the mining conflict, so SPEC-09 authors an R3m-responsive candidate set (route latitude, §8) while the *sacrifices remain computed* by the reused scorer.
- **Banded honesty (G2)**: the sacrifice set is read from the four-stop `verdict`, not from a scalar; the card face names commitments and consequences, never a decimal; the banded `margin` stays for the trace drawer only.
- **Least-worst, never silence (G4)**: the report is never empty and never drops a constraint without a card naming it; tie-breaks are stated. This is the invariant the slice exists to uphold.
- **Frozen identifiers**: C1–C6, R3m, FE-* rendered as-is; candidate plans use `RX-*` ids encoding their posture, clearly marked demonstrator scaffolding.
- **Batch propagation**: the current-phase line (CLAUDE.md), the build/delivery peers, and the gallery sweep in the same change.

## Project Structure (this slice)

```
docs/research/04-relaxation.md               # DEC-11 gate (done)
specs/009-relaxation/{spec,plan,tasks,data-model,research,quickstart}.md
specs/009-relaxation/contracts/relax-service.md
specs/009-relaxation/checklists/requirements.md
src/tiers.ts             # tierCost; lexicographic compare; inclusionMinimal over sacrifice sets
src/relaxCandidates.ts   # authored R3m-responsive candidate Plans + command-language narratives
src/relax.ts             # RelaxService: /relax (generate -> score -> sacrifice -> minimal -> rank)
src/components/s3Cards.ts
tests/{tiers,relax}.test.ts
```

## Design decisions (from the research note)

1. **Formalism = preemptive lexicographic priority over ordinal tiers, NO weights** (note §1–2). Weighted CSP / MAX-SAT / Archimedean goal programming rejected on honesty grounds (DEC-19). The tiers ARE the priority levels.
2. **Return the inclusion-minimal correction-set frontier, not one optimum** (note §2; G4). A candidate is dropped iff another's sacrifice set is a strict subset; different singletons both survive; duplicate sets collapse. The must-sacrifice is ranked last, never dropped.
3. **`sacrificed` = exactly the `violated` commitments** (note §3). Grounded in the four-stop scale the scorer computes; `tight`/`marginal` are risks, not sacrifices.
4. **Reuse the SPEC-07 scorer; author the R3m-responsive candidates** (note §3–4). The scorer decides the sacrifices; the candidate geometry (routes into the mined water) is authored latitude (vignette §8), as SPEC-07's `plans.json` was.
5. **Content-neutral, stated tie-break** (note §4). Same-tier candidates ordered by commitment-id, stated in `tie_break` as a placeholder for commander priority — never a coded value ranking (the C3-vs-C4 civil-harm/force-protection judgement is the commander's).
6. **Command-language narratives** (note §5). Each card names the operational consequence (MDMP / JP 5-0 idiom); the banded `margin` stays underneath for the trace drawer (G2).

## Complexity Tracking

Scope is bounded to exactly the contract §7 movement: generate (fixed authored candidate set), score (reuse SPEC-07), read sacrifices, keep inclusion-minimal, rank lexicographically, emit report + `cited_in` edges. No SAT/WCSP solver (v1 scale — note §2), no numeric weights, no `/select` (seam §11 — the commander's act is a later slice), no scenario strip (SPEC-10). The only new surface is `s3Cards`.

## Phase Gates

- Research complete (DEC-11): ✅ `04-relaxation.md`.
- Spec approved: this slice.
- Tests-first: the tier-lexicographic order and inclusion-minimality laws (constructed sacrifice sets) and the R3m determinism assertions are written and confirmed failing before `src/relax.ts` behaviour (constitution quality gate 2).
- Green: typecheck + full suite; the R3m relax returns three candidates (C4/C3/C2), computed not hand-set; no schema regen in this slice.
