# Quickstart Validation: Spine-Complete Gate Harness

**Date**: 2026-07-14 | **Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

## Prerequisites

- Node.js installed
- `npm install` completed
- `npm run gen` completed (LinkML types generated)
- All existing tests pass: `npm test`

## Running the gate

```bash
npm test -- tests/gate.test.ts
```

The gate harness runs as part of the standard `npm test` suite. No special flags, no separate command.

## Expected outcome

All assertion groups pass:

| Group | Invariant / Thesis | Key assertion |
|-------|-------------------|---------------|
| G1 | Determinism | Same inputs → byte-identical stamps across two runs |
| G2 | No bare assessed scalars | Every `Band` has `{lo, hi}`; every verdict is four-stop |
| G3 | Complete trace chains | Every artefact backward-traces to named KnowledgeObjects |
| G4 | Least-worst, never silence | Relaxation report non-empty; `sacrificed` populated |
| G5 | Contested never compiles | Compile refuses with `contested_knowledge` |
| G6 | Propagation honesty | O-1–O-4 hold at integration level |
| Thesis A | Pipeline | Every channel has `compiled_into` edges to knowledge |
| Thesis B | Least-worst | Three inclusion-minimal candidates under R3m |
| Thesis C | Robustness | P1 collapses under R2; P2 survives |
| Thesis D | Collection | K11 ranks above K13 on discrimination |
| Thesis E | Sensitivity | K8 tops ranking, `single_source: true` |
| Thesis F | Staleness | Exactly K5-dependent verdicts flagged |

## Failure diagnostics

Every assertion failure includes:
- The invariant or thesis violated
- The specific artefact involved
- Expected vs actual values

## Validation scenarios

1. **Green path**: `npm test -- tests/gate.test.ts` — all pass
2. **Regression check**: modify a fixture band to be bare scalar — G2 assertion fails with diagnostic
3. **Full suite**: `npm test` — the gate harness runs alongside all existing 267+ tests
