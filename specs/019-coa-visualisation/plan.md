# Implementation Plan: Spatial & temporal COA visualisation (SPEC-19)

**Spec**: `specs/019-coa-visualisation/spec.md` · **Research note**: `docs/research/10-spatial-temporal.md` (**DEC-11 gate — authored by US1; gates US3/US4**) · **Register**: concept §6 item 21 (flagged); extends ASSAY-DEC-31(c)

## Shape — research-first, review-first

This is not a build-then-review slice. The order is load-bearing:

```
US1  research note (10-spatial-temporal.md)   ── decides banded-surface rule + temporal-window rule
  │      + US2 alternative-perspectives survey ── picks the perspective that reveals the honest gap
  ▼
US3  mockups over Meridian fixtures            ── the artefact the note's review invitation points at
  │      (real geometry, real bands, no faked verdicts — SPEC-14 honesty class)
  ▼
  ◇  SME review (comms §12)  ── spatial honesty/legibility? temporal honesty/legibility?
  ▼
US4  interactive input loop                    ── prototyped in the mockups against the SPEC-16 pipeline;
         promotion to a standing surface follows review
```

Nothing in US3/US4 starts before US1's note lands (DEC-11). Nothing asserts a decision the register hasn't ratified (DEC-2) — implied decisions are concept §6 candidates, flagged.

## The load-bearing finding — the data is already spatial and temporal

No new shapes are needed. The fixtures already carry the geometry:

- **Regions** — `fixtures/vignette-config.json` `regions[]`: `{name, x0, y0, x1, y1}` on the 60×60 grid (e.g. `fac_waters` `30,20→50,34`; `air_defence` `40,40→52,52`; `port_district` `24,30→40,46`).
- **Routes** — `fixtures/plans.json` `elements[].route[]`: `{x, y, enter_step, exit_step}` (e.g. P1 `FE-ANVIL` `30,50 (0→8) → 32,22 (8→9)` — enters `fac_waters`, stands off `air_defence`).
- **Channels** — the sparse `Channel` (`default: Band` + `RegionOverride[]`, DEC-29): the banded surface itself.

So the map/timeline is a **projection of fixtures** — the SPEC-14 gallery's honesty class — not a drawing. `src/mapProject.ts` (pure) maps grid coords → viewport; the renderers turn regions/routes/bands into SVG/HTML strings.

## Rendering — pure components, state in the shell (SPEC-14 split preserved)

- **`src/mapProject.ts`** (new, pure, testable) — grid→viewport projection + region/route hit-geometry; no DOM, no state.
- **`src/components/coaMap.ts`** (new, pure) — regions as banded channel surfaces (two-stop/extent fills, never a single stop for an assessed channel), routes overlaid, legend keyed; types-in, string-out. Reuses `bandPill`/`provenanceChip` on hover payloads.
- **`src/components/coaTimeline.ts`** (new, pure) — validity windows (`K5`/`K9`), task windows, storm ridge as banded extents; no interpolation.
- All state (current step, selected plan, drag session, recompute results) lives in `src/app/` — the renderers never learn there is a store (extractability, FR-010).

## The banded surface — the one rendering decision that must not lie (research §-driven)

A channel band `[lo, hi]` must render *as a band*. The note decides the encoding; candidates to weigh there: a two-stop gradient bounded by lo/hi (the extent legible, no single implied value), a hatched/textured fill whose density spans the band, or a lo-surface + hi-surface pair. Whatever is chosen, hover always yields the exact `[lo,hi] unit` via `bandPill`, and no single-stop heat fill stands in for an assessed interval (G2). This is the crux the US1 review asks SMEs about.

## Interaction — reuse SPEC-16, add drag + scrub (US4)

- **Scrub / hover** (understanding): a step slider drives `src/app/state.ts` to select the world-at-step; hover emits a banded payload rendered by `bandPill`/`provenanceChip`. No recompute — pure selection over the compiled world.
- **Drag waypoint / shift window** (input): a drag session authors a new `Plan` version and calls the SPEC-16 recompute path (`compile → score`, the `build-gallery.ts` sequence) → new verdicts → glow diff (`src/app/glow.ts`, reused) on the changed `content_hash` set. Byte-identical to a from-scratch run (G1, FR-009).
- **Refusal**: an infeasible drag (onto a `K1` depth violation) or a dishonest band edit returns a `Refusal` rendered in place by `refusalBanner`; nothing persists (FR-007).
- **Promotion** (post-review): the interactive map/timeline becomes an S2/S4 mode or a fifth tab — *decided after* the US1 review (comms §12); DEC-31(d)'s "never silently optimise" caution binds any auto-behaviour.

## Testable seams (Node, vitest)

- `src/mapProject.ts` — projection + region/route hit-tests (which regions does a leg enter? P1 ANVIL ∈ `fac_waters`, ∉ `air_defence`) — pure, no DOM.
- Renderer snapshot/shape tests — every assessed channel emits a band (assert no single-stop for assessed), every region matches its box.
- Reuse the SPEC-16 app-bootstrap smoke for the drag-recompute (Node, `crypto.subtle` ≥19): author an edited P1, re-score, assert C4 margin changes and the glow set equals the changed-hash set.

## Out of scope / deferred (tracked)

- **Promotion to a standing surface** — gated on the US1 SME review (this slice ships the note + mockups + prototype interaction).
- **A real basemap / geospatial projection** — the map is a grid schematic (DEC-31(c), DEC-8); no tile layer.
- **Space-time cube as a shipped view** — weighed in the note (US2); only built if the note recommends it over the map+timeline pair.
