# Feature Specification: Spatial & temporal COA visualisation — research, mockups, interaction (SPEC-19)

**Feature Branch**: `claude/coa-visualization-spec-ll7s9z` (spec dir `019-coa-visualisation`)

**Created**: 2026-07-14

**Status**: Draft — **review-first** (the deliverable is a research note + reviewable mockups, not a shipped surface; the interactive build gates on SME feedback)

**Stage**: Front-end depth lane (post-SPEC-16) · **Depends on**: SPEC-16 (`src/app/*` live in-browser pipeline + glow), SPEC-14 (the pure component kit), SPEC-06/07 (`CompileService`/`ScoreService` — channels + route-walk verdicts), the Meridian fixtures (`fixtures/vignette-config.json` region geometry; `fixtures/plans.json` route geometry) · **Research note**: `docs/research/10-spatial-temporal.md` (**DEC-11 gate — to be authored by this spec's US1; implementation of US3/US4 does not start until it lands**) · **Register candidates**: concept §6 item 21 (flagged) — extends ASSAY-DEC-31(c) (map schematic in the flow view) to a first-class, temporal, interactive COA surface

**Input**: From reading the blog posts on how knowledge items influence COAs (SPEC-18, "From Q&A to COA"), a gap surfaced: the demonstrator has no **spatial** or **temporal** visualisation of a COA. Every surface today is tabular — the honest matrix (`s2Matrix`), the handful strip, the relaxation cards, the scenario strip. Yet a verdict *is* a **route walking through a banded channel surface over time**: the SPEC-18 article says so in words ("a knowledge item to a COA verdict is **spatially mediated**… a commitment's metric walks a force element's **route** and, at each leg, may or may not read that channel"), but nothing renders that geometry. This slice researches how to make the spatial and temporal dimensions accessible, invites review framed around those two aspects, explores alternative perspectives that reveal something the tables hide, produces **mockups over the Meridian worked example for feedback**, and specifies **interactions that accept input, not only convey understanding**.

## Honesty stance *(the point of this slice)*

A map is the single most tempting place in this whole demonstrator to launder banded intelligence into false precision. A heat-map cell wants one colour; a timeline wants one instant; a route wants one cost. Every one of those is a scalar an assessed source never gave us. SPEC-19 refuses by construction — and refuses *visibly*, because the refusal is exactly what is new to show.

1. **The geometry is real, not drawn (DEC-4).** Regions render from their actual `VignetteConfig` bounding boxes on the 60×60 grid; routes render from their actual `plans.json` `(x,y)` waypoints and `enter_step`/`exit_step` windows; channel values are the real compiled world. No hand-drawn map, no illustrative geometry, no invented cell values — a mockup here is a *projection of fixtures*, the same honesty class as the SPEC-14 gallery.
2. **A banded surface stays banded (G2).** No channel cell renders as a single value implying a point estimate. A banded channel renders its band as a band — a paired lo/hi extent, a two-stop texture, or an explicit `[lo, hi] unit` on hover through the shipped `bandPill` — never one heat stop standing in for an interval. No assessed scalar reaches the canvas unbanded, exactly as in every table.
3. **Time renders validity, not interpolation (G2/thesis F).** The temporal axis shows **validity windows** (`K5` steps 0–16, `K9` steps 8–36) and **task windows** (route legs' `enter_step`/`exit_step`) as discrete extents. It never tweens a band into a smooth curve of implied certainty between two timesteps; between-sample state is shown as unknown, not intoned.
4. **Input edits geometry or endpoints, never the answer.** Interactive input drags a **route waypoint** or shifts a **task window** (a new `Plan` version — immutable objects, DEC-20/21) or edits a **band endpoint** (`lo`/`hi`/`unit`) — never a scalar verdict, cost, or a bare cell value. The downstream verdict is then **recomputed by the real pipeline** (the SPEC-16 in-browser services), never authored — same recompute the app already performs, moved onto the map.
5. **The reveal is the honest gap, not a prettier claim.** The perspective this slice adds must make *visible* what SPEC-18 proved in prose: that a band reaches a verdict only where a metric reads the channel **and** the route enters the region (K6→C4 propagates; K7→C4 misses because the route never enters `air_defence`; K3→C3 is geometric and never reads the band). A visualisation that hid that gap to look more complete would be the exact dishonesty DEC-19 forbids.

## User Scenarios & Testing *(mandatory)*

All scenarios play against the frozen Meridian fixtures. Identifiers are frozen (`K*`, `C*`, `R*`, `FE-*`, `P*`); the map and timeline render vignette identifiers only.

### User Story 1 — a research note on spatial & temporal accessibility, authored for review (Priority: P1) 🎯 gate

Before any pixel is committed to the build, a bounded research note (`docs/research/10-spatial-temporal.md`) is authored under the DEC-11 gate. It decides: how a **banded channel surface** renders without implying a point value; how the **temporal dimension** renders (validity windows, task windows, the storm channel peaking D+5–D+7) without tweening certainty; which uncertainty-visualisation and cartographic conventions this domain can honestly borrow; and — explicitly — **what it is asking reviewers to react to, framed as two questions: is the spatial treatment honest and legible, and is the temporal treatment honest and legible?** The note ends with an *invitation to review*, not a decision asserted as closed, and wires into the SME listening loop (comms §12).

**Why this priority**: Research-first (DEC-11) is non-negotiable — a spatial/temporal treatment is precisely where honesty can silently fail, so the note *is* the gate, not a formality. It is also the artefact the user asked for first ("do some research into how we can make them more accessible, and invite review").

**Independent Test**: The note exists in `docs/research/`, cites primary sources (uncertainty visualisation, cartographic conventions for intervals, space-time cube / Shneiderman, alongside the JIPOE MCOO doctrine already in concept §7), states the banded-surface and validity-window rendering rules it decides, and closes with an explicit spatial-and-temporal review invitation and a comms §12 checkpoint hook. No `src/` change is required to satisfy US1.

**Acceptance Scenarios**:

1. **Given** the DEC-11 gate, **When** the note lands, **Then** it decides the banded-surface rule (no single-stop cell for an assessed channel) and the temporal rule (validity/task windows, no interpolated certainty), each traced to a cited convention or a register entry.
2. **Given** the note, **When** its closing section is read, **Then** it poses the two review questions (spatial honesty/legibility; temporal honesty/legibility) and names the artefact reviewers will react to (the US3 mockups), not an abstract prompt.
3. **Given** register-first (DEC-2), **When** the note implies new decisions, **Then** they are recorded as **candidates** (concept §6 item 21) and flagged, never asserted in the note as ratified.

---

### User Story 2 — alternative perspectives that reveal something new (Priority: P1)

The research note surveys **at least three** perspectives on a COA and recommends the one that reveals what the tables hide, rather than defaulting to a single plan-view map. Candidate perspectives to weigh: **(a)** a plan-view **map** — regions as banded channel surfaces with force-element routes overlaid; **(b)** a **temporal** view — an exposure-and-events timeline where each route's leg windows, each channel's validity windows, and the storm peak line up on one clock; **(c)** a **cross-cut that is genuinely new** — e.g. an **exposure profile** that plots a plan's banded `threat_exposure` accumulating *along the route over time* so a `C4` verdict becomes legible as *where and when* the dwell was banked (making K6's propagation and K7's miss visible as geometry), or **small multiples** of the four-plan handful over one map so the trade axes (approach C1↔C2, suppression C3↔C4) read spatially, or a **space-time cube** unifying (x, y, step). The note picks and justifies; the pick must satisfy the §5 "reveal the honest gap" test.

**Why this priority**: The user explicitly asked the spec to "consider alternative perspectives — it would be great to reveal something new." The value of the slice is not a map for its own sake; it is surfacing the route×channel×time relationship that the numeric matrix cannot show and that SPEC-18 could only describe.

**Independent Test**: The note enumerates ≥3 perspectives with an honesty and a legibility appraisal for each, recommends one (or a composed pair), and states concretely *what new thing* the recommendation reveals on the Meridian data (e.g. "the C4 exposure profile shows ANVIL banking [12,36] band-hours inside `fac_waters` under P1, and zero inside `air_defence` — K7's region the route never enters").

**Acceptance Scenarios**:

1. **Given** the survey, **When** each perspective is appraised, **Then** each carries an explicit false-precision risk note (how it could lie) and how the rule in §5 defuses it.
2. **Given** the recommendation, **When** it is stated, **Then** it names a concrete Meridian exhibit it makes newly visible, tied to a §7 coverage row or a named thesis (A, C, E, or F).

---

### User Story 3 — mockups over the Meridian worked example, for feedback (Priority: P1) 🎯 exit

The recommended perspective(s) are realised as **reviewable mockups** rendered from real Meridian fixtures — the plan-view map with banded channel surfaces and `P1`/`P2` routes overlaid, plus the temporal companion — reachable by clicking (comms §6 rule 4/6: self-contained, offline-clean, linked from a navigable page, dated-frozen). These are **for feedback**, in the honesty class of the wireframes and the gallery: real geometry, real compiled-world bands, no faked verdicts. They are the artefact the US1 review invitation points at.

**Why this priority**: The user asked the spec to "go on to create mockups, for feedback and review — largely based on the worked example in this plot." This is the tangible thing SMEs react to; without it US1's invitation has nothing to land against.

**Independent Test**: Open the mockup(s). Assert every region drawn matches a `VignetteConfig` bounding box, every route drawn matches a `plans.json` waypoint set, every channel value shown is a band (inspect the DOM — no bare assessed scalar), and the exhibits reproduce known fixture facts (P1 ANVIL's route enters `fac_waters` and not `air_defence`; the storm band peaks steps 20–28). Assert the mockup is self-contained (no network) and linked from a home-page card.

**Acceptance Scenarios**:

1. **Given** the Meridian regions, **When** the map renders, **Then** each region's extent equals its `x0,y0,x1,y1` box and each channel overlay renders its band (two-stop/extent), never a single stop for an assessed channel (G2).
2. **Given** `P1` and `P2`, **When** their routes render, **Then** each leg matches a `plans.json` `(x,y,enter_step,exit_step)` and hovering a leg shows its window and the banded channels it dwells in.
3. **Given** the temporal companion, **When** it renders, **Then** `K5`'s validity (steps 0–16) and `K9`'s (steps 8–36) show as discrete windows with the supersession edge marked, and the storm surge shows as a banded ridge (no interpolated line), never a smooth certainty curve.
4. **Given** comms §6, **When** the mockup ships, **Then** it is self-contained, carries the Meridian "assessment, not fact" disclaimer, is dated-frozen, and is reachable by clicking from `assay-home.html`.

---

### User Story 4 — interaction: input as well as understanding (Priority: P2)

The mockups are **interactive**, and the interaction accepts **input**, not only conveys understanding. Two classes, both honest by construction:

- **Understanding** — **scrub** the timeline to a step and see the world *at that step* (which channels are live, storm surge, which route legs are active); **hover** a cell for its banded channel value + `provenanceChip`; **hover** a route leg for its window and the banded exposure it banks.
- **Input** — **drag** a route waypoint or **shift** a task window (authoring a new `Plan` version), or **edit** a band endpoint on a channel's source knowledge, and watch the affected **verdict recompute live** through the SPEC-16 in-browser pipeline, with the changed panels/cells **glowing** (G6) exactly as elsewhere. A dishonest input (a scalar answer, an assumption dressed as a constraint) is **refused in place** (G2/G5), never silently accepted.

The full production wiring of the interactive surface into the live app is the slice's *exit-after-review*: the interaction model is specified here and prototyped in the mockups against the real pipeline, so reviewers can feel the input; promoting it to a standing surface (a fifth tab or an S2/S4 mode) follows the US1 review, so SME reaction shapes it before it hardens (comms §12; the DEC-31(d) "you-are-the-optimiser" caution — some interactions must stay attribution-visible, never silently optimise).

**Why this priority**: The user asked the spec to "consider the interactions… ideally they will allow for input, as well as understanding." P2 because US1–US3 deliver the reviewable core (research + mockups); the input loop is the payoff that reuses SPEC-16's honest recompute rather than inventing a new one.

**Independent Test**: In the interactive mockup, scrub to step 24 and assert the active-channel/active-leg set matches the fixtures at step 24; drag `FE-ANVIL`'s P1 waypoint out of `fac_waters` and assert C4's margin recomputes through the real `ScoreService` (not a lookup) and the C4 cell glows; attempt a dishonest edit and assert a `refusalBanner` renders and nothing persists.

**Acceptance Scenarios**:

1. **Given** the timeline, **When** the operator scrubs to step *n*, **Then** the map shows exactly the channels valid at *n* and the route legs active at *n*, banded throughout (understanding, no state faked).
2. **Given** a draggable waypoint, **When** the operator moves `FE-ANVIL` clear of `fac_waters`, **Then** the pipeline re-scores P1×C4 live, the new margin band renders, and the changed cell/panel glows (input → real recompute → G6).
3. **Given** a dishonest input, **When** it is submitted, **Then** it is refused in place (G2/G5) and nothing persists; every value on the canvas in every state is inside a band (no bare assessed scalar).
4. **Given** an input that changes plan geometry, **When** it recomputes, **Then** the recompute is byte-identical to a from-scratch `ScoreService` run over the edited plan (live = real; G1).

---

### Edge Cases

- **A channel with only a `default` band and no region override**: renders its default band across the world extent as a band, not blank and not a scalar — absence of override is not absence of value.
- **A route leg wholly outside every channelled region** (a "quiet" leg): shows zero banked exposure explicitly as `[0,0]`, not as missing data — the honest zero, distinct from unknown.
- **Scrubbing past a validity window** (step > K5's 16 before K9 supersedes): the stale channel is shown as *lapsed*, marked, never silently carried forward as if still current (thesis F honesty).
- **A drag that makes the plan infeasible** (a waypoint onto a `K1` hard-constraint depth violation): the compile/score refuses and the refusal renders in place; no fabricated verdict.
- **Contested `K12` unresolved**: the mine-threat channel refuses to compile; the map shows the refusal over `mine_stock`/approach waters, not a blank or a guessed surface (G5).
- **Two bands overlapping spatially** (e.g. `threat.garrison` and `civil_density.port_district` both over the district): both render legibly as bands without one being reduced to a scalar to "fit"; the legend keys which is which.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A research note `docs/research/10-spatial-temporal.md` MUST be authored under the DEC-11 gate before US3/US4 implementation begins; it MUST decide the banded-surface rule and the temporal validity/task-window rule, survey ≥3 perspectives (US2), and close with an explicit spatial-and-temporal review invitation wired to comms §12.
- **FR-002**: All spatial geometry MUST derive from real fixtures — regions from `VignetteConfig` bounding boxes, routes from `plans.json` waypoints/windows — with no hand-drawn or illustrative geometry (DEC-4).
- **FR-003**: No channel cell or surface MUST render an assessed value as a single point/stop; every assessed channel renders its band as a band and every on-demand value renders through `bandPill` (`[lo,hi] unit`) — no bare assessed scalar reaches the canvas in any state (G2).
- **FR-004**: The temporal view MUST render validity windows (`K5`/`K9`) and task windows (route legs) as discrete extents and MUST NOT interpolate a band into an implied-certainty curve between samples; lapsed/stale channels are marked, never carried silently (thesis F).
- **FR-005**: The mockups MUST reproduce known Meridian fixture facts exactly — P1 `FE-ANVIL` enters `fac_waters` and not `air_defence`; the storm band peaks steps 20–28; `P1`/`P2` routes match `plans.json` — and MUST be self-contained (no network), dated-frozen, carry the Meridian disclaimer, and be reachable by clicking from `assay-home.html` (comms §6).
- **FR-006**: The chosen perspective MUST make visible the SPEC-18 honest gap (band reaches verdict only where metric reads channel AND route enters region): K6→C4 propagation, K7→C4 route-miss, K3→C3 geometric-only, shown as geometry, not asserted in prose.
- **FR-007**: Interactive **input** MUST edit only plan geometry (a new `Plan` version), task windows, or band endpoints (`lo`/`hi`/`unit`) — never a scalar verdict/cost/cell value — and MUST route through the SPEC-16 services so encoding/lint/contested gates apply; a dishonest input returns a first-class `Refusal`/warning and persists nothing (G2/G5).
- **FR-008**: An input that changes plan geometry or a consumed band MUST trigger a **live recompute** by the real in-browser pipeline (no faked or precomputed downstream) and MUST glow exactly the panels/cells whose `content_hash` changed (G6), reusing the SPEC-16 glow machinery — no under- or over-report.
- **FR-009**: The recompute over an edited plan MUST be byte-identical to a from-scratch `ScoreService` run over the same inputs (live = real; G1); oracle O-1…O-4 remain reproducible.
- **FR-010**: The spatial/temporal renderers SHOULD reuse the pure component kit where a value is shown (`bandPill`, `provenanceChip`, `refusalBanner`, `channelTrace`) and, if any new renderer is added, it MUST stay pure (generated-types-only; no app state, no service calls — SPEC-14 extractability). All state stays in `src/app/`.
- **FR-011**: No schema change (`npm run gen` not run); the map/timeline render frozen vignette identifiers only. Any new decision (the banded-surface convention, the drag-to-recompute geometry-edit affordance, a standing spatial/temporal surface) is recorded as a concept §6 candidate and flagged, not asserted (DEC-2).
- **FR-012**: Where a computation the view wants is not yet built, it MUST be visibly labelled "scripted — not yet computed" and be oracle-consistent, never faked (DEC-4; the flow-view precedent, note 07).

### Key Entities *(no new stored shapes — all exist)*

- **Region geometry** — `VignetteConfig.regions[]` (`name`, `x0,y0,x1,y1`); the spatial substrate, already in `fixtures/vignette-config.json`.
- **Channel + RegionOverride** — the sparse `Channel` (`default: Band` + `RegionOverride[]`, ASSAY-DEC-29); the banded surface being rendered.
- **Route** — `Plan.elements[].route[]` (`x`, `y`, `enter_step`, `exit_step`); the spatial-temporal path being overlaid and edited.
- **CommitmentVerdict / margin band** — the scored output the input loop recomputes (`threat_exposure`, `strait_open_step`, etc.); rendered, never authored.
- **New (if any), pure** — `src/components/coaMap.ts` / `coaTimeline.ts` (types-in, SVG/HTML-string-out) and `src/mapProject.ts` (grid→viewport projection, pure, testable). Any state lives in `src/app/`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `docs/research/10-spatial-temporal.md` exists, decides the banded-surface and temporal-window rules against cited conventions, surveys ≥3 perspectives, and closes with a spatial-and-temporal review invitation + comms §12 hook. *(Gate.)*
- **SC-002**: The recommended perspective names a concrete Meridian exhibit it newly reveals, tied to a §7 coverage row / named thesis. *(US2.)*
- **SC-003**: The mockups render from real fixture geometry only; every region/route/band matches its fixture; every assessed value on the canvas is inside a band (no bare scalar — G2); the K6/K7/K3 gap is visible as geometry. *(US3 exit.)*
- **SC-004**: The mockups are self-contained, dated-frozen, disclaimered, and reachable by clicking from `assay-home.html` (comms §6).
- **SC-005**: In the interactive mockup, scrubbing reflects true per-step state; dragging `FE-ANVIL` clear of `fac_waters` recomputes P1×C4 through the real `ScoreService` with the changed cell glowing; a dishonest input is refused in place with nothing persisted (G2/G5/G6).
- **SC-006**: The edited-plan recompute is byte-identical to a from-scratch service run (G1); oracle O-1…O-4 reproduce; any new renderer imports only generated types (extractability holds).
- **SC-007**: `npm run typecheck` clean; `npm test` green (existing baseline plus any new `mapProject`/renderer unit suites); the mockup builds offline-clean.

## Blog & Evidence Plan *(mandatory)*

### Article plan

- **Title**: "Where the plan meets the water — a COA as a route through a banded surface"
- **Thesis / demo moment**: Thesis A (pipeline) made spatial + thesis C/E/F legibility — the K6→C4 propagation and K7→C4 route-miss shown as *geometry* on the Meridian map, with the C4 exposure profile banking `[12,36]` band-hours inside `fac_waters` and `[0,0]` where the route misses `air_defence`.
- **Narrative hook**: "SPEC-18 proved in words that a banded answer reaches a verdict only where the metric reads the channel *and* the route enters the region. Here it is as a picture — and you can drag the route and watch the verdict move."
- **Embed type**: live component — the mockup drives the real in-browser pipeline (SPEC-16), so the drag-recompute is a genuine re-score, not a tween. (If the interactive wiring lands after review, the first article ships the static mockup as an *illustrative widget* over real fixtures, upgraded to *live component* when US4 promotes.)

### Evidence captures

1. **The map with P1 routes over banded channels**
   - Page/component: `coaMap` mockup (or gallery entry)
   - State: P1 rendered; `threat` surface over `fac_waters` banded; `FE-ANVIL` route entering `fac_waters`, standing off `air_defence`
   - Files: `docs/blog/evidence/spec-19/map-p1-light.png`, `map-p1-dark.png`

2. **The temporal companion — validity windows and the storm ridge**
   - Page/component: `coaTimeline` mockup
   - State: `K5` (steps 0–16) and `K9` (steps 8–36) as windows with the supersession edge; storm band peaking steps 20–28; P1 leg windows aligned
   - Files: `docs/blog/evidence/spec-19/timeline-light.png`, `timeline-dark.png`

3. **Drag-to-recompute — the C4 margin moving**
   - Page/component: interactive mockup (or its scripted-labelled stand-in if pre-US4)
   - State: before/after dragging `FE-ANVIL` clear of `fac_waters`; C4 margin band and glow visible
   - Files: `docs/blog/evidence/spec-19/drag-recompute-light.png`, `drag-recompute-dark.png`

## Assumptions

- **Review before hardening.** The primary deliverables are the research note (US1/US2) and the reviewable mockups (US3); the standing interactive surface (US4 promotion) is deliberately *after* the US1 review so SME reaction shapes it (comms §12). The interaction model is fully specified here and prototyped in the mockups.
- **Reuse the SPEC-16 pipeline for input.** Live recompute uses the already-shipped in-browser services and glow — this slice adds rendering and an input affordance, not a new compute path.
- **Fixture geometry is sufficient and authoritative.** Region boxes and route waypoints in the fixtures are the spatial truth; where a fixture value would decide a §7 coverage row, the vignette wins (vignette §8). No new geometry is invented.
- **Grid rendering is a projection, not a basemap.** The Meridian is fiction (DEC-8); the map is a schematic of the 60×60 grid (per ASSAY-DEC-31(c)), never a real-world basemap or tile layer — no external map service, keeping embeds offline-clean (comms §6 rule 4).
- **No new stored shape.** `Region`, `Channel`/`RegionOverride`, `Route`, and `CommitmentVerdict` already carry every field the views need; `npm run gen` is not run.
