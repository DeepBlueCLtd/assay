# ASSAY — Concept

**Assessment Semantics & Scenario Analysis**
Status: canonical · v0.4 · 2026-07-14 · retitled from `assay-scaffold.md` per §4 (batch 2); §6 candidates 6–11 ratified as ASSAY-DEC-22…27 (batch 3); §6 candidates 12–18 ratified as ASSAY-DEC-28…34 (batch 4)
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
12. ~~Home-page currency (plans → achievements)…~~ — **ratified 2026-07-14 as ASSAY-DEC-28** (batch 4): each build specification carries a home-page-currency step; progress reporting at spec granularity under banded-honesty guardrails.
13. ~~Sparse channel representation…~~ — **ratified 2026-07-14 as ASSAY-DEC-29** (batch 4): a `Channel` is `default: Band` + sparse `RegionOverride`s; dense `Channel.cells` retired.
14. ~~Communications/blog cadence as register-blessed authoring work…~~ — **ratified 2026-07-14 as ASSAY-DEC-30** (batch 4): communications artefacts are a third slice category (projections of shipped work, never spec-kit features); the static assembler is the build path.

15. ~~System-flow infographic — behavioural decisions…~~ — **ratified 2026-07-14 as ASSAY-DEC-31** (batch 4): auto-recompute (a), bounded sandbox writes (b), and map/geospatial panel (c) ratified; "you-are-the-optimiser" toggle (d) explicitly deferred for SME reaction. Resolves ui-design §6.1.

16. ~~Surface shell = literal tabs in one SPA…~~ — **ratified 2026-07-14 as ASSAY-DEC-32** (batch 4): four literal role tabs over one in-browser store and one instance of the real services. Resolves concept §6.4 and ui-design §6.2.

17. ~~Live in-browser pipeline + editable surfaces (shell/pure-component split)…~~ — **ratified 2026-07-14 as ASSAY-DEC-33** (batch 4): the real pipeline runs client-side; edits are a first-class authoring act gated by the honesty machinery; the shell/pure-component split preserves SPEC-14 extractability.

18. ~~Propagation feedback ("glow") as G6 made visible…~~ — **ratified 2026-07-14 as ASSAY-DEC-34** (batch 4): value-keyed glow (row/cell-level, never over-reports) renders G6 as an operator-visible affordance; one-hop trace menu on demand.

19. ~~Should C3 read civil population — a `weighted_civil_harm` metric over the `civil_density` channel (issue #41)?~~ — **ratified 2026-07-14 as ASSAY-DEC-35** (batch 5): **no.** C3 stays a geometric red line; civil harm is not quantified, weighted, or traded (option (a), the honest default). Whether firing into 55,000 is "worse" than 5,000 is a commander/SME value judgement DEC-19 forbids the system from encoding. Resolves issue #41 (surfaced by SPEC-18 §1.2, §5 Q1); affirms DEC-19 and Principle II.

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
