# Data Model: Scenario Robustness (SPEC-10)

**Date**: 2026-07-14

## No Schema Changes

SPEC-10 introduces no new LinkML types and modifies no existing ones. The existing schema already supports multi-scenario labelling:

- `CommitmentVerdict.scenario: LogicalId` — already required, carries the scenario label per verdict
- `PlanScore.scenario: LogicalId` — already required
- `CompiledWorld.scenario?: LogicalId` — already optional, set when compiled with a scenario excursion
- `ScenarioCOA` — already defined with `excursion?: ChannelOverride[]`

## New Movement Types (seam.ts — not stored)

### RobustnessRequest

The input to the multi-scenario scoring orchestration.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `plans` | `Ref[]` | yes | The plans to score (from the SPEC-08 handful or `/relax` candidates) |
| `worlds` | `Record<string, Ref>` | yes | One compiled world per scenario, keyed by scenario id (e.g. `{R1: ref, R2: ref, R3: ref}`) |
| `engine_version` | `string` | yes | Engine version for determinism (G1) |

### RobustnessResult (success)

| Field | Type | Description |
|-------|------|-------------|
| `tensor` | `ScenarioVerdictTensor` | The `plan × commitment × scenario` verdict data |
| `stamp` | `string` | Deterministic hash over inputs |

### ScenarioVerdictTensor

| Field | Type | Description |
|-------|------|-------------|
| `scenarios` | `string[]` | Ordered scenario ids (e.g. `['BASE', 'R1', 'R2', 'R3']`) |
| `plans` | `string[]` | Ordered plan logical ids |
| `commitments` | `string[]` | Ordered commitment logical ids |
| `verdicts` | `Map<string, CommitmentVerdict>` | Keyed by `{plan}-{commitment}-{scenario}` |
| `worst_case` | `Map<string, VerdictBand>` | Per `{plan}-{commitment}`: the worst verdict across scenarios |
| `stamps_compatible` | `boolean` | Whether all worlds share the same consumed-knowledge stamp lineage |

## Relationships

```
RobustnessRequest
  └── plans[] ──→ Plan (SPEC-08, existing)
  └── worlds{} ──→ CompiledWorld (SPEC-06, existing, one per scenario)

RobustnessResult
  └── tensor.verdicts{} ──→ CommitmentVerdict (SPEC-07, existing)
  └── tensor.worst_case{} ── derived from verdicts (minimax)
```

No new trace edges — the existing `scored_from` edges on each `CommitmentVerdict` already trace back to the world that produced them (G3).
