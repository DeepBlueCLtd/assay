# ASSAY — Project Scaffold & Founding Register

**Assessment Semantics & Scenario Analysis**
Status: founding document · v0.1 · 2026-07-11
Regime: full register discipline (ASSAY-DEC-2). This document carries the founding register until `assay-register.md` is split out at repo creation; thereafter the register is the sole home of decisions.

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

## 2. Founding register

Decisions ratified in the founding design session (2026-07-11). Register-first applies from the next session onward.

| ID | Decision | Rationale |
|---|---|---|
| ASSAY-DEC-1 | **ASSAY established** as a standalone demonstrator: JIPOE-derived knowledge, quantified and typed, exploited by optimisation machinery; one environment, multiple explorable theses (A–H), multiple demo narratives over a shared backend. | A single coherent demonstration beats discrete thesis builds; the theses share ~80% of their machinery. |
| ASSAY-DEC-2 | **Full REMIT-style documentation discipline**: own register with own DEC numbering; register-first (decisions recorded before citation in peer documents); batch propagation across the canonical set; methodology never originates in the build plan. | The discipline proved its worth in REMIT; a demonstrator that reconsiders principles must record its reconsiderations. |
| ASSAY-DEC-3 | **Fully independent LinkML schema.** No import of REMIT shapes; REMIT concepts re-derived only where they earn their place. Convergence/divergence findings reported back as REMIT register candidates. | The point is re-derivation; a dependency would prejudge the answer. |
| ASSAY-DEC-4 | **In-browser mock implementation behind a service seam contract** (TS/TSX, REMIT v1 pattern): fully client-side and offline; REST-shaped contracts mature early; real services can swap in later with no client change. **Invariant: the scorer is honestly real even in the mock** — sensitivity, discrimination, and robustness demos are re-scoring loops and become theatre over a fake scorer. | Fastest demo loop; the seam is the durable asset. |
| ASSAY-DEC-5 | **Architecture**: one content-addressed store; compile / plan-score / analysis services behind the seam; the **traceability graph as a first-class object** (knowledge → channel → verdict → rationale edges); role surfaces as config-declared projections over the shared store; every cross-surface write a stamped delta. A surface may only *arrange* existing projections, never demand new backend semantics. | Every narrative is a read of the trace graph from a different end; surfaces stay cheap only if the graph is real. |
| ASSAY-DEC-6 | **The knowledge object is the central new type**: a quantified JIPOE Q&A carrying encoding class (hard constraint / banded soft cost / scenario weight), banded value, provenance (source class, confidence, ownership), criticality, and validity window. Detailed in `assay-knowledge-model.md`. | The one genuinely new schema relative to REMIT's model; everything else is a familiar shape re-derived. |
| ASSAY-DEC-7 | **Theses are explorations, not builds**; narratives are demo configurations. No thesis-specific backend forks. | Prevents the demonstrator fragmenting into four half-products. |
| ASSAY-DEC-8 | **Vignette**: deliberately fictional archipelago setting; small joint task force echelon (3–5 force elements, red ORBAT with 2–3 genuinely divergent COAs, one operational objective). The vignette is engineered by construction to exercise every narrative: conflicting commitments (B), a load-bearing deceivable assessment (E), divergent red COAs (C), a collectable discriminator (D), a perishable forecast (F). Detailed in `assay-vignette.md`. | Fiction removes classification-adjacent realism constraints; JTF echelon gives JIPOE texture without ORBAT sprawl. |
| ASSAY-DEC-9 | **Banded-honesty invariant**: no scalar derived from an *assessed* source reaches any surface unbanded; provenance and an "assessment, not fact" marking are visible wherever such a number is shown; plan dominance is judged in banded space only. | One SME seeing a confident number they know is guesswork discredits the whole pipeline. Inherits the Blockbuster lesson and REMIT NF9/NF10 by re-derivation, not import. |
| ASSAY-DEC-10 | **Scoring factored as an independently callable unit** of the planning service. Analysis services (sensitivity, discrimination, staleness) are thin orchestrations: the scorer called in a loop plus a trace-graph walk — never separate engines. | Keeps theses C/D/E/F nearly free once A and B stand. |
| ASSAY-DEC-11 | **Research-first development discipline.** Every build stage opens with a bounded research task on the doctrine and literature that stage touches (JIPOE/IPOE and military planning doctrine; optimisation techniques). Findings are recorded as a short research note in `docs/research/` *before* implementation begins; notes cite sources and state what the stage will do differently because of them. Doctrinal or algorithmic claims in canonical documents must trace to a research note or a register entry, not to developer recollection. The build plan (`assay-build-plan.md`) names each stage's research prompts; §7 below lists starting points. | ASSAY's credibility rests on doctrinal and mathematical honesty. Developers who haven't read the doctrine will build a strawman JIPOE; developers who haven't read the optimisation literature will reinvent it badly. Bounded research (hours, not weeks) with a written note keeps this cheap, auditable, and cumulative. |

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
| `assay-register.md` | decision register (split from §2 at repo creation) | founding entries herein |
| `assay-scaffold.md` → `assay-concept.md` | purpose, theses, narratives, principles | this document, to be retitled |
| `assay-architecture.md` | services, surfaces, trace graph, invariants | seeded by §3 |
| `assay-knowledge-model.md` | LinkML schema + commentary | **founding doc 2** |
| `assay-seam-contract.md` | REST shapes and semantics | **founding doc 3** |
| `assay-vignette.md` | the Meridian Archipelago scenario | **founding doc 4** |
| `assay-ui-design.md` | surfaces, information flows, shared components | authored, draft for review |
| `assay-build-plan.md` | stage sequencing, gates, per-stage research prompts | authored, draft for review |

## 5. Repository & working conventions

- **Repo**: new GitHub repository `assay`; document home in `docs/`; Claude Code as development environment (REMIT DEC-58 pattern, re-adopted not inherited).
- **Branching**: branch-per-batch (`docs/<batch-name>`, `feat/<slice-name>`).
- **Edits**: guarded patch scripts (assert-each-replacement-lands-once) for targeted document updates.
- **Diagrams**: Mermaid with explicitly pinned theme variables *and* per-subgraph `style` statements; TB orientation preferred.
- **Milestones**: ntfy.sh/iancc2025.
- **Sessions**: structured interview format; one fork per turn; register-first from the next session.
- **Research notes** (ASSAY-DEC-11): `docs/research/<stage>-<topic>.md`; one page preferred; must cite sources and end with "what we will do differently". Stage implementation does not start until its note exists.

## 6. Open questions (candidates for the next register batch)

1. Build order of the spine — a "lap" equivalent (capture → compile → plan → argue?) has not been decided.
2. Handful generation strategy axes for this domain (REMIT's time/exposure/robustness/completeness axes do not transfer unexamined).
3. Whether thesis G (interdependency) admits *any* honest v1 slice, or is horizon-only.
4. Surface implementation: literal tabs in one SPA vs routed micro-frontends over the shared store.
5. Vignette authoring format: hand-authored JSON fixtures vs a light authoring surface.

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
