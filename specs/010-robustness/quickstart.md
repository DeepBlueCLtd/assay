# Quickstart Validation: Scenario Robustness (SPEC-10)

**Date**: 2026-07-14

## Prerequisites

- `npm install` completed
- `npm run gen` completed (types generated)
- Existing tests pass: `npm test`

## Validation Scenarios

### 1. Multi-scenario scoring produces the thesis-C collapse

```bash
npm test -- --grep "robustness"
```

**Expected**: The `strait_early` plan's C2 verdict is `robust` under BASE but `violated` under R2. The `sweep_first` plan's `must`-tier verdicts remain at least `marginal` under all three scenarios.

### 2. Scenario strip renders in the gallery

```bash
npm run gallery
```

Open `docs/assets/gallery/index.html` and verify:
- The scenario strip section shows plans with per-scenario verdict columns
- The `strait_early` plan's R2 column shows a degraded C2 verdict
- The `sweep_first` plan's columns are stable across scenarios

### 3. Typecheck and full test suite

```bash
npm run typecheck
npm test
```

**Expected**: All tests pass, including existing oracle cases O-1–O-4 and handful determinism (G1). No regressions.

### 4. Comparability guard

The test suite includes a case where worlds with different stamp lineages trigger the incomparability indicator on the verdict tensor (`stamps_compatible: false`).

## Demo Moment: "don't plan on most-likely"

1. Open the gallery or live app
2. View the handful in the S2 matrix (BASE scenario)
3. Toggle R2 (Strait Denial)
4. Observe: the `strait_early` plan's C2 cell drops from `robust` to `violated`
5. Toggle R1 and R3: the `sweep_first` plan holds across all three
6. Quote JP 2-01.3: "The commander should not plan solely on the most likely enemy COA."
