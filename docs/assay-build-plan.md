# ASSAY — Build Plan

Status: draft for review · v0.1 · 2026-07-11
Authority: ASSAY-DEC-4 (in-browser mock behind seam), DEC-5 (spine architecture), DEC-7 (theses as explorations), DEC-10 (scorer as unit), DEC-11 (research-first stages). Methodology originates in the register, never here (DEC-2).

The plan is a **lap then depth**: seven stages thread the spine end-to-end against the Meridian vignette; a spine-complete gate; then narrative polish. Every stage opens with its ASSAY-DEC-11 research task — implementation does not start until the stage's research note exists in `docs/research/`.

---

## Stage 0 — Foundations

**Research first** *(note: `00-foundations.md`)*: skim JP 2-01.3 ch. II end-to-end so every developer holds the four-step process and its products (MCOO, situation/event templates, event matrix, NAIs) before any code exists; survey content-addressed storage and canonical-serialisation pitfalls (key ordering, float representation) across JS runtimes.

**Build**: repo scaffold; LinkML → TypeScript type generation pipeline; canonical-JSON + content hashing; in-browser object store (`PUT/GET/exists/versions`); TraceEdge store with forward/backward walks; vignette fixtures (Meridian knowledge base K1–K14, COAs, commitments) hand-authored against the schema.

**Exit**: a KnowledgeObject round-trips through the store with a stable content hash; a hand-written trace chain walks in both directions; fixtures validate against the generated types.

## Stage 1 — Knowledge capture & discipline

**Research first** *(note: `01-knowledge.md`)*: ICD 203 words of estimative probability and confidence standards — decide and document the ConfidenceBand → band-width mapping; read JIPOE step 1–2 question sets to check the vignette's questions are doctrinally shaped, not invented conveniences.

**Build**: knowledge service (`/knowledge` create, supersede, contest, resolve, exposure); encoding-discipline enforcement (`waiver_required`, `encoding_violation`, scenario_weight firewall); the band pill + provenance chip components; a minimal S1 knowledge table.

**Exit**: K10 is *refused* as a constraint; K8's waiver is recorded and visible; superseding K9 marks the prior version stale; the contested pair K12 blocks downstream use.

## Stage 2 — Compile

**Research first** *(note: `02-compile.md`)*: MCOO construction in ATP 2-01.3 — how doctrine actually layers obstacles, mobility corridors, and avenues of approach into a combined product; time-varying cost surfaces in the routing literature (time-expanded graphs vs (cell, time) state).

**Build**: compile service — knowledge subset + vignette config → CompiledWorld (mobility, tide, storm, civil-density, sensor channels); deterministic stamp; `compiled_into` edges written per consumed object; refusal paths (`contested_knowledge`, `stale_input`).

**Exit**: same knowledge set ⇒ byte-identical stamp; K12 unresolved ⇒ compile refuses; every channel traces backward to named knowledge objects.

## Stage 3 — Score, then plan

**Research first** *(note: `03-score-plan.md`)*: banded/epsilon-dominance and the NSGA-II family — what "distinct in banded space" means formally; JP 5-0 COA comparison criteria (suitability, feasibility, acceptability) as a cross-check that verdict semantics match staff practice.

**Build**: the **scorer first** (DEC-10, and the honesty invariant of DEC-4): plan × world × scenario → CommitmentVerdicts + banded scores, with the `knowledge_overrides` perturbation hook. Then a modest generator (strategy-biased fan-out over the vignette's four axes, seeded) and banded non-dominated organisation into the handful. S2 verdict matrix over real output.

**Exit**: `/plan/handful` returns 3–5 genuinely distinct plans for the Meridian baseline; same stamp + seed ⇒ identical handful; every verdict opens a complete trace chain.

## Stage 4 — Least-worst (thesis B live)

**Research first** *(note: `04-relaxation.md`)*: soft-constraint formalisms — weighted CSP, partial weighted MAX-SAT, goal programming, lexicographic methods; pick and justify one for v1 scale. Read how staff practice currently handles unsatisfiable guidance (commander's dialogue, assumptions log) so the relaxation *report language* matches how such news is actually delivered.

**Build**: `/relax`; `sacrificed` populated on infeasible-set planning (contract invariant G4); S3 least-worst cards.

**Exit**: the R3 mining branch yields three candidates sacrificing C4, C3, C2 respectively; the cards state each sacrifice in command language; no silent constraint drops anywhere.

## Stage 5 — Scenario robustness (thesis C live)

**Research first** *(note: `05-robustness.md`)*: robust optimisation postures (minimax, minimax regret, scenario-weighted) and their honesty trade-offs; JP 2-01.3's most-likely/most-dangerous doctrine and its warning against planning solely on most-likely — the demo script should quote it.

**Build**: multi-scenario scoring across R1/R2/R3 as excursions; scenario strip component; dominance judged across the scenario-scored bands; comparability guard on mixed stamps.

**Exit**: the R1-optimal plan visibly collapses under R2 while a robust alternative survives all three — reproducibly, from the fixtures.

## Stage 6 — Analysis loops (theses D, E, F live)

**Research first** *(note: `06-analysis.md`)*: value-of-information and Bayesian experimental design (for discrimination); tornado/break-even sensitivity analysis of decision models (for load-bearing ranking); deception doctrine (JP 2-01.3 ch. IV counters-to-deception) so the single-source flag is presented in doctrinally literate terms; collection management basics (PIRs, NAIs, indicators).

**Build**: `/analyse/sensitivity` (band-edge perturbation loop over the scorer), `/analyse/discrimination` (COA-pair separation over open questions), `/analyse/staleness` (transitive trace walk); S1 queues wired to all three; the delta feed and S4 fan-out view.

**Exit**: K8 tops the sensitivity ranking with its single-source flag; K11 beats K13 on discrimination value despite higher collection cost; superseding K9 flags exactly the K5-dependent verdicts and nothing else.

## ── Spine-complete gate ──

The lap runs end-to-end against Meridian: capture → compile → plan → relax → scenario-score → analyse, with the cross-cutting invariants demonstrably holding — content-addressing, stamp determinism, banded honesty at the seam (contract G2), complete trace chains (G3), least-worst never empty (G4), contested never compiles (G5). All six coverage-matrix theses A–F walkable. Scope: one vignette, one user, mock backend.

## Stage 7 — Surfaces & narratives (post-gate)

**Research first** *(note: `07-narratives.md`)*: decision-support presentation in doctrine (decision support template/matrix) and the human-factors literature on uncertainty communication — how bands and confidence are read and misread by decision-makers; test the band pill against it.

**Build**: full S1–S4 chrome as config-declared bundles; the five demo narrative scripts (concept §1) as tab-orders + presenter notes; wall-projection mode decision (ui-design §6.4); SME-facing polish pass under the banded-honesty invariant.

**Exit**: each narrative runs as a scripted 10-minute demo from a cold start, offline.

## Deferred (explicitly out of the lap)

Thesis G interdependency slice (pending the honest-v1 judgement, concept §6.3); thesis H reactive red; vignette authoring surface; any real (non-mock) service.

## Sequencing rationale & risks

Scorer-before-generator is the plan's one non-obvious ordering: theses D/E/F consume the scorer alone, so an honest scorer plus a *canned* handful could demo four theses even if generation slips — the generator is the schedule's sacrificial scope, never the scorer. The highest technical risk is Stage 2/3 interaction (banded propagation through time-varying channels); the highest credibility risk is skipping the Stage 1 ICD 203 work and inventing a confidence mapping — which is precisely the class of failure ASSAY-DEC-11 exists to prevent. Stage research notes are bounded (hours, not weeks); a note that balloons is a register conversation, not a licence to stall.
