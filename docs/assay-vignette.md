# ASSAY — Vignette: The Meridian Archipelago

**Founding doc 4** · the fixture scenario
Status: draft for review · v0.1 · 2026-07-11
Authority: ASSAY-DEC-8 (fictional archipelago, JTF echelon, engineered coverage), DEC-14–21 via every instance below.
Companions: `assay-knowledge-model.md` (the shapes these instances take), `assay-build-plan.md` (whose exit criteria name these instances), `assay-ui-design.md` (which surfaces render them).

**This scenario is fiction.** The Meridian Archipelago, the Kestrel Directorate, and every place, unit, person, and number below are invented, and invented *for a purpose*: each element exists to exercise a named thesis or exit criterion (§7). Any resemblance to real geography, states, or operations is coincidental and unintended (DEC-8). The vignette is the sole fixture source; a change that breaks a §7 coverage row is a register matter (constitution, Additional Constraints).

---

## 1. Situation

The Meridian Archipelago is a small mid-ocean island group whose only deep-water port, **Port Halcyon**, serves a civilian population dependent on seaborne resupply. Eight weeks ago an expeditionary garrison of the **Kestrel Directorate** seized the archipelago and closed the port. Stocks ashore are running out; a multinational relief convoy is being assembled.

**Coalition Task Force MERIDIAN (CTF-M)** — a small joint task force — is directed to reopen Port Halcyon and pass the relief convoy in. The operational objective is singular (DEC-8): **Port Halcyon open and relief ships alongside by D+10.** The Directorate's home government is distracted and reinforcement is judged infeasible inside the horizon; the garrison fights with what it has.

## 2. Geography, grid, clock

The world is a 60×60 grid of 2 km cells; the scenario clock runs 6-hour timesteps from D-day to D+14 (steps 0–56).

| Feature | Location (approx. cells) | Notes |
|---|---|---|
| **Anchor Island** | south-west quadrant | Main island. Port Halcyon on its north shore (~cell 22,18); town district of ~10 cells around the harbour |
| **Halcyon Strait** | between Anchor and Carrick (~cells 24–34, 20–26) | The only deep-draught approach to the port; minable |
| **Carrick Island** | north-east quadrant | Directorate-held airstrip; **Carrick Head** battery position (~cell 36,30) covering the strait's northern approach |
| **Ledger Island** | west (~cells 10–14, 26–32) | Fishing quay, the Directorate's fast-craft and minelayer berths; linked to Anchor by a **causeway** over tidal flats (~cells 16–20, 22) |
| **Voss Chain** | southern rim | Shoals and islets; shallow-draught passage only, tide-dependent |

Two seaward approaches exist: **north approach** (past Carrick Head, deep water, quickest) and **south approach** (through the Voss Chain, tide-gated, slower but outside the battery arc). The causeway is the only overland route from a Ledger-side lodgement to the port.

## 3. CTF MERIDIAN (blue)

Five force elements (DEC-8's 3–5; DEC-20 plans are their timed routes + task windows):

| ID | Element | Kind | Role in the vignette |
|---|---|---|---|
| `FE-ANVIL` | TG ANVIL — amphibious group + embarked landing force | amphib | Lodgement, port seizure |
| `FE-BROOM` | TG BROOM — mine countermeasures group | MCM | Sweeping the strait/approaches; the C2 clock runs on them |
| `FE-FALCON` | TG FALCON — embarked strike/aviation element | air | Suppression of battery/FACs; fires constrained by C3 |
| `FE-PACKHORSE` | TG PACKHORSE — relief convoy + escort | logistics | The mission's payload; deep-draught, strait-dependent |
| `FE-KINGFISHER` | DET KINGFISHER — special reconnaissance detachment | recon | The collection asset behind K11; extraction deadline C6 |

## 4. Kestrel garrison (red) and its COAs

ORBAT: a garrison battalion in the port district; the Carrick Head coastal-defence battery (fire-control radar of uncertain state — K8); a fast-attack-craft (FAC) squadron of 6–8 craft and two auxiliary minelayers at Ledger quay; sea-mine stocks of contested size (K12); a point air-defence section at the Carrick airstrip (K7).

Three genuinely divergent COAs (DEC-8); likelihoods are banded scenario weights (K14a–c) and **never compile into constraint or cost** (knowledge model §9):

| ID | COA | Concept | Signature |
|---|---|---|---|
| `R1` | **Fortress Halcyon** | Concentrate in the port district; battery active as area denial; FACs held as port screen; little or no mining | Strait stays physically clear; the fight is at the waterline |
| `R2` | **Strait Denial** | Mine Halcyon Strait early and deep; FAC harassment of sweep operations; cede the town, deny the port's *use* | The strait is the battlefield; MCM under attack |
| `R3` | **Spoiling Withdrawal** | Demolish port cranes and the causeway; withdraw the garrison to Carrick; harass with FACs | Infrastructure destruction; **branch R3m (mining branch)**: remaining stocks laid in *both* approaches during withdrawal |

R1 and R2 are near-mirror opposites in what they make dangerous (waterline vs strait); R3m is the commitment-breaker (§6). The excursions are compile-time channel overrides per ScenarioCOA (knowledge model §6): R2/R3m raise the mine-threat channel in their signature waters; R3 zeroes causeway mobility from its demolition step; R1 concentrates the threat channel in the town district.

## 5. Knowledge base (K1–K14)

The Meridian JIPOE product set, typed per the knowledge model. Bands are pure intervals (DEC-15); every non-`observed` value renders banded with provenance (G2). `crit` = criticality; validity in scenario steps.

| ID | Question | Encoding | Source · conf | Answer / state | Engineered role |
|---|---|---|---|---|---|
| `K1` | What depths and beach gradients constrain approach to Anchor Island? | hard_constraint | observed (survey chart) · high | Charted; fact, unbanded permitted (DEC-14) | The legitimate hard constraint; mobility channel bedrock |
| `K2` | What load will the Ledger–Anchor causeway bear? | banded_soft_cost | assessed (imagery engineering estimate) · moderate | 20–40 tonnes | Banded cost on overland resupply; interacts with C5 |
| `K3` | What is the civil population in the Port Halcyon district? | banded_soft_cost | reported (NGO census, 18 months old) · moderate | 35–55 k district total | Civil-density channel; C3's substance |
| `K4` | What is garrison strength and posture? | banded_soft_cost | assessed · moderate | 300–450 effectives, port-district posture | Threat channel; resistance cost |
| `K5` | What are tide and storm conditions D+0–D+4? | banded_soft_cost | reported (met service) · high | Surge 0.4–0.9 m; **validity steps 0–16** | **The perishable forecast (thesis F)**; superseded by K9 |
| `K6` | What sortie rate can the FAC squadron sustain? | banded_soft_cost | assessed · low | 2–6 sorties/day | Wide band from weak evidence; C4 pressure |
| `K7` | What is the air-defence engagement envelope at Carrick strip? | banded_soft_cost | assessed · moderate | 8–14 km | Threat channel; shapes FALCON routing |
| `K8` | Is the Carrick Head battery's fire-control radar operational? | **hard_constraint (waiver recorded)** | assessed · moderate · **single-source** (one intercepted maintenance return) | "Non-operational; repair 10–21 days" — north approach treated as safe **under J-3 waiver W-1** | **The load-bearing, deceivable assessment (thesis E)**; tops sensitivity ranking with its single-source flag |
| `K9` | What are tide and storm conditions D+2–D+9? | banded_soft_cost | reported (met service update) · high | Surge 1.1–1.8 m peaking D+5–D+7; validity steps 8–36 | **Supersedes K5** (cross-lineage edge); its arrival flags exactly the K5-dependent verdicts (thesis F, Stage-6 exit) |
| `K10` | Will the garrison capitulate by D+5? | **hard_constraint claimed — REFUSED** | assumption (émigré political chatter, taken up as analyst supposition) · low | Refused `encoding_violation` at POST /knowledge: an assumption may never be a hard constraint and no waiver can license one (knowledge model §9); withdrawn (`retired`) | **The refusal exhibit (Stage-1 exit)**; the honest system declining laundered judgement |
| `K11` | Are mines loaded on the minelayers at Ledger quay? | banded_soft_cost | **open question** | Unanswered. Collection: KINGFISHER close recon, cost 2–4 det-days, earliest step 8 | **The expensive, powerful discriminator (thesis D)**; expected answers below |
| `K12` | How many sea mines does the garrison hold? | banded_soft_cost | **contested pair** | `K12a` assessed (defector debrief) · moderate: 30–60 · owner J-2 red cell — **contests** — `K12b` assessed (pre-war manifests) · moderate: 140–220 · owner allied LNO | **The contested pair (G5)**: mine-threat channel refuses to compile until resolved (Stage-1/2 exits) |
| `K13` | What is the daily radio-traffic volume from garrison HQ? | banded_soft_cost | **open question** | Unanswered. Collection: standoff intercept, cost 0.2–0.5 det-days, earliest step 4 | **The cheap, weak discriminator**: expected answers overlap across all COAs; K11 beats it on value despite cost (Stage-6 exit) |
| `K14a–c` | How likely is each red COA? | **scenario_weight** | assessed (J-2 fusion) · moderate | R1: 45–70 % · R2: 20–40 % · R3: 10–25 % (overlapping bands — honestly undecided) | The firewall exhibit: weights order attention and reporting, never compile (knowledge model §9) |

### The miniature event matrix (DEC-18)

Expected answers for the open questions — the machine-readable basis of `/analyse/discrimination`:

| Question | If R1 (Fortress) | If R2 (Strait Denial) | If R3/R3m (Withdrawal) | Discrimination |
|---|---|---|---|---|
| `K11` mines staged at quay (fraction of stock) | 0.0–0.2 | 0.7–1.0 | 0.5–0.9 | **Strong**: R1 vs R2 disjoint — one look answers the operative question |
| `K13` HQ radio traffic (msgs/day) | 40–90 | 50–110 | 30–100 | **Weak**: bands nest and overlap; cheap but nearly uninformative |

## 6. Commitments (C1–C6)

Commander CTF-M's conditions, ordinal tiers per DEC-19 (no numeric weights); thresholds are scalar fact-of-intent (DEC-14):

| ID | Tier | Statement (command language) | Machine form |
|---|---|---|---|
| `C1` | must | Relief ships alongside Port Halcyon by D+10 | `port_open_step at_most 40` |
| `C2` | must | Halcyon Strait swept and open to deep-draught traffic by D+7 | `strait_open_step at_most 28` |
| `C3` | should | No fires into the populated port district | `civil_harm_exposure at_most 0 (district cells)` |
| `C4` | should | Amphibious group not exposed to unsuppressed battery or FAC threat | `threat_exposure(FE-ANVIL) at_most 12 band-hours` |
| `C5` | prefer | The Ledger causeway is taken intact | `causeway_intact at_least 1` |
| `C6` | prefer | DET KINGFISHER extracted by D+12 | `extraction_step(FE-KINGFISHER) at_most 48` |

**The engineered conflict (thesis B).** Under `R3m`, both approaches are mined and the causeway is dropped: no plan satisfies all of C2–C4, and the dropped causeway forecloses **C5** ("taken intact") for *every* plan — a scenario-imposed loss, not a trade. Sweeping both approaches in parallel puts BROOM and ANVIL inside the battery/FAC arc (breaks **C4**); clearing the FAC berths quickly means fires into the harbourfront where the craft berth among the fishing fleet (breaks **C3**); sweeping sequentially and safely opens the strait at D+9 (breaks **C2**, "two days late"). `/relax` must therefore return **three least-worst candidates sacrificing {C4,C5}, {C3,C5}, {C2,C5} respectively** (C5 common to all three, so the candidates are still distinguished by the C2/C3/C4 trade) — the Stage-4 exit criterion, each stated in command language. *(Sets corrected 2026-07-15 by SPEC-20/register candidate concept §6.22: the compiled world previously kept the base causeway estimate over the excursion's demolition, so C5 scored satisfied against the narrative above; excursion-beats-base precedence — research note 02 §6 — makes the computed world agree with this section.)*

**The robustness trap (thesis C).** The R1-optimal plan sends PACKHORSE through the strait early (R1 doesn't mine); under R2 that plan's C1/C2 verdicts collapse to `violated`. The robust alternative sweeps first and enters later — slightly worse against R1, surviving against all three (Stage-5 exit).

## 7. Coverage matrix (normative)

Every engineered feature exists to exercise a named claim. **A change to the vignette that breaks a row of this table is a register matter** (constitution, Additional Constraints).

| Thesis / criterion | Exercised by | Demonstrated when |
|---|---|---|
| A · Pipeline | K1–K14 typed, compiled into channels with `compiled_into` edges | Stage-2 exit: every channel traces backward to named knowledge |
| B · Least-worst | C2×C3×C4 unsatisfiable under R3m (C5 foreclosed by the dropped causeway) | Stage-4 exit: three candidates sacrificing {C4,C5}, {C3,C5}, {C2,C5}, in command language *(row updated by SPEC-20 — see §6)* |
| C · Robustness | R1-optimal plan vs R2 mining | Stage-5 exit: visible collapse; robust alternative survives R1–R3 |
| D · Collection | K11 (strong, dear) vs K13 (weak, cheap) expected-answer separation | Stage-6 exit: K11 ranks above K13 on discrimination despite higher cost |
| E · Sensitivity/deception | K8 single-source, waiver-carrying, load-bearing on the north approach | Stage-6 exit: K8 tops sensitivity ranking, single-source flag shown |
| F · Staleness | K5 validity window; K9 cross-lineage supersession | Stage-1 exit: K9 stales K5 · Stage-6 exit: exactly the K5-dependent verdicts flag, nothing else |
| Encoding discipline | K10 refusal (`encoding_violation`); K8 waiver visible; K14 firewall | Stage-1 exit: K10 refused; K8's waiver recorded and rendered |
| G5 contested-never-compiles | K12a/K12b contested pair on the mine inventory | Stage-1/2 exits: compile refuses `contested_knowledge` naming the pair until `resolves` lands |
| G1 determinism | Whole fixture set | Stage-2/3 exits: same knowledge ⇒ byte-identical stamp; same stamp+seed ⇒ identical handful |
| G4 relaxation honesty | The R3m conflict | `/relax` never empty, never silent; tie-breaks stated |
| Scorer correctness | Oracle cases O-1–O-4 (§9) | Stage-3 exit: the scorer reproduces O-1–O-3 exactly and the O-4 containment property holds under property-based testing |

## 8. Fixtures & authoring

Fixtures are hand-authored JSON instances of the LinkML classes, validated against the generated types (SPEC-04); a light authoring surface remains an open register candidate (concept §6.5) and is explicitly out of the v1 lap (build plan §deferred). Numbers not tabled here (channel defaults and region geometry — held in `fixtures/vignette-config.json` per the sparse-channel decision, research note `02-compile.md`; route geometry) are fixture-authoring latitude *within* the constraints this document sets; where a fixture value would decide a §7 row's outcome, this document wins.

Narrative colour (place names, unit nicknames) is free to grow for demo polish; identifiers (`K*`, `C*`, `R*`, `FE-*`, and the oracle ids `O-*` below) are frozen — the build plan's exit criteria and the demo scripts cite them.

## 9. Oracle cases (scorer correctness)

The coverage matrix proves the machinery *runs*; nothing in it proves the scorer is *right*. A deterministic, banded, fully traced scorer that propagates intervals incorrectly would pass every §7 row and every seam invariant while being exactly the false-precision machine ASSAY exists to refuse. These oracle cases are the independent leg: hand-computed on paper, committed here, and binding on SPEC-07's acceptance. They deliberately pin only elementary interval arithmetic and threshold comparison — the parts of scoring that are *not* Stage-3 design latitude — so they constrain correctness without pre-empting the `03-score-plan.md` research note.

**Setup (shared).** A single force element sweeps two strait segments in sequence, starting at step 2. Segment A takes an assessed 4–6 steps; segment B an assessed 3–5 steps. Both durations are banded (`assessed`, so scalar is forbidden — G2). The metric is `strait_open_step` = start + duration(A) + duration(B).

| ID | Case | Inputs | Required output | Why it binds |
|---|---|---|---|---|
| `O-1` | Interval sum | start 2 · A [4,6] · B [3,5] | `strait_open_step` = **[9,13]** exactly | Pure interval addition; any other band is a propagation defect, not a design choice |
| `O-2` | Verdict at clear margin | O-1 output vs C2-style threshold `at_most 28` | verdict **robust**; margin band **[15,19]** | Threshold comfortably outside the band: verdict and margin are hand-checkable |
| `O-3` | Band-straddling threshold | O-1 output vs threshold `at_most 12` | verdict **neither robust nor violated** (both outcomes lie inside the band); as the threshold sweeps 8→14, the verdict changes **only at the band edges (9, 13), never inside the band** | Pins the honesty of the four-stop scale without pre-deciding the marginal/tight boundary — that mapping is Stage-3 research (`03-score-plan.md`), and whichever mapping it picks must satisfy this case |
| `O-4` | Containment under widening | Re-run O-1 with A widened to [3,7] | `strait_open_step` = **[8,14]**, which **contains** [9,13]; in general: widening any input band never narrows any output band, and every point-realisation of the inputs scores inside the output band | The banded-honesty invariant stated mathematically — the propagation-honesty property (candidate G6, seam contract §G). Property-based tests assert it across random bands, not just this instance |

Rules: oracle expected values are computed by hand and never regenerated from the implementation (an oracle regenerated from the code under test is not an oracle). A change to an `O-*` row is a register matter, same as a §7 coverage row. SPEC-07 acceptance includes all four; SPEC-15 (the gate) re-asserts them end-to-end.
