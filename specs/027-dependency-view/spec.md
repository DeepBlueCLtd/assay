# Feature Specification: Focused transitive dependency view (SPEC-27)

**Feature Branch**: `claude/research-note-14-2m9nzb`

**Created**: 2026-07-16 (retro-formalised — the code was authored ahead against issue #24; commits `2c35499`/`245f7a1`)

**Status**: Built — retro-anchored to research note `docs/research/14-dependency-view.md` (the DEC-11 gate authored after the code and reconciled to it)

**Input**: Issue #24 (user request during the SPEC-16 review): "pick one item (K/C/R/P) and see its **entire** upstream (what informs it) and downstream (what it influences) chains at once, rendered as a graph, rather than the one-hop, expand-on-click context menu SPEC-16 ships." Decide placement (fifth surface / overlay / full-screen mode), keep it honest (dead-ends as dead-ends, frozen identifiers, no fabricated nodes), and watch scale (depth limits with an honest "N more", never silent truncation).

**Research Note**: `docs/research/14-dependency-view.md` (DEC-11 gate — decides the transitive orientation walk, the river+sidebar layout, the scale-honesty rule, and the overlay placement).

**Register Decisions Restated**: DEC-10 (reuse the `TraceStore` + `EDGE_ORIENTATION`, no new engine), DEC-32 (four role tabs stand — the view is a drill-in, not a sixth tab), DEC-36(c) (re-centring is selection, not computation — no recompute, no glow); constitution III (edges written at compute time, only read here), G2/G6 (no scalar, no band collapse), G3 (dead-ends surfaced), G4 (no silent drop).

**Register candidate** *(flagged, not asserted — recorded in `docs/assay-concept.md` §6.29 per DEC-2)*: the focused transitive dependency view as a drill-in provenance surface. Presentation-only: no schema change, no new engine, no new invariant (the scale-honesty rule is G3/G4 applied to a view). SPEC-27 may not be cited as authority.

## Honesty stance

A node-link "dependency graph" is exactly the shape thesis G's false-precision risk warns about — so the honesty stance is the note's §6 argument, made a build constraint: **the view renders only edges a service actually wrote at compute time** (constitution III), never inferred interdependencies. There is nothing to invent; dead-ends render as dead-ends (G3); frozen identifiers only (labels are `logical_id · name`). The view is structural, not evaluative: it re-scores nothing, collapses no band, introduces no scalar (G2/G6), and re-centring on a clicked node is a pure re-projection, not a computation (DEC-36(c)). Scale is bounded but every bound is stated where it bites (G3/G4): a depth-capped walk that stops with a non-empty frontier says so; a wide layer states its full count and composition.

## User Scenarios & Testing

### User Story 1 — See the whole chain around one item (Priority: P1)

From the existing one-hop trace menu on any item, a "View full graph →" link opens a full-screen overlay: a horizontal river with upstream layers (what informs) on the left, the focus in the centre, and downstream layers (what it influences) on the right, colour-coded by object type.

**Why this priority**: the request. The one-hop menu answers "what touches this"; the view answers "where does this come from and where does it go" in one read.

**Independent Test**: `buildDepGraph(focus)` returns a `DepGraph` with depth-ordered upstream/downstream layers; the focus appears in no layer; no node repeats within a direction; downstream of a K includes the compiled world, upstream of a world includes its knowledge.

**Acceptance Scenarios**:

1. **Given** a knowledge item K5, **When** the graph is built, **Then** the compiled world is downstream and any superseding/contesting peers are placed on the correct side — because the walk resolves each edge under `EDGE_ORIENTATION`, not raw hash direction.
2. **Given** a clicked node in the river, **When** it is selected, **Then** the view re-centres on it (a pure re-projection) and nothing is recomputed, re-scored, or written.

### User Story 2 — The bounds are honest (Priority: P1)

The walk is bounded by depth (default 4) and per-layer width (5); both bounds are surfaced.

**Independent Test**: a depth-1 walk from K5 leaves a non-empty downstream frontier ⇒ `downstreamTruncated === true` and the river renders a stated end-cap; a generous-depth walk exhausts the graph ⇒ no truncation flag, no end-cap. A layer wider than the cap renders `+ N more` with a full type summary. An unknown neighbour renders as a dead end (G3).

**Acceptance Scenarios**:

1. **Given** a depth cap that stops with more to explore, **Then** the view says "… deeper sources / deeper effects …", never silently drops the remainder (G3/G4).
2. **Given** a trace dead-end, **Then** it renders at reduced opacity labelled "(dead end — G3)", surfaced not hidden.

### User Story 3 — Details on demand (Priority: P2)

Clicking a node populates a detail sidebar: the node's metadata (identifier, name, status, band as `[lo,hi] unit` — never a midpoint), then upstream and downstream neighbours grouped by depth and edge type.

**Independent Test**: `nodeDetail(hash)` returns metadata and edge-type-grouped neighbour lists; the sidebar renders "Upstream (depends on)" and "Downstream (feeds into)" sections; a band appears as an interval.

## Requirements

- **FR-001** The transitive walk MUST resolve each edge under `EDGE_ORIENTATION` for the direction being walked (mirror for upstream) and BFS by orientation-distance — never by raw hash direction.
- **FR-002** The view MUST be read-only over the trace store: no recompute, no re-score, no write, no glow. Re-centring is selection.
- **FR-003** A depth-capped walk that stops with a non-empty frontier MUST surface that (`upstreamTruncated`/`downstreamTruncated` + a stated end-cap); a wide layer MUST state its full count and composition; dead-ends MUST render as dead-ends.
- **FR-004** Labels MUST use frozen vignette identifiers (`logical_id · name`); no fabricated nodes.
- **FR-005** No scalar and no band collapse anywhere (G2/G6).
- **FR-006** Placement is a full-screen overlay reached from the one-hop trace menu, NOT a new tab (DEC-32 stands).
- **FR-007** No new engine, no schema change: a projection of the existing `TraceStore` + `EDGE_ORIENTATION` (DEC-10).

## Implementation (as built)

- `src/depGraph.ts` — `buildDepGraph` / `nodeDetail` + the orientation-aware `walkDirection` (BFS, depth-layered, truncation-reporting).
- `src/components/depGraphRiver.ts` — the horizontal river (pure HTML), per-layer width cap with `+ N more` + type summary, stated depth-truncation end-caps.
- `src/components/depGraphSidebar.ts` — the detail sidebar (pure HTML), neighbours grouped by depth and edge type.
- `src/app/state.ts` — `depGraph` / `depGraphByHash` / `depNodeDetail` on `AppState`.
- `src/app/shell.ts` — the full-screen overlay: "View full graph →" link on the trace menu, clickable nodes that re-centre, backdrop/Close dismissal.
- `docs/assets/dep-graph-mocks/index.html` — the three-option review mockup (A river / B vertical DAG / C layered list) that preceded the build.
- `tests/depGraph.test.ts` — BFS properties, depth ordering, node classification, truncation honesty, component rendering (16 tests).
