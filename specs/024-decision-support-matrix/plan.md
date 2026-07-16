# Implementation Plan: The Decision Support Matrix surface — decisions in time (SPEC-24)

**Spec**: `specs/024-decision-support-matrix/spec.md` · **Research note**: `docs/research/12-decision-support.md` (**DEC-11 gate — authored first**; decides the two-class DP predicate, the commit-step rule per metric kind, LTIOV = commit_step − lead with lead 0 stated, the three-state answerable-in-time predicate with the honest red branch, discriminator reuse via SPEC-12/23 classification, world-level tripwire scope, and the predicted Meridian exhibit that becomes the pinned fixture table) · **Register**: concept §6 items 27 (the DP derivation rule — ranking/semantics of DEC-18's class) and 28 (the derived surface + seam addition `POST /analyse/decision-support` — DEC-24-style contract growth); both flagged, not asserted (DEC-2)

## Shape — the note decides, the code carries

```
Phase A  note 12 + concept §6.27/§6.28                ── DP predicate, commit step, LTIOV, tripwires, exhibit prediction
   ▼
Phase B  seam + service (src/decisionSupport.ts)      ── thin orchestration: tensor + classification + geometry + windows
   ▼
Phase C  surface (components/dsmTable.ts + legends)   ── pure component; pills/steps/chips; red with arithmetic; no tasking
   ▼
Phase D  app wiring (state.ts commander panel)        ── S2-adjacent "Decisions in time"; G6 glow; refusal inheritance
   ▼
Phase E  gallery + tests + batch propagation + verify
```

Nothing in B–E starts before the note lands (DEC-11). No register decision is asserted — both candidates are **flagged** (concept §6.27/§6.28) awaiting the next batch (DEC-2).

## The load-bearing facts

- **Everything is reuse** (FR-002, DEC-10): the tensor comes from `RobustnessService` (scorer-in-a-loop over the supplied scenario worlds); discriminator classification is `classifySeparation` + `computeSeparation` (exported by `src/discrimination.ts`, untouched); commit-step reads are `channelAt` at exactly the points `metrics.ts` reads (leg `x, y, enter_step`); tripwires read `CompiledWorld.consumed` + `KnowledgeObject.validity`; traces go through the existing `TraceStore`. No new scoring engine, no schema change.
- **The metric registry is the responsible-element oracle**: `strait_open_step`→FE-BROOM, `port_open_step`→FE-PACKHORSE, `extraction_step`→FE-KINGFISHER, `threat_exposure`→scope (FE-ANVIL), `civil_harm_exposure`→FE-FALCON (fires — cannot scenario-diverge), `causeway_intact`→state (world-decided, horizon step). The DSM needs the same mapping; it lives in `decisionSupport.ts` as a projection of the registry's knowledge (metric kind + element/scope + channel), cited to the note.
- **Divergence vocabulary is the adversary COA set** ({R1,R2,R3}); BASE participates only as the selected world for margin-class evidence (note §2; the SPEC-23 posture).
- **The comparability guard precedes derivation**: `stamps_compatible: false` on the tensor ⇒ divergence evidence cannot be derived; margin-class rows only, with the reason stated — never a silently derived branch (spec US3, the mixed-stamps grey).
- **No scalar anywhere** (FR-003): every field on a row is a band, a step count, a verdict, a classification word, or a boolean state; row order is commitment `logical_id` (stated presentation order, no priority claim).
- **The red state is a first-class output** (FR-005): `earliest_result > ltiov` renders with both numbers; a row is never dropped for being red.

## Seam types (movement, not stored LinkML — spec Key Entities, note §2–§5)

- `DecisionSupportRequest {plan: Ref, world: Ref, worlds: Record<string, Ref>, commitments: Ref[], questions?: Ref[], engine_version}` — `world` is the selected world (margin-class evidence); `worlds` the scenario set the tensor ranges over (the app passes the same refs the scenario strip uses); `questions` the open-question refs (the store is class-blind — callers supply refs, as discrimination does).
- `DpEvidence {kind: 'scenario_divergence', pair: {a, b}, verdict_a, verdict_b} | {kind: 'margin', verdict, margin?: Band}` — the verdict pattern that makes the row a DP.
- `DsmCollection {method, cost: Band, earliest_result?, in_time?: boolean, slack?: number}` — `in_time` absent iff `earliest_result` unstated (never assumed answerable); `slack` present iff in time.
- `DsmDiscriminator {question: Ref, classes: {pair: {a, b}, classification: SeparationClass, separation: Band}[], collection: DsmCollection[]}` — non-nested on at least one evidence pair to attach.
- `DecisionPointRow {commitment, tier, statement, evidence: DpEvidence[], commit_step?: number, commit_kind: 'route_leg' | 'world_decided' | 'none', commit_detail: string, ltiov?: number, discriminators: DsmDiscriminator[], gap?: string, tripwires: {knowledge: Ref, valid_until: number, commit_step: number}[]}` — `commit_step`/`ltiov` absent for margin-class-only rows (stated absence); `gap` carries the named intelligence-gap sentence when no question can settle any evidence pair.
- `DecisionSupportSuccess {rows: DecisionPointRow[], plan: string, scenario_vocabulary: string[], lead: number, statement?: string, stamps_compatible: boolean, stamp}` — `statement` carries the honest empty state ("no verdict turns on open information") or the mixed-stamps fallback sentence.
- Sweep seam-contract §8 (analysis endpoints) at ratification per §6.28; until then the endpoint is listed under "Open items (register candidates)".

## The derivation, restated tight (note §2–§5)

1. Guard + tensor: resolve plan/world/commitments; robustness over `{plan} × worlds` (refusals pass through first-class); comparability from the tensor.
2. Per commitment (logical-id order): divergence evidence = COA pairs with differing verdicts (vocabulary-restricted); margin evidence = selected-world verdict ∈ {tight, marginal}. Neither ⇒ not a DP.
3. Commit step: route-reading metric ⇒ first leg (responsible element) whose metric-channel read differs across the live COA worlds, at `(x, y, enter_step)`; `state` metric ⇒ horizon step, `world_decided`; margin-only ⇒ `none`. Defensive: divergent verdicts with no divergent leg ⇒ `none` with the stated sentence (never an invented step).
4. LTIOV = commit_step − lead (lead 0, stated in the result); per collection option: in time (slack shown) / red / unstated.
5. Discriminators: open questions with `expected_answers`; per evidence pair `classifySeparation`; attach iff some pair is non-nested; order by best separation over evidence pairs (v1 comparator), ties by logical_id. None attachable ⇒ the named gap sentence.
6. Tripwires: consumed knowledge with `validity.valid_until < commit_step` (world-level scope, worded as such).
7. Stamp over `{plan hash, world stamps (sorted by scenario), commitment ids, question ids, lead, engine_version, analysis: 'decision-support'}`; store the result envelope; write `cited_in` edges — evidence verdict hashes, discriminator question hashes, tripwire knowledge hashes → the envelope (G3).

## Surface — `dsmTable` (pure) + the commander panel

- `src/components/dsmTable.ts`: one row per DP — commitment id/tier/statement; evidence rendered as verdict words + pair witnesses (divergent: "R1 robust ↔ R2 violated"; margin: verdict + margin pill); commit step + LTIOV as step counts with the commit detail in words ("FE-PACKHORSE enters the strait leg at step 10"; "world-decided — horizon read"; "margin-class — no scenario branch; see sensitivity"); discriminator block per question — classification words + marks per evidence pair, expected-answer pills **with SPEC-23 provenance chips**, collection lines with cost pill + in-time state (`in time — slack 2 steps` / `cannot answer in time — earliest result 8 > commit step 2` in the red style / `no earliest result stated`); tripwire lines with knowledge chip + "lapses at 36 — before the commit step (56); the world under this decision needs re-validation"; the honest empty state; the mixed-stamps statement; `data-glow-id`/`data-glow-sig` per row (value-keyed, G6); **no button, no tasking affordance** (FR-007).
- `src/components/legends.ts`: `decision_point`, `ltiov_state` (in time / red / unstated), `tripwire` entries; `dsmTable` pill set.
- `src/app/state.ts`: commander panel `dsm` — "Commander · decisions in time (the DSM, derived)" beneath the scenario strip; reuses the compiled scenario worlds + the first handful plan? **No** — the DSM derives for the canned P2 lineage (the walkthrough's selected plan; spec Assumption: absent `/select`, a viewer-chosen plan with the absence of commitment stated) so the pinned exhibit is what the operator sees; deps = row glow sigs + world/robustness stamps; the panel refuses with the compile (G5) exactly as the matrix does.

## Testable seams (Node, vitest)

- `tests/decisionSupport.test.ts` — **the pinned exhibit** (note §7, FR-008/SC-001/002): P2 rows exactly {C1: divergent, commit 10, K11 attached ({R1,R2} disjoint), KINGFISHER in time slack 2; C2: commit 2, red with arithmetic; C5: world-decided 56, K9 tripwire (36 < 56)}; P1 rows {C1/C2 commit 4 red; C3 margin-only, no commit step; C4 commit 8, in time slack 0; C5 as P2}; non-DPs asserted absent (P2-C3 uniformly violated; C4/C6 robust). Byte-identical stamp + rows on re-run (G1). Trace: every row element's `cited_in` edges terminate in named knowledge/owners (G3). Degenerate: all-robust ⇒ honest empty statement; mixed-stamp worlds ⇒ margin-class-only + statement; no-discriminator ⇒ named gap; unstated `earliest_result` ⇒ unstated state. No scalar: the result object contains no urgency/priority/score field (structural assertion).
- Component tests — no scalar urgency anywhere in the DOM (SC-003 regex over rendered HTML for forbidden words/patterns); red row renders both numbers; no `<button>`/tasking verb in the component (FR-007); legend keys render.
- `tests/app-*.test.ts` addition — panel present on commander tab; K9 supersede ⇒ rows re-derive and glow where displayed values moved (US3 AS-1); compile-refused state ⇒ the panel refuses with the compile.

## Out of scope / deferred (tracked)

- **Register ratification** of §6.27/§6.28 (next batch); seam-contract §8 sweep lands then (listed under Open items meanwhile).
- **NAI geography / DSM-on-the-map** — a later increment over SPEC-19 (note §6).
- **Non-zero lead** — an authored, banded assessment; deferred, stated on the surface.
- **`/select` integration** — the surface derives for the viewer-chosen canned plan with the absence of a selection stated (spec Assumptions).
