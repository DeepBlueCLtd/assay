# Feature Specification: History, replay & trace depth (SPEC-26)

**Feature Branch**: TBD at pickup (spec authored on `claude/jipoe-c2-process-review-g4kwfn`; spec dir `026-history-replay`)

**Created**: 2026-07-15

**Status**: US1/US2 queued (gate on the research note below, present). **US3 rescoped and built (2026-07-17)** — issue #24's full dependency-graph view (DEC-47) shipped ahead of this slice, so US3 now *integrates* with it (reuses its traversal, hands its counted remainders off to it) rather than pre-figuring it. US3 is independent of US1/US2 and lives in `traceView.ts` + `components/recursiveTrace.ts`.

**Input**: JIPOE/C2 process review (`docs/reviews/2026-07-14-jipoe-c2-process-review.md` §6.2, mockups M5/M7, addendum §10 slice S-G). Two viewport moves over machinery that already exists: **(1)** a **decision-history scrubber** — the delta log and stamp lineage already form an event-sourced record of the session (the walkthrough's seq 42–46 *is* a replayable heartbeat); a scrubber over it replays compiles, refusals, contests/resolutions, and verdict flips, with the glow re-firing at each transition. This is the after-action-review instrument: *what did we believe, when did we believe it, and what did each change invalidate*. It is deliberately distinct from SPEC-19's timeline, which scrubs **world time** (the scenario clock); this scrubs **decision time** (the delta sequence). The two compose. Stage-7 narratives become curated scrub paths, unifying the narrative runner with replay instead of maintaining a parallel beat mechanism. **(2)** **recursive-on-demand trace tooltips** — the one-hop informs/influenced-by menu (SPEC-16) becomes recursively expandable, depth-capped (~2–3 per the CK3 nested-tooltip practitioner guidance), each hop rendering the actual relationship (which interval operation, which edge type) — the shallow end of issue #24's full dependency-graph view, shippable first and feeding its design.

**Research Note**: `docs/research/15-replay.md` (DEC-11 gate — **to be authored before implementation**; decides the state-at-seq reconstruction rule, what a replayed refusal renders as, the narrative-runner unification, and the tooltip depth cap; frames against AAR practice — plan/what-happened/why/what-next — and event-sourcing honesty)

**Register Decisions Restated**: DEC-5 (every cross-surface write is a stamped delta — the substrate), DEC-21 (immutable content-addressed store — state-at-seq is a filter, not a rollback), DEC-17/FIND-4 (no wall clock on stored objects — replay orders by seq and scenario clock only), DEC-34 (glow semantics reused, not re-invented), G1 (determinism makes replay honest), G3 (dead ends render as dead ends at every tooltip depth)

**Register candidates** *(flagged, not asserted — to be recorded in `docs/assay-concept.md` §6 before build)*: (1) the **replay surface** (an observer-tab mode or overlay — extends DEC-32's shell); (2) the **recursive-trace affordance** (extends the SPEC-16 one-hop menu decision); (3) **narratives-as-scrub-paths** (touches DEC-23's demo-moment machinery — the runner drives the scrubber instead of its own beat list).

## Honesty stance

Replay is where a record quietly becomes a story. Three rules bind: **state-at-seq is reconstruction, not narration** — the view at cursor *n* must equal, byte for byte, the state a fresh store reaches by applying deltas 1…n (the immutable store makes this a filter over creation seq, and G1 makes it testable); **refusals replay as refusals** — the K12 contest banner re-renders at its seq exactly as it rendered live, because the refusal is part of the record, not an error to elide; and **nothing plays that was not recorded** — no tweened intermediate states, no synthesised "meanwhile", no wall-clock timestamps resurrected (FIND-4). For the future C2 application this is the audit story: the record *is* the interface.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Scrub the heartbeat (Priority: P1) 🎯 exit

An observer drags the history cursor across the walkthrough's recorded heartbeat (seq 42–46). At each position, every surface shows exactly the state as of that delta: at 42 the K9 supersession lands and the staleness flags appear; at 43 the K12 contest breaks and the compile refusal banner shows; at 44 the resolution; at 45 the recompile (stamp flip, matrix re-derives); at 46 the selection. Transitions re-fire the glow exactly as they did live.

**Why this priority**: The heartbeat is the demonstrator's core narrative; replaying it from the record — not from a script — is the exit that proves the record is sufficient.

**Independent Test**: Reconstruct state at each seq 41–46 via the scrubber; assert byte-equality with a fresh store fed deltas 1…n for each n; assert the seq-43 view renders the contested-compile refusal and the seq-45 view the new stamp; assert glow fires on cursor transitions exactly where displayed values change (G6/DEC-34) and nowhere else.

**Acceptance Scenarios**:

1. **Given** the cursor at seq *n*, **When** any surface renders, **Then** its state equals the fresh-replay reconstruction at *n* (tested byte-equal), including refusal banners that were live at *n*.
2. **Given** a cursor move *n*→*m*, **Then** glow fires exactly on the elements whose displayed values differ between *n* and *m* — the same value-keyed rule as live (DEC-34), replayed.
3. **Given** replay mode, **Then** all write affordances are disabled and the mode is unmistakably marked ("replaying seq n of N — record, not present"); leaving replay returns to the live head.

---

### User Story 2 — Narratives become curated scrub paths (Priority: P2)

Each Stage-7 narrative is re-expressed as a sequence of (seq cursor, tab, presenter note) waypoints over the recorded history. The runner drives the scrubber; beat navigation, presenter notes, and doctrinal quotes are unchanged for the presenter; the parallel beat-state mechanism retires.

**Why this priority**: One mechanism instead of two — and narratives gain the record's honesty (a narrative can only show what was recorded).

**Independent Test**: Run each of the five narratives end-to-end in the unified runner; assert every beat's rendered state comes from the scrubber's reconstruction (no residual bespoke state); assert the banded-honesty presenter-note guard (SPEC-17) still passes.

**Acceptance Scenarios**:

1. **Given** a narrative beat, **When** it plays, **Then** the surface state is the scrub reconstruction at the beat's seq — narratives can no longer drift from the record.
2. **Given** the presenter's view, **Then** navigation, notes panel, and wall-projection behaviour are unchanged (SPEC-17 contract preserved).

---

### User Story 3 — Recursive trace tooltips (Priority: P2) — RESCOPED (issue #24 has landed)

**Rescope (2026-07-17).** When this story was written the full dependency-graph view (issue #24 / DEC-47) did not exist, so US3 was specified as its "shallow end," pre-figuring a traversal and a handoff target that were still hypothetical. That view has since shipped (`src/depGraph.ts` + `components/depGraphRiver`/`depGraphSidebar`, a full-screen overlay reachable from the SPEC-16 one-hop menu). US3 now **integrates with it rather than pre-figures it**:

- **Reuse, no parallel walker.** The recursive tooltip is the shipped one-hop reading (`traceView.neighbours` under `EDGE_ORIENTATION`) recursed hop by hop — *the same traversal the DEC-47 graph walks*. There is one traversal semantics; the tooltip introduces no second walker (FR-007). It agrees with the full graph by construction (both consume `neighbours`), with a path-based cycle guard matching `TraceStore.walk`.
- **The cap remainder opens the real surface.** "N more — open full trace" routes to the shipped dependency-graph overlay (`openDepOverlay`), **focused on the exact hop the tooltip stopped at** (by content hash) — not a hypothetical drawer.
- **Redundancy dropped.** No new walker, no new "trace drawer," no bespoke handoff target — the shipped overlay is all three. What remains genuinely additive is the *in-reading-flow depth-on-demand nesting* (the shallow end), which the full-screen overlay does not provide.
- **Placement.** US3 lives in `traceView.ts` (the traversal) + a pure `components/recursiveTrace.ts` (the render); the shell change is a thin wire into the existing menu that reuses `openDepOverlay`. Independent of US1/US2 — parallelisable.

An observer hovers a verdict and opens the one-hop menu as today; each entry expands in place — verdict → world (the interval evaluation) → knowledge objects → provenance — to a **stated depth cap of 3**, each hop labelled with its real relationship (the `edge_type`, plus a fixed operation gloss on the two computation edges). Expansion is progressive (collapsed by default, revealed on demand). Each hop is also **breadth-capped**: a high-fan-out hop (a knowledge object compiled into a world `scored_from` by every verdict) shows a handful of neighbours and a counted "+N more — open full trace", adopting the DEC-47 view's own per-layer breadth-truncation honesty rather than dumping the whole subtree. At the depth cap, an honest "N more — open full trace" hands off to the shipped graph view focused on that hop.

**Why this priority**: Depth-on-demand provenance is the reading-flow version of G3; post-#24 it is also the cheapest way to make the full graph *discoverable* from the reading flow.

**Independent Test**: Expand from a verdict/knowledge origin; assert each hop's label matches the trace graph's actual edges/operations (no paraphrase layer); assert the depth-1 children equal `neighbours()` for the origin and the reachable set is a subset of the shipped `buildDepGraph` reachable set (one traversal semantics); assert both the depth-cap remainder and the breadth-cap overflow render the honest counted "open full trace" affordance, never silent truncation; assert dead ends render as dead ends at any depth (G3).

**Acceptance Scenarios**:

1. **Given** an expanded chain, **Then** every hop resolves to a stored object (or a surfaced dead end, G3), the depth-1 layer equals the one-hop `neighbours()` reading, and every reached node is one the shipped `buildDepGraph` reaches for the same origin (one traversal, no parallel walker).
2. **Given** the depth cap OR a breadth overflow, **Then** the remainder affordance states the count and opens the shipped dependency-graph overlay focused on that hop — truncation is visible, bounded, and escapable (G4).

---

### Edge Cases

- **Scrubbing to seq 0 / before the first fixture load**: renders the honest empty store, not an error.
- **A seq whose delta is a refusal-producing attempt** (no state change): the cursor position exists, the refusal renders, state is unchanged from the prior seq — attempts are part of the record.
- **Very long histories**: reconstruction is a pure filter over an immutable store; if cost grows, the note decides a checkpointing rule — but stored checkpoints, if any, must be derivable and never authoritative over the deltas (the log remains the truth).
- **Replay while new live writes arrive**: the record grows at the head; the cursor stays put with a visible "M new" indicator — replay never silently jumps.
- **Tooltip expansion on a contested pair**: `contests` renders symmetrically (per the SPEC-16 orientation map) at every depth.
- **Tooltip expansion on a high-fan-out hop** (a knowledge object whose world is `scored_from` by every verdict): the breadth cap shows a handful and a counted "+N more — open full trace"; the whole subtree is never dumped into the tooltip. The wide reading is the DEC-47 graph's job (it has its own per-layer breadth cap); the tooltip defers to it.
- **Cycles in the trace graph**: the path-based cycle guard applies (matching `TraceStore.walk`); a tooltip chain never loops.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: State-at-seq MUST be a deterministic reconstruction (filter over the immutable store by creation seq) byte-equal to a fresh replay of deltas 1…n; tested per heartbeat seq.
- **FR-002**: The scrubber MUST replay refusals, contests, resolutions, stamp flips, and staleness flags exactly as recorded; nothing unrecorded renders; no wall-clock anywhere (FIND-4).
- **FR-003**: Cursor transitions MUST re-fire glow under the live value-keyed rule (DEC-34) — no over- or under-report in replay.
- **FR-004**: Replay mode MUST disable writes, be visibly marked, and return cleanly to the live head; new live deltas during replay surface as a count, never a silent jump.
- **FR-005**: Narratives MUST be re-expressed as (seq, tab, note) waypoints driving the scrubber; the SPEC-17 presenter contract (navigation, notes, wall mode, honesty guard) is preserved; the parallel beat mechanism is removed in the same change.
- **FR-006**: Trace tooltips MUST expand recursively to a stated depth cap (3), each hop labelled from the trace graph itself (edge type + a fixed operation gloss on computation edges), collapsed-by-default progressive disclosure, with a **stated breadth cap** per hop, an honest counted remainder at BOTH the depth cap and any breadth overflow, and G3 dead-end rendering at every depth.
- **FR-007**: Tooltip chains MUST reuse the shipped one-hop `neighbours` reading under `EDGE_ORIENTATION` recursed hop by hop — the same traversal the DEC-47 dependency-graph view walks — with a path-based cycle guard matching `TraceStore.walk`; **no parallel walker**. The counted-remainder affordances MUST open the shipped dependency-graph overlay focused on the hop where the tooltip stopped (integrate, not pre-figure).
- **FR-008**: All new rendering stays in pure components where values are shown (SPEC-14); all state in `src/app/`; no schema change; no seam change (the delta log and trace graph already cross the seam).

### Key Entities

- **HistoryCursor** (app-layer: `{seq, mode: live|replay}`) and **ScrubPath** (`{waypoints: [{seq, tab, note}]}` — the narrative re-expression). Neither is stored; the record is the existing deltas.
- Touches: `src/app/{state,shell,glow}.ts` (cursor, replay mode), `src/narratives.ts` (waypoint unification), `src/traceView.ts` + a recursive tooltip component (pure), `src/components/legends.ts`, tests.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The heartbeat replays from the record with byte-equal state at every seq and correct refusal/glow behaviour — no scripted state anywhere in the path.
- **SC-002**: All five narratives run on scrub paths with the SPEC-17 contract intact and the bespoke beat mechanism deleted.
- **SC-003**: Recursive tooltips reuse the shipped `neighbours`/`buildDepGraph` traversal (one semantics, no parallel walker), cap honestly in both depth and breadth, hand off to the shipped graph overlay, and render dead ends at depth (G3).
- **SC-004**: Typecheck/tests clean; components pure; no schema/seam change. US3 integrates with the shipped issue #24 surface (its own close-out already notes the "big brother / shallow end" relationship, DEC-38/DEC-47); the breadth-cap refinement is flagged as a register candidate, not asserted (DEC-2).

## Assumptions

- The delta log's coverage is sufficient to reconstruct all surface-relevant state (DEC-5's "every cross-surface write is a stamped delta" is the guarantee); any gap found is a walkthrough-§0-class contract defect to log, not a reason to synthesise state.
- The depth cap is a stated constant, fixed at 3 per the note; the breadth cap is likewise a stated constant per hop, not adaptive.
- Issue #24's full graph view **has shipped** (DEC-47) and remains a separate surface; this slice must not grow a graph layout engine — it reuses that view's traversal and hands the wide/deep readings off to it.
