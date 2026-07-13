# ASSAY — System-Flow Infographic: Specification

Status: draft for review · v0.1 · 2026-07-13 · candidate addition to the canonical set · seeds a spec-kit SPEC (SPEC-14 site/gallery neighbourhood) when scheduled
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

Same code, embedded twice; single source of truth.

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

## 7. Definition of done (proposal-stage)

- This spec + its wireframe companion reviewed; the four register candidates ratified (or amended) in a register batch before implementation.
- A research note lands (DEC-11) before the build slice opens.
- On build: home-page-currency step (concept §6.12 candidate) — assess whether shipping the flow view moves any thesis from *planned* to *demonstrated* and re-render the public site accordingly, under banded honesty.
