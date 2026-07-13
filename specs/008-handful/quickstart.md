# Quickstart — SPEC-08 handful

## What this slice adds

`POST /plan/handful` — the last unit of the spine. Generate a strategy-biased fan-out over Meridian's four axes, score each candidate with the SPEC-07 scorer, and organise by banded non-domination into 3–5 genuinely distinct plans.

## Run it

```
npm install
npm run typecheck      # clean — no schema change, no gen
npm test               # vitest — includes dominance / generate / handful suites
npm run gallery        # regenerates the honest-matrix demo over the GENERATED handful
```

## The three steps (src)

| File | Role |
|---|---|
| `src/generate.ts` | seeded fan-out over the four axes → 16 candidate `Plan`s (`generateCandidates(config, seed)`) |
| `src/dominance.ts` | banded ε-non-domination on the conservative interval order (`nonDominated`, `dominates`, `distinct`) |
| `src/handful.ts` | `HandfulService.handful(req)` — generate → score (reuse `ScoreService`) → organise → cap; deterministic stamp |
| `src/components/handfulStrip.ts` | renders the derived `distinct_because` per plan above the S2 matrix |

## Minimal use

```ts
const scorer = new ScoreService({ store, trace, config, commitments });
const handfuls = new HandfulService({ store, scorer, config, commitments });
const h = await handfuls.handful({ world: baseWorldRef, seed: 1, engine_version: '0.1.0' });
// h.plans        — 3–5 Refs, each a stored Plan
// h.scores       — banded PlanScores for the survivors
// h.organisation.distinct_because — one derived reason per plan
// h.stamp        — same (world stamp, seed, count, engine) ⇒ identical handful
```

## The exit (build plan Stage 3)

- `/plan/handful` returns **3–5 genuinely distinct plans** for the Meridian baseline (every pair mutually non-dominated).
- **Same stamp + seed ⇒ identical handful** (G1).
- Every verdict opens a complete backward trace chain (G3), reused from the scorer.

## Demo moment

*The honest matrix, organised not authored:* the S2 matrix now renders the generated handful, and the strip above it names — from the organiser, not a caption — why each plan is one of the few. On Meridian the survivors split cleanly along the two trade axes: approach trades C1 (port) against C2 (strait); suppression trades C3 (civil harm) against C4 (threat).
