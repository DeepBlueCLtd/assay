# Horizon research note — Forward derivation: a huge KB as the origin of COAs

Horizon · **not a DEC-11 stage gate** (no build stage depends on it) · 2026-07-14
Feeds: concept §6 candidate 19 (register-first, DEC-2) · issue #43 (queue pointer)
Adjacent: thesis G (interdependency / PMESII — concept §1, "horizon; highest false-precision risk"), thesis H (reactive red), issue #24 (focused dependency-graph view — sibling horizon item, not a parent)

This note is exploratory. It records an architecture *sketch* so the question stops living in a chat thread; it decides nothing, changes no schema, and gates no code. Ratification is a future register batch (DEC-2); implementation, if ever, is research-first (DEC-11) behind its own note.

---

## 1. The problem: the demonstrator derives backward

The Meridian vignette is engineered **thesis-first**: a claim is chosen, then the knowledge object that exercises it is authored. This is stated, not hidden:

- `assay-vignette.md` §7 opens "**Every engineered feature exists to exercise a named claim**" — K8 to be the deceivable single-source assessment (thesis E), K11/K13 to be the strong/weak discriminator pair (thesis D), K12a/K12b to be the contested pair (G5).
- Research note `01-knowledge.md` §3 audits exactly this. It maps K1–K14 *back* onto the JIPOE four steps to check they are "doctrinally shaped, not invented conveniences," and flags the discipline gap: each object *should name its originating JIPOE step, making the claim auditable rather than asserted.* That sentence is only written when the author knows the derivation ran backward.
- Research note `04-relaxation.md` admits the plan generator was authored to land in the trap: the BASE generator "cannot enter the mined water, so SPEC-09 **authors** an R3m-responsive candidate set."

**The distinction that matters.** The *machinery* runs honestly forward — `compile` turns typed knowledge into banded channels with `compiled_into` edges; `score` propagates intervals (the O-1…O-4 oracles pin that it is arithmetic, not theatre); `relax` computes the least-worst frontier. Given the fixture, nothing downstream is faked. The reverse-engineering is entirely in *choosing the fixture*, which is legitimate for a demonstrator whose job is to exercise named theses on a hand-checkable case.

What the demonstrator does not model is the **real-world direction**: you are not handed 14 pre-selected, pre-typed questions. You have a large, messy world model and a mission, and COAs must fall out of *that*. This note walks that forward chain and marks where the current model reaches and where it does not.

## 2. The forward chain

```
mission + AO
  └─(step 1) bound the OE, enumerate significant characteristics
       ├─ known answers  ──────────────┐
       └─ gaps → collection requirements│
                                        ▼
                            recruit relevant knowledge
                              └─ assign encoding *for this decision*
                                        ▼
                                 compile → banded world
                                        ▼
              ┌─(step 4) derive red COAs (capability + terrain + event matrix)
              ▼
     generate blue COAs (doctrinal template × world-pruning, enumerated)
              ▼
                   honest scoring · robustness · relax
              ▲
              └─ discrimination / sensitivity / staleness make the KB tractable
```

### 2.1 Relevance / bounding — absent today

At KB scale almost everything is irrelevant to any one decision. Doctrine already names the mechanism: JIPOE step 1 *bounds* the OE from mission + AO and enumerates its significant characteristics; each characteristic resolves to a known answer or a **gap → collection requirement**. ASSAY skips this — it begins at "here are the 14 that matter." The forward system's first act is retrieval driven by mission geography and task, and its output is *both* the relevant known facts *and* the open questions. There is no shape for this step in the model today; it is the load-bearing move at scale.

### 2.2 Encoding is decision-relative — the schema is shaped wrong for the forward world

`encoding_class` (`hard_constraint | banded_soft_cost | scenario_weight`) currently lives **on `KnowledgeObject`** (knowledge-model §4). But whether a fact is a hard constraint is not a property of the fact — it is a property of the fact *against the decision being made*. Charted depth (K1) is a hard constraint for a deep-draught convoy and irrelevant to aircraft. The same causeway-load assessment is a soft cost for one plan and a non-issue for a plan that never uses the causeway.

Forward, encoding cannot be an intrinsic slot; it must be an **assignment made when a knowledge object is recruited into a particular compile for a particular mission** — i.e. an edge (`recruited_as`?) carrying the encoding class and any waiver, written at compile-recruitment time, not a field baked at authoring time. This is the single largest structural consequence of reversing the direction, and it is a genuine register/schema change (touches DEC-6/DEC-16/DEC-19 and the firewall table in knowledge-model §9). The firewall itself survives intact — it just keys on the *edge's* class × the object's `source_class`, rather than a field's class.

### 2.3 Compile — already forward-honest

Sparse channels (`default: Band` + `RegionOverride`s), `compiled_into` edges, the `source` back-reference (G3), and the §9 firewall are exactly what a recruited KB should compile into. No change; the compile stage is the part of ASSAY that is already pointed the right way.

### 2.4 Red COAs — the shape exists, the derivation does not run

R1–R3 are hand-authored world-variant excursions (knowledge-model §6). But JIPOE step 4 *derives* adversary COAs from adversary capability + the same terrain, and ASSAY already models the doctrinal bridge: `expected_answers` (DEC-18) is the event template — the per-COA indicator bands that discrimination reads. The red-COA *derivation* (red knowledge K4/K6/K7/K8/K12 → capability-feasible COA set → excursions) is therefore half-built; it is simply never invoked as a generator. Making it run is a smaller step than §2.1/§2.2.

### 2.5 Blue COA generation — the honest version of the hard problem

The tempting move — search/optimise over the world model for the "best" plan — is precisely the false-precision machine ASSAY exists to refuse: it collapses bands to points and smuggles a value judgement into a weight. The honest pattern is the one real staffs use:

- **doctrinal COA templates** (forms of manoeuvre / defeat mechanisms, JP 5-0 / MDMP) *instantiated against* the specific terrain and threat;
- **world knowledge prunes** the feasible space (what is mobility-possible; what lies inside a threat arc; what a dropped causeway forecloses);
- **enumerated fan-out** within the pruned space — never an optimiser;
- the existing **honest scorer / robustness / relax** evaluate the fan-out in banded space.

The current "approach × suppression × causeway × extraction" generation axes (SPEC-08) are a hand-picked instance of exactly this. The forward version makes the axes come from doctrine and the pruning come from the world, rather than both being authored for the trap. The stance is unchanged from what ASSAY already believes: **generate honestly, score honestly, never author the answer.**

### 2.6 The analyses become load-bearing, not exhibits

With 14 questions you can eyeball which matter. With thousands of open questions you cannot — you have no choice but to rank by **discrimination** (which question separates the live COAs — thesis D), **sensitivity** (which answer a verdict is leaning on — thesis E), and **staleness** (which verdicts a changed answer invalidates — thesis F). In the vignette these are demonstrations; in the huge-KB world they are the only thing that makes the KB tractable. This is the strongest evidence that ASSAY's bones point the right way even though its fixture runs backward: the tractability tools are already built, waiting for a KB large enough to need them.

## 3. Honesty invariants that must survive the reversal

Reversing the direction must not re-admit the machine ASSAY refuses. Whatever recruits knowledge and generates COAs must keep:

- **Banded propagation (G6)** — no scalar collapse anywhere in generation or scoring.
- **The compile firewall (knowledge-model §9)** — contested/stale/unwaived/assumption knowledge still refuses to enter, now keyed on the recruitment edge (§2.2). Scenario weights still never compile.
- **Trace-to-named-knowledge (G3)** — every generated COA is backward-walkable to the named world facts that make it feasible; dead ends render as dead ends.
- **Enumerate-and-prune, never optimise** — the constraint that keeps a knowledge→COA generator from encoding a value judgement (DEC-19: no numeric weights, no content ranking of same-tier sacrifices).

If any of these cannot be preserved through a proposed forward mechanism, that mechanism is out — the same test SPEC-09 applied to weighted CSP / MAX-SAT.

## 4. Why this is horizon, not backlog

This is the derivation-direction question sitting underneath **thesis G** (interdependency / PMESII node-link — concept §1, "highest false-precision risk"; knowledge-model §12 keeps PMESII shapes out deliberately) and **thesis H** (reactive red). A "world model large enough that COAs fall out of it" is exactly the territory the project has consciously *not* opened, to avoid false precision with no consumer. Two of the moves above are register decisions before they are code: **encoding-as-edge** (§2.2) and a **knowledge→COA generator** (§2.4/§2.5). Neither should be wired in speculatively.

Issue #24 (focused dependency-graph view) is a *sibling* horizon item — it also walks the trace graph, and a forward-derivation world would lean on the same `TraceView` orientation map — but it is a presentation slice, not a parent of this. They are linked, not folded.

## 5. Smallest honest next steps (if pursued)

Ordered by structural risk, not by demo value:

1. **Cheapest, most contained:** run §2.4 — invoke the *existing* `expected_answers` / discrimination machinery to *derive* a red-COA set from red knowledge on Meridian, instead of reading the authored R1–R3. Proves "COAs from world knowledge" on one axis with no schema change.
2. **The pivotal schema question:** prototype §2.2 (encoding-as-recruitment-edge) as a register candidate with a spike, since every other forward step depends on it. Confirm the §9 firewall re-keys cleanly onto the edge.
3. **The retrieval step (§2.1):** hardest and least doctrinally settled — defer until 1–2 have shown the downstream is honest.

None of these are proposed now; they are the shape a future research-first slice would take.

## Sources

JP 2-01.3 (2014) ch. II — four-step JIPOE, step-1 OE bounding and gaps→requirements, step-4 threat COAs, event template/matrix, NAIs. ATP 2-01.3 (2019) — MCOO construction; threat templates. JP 5-0 / AJP-5 — COA development, feasibility/acceptability/suitability, doctrinal COA forms. ASSAY register DEC-2 (register-first), DEC-6/16/19 (encoding, confidence, tiers), DEC-11 (research-first), DEC-15 (banded, no midpoint), DEC-18 (expected-answer event matrix). ASSAY docs: `assay-concept.md` §1 (thesis catalogue G/H), §6 (candidate 19); `assay-vignette.md` §7 (coverage matrix); `assay-knowledge-model.md` §4/§6/§9/§12; research notes `01-knowledge.md` §3, `04-relaxation.md`.
