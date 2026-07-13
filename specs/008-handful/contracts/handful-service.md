# Contract — Handful service (`POST /plan/handful`, seam §6)

Generates a strategy-biased fan-out (seeded), scores via §5, and organises by banded non-domination into 3–5 genuinely distinct plans. Sacrificial scope (delivery plan §3): a canned handful satisfying this contract keeps every downstream consumer honest — but SPEC-08 implements the honest generator. All declines are first-class `Refusal`s (seam §1).

## Request

```
POST /plan/handful
{
  world: Ref,             // a CompiledWorld to plan against; its stamp seeds determinism
  seed: number,           // orders the enumeration and breaks diversity-cap ties
  count?: number,         // clamped to [3,5]; default 5
  engine_version: string
}
```

Scenario is derived from the world (`world.scenario ?? BASE`) — the world already carries any excursion (DEC-10); the handful is scenario-blind like the scorer.

## Response

```
→ { plans: Ref[], scores: PlanScore[], organisation: { distinct_because: string[] }, stamp }   // success
| Refusal { refused: true, reason, offending: Ref[], explanation }                              // decline
```

## Behavioural contract

1. **Generate** — a seeded fan-out over the four Meridian axes (research note §5.2): approach, suppression, causeway, extraction. 2⁴ = 16 candidate `Plan`s, each a valid DEC-20 plan with routes for the five force elements. Deterministic in `(config, seed)`.
2. **Score** — each candidate through the SPEC-07 `ScoreService` (reused). The criteria vector is the per-commitment **margin band** (satisfied ⟺ margin ≥ 0 — one uniform maximisation order).
3. **Organise** — banded ε-non-domination on the conservative interval order (research note §5): keep a plan unless another is no worse on every commitment and strictly separated-above (by ε) on at least one. `ε` defaults to 0 (scale-free); monotone — a larger ε never shrinks the set. No scalar total, weighted sum, or midpoint decides membership (DEC-19, DEC-15).
4. **Cap** — when the frontier exceeds `count`, trim by deterministic axis-diversity selection (seed-tie-broken), never by a scalar. When below `count`, return all (no padding).
5. **`distinct_because`** — one derived reason per returned plan (aligned to `plans`): the commitments it leads on + its axis signature. Never a hand-authored caption.
6. **Trace** — every returned plan is stored and content-addressed; its verdicts carry the scorer's `scored_from` edges, so every handful member opens a complete backward chain to named knowledge (G3).
7. **Determinism** — `stamp = hash(world.stamp, seed, count, engine_version)`; same inputs ⇒ byte-identical stamp and identical ordered plans/scores/organisation (G1). Never hashes materialised cells.
8. **Scope** — runs no `knowledge_overrides` perturbation (stays scorer-only, seam §6 open question 3) and calls no `/relax` (the commitment set stays whole — relaxation is SPEC-09).

## Refusals (all first-class, persist nothing)

| reason | when |
|---|---|
| `unknown_ref` | `world` names no live object |
| _(scorer refusal)_ | if scoring a candidate refuses (e.g. `stamp_mismatch`), that refusal is returned verbatim |
