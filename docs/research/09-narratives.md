# Research note 09 — Decision-support presentation and the band pill

Stage 7 · per ASSAY-DEC-11 · 2026-07-14 · bounded to hours, one page preferred
Prompts (build plan §Stage 7): decision-support presentation in doctrine (decision support template/matrix) and the human-factors literature on uncertainty communication — how bands and confidence are read and misread by decision-makers; test the band pill against it. Output feeds SPEC-16 (full S1–S4 chrome, five narrative scripts, wall-projection decision, SME-facing polish pass).

Numbering note: the build plan named this `07-narratives.md`, but `07-flow-view.md` (the SPEC-14 flow-view sub-slice) already occupies that slot. This note takes `09-`; the note number is filing, not authority.

## 1. Decision support in doctrine: the template, the matrix, and what they actually carry

JP 5-0 (*Joint Planning*, 2020) ch. IV prescribes two artefacts for COA comparison:

- **Decision Support Template (DST).** A graphic overlay on the operational picture showing decision points, their criteria, and the actions triggered. The DST is spatial and temporal — it says "at this point, if this indicator fires, the commander switches to branch X." It is a *pre-decision* instrument: the commander approves it before execution, and the staff maintains it during.
- **Decision Support Matrix (DSM).** A tabular companion to the DST listing decision points, their criteria, the available branches, and the responsible staff element. JP 5-0 fig. IV-22 shows the canonical layout: rows = decision points, columns = criteria / actions / responsible. The matrix is **not** a weighting table — the criteria are conditions (observed/reported indicators), not scores. The commander reads a row as a conditional: "if *this*, then *that*."

ATP 5-0.1 (*Army Design Methodology*, 2015) and ADRP 5-0 (*The Operations Process*, 2012) extend the same pattern to MDMP: the comparison criteria for COAs are suitability, feasibility, and acceptability, applied column-by-column in the decision matrix. The weighting of criteria is explicitly a **commander's prerogative** — the staff presents the matrix; the commander weighs. FM 6-0 (*Commander and Staff Organization and Operations*, 2022) §5-27 reiterates: "The commander alone decides."

### What ASSAY's surfaces already do — and where the gap was

S2's honest matrix (plans × commitments, verdict chips) and S3's three-card relaxation report are functionally a DSM: rows = plans, columns = commitments, cells = verdicts. The departure from the doctrinal template is deliberate:

1. **No weighting column.** The DSM in JP 5-0 fig. IV-22 has a "weight" column that many staff processes fill with 1–5 scales or percentages. ASSAY refuses this (DEC-19: ordinal tiers, no numeric weights). The tiers `must/should/prefer` are the commander's priorities stated ordinally; within-tier ordering in the relaxation report is stated as a tie-break, never a hidden scalar.
2. **The cell is a verdict, not a score.** Doctrinal practice often fills DSM cells with ✓/✗ or numerical scores (1–5) that are then weighted-summed. ASSAY's verdict cell is a four-stop chip (`robust/marginal/tight/violated`) over a margin band — readable as ✓/⚠/⚠/✗ at a glance, but opening to the honest band on demand (margin on hover, trace on click). No cell collapses to a number.
3. **The matrix arguments, it does not total.** The doctrinal bottom row — "total weighted score" — is absent by design. The honest comparison is the pattern of verdicts across commitments and scenarios, not a sum. JP 5-0 itself says comparison is the commander's judgement; ASSAY makes that literal by giving the commander the pattern and refusing to sum it.

This is the doctrinal alignment the Stage-7 surfaces must preserve: the narrative scripts *are* the decision-support walk-through, and each starts from the doctrinal question the role asks. The surface stays a DSM — it just declines to lie in the cells.

## 2. Uncertainty communication: how bands are read and misread

The human-factors literature on uncertainty in decision-making is large and convergent on a few durable findings. The ones that bind on ASSAY's surfaces:

### 2.1 Deterministic construal error

Gigerenzer et al. (*Helping Doctors and Patients Make Sense of Health Statistics*, 2007) and Joslyn & LeClerc (*Uncertainty Forecasts Improve Weather-Related Decisions and Attenuate the Effects of Forecast Error*, 2012) document the central pathology: **when presented with an uncertain estimate, decision-makers treat it as if it were precise** — a single number, not a range. This happens even when the range is stated, if the presentation foregrounds the point estimate (a prominent number with a smaller-font "± X" beneath it). The deterministic construal error is not ignorance; it is a perceptual shortcut that display design either resists or enables.

ASSAY's band pill is designed against this finding. The pill renders `lo–hi` as a visual range with no midpoint and no prominent "best estimate." The interval *is* the reading — there is nothing to latch onto as a point. DEC-15 (no stored midpoint) is the data-layer defence; the pill is the display-layer defence. The two together close the loop: no midpoint is computed, no midpoint is stored, no midpoint is shown.

### 2.2 Outcome format: frequency vs probability vs interval

Cosmides & Tooby (*Are Humans Good Intuitive Statisticians After All?*, 1996) and Gigerenzer & Hoffrage (*How to Improve Bayesian Reasoning Without Instruction: Frequency Formats*, 1995) show that natural frequencies ("4 out of 10") are better understood than probabilities ("40%") for conditional reasoning. However, both are point-valued or ratio-valued formats — they assert a specific fraction. ASSAY's bands are neither frequencies nor probabilities; they are **honest intervals on a measurement or estimate**, closer to the "range forecast" format that Joslyn & Savelli (*Communicating Forecast Uncertainty: Public Perception of Weather Forecast Uncertainty*, 2010) tested in the meteorological context. Their finding: range forecasts (e.g. "high between 75°F and 85°F") reduced overconfidence and improved decision quality compared to point forecasts — **but only when the range was visually prominent and the endpoints were not labelled as "min/max" or "best/worst."** Labelling endpoints introduces an anchoring frame (§2.3) that re-introduces the deterministic construal.

The band pill avoids endpoint labels: the pill shows `lo–hi` with a unit, no "min"/"max", no "worst"/"best." The provenance chip shows the source class and confidence, not a probability. This is the Joslyn & Savelli finding applied: prominent range, no anchoring label on the endpoints.

### 2.3 Anchoring on a presented value

Tversky & Kahneman (*Judgment Under Uncertainty: Heuristics and Biases*, 1974) established that an initial value — even an arbitrary one — anchors subsequent estimates. In uncertainty communication, this means that **any point value shown alongside a range will dominate the reader's judgement**, even if the range is wider than the point implies. The doctrinal "most likely" in a DST is exactly such an anchor: JP 2-01.3's most-likely COA, once named, becomes the planning anchor even when the most-dangerous COA is doctrinally required to be considered (note 06 §2). The band pill refuses to provide the anchor: no midpoint, no "expected", no highlighted point inside the range. The four-stop verdict is a categorical judgement (`robust/marginal/tight/violated`), not a point — it cannot be anchored against because there is no number to anchor on.

### 2.4 Precision–credibility trade-off

Yaniv & Foster (*Precision and Accuracy of Judgmental Estimation*, 1997) and Budescu et al. (*Improving the Communication of Uncertainty in Climate Science*, 2014) show an asymmetry: **narrow ranges are perceived as more credible and more expert, even when the true uncertainty is wider.** This creates a dangerous incentive: analysts narrow bands to appear confident, and consumers prefer the narrow band even when it is wrong. The finding maps directly to DEC-9's rationale — "one SME seeing a confident number they know is guesswork discredits the whole pipeline" — and to the confidence-lint floor (DEC-16, research note 01): a band cannot be narrower than its source class and confidence warrant. The lint is the production-side defence; the pill and provenance chip (showing source class and confidence) are the consumption-side defence, because they make the reader aware of the input's provenance before interpreting the band's width.

### 2.5 Colour-coding and categorical scales

Lipkus & Hollands (*The Visual Communication of Risk*, 1999) and the ISO 22324 standard (*Societal Security — Emergency Management — Guidelines for Colour-Coded Alerts*) converge on: **categorical colour scales (3–5 stops) outperform continuous gradient scales for decision support**, because the reader's question is "which bin does this fall in?" not "where exactly on the spectrum?" ASSAY's four-stop verdict (`robust/marginal/tight/violated`) is a four-bin categorical scale — the same class as a traffic light or a NATO STANAG warning level. The research on colour-coded alerts (Wogalter, *Handbook of Warnings*, 2006, ch. 10) identifies two failure modes: (a) more than 5–6 stops degrade to a quasi-continuous scale and lose the categorical benefit; (b) fewer than 3 stops lose the "caution" middle ground. Four stops sit in the effective range.

The verdict mapping (note 03 §3) is therefore well-founded on the human-factors side, not only on the mathematical side: four stops is both the unique O-3-satisfying, signs-only mapping *and* the categorically readable scale the presentation literature recommends.

## 3. Testing the band pill against the literature

The build plan asks to "test the band pill against" the human-factors findings. The test is not empirical (no user study in a research note bounded to hours) — it is a design audit: does the band pill, as built, resist the documented failure modes?

| Failure mode | Literature | Band pill defence | Residual risk |
|---|---|---|---|
| Deterministic construal | Gigerenzer 2007; Joslyn & LeClerc 2012 | No midpoint rendered; interval is the atom (DEC-15, pill design) | A reader may mentally halve `lo+hi`; the pill cannot prevent arithmetic, but it does not invite it |
| Anchoring on a point | Tversky & Kahneman 1974 | No "best estimate" or "expected" value shown; verdict is categorical, not numeric | If the narrative *says* "about X" alongside the pill, the anchor returns — narrative scripts must avoid narrating a midpoint |
| False precision via narrow band | Yaniv & Foster 1997; Budescu 2014 | Confidence-lint floor (DEC-16); provenance chip shows source class and confidence alongside | The lint catches too-narrow bands at creation; the chip makes provenance visible at consumption. Does not prevent a reader from trusting a narrow band of a high-confidence source — but that trust is warranted |
| Endpoint labelling bias | Joslyn & Savelli 2010 | Endpoints labelled as `lo–hi` with unit only; no "min/max", no "worst/best" | Narrative scripts must not reintroduce "best-case / worst-case" framing when presenting the pill |
| Too many scale stops | Lipkus & Hollands 1999; Wogalter 2006 | Four-stop verdict, one colour per stop, no gradient | Four is in the effective range (3–5); no adjustment needed |
| Colour-only encoding | ISO 22324; WCAG 2.1 §1.4.1 | The verdict chip carries the word (`robust`, `tight`, …) alongside the colour; the pill carries the numbers | Accessible to colour-vision-impaired readers; not solely reliant on colour |

**Audit result:** the band pill resists every documented failure mode by construction — each defence traces to a register decision already in force (DEC-9, DEC-15, DEC-16, DEC-19) or to a design principle already implemented (ui-design §1). The two residual risks are both **narrative-layer**, not surface-layer: a presenter who narrates a midpoint or uses "best/worst" framing reintroduces the anchoring the pill was designed to prevent. The narrative scripts (§4) must therefore carry explicit presenter guidance on this point.

## 4. The five narratives as DSM walk-throughs — scripting guidance, decided

The five demonstration narratives (concept §1) are not five builds — they are five **tab orders and presenter scripts** over the same running surface (ui-design §2: "a demo narrative is a tab order and a script, not a build"; DEC-23: each narrative assembles the per-stage demo moments banked at Stages 1–6). The research question is how to script them honestly — in the command language appropriate to each audience, without reintroducing the false-precision the surfaces were designed to refuse.

### Scripting principles (from §2 and §3 above)

1. **Never narrate a midpoint.** The presenter says "the timing is 9 to 13 steps" — not "about 11 steps" or "approximately 11." The band's content is the range; the narrative must not compress it.
2. **Never narrate a weighted sum.** "P1 is better overall" violates DEC-19 exactly as a weighted DSM total would. The honest narration is "P1 holds C1 and C2 but sacrifices C4" — the pattern, not a scalar.
3. **Use the verdict as a category, not a score.** "This commitment is tight" is correct; "this commitment scores 2 out of 4" imports a numeric scale the system refused. The verdict is a bin, not a rank.
4. **State the tie-break.** When the relaxation report orders same-tier sacrifices, the narrator states the ordering and its reason (DEC-19: tie-breaks are explicit and visible, never silent). "C3 is sacrificed before C4 because [stated reason]" — the audience hears the ordering as a decision, not as arithmetic.
5. **Quote the doctrine at the moment it bites.** The demo moments already bank the doctrinal echoes (note 06 §2: "don't plan on most-likely"; note 08 §2: JP 2-01.3 ch. IV on source diversification). The script quotes them in the flow — not as an aside, as the finding the surface is showing.

### Narrative outlines (tab order + lead thesis)

Each narrative is ≤10 minutes, runs from a cold start (the published app loads the Meridian fixtures and runs the pipeline in-browser — no server, no network, no setup), and walks the audience through a subset of the banked demo moments.

| Narrative | Audience | Lead theses | Tab order | Centrepiece moment |
|---|---|---|---|---|
| J-2 | Intelligence staff | D, E, F | S1 → S4 → S1 | "K8 is single-source and load-bearing — verify it next" (sensitivity + deception flag) |
| Planner | J-3/5 planners | C, B | S2 → S2 (scenario toggle) → S3 | "Toggle R2 and watch the favourite die" (scenario strip collapse) |
| Commander | Commander / COS | B + trace | S3 → trace drawer → S2 | "Three cards, one sacrifice stated in command language" (relaxation report) |
| Bridge | Both staffs | A, F | S4 → S1 (edit) → S4 (glow) | "Supersede K5 and watch the flags land — no email, no re-brief" (heartbeat) |
| REMIT | Design team | All | S4 → S1 → S2 → S3 → S4 | "The seam is one shared store, walked end-to-end" (full heartbeat loop) |

Each narrative references its demo-moment beats from the walkthrough (§8) and the per-stage exits — the narrative *assembles* them, it does not re-derive them. Presenter notes for each beat include the doctrinal quotation and the explicit instruction "do not narrate a midpoint or a total" per §3's audit.

## 5. Wall-projection mode — decided

The ui-design §6.4 open question: "wall-projection mode for S4 (large type, auto-follow feed) as a first-class config."

**Decided: wall-projection mode is a CSS-only config, not a separate surface.** The S4 Bridge view already is the "seam, watched" — its function is to be projected while S1 and S2 are driven side by side. Wall-projection mode sets:

- **Typography.** Body text at ≥ 24px; delta-row actor/op labels at ≥ 20px; band pills at ≥ 18px numerals. These are the ISO 7001 / ANSI Z535 legibility guidelines for viewing distances ≥ 3m.
- **Auto-follow.** The delta feed scrolls to the latest entry on every new delta — no operator interaction needed on the projected display. A toggle disables auto-follow for freeze-frame during a discussion.
- **Contrast.** Forced dark background with high-contrast verdict chips (the four-stop colours are already WCAG AA on dark; the pill numerals are monospace white-on-dark). Light mode is suppressed in projection config because ambient light washes out low-contrast elements.
- **Reduced chrome.** Tab bar hidden (S4 is full-screen); legend collapsed by default (opens on demand if someone walks to the screen).

This is a CSS `@media` / config-class toggle (`data-projection="wall"`), not a codebase branch. The same component tree renders; only sizes, scroll behaviour, and chrome visibility change. No new decision — the surface already exists and renders S4's content; projection mode is a presentation adaptation within Stage-7's delegated authority.

## 6. Command language in the relaxation report — the presentation register

S3's cards state sacrifices in **command language** — the same register the commitments are authored in (vignette §6). "Opens the strait D+9, two days late" is command language; "C2 margin band [−2, 4]" is system language. The card shows both, but command language leads because the audience is the commander, not the analyst.

The command-language mapping for each commitment type is not invented by the card renderer — it is the commitment's own `label` field (knowledge model §6; vignette §6 provides each commitment's human-readable statement). The card renderer uses the label verbatim and appends the system detail (verdict chip, margin band on hover, trace on click). This preserves the frozen-identifier rule (vignette §8): the command language on S3 is authored in the vignette, not generated by the renderer, so it cannot drift.

For the sacrifice statement, the pattern is: "[commitment label], [verdict] under [scenario]" — e.g. "Maintain the causeway, violated under R3m." The sacrifice is named in the commander's own words (the commitment label is the commander's directive), not in system terms. This matches FM 6-0 §5-27's principle: the staff presents the trade in the commander's frame.

## What we will do differently

1. **The S2 honest matrix and S3 relaxation cards are the DSM**, implemented without a weighting column and without a total row — matching JP 5-0's principle that comparison is the commander's judgement, not an arithmetic output. The surfaces stay within doctrinal furniture (template/matrix structure, suitability/feasibility/acceptability mapping from note 03 §5) while refusing the false-precision that common DSM practice introduces.
2. **The band pill resists every documented uncertainty-communication failure mode** (deterministic construal, anchoring, false precision, endpoint labelling bias, scale overload, colour-only encoding) by construction — each defence traces to a register decision already in force. The two residual risks are narrative-layer (presenter narrating a midpoint or a weighted total) and are addressed by explicit scripting guidance (§4).
3. **The five narrative scripts are tab orders + presenter notes**, not builds — they assemble the per-stage demo moments banked at Stages 1–6 (DEC-23). Each script carries explicit guidance: never narrate a midpoint, never narrate a weighted sum, use the verdict as a category, state the tie-break, quote the doctrine at the moment it bites.
4. **Wall-projection mode is a CSS-only config** on S4 — large type (≥ 24px body), auto-follow delta feed, forced dark/high-contrast, reduced chrome. Not a separate surface; a `data-projection="wall"` class toggle within Stage-7's delegated authority.
5. **Command language in S3 cards uses the commitment's own label field** (authored in the vignette, frozen by §8) — sacrifices are stated in the commander's words, not in system terms. The card appends system detail (verdict chip, margin, trace) below the command-language lead.

This note asserts **no new register decision**: the band pill's design is constrained by DEC-9 (banded honesty), DEC-15 (no midpoint), and DEC-16 (confidence-lint floor); the narrative scripting is constrained by DEC-19 (no weights, stated tie-breaks) and DEC-23 (demo moments as standing exits); the wall-projection mode is a presentation adaptation within the existing surface architecture (DEC-5) and within Stage-7 delegated authority. The command-language register in S3 cards uses the commitment label already defined in the knowledge model and vignette. Any latitude spent (the specific projection-mode thresholds, the narrative tab orders, the presenter guidance rules, the endpoint-label avoidance policy) is within Stage-7 delegated authority under the build plan's §Stage 7 exit criteria and is recorded here, not asserted in a peer document.

Sources: JP 5-0 *Joint Planning* (2020) ch. IV — decision support template/matrix, COA comparison, "the commander alone decides"; ATP 5-0.1 *Army Design Methodology* (2015) — MDMP comparison criteria; FM 6-0 *Commander and Staff Organization and Operations* (2022) §5-27 — staff presents, commander weighs; JP 2-01.3 *Joint Intelligence Preparation of the Operational Environment* (2014) — most-likely/most-dangerous COA (via note 06 §2), source diversification (via note 08 §2); A. Tversky & D. Kahneman, "Judgment Under Uncertainty: Heuristics and Biases," *Science* 185(4157), 1974 — anchoring effect; G. Gigerenzer et al., "Helping Doctors and Patients Make Sense of Health Statistics," *Psychological Science in the Public Interest* 8(2), 2007 — deterministic construal error, frequency formats; L. Cosmides & J. Tooby, "Are Humans Good Intuitive Statisticians After All?" *Cognition* 58(1), 1996 — frequency vs probability formats; G. Gigerenzer & U. Hoffrage, "How to Improve Bayesian Reasoning Without Instruction: Frequency Formats," *Psychological Review* 102(4), 1995 — natural frequency advantage; S. Joslyn & J. LeClerc, "Uncertainty Forecasts Improve Weather-Related Decisions and Attenuate the Effects of Forecast Error," *Journal of Experimental Psychology: Applied* 18(1), 2012 — range forecasts and deterministic construal; S. Joslyn & S. Savelli, "Communicating Forecast Uncertainty: Public Perception of Weather Forecast Uncertainty," *Meteorological Applications* 17(2), 2010 — range format, endpoint labelling bias; I. Yaniv & D. P. Foster, "Precision and Accuracy of Judgmental Estimation," *Journal of Behavioral Decision Making* 10(1), 1997 — precision–credibility asymmetry; D. V. Budescu et al., "Improving the Communication of Uncertainty in Climate Science," *Bulletin of the American Meteorological Society* 95(10), 2014 — confidence communication in IPCC reports; I. M. Lipkus & J. G. Hollands, "The Visual Communication of Risk," *JNCI Monographs* 25, 1999 — categorical vs continuous risk scales; M. S. Wogalter (ed.), *Handbook of Warnings*, Lawrence Erlbaum, 2006, ch. 10 — colour-coded warning effectiveness; ISO 22324:2015 *Societal Security — Emergency Management — Guidelines for Colour-Coded Alerts*; WCAG 2.1 §1.4.1 — use of colour not as sole channel; ISO 7001 / ANSI Z535 — legibility at distance; ASSAY register DEC-4/5/7/8/9/14/15/16/19/23/25, seam contract §G (G1–G6), ui-design §1–§6, vignette §6 (commitment labels)/§8 (frozen identifiers)/§9 (oracle cases), walkthrough §0/§8 (heartbeat summary), concept §1 (five narratives), research notes 03-score-plan.md §3 (four-stop mapping)/06-robustness.md §2 (doctrinal warning)/08-analysis.md §2 (deception doctrine).
