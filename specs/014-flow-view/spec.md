# Feature Specification: Interactive system-flow infographic (SPEC-14 · flow-view sub-slice)

**Feature Branch**: `claude/assay-system-flow-infographic-pjvzlw` (spec dir `014-flow-view`)

**Created**: 2026-07-13

**Status**: Built

**Neighbourhood**: SPEC-14 (site/gallery — the shared component library and its published surfaces). This is not a new spine SPEC (SPEC-10…13 are reserved for robustness/analysis); it is a **site/gallery sub-slice** that composes the *already-shipped* services and components into a stakeholder explainer. **Depends on**: SPEC-06 (compile), SPEC-07 (score), SPEC-08 (handful), SPEC-09 (relax), SPEC-05 (knowledge/deltas/trace), SPEC-14 (the shipped components). **Research note**: `docs/research/07-flow-view.md` (DEC-11 gate — present; decides the three-zoom structure, the fan-out-vs-recompute distinction, and the auto-recompute honesty argument). **Proposal**: `docs/assay-flow-infographic-spec.md` (+ wireframe companion).

**Input**: The S4 Bridge grown into a stakeholder-facing explainer of the object → connector → gate flow — one self-contained embed, two homes (in-app S4 "systems-map" mode + public Pages explainer). It **originates nothing** and **computes nothing of its own**: every node and edge is a projection of a stored object or a seam response (DEC-5, ui-design principle 4). Its value is making the demonstrator's honesty claims legible to people who will never read the seam contract.

## Honesty stance *(the point of this slice)*

1. **Real seam, not animation (DEC-4).** Sandbox and tour consequences are computed by the shipped services — `CompileService`, `ScoreService`, `HandfulService`, `RelaxService`, `KnowledgeService`, `DeltaLog`, `TraceStore`. The bounded palette (spec §4.3) makes the reachable state space small and enumerable, so every state is **pre-rendered at build time over the real seam** and the browser swaps between the services' own outputs (the blessed band-pill embed pattern, `scripts/build-embeds.ts`). No hand-tweened numbers; no re-implementation of any rule in browser JS; no runtime crypto; no bundler; zero network (self-contained, offline-clean).
2. **Bands stay banded (G2/DEC-9).** Every assessed value renders through the shipped `bandPill` / `provenanceChip` / verdict chips — no bare scalar anywhere in the DOM. Reused, never re-drawn.
3. **Recompute is automatic *and* attributable — never silent (§2.2).** A recompute triggered by a knowledge write flips the world stamp, lands a real `DeltaLog` row, and pulses the gate. Attribution is mandatory; only the *trigger* is automated. S2's deliberate "recompile when ready" is **unchanged and unreplaced** — this view is S4's explainer form, not a replacement for S2. The truly-silent "you-are-the-optimiser" toggle stays deferred.
4. **Gates are never bulldozed.** Auto-recompute only *triggers* a compile; the compile still refuses on a contested pair (G5), still gates the withheld waiver (waiver_required), still greys cross-stamp comparisons (G1). A gate firing is the best thing in the piece — surfaced, not suppressed.
5. **Scripted, never faked (spec §10, note §5).** Two computations are not built yet: the **staleness fan-out** (`/analyse/staleness`, thesis F, Stage 6) and **selection** (`/select`, a later slice). Where they appear they are scripted from the walkthrough's oracle-consistent result and carry an explicit **"scripted — not yet computed"** marker. A scripted result never masquerades as a computed one.
6. **Frozen identifiers only (vignette §8).** `K*`, `C*`, `R*`, `FE-*`, `P*`, `W-1` render exactly as frozen. Stamps are the real content hashes the services compute (the vignette freezes no stamp value).

## User Scenarios & Testing *(mandatory)*

All scenarios play against the frozen Meridian tableau (D+2, step 8) and are realised as tests in `tests/flow.test.ts`. Each maps to one acceptance-intent item AS-1…AS-11 (proposal §9).

### User Story 1 — one view, four audiences, three zoom layers (Priority: P1) 🎯 exit

One artefact serves SMEs, commanders, technical reviewers, and non-specialists through **viewer-dialled depth** (Shneiderman's mantra, note §2): **L0** orientation (one sentence, no doctrine), **L1** heartbeat (the six-beat flow, the star layer), **L2** object/trace detail (drill into any node → its backward chain to a named owner). The zoom control **is** the audience switch.

**Independent Test**: Load the embed; assert L0 shows the one-sentence claim with no doctrinal identifier; L1 shows four role lanes; L2 terminates every channel value in a named owner (`owner:`).

**Acceptance Scenarios** → AS-8 (zoom register), AS-1 (banded honesty at every layer).

### User Story 2 — guided tour, the canonical spine (Priority: P1) 🎯 exit

A deterministic playback of the walkthrough beats 1–6, oracle-consistent (vignette §9) so it cannot drift. Each beat pauses on its gate moment: the supersession fan-out (scripted), the K12 contest refusal (G5), the R3m relaxation report (G4). Narration is the comms layer; the flow beneath is the real seam.

**Independent Test**: Step the tour 0→6; assert beat 2 renders a `contested_knowledge` refusal + a gate pulse, beat 5 renders three least-worst cards, beats 1 and 6 carry a visible "scripted" marker.

**Acceptance Scenarios** → AS-3 (contest gate), AS-4 (staleness, scripted), AS-6 (least-worst), AS-2 (recompute attribution).

### User Story 3 — bounded sandbox against the real seam (Priority: P1) 🎯 exit

The viewer drives a **bounded action palette** and watches real consequences: toggle excursions R1/R2/R3/R3m → recompile + re-score; contest/resolve K12 → refuse (G5) / succeed; supersede K5→K9 → scripted fan-out; grant/withhold W-1 → the waiver travels / refuses `waiver_required`. Every action lands a delta, flips the relevant stamp, and is undoable by re-seeding to the frozen tableau (deterministic, G1).

**Independent Test**: In the sandbox, toggle `contested` → assert refusal; `withhold` W-1 → assert `waiver_required`; `R3m` → assert three least-worst cards; `undo` → assert the default (R1, K9-live, resolved, granted) state returns byte-identically.

**Acceptance Scenarios** → AS-5 (waiver travel), AS-6 (least-worst), AS-7 (comparability), AS-9 (determinism), AS-10 (undo), AS-11 (self-containment).

## Acceptance intent → tests (proposal §9)

| # | Constraint | Test |
|---|---|---|
| AS-1 | Banded honesty (G2) — no bare assessed scalar | every channel value through a band pill; matrix faces carry no decimal |
| AS-2 | Recompute attribution — never silent | a knowledge-write-triggered recompute lands a delta **and** flips the stamp |
| AS-3 | Contest gate (G5) | contested pair → `contested_knowledge` refusal, no world stamp |
| AS-4 | Staleness fan-out (F) — scripted, labelled | flags exactly `{P1·C2, P2·C1, P2·C2}`, marked not-yet-computed |
| AS-5 | Waiver travel (DEC-9) | withhold → `waiver_required`; grant → a live `waives` edge |
| AS-6 | Least-worst (G4) | R3m → three candidates, each `sacrificed` non-empty, tie-break stated |
| AS-7 | Comparability (G1) | cross-stamp score refuses `stamp_mismatch` |
| AS-8 | Zoom register | L0 no doctrinal node; L2 every node → named owner |
| AS-9 | Determinism (G1) | same seed + tableau ⇒ byte-identical model |
| AS-10 | Undo | re-seeding reproduces the frozen tableau exactly |
| AS-11 | Self-containment | zero external network references in the emitted page |

## The visual layer (arranges, never computes)

Beyond swapping the real service/component outputs, the browser draws three things — none of which computes: a **pipeline rail** (the five stages + six gates, the active one lit, a token travelling it per beat — the flow made visible); a **Meridian map** (SVG over the real `VignetteConfig` region geometry, with the current world's threat/mobility channel overrides overlaid live — so the R1/R2/R3/R3m excursion is *visibly* different terrain; concept §6.15 candidate c, built under delegated authority, ratify-after); and **motion** (beat transitions, gate-fire flashes, ▶ auto-play). All are projections of stored objects / seam responses (DEC-5); the map tints only regions the compiled world actually overrides, never a hand-drawn claim.

## Non-goals

Not a live operational tool; not a fifth role surface (it is S4's explainer form); does not author new vignette content; does not implement the truly-silent teaching toggle (concept §6.15 candidate d — deferred for an SME reaction).

## Register posture

No new register decision is asserted. The four behavioural candidates (concept §6.15) are built **under delegated authority** (DEC-2's escape hatch, the §6.12/6.13 pattern); ratifying entries are owed in the next batch (ratify-after). Research-first (DEC-11) is satisfied by `07-flow-view.md` preceding implementation.
