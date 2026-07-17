# Research note 13 — The focused transitive dependency-graph view

Horizon depth slice · per ASSAY-DEC-11 · 2026-07-16 · gates **issue #24** (focused upstream/downstream dependency view), the review's **C4** and the full-screen big brother of **S-G**'s recursive trace tooltips (`specs/026-history-replay/`, addendum §10)

**Provenance of this note (stated, not hidden).** The build ran ahead of the note: a prior session on this branch prototyped the view mock-first (`docs/assets/dep-graph-mocks/index.html`), then implemented it (`src/depGraph.ts`, `src/components/{depGraphRiver,depGraphSidebar}.ts`, wired into the shell overlay, `tests/depGraph.test.ts`). That inverts DEC-11's research-first order. This note closes the gate it should have opened — it decides the genuinely-open design questions on their merits and then **audits the built artefact against those decisions** (§7), correcting the one place the build fell short of the honesty rule it implies (§5). The inversion is a process finding, recorded in the ledger, not a licence to skip the reasoning.

---

## 1. Most of this view needs no research — the trace graph is already the answer

The dependency view renders nothing new. It is a *reading* of the trace-edge set that the computing services already write at compute time (DEC-5, constitution III: edges are written by the service performing the computation, never reconstructed), traversed by machinery that already exists (`TraceStore.walk`, and the per-`edge_type` orientation map `EDGE_ORIENTATION` from `src/traceView.ts`, research note 05 §4). Research note 07 §3 already settled the frame this view inherits: **ASSAY's trace graph *is* a PROV provenance graph** (W3C PROV-DM) — entities (stored objects), activities (compile/score/relax), agents (named owners) — and the "why?" chain is a standard backward `wasDerivedFrom` closure terminating in a `wasAttributedTo` (a named owner, G3). Note 07 also settled the rendering idiom question at the whole-flow scale: **node-link is right at Meridian scale** (a bounded tableau — one heartbeat), with aggregation/matrix forms reserved for dense graphs.

So the flow-view research (note 07) already did most of this note's work. The one-hop trace menu SPEC-16 shipped is the shallow end of exactly this view. What issue #24 asks for beyond it — the **entire** upstream and downstream chains of *one chosen item*, at once — opens only four genuinely-new questions, and this note spends its length only on those:

1. **Transitive traversal under the orientation map** — neither existing primitive does it (§2).
2. **What a symmetric (`contests`) edge does at transitive depth** — the one place the walk could misbehave (§3).
3. **The truncation-honesty rule** — the issue's own load-bearing caveat: "depth limits with an honest 'N more' affordance rather than silent truncation" (§5).
4. **Where it lives** — fifth surface, overlay, or sub-mode (§6).

Everything else is a projection of settled machinery.

## 2. The traversal is a composition of two existing pieces, not a new engine

The focused view needs a **transitive walk under the orientation map, in both directions from the focus**. Neither shipped primitive is that walk, and the gap is precise:

- **`TraceStore.walk(start, direction)`** (`src/trace.ts`) is transitive and cycle-guarded, but it follows *raw hash direction* (`from→to` or `to→from`). It does **not** know the orientation map, so a naïve forward walk from a K reaches the compiled world and stops — the edges are written in mixed orientations (`compiled_into` points K→World, i.e. upstream→downstream, while `scored_from`/`cited_in`/`sacrificed_in` point Verdict→World, i.e. downstream→upstream; note 05 §4). Raw direction is not "upstream vs downstream".
- **`traceView.neighbours(store, hash, relation)`** (`src/traceView.ts`) resolves `EDGE_ORIENTATION` correctly into an "informs (upstream) / influences (downstream)" reading — but only **one hop**. It is the SPIT-16 menu's engine.

The focused view is the missing middle: *the orientation-resolution of `neighbours` applied transitively, depth by depth*. The decision is to **compose the two, not build a third graph engine** (DEC-10's no-new-engine discipline applied to a view): a breadth-first walk from the focus that, at every hop, resolves each candidate edge's `EDGE_ORIENTATION` for the direction being walked (mirroring `forward↔backward` for the upstream reading exactly as `neighbours` does), guarded by a shared `visited` set so no node is expanded twice, and marking any hash the store does not know as a dead end (`known: false`, G3). BFS is chosen over `walk`'s DFS-of-simple-paths because the view's organising axis is **depth from the focus** (the river's columns), not enumerated root-to-leaf paths — BFS yields the depth layering for free and assigns each reachable node to exactly one layer (its shortest hop-distance from the focus).

This is what the built `depGraph.walkDirection` does, and it is the honest shape: the view reads the same edges the services wrote, orientation-resolved the same way the one-hop menu resolves them, and never reconstructs an edge (constitution III). No schema change; no new stored object; the graph is derived on demand and never itself stamped or persisted.

## 3. A symmetric `contests` edge renders on both flanks — once each, never looped

`EDGE_ORIENTATION` classes `contests` as `'either'` — a peer relation with no direction (K12a ↔ K12b). At **one hop** this is trivially fine (`neighbours` lists the contested peer on both the informs and influences side). At **transitive depth** it is the one place the walk could go wrong in two opposite ways, and both must be ruled out by decision:

- **It must not be dropped.** A contested peer is genuinely both upstream and downstream of its rival; silently omitting it from a directional walk would hide a real dependency (a G3 violation in spirit).
- **It must not explode.** A symmetric edge followed in both directions is a two-cycle; without a guard it re-expands forever.

The decision: **`either` edges are followed in both directions, and the shared per-flank `visited` set bounds them** — the contested peer appears once on the upstream flank and once on the downstream flank of the focus, and is never re-expanded through the two-cycle. Rendering the same peer on both flanks is not double-counting; it is the honest rendering of a relation that *has* no direction — the viewer sees "K12a contests K12b" from whichever flank they read. (The `visited` set is per-direction-walk, seeded with the focus, so a node reachable only as a contested peer can legitimately appear on both flanks of the focus; within a single flank it appears exactly once. This is deliberate and correct — a symmetric relation is symmetric.) The cycle guard is the same one `TraceStore.walk` already uses; the view inherits its correctness rather than re-deriving it.

## 4. Layout — a depth-layered node-link "river" plus details-on-demand sidebar

The rendering is the standard **overview → details-on-demand** progression (Shneiderman's Visual Information-Seeking Mantra; Munzner's overview+detail with *reachable, not permanent* detail — both already load-bearing in note 07 §2). Concretely, the **composite A+C** layout the mock arrived at:

- **A — the river (overview).** Upstream layers (reversed, deepest on the far left) → focus node (centre) → downstream layers (deepest on the far right), each layer a BFS-depth column, edges as arrows between columns. This is a **degenerate Sugiyama layered DAG layout** (Sugiyama, Tagawa & Toda 1981 — the settled idiom for directed acyclic graphs): the BFS already assigns each node a layer (its hop-distance), which is exactly the layer-assignment step of the Sugiyama pipeline; a rooted two-directional DAG needs no crossing-minimisation heuristic at Meridian scale because the columns are small. Node-link is justified here *a fortiori* over note 07's argument: a single-item focused view is strictly smaller than the whole-flow view note 07 already found small enough for node-link. Nodes are typed and colour-keyed (knowledge/world/verdict/plan/report/unknown); dead ends render dimmed with "(dead end — G3)".
- **C — the sidebar (details-on-demand).** Clicking any river node opens a detail panel — the node's metadata (its band rendered as `lo–hi unit`, never a bare scalar; its status, stamp, `single_source` flag) and its immediate upstream/downstream neighbours grouped by depth and edge type. The sidebar is the bridge from "see the shape" to "read the detail"; clicking a node in it (or the river) **re-focuses** the whole view on that node — the walk-further affordance the one-hop menu could only gesture at.

The river never becomes a fourth always-on panel (Munzner's warning): it is reached on demand and dismissed, and its detail is drill-in, not permanent.

## 5. Truncation honesty — the G4 analogue for a view (the one correction)

The issue names its own hardest constraint: *"transitive fan-out can be large; consider depth limits with an honest 'N more' affordance rather than silent truncation."* This is **G4 (no silent drop) lifted from the relaxation frontier to a presentation surface**: a view that bounds what it shows must *say so*, exactly as the scorer may never silently drop a consequence. The view has two bounds, and they are not equally honest by default:

- **Breadth cap (per layer).** A layer wider than the visible cap renders its first *N* nodes plus an explicit **"+ K more"** marker and a type summary of the whole layer. This is honest as built — the drop is stated, never silent.
- **Depth cap (transitive distance).** The BFS stops at `maxDepth`. **As built this is silent** — when the frontier is still non-empty at the cap, the walk simply returns and nothing tells the viewer that chains continue beyond the last column. That is precisely the "silent truncation" the issue forbids, and the breadth cap already shows the right pattern.

**Decision.** The depth cap must be rendered as honestly as the breadth cap: when a directional walk reaches `maxDepth` with frontier remaining, the view states it — a terminal **"⋯ deeper chains continue beyond depth N"** marker on that flank, so the viewer knows the view is bounded, not that the graph ends. (On the frozen Meridian tableau the reachable chains are short — K→world→verdict→report is ~3 downstream hops, world→K is 1 upstream — so at the default `maxDepth = 4` the marker rarely fires; that it *rarely fires* is not a reason to let it fire *silently*. The rule is correctness insurance for any denser graph and, more importantly, the honest default the project's own G4 demands.) This note's slice adds the marker; §7 records it as the one build correction.

The two caps together are the disciplined answer to the scale caveat: bounded by depth and breadth, **never silently** — the same "declare what you did not span" posture the horizon forward-derivation note (§2.5, the candidate "no silent COA-family drop" invariant) reaches for one level up.

## 6. Placement — a full-screen overlay off the trace menu, not a sixth tab

Issue #24 poses three options: a fifth surface, an overlay on the Observer/bridge tab, or a full-screen mode reachable from the trace menu. The decision is the **full-screen overlay reachable from the one-hop trace menu** ("View full graph →"), for reasons that track the register cleanly:

- **It is the deep end of an existing gesture.** SPEC-16's one-hop menu is the zoom step; the full transitive graph is the details-on-demand step of the *same* Shneiderman progression. Making it the menu's "expand" link is the natural disclosure path, not a new entry point.
- **It adds zero permanent chrome.** DEC-32 froze **four literal *role* tabs**; DEC-36 added exactly **one shared *surface* tab** (Spatial · COA) — and only after the SME checkpoint DEC-27 requires endorsed it (ASSAY-FIND-7). A second surface tab is a register act of the same weight, and an on-demand deep-dive that nobody keeps open does not earn it. The DSM slice (SPEC-24, concept §6.28) reached the same conclusion for the same reason — a derived surface became a panel, "not a sixth tab (DEC-32's four role tabs stand unextended)."
- **The overlay gets the whole viewport**, which a transitive graph needs, without costing the four role surfaces any space.

**Fallback (stated).** If the modal overlay proves awkward in an SME session, an **Observer sub-mode** is a clean alternative that could be added later without conflict (the Observer/bridge tab is already the cross-cutting provenance surface). The overlay is preferred now; the sub-mode is the recorded escape hatch.

## 7. Honesty invariants — audited against the build

The view must preserve the invariants every ASSAY surface owes. Audited against the shipped code:

| Invariant | Holds? | Evidence |
|---|---|---|
| **G3 — trace to a named owner; dead ends surfaced** | ✅ | a hash the store does not know renders `known: false`, dimmed, labelled "(dead end — G3)"; never hidden, never fabricated (`depGraph.labelObject`/`nodeChip`) |
| **Frozen identifiers only** (vignette §8/§9) | ✅ | nodes render stored `logical_id`/`name` or a truncated hash; `classifyObject`/`labelObject` sniff *stored* shape and never invent an identifier |
| **G2/G6 — no bare scalar; values are bands** | ✅ | the sidebar renders a value only as `band: lo–hi unit`; the view shows labels and structure, not loose numbers |
| **No new engine; edges read, never reconstructed** (DEC-5, constitution III, DEC-10) | ✅ | reuses `TraceStore` + `EDGE_ORIENTATION`; derives on demand, stamps nothing, persists nothing |
| **No schema change** | ✅ | every shape (`TraceEdge`, stored objects) already exists; `npm run gen` not run |
| **Read-only projection — moves no thesis** | ✅ | the view computes and mutates nothing; like note 07's home-page-currency assessment, it makes existing provenance legible and moves no thesis from *planned* to *demonstrated* — `status.yml` thesis states are unchanged |
| **Truncation stated, never silent** (G4 analogue, §5) | ⚠️→✅ | breadth cap honest as built ("+ K more"); **depth cap was silent** — corrected in this slice (the "deeper chains continue beyond depth N" marker) |

The single gap the audit found is the silent depth truncation of §5; the slice closes it. Nothing else in the build contradicts a decision above — the mock-first prototype landed on the right shape, and this note ratifies that shape by argument rather than by fiat.

## What we will do differently

1. **Traverse by composition, not a new engine** (§2): BFS from the focus, orientation-resolved per hop the way `neighbours` resolves one hop, shared `visited` guard, dead ends as `known: false` (G3). No schema change, no stamped object.
2. **Render symmetric `contests` edges on both flanks, once each, cycle-guarded** (§3) — the honest rendering of a directionless relation, never dropped and never looped.
3. **Lay it out as a depth-layered node-link river + details-on-demand sidebar** (§4, the composite A+C) — a degenerate Sugiyama layered DAG at bounded Meridian scale, detail drill-in not permanent (Shneiderman/Munzner, inherited from note 07).
4. **State every bound** (§5): breadth cap "+ K more" (as built) **and** a depth-cap "deeper chains continue beyond depth N" marker (the one correction) — the G4 no-silent-drop rule lifted to a view.
5. **Live as a full-screen overlay off the trace menu** (§6), not a sixth tab (DEC-32/DEC-36 hold); Observer sub-mode is the stated fallback.

## Register posture

This note **asserts no register decision.** It grounds a **register candidate — the focused dependency-graph surface + its transitive-traversal reading of the trace graph** — flagged for the next batch per DEC-2 (recorded at `assay-concept.md` §6.29), never asserted here and never citable as authority. The candidate is DEC-24/DEC-28-class contract growth: a **derived on-demand surface** (a projection, DEC-5 — no new engine, DEC-10), reached from the SPEC-16 trace menu, with the truncation-honesty rule (§5) as its one genuinely-new invariant obligation (the G4 analogue for a view). No schema change; no oracle, verdict, or coverage-row change; thesis states unchanged. Any latitude the build spent ahead of ratification is bounded by that candidate and by the honesty audit in §7 — if a decision here cannot be preserved, the mechanism is out, the same test SPEC-09 applied to weighted CSP.

## Sources

K. Sugiyama, S. Tagawa & M. Toda, "Methods for Visual Understanding of Hierarchical System Structures," *IEEE Trans. Systems, Man, and Cybernetics* 11(2), 1981, pp. 109–125 — layered DAG layout (the river's layer-assignment idiom). B. Shneiderman, "The Eyes Have It: A Task by Data Type Taxonomy for Information Visualizations," *Proc. IEEE Symp. Visual Languages* 1996 — the visual information-seeking mantra (overview → details-on-demand), inherited from note 07. T. Munzner, *Visualization Analysis and Design* (CRC Press, 2014) — overview+detail, detail *reachable not permanent*. L. Moreau & P. Missier (eds.), *PROV-DM: The PROV Data Model*, W3C Recommendation, 2013 — the provenance-graph frame the trace graph instantiates (`wasDerivedFrom`/`wasGeneratedBy`/`wasAttributedTo`), inherited from note 07 §3. ASSAY register DEC-2 (register-first), DEC-5 (trace graph first-class, edges written by the computing service), DEC-10 (no new engine where a projection suffices), DEC-11 (research-first), DEC-32 (four role tabs), DEC-36 (the fifth shared-surface tab and its checkpoint gate); seam contract §G (G2 no bare scalars, G3 complete trace chains terminating in an owner, G4 no silent drop, G6 propagation honesty); constitution I (pure components) / III (edges never reconstructed). ASSAY docs: `assay-concept.md` §1 (thesis catalogue), §6.28 (the DSM placement precedent); research notes `05-surfaces.md` §4 (the orientation map), `07-flow-view.md` §2–§3 (Shneiderman/Munzner/PROV, node-link at bounded scale), `horizon-forward-derivation.md` §2.5 (the "no silent drop" posture one level up). ASSAY code (the artefact this note gates and audits): `src/traceView.ts` (`EDGE_ORIENTATION`, `neighbours`), `src/trace.ts` (`TraceStore.walk`), `src/depGraph.ts`, `src/components/{depGraphRiver,depGraphSidebar}.ts`, `tests/depGraph.test.ts`; the design mock `docs/assets/dep-graph-mocks/index.html`; issue #24; review `docs/reviews/2026-07-14-jipoe-c2-process-review.md` (C4, addendum §10 slice S-G).
