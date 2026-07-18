# Sandbox note — Thesis G: is interdependency honestly computable?

**Non-canonical spike.** `experiments/thesis-g/` · 2026-07-18
Probes: concept §6.3 (does thesis G admit any honest v1 slice, or is it horizon-only?)
Adjacent: `docs/research/horizon-forward-derivation.md` (the derivation-direction question sits underneath thesis G); issue #24 (focused dependency-graph view — sibling presentation slice); thesis F (staleness — the honest slice turns out to be a generalisation of it)

This note decides nothing canonical. It gates no build stage, changes no schema,
and asserts no register decision. Its job is to think through what a standalone
demonstrator should *learn* about thesis G before any code, and to record a
provisional verdict on where the honest line falls. If anything here survives
scrutiny it becomes a **flagged** concept §6 candidate for a future batch
(register-first, DEC-2) — never an assertion made from a peer document.

---

## 1. The claim, and why it is the highest false-precision risk

**G · Interdependency:** *systems-perspective (PMESII node-link) knowledge can be
computable* (concept §1). PMESII = the Political / Military / Economic / Social /
Information / Infrastructure systems, represented as a graph of nodes whose states
affect one another across system boundaries. The ambition is to make that graph —
and the propagation of effects across it — into typed, exploitable knowledge, the
way theses A–F made single objects and their verdicts exploitable.

The core keeps it out on purpose. `assay-knowledge-model.md:484`: *"No PMESII
node-link classes — thesis G is horizon (concept §1); admitting shapes for it now
would be false-precision risk with no consumer."* Concept §1 stamps it *"highest
false-precision risk."*

That stamp is not vague nervousness; it names a specific, historically documented
failure mode. **Effects-Based Operations (EBO)** and its analytical engine,
**Operational Net Assessment / System-of-Systems Analysis (ONA / SoSA)**, tried in
the 2000s to make exactly this graph *predictively* computable — model the
adversary as a PMESII system-of-systems, assign nodes and links, and reason
"strike this node, these effects propagate, with this confidence." US Joint Forces
Command formally repudiated the approach (the 2008 Mattis guidance) on the grounds
that it manufactured false certainty about a **complex adaptive system** whose
second- and third-order effects are not reliably predictable and whose links are
not stable numbers. The critique is the exact one ASSAY's constitution is built to
enforce: a number presented as knowledge that no honest source can ground.

So the demonstrator's real research question is **not** "can we draw a PMESII
graph" — the representation is easy, and the core already has most of the
machinery (the trace graph, `traceView.ts`'s `EDGE_ORIENTATION` reading, the
DEC-47 transitive dependency-graph view). The question is: **is there a slice of
interdependency that survives the EBO/ONA critique — that is honestly computable
under ASSAY's banded, no-weights, everything-attributed discipline — and where
exactly does it turn into false precision?**

## 2. Meridian already contains a latent PMESII graph

We do not need to invent a world. The Meridian vignette is dense with
cross-system interdependency stated as *prose* and never typed — which is precisely
the "stated gap" the doctrine crosswalk already admits at JIPOE Step 3
(`assay-doctrine.html:101`: red ORBAT is prose, no HVT/COG shapes, "a deliberate
deferral (thesis G)"). Surfacing that latent graph *is* the test: does real
JIPOE-shaped material admit an honest interdependency read?

Mapping the vignette (§1–§6) onto PMESII systems:

| System | Meridian nodes (from the prose) |
|---|---|
| **Infrastructure** | Port Halcyon + its cranes; the Ledger–Anchor causeway; Carrick airstrip; Ledger quay berths |
| **Military** | Garrison battalion; Carrick Head battery (fire-control radar, K8); FAC squadron + 2 minelayers; air-defence section (K7); mine stocks (K12) |
| **Social** | Civilian population dependent on seaborne resupply (K3, 35–55 k in the port district) |
| **Economic** | Stocks ashore running out; the relief convoy (FE-PACKHORSE) as the resupply flow |
| **Information** | Garrison HQ radio traffic (K13); the intercepted maintenance return behind K8 |
| **Political** | Directorate home government "distracted"; émigré chatter (K10, the refused assumption) |

And the *cross-system edges* are already implied by the scenario's own causal
language — for example:

- **R3 demolishes the port cranes** → Port Halcyon unusable → the relief convoy
  cannot offload → the resupply-dependent population is affected.
  (Infrastructure → Economic → Social.)
- **R3 drops the causeway** → no overland route from a Ledger lodgement (K2's
  causeway-load fact goes moot) → ANVIL's resupply is sea-only; C5 is foreclosed.
  (Infrastructure → Military.)
- **K8 (battery radar) operational** → north approach unsafe → PACKHORSE routing
  and BROOM's sweep sequence change → C1/C2 timing.
  (Military/Information → Military → mission timing.)

Every one of these is a genuine PMESII interdependency, and **none of it is in the
typed model** — the core scores C1–C6 without ever representing "the cranes feed
the population." That is the gap thesis G names. The demonstrator's substrate is
this graph, read-only from the fixtures; we imply nothing about the core storing it.

**One distinction is the intellectual core of the whole spike.** ASSAY's existing
trace graph is *epistemic* — it records **how we came to believe** a value (K9
`supersedes` K5; K12a `contests` K12b; a channel `compiled_into` from a knowledge
object). A PMESII interdependency graph is *ontic* — it records **how the parts of
the world affect each other** (cranes → offload → population). These are different
graphs over different node types, and conflating them is a category error. The open
question is whether the *attribution discipline* that makes the epistemic graph
honest transfers to the ontic one. This note's provisional answer: **the attribution
transfers; the magnitude does not.**

## 3. The honest read — attributed reachability

Claim: the honest, false-precision-proof slice of interdependency is **attributed
reachability / path-surfacing**, and it is thesis F (staleness) generalised from the
epistemic graph to the ontic one.

A reachability read answers exactly one kind of question, qualitatively:

> *"A perturbation at node X **can reach** node Y along this stated path; each link
> on the path was asserted by [source], at [assessment grade]. Here is a path you
> may not have considered."*

It carries:

- **Topology, not magnitude.** "Can reach" / "cannot reach" — a set-membership fact
  about the graph, not a number about how much. No edge weight, no propagation
  coefficient, no confidence scalar. (DEC-19: no numeric weights; DEC-15: a Band has
  no interior — and here we don't even claim a band, we claim reachability.)
- **Full attribution on every edge.** Each interdependency link renders with a
  provenance chip — *who asserts that the cranes feed the population, on what basis*.
  An unattributed link does not render as a fact; it renders as an assertion needing
  an owner (constitution: everything traces to a named owner; G3).
- **Honest dead ends.** Where the stated knowledge runs out, the walk stops and
  *says so* — "no stated dependency beyond here" — rather than inventing a
  continuation. (The G3/G4 no-silent-drop discipline, lifted to this view exactly as
  the DEC-47 graph lifts it.)

The **value** of this read is not prediction — it is **surprise-surfacing**: the
non-obvious path (strike the substation → lose the field hospital's power) that a
planner would not enumerate unaided. That is a real, defensible operational good,
and it needs no number to deliver. Structurally it is the same walk `TraceStore.walk`
already performs under `EDGE_ORIENTATION`; the novelty is only that the nodes are
world features, not knowledge objects, and that each edge must carry its own
provenance.

**Why I expect this to come out honest:** it makes no claim the EBO/ONA critique can
puncture. It never says an effect *will* happen, or *how much*; it says a dependency
*is asserted to exist*, names who asserts it, and shows what it connects to. A
commander can act on "you may not have considered that this strike reaches the
hospital" without the system having laundered a value judgement.

## 4. The trap — weighted propagation

The tempting version, and the one the demonstrator should **build in order to
label**, is **weighted propagation**: give each edge a weight and each node a state,
and propagate:

> *"Demolishing the cranes reduces relief throughput by 60% (confidence 0.7),
> cascading to a 0.4 civilian-shortfall index and a 0.3 political-instability score."*

Every number in that sentence is dishonest in a way ASSAY has already ruled out
elsewhere:

- The **edge weights** are the smuggled scalars DEC-19 forbids — a value judgement
  ("this link matters 0.6-much") dressed as knowledge. No assessed source produces
  them; they are authored and then presented as if derived.
- The **propagation** claims stable, composable, predictable second-/third-order
  effects across a complex adaptive system — the precise ONA/SoSA overreach JFCOM
  repudiated.
- The **confidence figures** are false precision on top of false precision: a
  point probability where even the honest knowledge objects (K6, K8) only ever give
  bands.

This is why the demonstrator's whole design is **two panels over one graph**: the
honest reachability read on the left, the weighted-propagation read on the right —
built, rendered, and then **stamped with a red "FALSE PRECISION — this is the
EBO/ONA failure mode"** banner that explains, per number, *why* it lies. That is not
a strawman; it is ASSAY's own DEC-4 move ("show the scripted/uncomputed thing
visibly labelled, never fake it") lifted from a single value to a whole thesis. You
learn the boundary by seeing the two reads of the *same* graph side by side and
feeling where the second one starts inventing.

## 5. Provisional verdict — where the line falls

Stated as this note's finding, explicitly non-asserting (a flagged candidate, not a
decision):

> **Interdependency is honestly computable as attributed reachability and
> path-surfacing. It is not honestly computable as weighted effect prediction.**
> The honest slice is thesis F generalised to an ontic graph; the dishonest slice is
> EBO/ONA revived. The boundary is *magnitude* — the exact point where "this link is
> asserted to exist" becomes "this link transmits this much effect."

Three consequences worth recording:

1. **Thesis G is not wholly horizon.** Concept §6.3 asks whether it admits *any*
   honest v1 slice; this note's provisional answer is **yes — the reachability slice**
   — which is a smaller and more defensible claim than the concept's blanket "horizon;
   highest false-precision risk" and would, if it survives, refine that line.
2. **The honest slice needs almost no new machinery** — it is a projection over a
   graph the core already knows how to walk. What it needs is a *different node type*
   (world features) and *per-edge provenance*, both of which can live entirely in the
   sandbox. This is why it is safe to prototype without touching the core.
3. **The magnitude boundary is testable, not a matter of taste.** On Meridian you can
   demonstrate it: removing K3 (the civil-density band) leaves every C3 verdict
   identical (`tests/k3-trace.test.ts`, the SPEC-18/DEC-35 honest gap) — the core
   *already* refuses to let civil-harm magnitude drive a verdict. A weighted-PMESII
   panel that made "55 k vs 5 k" change an output would be doing exactly the thing
   DEC-35 declined. The boundary this note draws is the same one the core already
   holds; thesis G just states it for a whole graph.

## 6. Honesty invariants the demonstrator must not break

Even a sandbox that exists to explore a horizon thesis must not model dishonesty as
if it were fine. The reachability panel must keep:

- **No scalar anywhere** (DEC-19 / banded honesty). Reachability is set membership;
  no weights, no confidences, no propagation coefficients. If the panel ever needs a
  number to say something, that something is out of scope.
- **Every edge attributed** (G3 / constitution). An interdependency link with no
  named asserter renders as an open assertion, never as a fact.
- **Honest dead ends and stated coverage** (G4-shaped). The walk stops where stated
  knowledge stops and says so; the graph declares which cross-system links it does
  *not* model rather than implying completeness. (This is the same "no silent drop"
  the horizon-forward note §2.5 reaches for at the generator level.)
- **The trap is labelled, never hidden** (DEC-4). The weighted panel exists only as a
  rendered-and-labelled counter-example; it is never presented as a computed result,
  and it writes nothing.
- **No core contamination** (this experiment's own rule). No schema class, no import
  into `src/`, no register assertion. Fixture reads are one-way.

If the reachability read cannot be delivered under all five, it is not honest and the
verdict in §5 is wrong — the same falsification test SPEC-09 applied to weighted CSP
and note 06 applied to minimax regret.

## 7. What the demonstrator would show (feeds the prototype)

A single self-contained, offline HTML page (the band-pill embed pattern — no
bundler, no network, no `src/` import), one screen, the same Meridian-derived PMESII
graph read two ways:

- **Left — honest reachability.** Pick a node (e.g. *R3 demolishes the port cranes*).
  The graph highlights what that perturbation *can reach*, hop by hop, along stated
  links, each edge carrying a provenance chip. Output is qualitative: *can reach*,
  *asserted by*, *path you may not have considered*, *no stated dependency beyond
  here*. No magnitude.
- **Right — the labelled trap.** The same graph, same perturbation, edges weighted
  and nodes propagating a fabricated "shortfall index", under a red **FALSE
  PRECISION — EBO/ONA failure mode** banner annotating each invented number.

The learning artifact is this note's §5 verdict made *visceral* — you see the two
reads of one graph and feel the boundary. If it holds up under a look, the
reachability slice graduates to a flagged concept §6 candidate.

## 8. Feedback path (register-first, asserts nothing)

Nothing here touches canon. If the reachability verdict survives:

- Record a **candidate** in concept §6 (a PMESII reachability slice as thesis G's
  honest v1), flagged, awaiting a future register batch (DEC-2).
- Note that it would *refine* the concept §1 "horizon; highest false-precision risk"
  line for thesis G — narrowing "horizon-only" to "horizon for magnitude; buildable
  for reachability."
- Ratification, and any move into `src/`/`schema/`, is a future research-first slice
  (DEC-11) behind its own *canonical* note — this sandbox note is not that note.

## Sources

**Doctrine / history.** JP 2-01.3 (2014) ch. II — JIPOE step 3 (evaluate the
adversary: ORBAT, capabilities, HVT, COG). JP 5-0 — operational design.
Effects-Based Operations and Operational Net Assessment / System-of-Systems
Analysis, and the US Joint Forces Command repudiation (Mattis, "Assessment of
Effects Based Operations", 2008) — the documented false-precision failure of
predictive PMESII node-link modelling; the founding cautionary tale for thesis G.
Complex-adaptive-systems critique of predictive effects modelling (the second-/
third-order-effect instability that motivates the reachability-not-magnitude line).

**ASSAY canon (read-only).** `assay-concept.md` §1 (thesis catalogue G), §6.3 (the
open question this note probes); `assay-knowledge-model.md` §12 / :484 (PMESII shapes
kept out deliberately); `assay-vignette.md` §1–§6 (the latent PMESII graph);
`assay-doctrine.html` (JIPOE Step 3 stated gap); register DEC-2 (register-first),
DEC-4 (label, never fake), DEC-11 (research-first), DEC-15 (banded, no interior),
DEC-19 (no numeric weights), DEC-35 (civil harm stays geometric, never quantified);
`docs/research/horizon-forward-derivation.md` (§2.5 the sibling "no silent drop"
discipline); `tests/k3-trace.test.ts` (the magnitude boundary already held on
Meridian).
