# Implementation Plan: Interactive system-flow infographic (SPEC-14 · flow-view sub-slice)

**Research note (DEC-11 gate)**: `docs/research/07-flow-view.md` — present. Decides: (1) three zoom layers = Shneiderman's overview→zoom→details-on-demand; (2) the flow *is* a PROV provenance graph, so "why?" is a standard backward `wasDerivedFrom` closure terminating in `wasAttributedTo` (a named owner, G3), node-link idiom justified by the bounded tableau; (3) auto-recompute is honest **for an explainer** because the protected property is *attribution*, not manual triggering (glitch-freedom inherited from the G1 comparability guard); (4) the sandbox drives the real seam and labels — never fakes — what is not yet computed.

## Architecture — one component, pre-rendered over the real seam, swapped in the browser

The hard constraints — self-contained embed, offline-clean, zero network, one component in two homes — and the honesty constraint (DEC-4: real scorer, never theatre) point to the **band-pill embed pattern** (`scripts/build-embeds.ts`), not a browser bundle of the seam:

- Running the TS seam live in the browser would need a bundler and `crypto.subtle` (undefined under `file://` in some browsers) — breaking offline review.
- The sandbox palette is **bounded by design** (spec §4.3): `coa ∈ {R1,R2,R3,R3m}` × `contest ∈ {contested,resolved}` × `superseded ∈ {K9,K5}` × `waiver ∈ {granted,withheld}` = 32 states, plus the tour's BASE-world beats. Small enough to enumerate completely.

So: **drive the real seam at build time, capture every reachable state's real service/component output, inline it, and make the browser a pure `render(view)` state-swapper.** The pixels are the components' own; the interaction is real; there is no second copy of any rule to drift.

### Modules

| File | Role |
|---|---|
| `src/flow.ts` | The testable core. `computeState(fx, key, seed)` drives `KnowledgeService` → `CompileService` → `ScoreService`/`HandfulService` → `RelaxService` to one bounded state, capturing refusals, real stamps, the `DeltaLog` feed, and shipped-component HTML (`channelTrace`, `s2Matrix`, `handfulStrip`, `s3Cards`, `refusalBanner`, `bandPill`, `provenanceChip`). `buildFlowModel(fx, seed)` enumerates the sandbox + tour into a JSON-safe `FlowModel`. `computeComparability` produces the G1 guard result from the seam. Fixtures are passed in (file-free, testable). |
| `src/flowPage.ts` | `renderFlowPage(model)` — the offline-clean HTML shell: inline CSS, the model inlined as JSON, and a framework-free browser renderer (`render = f(store, view-state)`, ui-design principle 4) with L0/L1/L2 zoom and tour/sandbox controls. System-font stack (the wireframe's one web-font reference dropped). |
| `scripts/build-flow.ts` | Loads fixtures, `buildFlowModel(seed 42)`, writes `docs/assets/flow/index.html`. `npm run flow`. |
| `tests/flow.test.ts` | AS-1…AS-11 over the real model and emitted page. |

### View-state (spec §8)

`{ zoom: L0|L1|L2, mode: tour|sandbox, step: 0..6, sandbox: {coa, contest, superseded, waiver} }`. Each sandbox field maps 1:1 to a seam write; undo = re-seed to the frozen tableau (`DEFAULT_KEY` = R1 · resolved · K9-live · granted). Tour steps are pre-set state snapshots replaying the canonical order.

### Honest gating (spec §10)

- **Computed now** (Stages 0–4 done): compile · score · handful · relax · knowledge writes · deltas · trace. The tour and the whole sandbox palette run against these.
- **Scripted + labelled**: the staleness fan-out (`/analyse/staleness`, Stage 6) and selection (`/select`, later) — the walkthrough's oracle-consistent result behind an explicit "scripted — not yet computed" marker. The COA toggle re-scores per single excursion (real); no multi-scenario robustness *strip* is claimed (that is Stage 5).

### Two homes, one component (spec §4.6, comms §1.6)

`scripts/build-site.ts` copies `docs/assets/flow/index.html` → `site/flow.html`; `docs/assay-home.html` links it from a card. Reachable from the per-PR preview by clicking, never by typing a URL.

## Constitution / register check

- Register-first (DEC-2): asserts no decision; the four §6.15 candidates are built under delegated authority, ratify-after.
- Research-first (DEC-11): satisfied by `07-flow-view.md`.
- Banded honesty (G2), frozen identifiers (§8), determinism (G1), no-compute-of-its-own (DEC-5): enforced by reuse of the shipped components/services and by the AS tests.
