# ASSAY — Build Plan

Status: draft for review · v0.1 · 2026-07-11
Authority: ASSAY-DEC-4 (in-browser mock behind seam), DEC-5 (spine architecture), DEC-7 (theses as explorations), DEC-10 (scorer as unit), DEC-11 (research-first stages). Methodology originates in the register, never here (DEC-2).

The plan is a **lap then depth**: seven stages thread the spine end-to-end against the Meridian vignette; a spine-complete gate; then narrative polish. Every stage opens with its ASSAY-DEC-11 research task — implementation does not start until the stage's research note exists in `docs/research/`.

**Demo moments.** Each stage's exit criteria come in two registers: the machine-observable assertion (unchanged below) and a **user-observable twin** — what a watcher sees on a surface when the criterion holds. Each stage closes with a scripted **two-minute demo moment** drawn from the vignette's coverage matrix, shown from the running build; the Stage-7 ten-minute narratives *assemble* these moments, they do not replace them. This is presentation of the exits the vignette already engineers (DEC-7/DEC-8's demo configurations), not new methodology; adopting it as a standing exit requirement is a register candidate (concept §6).

---

## Stage 0 — Foundations

**Research first** *(note: `00-foundations.md`)*: skim JP 2-01.3 ch. II end-to-end so every developer holds the four-step process and its products (MCOO, situation/event templates, event matrix, NAIs) before any code exists; survey content-addressed storage and canonical-serialisation pitfalls (key ordering, float representation) across JS runtimes.

**Build**: repo scaffold; LinkML → TypeScript type generation pipeline; canonical-JSON + content hashing; in-browser object store (`PUT/GET/exists/versions`); TraceEdge store with forward/backward walks; vignette fixtures (Meridian knowledge base K1–K14, COAs, commitments) hand-authored against the schema.

**Exit**: a KnowledgeObject round-trips through the store with a stable content hash; a hand-written trace chain walks in both directions; fixtures validate against the generated types.
**User-observable**: none claimed — Stage 0 is plumbing. The component gallery (SPEC-14, delivery plan lane γ) opens alongside it, rendering the band pill and provenance chip over these fixtures from the start, so there is something honest to look at before any service exists.

## Stage 1 — Knowledge capture & discipline

**Research first** *(note: `01-knowledge.md`)*: ICD 203 words of estimative probability and confidence standards — decide and document the ConfidenceBand → band-width mapping; read JIPOE step 1–2 question sets to check the vignette's questions are doctrinally shaped, not invented conveniences.

**Build**: knowledge service (`/knowledge` create, supersede, contest, resolve, exposure); encoding-discipline enforcement (`waiver_required`, `encoding_violation`, scenario_weight firewall); the band pill + provenance chip components; a minimal S1 knowledge table.

**Exit**: K10 is *refused* as a constraint; K8's waiver is recorded and visible; superseding K9 marks the prior version stale; the contested pair K12 blocks downstream use.
**User-observable**: on the minimal S1 table, K10's refusal banner renders where the save was attempted (reason, offending ref, explanation — ui-design §3.4.1); K8 carries its waiver chip and single-source marking; the contested K12 pair renders side by side with a blocking flag. *Demo moment: "the system declines laundered judgement" — save K10, watch it refused.*

## Stage 2 — Compile

**Research first** *(note: `02-compile.md`)*: MCOO construction in ATP 2-01.3 — how doctrine actually layers obstacles, mobility corridors, and avenues of approach into a combined product; time-varying cost surfaces in the routing literature (time-expanded graphs vs (cell, time) state).

**Build**: compile service — knowledge subset + vignette config → CompiledWorld (mobility, tide, storm, civil-density, sensor channels); deterministic stamp; `compiled_into` edges written per consumed object; refusal paths (`contested_knowledge`, `stale_input`).

**Exit**: same knowledge set ⇒ byte-identical stamp; K12 unresolved ⇒ compile refuses; every channel traces backward to named knowledge objects.
**User-observable**: the compile refusal banner names the K12 pair with a "view contest" side-by-side (ui-design §3.4.3); any channel cell opens the trace drawer and walks back to named knowledge with named owners. *Demo moment: "contested never compiles" — attempt the compile, read the refusal, resolve, recompile.*

## Stage 3 — Score, then plan

**Research first** *(note: `03-score-plan.md`)*: banded/epsilon-dominance and the NSGA-II family — what "distinct in banded space" means formally; JP 5-0 COA comparison criteria (suitability, feasibility, acceptability) as a cross-check that verdict semantics match staff practice.

**Build**: the **scorer first** (DEC-10, and the honesty invariant of DEC-4): plan × world × scenario → CommitmentVerdicts + banded scores, with the `knowledge_overrides` perturbation hook. Then a modest generator (strategy-biased fan-out over the vignette's four axes, seeded) and banded non-dominated organisation into the handful. S2 verdict matrix over real output.

**Exit**: `/plan/handful` returns 3–5 genuinely distinct plans for the Meridian baseline; same stamp + seed ⇒ identical handful; every verdict opens a complete trace chain.
**User-observable**: the S2 matrix shows the handful as four-stop chips (margin bands on hover, no decimals anywhere); clicking any verdict opens a complete why-chain. *Demo moment: "the honest matrix" — pick a verdict, walk it to the assessment and owner it rests on.*

## Stage 4 — Least-worst (thesis B live)

**Research first** *(note: `04-relaxation.md`)*: soft-constraint formalisms — weighted CSP, partial weighted MAX-SAT, goal programming, lexicographic methods; pick and justify one for v1 scale. Read how staff practice currently handles unsatisfiable guidance (commander's dialogue, assumptions log) so the relaxation *report language* matches how such news is actually delivered.

**Build**: `/relax`; `sacrificed` populated on infeasible-set planning (contract invariant G4); S3 least-worst cards.

**Exit**: the R3 mining branch yields three candidates sacrificing C4, C3, C2 respectively; the cards state each sacrifice in command language; no silent constraint drops anywhere.
**User-observable**: S3 shows the three least-worst cards, each naming its sacrifice in command language ("opens the strait D+9, two days late"); the why-chain answers "why can't I keep both C2 and C4?" on demand. *Demo moment: "least-worst, never silence" — toggle R3m, watch infeasibility become an argument instead of an error.*

## Stage 5 — Scenario robustness (thesis C live)

**Research first** *(note: `05-robustness.md`)*: robust optimisation postures (minimax, minimax regret, scenario-weighted) and their honesty trade-offs; JP 2-01.3's most-likely/most-dangerous doctrine and its warning against planning solely on most-likely — the demo script should quote it.

**Build**: multi-scenario scoring across R1/R2/R3 as excursions; scenario strip component; dominance judged across the scenario-scored bands; comparability guard on mixed stamps.

**Exit**: the R1-optimal plan visibly collapses under R2 while a robust alternative survives all three — reproducibly, from the fixtures.
**User-observable**: P1's scenario strip collapses at a glance when R2 is toggled while P2's holds; mixing stamps greys the matrix rather than comparing silently. *Demo moment: "don't plan on most-likely" — toggle R2 and watch the favourite die.*

## Stage 6 — Analysis loops (theses D, E, F live)

**Research first** *(note: `06-analysis.md`)*: value-of-information and Bayesian experimental design (for discrimination); tornado/break-even sensitivity analysis of decision models (for load-bearing ranking); deception doctrine (JP 2-01.3 ch. IV counters-to-deception) so the single-source flag is presented in doctrinally literate terms; collection management basics (PIRs, NAIs, indicators).

**Build**: `/analyse/sensitivity` (band-edge perturbation loop over the scorer), `/analyse/discrimination` (COA-pair separation over open questions), `/analyse/staleness` (transitive trace walk); S1 queues wired to all three; the delta feed and S4 fan-out view.

**Exit**: K8 tops the sensitivity ranking with its single-source flag; K11 beats K13 on discrimination value despite higher collection cost; superseding K9 flags exactly the K5-dependent verdicts and nothing else.
**User-observable**: the S1 queues carry the theses as furniture — K8 first in *Verify next* with its deception-exposure flag, K11 above K13 in *Collect next* with value and cost shown side by side; on S4, the K9 supersession animates its fan-out to exactly the flagged verdicts. *Demo moment: "the heartbeat" — supersede K5 from S1 and watch the flags land on S2 with no email, no re-brief (walkthrough beat 1).*

## ── Spine-complete gate ──

The lap runs end-to-end against Meridian: capture → compile → plan → relax → scenario-score → analyse, with the cross-cutting invariants demonstrably holding — content-addressing, stamp determinism, banded honesty at the seam (contract G2), complete trace chains (G3), least-worst never empty (G4), contested never compiles (G5). All six coverage-matrix theses A–F walkable. Scope: one vignette, one user, mock backend.

## Stage 7 — Surfaces & narratives (post-gate)

**Research first** *(note: `07-narratives.md`)*: decision-support presentation in doctrine (decision support template/matrix) and the human-factors literature on uncertainty communication — how bands and confidence are read and misread by decision-makers; test the band pill against it.

**Build**: full S1–S4 chrome as config-declared bundles; the five demo narrative scripts (concept §1) as tab-orders + presenter notes; wall-projection mode decision (ui-design §6.4); SME-facing polish pass under the banded-honesty invariant.

**Exit**: each narrative runs as a scripted 10-minute demo from a cold start, offline.
**User-observable**: this stage's exit is already user-framed; the narratives assemble the per-stage demo moments banked at Stages 1–6 rather than staging anything for the first time.

## Deferred (explicitly out of the lap)

Thesis G interdependency slice (pending the honest-v1 judgement, concept §6.3); thesis H reactive red; vignette authoring surface; any real (non-mock) service.

## Sequencing rationale & risks

Scorer-before-generator is the plan's one non-obvious ordering: theses D/E/F consume the scorer alone, so an honest scorer plus a *canned* handful could demo four theses even if generation slips — the generator is the schedule's sacrificial scope, never the scorer. The highest technical risk is Stage 2/3 interaction (banded propagation through time-varying channels); the highest credibility risk is skipping the Stage 1 ICD 203 work and inventing a confidence mapping — which is precisely the class of failure ASSAY-DEC-11 exists to prevent. Stage research notes are bounded (hours, not weeks); a note that balloons is a register conversation, not a licence to stall.
