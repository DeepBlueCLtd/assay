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
     generate blue COAs (doctrinal template × world-pruning; searched, non-selecting)
              ▼
                   honest scoring · robustness · relax
              ▲
              └─ discrimination / sensitivity / staleness make the KB tractable
```

### 2.1 Relevance / bounding — absent today

At KB scale almost everything is irrelevant to any one decision. Doctrine already names the mechanism: JIPOE step 1 *bounds* the OE from mission + AO and enumerates its significant characteristics; each characteristic resolves to a known answer or a **gap → collection requirement**. ASSAY skips this — it begins at "here are the 14 that matter." The forward system's first act is retrieval driven by mission geography and task, and its output is *both* the relevant known facts *and* the open questions. There is no shape for this step in the model today; it is the load-bearing move at scale.

### 2.2 Encoding is partly decision-relative — a recruitment edge, not a stripped field

The first instinct on reversing the direction is "`encoding_class` must move off `KnowledgeObject` entirely." Pressure-testing that against Meridian, it overreaches. `encoding_class` (`hard_constraint | banded_soft_cost | scenario_weight`, knowledge-model §4) is quietly bundling **three** things, and only one is decision-relative:

1. **What kind of quantity this is** — a depth, a load, a likelihood. Intrinsic to the knowledge.
2. **How it is sourced** — `observed`/`assessed`/… Intrinsic (a provenance fact).
3. **What role it plays in *this* compile** — a binding limit, a cost to trade, an attention weight. The only genuinely decision-relative part.

Split that way, the decision-relativity is narrower than it first looks:

- **`scenario_weight` is intrinsic.** A likelihood is a weight because of *what it is* — a probability judgement about which COA is true — and would never be recruited as a constraint or cost in any decision. Its firewall row is source semantics, not the decision.
- **Physical hard constraints are hard because of physics, not the decision.** K1 depth binds a deep-draught convoy and is *irrelevant* to an air element — but "irrelevant" is **not recruited**, not *recruited as a different class*. Across Meridian's live decisions no K's class actually *flips*; the variation is "recruited or not," which is a **relevance** question (§2.1), not a re-classing one.

So the claim splits into a strong half and a weak half:

- **Strong — recruitment is decision-relative, and content-addressing demands an edge for it.** If encoding lived on the object and reuse were taken seriously, using the same fact in a second mission would force a new version → new hash → a `supersedes` edge: you would fork the knowledge lineage merely because a different staff used the fact differently (DEC-21). That is absurd, and it is why recruitment must be an **edge** — so one immutable object (one hash) is pulled into many compiles without versioning.
- **Weak — genuine re-classing barely happens, and where it does ASSAY already has the edge: the waiver.** K8 is exactly an `assessed` fact *elevated* to `hard_constraint` by an explicit, owned, per-use grant (W-1), recorded as a `waives` edge. The waiver is the camel's nose — the model already concedes that *this* hardness is a per-use decision, not an intrinsic property.

**Adopted framing (edge-plus-floor, not strip-the-field).** Keep the object's intrinsic character as a *floor*; add a **recruitment edge** (`recruited_as`?), written at compile-recruitment time, carrying (a) that the object is relevant to this compile and (b) any role-elevation and its grant. The edge may only ever **narrow, or elevate by explicit waiver — never silently re-class**. The §9 firewall then re-keys as *(edge-requested role × `source_class`)*, and elevating an assessment to a hard constraint **requires a waiver by construction** — K8 today, generalised. This is a smaller, more defensible change than stripping the field, and it turns the waiver from a special case into the general mechanism.

*(The more radical "strip `encoding_class` off the object entirely and let the edge carry the whole class" stays on the table as a documented alternative; edge-plus-floor is preferred because it preserves the intrinsic character as an auditable default and cannot silently launder a source into a stronger role.)*

This remains a genuine register/schema change (touches DEC-6/DEC-16/DEC-19 and the firewall table, knowledge-model §9), and the largest structural consequence of reversing the direction — but a bounded one.

### 2.3 Compile — already forward-honest

Sparse channels (`default: Band` + `RegionOverride`s), `compiled_into` edges, the `source` back-reference (G3), and the §9 firewall are exactly what a recruited KB should compile into. No change; the compile stage is the part of ASSAY that is already pointed the right way.

### 2.4 Red COAs — the shape exists, the derivation does not run

R1–R3 are hand-authored world-variant excursions (knowledge-model §6). But JIPOE step 4 *derives* adversary COAs from adversary capability + the same terrain, and ASSAY already models the doctrinal bridge: `expected_answers` (DEC-18) is the event template — the per-COA indicator bands that discrimination reads. The red-COA *derivation* (red knowledge K4/K6/K7/K8/K12 → capability-feasible COA set → excursions) is therefore half-built; it is simply never invoked as a generator. Making it run is a smaller step than §2.1/§2.2.

### 2.5 Blue COA generation — the honesty condition is not "don't search"

An early framing of this note said "enumerate-and-prune, **never optimise**." That is the wrong target, and it fails twice. It is **self-defeating at scale** — a real doctrinal COA space over real terrain is combinatorial, so pure enumeration is exactly what you *cannot* do at KB scale, which is the premise of the whole question. And it **contradicts the project's own text**: concept §7 already lists "Pareto/epsilon-dominance, NSGA-II family — for banded non-domination." ASSAY contemplates evolutionary *search*.

What ASSAY actually forbids is not search but two specific things:

1. **Scalarising the objective** — collapsing a banded, multi-dimensional evaluation into one number to argmax over. Already guarded by banded non-domination and the handful (SPEC-08 ε-non-domination, "never a scalar," DEC-19).
2. **Auto-selecting** — the generator picking the winner. Selection is the commander's act (`SelectionRationale`); generation returns a *handful* for a human.

So the honesty condition is **"search however you like, but never scalarise and never auto-select."** Enumeration is merely the honest *default when the space is small enough to exhaust*; past that, honest guided search (NSGA-II-family over banded fitness) is legitimate. The generator still instantiates **doctrinal COA templates** (forms of manoeuvre / defeat mechanisms, JP 5-0 / MDMP) against the specific terrain and threat, and **world knowledge prunes** the feasible space (what is mobility-possible; what lies inside a threat arc; what a dropped causeway forecloses) — but "prune" is disciplined: **prune only on hard physical infeasibility and on stated commitments (traceable), never on a synthesised risk score** (that is where a weight would sneak in).

**The real unguarded risk is generator coverage.** The score is already kept honest by the handful/relax machinery; the exposure is *what the generator cannot express*. SPEC-08's "approach × suppression × causeway × extraction" axes were **authored** — a search over a badly-chosen basis is honest about scoring and dishonest about *coverage*, finding only COAs the basis spans. That is reverse-engineering moved up one level: the human who picks the axes decides what COAs are *thinkable*, and nothing today makes the system say so. ASSAY has a "no silent drop" invariant for *relaxation* (G4) but **none for generation**. The forward analogue — a **candidate invariant, "no silent COA-family drop"** — would require the generator to:

- **declare its basis** (axes/templates) and the **doctrine behind it** (cited);
- render what it **pruned**, traceably, and only on the disciplined grounds above;
- render what it **did not span**, honestly, as a stated coverage limit —

the doctrinal "have we wargamed all feasible enemy COAs, including most-dangerous?" discipline made into a machine invariant. This is the most novel thing in the note and is promoted to a named candidate invariant in §3.

The stance is otherwise unchanged from what ASSAY already believes: **generate honestly, score honestly, never author the answer** — with "honestly" now meaning *un-scalarised, non-selecting, and coverage-declared*, not *un-searched*.

### 2.6 The analyses become load-bearing, not exhibits

With 14 questions you can eyeball which matter. With thousands of open questions you cannot — you have no choice but to rank by **discrimination** (which question separates the live COAs — thesis D), **sensitivity** (which answer a verdict is leaning on — thesis E), and **staleness** (which verdicts a changed answer invalidates — thesis F). In the vignette these are demonstrations; in the huge-KB world they are the only thing that makes the KB tractable. This is the strongest evidence that ASSAY's bones point the right way even though its fixture runs backward: the tractability tools are already built, waiting for a KB large enough to need them.

## 3. Honesty invariants that must survive the reversal

Reversing the direction must not re-admit the machine ASSAY refuses. Whatever recruits knowledge and generates COAs must keep:

- **Banded propagation (G6)** — no scalar collapse anywhere in generation or scoring.
- **The compile firewall (knowledge-model §9)** — contested/stale/unwaived/assumption knowledge still refuses to enter, now keyed on the recruitment edge (§2.2). Scenario weights still never compile.
- **Trace-to-named-knowledge (G3)** — every generated COA is backward-walkable to the named world facts that make it feasible; dead ends render as dead ends.
- **Never scalarise, never auto-select** (§2.5) — search is permitted (NSGA-II-family over banded fitness); collapsing the objective to one number, or the generator naming the winner, is not. Selection stays the commander's act (`SelectionRationale`). This is what "never optimise" was clumsily reaching for (DEC-19: no numeric weights, no content ranking of same-tier sacrifices).
- **Candidate invariant — "no silent COA-family drop"** (§2.5) — the generation-layer analogue of G4. The generator declares its basis and cited doctrine, renders what it pruned (traceably; only on physical infeasibility + stated commitments, never a synthesised risk score), and renders what it did not span as a stated coverage limit. Newly surfaced here; it has no counterpart in the current invariant set and would need its own register line.

If any of these cannot be preserved through a proposed forward mechanism, that mechanism is out — the same test SPEC-09 applied to weighted CSP / MAX-SAT.

**Through-line.** The recruitment-edge gap (§2.2) and the coverage gap (§2.5) are one failure in two costumes: *a choice about what to model — which knowledge is relevant, which COAs are thinkable — made by an unexamined authored artefact (a silent field; a hand-picked basis) and then presented as if it fell out of the world.* The honest fix has the same shape both times — make the authored choice an **explicit, provenanced, contestable object** (a recruitment edge with its grant; a generator basis with its doctrine and coverage statement) rather than a silent default. That is the ASSAY constitution ("everything traces to a named owner") applied one level up: to the choices *about* what to model, not only to the model. If this note has a single thesis, it is that.

## 4. Why this is horizon, not backlog

This is the derivation-direction question sitting underneath **thesis G** (interdependency / PMESII node-link — concept §1, "highest false-precision risk"; knowledge-model §12 keeps PMESII shapes out deliberately) and **thesis H** (reactive red). A "world model large enough that COAs fall out of it" is exactly the territory the project has consciously *not* opened, to avoid false precision with no consumer. Three of the moves above are register decisions before they are code: the **recruitment edge** (§2.2), a **knowledge→COA generator** (§2.4/§2.5), and the **"no silent COA-family drop" invariant** (§2.5/§3). None should be wired in speculatively.

Issue #24 (focused dependency-graph view) is a *sibling* horizon item — it also walks the trace graph, and a forward-derivation world would lean on the same `TraceView` orientation map — but it is a presentation slice, not a parent of this. They are linked, not folded.

## 5. Smallest honest next steps (if pursued)

Ordered by structural risk, not by demo value:

1. **Cheapest, most contained:** run §2.4 — invoke the *existing* `expected_answers` / discrimination machinery to *derive* a red-COA set from red knowledge on Meridian, instead of reading the authored R1–R3. Proves "COAs from world knowledge" on one axis with no schema change.
2. **The pivotal schema question:** prototype §2.2 (recruitment edge, edge-plus-floor) as a register candidate with a spike, since every other forward step depends on it. Confirm the §9 firewall re-keys cleanly onto *(edge-requested role × `source_class`)* and that role-elevation still demands a waiver.
3. **The coverage invariant (§2.5):** draft "no silent COA-family drop" as a register candidate — cheap to state, and it disciplines any later generator work without needing the generator built first.
4. **The retrieval step (§2.1):** hardest and least doctrinally settled — defer until the above have shown the downstream is honest.

None of these are proposed now; they are the shape a future research-first slice would take.

## Sources

JP 2-01.3 (2014) ch. II — four-step JIPOE, step-1 OE bounding and gaps→requirements, step-4 threat COAs, event template/matrix, NAIs. ATP 2-01.3 (2019) — MCOO construction; threat templates. JP 5-0 / AJP-5 — COA development, feasibility/acceptability/suitability, doctrinal COA forms. ASSAY register DEC-2 (register-first), DEC-6/16/19 (encoding, confidence, tiers), DEC-11 (research-first), DEC-15 (banded, no midpoint), DEC-18 (expected-answer event matrix). ASSAY docs: `assay-concept.md` §1 (thesis catalogue G/H), §6 (candidate 19); `assay-vignette.md` §7 (coverage matrix); `assay-knowledge-model.md` §4/§6/§9/§12; research notes `01-knowledge.md` §3, `04-relaxation.md`.
