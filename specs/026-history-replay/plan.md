# Implementation Plan: History, replay & trace depth (SPEC-26)

**Spec**: `specs/026-history-replay/spec.md` · **Research note**: `docs/research/15-replay.md` (**DEC-11 gate — authored first**; decides the state-at-seq reconstruction rule as the event-sourcing fold `state(n) = fold(deltas[1..n])` implemented as a filter over the immutable store, replayed refusals re-deriving from `state(n)`, the narrative-runner unification onto `(seq, tab, note)` scrub-path waypoints, and the recursive-trace tooltip depth cap fixed at 3) · **Register**: **ratified** — ASSAY-DEC-37 (the replay surface), DEC-38 (the recursive-trace tooltip), DEC-39 (narratives-as-scrub-paths), register batch 7. Binds DEC-5, DEC-21, DEC-17/FIND-4, DEC-34, DEC-23, DEC-32/36, G1/G3/G4/G6.

## Shape — the record already exists; this slice reads it

```
Phase A  note 15 + DEC-37/38/39 (ratified)                    ── fold rule, refusal replay, waypoints, tooltip cap 3
   ▼
Phase B  reconstruction (src/app/history.ts)                  ── HistoryIndex + storeViewAt(n)/traceViewAt(n) + reconstructAt(n)
   ▼                                                              (a filter over the append-only store; byte-equal to a fresh fold, G1)
Phase C  refused-attempt coverage (knowledge.ts + deltas)     ── a refused write publishes a `refused` delta (DEC-5 coverage; no seam shape change)
   ▼
Phase D  scrubber surface (src/app/{state,shell}.ts)          ── HistoryCursor {seq, mode}; slider; replay banner; write-disable; "M new"; glow on transitions (DEC-34)
   ▼
Phase E  narrative unification (src/narratives.ts + shell)    ── canonical heartbeat; beats → (seq, tab, note) waypoints; runner drives the cursor; bespoke beat/action mechanism deleted
   ▼
Phase F  recursive tooltip (components/recursiveTrace.ts)     ── depGraph traversal depth-capped at 3; agrees with TraceStore.walk; counted remainder → trace drawer / #24
   ▼
Phase G  tests + legends + batch propagation + verify
```

Every phase is a projection over machinery that already crosses the seam (SPEC-05 delta log, SPEC-16 glow + one-hop trace menu, DEC-21 store, note-13 `depGraph.ts` traversal). No new engine (DEC-10), no schema change, no seam-contract shape change.

## Constitution Check *(Principles I–VI, invariants G1–G6)*

- **I — Seam contract is the invariant**: no new backend semantics. Reconstruction re-drives the *existing* `snapshot()` pipeline over a filtered read-view of the store; the scrubber and tooltip are surfaces that *arrange* existing projections (the delta log, the trace graph). PASS.
- **II — Banded honesty**: the slice renders no new assessed scalar; replayed surfaces render exactly what the live surfaces render (band pills, provenance chips, verdicts) because they *are* the same pure components fed the reconstructed state. PASS.
- **III — Traceability terminates in named knowledge**: the recursive tooltip *is* a trace reading; it agrees byte-for-byte with `TraceStore.walk` and renders dead ends as dead ends at every depth (G3). No reconstructed edge; the walk reads the edges written at compute time. PASS.
- **IV — Determinism & content addressing**: state-at-seq is a filter over the immutable content-addressed store (DEC-21); reconstruction at `n` is byte-equal to a fresh replay of deltas 1…n (G1), tested per heartbeat seq; no wall clock enters ordering (DEC-17/FIND-4). PASS.
- **V — Research before implementation**: `docs/research/15-replay.md` landed first (DEC-11). PASS.
- **VI — Register supremacy**: DEC-37/38/39 ratified before this plan relies on them; the plan asserts no new decision. PASS.
- **G1** reconstruction determinism (the P1 exit); **G3** tooltip dead ends + trace agreement (US3); **G4** the tooltip's counted remainder is no-silent-drop lifted to a view; **G6** cursor transitions re-fire the value-keyed glow, no under/over-report (US1 AS-2). **G2/G5** inherited unchanged (a replayed refusal *is* G5 re-rendered).

No violations; Complexity Tracking empty.

## Project structure

Design artefacts: `plan.md` (this file), `tasks.md` (`/speckit.tasks`). Phase-0 research is `docs/research/15-replay.md` (repo convention — research lives under `docs/research/`, not a spec-local `research.md`). **No `data-model.md`**: no schema change (movement types only, listed below).

Source (all app-layer + one pure component + one write-path coverage fix; the eight `src/components/*` stay pure, DEC-33/SPEC-14):

```text
src/app/history.ts        # NEW — HistoryIndex (created-seq boundaries), storeViewAt/traceViewAt, reconstructAt(n)
src/app/state.ts          # HistoryCursor {seq, mode}; wire reconstructAt into the snapshot path; canonical-heartbeat seeding
src/app/shell.ts          # scrubber control; replay banner + write-disable; "M new"; glow on cursor move; runner drives the cursor
src/narratives.ts         # beats → (seq, tab, note) waypoints; NarrativeBeat.action removed
src/knowledge.ts          # publish a `refused` delta on refused writes (DEC-5 coverage)
src/deltas.ts             # (if needed) accept the refused op; Delta shape unchanged
src/components/recursiveTrace.ts  # NEW — pure: depth-capped recursive hop list, honest remainder
src/components/legends.ts # legend entries: replay-mode, tooltip depth/remainder
tests/{history,app-replay,narratives,recursiveTrace}.test.ts  # NEW/extended
```

## The load-bearing facts

- **The store never forgets** (DEC-21): `ObjectStore` and `TraceStore` are append-only — no delete, no mutation — so at the live head they hold *every* object and edge ever created. Reconstruction-at-`n` is therefore a **filter** ("which subset was present after delta `n`"), never a rollback. This is the single fact the whole slice rests on.
- **Deltas are the seq spine** (DEC-5): `DeltaLog` is monotonic `seq`, `.all` in order, `.since(seq)`. Object creation is derivable from delta `refs` (a hash's created-seq = the first delta whose refs name it). Trace edges are *not* in delta refs, so their created-seq is captured at write time as an append boundary (below) — derived, non-authoritative.
- **`snapshot()` is pure over the store** (`state.ts`): it re-drives compile → score → handful → relax → robustness and returns per-panel view models with `data-glow-id`/`data-glow-sig`. Reconstruction reuses it unchanged, handed a **read-view** of the store filtered by created-seq — same objects in, same bytes out (G1).
- **Refusals are a function of state, not stored events**: the seq-43 contest is a recorded delta; the compile *refusal banner* at seq 43 falls out of re-driving `snapshot()` over `state(43)` (contested ⇒ compile refuses, G5). No refusal is stored or replayed — it re-derives. This is why the P1 heartbeat exit needs **no** special refusal machinery.
- **A refused *write attempt* is the one gap** (`knowledge.ts:79` — "persist nothing"): a refused create/supersede currently publishes no delta, so it is not a scrubbable position. Note 15 §3 authorises closing this as **DEC-5 coverage** (Phase C) — a `refused` delta with the attempted op + refs + the refusal reason in `warnings`, no object written; the Delta *shape* is unchanged, only its coverage. This satisfies FR-002 and the spec's "refusal-producing attempt" edge case.
- **`depGraph.ts` already walks transitively** (note 13, DEC-47): `buildDepGraph` applies the `EDGE_ORIENTATION` reading depth-by-depth, cycle-guarded, `known:false` dead ends, symmetric `contests`. The tooltip is this walk **depth-capped at 3** — reuse, not a new walker (FR-007) — and it agrees with `TraceStore.walk` by construction because both read the same edges.
- **The glow is reused verbatim** (DEC-34): a cursor move `n→m` diffs the reconstructed signature maps with the existing `changedGlowUnits(prev, next)`; a unit glows iff its displayed value moved — the live rule, replayed (US1 AS-2). No new glow logic.

## Reconstruction — the contract (note §2, FR-001)

**Definition** (honest, the fold): `state(n)` = the state a fresh `ObjectStore`+`TraceStore` reaches by applying deltas `1…n`.

**Implementation** (the filter, byte-equal by G1): `src/app/history.ts` holds a `HistoryIndex` populated *at publish time* (derived, never authoritative over the log):

- `objectSeq: Map<contentHash, seq>` — set when a delta first names a hash in its refs.
- `edgeBoundary: number[]` — `edgeBoundary[seq] = traceStore.edges.length` immediately after the op that published delta `seq` (edges are append-only, so a length is a sufficient boundary).

Then:

- `storeViewAt(n)` — a read-only wrapper over the live store whose `exists/get/versions` return only hashes with `objectSeq(hash) ≤ n` (so `versions(logicalId)` reports the correct head-at-`n`). No copy; a predicate over the shared immutable store.
- `traceViewAt(n)` — the live `traceStore.edges.slice(0, edgeBoundary[n])` exposed through the same `TraceStore` read surface (walk/neighbours).
- `reconstructAt(n)` — runs the *existing* `snapshot()` over `storeViewAt(n)`/`traceViewAt(n)` and returns the same `Snapshot`. At `n = 0` this is the honest empty store (spec edge case), not an error.

**The equivalence claim** (tested): because both stores are append-only in seq order (DEC-21 + DEC-5), filtering the live store to `created_seq ≤ n` yields exactly the object/edge set a fresh fold of deltas `1…n` produces; feeding it to the same pure `snapshot()` gives byte-identical view models (G1). `tests/history.test.ts` asserts this against an **actual fresh replay** for each heartbeat seq 41–46 (US1 independent test), not just against the filter.

**Checkpointing**: none in v1 (Meridian scale — a few dozen deltas, `snapshot()` in ms). The rule, if ever needed (note §2): cache `snapshot()` at compile boundaries, fully re-derivable and discardable, the log the sole authority — out of scope here, stated.

## Movement types (app-layer; no stored LinkML, no seam shape change)

- `HistoryCursor { seq: number, mode: 'live' | 'replay' }` — app state; not stored (the record is the existing deltas).
- `ScrubPath { waypoints: { seq: number, tab: TabId, note: string, doctrinalQuote?: string, centrepiece?: boolean }[] }` — the narrative re-expression (DEC-39). Not stored.
- `RecursiveTraceNode { hash, edge_type?, relation: 'informs' | 'influences', operationGloss?: string, known: boolean, depth: number, children: RecursiveTraceNode[] | { remainder: number } }` — the pure tooltip's view model, produced from the `depGraph` walk capped at depth 3; `remainder` carries the honest counted overflow at the cap.
- `Delta` gains no field; a refused write publishes a `Delta` with the attempted `op`, its `refs`, and the refusal reason in the existing `warnings?` slot (Phase C). If a distinct `op` value is needed, it is added to the existing `Delta['op']` union (a value, not a shape change).

## Surfaces

- **Scrubber** (`shell.ts`, observer tab — DEC-37; Observer is the stated home, the shared-surface pattern of DEC-36 not a new role): a slider `0…N` over the delta seqs with per-position labels (op + refs, the existing delta-row vocabulary); entering replay stamps `mode='replay'`, disables every write affordance, and shows an unmistakable banner ("replaying seq n of N — record, not present"); leaving returns to `seq=N, mode='live'`. New live deltas during replay bump `N` and surface as an "M new" chip, never a silent cursor jump (FR-004). A cursor move re-renders all panels from `reconstructAt(n)` and applies the glow via `changedGlowUnits` over the prior/next signature maps (FR-003).
- **Recursive tooltip** (`components/recursiveTrace.ts`, pure): the SPEC-16 one-hop menu entry expands in place; each hop renders `edge_type` + a **fixed** operation gloss for computation edges (`scored_from` → "interval evaluation over channel reads"; `compiled_into` → "band materialisation") drawn from a small constant map, never an invented "why"; dead ends render as dead ends at every depth (G3); at depth 3 an honest "**N more — open full trace**" routes to the existing trace drawer and (when #24 lands) the DEC-47 graph view. The component is a projection of the `depGraph` walk — one traversal semantics (FR-006/FR-007).
- **Narrative runner** (`shell.ts`): unchanged *to the presenter* (SPEC-17 contract — beat nav, notes panel, doctrinal quotes, centrepiece marker, wall-projection, the banded-honesty note guard) but now each beat sets the history cursor to its waypoint `seq` and raises its `tab`; the bespoke `applyBeat` action dispatch (`resolve`/`edit-k8`) is deleted.

## The canonical heartbeat (DEC-39, US2)

One recorded history seeds the store at bootstrap (`state.ts`) via the real services — the walkthrough seq run **extended to cover every act any narrative references** (create fixtures → supersede K5→K9 → contest K12 → resolve → recompile → the edit-k8 supersede the bridge/REMIT narratives use). Its seq positions are **pinned by an oracle-style beat→seq table** (`tests/narratives.test.ts`); each of the five narratives becomes a `ScrubPath` of waypoints into this one log. A state a narrative names that the record lacks is a coverage gap to add to the canonical seed — never a bespoke live action smuggled back (the retired mechanism). `tests/narratives.test.ts` asserts every beat's rendered state equals `reconstructAt(beat.seq)` and that the SPEC-17 note guard still passes.

## Testable seams (Node, vitest)

- `tests/history.test.ts` — **the P1 exit** (SC-001): for each heartbeat seq 41–46, `reconstructAt(n)` is **byte-equal to a fresh store fed deltas 1…n** (the fold, not just the filter); seq-43 renders the contested-compile refusal, seq-45 the new stamp; `n=0` is the honest empty store; a cursor move `n→m` glows exactly the units whose `data-glow-sig` moved and nothing else (G6/DEC-34); replay disables writes (structural: no write path reachable while `mode='replay'`).
- `tests/app-replay.test.ts` — "M new" bumps on a live delta during replay without moving the cursor; leaving replay returns to the head; a refused write during the canonical seed publishes a `refused` delta that is a cursor position with `state(n) == state(n-1)` (the refused-attempt edge case).
- `tests/narratives.test.ts` (extended) — every beat pinned to its seq; each beat's state = `reconstructAt(seq)`; the banded-honesty note guard (no midpoint / no verdict-as-score / no weighted-sum) still passes; the bespoke `action` field is gone (structural).
- `tests/recursiveTrace.test.ts` — expansion from a P2·C2 verdict; each hop's label matches the trace graph's actual edge/operation (no paraphrase layer); the chain matches `TraceStore.walk` for the same origin (SC-003); the depth-3 cap renders the counted remainder, never silent; dead ends render as dead ends at any depth (G3); a contested pair renders `contests` symmetrically at every depth; cycles never loop.

## Out of scope / deferred (tracked, stated — never silently dropped)

- **Checkpointing** — decided as a rule (note §2), unused in v1; revisit only if reconstruction cost grows.
- **A 2-D scrub** (decision-time × world-time in one control) — the two axes stay two separate controls in v1 (note §1); SPEC-19's scenario-clock scrub composes but does not merge.
- **The full-screen dependency-graph view** (#24 / DEC-47) — already built; the tooltip's "open full trace" routes to it. This slice grows no graph layout engine (spec Assumption).
- **A fourth AAR "recommendations" column** — the "what next" answer is the *existing* sensitivity/discrimination surfaces reached from the record, not a new panel (note §6).

## Done when

FR-001…008 met on Meridian; the heartbeat replays byte-equal with correct refusal/glow (SC-001); all five narratives run on scrub paths with the SPEC-17 contract intact and the bespoke beat mechanism deleted (SC-002); recursive tooltips match `TraceStore.walk`, cap honestly, and render dead ends at depth (SC-003); typecheck/tests clean, components pure, no schema/seam-shape change; issue #24 gains a "design fed by SPEC-26" note at close-out (SC-004).
