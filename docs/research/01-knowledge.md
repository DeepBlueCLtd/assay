# Research note 01 — Knowledge capture & discipline

Stage 1 · per ASSAY-DEC-11 · 2026-07-12 · bounded to hours, one page preferred
Prompts (build plan §Stage 1): ICD 203 words of estimative probability and confidence standards — decide and document the ConfidenceBand → band-width mapping DEC-16 defers here; read JIPOE step 1–2 question sets to check the vignette's questions are doctrinally shaped, not invented conveniences.

## 1. ICD 203: two axes, never one number

ICD 203, *Analytic Standards* (ODNI, current text 2 Jan 2015), fixes **two independent expressions of uncertainty** and is explicit that they must not be collapsed into a single statement:

1. **Likelihood / probability** — expressed with one of two seven-term lexicons (never mixed within a product), mapped to percentage ranges. The standard scale:

   | Term (either lexicon) | Range |
   |---|---|
   | almost no chance · remote | 01–05 % |
   | very unlikely · highly improbable | 05–20 % |
   | unlikely · improbable | 20–45 % |
   | roughly even chance · roughly even odds | 45–55 % |
   | likely · probable | 55–80 % |
   | very likely · highly probable | 80–95 % |
   | almost certain(ly) · nearly certain | 95–99 % |

2. **Confidence level** — `low / moderate / high`, expressing the strength of the *knowledge base* behind the judgement: source reliability and quality, corroboration/quantity of sources, soundness of reasoning, and sensitivity to assumptions and information gaps. ICD 203 states plainly that a confidence level is **not** a probability and must not be conflated with likelihood.

The load-bearing consequence for ASSAY: **confidence and band width measure different things.** A `Band {lo, hi}` on an assessed quantity states the analyst's range for the *quantity itself*; `confidence` states how much to trust that the range is right. This is why DEC-16 could fix the enum but had to defer the "width mapping" — and why that mapping cannot be a direct numeric derivation without breaking ICD 203's non-conflation rule.

## 2. The ConfidenceBand → band-width mapping (closing DEC-16)

The vignette's own bands settle the shape of the mapping empirically. Pairing each assessed/reported band with its confidence and its relative width `r = (hi − lo) / max(|lo|, |hi|)` (chosen because it needs **no midpoint** — DEC-15-safe — and is well-defined for every non-`{0,0}` band):

| K | conf | band | r |
|---|---|---|---|
| K6 sortie rate | low | 2–6 /day | 0.67 |
| K2 causeway load | moderate | 20–40 t | 0.50 |
| K7 AD envelope | moderate | 8–14 km | 0.43 |
| K4 garrison strength | moderate | 300–450 | 0.33 |
| K14a R1 likelihood | moderate | 45–70 % | 0.36 |
| K5 surge (D+0–4) | high | 0.4–0.9 m | 0.56 |
| K9 surge (D+2–9) | high | 1.1–1.8 m | 0.39 |

The relationship is **not monotonic** — K5 is `high` yet wide (a met forecast genuinely spans that surge range even when the forecast *method* is trusted), while K6 is `low` and widest. That is exactly what §1 predicts: width tracks the quantity, confidence tracks the sourcing. So the honest coupling is not a formula that *sets* width from confidence but a **floor** that *bounds* it: a low-confidence judgement may not be dressed in a suspiciously tight band, because narrowness asserts a precision the sourcing does not earn — the false-precision tell ASSAY exists to catch.

**Adopted mapping (the DEC-16 annotation), a minimum relative width per confidence level:**

| confidence | minimum `r` | reading |
|---|---|---|
| `high` | 0 | precision permitted; a tight (even degenerate) band is honest when sourcing earns it |
| `moderate` | 0.10 | some spread required |
| `low` | 0.25 | must be visibly wide; a narrow low-confidence band is refused as false precision |

Every vignette band clears its floor (the only `low` assessed band, K6 at 0.67, clears 0.25 comfortably), so the fixtures validate the rule rather than being bent to it. The floor enters the schema as an `annotations:` note on `ConfidenceBand` (a metadata annotation, **not a shape change**, per DEC-16) and is enforced at `POST /knowledge` as a **warning-level lint**, not a refusal, in v1: the numbers are a first calibration to be tuned against Checkpoint-1 SME reaction (comms §12 / DEC-27), and a hard refusal on author-stated bands is too aggressive before that evidence exists. `observed` values are exempt (they are fact, may be scalar/degenerate — DEC-14).

**Likelihood bands** (scenario weights K14a–c, and any probability-valued answer) are authored to the §1 ICD 203 ranges, not freehand percentages, and carry the confidence field separately. They remain firewalled — weights order attention and reporting, never compile (knowledge model §9) — so this mapping governs their *authoring honesty*, not any computation.

## 3. Are the vignette's questions doctrinally shaped?

Mapping K1–K14 onto the JIPOE four steps (JP 2-01.3 ch. II; step detail from note 00) shows even coverage rather than convenience:

- **Step 1, define the OE** (bounds, characteristics, *gaps → requirements*): K1 depths/gradients, K3 civil population.
- **Step 2, describe OE impact** (MCOO layers — terrain, weather, obstacles): K2 causeway load, K5/K9 tide & storm, K7 AD envelope.
- **Step 3, evaluate the adversary** (capabilities, disposition): K4 garrison strength, K6 sortie rate, K8 radar state, K12 mine stock.
- **Step 4, determine adversary COAs** (COA set + event template/matrix): K14 COA likelihoods; **K11 and K13 are event-matrix indicators** at named areas of interest (mines at Ledger quay; HQ radio traffic), which is why their `expected_answers` separate (or fail to) across the COA set — the doctrinal source of thesis D.

The set is doctrinally shaped and no step is empty. One discipline gap to close in the fixtures: doctrine treats open questions as originating in **step-1 gaps** (note 00), so each KnowledgeObject should name its originating JIPOE step, making the "not invented conveniences" claim auditable rather than asserted. K11/K13 already read as step-4 indicators with named collection assets and NAIs; the annotation just makes the provenance explicit for all fourteen.

## 4. Shared homework with REMIT (DEC-3 channel, not silent coupling)

REMIT NF10 (its open item K2) requires band widths "derived from channel confidence/freshness, not arbitrary constants" — a *generative* rule (confidence → width). ASSAY reaches the same principle ("width is never arbitrary") from the opposite direction: because the JIPOE answer **is** the analyst-authored interval, confidence *bounds* width rather than *producing* it. Same invariant, inverted mechanism. This is a re-derivation datum for the findings ledger (§4.4 open item) and a REMIT register candidate — carried across the DEC-3 firewall as a candidate, never wired in.

## What we will do differently

1. **Adopt the ICD 203 WEP → percentage table** for every likelihood/probability band (K14 and any probability answer), authored to those ranges and cited; keep `confidence` and likelihood as separate fields, never conflated (ICD 203's own rule).
2. **Land the confidence → band-width floor** (low ≥ 0.25, moderate ≥ 0.10, high ≥ 0; `r = (hi−lo)/max(|lo|,|hi|)`, no midpoint) as the DEC-16 `annotations:` note on `ConfidenceBand`, enforced at `POST /knowledge` as a **warning lint**, not a refusal — recalibrated after Checkpoint-1 (DEC-27). `observed` exempt.
3. **Annotate each vignette KnowledgeObject with its originating JIPOE step**, so the doctrinal-shape claim is auditable; keep the step-1-gap origin explicit for the open collection questions.
4. **Record the REMIT re-derivation as a findings-ledger candidate** (confidence bounds width vs derives it) and route it through the DEC-3 candidate channel — no schema or code coupling.

Sources: ICD 203, *Analytic Standards* (ODNI, 2 Jan 2015) — estimative-language table and the confidence-vs-likelihood non-conflation rule; JP 2-01.3 (2014) ch. II (four-step process, event template/matrix, NAIs); ATP 2-01.3 (2019) for step-1/2 question framing; ASSAY register DEC-14/15/16/18, knowledge model §3, vignette §5/§7.

---

## Amendment (2026-07-15) — the JIPOE step annotation (SPEC-21)

§3 stated the discipline gap in its own words: each KnowledgeObject *should name its originating JIPOE step, making the claim auditable rather than asserted*. The JIPOE/C2 process review (`docs/reviews/2026-07-14-jipoe-c2-process-review.md` §4.1, action A7) and issue #43 both repeat the demand. This amendment closes it — it fixes the vocabulary, the per-object assignments, and the lint posture, per the DEC-11 gate for SPEC-21.

### A.1 Vocabulary

One LinkML enum, `JipoeStep`, whose four values carry JP 2-01.3 (2014) ch. II's step names verbatim:

| Value | JP 2-01.3 step (verbatim) |
|---|---|
| `step1_define_oe` | Step 1 — Define the Operational Environment |
| `step2_describe_effects` | Step 2 — Describe the Impact of the Operational Environment |
| `step3_evaluate_adversary` | Step 3 — Evaluate the Adversary |
| `step4_determine_adversary_coas` | Step 4 — Determine Adversary Courses of Action |

The slot is **singular by design**: it records the *originating* step — where the question was raised — not every step the answer later serves. An object that plausibly spans steps (terrain that is both a step-2 effect and a step-4 COA input) still names one origin; downstream *usage* is what the trace graph carries (`compiled_into`, `scored_from`), and duplicating it into a multivalued slot would assert relevance the graph already proves.

### A.2 Per-object assignments (the §3 audit, machine-carried)

The fixture assignments below restate §3's audit one object at a time. They are pinned by an oracle-style fixture test: a change to any row is a coverage/register matter, not a casual edit.

| K | Subject | Step | Reading of §3 |
|---|---|---|---|
| K1 | depths/beach gradients | `step1_define_oe` | OE bounds and physical characteristics |
| K2 | causeway load | `step2_describe_effects` | MCOO obstacle/terrain layer |
| K3 | civil population | `step1_define_oe` | OE significant characteristic |
| K4 | garrison strength/posture | `step3_evaluate_adversary` | adversary disposition |
| K5 | tide & storm D+0–4 | `step2_describe_effects` | weather effects (MCOO) |
| K6 | FAC sortie rate | `step3_evaluate_adversary` | adversary capability |
| K7 | AD envelope | `step2_describe_effects` | threat overlay as environmental effect (MCOO layer, per §3) |
| K8 | battery fire-control radar | `step3_evaluate_adversary` | adversary capability state |
| K9 | tide & storm D+2–9 | `step2_describe_effects` | weather effects (MCOO) |
| K10 | will to capitulate | `step3_evaluate_adversary` | see below — the one assignment §3 left open |
| K11 | mines loaded at Ledger quay | `step4_determine_adversary_coas` | event-matrix indicator at an NAI |
| K12a | mine stock (defector) | `step3_evaluate_adversary` | adversary capability (order of battle) |
| K12b | mine stock (manifests) | `step3_evaluate_adversary` | adversary capability (order of battle) |
| K13 | HQ radio traffic | `step4_determine_adversary_coas` | event-matrix indicator |
| K14a | R1 likelihood | `step4_determine_adversary_coas` | COA likelihood judgement |
| K14b | R2 likelihood | `step4_determine_adversary_coas` | COA likelihood judgement |
| K14c | R3 likelihood | `step4_determine_adversary_coas` | COA likelihood judgement |

**K10 (resolved here).** §3's audit skipped the refused, retired object. Its question — will the garrison capitulate by D+5 — is a judgement about adversary *will to fight*, which JP 2-01.3 places squarely in step 3 (evaluating adversary capabilities **and will**). K10 therefore carries `step3_evaluate_adversary`: retirement does not erase origin, and the refusal exhibit gains its doctrinal home. K14a–c carry step 4 explicitly — likelihood judgements about adversary COAs are step-4 products, which makes the scenario-weight firewall's doctrinal location visible in the object itself.

### A.3 Lint posture

A knowledge write lacking `jipoe_step` draws a **warning-level lint** (`missing_jipoe_step`), mirroring the §2 width lint's v1 posture: never a refusal, recalibrated after Checkpoint-1 SME reaction (DEC-27). The forward-derivation programme (issue #43) needs the discipline at write time; the demonstrator needs only the warning.

One deliberate divergence from the width lint: **`observed` values are NOT exempt.** The width exemption protects fact from a precision test that only bites assessments (DEC-14); origin is different — every question was raised somewhere in the process, survey charts included, so the annotation applies to every source class. Open questions are likewise covered: they are precisely the step-1-gap-origin objects §3 called out.

Sources (amendment): JP 2-01.3 (2014) ch. II — the four steps by name, adversary evaluation including will to fight, event matrix/NAI indicators; review `2026-07-14-jipoe-c2-process-review.md` §4.1/A7/addendum S-A; issue #43; ASSAY register DEC-6/11/14/21/27.
