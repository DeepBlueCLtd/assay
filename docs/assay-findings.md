# ASSAY — Findings Ledger

Status: canonical · v0.2 · 2026-07-12 · joined the canonical set as ASSAY-DEC-26 (register batch 3); sole home of findings — a finding may be cited for what an exploration concluded, never as the origin of a decision
Authority: ASSAY-DEC-1 (theses as explorations), DEC-3 (convergence/divergence findings reported back as REMIT register candidates, never silent coupling), DEC-7 (theses are explorations, not builds). This ledger **originates no decisions**; it records what the explorations *conclude*, which is the one output no other document owns.
Companions: `assay-concept.md` §1 (the thesis catalogue), `assay-register.md` (decisions this ledger's entries trace to), `docs/status.yml` when it exists (thesis states on the public site project from §2 here, never from optimism).

ASSAY's stated purpose makes findings its unique product: *"Where a principle survives the re-derivation it is validated as general; where it doesn't, that is a finding."* Until this ledger, findings had no home — the re-derivation evidence existed only as rationale fragments inside register entries and would have been unrecoverable by the spine gate. This document is where explorations end.

**Ledger discipline.** Entries are `ASSAY-FIND-n`, allocated once, never reused; an entry is superseded by a later entry, never edited beyond typographical repair (register conventions, applied here). Every entry ends in exactly one disposition: **REMIT register candidate** (the finding generalises; a candidate entry is drafted for the REMIT team), **ASSAY-local** (real but domain-specific; no export), or **pending** (the ASSAY side is captured; the REMIT-side comparison awaits a citation the ASSAY team cannot supply). A `pending` entry is a placeholder with a named owner, not a conclusion.

---

## 1. What counts as a finding

Three kinds, all recorded the same way:

1. **Re-derivation verdicts** — an ASSAY decision compared against its REMIT counterpart: convergent (principle validated as general), divergent (principle qualified — the divergence is the payload), or novel (no REMIT counterpart existed; candidate for adoption).
2. **Thesis outcomes** — a thesis moving to *explored* with evidence, including evidence against (§2's falsification criteria exist so that "explored" can honestly end in "did not hold").
3. **SME evaluation results** — reactions captured at the comms plan §12 checkpoints, where they bear on a thesis or principle.

A finding must trace to a register entry, a stage exit against Meridian, an oracle case, or a dated SME session — never to recollection (the DEC-11 rule, applied to conclusions).

## 2. Thesis state & transition criteria (normative for status.yml)

The public site's thesis states project from this table. **Transition rules:** `planned → explored` when the thesis's stage exit *and* its demo moment run against Meridian (build plan stages 1–6); `explored → concluded` (validated / qualified / did-not-hold) only after (a) its falsification criterion below has been genuinely tested, not just its engineered success path, and (b) at least one SME checkpoint (comms §12) has seen it. `horizon` theses carry no falsification criterion yet — writing one is part of admitting the thesis.

| Thesis | State | Falsification criterion — what would count *against* it |
|---|---|---|
| A · Pipeline | planned | Fails if honest encoding cannot carry a realistic JIPOE product set without constant waiver/exception traffic — if the compile firewall's refusals become so routine that staff route around them, the "honest pipeline" is theatre. |
| B · Least-worst | planned | Fails if SMEs read the least-worst cards as the machine usurping the commander's judgement rather than arguing to it, or if candidate sacrifices cannot be stated in command language without distorting what the solver actually did. |
| C · Robustness | planned | Fails if the robust alternative is only findable because the vignette hard-codes it — i.e. the generator cannot produce robust plans that were not authored in, so the demo shows fixture engineering, not a method. |
| D · Collection | planned | Fails if the discrimination ordering is insensitive to realistic changes in the expected-answer bands — if K11 tops the ranking under any encoding, the ranking reflects the fixture's construction, not information value. |
| E · Sensitivity/deception | planned | Fails if the sensitivity ranking is dominated by band width alone — a trivially computable proxy (widest band wins) would then do the same job, and "load-bearing" adds nothing over "vague". |
| F · Staleness | planned | Fails if the "exactly the dependent artefacts and nothing else" claim does not survive trace-graph growth — over-flagging (alarm fatigue) or under-flagging (silent staleness) at realistic graph sizes both break it. |
| G · Interdependency | horizon | No falsification criterion until an honest v1 slice is admitted (concept §6.3); stating one now would presume the shape it must test. |
| H · Reactive red | horizon | Deferred with the REMIT DEC-60 rationale; criterion deferred with it. |

## 3. Findings

### Batch 1 — backfilled from the founding and canonical-set sessions (2026-07-11)

Recorded while the interview rationale is fresh; these are re-derivation verdicts latent in register batches 1–2.

| ID | Finding | Evidence (ASSAY side) | REMIT side | Verdict · disposition |
|---|---|---|---|---|
| ASSAY-FIND-1 | **Banded honesty survives re-derivation and strengthens**: REMIT bands costs/risks and forbids false-ranking within band, but the ban is behavioural; ASSAY pushed it into *representation* — no stored midpoint, no distributional claim, anywhere (DEC-15), on the argument that a stored midpoint *will* eventually surface. | DEC-9, DEC-15; knowledge model §3 ("no midpoint slot exists and none may be added") | NF9 (honesty about optimality & uncertainty); NF10/DEC-14 (costs/risks in bands sized to uncertainty; within-band plans equivalent; widths derived from confidence, not constants). No schema-level midpoint ban found in the REMIT register. | Convergent-and-strengthened · **REMIT register candidate**: adopt the representation-level ban — audit REMIT shapes for stored midpoints/derived scalars |
| ASSAY-FIND-2 | **Numeric priority weights did not survive re-derivation** where commander judgement is the subject: ASSAY refused numeric commitment weights entirely — ordinal tiers plus *stated* tie-breaks (DEC-19) — on the argument that numeric sacrifice weights are false precision exactly where scrutiny is highest. | DEC-19; knowledge model §5 ("no numeric weight slot exists"); seam G4 tie-break rule | REMIT DEC-22 (resolving its Q1): hard = inviolable constraints; **soft = priority-weighted banded penalties** (authority from B3); human chooses within band. | **Divergent** (closed 2026-07-12) · **REMIT register candidate**: re-examine DEC-22's priority weights at the argument surface — ASSAY re-derived the same least-worst mechanism (sacrifice reporting, banded space, human choice) *without* weights, so the weights are not load-bearing for the mechanism; REMIT's mitigations (penalties banded; human chooses within band) may still not survive the SME scrutiny ASSAY-DEC-19 anticipates |
| ASSAY-FIND-3 | **The fact/assessment split needs a source-class enum, not a flag**: two classes (fact/assessed) proved insufficient — `reported` and `assumption` behave differently from `assessed` in the compile firewall and in waiver policy, so the split is four-way and generic (DEC-14). | DEC-14; knowledge model §9 firewall table (three distinct non-observed rows) | No known REMIT counterpart cited | Novel · **REMIT register candidate**: does REMIT's provenance model distinguish reported/assessed/assumption where its planning machinery consumes them? |
| ASSAY-FIND-4 | **Deterministic demonstrators must banish wall clock from stored objects**: scenario-clock-only time (DEC-17) was forced by stamp determinism and offline reproducibility, not by doctrine — suggesting it generalises to any system claiming replayable computation. | DEC-17; knowledge model §1.4; seam G1 | REMIT DEC-13/NF3 (kernel reproducible from stamped inputs, decision-stable); DEC-25 (plans transit *as stamps* and regenerate byte-identically); DEC-21 (plan time is hybrid event/continuous scenario time); wall clock appears only in audit metadata (NF2 author/time), outside the kernel. | **Convergent** (closed 2026-07-12) — both systems exclude wall clock from deterministic compute by design · **REMIT register candidate (mild)**: ASSAY makes the exclusion *structural* (no wall-clock slot can exist on a content-addressed object, DEC-17) where REMIT holds it by kernel convention; the structural form is cheap to adopt and survives contributor turnover |
| ASSAY-FIND-5 | **Deferral rationales transfer across domains**: thesis H (reactive red) was deferred by *re-applying* REMIT DEC-60's rationale to a new domain and finding it held unchanged — a small but genuine convergence datum: the reasons for sequencing away adversarial reactivity are not domain-specific. | Concept §1 thesis H ("deferred with same rationale as REMIT DEC-60") | REMIT DEC-60 | Convergent · **ASSAY-local** (already known to REMIT; no export needed — recorded here as re-derivation evidence, not news) |

### Later batches

Appended as explorations conclude: thesis outcomes at stage exits, SME checkpoint results (comms §12), and re-derivation verdicts as REMIT-side citations arrive to close the `pending` entries above.

## 4. Open items

1. ~~The two `pending` entries (FIND-2, FIND-4) need their REMIT-side citations~~ — **closed 2026-07-12**: the REMIT register was consulted directly (REMIT DEC-22, DEC-13/NF3, DEC-21, DEC-25, NF10/DEC-14); FIND-2 concluded divergent, FIND-4 convergent, and FIND-1's REMIT-side citation was tightened from recollection to the register text.
2. ~~Whether this ledger joins the canonical set is a register candidate (concept §6.10)~~ — **resolved 2026-07-12**: ratified as ASSAY-DEC-26 (register batch 3). The ledger is canonical and the sole home of findings; a finding may now be cited for what an exploration *concluded*, but never as the origin of a decision — findings still inform REMIT *candidates* only, which is exactly the DEC-3 firewall.
3. Whether `did-not-hold` conclusions publish to the site's thesis states verbatim (honesty says yes; comms plan §3 already forbids claiming theses as proven — the symmetric case should be stated).
4. A shared upstream dependency worth watching, not yet a finding: REMIT NF10 requires band widths "derived from channel confidence/freshness, not arbitrary constants" (its K2), and ASSAY DEC-16 defers the same confidence→band-width mapping to research note `01-knowledge.md`. Both projects currently owe the same homework; whichever lands first should inform the other — through the candidate channel, not silent coupling (DEC-3).
