# Data Model: Spine-Complete Gate Harness

**Date**: 2026-07-14 | **Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

## No New Data Model

SPEC-15 introduces no new data types, no schema changes, and no new seam types. The gate harness consumes the existing types from `src/generated/types.ts` and `src/seam.ts` exclusively.

### Entities consumed (read-only)

| Entity | Source | Role in gate |
|--------|--------|-------------|
| `KnowledgeObject` | `src/generated/types.ts` | Seeded from `fixtures/knowledge.json`; G2/G5 assertions |
| `CompiledWorld` | `src/generated/types.ts` | Compile output; G3/G5/thesis-A assertions |
| `Band` | `src/generated/types.ts` | G2 structural walk target |
| `VerdictBand` | `src/generated/types.ts` | G2 four-stop assertion |
| `Commitment` | `src/generated/types.ts` | Loaded from fixtures; thesis-B/C assertions |
| `Plan` | `src/generated/types.ts` | Loaded from fixtures; scoring/handful/relax inputs |
| `ScenarioCOA` | `src/generated/types.ts` | Loaded from fixtures; robustness assertions |
| `VignetteConfig` | `src/generated/types.ts` | Compile configuration |
| `Refusal` | `src/seam.ts` | G5 contested-compile assertion |
| `ScoreResult` | `src/seam.ts` | G2/G3/oracle assertions |
| `HandfulResult` | `src/seam.ts` | G1/G2 assertions |
| `RelaxResult` | `src/seam.ts` | G4/thesis-B assertions |
| `RobustnessResult` | `src/seam.ts` | Thesis-C assertions |
| `SensitivityResult` | `src/seam.ts` | Thesis-E assertions |
| `DiscriminationResult` | `src/seam.ts` | Thesis-D assertions |
| `StalenessResult` | `src/seam.ts` | Thesis-F assertions |
