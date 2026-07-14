# ASSAY — UI Design & Information Flows

Status: draft for review · v0.2 · 2026-07-11 · candidate addition to the canonical set · v0.2 harmonises seam calls with seam contract v0.2, enumerates the full write surface, and adds the discipline-moment interaction specs (§3.4)
Authority: ASSAY-DEC-5 (surfaces as config-declared projections; stamped deltas), ASSAY-DEC-9 (banded honesty), ASSAY-DEC-7 (narratives as configurations).
Companions: `assay-ui-wireframes.html` — populated wireframes of all four surfaces on Meridian vignette data; `assay-walkthrough.md` — the flows below played end-to-end. The wireframes are bound by vignette §8's frozen identifiers (K*, C*, R*, FE-*, P*): a wireframe rendering an identifier or value the vignette does not define is drift and is treated as a defect under batch propagation, not as narrative colour.

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

All four are projections of the same store; a demo narrative (concept §1) is a *tab order and a script*, not a build.

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
  ← GET  /objects?class=Plan|SelectionRationale   (candidate listing — seam §2)
  ← POST /relax                            (the least-worst cards)
  ← GET  /trace/backward/{anything}        (the "why" chain)

S4 Bridge view
  ← GET  /deltas?since=seq                 (the event feed — seam §10)
  ← GET  /trace/forward|backward           (the live chain visual)
  ← POST /analyse/staleness                (invalidation fan-out when a delta lands)
```

### 3.2 Write paths (surface → seam → other surfaces)

Three writes form the heartbeat; the full v1 write surface is enumerated below it. Every write is a stamped delta (seam §10) — including the discipline writes, which are cross-surface in effect (a contest blocks the planner's next compile).

The heartbeat:

1. **J-2 revises knowledge**: S1 → `POST /knowledge/{id}/supersede` → delta → S2 shows *stale-verdict flags* on affected plans (via `/analyse/staleness`); S4 shows the fan-out. Nothing recomputes silently — the planner chooses when to recompile.
2. **Planner commits a comparison basis**: S2 → `POST /compile` + `/plan/handful` → delta → S3's cards refresh against the new stamp; S1's *exposure* views update (their assessments now drive a live handful).
3. **Commander selects**: S3 → `POST /select` (seam §11; writes the SelectionRationale *and* its `cited_in` edges) → delta → S1 sees which knowledge objects now sit under a *committed* decision (verification priority rises); S2 archives the beaten handful against the rationale.

The full v1 write inventory:

| Surface | Writes | Notes |
|---|---|---|
| S1 · J-2 | `POST /knowledge` (create) · `supersede` · `contest` · `resolve` | encoding discipline enforced at write time; each publishes a delta |
| S2 · Planner | `POST /compile` · `/plan/handful` (comparison basis) | the recompile decision after a staleness flag is a deliberate act, §3.4.4 |
| S3 · Commander | `POST /select` | the only commander write in v1 (open question §6.3) |
| J-3 (role, not surface) | waiver grant — `Waiver` embedded in the knowledge object at create/supersede | a cross-role negotiation, not a J-2 solo act; interaction spec §3.4.2 |

The loop (1 → recompile → 2 → 3 → back to 1 as new PIRs emerge) is the demonstrator's heartbeat, and it is the JIPOE-supports-planning cycle of JP 2-01.3 rendered as event flow. `assay-walkthrough.md` plays one full turn of it on Meridian, beat by beat.

### 3.3 The trace drawer (shared read pattern)

One component, four entry points: S1 enters forward from a knowledge object ("this drives…"), S2/S3 enter backward from a verdict or sacrifice ("because…"), S4 shows the whole chain live. Every chain renders as: `KnowledgeObject [owner, source] → compiled channel/scenario [stamp] → verdict/score [plan] → rationale`. Chains must terminate in named objects — a chain that dead-ends is a bug surfaced, not hidden.

### 3.4 Discipline moments — interaction specs

The honesty machinery is specified exhaustively as system behaviour (refusals, waivers, contests, staleness) but these are also the demonstrator's best interactions — the places where ASSAY behaves differently from every tool an SME has seen. Each therefore gets an interaction spec in the vignette's coverage-row style: trigger, actors, surfaces, seam calls, and what *done* looks like on screen. Each is a scripted demo beat (build plan §"demo moments").

**3.4.1 Refusal (exhibit: K10).**
*Trigger:* a write or compute the discipline forbids — here, the J-2 saving an `assessed · low` answer claiming `hard_constraint`. *Actors/surfaces:* J-2 on S1. *Seam:* `POST /knowledge` → `Refusal {reason: encoding_violation, offending, explanation}`. *Interaction:* the refusal banner renders **where the save action was** — reason, offending refs (clickable), the one-sentence render-ready explanation; the object is not stored. The J-2's forward paths are both visible as actions: re-encode as `banded_soft_cost`, or seek a waiver (3.4.2). *Done looks like:* the K10 refusal is shown live in the Stage-1 demo; K10 ends `retired`; no "error toast" styling anywhere — a refusal is an honest outcome, not a failure.

**3.4.2 Waiver grant (exhibit: K8 / W-1).**
*Trigger:* `reported`/`assessed` knowledge claiming `hard_constraint` — refused `waiver_required` until a waiver is recorded. *Actors/surfaces:* J-2 on S1 (requests), J-3 (grants); the grant is a cross-role negotiation, the only one in v1. *Seam:* the refusal names the missing licence; the re-`POST` carries `waiver {granted_by, justification, granted_at}` inside the object; compile writes the `waives` edge. *Interaction:* S1 shows "waiver required — refer to J-3" with the exposure preview (what the constraint would license: here, north-approach routing); the J-3's grant is captured as the waiver fields, and the waiver chip renders **wherever the constraint bites** thereafter — on the S2 matrix cells, on the S3 why-chain, not only on the knowledge row. *Done looks like:* W-1 visible on every north-approach artefact; deleting the chip anywhere is impossible because it travels with the value (DEC-9 pattern).

**3.4.3 Contest → resolve (exhibit: K12a/K12b).**
*Trigger:* two live objects answering the same question irreconcilably. *Actors/surfaces:* J-2 red cell and allied LNO via S1; the planner experiences it on S2. *Seam:* `POST /knowledge/{id}/contest` → both `contested` (delta); planner's `POST /compile` → `Refusal {contested_knowledge}` naming the pair (G5); `POST /knowledge/{id}/resolve {surviving, note}` → `resolves` edge (delta). *Interaction:* S2's refusal banner names the pair and offers "view contest" — the two objects side by side, provenance chips prominent (source class, owner, single-source), which *is* the adjudication view; S1's Refresh & resolve queue carries the pair until resolution. *Done looks like:* compile succeeds only after the `resolves` edge lands; the resolution note is walkable from every artefact the surviving answer later feeds.

**3.4.4 Staleness acceptance (exhibit: K9 supersedes K5).**
*Trigger:* supersession or validity-window expiry on the scenario clock. *Actors/surfaces:* J-2 writes on S1; the planner decides on S2; S4 shows the fan-out. *Seam:* `supersede` → delta → `/analyse/staleness {changed}` returns exactly the dependent artefacts; nothing recomputes. *Interaction:* S2 shows the flag count and "recompile when ready" — and the planner's three explicit choices are all visible actions: **recompile now** (new stamp; guard greys cross-stamp comparisons), **continue on the flagged stamp** (⚑ persists on every affected verdict — informed acceptance, not ignorance), or **refer back** (ask J-2 for re-validation; a knowledge write, not a planner override). *Done looks like:* flags clear only through explicit recompile; at no point does a verdict silently change under the planner's feet.

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
| Refusal banner | `Refusal` | Reason + offending refs (clickable) + explanation, rendered where the action was attempted; honest-outcome styling, never an error toast (§3.4.1). |
| Stamp badge | `stamp`, engine version | Everywhere a computed thing is shown; click = comparability details. |
| Delta row | `Delta` | Actor · role · op · refs · time. |
| Scenario strip | plan id × scenario set | Three banded bars; the C-thesis glance. |

## 6. Open questions (register candidates)

1. ~~Map/geospatial panel…~~ — **resolved by ASSAY-DEC-31(c)** (batch 4): admitted in the flow view as a Meridian schematic rendered from real `VignetteConfig` region geometry with compiled-world channel overrides overlaid live.
2. ~~Surface shell: literal tabs in one SPA vs role-switch with distinct chrome per surface.~~ — **ratified as ASSAY-DEC-32** (batch 4): four literal role tabs over a shared client store. The "different roles" illusion tabs weaken is recovered honestly by the glow (ASSAY-DEC-34). Built in SPEC-16 (`src/app/*`).
3. Does S3 permit *any* write other than selection (e.g. commitment re-prioritisation), or is that a planner act by definition?
4. Wall-projection mode for S4 (large type, auto-follow feed) as a first-class config.
