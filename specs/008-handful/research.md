# Phase 0 — Research (SPEC-08)

**DEC-11 gate**: `docs/research/03-score-plan.md` §5 — present before implementation. The Stage-3 note reserved §5 for SPEC-08 when it gated SPEC-07; no separate note is authored (the handful strategy folds into the score-plan note, as the note itself states).

## Decisions taken from the note (not re-derived here)

1. **Distinctness = banded ε-non-domination** (note §5). Two plans are distinct in banded space when neither ε-dominates the other across the criteria vector of banded scores, using the conservative interval order (`A ⪯ B` iff `A.hi ≤ B.lo`). Overlapping bands are honestly incomparable and both survive.
2. **ε is the organiser's knob, not the verdict's** (note §3/§5). SPEC-07 kept ε out of the four-stop scale; SPEC-08 is where it lives. It defaults to 0 — scale-free, since the criteria carry incommensurate units (steps, band-hours, boolean, district cells) and no absolute ε is honest.
3. **The four generation axes are Meridian's own** (note §5.2): approach (strait-early vs sweep-first), suppression posture (fires-forward vs stand-off), causeway (contest vs bypass), extraction coupling (pull-out early vs mission-tail). REMIT's time/exposure/robustness/completeness axes do not transfer unexamined (concept §6.2) — the note closes that open question for this domain.
4. **The generator is sacrificial scope** (delivery plan §3). A canned handful over the honest scorer already demonstrates four theses; the honest generator turns "3–5 genuinely distinct plans" into a computed exit rather than a hand-set one. This is why the slice is late on the spine and low-risk.

## Choices this slice makes within that latitude

- **Criteria vector = the scorer's margin bands**, not the raw metric scores. SPEC-07 already orients every comparator to a signed margin (satisfied ⟺ margin ≥ 0), giving one uniform "higher is better" order and removing the need for a per-criterion orientation table. A `violated` verdict (no margin) is the conservatively worst value on its criterion.
- **The domination gate is strict-above** (`A.lo > B.hi + ε`) rather than touching (`≥`), so equal/overlapping bands never count as "strictly better" — this is what makes the relation irreflexive (no plan dominates itself) and keeps DEC-15's "no honest interior point" honest.
- **The diversity cap is by axis Hamming spread, seed-tie-broken** — never by a scalar score, which would smuggle a weighting past DEC-19.
- **No PRNG.** The generator is a fixed 2⁴ enumeration; the seed only orders output and breaks cap ties (a deterministic FNV-1a key). This keeps "same stamp + seed ⇒ identical handful" true by construction, with no hidden non-determinism.

## Sources

As `03-score-plan.md` §5: Laumanns et al. (2002) ε-dominance; Deb et al. (2002) NSGA-II diversity; JP 5-0 COA comparison as commander's judgement (why the cap is not a scalar). ASSAY register DEC-4/10/15/19/20; seam contract §6; vignette §6 (C1–C6, force elements)/§8 (frozen identifiers); concept §6.2.
