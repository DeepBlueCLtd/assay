# Contract — Relax service (`POST /relax`, seam §7)

Called when a commitment set is unsatisfiable against a world (or to ask "what would we give up if it were?"). Returns a `RelaxationReport` whose candidates each name their `sacrificed` commitments — never an empty set, never a silent constraint drop, tie-breaks stated (G4). All declines are first-class `Refusal`s (seam §1).

## Request

```
POST /relax
{
  world: Ref,             // a CompiledWorld carrying its excursion (e.g. the R3m world)
  commitments: Ref[],     // the commander's set (C1–C6); tiers drive the ranking
  seed: number,           // orders candidate enumeration and same-tier ties
  engine_version: string
}
```

Scenario is derived from the world (`world.scenario ?? BASE`) — the world already carries any excursion (DEC-10); `/relax` is scenario-blind like the scorer.

## Response

```
→ { report: RelaxationReport, stamp, feasible?: { plan: Ref } }   // success
| Refusal { refused: true, reason, offending: Ref[], explanation } // decline
```

## Behavioural contract

1. **Generate** — a seeded, R3m-responsive candidate set (`src/relaxCandidates.ts`): plans whose routes engage the mined approaches / the timing that trades C2, each a valid DEC-20 plan with routes for the five force elements. Deterministic in `(seed)`.
2. **Score** — each candidate through the SPEC-07 `ScoreService` (reused). The **sacrifice set** of a candidate is exactly the commitments whose verdict is `violated`; `tight`/`marginal` are risks, not sacrifices.
3. **Feasibility** — if a candidate sacrifices nothing (empty set), report it as `feasible` (first-class) rather than a `RelaxationCandidate` with empty `sacrificed` (G4 requires non-empty). The commitment set was satisfiable.
4. **Minimality** — keep the inclusion-minimal sacrifice sets: drop a candidate whose sacrifice set is a strict superset of another's; keep incomparable sets (different singletons) both; collapse duplicate sets to one representative. No scalar total, weighted sum, or midpoint decides membership (DEC-19, DEC-15).
5. **Rank** — least-worst first by lexicographic tier cost `(musts, shoulds, prefers)` ascending. A must-sacrifice is still returned, ranked last (G4 — never dropped). Same-tier ties ordered by commitment-id, stated in `tie_break`.
6. **Emit** — one `RelaxationCandidate {plan, sacrificed (non-empty), narrative}` per surviving set; `narrative` in command language naming the operational consequence (no decimal, no verdict-internal token — G2).
7. **Trace** — write `cited_in` edges from each candidate's verdicts/scores to the `RelaxationReport`, and `sacrificed_in` from each sacrificed `Commitment` to its candidate, so every card opens a complete backward chain to named knowledge (G3, knowledge model §10).
8. **Determinism** — `stamp = hash(world.stamp, sorted commitment ids, seed, engine_version)`; same inputs ⇒ byte-identical stamp and identical ordered report (G1). Never hashes materialised cells.
9. **Scope** — writes no delta (relax is a read-of-world, like scoring), and does not perform the commander's `/select` act (seam §11 — a later slice).

## Refusals (all first-class, persist nothing)

| reason | when |
|---|---|
| `unknown_ref` | `world` names no live object |
| _(scorer refusal)_ | if scoring a candidate refuses (e.g. `stamp_mismatch`), that refusal is returned verbatim |
