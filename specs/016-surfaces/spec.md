# Feature Specification: Interactive surfaces — live, keyed, tabbed, trace-aware (SPEC-16)

**Feature Branch**: `claude/published-app-shortcomings-25q0y8` (spec dir `016-surfaces`)

**Created**: 2026-07-13

**Status**: Draft

**Stage**: Front-end lane (SPEC-16 — Surfaces S1–S4 + banded-honesty polish) · **Depends on**: SPEC-14 (the eight pure components), SPEC-05…09 (the live services: `Knowledge/Compile/Score/Handful/Relax`, `ObjectStore`, `TraceStore`, `DeltaLog`), D3 (seam contract) · **Research note**: `docs/research/05-surfaces.md` (DEC-11 gate — present; decides in-browser bundling, the shell/pure-component split, edit honesty, glow semantics, the edge-orientation map, and the legend copy) · **Register candidates**: concept §6 items 15 (tabs/SPA), 16 (live pipeline + editable), 17 (glow + trace menu)

**Input**: The published app is static (build-time HTML, zero client interactivity). This slice makes it a **live single-page app** running the *actual* pipeline in the browser: four role tabs over one shared client store, full editability gated by the existing honesty machinery, propagation made visible as a "glow", per-component legends, and a one-hop "informs / influenced by" trace menu on any item. No schema change (`npm run gen` not run — all shapes exist); the services, store, trace walk, and components are reused, not re-implemented.

## Honesty stance *(the point of this slice)*

Interactivity is where a demonstrator is most tempted to fake — to script a before/after pair, or ship precomputed snapshots and switch between them, and call it "live." SPEC-16 refuses by construction: the downstream consequences are the *same recompute the gallery already performs* (the compute core is browser-safe — `contentHash` targets `globalThis.crypto.subtle`, the services import no host API), moved from build time to click time.

1. **Live means live (no faked downstream).** An operator edit re-runs the real `compile → score → handful → relax` over the real store; the result is computed, never authored.
2. **Editing stays honest by refusing (G2/G5).** Every edit is a service call, not a mutation — objects are immutable (DEC-21). A dishonest edit returns a first-class `Refusal`/`waiver_required` and persists nothing; values edit **band endpoints**, never a scalar; no assessed scalar renders unbanded.
3. **The glow is the graph, not decoration (G6).** A panel/tab glows **iff a `content_hash` it depends on changed** on recompute — read off the trace graph. It cannot under-report a consequence.
4. **Extractability survives (SPEC-14).** The eight components stay pure (types-in, HTML-out); all state lives in a new `src/app/` shell. The extractable kit is exactly what stayed pure.
5. **The key is on the surface.** Every component carries a collapsible legend defining each pill it shows and *why it is banded* — the reported "pills aren't self-explanatory" gap, closed at the point of use.

## User Scenarios & Testing *(mandatory)*

Scenarios play against the Meridian fixtures, seeded into the client store at load exactly as `build-gallery.ts` seeds the build-time run.

### User Story 1 — a live intervention with visible downstream consequences (Priority: P1) 🎯 exit

On the **J-2** tab, the operator resolves the contested **K12** pair (or edits an assessed band). The shell re-runs the pipeline; the **planner (S2)** tab's honest matrix rescoring, the affected verdict cells, and the **J-2 → planner** tab button **glow** for ~10s; the **observer (S4)** feed shows the new delta. Nothing is faked — the recompute is the real `CompileService`/`ScoreService`.

**Why this priority**: This is the user's first and load-bearing shortcoming ("more interactive, operators making interventions with live downstream consequences"). It is the whole reason the slice exists.

**Independent Test**: Drive the app (Chromium). Record the `stamp`/verdict state; resolve K12; assert the compiled-world stamp changes, at least one verdict cell changes, the changed panels carry the glow class, and the S4 delta count increments. Assert the recompute used the real services (the new stamp equals a fresh `ScoreService.score` over the same inputs).

**Acceptance Scenarios**:

1. **Given** the seeded store with K12 contested, **When** the operator resolves K12a on the J-2 tab, **Then** the compile succeeds, the plans rescore, and the planner tab + changed matrix cells glow.
2. **Given** a resolved world, **When** the operator edits an assessed band that a channel consumes, **Then** exactly the channels/verdicts whose content-hash changed glow — and no others.
3. **Given** any edit, **When** the recompute runs, **Then** the resulting stamps are byte-identical to a from-scratch run of the same services on the same inputs (live = real).

---

### User Story 2 — full editability, honesty-gated (Priority: P1)

The operator can edit any field the pipeline honestly consumes — an assessed answer band's `lo`/`hi`/`unit`, a knowledge object's status, resolve/contest, the active scenario (BASE/R3m), regenerate the handful, request `/relax`. A dishonest edit is **refused in place**, not silently accepted or faked.

**Why this priority**: The user chose "full editability"; honesty-by-refusal is the only way that is not a licence to lie. This is G2/G5 under interaction.

**Independent Test**: Attempt to edit K-something into an assumption-as-hard-constraint (or a low-confidence tight band); assert a `refusalBanner`/lint caution renders, the store size is unchanged (nothing persisted), and no bare scalar appears anywhere in the DOM. Assert a legitimate band edit persists a new version and recomputes.

**Acceptance Scenarios**:

1. **Given** the edit control, **When** the operator submits an assumption dressed as a hard constraint, **Then** `checkEncoding` refuses, the banner renders where the save was attempted, and nothing persists.
2. **Given** a low-confidence value edited to a suspiciously tight band, **When** submitted, **Then** the confidence-lint caution renders (a warning, still saved — DEC-27) and the band, not a scalar, is stored.
3. **Given** any surface state at any time, **When** the DOM is inspected, **Then** every assessed value is inside a band pill (no bare assessed scalar — G2).

---

### User Story 3 — four role tabs with cross-tab and downstream glow (Priority: P1)

The app presents **four literal tabs** — J-2 workbench, planner workbench, commander view, observer/bridge. An edit on one tab that changes data another tab depends on makes that other **tab button glow yellow**; any downstream **component** that changed glows yellow for ~10s. The glow is derived from the changed-content-hash set, never hand-wired.

**Why this priority**: The user's third shortcoming, verbatim ("4 tabs; updating one tab glows another's button; downstream components glow ~10s"). It is also the honest recovery of the "different roles" illusion tabs otherwise weaken (concept §6.14).

**Independent Test**: Resolve K12 on J-2; assert the planner and commander tab buttons carry the glow class and the observer feed updates; assert a tab whose dependency set did *not* change does **not** glow. Assert the glow class clears after its window.

**Acceptance Scenarios**:

1. **Given** four tabs, **When** an edit on tab A changes an object tab B renders, **Then** tab B's button glows and tab A's does not (the edit's own tab is the source, not a downstream).
2. **Given** a downstream component whose content-hash changed, **When** the recompute completes, **Then** it glows for ~10s and then clears.
3. **Given** a component whose content-hash did **not** change, **When** the recompute completes, **Then** it does not glow (no over-report), and every changed one does (no under-report — G6).

---

### User Story 4 — one-hop "informs / influenced by" trace menu (Priority: P2)

Any item chip (a K/C/R/P id) opens a context menu with two expandable sections — **Informs (upstream)** and **Influenced by / Influences (downstream)** — listing its immediate neighbours in the trace graph. Each neighbour is itself expandable (walks one more hop on click). Dead-ends render honestly (G3).

**Why this priority**: The user's fourth shortcoming ("before/after context menus expanding to show the logic items that inform or are influenced by the current item"). P2 because US1–US3 deliver the interactive core; US4 adds interrogation over the same graph.

**Independent Test**: Open the menu on K12; assert **Influences** lists its compiled world/channel (one hop) and expanding once reaches the verdicts; assert **Informs** walks upstream via the orientation map; assert a severed/unknown terminal renders a dead-end marker, not a fabricated node.

**Acceptance Scenarios**:

1. **Given** K12 after compile, **When** the menu opens, **Then** its one-hop downstream neighbours are the objects reached under the per-`edge_type` orientation map (`compiled_into` forward; `scored_from` backward), not a naive single-direction walk.
2. **Given** a neighbour in the menu, **When** it is expanded, **Then** the next hop is fetched and shown; cycles are guarded.
3. **Given** a terminal hash the store does not know, **When** it is reached, **Then** it renders as a dead-end (`complete: false`), never hidden (G3).

---

### User Story 5 — per-component legends (Priority: P2)

Each component carries a collapsible legend defining every pill type it shows and why it is banded (band pill, provenance chip, four-stop verdict, tier chip, waiver/blocks-compile, refusal). The legend is a pure, types-only renderer.

**Why this priority**: The user's second shortcoming ("when a new data pill is introduced there should be a key"). P2 because it is additive and does not gate the interactive core.

**Independent Test**: Render each surface; assert each component's legend enumerates exactly the pill types that component uses; assert `src/components/legends.ts` imports nothing from services or app state (extractability).

**Acceptance Scenarios**:

1. **Given** any component on any tab, **When** its legend is opened, **Then** every pill type it renders is defined, including "why banded".
2. **Given** the legend module, **When** its imports are inspected, **Then** it depends only on generated types (SPEC-14 extractability holds).

---

### Edge Cases

- **Edit that changes nothing** (byte-identical re-create): no new delta, no glow — the store is idempotent (`create` publishes no delta on identical content, FR-010 of SPEC-05); the glow set is empty, honestly.
- **Contest with no resolve**: the compile refuses `contested_knowledge`; the planner/commander tabs show the refusal, not stale scores; the glow marks the refusal state as changed.
- **A recompute that refuses partway** (e.g. `waiver_required` on an edited value): the refusal renders in place; downstream panels show "no world / superseded by refusal", never stale results passed off as current.
- **Trace menu on an item with no edges yet** (pre-compile): Informs/Influences are empty, stated as such, not fabricated.
- **Glow window overlap**: a second edit inside the 10s window re-arms the glow on the newly-changed set; unrelated panels still clear on their own timers.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST run the real `Knowledge/Compile/Score/Handful/Relax` services in the browser over one shared `ObjectStore` + `TraceStore`, seeded from the Meridian fixtures at load — no faked or precomputed downstream.
- **FR-002**: The app MUST be bundled framework-free (esbuild) into a self-contained `docs/assets/app/` artifact (inlined fixtures, no external services/CDNs); a new `build:app` script produces it and `build:site` publishes it.
- **FR-003**: Operator edits MUST be routed through the services (create/supersede/contest/resolve; scenario switch; handful; relax) so encoding/lint/contested gates apply; a dishonest edit MUST return a first-class `Refusal`/warning and persist nothing on refusal (G2/G5).
- **FR-004**: Value edits MUST edit band endpoints (`lo`/`hi`/`unit`), never a scalar; the DOM MUST never contain a bare assessed scalar in any state (G2).
- **FR-005**: The eight `src/components/*` renderers MUST remain pure (generated-types-only; no app state, no service calls) — all state lives in `src/app/` (the shell/pure-component split; SPEC-14 extractability).
- **FR-006**: The app MUST present four literal role tabs (J-2, planner, commander, observer) over the one store.
- **FR-007**: After each recompute, the app MUST compute, per panel and per tab, the set of `content_hash`es it depends on, diff against the prior render, and apply a glow to exactly the panels/tabs whose dependency set changed — no under-report (every changed one glows, G6), no over-report (unchanged ones do not). The glow window is ~10s, display-only (DEC-17).
- **FR-008**: A one-hop, expandable "informs / influenced by" menu MUST be available on any item chip, populated by `TraceStore.forward/backward` under a per-`edge_type` orientation map (`src/traceView.ts`); logical ids resolve to latest version hash first; dead-ends render `complete: false` (G3).
- **FR-009**: Each component MUST carry a collapsible legend (`src/components/legends.ts`, types-only) defining each pill it shows and why it is banded.
- **FR-010**: The in-browser pipeline MUST reproduce oracle cases O-1…O-4 exactly (never regenerated) and be deterministic (G1): the same edits in the same order reproduce the same stamps.
- **FR-011**: No schema change (`npm run gen` not run); no new stored LinkML shape. Surfaces render frozen vignette ids only.

### Key Entities

- **`src/app/` shell** (new, not stored) — the client bootstrap: store + services + tab rendering + edit wiring + recompute + glow. Vanilla TS + DOM.
- **`src/traceView.ts`** (new, not stored) — the per-`edge_type` orientation map and one-hop `informs()`/`influences()` over a `TraceStore` + hash→label resolver. Pure, testable.
- **`src/components/legends.ts`** (new, pure) — per-component legend renderers from note 05 §5.
- **Existing, reused unchanged** — `ObjectStore`, `TraceStore`, `DeltaLog`, the five services, the eight components, `encoding.ts`, `lint.ts`, `seam.ts`.

## Success Criteria *(mandatory)*

- **SC-001**: On the running app, resolving contested K12 on J-2 recomputes the pipeline; the planner tab + changed verdict cells glow ~10s; the S4 delta increments — the recompute stamps equal a from-scratch service run (live = real). *(Exit.)*
- **SC-002**: A dishonest edit is refused in place with nothing persisted; every assessed value in every state is inside a band pill (no bare scalar — G2).
- **SC-003**: The glow set equals the changed-content-hash set exactly (no under- or over-report — G6); the glow clears after its window.
- **SC-004**: The trace menu on K12 lists correct one-hop neighbours under the orientation map (downstream reaches the world via `compiled_into` forward and the verdicts via `scored_from` backward), expands a further hop, and renders dead-ends honestly (G3).
- **SC-005**: Each component's legend defines every pill it shows; `src/components/legends.ts` imports only generated types (extractability holds).
- **SC-006**: `npm run typecheck` clean; `npm test` green (SPEC-01…09 baseline plus the SPEC-16 `traceView`/glow-diff unit suites); `npm run build:app` emits a self-contained bundle; oracle O-1…O-4 reproduce from the in-browser pipeline.
- **SC-007**: The interactive demonstrator is embedded in a dated blog article (comms §6) with a working, self-contained embed of the shipped `src/app/` code, and the home page reflects the demonstrator as live (comms §6.12 currency).
