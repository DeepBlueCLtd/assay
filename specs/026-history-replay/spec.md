# Feature Specification: History, replay & trace depth (SPEC-26)

**Feature Branch**: TBD at pickup (spec authored on `claude/jipoe-c2-process-review-g4kwfn`; spec dir `026-history-replay`)

**Created**: 2026-07-15

**Status**: Draft — queued (implementation gates on the research note below; plan jointly with issue #24, whose shallow end this slice is)

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

### User Story 3 — Recursive trace tooltips (Priority: P2)

Hovering a verdict opens the one-hop menu as today; each entry expands in place — verdict → margin computation → channel reads → knowledge objects → provenance — to a stated depth cap, each hop labelled with its real relationship (edge type, or the interval operation for computation hops). At the cap, an honest "N more — open full trace" hands off to the existing trace drawer (and, when issue #24 lands, to the graph view).

**Why this priority**: Depth-on-demand provenance is the reading-flow version of G3; it is also #24's cheapest de-risking step.

**Independent Test**: Expand from a P2·C2 verdict; assert each hop's label matches the trace graph's actual edges/operations (no paraphrase layer); assert the cap renders the honest remainder count, never silent truncation; assert dead ends render as dead ends at any depth (G3).

**Acceptance Scenarios**:

1. **Given** an expanded chain, **Then** every hop resolves to a stored object or computation record and the chain matches `TraceStore.walk` output for the same origin (one source of truth).
2. **Given** the depth cap, **Then** the remainder affordance states the count and routes to the full trace drawer — truncation is visible, bounded, and escapable.

---

### Edge Cases

- **Scrubbing to seq 0 / before the first fixture load**: renders the honest empty store, not an error.
- **A seq whose delta is a refusal-producing attempt** (no state change): the cursor position exists, the refusal renders, state is unchanged from the prior seq — attempts are part of the record.
- **Very long histories**: reconstruction is a pure filter over an immutable store; if cost grows, the note decides a checkpointing rule — but stored checkpoints, if any, must be derivable and never authoritative over the deltas (the log remains the truth).
- **Replay while new live writes arrive**: the record grows at the head; the cursor stays put with a visible "M new" indicator — replay never silently jumps.
- **Tooltip expansion on a contested pair**: `contests` renders symmetrically (per the SPEC-16 orientation map) at every depth.
- **Cycles in the trace graph**: the existing cycle guard applies; a tooltip chain never loops.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: State-at-seq MUST be a deterministic reconstruction (filter over the immutable store by creation seq) byte-equal to a fresh replay of deltas 1…n; tested per heartbeat seq.
- **FR-002**: The scrubber MUST replay refusals, contests, resolutions, stamp flips, and staleness flags exactly as recorded; nothing unrecorded renders; no wall-clock anywhere (FIND-4).
- **FR-003**: Cursor transitions MUST re-fire glow under the live value-keyed rule (DEC-34) — no over- or under-report in replay.
- **FR-004**: Replay mode MUST disable writes, be visibly marked, and return cleanly to the live head; new live deltas during replay surface as a count, never a silent jump.
- **FR-005**: Narratives MUST be re-expressed as (seq, tab, note) waypoints driving the scrubber; the SPEC-17 presenter contract (navigation, notes, wall mode, honesty guard) is preserved; the parallel beat mechanism is removed in the same change.
- **FR-006**: Trace tooltips MUST expand recursively to a stated depth cap, each hop labelled from the trace graph itself (edge type / interval operation), with an honest remainder affordance at the cap and G3 dead-end rendering at every depth.
- **FR-007**: Tooltip chains MUST agree with `TraceStore.walk` for the same origin — one traversal semantics, no parallel walker.
- **FR-008**: All new rendering stays in pure components where values are shown (SPEC-14); all state in `src/app/`; no schema change; no seam change (the delta log and trace graph already cross the seam).

### Key Entities

- **HistoryCursor** (app-layer: `{seq, mode: live|replay}`) and **ScrubPath** (`{waypoints: [{seq, tab, note}]}` — the narrative re-expression). Neither is stored; the record is the existing deltas.
- Touches: `src/app/{state,shell,glow}.ts` (cursor, replay mode), `src/narratives.ts` (waypoint unification), `src/traceView.ts` + a recursive tooltip component (pure), `src/components/legends.ts`, tests.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The heartbeat replays from the record with byte-equal state at every seq and correct refusal/glow behaviour — no scripted state anywhere in the path.
- **SC-002**: All five narratives run on scrub paths with the SPEC-17 contract intact and the bespoke beat mechanism deleted.
- **SC-003**: Recursive tooltips match `TraceStore.walk`, cap honestly, and render dead ends at depth (G3).
- **SC-004**: Typecheck/tests clean; components pure; no schema/seam change; issue #24 gains a "design fed by SPEC-26" note at ratification.

## Assumptions

- The delta log's coverage is sufficient to reconstruct all surface-relevant state (DEC-5's "every cross-surface write is a stamped delta" is the guarantee); any gap found is a walkthrough-§0-class contract defect to log, not a reason to synthesise state.
- The depth cap lands between 2 and 3 per the note; the cap is a stated constant, not adaptive.
- Issue #24's full graph view remains separate; this slice must not grow a graph layout engine.
