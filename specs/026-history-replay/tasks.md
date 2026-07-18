# Tasks: History, replay & trace depth (SPEC-26)

Dependency-ordered. `[P]` = parallelisable (different files, no incomplete-task dependency). Story labels map to `spec.md`: **[US1]** scrub the heartbeat (P1 🎯 exit), **[US2]** narratives as scrub paths (P2), **[US3]** recursive trace tooltips (P2).

**Gate**: research note `docs/research/15-replay.md` present (DEC-11) and DEC-37/38/39 ratified (register batch 7) — Phase 1 is done; Phases 2+ build on it. No new engine (DEC-10), no schema change, no seam-contract shape change.

## Phase 1 — Setup & gate (the DEC-11 + register gate) — DONE

- [X] **T01** Author `docs/research/15-replay.md`: the state-at-seq fold rule (filter over the immutable store, byte-equal by G1), replayed refusals re-deriving, the narrative-runner unification onto `(seq, tab, note)` waypoints, the recursive-trace tooltip depth cap fixed at 3; AAR + event-sourcing framing; decision-time vs SPEC-19 world-time distinction; citations.
- [X] **T02** Ratify DEC-37 (replay surface), DEC-38 (recursive-trace tooltip), DEC-39 (narratives-as-scrub-paths) in `docs/assay-register.md` (batch 7); strike through concept §6.32–6.34.

## Phase 2 — Foundational (blocking prerequisites for US1 and US2)

- [ ] **T03** `src/seam.ts`: add a `refused` value to the existing `Delta['op']` union (a value, not a shape change) so a refused write attempt is a recordable op; no other seam type changes.
- [ ] **T04** `src/app/history.ts` (NEW) — movement types `HistoryCursor { seq, mode: 'live'|'replay' }` and the `HistoryIndex`: `objectSeq: Map<contentHash, seq>` (first delta whose refs name the hash) and `edgeBoundary: number[]` (`traceStore.edges.length` after each op's delta), populated at publish time — derived, non-authoritative over the log (note §2).
- [ ] **T05** `src/app/history.ts` — `storeViewAt(n)` (read-only `exists/get/versions` filtered to `objectSeq(hash) ≤ n`, so `versions(logical_id)` reports the correct head-at-n) and `traceViewAt(n)` (`edges.slice(0, edgeBoundary[n])` behind the `TraceStore` read surface); no copy — predicates over the shared immutable store (DEC-21).
- [ ] **T06** `src/app/history.ts` — `reconstructAt(n)`: run the existing `snapshot()` over `storeViewAt(n)`/`traceViewAt(n)`, returning the same `Snapshot`; `n = 0` yields the honest empty store (spec edge case), never an error.
- [ ] **T07** `src/app/state.ts`: capture the `HistoryIndex` boundaries on every `DeltaLog.publish` (wire the index into the store/service write path); expose `reconstructAt`/`HistoryCursor` on `AppState` without disturbing the live-head `snapshot()` path.
- [ ] **T08** `tests/history.test.ts` (NEW) — **byte-equality**: for each heartbeat seq 41–46, assert `reconstructAt(n)` equals a **fresh store fed deltas 1…n** (the fold, not merely the filter) — the reconstruction contract (FR-001/SC-001, G1); `n = 0` is the empty store.

## Phase 3 — US1: Scrub the heartbeat (P1 🎯 exit) — the MVP

**Goal**: an observer drags the cursor across seq 41–46 and every surface shows exactly `state(n)`, refusals and glow included. **Independent test**: reconstruct at each seq, assert byte-equality vs fresh replay, seq-43 renders the contested-compile refusal, seq-45 the new stamp, glow fires only where displayed values move.

- [ ] **T09** [US1] `src/knowledge.ts`: on a refused write (encoding/lint/contested refusal at the "persist nothing" branches), publish a `refused` delta — attempted `op`, its `refs`, refusal reason in the existing `warnings?` slot; no object written (DEC-5 coverage; note §3). The Delta shape is unchanged.
- [ ] **T10** [US1] `src/app/shell.ts`: the history scrubber on the observer tab — a slider `0…N` over the delta seqs, per-position labels reusing the delta-row vocabulary (op + refs); a cursor move re-renders all panels from `reconstructAt(n)`.
- [ ] **T11** [US1] `src/app/shell.ts`: replay-mode chrome — entering replay stamps `mode='replay'`, disables every write affordance, shows the "replaying seq n of N — record, not present" banner; leaving returns to `{ seq: N, mode: 'live' }` (FR-004).
- [ ] **T12** [US1] `src/app/shell.ts`: glow on cursor transitions — diff prior/next reconstructed signature maps with the existing `changedGlowUnits` (DEC-34); a unit glows iff its `data-glow-sig` moved, nothing else (FR-003, G6, no under/over-report).
- [ ] **T13** [US1] `src/app/shell.ts`: "M new" indicator — live deltas arriving during replay bump `N` and surface as a count; the cursor never silently jumps (FR-004).
- [ ] **T14** [US1] `tests/app-replay.test.ts` (NEW): seq-43 reconstruction renders the contested-compile refusal banner and seq-45 the new stamp (US1 AS-1); a cursor move glows exactly the moved-value units and nowhere else (AS-2); replay disables writes (structural — no write path reachable while `mode='replay'`, AS-3); a `refused`-delta seq is a cursor position with `state(n) == state(n-1)` (the refusal-producing-attempt edge case); "M new" bumps without moving the cursor.

**Checkpoint**: US1 is independently demonstrable — the heartbeat replays from the record, no scripted state anywhere (SC-001).

## Phase 4 — US2: Narratives become curated scrub paths (P2)

**Goal**: each Stage-7 narrative is `(seq, tab, note)` waypoints driving the scrubber; the bespoke beat/action mechanism is gone; the SPEC-17 presenter contract is intact. **Depends on** Phase 2 (reconstruction) + a canonical recorded history.

- [ ] **T15** [US2] `src/app/state.ts`: seed the **canonical heartbeat** at bootstrap via the real services — the walkthrough seq run extended to cover every act any narrative references (create fixtures → supersede K5→K9 → contest K12 → resolve → recompile → the edit-k8 supersede); the seed is deterministic (fixed clock, G1/FIND-4).
- [ ] **T16** [US2] `src/narratives.ts`: replace `NarrativeBeat` `{ tab, title, presenterNote, doctrinalQuote?, action? }` with a waypoint shape carrying `seq` (into the canonical history) and drop the `action` field; re-express all five narratives as `ScrubPath`s of waypoints; keep titles, notes, doctrinal quotes, centrepiece markers.
- [ ] **T17** [US2] `src/app/shell.ts`: the narrative runner drives the history cursor (set cursor to `waypoint.seq`, raise `waypoint.tab`) instead of dispatching `applyBeat` actions; delete the `resolve`/`edit-k8` action handlers; preserve nav (prev/next), notes panel, doctrinal quotes, centrepiece marker, wall-projection toggle (SPEC-17 contract, FR-005).
- [ ] **T18** [US2] `tests/narratives.test.ts` (extended): an oracle-style **beat→seq** table pins each waypoint; every beat's rendered state equals `reconstructAt(beat.seq)` (no residual bespoke state, AS-1); the banded-honesty note guard (no midpoint / no verdict-as-score / no weighted-sum, note 09 §3) still passes; the SPEC-17 nav/notes/wall behaviour is unchanged (AS-2); the `action` field is gone (structural).

**Checkpoint**: all five narratives run on scrub paths, SPEC-17 contract intact, bespoke mechanism deleted (SC-002).

## Phase 5 — US3: Recursive trace tooltips (P2) — RESCOPED & BUILT (2026-07-17) — independent of Phases 2–4

**Rescope**: issue #24's full dependency-graph view (DEC-47) shipped ahead of this slice. US3 was specified as its "shallow end," pre-figuring a traversal and a handoff target. It now **integrates** with the shipped surface: reuse its traversal (no parallel walker), open its overlay at the counted remainders. Redundancy dropped — no new walker, no bespoke "trace drawer." A breadth cap was added (verification found a knowledge object's downstream fans into every verdict → a 6000px "tooltip"); it mirrors the DEC-47 view's own per-layer breadth truncation. **Goal**: the one-hop menu expands recursively, progressively, depth-capped at 3 and breadth-capped per hop, each hop labelled from the trace graph, honest counted remainders opening the shipped graph. **Depends only on** `traceView.ts`/`depGraph.ts` — parallelisable with US1/US2.

- [X] **T19** [P] [US3] `src/traceView.ts` — `recursiveNeighbours()`: the depth- and breadth-capped tree, built by recursing the shipped `neighbours()` reading under `EDGE_ORIENTATION` hop by hop (**the same traversal `depGraph.walkDirection` walks — one semantics, no parallel walker**, FR-007), path-based cycle guard (matches `TraceStore.walk`); `RECURSIVE_TRACE_DEPTH_CAP = 3` and `RECURSIVE_TRACE_BREADTH_CAP = 6` (stated constants); dead ends as leaves at every depth (`known:false`, G3); onward-at-the-depth-cap and trimmed-by-the-breadth-cap counts both surfaced (G4).
- [X] **T19b** [P] [US3] `src/components/recursiveTrace.ts` (NEW, pure): renders the labelled tree as collapsed-by-default nested `<details>` (progressive disclosure); each hop shows `edge_type` + a fixed operation gloss ONLY on computation edges (`scored_from` → "interval evaluation over channel reads", `compiled_into` → "band materialisation"), never an invented "why"; symmetric `contests` on both flanks; the depth remainder ("N more — open full trace") and the breadth remainder ("+N more — open full trace") both carry the hop hash for the handoff.
- [X] **T20** [US3] `src/app/state.ts` `recursiveTrace(logicalId, relation)` resolves labels (as `traceMenu` does); `src/app/shell.ts` renders the recursive tree in the SPEC-16 one-hop menu and wires the counted-remainder affordances to `openDepOverlayByHash` — the **shipped DEC-47 overlay focused on the exact stopped-at hop** (integrate, not pre-figure; no parallel walker). Thin shell change; the substance is in `traceView`/`components`.
- [X] **T21** [P] [US3] `tests/recursiveTrace.test.ts` (NEW, 22 tests): depth-1 children equal `neighbours()` exactly (one semantics); a verdict reads down verdict→world→knowledge with the right edges/glosses; depth cap = 3 with a counted onward remainder; breadth cap trims and counts the overflow; dead ends at any depth (G3); symmetric `contests`; cycles never loop; the reachable set is a subset of the shipped `buildDepGraph` set over real fixtures; component render asserts the fixed gloss, the counted handoffs, the dead-end tag, and the empty state.

**Checkpoint**: tooltips reuse the shipped traversal, cap honestly in depth and breadth, hand off to the DEC-47 overlay, render dead ends at depth (SC-003). Verified end-to-end in Chromium (collapsed default → on-demand expansion → "+214 more" → full graph focused on the hop).

## Phase 6 — Polish & cross-cutting

- [~] **T22** [P] `src/components/legends.ts`: the tooltip legend entry (`recursive_trace`) is **landed** with US3 (depth cap 3, breadth cap, computation glosses, counted "open full trace" handoff). The replay-mode entry ("record, not present") remains, to land with US1.
- [ ] **T23** [P] Sweep peers (batch propagation): `CLAUDE.md` current-phase line (SPEC-26 built); `docs/status.yml` updates entry; the issue #24 close-out note "design fed by SPEC-26" (SC-004).
- [ ] **T24** Regenerate committed assets that render the new surfaces: `npm run build:app` (and `npm run gallery` if a replay/tooltip demo moment is added).
- [ ] **T25** Verify: `npm run typecheck` clean, `npm test` green (395+ existing + new suites); no oracle/verdict/coverage-row change; components stay pure (SPEC-14/DEC-33); the heartbeat replays and a narrative runs end-to-end from a cold start (SC-001…004). Run the project `verify` skill on the scrubber + tooltip.

## Dependencies & parallelism

- **Phase 1** done (gate). **Phase 2** (T03–T08) blocks US1 and US2; T03/T04 can start together, T05→T06→T07 chain, T08 after T06.
- **US1** (Phase 3) is the MVP — after Phase 2. T09 is independent (write-path coverage); T10–T13 chain in `shell.ts` (same file — sequential); T14 after T10–T13.
- **US2** (Phase 4) after Phase 2; T15→T16→T17→T18. Independent of US1's UI but shares `shell.ts` (coordinate with T10–T13).
- **US3** (Phase 5) is independent of Phases 2–4 — **built 2026-07-17** on the rescope branch, ahead of US1/US2. Its substance is `traceView.ts` + `components/recursiveTrace.ts` (pure); the `shell.ts` wire is thin and reuses the shipped `openDepOverlay`, so it merges cleanly against US1/US2's heavier `shell.ts` work. The US3 legend entry (`recursive_trace`) is already landed (part of T22).
- **Phase 6** after the stories it documents; T22/T23 [P].

## Implementation strategy

**MVP = Phase 1 + Phase 2 + US1** — the P1 exit: the heartbeat replays byte-equal from the record with correct refusal and glow behaviour. **US3 (tooltip) has shipped as an independent, rescoped increment** (2026-07-17) — it lives in `traceView`/`components`, reuses the shipped DEC-47 traversal, and does not touch the reconstruction path, so US1/US2 proceed unaffected. US2 (narratives) lands last since it depends on both reconstruction and the canonical-history seed. Each story is independently testable at its checkpoint.
