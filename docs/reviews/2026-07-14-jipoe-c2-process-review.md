# ASSAY — JIPOE & Joint C2 Process Review

**Date:** 2026-07-14 · **Type:** advisory review (not a research note, not a stage gate)
**Scope:** the logic of the pipeline; command-and-control fidelity; adherence to JIPOE (JP 2-01.3 / ATP 2-01.3) and joint planning (JP 5-0 / MDMP / COPD) processes; prior works; gaming and wargaming precedents; new interaction concepts; a prioritised action plan.

**Standing.** This document decides nothing (ASSAY-DEC-2 respected). Every recommendation that implies a decision is flagged **[register candidate]**; every build recommendation is flagged research-first (DEC-11). It changes no canonical document, no schema, no code. It is input to the queue, not the queue.

**Method.** Full read of the canonical set (concept, register, constitution, vignette, walkthrough, knowledge model, seam contract, findings, plans), all research notes 00–09 plus the horizon forward-derivation note, the spec-kit slices, and the live issue queue (#11, #12, #24, #43); external research across JP 2-01.3 / ATP 2-01.3 / JP 5-0 / FM 5-0 / ICD 203 / PHIA / COPD-TOPFAS / JADC2, the computational decision-support literature (Deep Green, RDM/ABP, info-gap, COMPOEX/COMPASS, CADET/RAID, JWARS, ACH), and the professional/commercial wargaming corpus (Perla, Sabin, UK Wargaming Handbook, matrix games, MORS/Connections, Downes-Martin, CMO, Into the Breach, and others cited inline).

---

## 1. Executive summary

ASSAY's central bet — that JIPOE Q&A can be typed, banded, and exploited by planning machinery *without laundering judgement into false precision* — survives this review intact, and is better supported by doctrine and prior art than the project's own documents currently claim. The strongest findings:

1. **The honesty machinery is the real contribution, and it is doctrinally conservative, not radical.** ASSAY's objects map almost one-to-one onto JIPOE/IPB products (channels ↔ MCOO; `expected_answers` ↔ event matrix; staleness/validity ↔ DSM "latest time information is of value"; the handful ↔ the *distinguishable* COA validity criterion; the verdict matrix ↔ the wargame worksheet / synchronization matrix). ASSAY computes what doctrine asks staffs to eyeball. This framing — *automation of owed doctrinal products, not a new theory of planning* — is underused in the project's own communications and should lead every SME conversation (§4, §8).

2. **ASSAY is doctrinally radical in exactly two places, and both are defensible from inside the canon.** It deletes the weighted COA comparison matrix (JP 5-0 offers it only as a *sample* technique; the MCDM-critique literature has never rehabilitated it; NDM field evidence says staffs back-fill it anyway), and it refuses scenario-likelihood weighting (departing from JIPOE's most-likely rank-ordering but aligning with the most-dangerous requirement, with RDM/assumption-based planning/info-gap prior art, and with the Mattis critique of predictive overreach). Both refusals should be published as a *divergence register* rather than discovered by SMEs mid-demo (§4.4, action A1).

3. **The biggest fidelity gap is not knowledge — it is the decision loop.** ASSAY models JIPOE's *products* well but stops one step short of the artefact that makes JIPOE matter to a commander: the **decision support template/matrix** — decision points, tied to NAIs, with a latest-time-information-is-of-value. Nearly every ingredient already exists in the seam (commitments, verdicts, validity windows, collection options with `earliest_result`, discrimination ranking). Deriving a DSM surface from them is the single highest-value doctrinal move available (§4.2, action B1).

4. **The wargaming step is the missing C2 process, and there is an honest path to it short of thesis H.** JPP step 4 (COA analysis: action–reaction–counteraction) is where staffs actually stress plans; ASSAY currently scores static worlds. But the doctrinally honest near-term move is not a reactive adversary model — it is positioning ASSAY as the *adjudication-support instrument* inside a human wargame. The UK Wargaming Handbook explicitly says analytical support to adjudication should present "a spread of outcomes such as the best, worst and most likely cases" and warns that averaging "can all too easily sideline important conclusions about the vulnerability of plans to chance and bad luck" — a doctrinal endorsement, almost verbatim, of banded scoring and the minimax strip (§6.1, action B2).

5. **The logic holds, with a short list of genuine probes.** The four-stop verdict mapping, ε-non-domination organiser, lexicographic relaxation, minimax tensor, tornado sensitivity, band-separation discrimination, and trace-walk staleness are internally coherent, oracle-pinned, and G6-sound. The probes that matter: the citation asymmetry (inventions less grounded than rejections — §5.2), the near-unreachability of `marginal` in continuous domains (§3.1), the pairwise-separation pathology in discrimination (§3.4), the admitted C5 override-precedence wrinkle (§3.6), and the undemonstrated *positive* half of the scenario-weight firewall — the claim that weights "order attention and reporting" has no visible implementation anywhere in the surfaces (§3.5). That last one is quietly important: it is the only register-blessed behaviour this review could not find evidence of.

6. **The gaming world has already run ASSAY's core UX experiment, and ASSAY is on the right side of it.** Mainstream games solved probability distrust by *fudging numbers toward player expectation* (XCOM aim-assist, Fire Emblem true-hit, Sid Meier's playtest findings) — the exact move ASSAY's constitution forbids. The counter-school — Into the Breach's fully telegraphed consequences — proved that total mechanical legibility is playable, popular, and trust-building. ASSAY is the Into-the-Breach school applied to J-2 knowledge, and several of that school's concrete mechanics (consequence preview before commit, public outcome tables, recursive provenance tooltips, AAR time-scrubbing) transfer directly (§6, actions B3–B6).

The prioritised action plan is at §9. Nothing in it displaces the open queue (#11 SME checkpoint, #12 REMIT handoff, #24 dependency view, #43 forward derivation); it sequences around it.

---

## 2. What ASSAY is, in one paragraph (reviewer's restatement)

A demonstrator in which JIPOE-derived questions and answers are immutable, content-addressed, typed objects carrying closed-interval bands and four-way source-class provenance; a compile firewall refuses contested, stale, unwaived, or judgement-laundering knowledge; a real (even in the mock) scorer propagates intervals through plan metrics to four-stop verdicts; generation returns a small diverse non-dominated handful rather than a winner; infeasibility returns a least-worst relaxation frontier in command language rather than silence; robustness is worst-case across named adversary COAs rather than a weighted blend; and sensitivity, discrimination, and staleness analyses tell the J-2 what the decision is leaning on, what to collect next, and what a changed answer invalidates — all of it walkable through a first-class trace graph terminating in named owners, all of it deterministic under a content stamp, and all of it demonstrated on one hand-checkable fictional vignette (Meridian) whose oracles are frozen.

---

## 3. Review of the logic

The pipeline's internal logic is in good shape: every stage is gated by a research note that names the standard alternatives and rejects them for stated reasons; the oracle cases pin the scorer; G6 (widening inputs never narrows outputs) is asserted by property-based testing. The items below are probes, not defects — ordered by how much they matter.

### 3.1 The four-stop verdict mapping
The signs-only mapping over the signed margin band (robust `m_lo>0`, marginal `m_lo=0≤m_hi`, tight `m_lo<0≤m_hi`, violated `m_hi<0`) is correct and is the unique O-3-satisfying rule. Two observations:

- **`marginal` is measure-zero in continuous domains.** It fires only when a band edge *exactly* equals the threshold. Meridian's integer timesteps make it reachable; any future continuous metric makes it vanish, and the four-stop scale silently becomes three-stop. This is fine — but it should be *stated* (in the scorer note or the legend), because an SME who never sees `marginal` will ask whether the scale is honest about itself.
- **The mapping has uncited prior-art twins that would strengthen it.** The classification is structurally the possibility/necessity pair from possibility theory (Dubois & Prade): robust = necessarily satisfied, tight = possibly-but-not-necessarily satisfied, violated = necessarily violated. It is also info-gap decision theory's satisficing-robustness posture (Ben-Haim): margin against a requirement, not expected utility. Citing these converts "we invented a scale" into "we re-derived the standard interval-satisficing classification under our constraints" — strictly stronger for a doctrinal audience. See §5.2 and action A2.

### 3.2 Interval propagation
Moore-style interval arithmetic is the right honest floor, and G6 follows from inclusion-monotonicity. One known cost should be stated somewhere visible: **the dependency problem** — naive interval arithmetic treats repeated variables as independent, so bands widen faster than the true uncertainty when the same channel band feeds a metric multiple times (e.g. exposure summed over many legs through one region). This is conservative in the honest direction (never narrower than truth, G6-compatible), but at dense-world scale it will produce `tight` verdicts that a sharper propagation would call `robust`. Worth one paragraph in note 03 as a stated limitation, and worth remembering when SMEs say "that band looks too wide" — the honest answer is "yes, by construction; here is why."

### 3.3 Relaxation
The lexicographic / inclusion-minimal correction-set design is the best-argued piece of the corpus (note 04 names weighted CSP, MAX-SAT, and Archimedean goal programming and rejects each on DEC-19 grounds — exemplary). Probes:
- **`sacrificed` ≡ exactly the `violated` set** means a candidate that degrades a `must` from robust to `tight` registers no sacrifice. The risk residue *is* displayed in the matrix, so nothing is hidden — but the relaxation card's headline ("sacrifices C4") under-describes a candidate that also drags two other commitments to the edge. Consider a secondary "put at risk" line on the card, derived from verdict deltas versus the incumbent plan. **[cheap; no schema change]**
- **The content-neutral tie-break is correct and should stay** — but the note's own observation that an *elicited* within-tier ordering is the real answer deserves a queue pointer, because it is exactly what a commander will ask for in an SME session ("why is C3 listed before C4?" — "commitment-id order" is honest but will read as evasive once, and as discipline only if the elicitation path is named).

### 3.4 Discrimination
The band-separation metric (disjoint → positive separation, overlap → negative) is a clean, distribution-free diagnosticity measure — genuinely ACH's diagnosticity concept made computable, and better than ACH's subjective cell-scoring. Probes:
- **Pairwise best-separation can mislead with >2 live COAs.** A question that cleanly separates R1 from R3 but not R1 from R2 can outrank one that moderately separates the *operative* pair. The metric should (eventually) be conditioned on which pair the current plan's verdicts actually turn on — the walkthrough's beat 6 gestures at this ("P2's margin under R2 vs R3m turns on whether the strait is mined") but the ranking itself is pair-agnostic today.
- **Nested vs partially-overlapping bands both score negative** but are epistemically different situations (a nested expected answer can never discriminate; a partial overlap can, with a lucky observation). Fine for v1; worth a note.
- `ExpectedAnswer` provenance ("who says the COA would look like that?") is already an open item in the knowledge model — this review seconds it; the event matrix is an assessment and currently the only major assessed content without its own provenance chip.

### 3.5 The scenario-weight firewall — the positive half is undemonstrated
The negative half of DEC-15/§9 (weights never compile) is exercised by K14 and tested. The *positive* half of the register's claim — likelihood weights "**order attention and reporting**" — could not be traced to any implemented behaviour: no queue on S1 sorts by K14, no strip on S2 orders scenarios by likelihood band, no surface renders the K14 bands at all as far as this review could find. This matters doctrinally: JIPOE *requires* a likelihood rank-ordering of adversary COAs (it is a J-2 judgement, and doctrine puts it in the product set). ASSAY's design already has the honest answer — the ordering exists, is banded, is contestable, and influences *attention*, never *arithmetic* — but right now the demonstrator shows only the refusal, not the legitimate use. An SME will read "we hold likelihoods but do nothing visible with them" as a gap, not a discipline. **Recommendation:** render K14's overlapping bands on the scenario strip (ordered by band, visibly overlapping, visibly *not* feeding the verdicts) and let the S1 queue tie-break on scenario weight where discrimination is equal. **[register candidate — it sharpens what "order attention and reporting" means; likely a small one]** (action A4).

### 3.6 Compile-overlay precedence (the C5 wrinkle)
Note 04 admits that under R3m the causeway-demolition override coincides with the base engineering estimate's region and innermost-wins keeps the base value, so C5 scores *satisfied* in a world whose story says the causeway is down. The note correctly assigns this to compile semantics, not `/relax`. It is currently recorded only inside a research-note parenthetical. It should be an issue on the queue — it is the one place this review found where the computed world and the vignette's narrative disagree, and that is precisely the class of defect the walkthrough's §0 rule exists to catch. (action A5).

### 3.7 Generation and coverage
The horizon note's analysis is right and this review will not restate it — the generator basis is authored, the scoring is honest, and "no silent COA-family drop" is the correct candidate invariant. One addition: **the same coverage argument applies to the red side.** Minimax is only as honest as the scenario set it ranges over; R1–R3 are hand-authored, and a worst case over an incomplete red set is a false floor. The doctrinal question ("have we templated all valid adversary COAs, including most-dangerous?") is JIPOE step 4's own discipline. When "no silent COA-family drop" is drafted as a register candidate, it should be drafted to cover *both* generators — blue COAs and red COA templates (the §2.4 derivation path in the horizon note). (feeds #43; action C1).

### 3.8 Smaller items
- **README staleness:** the README still says "implementation has not started"; the delivery plan, CLAUDE.md, and the repo say Stages 0–7 are built. A batch-propagation miss — trivial fix, but it is the public face contradicting the honesty principle ("nothing shown as done that is not" cuts both ways: nothing built shown as unbuilt). (action A6).
- Two minor citation date inconsistencies (Savage 1951/1954 in note 06; Lipkus & Hollands 1999/2006 in note 09) — fold into the citation-hardening pass (action A2).

---

## 4. Doctrinal fidelity — JIPOE and the joint planning process

### 4.1 The crosswalk (what maps, what's absent)

| JIPOE / JPP artefact (JP 2-01.3, ATP 2-01.3, JP 5-0, FM 5-0) | ASSAY analogue | Fidelity |
|---|---|---|
| Step 1 — define/bound the OE; significant characteristics; gaps → collection requirements | absent (admitted; horizon note §2.1) | **gap** — the demonstrator starts at "here are the 14 that matter" |
| Step 2 — describe effects; MCOO (overlays, mobility classes); weather | sparse channels (`default` + `RegionOverride`), DEC-29 explicitly derived from MCOO doctrine; K5/K9 weather with validity windows | **strong** |
| Step 3 — evaluate adversary; ORBAT, capabilities; HVT list; COG analysis | red ORBAT is vignette prose, not typed objects; no HVT/COG shapes | **partial** — untyped, by design (thesis G deferral); should be *stated* as a deliberate absence |
| Step 4 — adversary COAs; situation/event templates; event matrix; MLCOA/MDCOA | R1–R3 as first-class `ScenarioCOA`s; `expected_answers` = event matrix (DEC-18); minimax = MDCOA discipline generalised | **strong on products, hand-authored on derivation** (#43 §2.4) |
| Indicators / NAIs / collection | open questions with `collection` options, banded cost, `earliest_result`; discrimination ranking | **strong conceptually; NAI geography untyped** — a collection option has no geographic anchor, so "where to look" is textual, not spatial |
| PIR / CCIR tied to decisions | walkthrough beat 5: verification priorities rise on knowledge under a committed decision — the CCIR loop, computed | **strong** — this is the single best C2 moment in the system and deserves top billing in demos |
| **Decision support template / matrix (DP × NAI × TAI × LTIOV)** | ingredients all present (commitments, verdicts, validity windows, `earliest_result`, discrimination); artefact absent | **the gap most worth closing** — §4.2 |
| COA validity: feasible / acceptable / suitable / **distinguishable** / complete | hard constraints / commitments / C1-as-mission / **the handful + `distinct_because`** / not addressed (plans are routes+windows, DEC-20) | **strong** — the handful directly operationalises the criterion staffs most often fake |
| COA analysis — wargaming (action–reaction–counteraction) | absent; scorer evaluates static compiled worlds | **gap with an honest bridge** — §6.1 |
| COA comparison — weighted decision matrix | deliberately deleted; replaced by verdict matrix + ε-non-domination + stated tie-breaks | **deliberate divergence, defensible** — §4.4 |
| Synchronization matrix / wargame worksheet | the verdict matrix + delta log *are* a computed, always-current sync record | **strong — but unclaimed**; say it in SME language |
| Running estimates | staleness flags = the machine-checkable running estimate ("is the plan still valid, and exactly where not") | **strong; novel relative to doctrine** — JPP has no mechanism connecting a specific stale fact to specific verdicts |
| Assessment (MOE/MOP), execution | out of scope (no execution model) | fine — state it |

### 4.2 The DSM is the missing keystone
JIPOE earns its keep in doctrine at the point where intelligence products drive *decisions in time*: the decision support template/matrix, where each decision point is tied to the NAI whose indicator confirms/denies the branch, with a latest time the decision is valid. ASSAY has quietly built almost every ingredient: a commitment whose verdict is `tight` under scenario divergence *is* a decision point; the discriminating open question *is* the NAI's indicator; `collection.earliest_result` vs the decision's timestep *is* the LTIOV calculation; staleness flags *are* DSM re-validation. What is missing is only the artefact that assembles them — and it is the artefact commanders and J-3s actually recognise. A derived **DSM surface** (per selected plan: decision points, the knowledge that discriminates them, the collection that answers in time, the drop-dead step) would be the strongest doctrinal exhibit ASSAY could add, and it is largely a *projection* of existing objects, in keeping with DEC-5 ("surfaces are config-declared projections"). **[register candidate + research note first — the DP derivation rule ("which verdicts constitute a decision point") is a real design decision]** (action B1, mockup M1).

### 4.3 The likelihood-ordering slot
Covered at §3.5: doctrine requires a rank-ordered adversary COA set; ASSAY holds the ordering as banded knowledge and refuses to compute with it, but currently gives it no visible role. Implement the "orders attention and reporting" half. The divergence itself (no *arithmetic* use of likelihood) is defensible and should be published, not discovered (§4.4).

### 4.4 Publish the divergence register
ASSAY departs from written doctrine deliberately in a small number of places. Each departure has a defence, but today the defences live scattered across research notes. Collect them into one short, SME-facing **divergence register** (a comms artefact, DEC-30 category, not a spec):

1. **No weighted COA matrix** — JP 5-0 offers it as a sample technique; the MCDM-critique literature (subjective weights projecting false rigour; ordinal-as-cardinal; winner flips under tiny weight changes; NDM evidence of back-filling) has never rehabilitated it; ASSAY delivers the matrix's legitimate function (organised comparison, `distinct_because`) without the illegitimate one.
2. **No scenario-probability arithmetic** — departs from MLCOA-first planning; aligns with the MDCOA requirement, with RDM/ABP/info-gap, and with ICD 203/PHIA's stance that likelihood is a human judgement. ASSAY leaves the judgement where doctrine puts it.
3. **No adversarial reaction dynamics** — ASSAY supports COA *comparison* honestly; COA *analysis* (the wargame) remains a human activity ASSAY should *instrument*, not replace (§6.1). Thesis H is the eventual computed answer.
4. **No civil-harm quantification** (DEC-35) — proportionality weighing is the commander's judgement; C3 is a geometric red line. (Anticipate the LOAC-literate objection that doctrine *does* weigh anticipated harm: ASSAY's answer is that the *system* refuses to pre-compute the weighing, not that the commander is spared it — the trade is surfaced, banded, and left on the commander's desk, which is where JP 5-0's acceptability criterion puts it.)
5. **No execution/assessment model** — MOE/MOP out of scope.

This one page, handed to SMEs before Checkpoint 1's free exploration, converts every "wait, where's the—" into "as stated." (action A1).

### 4.5 C2 and JADC2 positioning
ASSAY's refusal posture is best framed not as anti-automation but as **mission-command-compatible automation**: it accelerates the auditable parts (compile, score, trace, staleness — machine-speed) and refuses to accelerate the judgement parts (likelihood, value trade-offs, selection — commander-speed). Against the JADC2 "speed of relevance" rhetoric this is a differentiated and defensible position, closer to ADP 6-0 than to the automation-forward reading of JADC2, and it should be one of the comms plan's talking points. The walkthrough's beat 5 (a committed decision *re-prioritises the J-2's queue* with no email, via a forward trace walk) is the demonstrator's best C2 moment and the most JADC2-relevant: it is machine-speed *staff coordination* in service of human-speed command.

---

## 5. Prior works — positioning and probes

### 5.1 Where ASSAY sits
- **DARPA Deep Green** (Surdu; Blitzkrieg/Crystal Ball/Commander's Associate) shares the options-not-optimum philosophy ("select the COA that has the most, and best, options at the last minute") but built its core on *estimating the likelihood of futures* — precisely the move ASSAY firewalls. Deep Green never fielded; its foundering on simulation scale/faithfulness is indirect support for ASSAY's small-frozen-tableau, honesty-first strategy.
- **RAND RDM / exploratory modeling** (Lempert, Bankes) and **assumption-based planning** (Dewar): ASSAY's minimax posture, sensitivity ranking (= load-bearing assumptions, computed), and staleness flags (= signposts, computed) are this family transposed to operational planning — with a *stronger* honesty stance than RDM itself, which typically retains regret measures (note 06 rejects minimax regret for laundering absolute failure into relative shortfall).
- **Info-gap decision theory** (Ben-Haim): the closest structural prior art to the signed-margin verdicts (satisficing robustness against a requirement). ASSAY dodges the standard Sniedovich critique (robustness local to an estimate) by using *given assessed bands* rather than unbounded uncertainty families. Cite it (§3.1).
- **COMPOEX / COMPASS**: the PMESII-causal-model road ASSAY deliberately does not take (thesis G, "highest false-precision risk"). ASSAY's trace graph is provenance-causal, not world-causal — a defensible narrowing that avoids the ONA/SoSA failure mode named in the Mattis 2008 EBO memo. ASSAY is, in a real sense, *the anti-ONA built from the Mattis critique*: it refuses predictive causal scoring while keeping action-to-purpose linkage (commitments + traces). That sentence belongs in the comms plan.
- **CADET / RAID / JADE**: automated plan *elaboration*; ASSAY automates *evaluation and honesty bookkeeping* instead. Complementary, not competitive.
- **ACH** (Heuer): discrimination is ACH diagnosticity made computable, and it repairs ACH's known weakness (subjective cell scoring — Dhami et al. 2019 found ACH does not reliably debias) by grounding diagnosticity in banded expected observations.
- **Kent → Barclay → ICD 203 → PHIA → NATO SAS-114**: the estimative-language lineage is ASSAY's strongest inheritance — doctrine already refuses point estimates in prose; ASSAY makes the refusal *mechanical and propagating* (G6), which nothing in the lineage does. The one critique to pre-empt: Friedman & Zeckhauser's argument that banding discards resolution. ASSAY's answer: the band is the assessed input's honest width, not a discretisation of a known distribution; and the width itself is confidence-linted (note 01).

### 5.2 The citation asymmetry — the review's main scholarly finding
The research notes engage prior art most rigorously exactly where they **reject** it (weighted CSP/MAX-SAT/goal programming in note 04; Wald/Savage/Mulvey in note 06; Howard/Lindley/Saltelli in note 08; the full uncertainty-communication literature in note 09) and least where they **invent** the replacement:

| Invention | Current grounding | Available grounding |
|---|---|---|
| Four-stop signed-margin verdict scale (note 03) | internal (O-3 uniqueness) | possibility/necessity (Dubois & Prade); info-gap satisficing (Ben-Haim); interval orders (Fishburn) |
| Band-separation discrimination metric (note 08) | none | imprecise-probability information-value literature; interval separation measures |
| Time-varying cost handling (note 02) | "the routing literature", uncited | the classical time-dependent shortest-path literature (e.g. Cooke & Halsey 1966; Orda & Rom 1990) |
| Glow / propagation visibility (note 05) | none | reactive dataflow (already cited later in note 07 — Bainomugisha et al.); spreadsheet dependency-tracing research |
| "No silent COA-family drop" (horizon note) | self-described as novel | red-teaming doctrine's COA-completeness checks; coverage metrics in search/test-generation |

None of these gaps threatens correctness — but the pattern means the *novel positive machinery is asserted where it could be situated*, and the project's credibility with exactly its target audience (doctrinally and analytically literate SMEs) is cheapest to buy here. A one-day **citation-hardening pass** over notes 02/03/05/08 (adding the named prior art, fixing the two date inconsistencies) is the highest ratio of credibility-per-hour available in the whole action plan. **[doc-only; no decisions implied]** (action A2).

---

## 6. Gaming and wargaming precedents

### 6.1 Where ASSAY sits in the adjudication taxonomy — and the seminar-wargame opportunity
The professional taxonomy (rigid / semi-rigid / free / minimal adjudication; UK Wargaming Handbook §3.11, Turnitsa, Downes-Martin) has no slot for what ASSAY is: **rigid adjudication mechanics with free-kriegsspiel epistemics** — deterministic and reproducible (same stamp + seed ⇒ identical output), yet honest about ignorance by *banding and refusing* rather than by human override. Naming this position matters because the wargaming community's standing objection to rigid/computerised adjudication is that "the game system is the final word" while hiding what it doesn't know; ASSAY is a rigid adjudicator built to say what it doesn't know. Three further hooks from the professional literature:

- **UK Wargaming Handbook §3.12(a)**: analytical support to adjudication should present "a spread of outcomes such as the best, worst and most likely cases" — banded adjudication support is *doctrinal*. §3.12(c) warns that moderating toward average outcomes "can all too easily sideline important conclusions about the vulnerability of plans to chance and bad luck" — a doctrinal argument for the minimax strip, quotable in demos.
- **Downes-Martin's adjudication critiques** ("Diabolus in Machina"; "Three Witches" — sponsors leaning on adjudication mid-game): ASSAY's byte-identical stamps, frozen oracles, and refusal banners are an engineering answer — the machinery cannot be leaned on without leaving a trace.
- **Reddie et al., *Science* 2018** (wargaming lacks reproducibility and data capture): G1 determinism and typed deltas are exactly the reproducibility being called for.

Together these make a strong claim for **positioning ASSAY as the adjudication-support and record-keeping instrument inside a human seminar wargame** — the process tools that exist (Dstl SWIFT, Exonaut) manage turns and injects but have no epistemics: none of them band, trace, or refuse. That lane is open, it is the honest precursor to thesis H (the humans supply the reaction/counteraction; ASSAY re-scores and records), and it converts the missing JPP wargaming step (§4.1) from a gap into the product's next natural home. (action B2, mockup M2).

### 6.2 The legibility school (what to borrow from games)
- **Into the Breach** (Subset Games): the existence proof that removing hidden probability — fully telegraphed enemy intent, previewed knock-on consequences before commit — is playable and beloved. Its two transferable mechanics: **consequence preview on hover** (before committing a knowledge edit/resolve/supersede, show the ghost-diff of the verdict matrix that would result — ASSAY can compute this with the real pipeline, so the preview is honest by construction) and **bounded, visible undo** (safe-to-fail experimentation without hiding that it happened — the sandbox already gestures at this).
- **The fudging school as the cautionary tale**: XCOM's hidden aim-assist and Fire Emblem's true-hit double-RNG are the industry's admission that *displayed* probability without trust machinery fails socially. ASSAY's answer to the same trust problem is provenance + trace + determinism instead of fudge — worth one slide in any wargamer-facing talk.
- **Combat Results Tables**: the hex-and-counter CRT — the entire outcome distribution public to both players before the roll — is arguably the oldest honest-banded-verdict UI in existence. Rendering ASSAY's margin-band → verdict mapping as a small, always-visible **public legend** ("the CRT") is the wargamer-native way to explain the four-stop scale and directly answers "is the verdict a hidden judgement?"
- **Command: Modern Operations' Area of Uncertainty**: contacts carry uncertainty *ellipses* that shrink with sensor fixes, and launch decisions gate on AOU width vs seeker tolerance ("optimistic/pessimistic" policies). Two borrowings: **spatial bands** (ASSAY's map panel, DEC-31c, should render banded *geometry* — uncertainty regions on the strait/causeway — the geometric twin of the band pill), and the precedent that **uncertainty-width decision gates** (ASSAY's refusals) already exist in a tool the defence audience accredits.
- **Crusader Kings 3 nested tooltips**: every displayed number decomposes on hover into named contributors, recursively (depth-capped). The one-hop trace menu should become recursive-on-demand — with the additive-modifier breakdown replaced by ASSAY's actual interval-arithmetic steps.
- **Kriegsspiel double-blind / Roll20 GM layer**: the umpire owns ground truth and rations perception. ASSAY's role tabs are already a "digital umpire's table"; the borrowable increment is **facilitator reveal controls** in narrative mode (e.g. hide the scenario strip until the audience commits to a most-likely answer; then reveal the minimax collapse — the "don't plan on most-likely" demo moment staged as a reveal, which is how professional facilitators actually teach it).
- **GMT COIN series**: per-faction decision menus on a shared sequence track — precedent for **per-role action menus** (the J-2's legal acts are collection/contest/resolve; the planner's are compile/generate/relax; the commander's are select/waive) rather than a uniform toolbar; it makes the role separation legible as *different verbs*, which is the C2 point.
- **Matrix games** (Engle; MaGCK): the move format — claim + numbered supporting arguments + counter-argument slot + adjudicated outcome — is a proven facilitator-friendly rhetorical form for exactly what relaxation cards and refusal banners already contain. Formatting them as argument cards (each numbered reason a traceable knowledge object) is presentation-only and connects ASSAY to a technique Dstl/NATO SMEs already use.
- **Tacview / AAR practice**: the delta log + stamp history is already an event-sourced record; a **time-scrubber** over it (drag to replay compiles, verdict flips, refusals, glow re-firing at each step) gives the observer tab a true after-action-review mode, and Stage-7 narratives become curated scrub paths. The military AAR frame maps exactly: planned = plan + commitments; happened = verdict history; why = trace walk; next = sensitivity/discrimination.
- **Hobby-professional crossover** (Gulf Strike 1990; Volko Ruhnke; Littoral Commander; USMC OWS): precedent that credibility can arrive *through* the wargaming community rather than around it — an argument for adding a professional-wargaming SME (MORS/Connections/Dstl orbit) to the checkpoint panel alongside the J-2/J-3 SMEs (action A3).

---

## 7. New interaction concepts (mockup candidates)

Ordered by (doctrinal value × cheapness). Each is a *candidate* — the interactive ones need a register candidate and/or research note per project discipline before build.

- **M1 · The Decision Support Matrix surface.** Per selected plan: rows = derived decision points (commitments whose verdicts are `tight`/scenario-divergent), columns = the discriminating knowledge (the "NAI"), the collection option that answers it, `earliest_result` vs the decision step (the LTIOV, computed — including the honest red state "this collection cannot answer in time"), and the staleness tripwire. Wireframe: an S2-adjacent tab, one row per DP, band pills throughout, every cell trace-walkable. *The doctrinally-native killer exhibit.* (§4.2)
- **M2 · Turn-cycle wargame mode (adjudication-support).** A facilitated action–reaction–counteraction loop: blue states a plan beat; facilitator/red picks the scenario response (human judgement, where doctrine puts it); ASSAY recompiles/re-scores; the delta log auto-generates the wargame worksheet / recorder's record. The minimax tensor becomes the familiar three-beat cadence; the tool is its own recorder (answering the CALL critique that manual wargames lose their audit trail). Honest precursor to thesis H — the adversary reacts, but a human plays them.
- **M3 · Consequence preview (ghost diff).** Hover/arm any mutating act (resolve, supersede, waiver grant, plan edit) → preview the real verdict-matrix diff before commit. Into-the-Breach's contract, honest because it runs the real pipeline. Pairs naturally with the existing glow (preview = glow-before-the-fact).
- **M4 · The public verdict legend ("the CRT").** A small always-visible diagram mapping margin-band position → four-stop verdict, with the O-3 sweep as its illustration. Presentation-only; kills the "is the verdict a hidden judgement?" question wargamer-natively.
- **M5 · AAR time-scrubber.** Scrub over stamp/delta history on the observer tab; narratives become curated scrub paths; wall-projection replays the heartbeat hands-free.
- **M6 · Spatial bands on the map panel.** Banded geometry (mine-threat uncertainty regions, battery-arc bands under K8's band, K7's envelope as an annulus of width = the band) rendered CMO-AOU-style. The band pill's geometric twin; makes G2 visible on the map, not only in tables.
- **M7 · Recursive provenance tooltips.** CK3-style depth-capped recursive expansion of the trace menu, breakdown = the actual interval arithmetic per hop.
- **M8 · Argument-card formatting + a "challenge" affordance.** Relaxation cards and refusal banners in matrix-game move format (claim, numbered reasons, counter-slot); a red-team button on any verdict surfacing the top sensitivity contributors as a key-assumptions check (UK Red Teaming Handbook's technique, computed) — "this verdict leans on K8 (single-source): challenge it."
- **M9 · Facilitator reveal controls.** Roll20-GM-layer staged reveals in narrative mode (hide/reveal panels per beat); the "don't plan on most-likely" moment staged as commit-then-reveal.
- **M10 · Per-role action menus.** COIN-style legal-verb menus per tab, making the C2 role separation legible as different action sets. (Cheap; mostly information architecture.)
- **M11 · Scenario-weight attention strip.** K14's overlapping likelihood bands rendered on the scenario strip — ordering attention, visibly not feeding arithmetic (the positive half of the firewall, §3.5).

---

## 8. New ways of working

- **W1 · Lead SME sessions with the crosswalk, not the theses.** The §4.1 table ("ASSAY computes the products you already owe: MCOO, event matrix, sync matrix, running estimate, CCIR loop") is a stronger opening than the thesis catalogue, which frames ASSAY as a claim to be doubted rather than an automation of owed work. Hand over the divergence register (§4.4) before free exploration.
- **W2 · Add a professional-wargaming SME to Checkpoint 1** (issue #11 currently specifies J-2/J-3 backgrounds only). The wargaming community has spent a decade litigating adjudication honesty (§6.1) and will both stress-test and evangelise. Add two fixed questions: *does the verdict legend read as a CRT or as a black box?* and *does the K14 strip read as honest attention-ordering or as a dodge?*
- **W3 · Run one seminar-wargame-with-ASSAY session** (M2 in cardboard form — ASSAY on the wall as adjudication support for a manual Meridian turn, facilitator-driven) before building anything. It tests the biggest positioning hypothesis of this review at near-zero build cost, and it generates findings-ledger entries under the existing DEC-27 capture rule.
- **W4 · Citation-hardening as standing discipline.** Beyond the one-off pass (A2): adopt "inventions cite their nearest prior art or state that none was found" as a research-note convention — the asymmetry of §5.2 arose because rejection arguments *need* citations to work while inventions don't, so the discipline must be explicit.
- **W5 · Annotate K1–K14 with their originating JIPOE step** in the fixtures (note 01 §3 already demands this; issue #43 repeats it). It is a small fixture change that turns "doctrinally shaped" from asserted to auditable, and it is the first concrete step of the forward-derivation programme.
- **W6 · Wargame the demo.** Before Checkpoint 1, run the Downes-Martin "Three Witches" exercise against ASSAY's own demo plan: who (sponsor, boss, player) could lean on this demonstration, and what would that look like? The project has engineering answers (stamps, oracles, refusals); rehearse them as answers.

---

## 9. Prioritised action plan

Triggers follow the queue conventions. **[RC]** = requires a register candidate (concept §6) before any build; **[doc]** = documentation/comms only, no decision implied; **[fix]** = defect-class, register-neutral.

### Tier A — Now (before / alongside SME Checkpoint 1, issue #11)
| # | Action | Cost | Why now |
|---|---|---|---|
| A1 | Author the **divergence register** (§4.4) as a comms artefact; hand it to SMEs before free exploration | ½ day **[doc]** | converts every doctrinal "where's the—" from ambush into statement; feeds W1 |
| A2 | **Citation-hardening pass** over notes 02/03/05/08 + fix the two date slips (§5.2, §3.8) | 1 day **[doc]** | cheapest credibility available; the target audience is exactly the one that checks |
| A3 | **Extend Checkpoint 1**: add a professional-wargaming SME; add the two fixed questions (W2) | hours **[doc]** | issue #11 invitations have lead time; the panel composition decision is now or never |
| A4 | File issue: **K14 attention-ordering undemonstrated** (§3.5, M11) | hours **[RC]** (small) | the only register-blessed behaviour with no visible implementation; SMEs will find it |
| A5 | File issue: **C5 / compile-overlay precedence** (§3.6) | hours **[fix]** | computed world contradicts vignette narrative; walkthrough §0-class defect |
| A6 | Fix the **README status line** (§3.8) | minutes **[fix]** | public face contradicts the honesty principle |
| A7 | Annotate **K1–K14 with originating JIPOE step** in fixtures (W5) | ½ day **[fix]** | already demanded by note 01 §3; first concrete #43 step; makes the doctrinal-shape claim auditable |

### Tier B — Next (after Checkpoint 1, sequenced by SME reaction)
| # | Action | Cost | Dependencies |
|---|---|---|---|
| B1 | **DSM surface** (M1): research note (DP derivation rule, LTIOV computation) → register candidate → spec | note: 1–2 days; slice: moderate **[RC]** | none technical — all inputs exist; run the note past Checkpoint-1 SMEs first |
| B2 | **Seminar-wargame positioning**: run W3 (manual session, ASSAY as adjudication support); if it lands, research note for M2 (turn-cycle mode) | session: 1 day; note follows **[RC]** | W2/W3; the honest precursor to thesis H |
| B3 | **Consequence preview** (M3) + **public verdict legend** (M4) | small slices **[RC]** (M4 arguably presentation-only) | none; both strengthen the Stage-1/3 demo moments |
| B4 | **AAR time-scrubber** (M5) | moderate **[RC]** | delta/stamp history already exists; folds Stage-7 narratives into one mechanism |
| B5 | **Spatial bands on the map panel** (M6) | moderate **[RC]** | DEC-31(c) map panel; pairs with M11 |
| B6 | **Argument-card format + challenge affordance** (M8); relaxation card "put at risk" line (§3.3) | small **[RC]** | presentation over existing sensitivity/relaxation output |
| B7 | Discrimination v2: **operative-pair conditioning** + nested-vs-overlap distinction (§3.4); `ExpectedAnswer` provenance | note first **[RC]** | after SMEs react to the current ranking |

### Tier C — Horizon (existing queue, extended)
| # | Action | Where it lives |
|---|---|---|
| C1 | Draft **"no silent COA-family drop"** covering *both* generators — blue axes and the red-COA template set (§3.7) | feeds #43 (its §5.3), register candidate when drafted |
| C2 | **Red-COA derivation** from `expected_answers` machinery (horizon note §2.4) — the cheapest forward-derivation proof | #43 step 1 |
| C3 | **Recruitment edge** (edge-plus-floor) prototype | #43 step 2 |
| C4 | **Dependency-graph view**; recursive tooltips (M7) are its shallow end and could ship first | #24 |
| C5 | **Thesis H (reactive red)** — only after B2 has taught the project what the human-in-the-loop version wants | thesis catalogue |
| C6 | Elicited within-tier commitment ordering (§3.3) — when a real commander asks for it | future register batch |

**Sequencing note.** Tier A is deliberately all documentation, fixtures, and issue-filing — zero build — because the next hard gate is a *listening* gate (Checkpoint 1, DEC-27), and the review's strongest recommendations (B1, B2) should be shaped by what SMEs say, not pre-empt it.

---

## 10. Key sources (beyond the repository)

Doctrine: JP 2-01.3 *JIPOE* (2014); ATP 2-01.3 / MCRP 2-10B.1 *IPB* (2019); JP 5-0 *Joint Planning* (2020); FM 5-0 / FM 6-0 / ADP 6-0; NATO ACO COPD v3.x; ICD 203 *Analytic Standards* (2015); PHIA Probability Yardstick (2019); NATO STO-MP-SAS-114 (uncertainty communication); DoD *JADC2 Strategy Summary* (2022).
Prior works: Surdu, *The Deep Green Concept* (2008); Lempert, Popper & Bankes, *Shaping the Next One Hundred Years* (RAND 2003); Bankes, *Exploratory Modeling for Policy Analysis* (1993); Dewar, *Assumption-Based Planning* (2002); Ben-Haim, *Info-Gap Decision Theory* (2001/2006); Kott et al. on CADET/RAID (arXiv 1601.06108); Heuer, *Psychology of Intelligence Analysis* (1999); Dhami et al., ACH effectiveness (2019); Kent, *Words of Estimative Probability* (1964); Mattis, USJFCOM EBO guidance memo (2008); Rittel & Webber (1973); Klein, *Sources of Power* (1998).
Wargaming: Perla, *The Art of Wargaming* (1990); Sabin, *Simulating War* (2012); UK MOD *Wargaming Handbook* (2017) esp. §3.11–3.15; UK MOD *Red Teaming Handbook* 3rd ed. (2021); Engle/Mouat matrix games (MaGCK); Turnitsa, *Adjudication in Wargaming for Discovery* (CSIAC); Downes-Martin, *NWC Review* (2013, 2014); Work & Selva (2015); Reddie et al., *Science* 362 (2018); CALL 20-06 *How to Master Wargaming*; Dstl SWIFT (CSIAC).
Games: *Command: Modern Operations / PE* (AOU model, professional adoption); *Into the Breach* (GDC 2019 postmortem); XCOM / Fire Emblem probability-trust literature; *Crusader Kings 3* nested tooltips; GMT COIN series; Tacview; Roll20 GM layer; SC2 observer UI.
