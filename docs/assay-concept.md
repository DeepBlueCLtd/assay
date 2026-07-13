# ASSAY — Concept

**Assessment Semantics & Scenario Analysis**
Status: canonical · v0.3 · 2026-07-12 · retitled from `assay-scaffold.md` per §4 (batch 2); §6 candidates 6–11 ratified as ASSAY-DEC-22…27 (batch 3)
Regime: full register discipline (ASSAY-DEC-2). The register has been split out to `assay-register.md`, which is now the sole home of decisions; this document carries purpose, theses, narratives, and principles.

---

## 1. Identity & purpose

ASSAY is a software demonstrator exploring the application of optimisation techniques to command-and-control planning, using the JIPOE/IPOE process family (JP 2-01.3, ATP 2-01.3, AIntP-17) as its doctrinal anchor. Its central premise: **the questions and answers collated during intelligence preparation can be made objective, quantifiable, typed objects — and exploited by planning machinery honestly**, i.e. without laundering judgement into false precision.

ASSAY is a **separate application from REMIT** — a deliberate re-derivation of REMIT's principles against a different problem domain (intelligence-fed COA analysis rather than requirement-to-plan tasking). Where a principle survives the re-derivation it is validated as general; where it doesn't, that is a finding. Findings flow back to REMIT only as candidate register entries, never as silent coupling (ASSAY-DEC-3).

### What ASSAY demonstrates

One coherent environment — a shared backend and a small set of role surfaces — within which a catalogue of theses can be *explored* rather than separately built (ASSAY-DEC-7):

| Thesis | Claim |
|---|---|
| A · Pipeline | JIPOE knowledge can flow into an optimiser honestly (typed encoding + compile path) |
| B · Least-worst | When commitments conflict, minimal relaxation produces a defensible plan-as-argument |
| C · Robustness | Scoring friendly plans across the adversary COA set beats optimising against most-likely |
| D · Collection | Optimisation can tell you where to look (COA-hypothesis discrimination) |
| E · Sensitivity/deception | The system can identify which beliefs the decision is leaning on |
| F · Staleness | A changed answer identifies exactly what it invalidates |
| G · Interdependency | Systems-perspective (PMESII node-link) knowledge can be computable — **horizon; highest false-precision risk** |
| H · Reactive red | A responding adversary changes which plans survive — **horizon; deferred with same rationale as REMIT DEC-60** |

### Demonstration narratives (audiences)

The build shares one spine; the demo narrative is a configuration choice:

1. **J-2 narrative** — JIPOE made accountable and self-prioritising (theses D, E, F lead)
2. **Planner narrative** — COA comparison made honest (C, B lead)
3. **Commander narrative** — the least-worst argument, banded, traceable (B + argument surface)
4. **Bridge narrative** — one object model across the J-2/J-3 seam (A + traceability graph)
5. **REMIT narrative** — principles re-examination for the design team

## 2. Decision register (pointer)

Decisions live in `assay-register.md` — the sole home of ASSAY-DEC entries (ASSAY-DEC-2). The founding batch (ASSAY-DEC-1 … 11, ratified 2026-07-11) was carried in this section until the register was split out (delivery plan slice D1); it now lives there verbatim, joined by batch 2 (ASSAY-DEC-12 … 21, the canonical-set authoring session). Register-first is in force: nothing in this document originates a decision.

## 3. Architecture (summary)

Authoritative detail lives in the seam contract and knowledge model documents; this section is orientation only.

```
Surfaces (config-declared projections; stamped-delta writes)
  J-2 workbench · Planner workbench · Commander/argument view · Bridge/trace view
──────────────────────── seam contract (REST shapes) ────────────────────────
  Store        content-addressed objects: KnowledgeObject, Commitment,
               ScenarioCOA, CompiledWorld, Plan, Rationale + TraceGraph
  Compile      knowledge → world channels · scenario excursions · commitment sets
               (deterministic, stamped with source knowledge hash-set)
  Plan/Score   generate → score → organise into banded handful;
               score() independently callable (ASSAY-DEC-10)
  Analyse      sensitivity · discrimination · staleness · relaxation
               (scorer-in-a-loop + trace walks)
```

v1 implementation: all services in-browser mocks behind the contract (ASSAY-DEC-4); small grid world (~60×60 cells, 14-day horizon, coarse timestep); deterministic seeds throughout.

## 4. Canonical document set

Target set (peers, batch-propagated):

| Document | Role | Status |
|---|---|---|
| `assay-register.md` | decision register | authored; sole home of decisions |
| `assay-concept.md` | purpose, theses, narratives, principles | this document (retitled from `assay-scaffold.md`) |
| `assay-architecture.md` | services, surfaces, trace graph, invariants | **deferred** (ASSAY-DEC-13); orientation in §3, invariants in seam contract §G |
| `assay-knowledge-model.md` | LinkML schema + commentary | authored, draft for review |
| `assay-seam-contract.md` | REST shapes and semantics | authored, draft for review |
| `assay-vignette.md` | the Meridian Archipelago scenario | authored, draft for review |
| `assay-ui-design.md` | surfaces, information flows, shared components | authored, draft for review |
| `assay-walkthrough.md` | one heartbeat end-to-end on Meridian; standing contract validation | canonical (ASSAY-DEC-22); §0 contract-defect rule binds |
| `assay-findings.md` | findings ledger — thesis states, transition criteria, re-derivation verdicts, REMIT candidates | canonical (ASSAY-DEC-26); sole home of findings |
| `assay-build-plan.md` | stage sequencing, gates, per-stage research prompts | authored, draft for review |
| `assay-delivery-plan.md` | spec slicing, dependency graph, parallel lanes | authored, draft for review |
| `assay-comms-plan.md` | public GitHub Pages site | authored, draft for review |

## 5. Repository & working conventions

- **Repo**: new GitHub repository `assay`; document home in `docs/`; Claude Code as development environment (REMIT DEC-58 pattern, re-adopted not inherited).
- **Branching**: branch-per-batch (`docs/<batch-name>`, `feat/<slice-name>`).
- **Edits**: guarded patch scripts (assert-each-replacement-lands-once) for targeted document updates.
- **Diagrams**: Mermaid with explicitly pinned theme variables *and* per-subgraph `style` statements; TB orientation preferred.
- **Milestones**: ntfy.sh/iancc2025.
- **Sessions**: structured interview format; one fork per turn; register-first in force since batch 2.
- **Research notes** (ASSAY-DEC-11): `docs/research/<stage>-<topic>.md`; one page preferred; must cite sources and end with "what we will do differently". Stage implementation does not start until its note exists.

## 6. Open questions (candidates for the next register batch)

1. ~~Build order of the spine~~ — resolved: the build plan's "lap then depth" shape (seven stages, spine-complete gate) is the decided order.
2. Handful generation strategy axes for this domain (REMIT's time/exposure/robustness/completeness axes do not transfer unexamined).
3. Whether thesis G (interdependency) admits *any* honest v1 slice, or is horizon-only.
4. Surface implementation: literal tabs in one SPA vs routed micro-frontends over the shared store.
5. Vignette authoring format: hand-authored JSON fixtures vs a light authoring surface.
6. ~~Whether `assay-walkthrough.md` joins the canonical set…~~ — **ratified 2026-07-12 as ASSAY-DEC-22** (batch 3): it joins the canonical set and its §0 contract-defect rule binds.
7. ~~Per-stage **demo moments** as a standing exit requirement…~~ — **ratified as ASSAY-DEC-23**: every stage exit is paired with a user-observable twin and a scripted two-minute demonstration from the running build.
8. ~~Ratifying seam contract v0.2's additions…~~ — **ratified as ASSAY-DEC-24**: `POST /select`, `GET /objects?class=`, and delta publication on all knowledge writes are register content, no longer resting on DEC-5 by implication.
9. ~~**G6 — propagation honesty**…~~ — **ratified as ASSAY-DEC-25**: G6 is a standing seam invariant alongside G1–G5; oracle cases in vignette §9.
10. ~~Whether `assay-findings.md` joins the canonical set…~~ — **ratified as ASSAY-DEC-26**: it joins the canonical set as the sole home of findings; a finding may be cited for what an exploration concluded, never as the origin of a decision.
11. ~~SME evaluation checkpoints as standing gates…~~ — **ratified as ASSAY-DEC-27**: no thesis concludes without at least one checkpoint having seen it; reactions land in the findings ledger within a day.
12. **Home-page currency (plans → achievements).** The comms plan ties public-site progress to *stage gates* (§9). But a single SPEC can turn a planned capability into a demonstrated one *within* a stage, and the public home page (`docs/assay-home.html`) should re-render that plan as an achievement when it does — not wait for the whole stage to close. **Candidate:** each build specification carries, as part of its definition of "done," a **home-page-currency step** — assess whether the slice moves a thesis or stage from planned to demonstrated and, if so, update the home page's objectives/progress accordingly, under the same banded-honesty guardrail the site already inherits (nothing shown as done that the repository does not contain; a stage cannot show "building" before its research note is published). This makes progress reporting part of building at *spec* granularity, mirroring the ownership rule the comms plan already states at stage granularity (§9). Wired provisionally into the spec-kit tasks template and comms plan §9 pending this batch's ratification — the same "build against the flagged candidate under delegated authority" pattern by which the DEC-16 confidence→band-width floor and the sparse-channel schema entered on landing. On ratification, batch-propagates to the delivery plan §1 ("How we deliver") and the build/comms cadence. *Flagged candidate — not yet ratified.*
13. **[CANDIDATE — flagged for next register batch]** **Sparse channel representation.** Research note `02-compile.md` (the Stage-2 DEC-11 gate) decides, from the Stage-0 benchmark (a dense CompiledWorld is ~1.2M cells → 84.9 MB, ~19.4 s serialise+hash per recompile — not viable even in the mock) and from ATP 2-01.3 MCOO doctrine (overlays record *deviations*, not per-cell attributes), that a `Channel` is a **`default: Band` plus a sparse set of named, optionally time-boxed `RegionOverride`s**, with `RegionName → cell set` geometry held once in a `VignetteConfig` object and region→cell materialisation a lazy, unstored, score-time function. This **retires dense `Channel.cells`** — a change to a canonical LinkML shape (knowledge model §7) and to the seam contract (open item 2, which pre-delegated the representation choice to this note and warned `Channel.cells` "may change as a result"). Recorded here as a candidate per DEC-2; SPEC-06 builds against it under that delegated authority (as note `01`'s width floor entered the schema on landing per DEC-16), pending batch ratification.
14. **[CANDIDATE — flagged for next register batch]** **The communications/blog cadence is register-blessed authoring work, not a spec-kit feature.** ASSAY-DEC-12 settled that the *canonical documents* (D1–D5) are authoring-under-register work outside spec-kit's `specify → plan → tasks` machinery — but it is silent on the public site and its blog articles, and the comms plan that folds them into a slice's definition of "done" (§9) is itself draft-for-review, unratified. **Candidate:** communications artefacts — the Home page, the roadmap/updates feed, and blog articles — are a *third* slice category alongside document slices (D#) and build specifications (SPEC-##): they are **projections of already-shipped work**, authored under register/comms honesty discipline, and are **never themselves spec-kit features**. A blog article reports on a slice that already went through full spec-kit; the article does not get its own `specify → plan → tasks` pass, it is part of the reporting owed at that slice's gate (§9, and the home-page-currency step of item 12). This is DEC-12's reasoning extended from founding documents to communications: spec-kit's shape (testable acceptance scenarios) fits code, not a dated public claim, and a communications page must trace *to* the build, so it cannot be a spec-kit product without circularity. The candidate also **records the build-path divergence**: comms plan §8 floated Jekyll, but the site settled on the hand-rolled static assembler already used for the Home page and gallery (`scripts/build-site.ts`), keeping one build path — a change from a non-binding §8 *recommendation*, not a ratified decision, noted here for the batch. Wired provisionally into comms plan §6/§8/§9 under the same "build against the flagged candidate" pattern as item 12; on ratification, batch-propagates to DEC-12's companion note, delivery plan §2 (the slice-category taxonomy), and the comms plan status line. *Flagged candidate — not yet ratified.*

15. **[CANDIDATE — flagged for next register batch]** **System-flow infographic — behavioural decisions.** The proposal `docs/assay-flow-infographic-spec.md` (+ companion `assay-flow-infographic-wireframes.html`) grows the S4 Bridge into a stakeholder-facing explainer of the object/connector/gate flow, embedded twice from one component (in-app S4 "systems-map" mode + public Pages explainer). Most of it is a pure projection of existing seam behaviour and needs no decision; four behaviours do, and are recorded here rather than asserted in the spec (DEC-2): **(a)** *live/auto recompute in this view, attribution-visible* — the fan-out is instant (a `/analyse/staleness` read) but the recompute that turns flags into verdicts fires automatically **while remaining stamped, delta-logged, and gate-policed** (badge flips, a delta lands, the gate pulses); this differs deliberately from S2's "recompile when ready" (ui-design §3.4.4) and so is a candidate, not a silent override of it — the walkthrough's "nothing recomputes silently" is preserved because attribution is mandatory, only the *trigger* is automated. **(b)** *Viewer-driven writes from a mock operator* in the sandbox — all four surfaces are currently read projections (S4 especially watches, never writes), so a bounded viewer-write palette (toggle R1/R2/R3/R3m, contest/resolve K12, supersede K5→K9, grant/withhold W-1) against the real mock seam is a surface-behaviour decision. **(c)** *The map/geospatial panel* (ui-design §6.1 open question) — the flow view is a natural first home for the grid/causeway/strait; pulling it in is a live decision. **(d)** *A truly-silent "you-are-the-optimiser" teaching toggle* — deferred, to be reacted to by an SME (DEC-27 checkpoint) before it hardens. The interactive view is a **build slice** (SPEC-14 site/gallery neighbourhood or its own SPEC-##); the explainer framing around it is **communications authoring** under item 14's candidate taxonomy. **Proceeding under delegated authority** (decided 2026-07-13, the §6.12/6.13 pattern): the build slice **may implement against these candidates and ratify on landing** per DEC-2's established escape hatch — building against a flagged candidate is permitted, only *asserting* it as settled is not. Delegated authority is **scoped to the register gate (DEC-2) and does not waive research-first (DEC-11)**: a `docs/research/` note precedes any implementation, as notes `01`/`02` preceded the schema changes they carried; a missing note is the gate, not a formality. *Flagged candidate — building under delegated authority; not yet ratified.*

## 7. Research starting points (ASSAY-DEC-11)

Not a syllabus — first footholds for stage research notes. Developers are expected to search beyond this list and to prefer primary doctrine over summaries.

**JIPOE / IPOE & intelligence doctrine**
- JP 2-01.3, *Joint Intelligence Preparation of the Operational Environment* — the four-step process; templates, matrices, NAIs, most-likely/most-dangerous COAs
- ATP 2-01.3, *Intelligence Preparation of the Operational Environment* (US Army) — tactical IPOE; MCOO construction; threat templates
- AIntP-17 Ed. A, *NATO JIPOE* — the NATO articulation
- ICD 203, *Analytic Standards* — words of estimative probability and confidence expression (directly informs ConfidenceBand and band-width mapping)
- Vasicek & Hlavizna, STO-MP-IST-190-03 — the interdependency/stove-piping critique motivating the trace graph

**Military planning**
- JP 5-0 / AJP-5 — the operations planning process; COA development, analysis (wargaming), comparison criteria (suitability, feasibility, acceptability); decision support template/matrix
- Commander's estimate / MDMP references — where the commitment-conflict and least-worst judgement actually lives in staff practice

**Optimisation & decision techniques (per-stage detail in the build plan)**
- Multi-objective optimisation: Pareto/epsilon-dominance, NSGA-II family — for banded non-domination
- Soft-constraint frameworks: weighted CSP, MAX-SAT, goal programming — for minimal relaxation
- Robust & scenario-based optimisation: minimax regret, scenario scoring — for COA-set robustness
- Value of information & Bayesian experimental design — for collection discrimination
- Sensitivity analysis of decision models (tornado analysis, break-even) — for load-bearing assessments
