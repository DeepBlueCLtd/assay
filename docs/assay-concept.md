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

19. **Forward derivation — a huge KB as the origin of COAs, not a thesis-first fixture** *(horizon; raised 2026-07-14; tracked as issue #43; sketched in `docs/research/horizon-forward-derivation.md`)*. The vignette derives backward (thesis chosen, then the knowledge object authored to exercise it — vignette §7; audited in research note `01-knowledge.md` §3). The real-world direction is knowledge-of-the-world → step-1 bounding/relevance → decision-relative encoding → compiled world → derived red/blue COAs → honest scoring, with discrimination/sensitivity/staleness making a large KB tractable. Sub-questions for a future batch: **(a)** a **recruitment edge** (`recruited_as`), because only the *role* a fact plays is decision-relative — its kind and source are intrinsic, and `scenario_weight`/physical hard constraints do not re-class; keep the object's character as a floor, let the edge carry relevance + waiver-style elevation (edge-plus-floor, not strip-the-field), re-keying the §9 firewall on *(edge role × source_class)* so elevation still demands a waiver (touches DEC-6/16/19/21); **(b)** whether COA generation from world knowledge admits an honest slice — the condition is **never scalarise, never auto-select** (search, incl. NSGA-II over banded fitness, is permitted; only weighted collapse and generator-side winner-picking are forbidden), *not* "never optimise"; **(c)** a candidate invariant **"no silent COA-family drop"** — the generation-layer analogue of G4: declare the basis + cited doctrine, render what was pruned (traceably, on physics + stated commitments only) and what was not spanned; **(d)** the relevance/retrieval step at KB scale. Through-line: (a) and (c) are one failure — an authored choice about what to model presented as if it fell out of the world; the fix is the constitution applied one level up (make the choice an explicit, provenanced object). Adjacent to thesis G (interdependency, concept §1) and issue #24 (dependency-graph view — sibling, not parent). Register-first (DEC-2): no schema or code change until ratified; research-first (DEC-11): the note is exploratory, not a stage gate.

20. ~~Should C3 read civil population — a `weighted_civil_harm` metric over the `civil_density` channel (issue #41)?~~ — **ratified 2026-07-14 as ASSAY-DEC-35** (batch 5): **no.** C3 stays a geometric red line; civil harm is not quantified, weighted, or traded (option (a), the honest default). Whether firing into 55,000 is "worse" than 5,000 is a commander/SME value judgement DEC-19 forbids the system from encoding. Resolves issue #41 (surfaced by SPEC-18 §1.2, §5 Q1); affirms DEC-19 and Principle II.

21. ~~Spatial & temporal COA visualisation — a first-class, honest, interactive surface~~ — **ratified 2026-07-15 as ASSAY-DEC-36** (batch 6): the banded-surface convention (a), the temporal convention (b), and drag-to-recompute (c) as decided by research note `10-spatial-temporal.md` and demonstrated in SPEC-19 (PR #49); promotion (d) ratified **after** the SME checkpoint the note requested — the SME endorsed the UI model (ASSAY-FIND-7, comms §12/DEC-27) — as a fifth shared *surface* tab ("Spatial · COA") over the SPA's single store, extending DEC-32's four role tabs; DEC-31(d)'s "never silently optimise" caution binds.

22. **Compile-overlay precedence semantics — excursion-layer overrides beat base-knowledge overrides** *(flagged 2026-07-15 by SPEC-20, `specs/020-compile-precedence/`; decided technically by the research note `02-compile.md` §6 amendment under the DEC-11 gate; awaiting ratification)*. Channel materialisation resolves overlapping `RegionOverride`s **by layer before geometry**: an override applied from a ScenarioCOA `excursion` (DEC-8) takes precedence over any base-knowledge-derived override on the same cell and step; within a layer the documented tie order (later `from_step`, then innermost region) is unchanged; the layer is derived (`override.source === world.scenario`), never stored — no schema change. This is the fix for the one place the computed world contradicted the canonical narrative (review 2026-07-14 §3.6: under R3/R3m the causeway demolition lost to K2's base estimate, so C5 scored satisfied in a world whose story says the causeway is down). Consequences swept in the same change: C5 scores `violated` under R3/R3m, the Stage-4 sacrifice sets become {C4,C5}/{C3,C5}/{C2,C5}, `engine_version` bumps to 0.2.0. Candidate only — recorded here per DEC-2; the spec may not be cited as authority.

23. **`jipoe_step` on `KnowledgeObject` — knowledge names its doctrinal origin (SPEC-21)** *(flagged 2026-07-15; review §4.1/A7 + addendum slice S-A; demanded by research note `01-knowledge.md` §3 and repeated by issue #43)*. A `JipoeStep` LinkML enum carrying JP 2-01.3's four steps verbatim, plus an optional `jipoe_step` slot on `KnowledgeObject` (**schema change — touches DEC-6**; types regenerate and fixture content hashes churn under DEC-21 supersession-as-regeneration). The slot records the *originating* step, singular by design (usage stays in the trace graph); fixtures K1–K14 annotated from the note-01 §3 audit and pinned by an oracle-style test; the provenance chip and per-component legends render the step in words; a warning-level `missing_jipoe_step` lint (never a refusal, `observed` **not** exempt — origin applies to facts too) fires on step-less knowledge writes, recalibrated after Checkpoint 1 (DEC-27). Decided in detail by the note-01 amendment (DEC-11 gate); built under SPEC-21; awaiting ratification in the next register batch.

24. **Attention ordering — sharpen "order attention and reporting" into two named behaviours (SPEC-22)** *(flagged 2026-07-16; review §3.5/M11 + addendum slice S-C; decided technically by research note `11-attention.md` under the DEC-11 gate)*. The register's firewall language (knowledge model §9: scenario weights "order attention and reporting, and never compile into a constraint or cost") is sharpened into **exactly two** licensed behaviours — **(a)** the scenario strip renders the K14 likelihood bands under the **interval order** (`lo(a) > hi(b)` ⇒ strictly above; overlap, nesting included, ⇒ honestly incomparable and level; missing or contested weights unranked, never uniform-defaulted), labelled "orders attention — never compiles"; **(b)** the S1 collection queue **may tie-break** questions of exactly equal discrimination standing by the conservative pair lift of the same interval order, stated in the rendering wherever applied, never applied across overlapping bands, never overriding DEC-18's primary ranking — **and nothing else**: any third weight-consuming behaviour is a new register candidate, not an extension. No scalar sort key (`lo`, `hi`, midpoint, Hurwicz α) exists anywhere (DEC-15/19); the comparison reuses `dominance.ts` (note 03 §5); the analysis services stay weight-free (the tie-break composes in the queue assembly, `DiscriminationService` untouched); "attention only" is machine-checked (a K14 band edit changes zero stamps/verdicts/memberships; import isolation between attention/strip modules and compile/score/dominance/relax). No schema change. Candidate only — recorded here per DEC-2; SPEC-22 may not be cited as authority.

25. **Provenance on `ExpectedAnswer` — the event matrix carries a chip (SPEC-23)** *(flagged 2026-07-16; review §3.4/B7 + addendum slice S-E, seconding knowledge model §12's open item)*. An optional `provenance` slot (the existing `Provenance` shape, whole — no third dialect) on `ExpectedAnswer` (**schema change — touches DEC-18 and DEC-9**; fixture content hashes churn under DEC-21). An expected-answer band is somebody's assessment of what a COA would look like — red-cell COA templating, the JIPOE step-4 indicator product — and was the only major assessed content without a chip; G3 applies *to* the matrix, not just through it, and `single_source` matters here with special force (indicators are precisely what a deceiver shapes, JP 2-01.3 ch. IV). Disciplined by a warning-level `missing_expected_answer_provenance` lint (never a refusal; same posture as `missing_jipoe_step`, recalibrated after Checkpoint 1 / DEC-27); the chip renders wherever an expected band renders. Decided in detail by the note-08 §7.3 amendment (DEC-11 gate); built under SPEC-23; awaiting ratification in the next register batch.

26. **Operative-pair conditioning — the discrimination ranking leads with the pairs the live decision turns on (SPEC-23)** *(flagged 2026-07-16; review §3.4/B7 + addendum slice S-E)*. A ranking-semantics decision touching DEC-18's "computed, never asserted" discipline: a scenario pair is **operative** iff some plan and commitment in the current set have differing verdicts across it in the SPEC-10 tensor — derived from verdict divergence only, rendered with its witnesses, no curation, no likelihood input (the §9 firewall; K14 never enters). The collect-next ranking leads with best separation over could-discriminate operative pairs; all-pairs separation stays as context; nested pairs (no exclusive region for the inner COA — can never confirm it) are classified, rendered "cannot discriminate", and excluded from could-discriminate emphasis; degenerate states (no tensor, incomparable stamps, one live scenario, no divergence, all pairs operative) render stated honest fallbacks, never a fabricated pair. **No metric change** — v1's numeric separations stay byte-identical; the classification is a geometric predicate and the conditioning is a fold over the existing tensor (DEC-10 posture, no new engine). Decided in detail by the note-08 §7.1–§7.2 amendment (DEC-11 gate); built under SPEC-23; awaiting ratification in the next register batch.

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

**Visualisation & uncertainty communication (SPEC-19 spatial/temporal COA views)**
- Uncertainty-visualisation surveys (MacEachren et al., *Visualizing Geospatial Information Uncertainty*; Bonneau et al., *Overview and State-of-the-Art of Uncertainty Visualization*) — how to render an interval as an interval, not a point (bounds the banded-surface rule, G2)
- Cartographic conventions for bivariate / value-plus-uncertainty surfaces (value-suppressing colour, hatching/texture for imprecision) — candidates for the banded channel fill
- Shneiderman's visual-information-seeking mantra (overview → zoom/filter → details-on-demand) and the space-time cube (Hägerstrand; Kraak) — for the temporal/space-time perspective and the scrub/hover interaction
- ATP 2-01.3 MCOO (modified combined obstacle overlay) — the doctrinal spatial product the map schematic is the honest analogue of (already cited for the sparse-channel decision, note 02)
- ICD 203 estimative-probability language and note 09's band-pill audit — carried onto the canvas so a spatial value reads as assessment, not fact
