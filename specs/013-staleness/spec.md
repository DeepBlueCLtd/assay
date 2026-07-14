# Feature Specification: Analysis — Staleness

**Feature Branch**: `claude/next-spec-oh2baf`

**Created**: 2026-07-14

**Status**: Draft

**Input**: SPEC-13: Analysis — staleness. Transitive trace walk from superseded/changed knowledge to dependent artefacts. Research note: `docs/research/08-analysis.md` §4.

**Research Note**: `docs/research/08-analysis.md` §4 (DEC-11 gate satisfied)

**Register Decisions Restated**: DEC-5 (writes are stamped deltas), DEC-10 (trace graph first-class), DEC-17 (lifecycle status from edges, never mutated on the object), DEC-21 (supersession as edge)

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Supersede K5 and see exactly the dependent verdicts flagged (Priority: P1)

The J-2 supersedes K5 (old storm forecast) with K9 (updated forecast). The staleness analysis walks forward from K5 through the trace graph and returns exactly the verdicts and scores that were computed from a world that consumed K5 — and nothing else.

**Why this priority**: This is the thesis-F exit — "superseding K9 flags exactly the K5-dependent verdicts and nothing else." Without it, the planner either gets no flags (silently stale) or a blanket invalidation (honest but useless).

**Independent Test**: Supersede K5 with K9 in the Meridian fixtures; run staleness analysis on K5; verify the invalidated set contains exactly the storm-channel-dependent verdicts (P1·C2, P2·C1, P2·C2) and no others.

**Acceptance Scenarios**:

1. **Given** K5 superseded by K9 via a `supersedes` edge, **When** staleness analysis runs with `{changed: K5}`, **Then** the result includes `invalidated.verdicts` containing the K5-dependent verdict refs and `invalidated.worlds` containing the world(s) that consumed K5.
2. **Given** the invalidated set, **Then** verdicts whose metrics do NOT route through the storm channel (e.g. P1·C3 civil harm, P1·C5 causeway) are NOT included — the staleness is targeted.
3. **Given** K9 (the new superseding object), **Then** K9 does NOT appear in the invalidated set — it has no `compiled_into` edges yet (it hasn't been compiled).

---

### User Story 2 — S2 matrix shows flags on stale verdicts (Priority: P2)

The planner's S2 matrix renders staleness flags (e.g. ⚑) on the specific cells that are now stale. The flags say "recompile when ready" — no silent recomputation.

**Why this priority**: The visual flags are the user-observable output of staleness analysis. Lower priority than the walk itself because the walk is the computation; the flags are presentation.

**Independent Test**: Render the S2 matrix after K5 supersession; verify that exactly the K5-dependent verdict cells show flags and others do not.

**Acceptance Scenarios**:

1. **Given** the staleness result, **When** rendered on S2, **Then** the P1·C2, P2·C1, P2·C2 cells show staleness flags.
2. **Given** the flagged cells, **When** the planner clicks a flag, **Then** the trace drawer opens showing the chain: verdict → world → K5 → superseded by K9 (G3).
3. **Given** the matrix after recompile (new world consuming K9), **When** verdicts are re-scored against the new world, **Then** the staleness flags are cleared (the verdicts now derive from current knowledge).

---

### User Story 3 — Trace chains provide G3 completeness (Priority: P2)

Every staleness flag opens a trace drawer showing the full walk from the stale artefact back to the superseded knowledge, through the world that consumed it. Dead ends are surfaced as `complete: false` (G3).

**Why this priority**: G3 (backward trace to named knowledge) is a standing invariant. The staleness walk must honour it.

**Independent Test**: Verify every chain in the staleness result terminates at a known stored object or explicitly reports `complete: false`.

**Acceptance Scenarios**:

1. **Given** a staleness chain from a verdict to K5, **Then** every node in the chain resolves to a known stored object and `complete: true`.
2. **Given** a chain that encounters a hash not in the store (a dead end), **Then** the chain reports `complete: false` and the dead-end hash is surfaced (never hidden).

---

### Edge Cases

- What happens when the changed K was never compiled into any world? The walk returns an empty invalidated set — no artefacts depend on it. This is correct for open questions or retired K10.
- What happens when multiple worlds consumed K5? The walk follows all `compiled_into` edges from K5, reaching all dependent worlds and their downstream verdicts/scores. The invalidated set covers all of them.
- What happens when a world consumed K5 but was never scored? The world appears in `invalidated.worlds` but `invalidated.verdicts` and `invalidated.scores` are empty for that world. The world is still stale — it should be recompiled — even if no plans were scored against it.
- What happens when a cyclic edge exists in the trace graph? `TraceStore.walk` already includes a cycle guard (visited set). Cycles are broken without error.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST perform a transitive forward trace walk from the changed/superseded knowledge object's hash, following the `traceView.ts` EDGE_ORIENTATION map to traverse downstream coherently across mixed-orientation edges.
- **FR-002**: The system MUST partition the reached terminal nodes by type: `verdicts` (CommitmentVerdict refs), `scores` (PlanScore refs), `worlds` (CompiledWorld refs).
- **FR-003**: The system MUST return the full `TraceChain[]` from the walk so the trace drawer can render the complete dependency path (G3).
- **FR-004**: The system MUST NOT recompute any stale artefact. The result is diagnostic (flags); recompilation is the planner's decision (constitution: writes are events, not side-effects).
- **FR-005**: The system MUST NOT include the superseding object (K9) in the invalidated set — it has no downstream artefacts yet.
- **FR-006**: The system MUST NOT include artefacts whose metrics do not route through the changed K's channel path. The staleness is targeted: only verdicts/scores whose computation consumed the changed K are invalidated.
- **FR-007**: Dead ends in the walk (hashes not in the store) MUST be surfaced as `complete: false` on the chain (G3).
- **FR-008**: The system MUST produce a deterministic stamp over its inputs (changed ref, engine version).
- **FR-009**: The system MUST reproduce the thesis-F exit on the Meridian fixtures: superseding K5 flags exactly P1·C2, P2·C1, P2·C2 (the storm-channel-dependent verdicts) and nothing else.

### Key Entities

- **StalenessRequest**: `{ changed: Ref, engine_version: string }` — movement type in `seam.ts`. `changed` is the superseded or modified knowledge object.
- **StalenessResult**: `{ invalidated: { verdicts: Ref[], scores: Ref[], worlds: Ref[] }, chains: TraceChain[], stamp: string }` — follows the seam contract §8 shape.
- Reuses: `TraceChain` from `src/trace.ts`, `TraceStore.walk`, `EDGE_ORIENTATION` from `src/traceView.ts`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Superseding K5 in the Meridian fixtures produces an invalidated set containing exactly the storm-channel-dependent verdicts (at minimum P1·C2, P2·C1, P2·C2) and no non-storm-dependent verdicts.
- **SC-002**: K9 does not appear in the invalidated set.
- **SC-003**: Every chain in the result has `complete: true` for known stored objects and `complete: false` for dead ends (G3).
- **SC-004**: No artefact is recomputed — the result is purely diagnostic.
- **SC-005**: The walk is deterministic: same input produces the same invalidated set and stamp (G1).
- **SC-006**: All existing tests pass; typecheck clean; no regression.

## Assumptions

- The trace graph is populated by prior SPEC-02/05/06/07 operations (compile and score write their trace edges at compute time). The staleness walk does not create edges.
- The `changed` ref is the superseded object (K5), not the superseding object (K9). The caller determines which K was superseded (the knowledge service's `supersede()` returns `stale: [K5]`).
- `TraceStore.walk` with `'forward'` direction, filtered through the orientation map, is sufficient for the staleness walk. No new walk algorithm is needed.
- The walk follows ALL edge types downstream (not just `compiled_into` and `scored_from`) — `cited_in`, `sacrificed_in`, and `waives` edges also carry downstream dependencies.
- No schema changes needed — `TraceChain` already exists; the movement types are seam types in `seam.ts`.
