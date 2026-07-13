# ASSAY — System-Flow Infographic: Specification

Status: draft for review · v0.2 · 2026-07-13 · candidate addition to the canonical set · seeds a spec-kit SPEC (SPEC-14 site/gallery neighbourhood) when scheduled · v0.2 adds the implementation-facing sections (§7 interaction contract, §8 view-state & tour script, §9 acceptance intent, §10 implementation notes & build-stage dependencies) so the proposal can be picked up cold in a later session
Authority: this document **originates nothing**. It projects ASSAY-DEC-5 (surfaces are config-declared projections; writes are stamped deltas), DEC-9/15 (banded honesty), DEC-7 (narratives are configurations), and the §G invariants (seam contract §G) into a stakeholder-facing explainer. The one behaviour it proposes that is *not* already decided — live/auto recompute in this view — is recorded as a **flagged register candidate** (concept §6, item 15), never asserted here.
Companions: `assay-flow-infographic-wireframes.html` (the sketches below, rendered on Meridian data in the frozen D+2/step-8 tableau); `assay-walkthrough.md` (the six-beat heartbeat this view animates); `assay-ui-design.md` §4 (S4 Bridge, of which this is the grown-up form); `assay-comms-plan.md` (the public site and SME checkpoints this feeds).

---

## 0. Why this document exists

Stakeholders — SMEs, commanders, the REMIT design team, and non-specialist observers — need to *see* the mechanics that the canonical set describes in prose: how a question becomes a typed object, how one role's write becomes another role's signal, and where the honesty machinery bites. ASSAY already models all of this. The **walkthrough** plays it as text, the **S4 Bridge** surface watches it as an event feed, and the **trace graph** holds every connector. What is missing is a single view that renders the *flow* — objects, connectors, gates, and consequences — at a register the audience can dial from "one sentence" to "the object and its edges."

This is not a new capability. It is a projection: the flow infographic **arranges what the seam already offers and computes nothing of its own** (ui-design principle 4). Its value is that it makes the demonstrator's honesty claims legible to people who will never read the seam contract.

## 1. Objectives (by audience)

The infographic serves four audiences through **one artefact with three zoom layers** (§4.1). Success is defined per audience:

| Audience | Leaves understanding | Success signal |
|---|---|---|
| **SMEs (J-2/J-3)** | The gates read as *discipline*, not obstruction — a refusal is an honest outcome, a waiver travels with the value, a contest blocks compile. | An SME watching K10 refuse and K12 block compile calls it *rigour*, not *a bug* (comms-plan §12 checkpoint question). |
| **Commanders / decision-makers** | *Why the least-worst argument can be trusted*: every verdict is banded, stamped, and walks back to a named owner. | A commander can point at a sacrificed commitment and follow it to the knowledge and owner behind it, unaided. |
| **REMIT design team / technical** | The object model made explicit: seven typed connectors, six gates, the seam between store/compile/plan/analyse. | A REMIT reviewer can map each connector and gate to its register decision. |
| **Mixed / non-specialist** | The one-sentence claim: assessed answers become typed objects that planning machinery uses *honestly* — without inventing precision. | A funder repeats the loop — "changed answer → knows exactly what it invalidates → human decides" — back correctly. |

The through-line for all four: **watch a mock operator inject or revise data, and watch the honest consequence flow** — instantly for the fan-out, visibly-and-stamped for the recompute, never silently.

## 2. Non-goals and honesty constraints (normative)

This view is bound by the same discipline as every other surface. The following are acceptance criteria, not style notes:

1. **Bands stay banded (G2/DEC-9).** No assessed scalar renders bare, even in a diagram node. The shipped **band pill** and **provenance chip** are reused, not re-drawn — a diagram that shows `1.1–1.8 m` without its provenance chip is a defect.
2. **Recompute is automatic *and* attributable — never silent.** The fan-out (which artefacts a change invalidated) is instant. The recompute that turns flags into new verdicts may fire automatically in this view, but it is **always stamped and always lands a delta row**: the stamp badge flips (`7f3a…c91` → `9b2e…44a`), the delta feed gains a row, a gate pulse names the trigger. The difference between *fast* and *silent* is attribution, and attribution is mandatory. *(This auto-recompute behaviour differs from S2's deliberate "recompile when ready" and is therefore a flagged register candidate — §6, item 15; it is not asserted as decided.)*
3. **Gates are never bulldozed.** Auto-recompute only *triggers* a compile; the compile still refuses on a contested pair (G5), still lints encoding (K10), still demands the waiver (K8/W-1). A gate firing is the best thing in the piece — it is surfaced, not suppressed.
4. **Real seam, not animation.** Sandbox consequences are computed by the seam (the in-browser mock is honestly real for scoring — README, seam §G). No hand-tweened numbers; determinism (G1, explicit seeds) makes the sandbox repeatable.
5. **This view arranges; it never computes (DEC-5/ui-design §1.4).** Every node and edge is a projection of a stored object or a seam response. A rendering that implies a derivation the seam does not offer is wrong.
6. **Frozen identifiers only (vignette §8).** K*, C*, R*, FE-*, P*, W-1, stamps, and delta sequence numbers render exactly as the vignette freezes them; drift is a defect under batch propagation.

Explicit non-goals: it is **not** a live operational tool, **not** a fifth role surface competing with S1–S4 (it is S4's explainer form), and it does **not** author new vignette content.

## 3. The visual vocabulary — objects, connectors, gates, actors

The infographic is legible because ASSAY's discipline is concrete. Four element classes:

### 3.1 Objects (nodes)
`KnowledgeObject` → `Channel`/`ScenarioCOA` (compiled) → `CommitmentVerdict`/`PlanScore` → `SelectionRationale`. Each node carries its type glyph, its stamp where computed, and its band pill where it holds an assessed value.

### 3.2 Connectors (typed edges — the seven that make claims walkable)
`supersedes` · `contests` · `resolves` · `compiled_into` · `scored_from` · `cited_in` · `waives`. Rendered as typed, directional arrows; every connector is walkable **both** directions and terminates in a named owner (G3). A dead-end chain renders as a visible error state, never hidden.

### 3.3 Gates (where flow is checked, refused, or paused — glyphs on the flow)

| Gate | Fires when | Exhibit | Invariant |
|---|---|---|---|
| **Encoding lint** | a bad answer is saved (`assessed·low` claiming a hard constraint) | K10 → `encoding_violation` | DEC-9/15 |
| **Waiver gate** | reported/assessed knowledge claims a hard constraint | K8 / W-1 → `waiver_required` | DEC-9 |
| **Contest gate** | two live objects answer one question irreconcilably | K12a/K12b → compile refuses `contested_knowledge` | **G5** |
| **Comparability guard** | artefacts on different stamps are placed side by side | `7f3a…` vs `9b2e…` → grey, not lie | **G1** |
| **Staleness pause** | an input is superseded / expires | K9 supersedes K5 → flags, no silent change | thesis F |
| **Least-worst gate** | a commitment set is infeasible | R3m → RelaxationReport, never empty | **G4** |

### 3.4 Actors (the mock operators who inject writes)
J-2 (S1), Planner (S2), Commander (S3) — each write is a stamped delta authored by a named role. The Bridge (S4) never writes; it watches. In the sandbox the viewer *becomes* one of these operators for a bounded set of actions (§4.3).

## 4. Requirements

### 4.1 Three zoom layers (progressive disclosure)
One artefact, viewer- or tour-controlled depth — this is how one view serves all four audiences:

- **L0 · Orientation** — the loop in one sentence and one diagram; no doctrine. (Non-specialist entry.)
- **L1 · Heartbeat** — the six-beat event flow animated: actors inject writes, deltas fan out, gates fire, consequences land. The star layer. (Commanders, SMEs.)
- **L2 · Object/trace detail** — drill into any node → its typed object, its edges, its stamp, the backward chain to a named owner. This is S4's existing trace drawer. (REMIT/technical.)

The zoom control **is** the audience switch: one view, dialled — not four infographics.

### 4.2 Tour mode (the scripted spine)
A playback of the canonical heartbeat (walkthrough beats 1–6), deterministic and matching the oracle cases (vignette §9) so it cannot drift. Each beat pauses on its gate moment (supersession flags, the K12 contest refusal, the R3m relaxation report). Tour narration is the comms-authoring layer; the flow beneath it is the real seam.

### 4.3 Sandbox mode (bounded injection)
The viewer drives a **bounded action palette** against the real seam and watches real consequences:

- **Toggle excursions** R1 / R2 / R3 / R3m (compile-time channel overrides) → re-score → verdicts and per-scenario strips update, stamped.
- **Contest / resolve K12** → compile refuses (G5) / succeeds after `resolves`.
- **Supersede K5 → K9** → staleness fan-out flags exactly the K5-dependent artefacts (P1·C2, P2·C1, P2·C2).
- **Grant / withhold W-1** → the waiver chip appears/disappears wherever the north-approach constraint bites.

Every sandbox action lands a delta, flips the relevant stamp, and is undoable by re-seeding to the frozen tableau. The palette is **bounded on purpose** — free-form authoring would wander into states the vignette does not define (drift).

### 4.4 Recompute behaviour (per §2.2)
Live fan-out (instant, unstamped — it is a *read*, `/analyse/staleness`) is separated from recompute (automatic in this view, but stamped, delta-logged, and gate-policed). A visible half-second gate pulse names the trigger. The truly-silent "you-are-the-optimiser" variant is deferred (§6 / candidate, for an SME to react to before it hardens).

### 4.5 Component reuse
Reuse the shipped shared library (ui-design §5), do not re-implement: **band pill, provenance chip, verdict chip, trace drawer, stamp badge, delta row, scenario strip, refusal banner**. This keeps a single source of truth and means the infographic inherits banded honesty for free.

### 4.6 Delivery — one component, two homes
Build the flow view **once** as a self-contained, inline-everything component (the embed pipeline's constraint — `scripts/build-embeds.ts`, the band-pill pattern-setter), then render it:
- **in-app** as an **S4 "systems-map" mode** (the wall-projection open question, ui-design §6.4, resolved into a first-class mode);
- **on the public site** as a standalone Pages explainer (comms plan).

Same code, embedded twice; single source of truth. Per comms-plan §1.6, the artefact is **copied into the site *and* linked from a navigable Home-page card** — reviewers reach it from the per-PR preview by clicking, never by typing a URL. (The wireframe companion already ships this way via `scripts/build-site.ts`.)

### 4.7 Determinism & data source
All state derives from the frozen Meridian tableau (D+2, step 8) via the seam; all randomness flows from explicit seeds (G1). Tour and sandbox share one canvas and one store.

## 5. Wireframes

See `assay-flow-infographic-wireframes.html` — the L1 heartbeat canvas with the connector/gate legend, a gate-firing state (the K12 contest → compile refusal), and an L2 drill-in trace chain, rendered on the frozen tableau in the house component style and bound by vignette §8. The wireframe is itself self-contained, walking the §4.6 embed constraint.

## 6. Fit in the wider application context

- **S4 Bridge is the parent.** This view is S4 grown into an explainer; it does not add a fifth role. The delta feed and live trace chain are S4's existing read paths (ui-design §3.1).
- **The walkthrough is the scripted spine.** Tour mode animates `assay-walkthrough.md` beat-for-beat; if a beat cannot be shown with the seam as written, the *contract* is the defect (walkthrough §0 discipline rule), not the view.
- **The comms site is a home.** The public embed and the SME-checkpoint framing are comms-authoring work (concept §6.14 candidate — communications are projections of shipped work, not spec-kit features); the interactive view itself is a build slice.
- **Process (research-first, DEC-11).** The interactive view is a surface with seam calls, so implementation opens with a research note in `docs/research/` (interaction/animation approach; the fan-out vs recompute distinction; the auto-recompute honesty question) before code — no exceptions. This document is the *proposal*; it seeds the spec-kit SPEC (SPEC-14 site/gallery neighbourhood, or its own SPEC-## when scheduled) but is not itself that SPEC.
- **Register candidates (this document asserts none of these — they are logged, flagged, in concept §6 item 15).**
  1. **Live/auto recompute in the flow view**, attribution-visible (differs from S2's "recompile when ready").
  2. **Viewer-driven writes from a mock operator** in the sandbox (all four surfaces are currently read projections; S4 especially watches, never writes).
  3. **The map/geospatial panel** (ui-design §6.1 open question) — the flow view is a natural home for the grid/causeway/strait; pulling it in is a live decision, not settled here.
  4. **A truly-silent teaching toggle** ("you are the optimiser") — deferred for an SME to react to before it hardens.

## 7. Interaction contract — seam calls and consequences

Every interaction is a call to the in-browser seam (the mock services under `src/`, which *are* the seam — README) followed by a projection of the result. No consequence is hand-authored (§2.4/2.5). Real symbols, so a future session can wire directly:

**Writes (sandbox actions and tour beats):**

| Action | Seam call(s) | Result | View consequence |
|---|---|---|---|
| Toggle COA excursion R1→R2/R3/R3m | `CompileService.compile({knowledge, scenario, config, engine_version})` → `HandfulService.handful({world, seed:42})` (or `ScoreService.score` for a single plan) | new `world` stamp + re-scored verdicts | scenario strip + verdict chips update; **stamp badge flips**; delta row appended |
| Contest K12 | `KnowledgeService.contest('K12a','K12b')`, then the planner's `CompileService.compile(…)` | `ContestResult` (both `contested`), then `Refusal{reason:'contested_knowledge', offending:[K12a,K12b]}` | refusal banner renders **where the compile action was** (G5); delta row; **no new world stamp** |
| Resolve K12 | `KnowledgeService.resolve('K12b', note)`, then `compile` | `resolves` edge; `CompileSuccess` | banner clears; stamp flips to `9b2e…44a`; delta row |
| Supersede K5→K9 | `KnowledgeService.supersede(K9, 'K5')`; then staleness fan-out | `SupersedeResult{ref, stale}`; *(staleness — see §10 dependency)* | ⚑ flags on affected verdicts; delta row |
| Grant / withhold W-1 | `KnowledgeService.create`/`supersede` with/without `waiver`; `checkEncoding` gates; compile writes `waives` | `Refusal{reason:'waiver_required'}` when withheld; `waives` edge when granted | waiver chip appears/disappears **wherever the constraint bites** (matrix cells, why-chain, not only the K8 row); refusal when withheld |
| Relax under R3m | `RelaxService.relax({world, commitments:[C1…C6], seed})` | `RelaxSuccess` — 3 candidates, each `sacrificed` non-empty (G4) | three least-worst cards; `cited_in` edges; `tie_break` shown |
| Select P2 | `POST /select` equivalent (seam §11) — writes `SelectionRationale` + `cited_in` edges | `{rationale}` | rationale node; S1 exposure re-prioritises K8 |

**Reads (live projections, never a write):**

| Panel | Seam call | Result | Render |
|---|---|---|---|
| Delta feed (S4) | `DeltaLog` since `seq` | `Delta[]` | delta rows (actor · role · op · refs) |
| Trace drawer (L2) | `TraceStore.chain(ref, 'backward')` | `TraceChain` | the L2 chain, terminating in a named owner (G3) |
| Exposure strip (S1) | `KnowledgeService.exposure(id)` | `{chains}` | which of my objects sit under the live handful |
| Staleness fan-out | *(staleness analysis — §10 dependency)* | `{invalidated, chains}` | exactly the dependent artefacts flagged |

## 8. View-state model & tour script

**State.** The view holds one small, explicit object; the render is a pure function of `(store, view-state)` — this *is* ui-design principle 4 (surfaces arrange, never compute):

```
{ zoom: 'L0'|'L1'|'L2',
  mode: 'tour'|'sandbox',
  tour_step: 0..6,                     // tour only
  sandbox: { coa, contested, superseded, waiver }  // each maps 1:1 to a seam write
}
```

Sandbox actions are seam writes against a store seeded to the frozen tableau; **undo = re-seed the store** (deterministic, G1). Tour steps are pre-set state snapshots that replay the same writes in the canonical order.

**Tour beat script** (the ordered steps L1 plays; each maps to a walkthrough beat and is oracle-consistent, vignette §9):

| Step | Beat (walkthrough) | Shown |
|---|---|---|
| 0 | §1 opening state | D+2, step 8 · world `7f3a…c91` · handful P1–P4 |
| 1 | §2 beat 1 | supersede K5→K9 → fan-out flags **P1·C2, P2·C1, P2·C2** |
| 2 | §3 beat 2 (contest) | contest K12 → planner compile **blocked**, refusal `contested_knowledge` |
| 3 | §3 beat 2 (resolve) | resolve K12→K12b → `resolves` edge |
| 4 | §4 beat 3 | recompile → world `9b2e…44a`; handful re-scored, stamped |
| 5 | §5 beat 4 | relax under R3m → 3 least-worst cards, sacrifice **C4 · C3 · C2** |
| 6 | §6–7 beats 5–6 | select P2 → `SelectionRationale`; exposure raises **K8**'s verification priority |

## 9. Acceptance intent (feeds the spec-kit acceptance scenarios)

Testable given/when/then intent; these become the spec-kit spec's acceptance scenarios when the SPEC is written (this proposal is not itself that SPEC — §6). Each asserts one honesty constraint or interaction:

- **AS-1 · banded honesty (G2).** *Given* any node holding an assessed value, *then* it renders a band pill welded to its provenance chip — no bare scalar anywhere in the DOM.
- **AS-2 · recompute attribution (§2.2).** *When* a sandbox recompute fires, *then* a new delta row exists **and** the stamp badge changed; a verdict never changes without both.
- **AS-3 · contest gate (G5).** *Given* K12 contested, *when* compile is attempted, *then* a refusal banner names the pair and **no** new world stamp appears.
- **AS-4 · staleness fan-out (F).** *When* K5 is superseded, *then* exactly `{P1·C2, P2·C1, P2·C2}` flag — nothing else.
- **AS-5 · waiver travel (DEC-9).** *When* W-1 is granted, *then* the waiver chip renders on **every** north-approach artefact; *when* withheld, K8 refuses `waiver_required`.
- **AS-6 · least-worst (G4).** *When* relax runs under R3m, *then* 3 cards return, each `sacrificed` non-empty, none empty, tie-break stated.
- **AS-7 · comparability (G1).** *Given* two stamps, *when* placed side by side, *then* the cross-stamp comparison greys rather than renders a value.
- **AS-8 · zoom register.** *At L0* no doctrinal node is shown; *at L2* every node opens a backward chain terminating in a named owner.
- **AS-9 · determinism (G1).** Same seed + same tableau ⇒ byte-identical handful/verdicts across reloads.
- **AS-10 · undo.** Re-seeding returns the store to the frozen tableau exactly.
- **AS-11 · self-containment.** The embed loads and functions with **zero external network requests** (embed constraint, §4.6).

## 10. Implementation notes & build-stage dependencies

- **Self-contained (embed constraint).** Inline all CSS/JS; no external fetches at runtime. The wireframe's one external reference (the shared web font) must be inlined or replaced with a system-font stack in the built embed (offline + CSP).
- **Reuse, don't re-implement.** Pull the shipped components from `src/components/*` — `bandPill`, `provenanceChip`, `refusalBanner`, `channelTrace`, `s2Matrix`, `s3Cards`, `handfulStrip` — so banded honesty is inherited, not re-litigated.
- **Seam access.** Call the in-browser services directly: `CompileService`, `ScoreService`, `HandfulService`, `RelaxService`, `KnowledgeService`, plus `DeltaLog` / `TraceStore` / `ObjectStore`. The mock *is* the seam.
- **Build-stage dependencies (honest gating — what is buildable today vs. what waits):**
  - **Buildable now (Stages 0–4, `done`):** compile · score · handful · relax · knowledge writes (create/supersede/contest/resolve/exposure) · deltas · trace · store. The **tour** and most of the **sandbox** (COA toggle, contest/resolve, waiver, relax) are buildable against these today.
  - **Not yet built:** the **staleness fan-out** (`/analyse/staleness`, thesis F) is **Stage 6 · Analysis loops (`not-started`)**; full **scenario-robustness** score-strip fidelity leans on **Stage 5 (`not-started`)**. Until they land: the *tour* shows the walkthrough's known, oracle-consistent results (scripted); the *computed* sandbox variants for supersede-fan-out and the full R-strip **gate on Stages 5–6**. State this limit visibly in the view — a scripted result must not masquerade as a computed one.
  - **Stage placement.** The flow view proper is **Stage 7 · Surfaces & narratives** territory; it must not claim `building`/`done` in `docs/status.yml` before its research note publishes (DEC-11, enforced by `build-site.ts`).
- **Two homes, one component.** S4 mode (in-app) + Pages embed, wired into `build-site.ts` and linked from a Home-page card (§4.6, comms §1.6). The wireframe already ships this way.

## 11. Definition of done (proposal-stage)

- This spec + its wireframe companion reviewed. The four register candidates (concept §6.15) proceed **under delegated authority** (decided 2026-07-13, the §6.12/6.13 pattern): the build slice may implement against them and **ratify on landing** rather than blocking on a prior register batch — DEC-2's established escape hatch, which permits *building* against a flagged candidate but not *asserting* it as settled.
- **Research-first (DEC-11) is not waived by that delegation.** A `docs/research/` note lands **before** the build slice opens — the interaction/animation approach, the fan-out-vs-recompute distinction, and the auto-recompute honesty question — exactly as notes `01`/`02` preceded the schema changes they carried. This is a hard gate; a missing note is the gate, not a formality.
- On build: home-page-currency step (concept §6.12 candidate) — assess whether shipping the flow view moves any thesis from *planned* to *demonstrated* and re-render the public site accordingly, under banded honesty.
- On landing: record the ratifying entries for the §6.15 candidates in the next register batch (ratify-after).
