# SPEC-17 — Demonstration narratives & wall-projection mode

Stage 7 · post-gate · research note `docs/research/09-narratives.md`
Authority: ASSAY-DEC-7 (narratives are demo configurations), DEC-23 (demo moments as standing exits), DEC-19 (no weights, stated tie-breaks).

## 1. What this spec delivers

The five demonstration narratives (concept §1) as **scripted, interactive tab-order + presenter-note sequences** over the existing live SPA, plus **wall-projection mode** (CSS-only).

Each narrative is a configuration of the same running app — not a separate build (DEC-7). It assembles the per-stage demo moments banked at Stages 1–6 (DEC-23).

## 2. Scope

### In scope

1. **Five narrative definitions** (J-2, Planner, Commander, Bridge, REMIT) with:
   - Tab order (which tabs in what sequence)
   - Per-beat presenter notes (what to say, what to show)
   - Doctrinal quotations (principle 5: quote the doctrine at the moment it bites)
   - Centrepiece moment identification
2. **Narrative runner** in the shell:
   - Narrative selector dropdown
   - Beat-by-beat navigation (previous/next)
   - Auto-switch to the correct tab on each beat
   - Presenter notes panel (dark, legible at a podium)
   - Scripting principles reminder (collapsible)
3. **Wall-projection mode** (`data-projection="wall"`):
   - Large type (body ≥ 24px, labels ≥ 20px, pill numerals ≥ 18px)
   - Forced dark, high contrast
   - Tab bar hidden (full-screen single surface)
   - Legend collapsed by default
   - Auto-follow on delta feed scroll
4. **Tests** validating:
   - All five narratives defined with correct structure
   - Tab orders match note 09 §4 table
   - Banded-honesty guard: no presenter note narrates a midpoint, a weighted sum, or a verdict as a score
   - Doctrinal quotes present where required

### Out of scope

- Map/geospatial panel (delivery plan §5 — no narrative requires it in v1)
- Selection endpoint (`/select` — walkthrough beat 5; deferred)
- Thesis G interdependency (horizon)
- User-study validation of the band pill (note 09 §3 — bounded to design audit)

## 3. Scripting principles (note 09 §4)

1. Never narrate a midpoint.
2. Never narrate a weighted sum.
3. Use the verdict as a category, not a score.
4. State the tie-break.
5. Quote the doctrine at the moment it bites.

## 4. Narrative outlines (note 09 §4 table)

| Narrative | Audience | Lead theses | Tab order | Centrepiece moment |
|---|---|---|---|---|
| J-2 | Intelligence staff | D, E, F | S1 → S4 → S1 | "K8 is single-source and load-bearing — verify it next" |
| Planner | J-3/5 planners | C, B | S2 → S2 (scenario) → S3 | "Toggle R2 and watch the favourite die" |
| Commander | Commander / COS | B + trace | S3 → trace → S2 | "Three cards, one sacrifice stated in command language" |
| Bridge | Both staffs | A, F | S4 → S1 (edit) → S4 (glow) | "Supersede K5 and watch the flags land" |
| REMIT | Design team | All | S4 → S1 → S2 → S3 → S4 | "The seam is one shared store, walked end-to-end" |

## 5. Wall-projection mode (note 09 §5)

CSS-only config toggled via `data-projection="wall"` on the document root. Not a separate surface. The same component tree renders; only sizes, scroll behaviour, and chrome visibility change.

## 6. Files

- `src/narratives.ts` — narrative definitions (pure data, no DOM)
- `src/app/shell.ts` — narrative runner UI + wall-projection CSS (modified)
- `tests/narratives.test.ts` — structure, tab-order, and honesty-guard tests

## 7. Exit criteria

Each narrative runs as a scripted ≤10-minute demo from a cold start, offline — the build plan's Stage-7 exit.

## 8. Register assertion

This spec asserts **no new register decision**. The narratives are constrained by DEC-7 (demo configurations), DEC-19 (no weights), DEC-23 (demo moments as standing exits). Wall-projection mode is a presentation adaptation within Stage-7 delegated authority (note 09 §5). All latitude (tab orders, presenter guidance, projection thresholds) is recorded in the research note.
