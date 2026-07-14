## Summary

<!-- 1–3 sentences: what changed and why. -->

## Slices

<!-- Which SPEC-## this PR implements. Link the spec folder. -->

- SPEC-##: [title] (`specs/###-name/`)

## Register impact

<!-- Does this PR assert, rely on, or propose any register decision?
     If yes, cite the DEC-## or flag the candidate in concept §6.
     If no, say "No new register decision." -->

No new register decision.

## How to review

<!-- Prescriptive steps — assume the reviewer is in a rush.
     Link directly to the PR preview where possible. -->

### 1. Quick check

- [ ] `npm run typecheck` clean
- [ ] `npm test` passes
- [ ] No unbanded scalars from assessed sources (G2)

### 2. Walk the new capability

<!--
  Link to the specific page/component in the PR preview deployment:
  https://DeepBlueCLtd.github.io/assay/pr-preview/pr-{N}/

  Example:
  1. Open [gallery](https://DeepBlueCLtd.github.io/assay/pr-preview/pr-{N}/assets/gallery/)
  2. Scroll to the scenario strip — toggle R2 on
  3. Verify P1 C1/C2 show "violated" with collapse markers
-->

1. Open [the gallery](https://DeepBlueCLtd.github.io/assay/pr-preview/pr-{N}/) <!-- update {N} -->
2. [Step-by-step instructions to exercise the new feature]

### 3. Blog article

- [ ] Article renders: [link to blog post in PR preview]
- [ ] Embed works (interactive elements respond)
- [ ] Light and dark mode both render correctly

## Evidence

<!-- Inline the evidence screenshots captured during test verification.
     These live in docs/blog/evidence/{spec-id}/ and are committed in this PR.
     Reference them with relative paths so they render in the PR description.

     Example:
     ### Scenario strip — R2 collapse
     | Light | Dark |
     |-------|------|
     | ![light](docs/blog/evidence/010-robustness/scenario-strip-light.png) | ![dark](docs/blog/evidence/010-robustness/scenario-strip-dark.png) |
-->

<!-- Delete this section only if the spec's Evidence captures list is empty. -->

## Honesty checklist

- [ ] No unbanded scalar from an assessed source (G2 — constitution II, seam G2)
- [ ] Every output traces back to named knowledge (G3)
- [ ] No silent drops — refused or sacrificed items are visible (G4)
- [ ] Propagation honesty — glow/delta only on real value changes (G6)
- [ ] Frozen identifiers unchanged (K*, C*, R*, FE-*, P*, O-*)
- [ ] Blog article carries embed label, Meridian disclaimer, Sources & trace

## Test plan

- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] Manual verification of the new capability in PR preview
- [ ] Blog article and evidence reviewed
