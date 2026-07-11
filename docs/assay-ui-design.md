# ASSAY — UI Design & Information Flows

Status: draft for review · v0.1 · 2026-07-11 · candidate addition to the canonical set
Authority: ASSAY-DEC-5 (surfaces as config-declared projections; stamped deltas), ASSAY-DEC-9 (banded honesty), ASSAY-DEC-7 (narratives as configurations).
Companion: `assay-ui-wireframes.html` — populated wireframes of all four surfaces using Meridian vignette data.

---

## 1. Design principles (UI-level restatements of register decisions)

1. **The band is the atom.** No assessed quantity is ever rendered as a bare number. The shared *band pill* component shows lo–hi within context; the *provenance chip* (source class · confidence · owner, plus `single-source` and `assessment, not fact` markings) is welded to it. This is ASSAY-DEC-9 made visible — and it is the demonstrator's signature UI element, because it is the thing SMEs will test first.
2. **Verdicts are a four-stop scale everywhere.** robust / marginal / tight / violated, one colour language across all surfaces. No decimals in verdict cells.
3. **Every number can answer "why?".** Any verdict, score, or ranking opens the *trace drawer*: a backward walk terminating in named knowledge objects with named owners. The drawer is one shared component; surfaces differ only in which end of the graph they open it from.
4. **Surfaces arrange; they never compute.** A surface is a config-declared bundle of projections over the store (ASSAY-DEC-5). If a mock-up implies a derivation the seam doesn't offer, the mock-up is wrong.
5. **Writes are events.** Every cross-role write is a stamped delta; the delta feed is itself a first-class UI object (the Bridge surface), not plumbing.

## 2. Surface inventory

| Surface | Primary user | One-line job | Leads theses |
|---|---|---|---|
| S1 · J-2 workbench | Intelligence staff | "What should I collect, verify, or refresh next?" | D, E, F |
| S2 · Planner workbench | J-3/5 planner | "How do the candidate plans honestly compare?" | C, B |
| S3 · Commander view | Commander / chief of staff | "Argue the least-worst choice to me, and answer why" | B + trace |
| S4 · Bridge view | Both staffs / observers | "Watch one object model cross the J-2/J-3 seam" | A, F |

All four are projections of the same store; a demo narrative (scaffold §1) is a *tab order and a script*, not a build.

## 3. Information flows

### 3.1 Read paths (surface ← seam)

```
S1 J-2 workbench
  ← GET  /knowledge?status=open            (collection queue basis)
  ← POST /analyse/discrimination           (ranked: which question separates the COAs)
  ← POST /analyse/sensitivity              (ranked: load-bearing assessments; single-source flags)
  ← GET  /knowledge?status=stale|contested (refresh & conflict queues)
  ← GET  /knowledge/{id}/exposure          (what does my assessment drive?)

S2 Planner workbench
  ← POST /plan/handful                     (the banded handful for the current world)
  ← POST /score                            (per-scenario re-scores as excursions are toggled)
  ← POST /relax                            (infeasibility report when the commitment set over-constrains)
  ← GET  /trace/backward/{verdict}         (trace drawer)

S3 Commander view
  ← GET  /objects (Plan, SelectionRationale candidates)
  ← POST /relax                            (the least-worst cards)
  ← GET  /trace/backward/{anything}        (the "why" chain)

S4 Bridge view
  ← GET  /deltas?after=t                   (the event feed)
  ← GET  /trace/forward|backward           (the live chain visual)
  ← POST /analyse/staleness                (invalidation fan-out when a delta lands)
```

### 3.2 Write paths (surface → seam → other surfaces)

Only three writes exist in v1, all stamped deltas:

1. **J-2 revises knowledge**: S1 → `POST /knowledge/{id}/supersede` → delta → S2 shows *stale-verdict flags* on affected plans (via `/analyse/staleness`); S4 shows the fan-out. Nothing recomputes silently — the planner chooses when to recompile.
2. **Planner commits a comparison basis**: S2 → `POST /compile` + `/plan/handful` → delta → S3's cards refresh against the new stamp; S1's *exposure* views update (their assessments now drive a live handful).
3. **Commander selects**: S3 → `PUT /objects` (SelectionRationale) → delta → S1 sees which knowledge objects now sit under a *committed* decision (verification priority rises); S2 archives the beaten handful against the rationale.

The loop (1 → recompile → 2 → 3 → back to 1 as new PIRs emerge) is the demonstrator's heartbeat, and it is the JIPOE-supports-planning cycle of JP 2-01.3 rendered as event flow.

### 3.3 The trace drawer (shared read pattern)

One component, four entry points: S1 enters forward from a knowledge object ("this drives…"), S2/S3 enter backward from a verdict or sacrifice ("because…"), S4 shows the whole chain live. Every chain renders as: `KnowledgeObject [owner, source] → compiled channel/scenario [stamp] → verdict/score [plan] → rationale`. Chains must terminate in named objects — a chain that dead-ends is a bug surfaced, not hidden.

## 4. Surface layouts (rationale; see wireframes for rendering)

**S1 · J-2 workbench — "the morning brief to yourself".** Three queues, left to right in priority order: *Collect next* (discrimination ranking — value bands, not collection ease), *Verify next* (sensitivity ranking — band-edge perturbation effects, single-source deception flags), *Refresh/resolve* (validity countdowns; contested pairs blocking compile). A fourth strip shows *exposure*: which of my objects sit under the live handful. The queues are the D/E/F theses as furniture.

**S2 · Planner workbench — "the honest matrix".** Centre: plans × commitments verdict matrix (four-stop chips, margin bands on hover). Right: per-scenario score strip per plan — three banded bars (R1/R2/R3), making the C thesis visible at a glance (P1's bar collapses under R2). Sacrifice tags on least-worst rows. Toolbar carries the stamp and the comparability guard: mixing stamps greys the matrix rather than lying.

**S3 · Commander view — "three cards and a why".** The relaxation report as cards: each card = a least-worst plan, its sacrificed commitment stated in command language ("opens the strait D+9, two days late"), its surviving verdicts, its per-scenario resilience. Below: the why-chain for whichever card element is interrogated. Deliberately sparse — this surface argues; it does not operate.

**S4 · Bridge view — "the seam, watched".** Left: the delta feed (who wrote what, when, as stamped events). Right: the live trace chain for the selected delta, animating the fan-out when a supersession lands. This surface *is* the bridge narrative; it exists to be projected on a wall while S1 and S2 are driven side by side.

## 5. Shared component library (v1)

| Component | Contract | Notes |
|---|---|---|
| Band pill | `{lo, hi, unit, label}` + track context | The signature. Mono numerals; width proportional within track. |
| Provenance chip | `Provenance` | Source-class glyph + confidence + owner; `single-source` and `assessment` markings mandatory. |
| Verdict chip | `VerdictBand` (+ margin band on hover) | Four stops only. |
| Trace drawer | entry ref + direction | Renders chains; dead-end = visible error state. |
| Stamp badge | `stamp`, engine version | Everywhere a computed thing is shown; click = comparability details. |
| Delta row | `Delta` | Actor · role · op · refs · time. |
| Scenario strip | plan id × scenario set | Three banded bars; the C-thesis glance. |

## 6. Open questions (register candidates)

1. Map/geospatial panel: the vignette wants one (grid, causeway, strait), but none of the four narratives *requires* it in v1 — admit as an S2 side panel or defer?
2. Surface shell: literal tabs in one SPA (fastest; weakest "different roles" illusion) vs role-switch with distinct chrome per surface (stronger demo theatre).
3. Does S3 permit *any* write other than selection (e.g. commitment re-prioritisation), or is that a planner act by definition?
4. Wall-projection mode for S4 (large type, auto-follow feed) as a first-class config.
