# Implementation Plan: From Q&A to COA (SPEC-18)

**Spec**: `specs/018-qa-to-coa/spec.md` · **Research spike** (cross-cutting, no stage gate) · **Depends on**: SPEC-05/06/07/08/09/16 (all shipped) · **Register**: no new decision (DEC-30 blog cadence; DEC-10/DEC-19 latitude)

## Summary

Ship the SPEC-18 **deliverable**: a blog article with an embedded three-panel interactive that walks a reader from a banded Q&A answer to a Commander's COA verdict, using K3/K6/K7 as the three-pattern taxonomy (band-propagating · geometric-only · route-dependent miss). The investigation and its instrumented proof (`tests/k3-trace.test.ts`, 10 tests) are already merged; this plan builds only what remains: the embed, the article, and the wiring. **No `src/` change** beyond one embed build script (spec §4).

## Architecture — the blessed static-embed pattern, extended

The article follows the exact convention `2026-07-13-band-pill.html` set: a self-contained HTML post that mounts a **standalone embed** via one `<iframe>`. The embed is generated at build time by importing the **real** components and driving the **real** pipeline over the frozen Meridian fixtures — never a browser re-implementation (build-embeds.ts §HONESTY).

```
fixtures/*.json ─▶ scripts/build-embeds-qa.ts   (new, mirrors build-embeds.ts)
                     │  new KnowledgeService + CompileService + ScoreService
                     │  compile BASE world; score P1/P2 × C3/C4
                     │  Panel 2: re-score P1×C4 over a sweep of K6 override bands
                     ▼
              docs/blog/embeds/qa-to-coa/index.html   (committed, self-contained)
                     ├─▶ src/components/bandPill        (K3/K6/K7 answer bands)
                     ├─▶ src/components/provenanceChip  (source class · confidence)
                     ├─▶ src/components/channelTrace    (band → RegionOverride in the world)
                     └─▶ src/components/s2Matrix        (P1/P2 × C3/C4 four-stop verdicts)
                     ▼
docs/blog/posts/2026-07-14-qa-to-coa.html   (new, mounts the embed via <iframe>)
```

The three panels each pre-render the real outputs for their reachable states; the reader's only live control is Panel 2's K6-width slider, which swaps between **real scorer outputs** captured per frame. The interaction is real; the pixels are the components' own. That earns the "live component" label without a bundler or runtime crypto in the shipped page.

## Build

- New `scripts/build-embeds-qa.ts` (peer of `scripts/build-embeds.ts`). `package.json` `embeds` script runs both; `build:site` already chains `embeds`, so the site build picks it up with no further change.
- Output committed under `docs/blog/embeds/qa-to-coa/index.html` (reviewable in-repo, copied verbatim into `site/` by `build-site.ts`'s existing `cpSync` of `docs/blog/`).

## Panel data (all from the real pipeline, values match `tests/k3-trace.test.ts`)

- **Panel 1 — K3 → C3 (geometric-only).** K3 `[35000,55000]` compiled as a `civil_density` `RegionOverride` (channelTrace). C3's `fires` metric: P1 `[0,0]`→marginal, P2 `[1,1]`→violated. Score P2×C3 **with and without K3** → identical → the band is present but never read.
- **Panel 2 — K6 → C4 (band-propagating).** K6 `[2,6]` compiled onto `threat`/`fac_waters`. C4 `exposure` reads it along FE-ANVIL: P1 `[12,36]`→margin `[-24,0]`→tight; P2 `[0,0]`→margin `[12,12]`→robust. **Slider** widens K6 across a sweep (min `[2,6]`→max `[1,8]` and beyond via `knowledge_overrides`), each frame the real re-scored C4 margin; widening strictly widens the margin (G6).
- **Panel 3 — K7 → C4 (route-dependent miss).** K7 `[8,14]` compiled onto `threat`/`air_defence`. FE-ANVIL enters `air_defence` in neither P1 nor P2 → C4 unaffected. Callout: K7's role is upstream at plan generation.

## Constitution Check (pre- and post-design — passes)

- **Banded honesty (II, G2):** every scalar on the page is a band pill or a four-stop verdict; no unbanded assessed scalar. The K6 slider reads bands only. ✓
- **Register-first (DEC-2):** no new decision asserted. The article's "what could change" sidebar (spec §5.1, `weighted_civil_harm`) is framed as a *possibility for an SME to raise as an issue*, not a candidate asserted here. ✓
- **Research-first (DEC-11):** cross-cutting research spike; the investigation §1 in the spec is its own note-equivalent, and the claims are proved by the merged test. No stage gate. ✓
- **Frozen identifiers:** the embed renders vignette identifiers only (K3/K6/K7, C3/C4, P1/P2, FE-FALCON/FE-ANVIL). ✓
- **No invented quantities (DEC-19):** the article explains the K3→C3 gap as *honest by design* — a leg-count × population product would invent weighted harm no commitment asked for. ✓

## Testable seams

- The claims are already covered by `tests/k3-trace.test.ts` (merged). This plan adds no `src/` logic, so no new unit test is required; the embed's honesty is structural (it imports real components + drives the real pipeline). Verification is: `npm run embeds` succeeds, `npm run typecheck` clean, and the embed renders in Chromium offline with no console errors (spec §2 US6).

## Out of scope

- Any `src/` change (spec §4). The `fires` metric's geometric-only design is within DEC-10/DEC-19 latitude and is **not** a defect.
- A `weighted_civil_harm` metric variant (spec §5.1) — mentioned as a sidebar possibility only.
