# Research note 14 — The focused transitive dependency view (issue #24)

Depth slice (post-SPEC-16) · per ASSAY-DEC-11 · 2026-07-16 · bounded to hours, one page preferred
Prompts (from issue #24): pick one item (K/C/R/P) and see its **entire** upstream (what informs it) and downstream (what it influences) chains at once, rendered as a graph, rather than the one-hop, expand-on-click context menu SPEC-16 ships. Decide **(a)** how the one-hop orientation reading (note 05 §4) composes *transitively*; **(b)** the layout; **(c)** the scale/fan-out honesty rule; **(d)** the placement (fifth surface, overlay, or full-screen mode). Output gates the dependency-view build slice (formalised as SPEC-27; the code was authored ahead against issue #24 and is retro-anchored to this note).

> **Register-first (DEC-2).** This note decides the *design*; the register decision is a candidate (concept §6.29), flagged, awaiting the next batch. No schema change, no new engine, no new invariant — the view is a **projection of the trace graph** that already exists.

---

## 1. Almost nothing here is new machinery — three things are genuinely open

The dependency view walks the **same** trace graph the one-hop menu walks (`src/traceView.ts`, note 05 §4) and the staleness service walks (`src/staleness.ts`, note 08 §4). The edges are written at compute time by the computing service (constitution III, G3); dead-ends are already surfaced as dead-ends (`TraceStore.walk`'s `complete: false`, note 05). The objects, the eight typed edge kinds, and the per-edge orientation map are all decided in the canonical set. This note deliberately spends its hours only on what issue #24 leaves open — the **transitive** composition of orientation, the **layout**, the **scale honesty**, and the **placement** — and treats everything else as a projection of settled machinery. That is the same posture note 07 took for the flow view (ui-design §1.4: a view is a projection of decided machinery, not a new decision).

**The load-bearing claim, stated up front:** a dependency view is honest *because of what it renders*. It renders the **provenance/trace graph** — edges a service actually wrote when it did a computation — not an inferred interdependency web. This is the precise distinction that keeps it clear of thesis G's false-precision territory (§6).

## 2. Transitive orientation is not "call `TraceStore.walk`" — and that is the one real subtlety

The obvious implementation — "call `TraceStore.walk(hash, 'forward')` and `walk(hash, 'backward')`" — is **wrong**, and understanding why is the whole technical content of this note.

`TraceStore.walk` follows **raw hash direction**: `forward` = from→to, `backward` = to→from. But the trace edges are written in **mixed orientations** (note 05 §4): `compiled_into` points K→World (upstream→downstream), while `scored_from`/`cited_in`/`sacrificed_in` point Verdict→World (downstream→upstream). So a raw forward walk from a K reaches the world along `compiled_into` and *stops* — it never turns the corner onto the verdict, because the verdict's edge points the "wrong" way in hash space even though the verdict is genuinely downstream. A raw walk produces an **incoherent** upstream/downstream reading past the first hop.

The one-hop menu already solves this for one hop with `EDGE_ORIENTATION` (`traceView.ts`): for the *downstream* reading, `compiled_into` contributes `forward`, `scored_from`/`cited_in`/`sacrificed_in` contribute `backward`, `contests` is `either`; the *upstream* reading is the mirror (`forward↔backward`, `either` unchanged). The transitive view's rule is exactly this, **lifted to a walk**:

> **Decided (a): walk by orientation-resolved direction, never by raw hash direction.** For each edge, resolve its orientation under `EDGE_ORIENTATION` *for the direction being walked* (mirror for upstream), then step to the neighbour that orientation selects. BFS this, layer by layer. Depth = **orientation-distance** from the focus, not hash-distance.

This is why the build has its own `walkDirection` (`src/depGraph.ts`) rather than reusing `TraceStore.walk`: the store's walker is orientation-blind by design (it is the primitive; note 05's menu and note 08's staleness both wrap it with orientation), and a transitive upstream/downstream reading *must* apply the orientation map at every hop. The walker stays the primitive; this note adds a second orientation-aware wrapper beside the menu and staleness — no new graph mechanics, the same map applied transitively.

Three consequences of walking by orientation, each a small honesty point worth stating:

- **BFS gives shortest orientation-distance.** A node is placed in the first layer that reaches it (per-direction `visited` set); it never appears twice on one side. Depth-1 upstream is "what *directly* informs"; depth-2 is "what informs that"; and so on. Layers are meaningful, not cosmetic.
- **`contests` (`either`) shows on both sides.** A contested peer both informs and is informed-by — rendering it upstream *and* downstream is honest, not double-counting. The per-direction visited sets allow exactly this (a node may appear once upstream and once downstream; the BFS-uniqueness property is *within* a direction).
- **The focus never appears in a layer**, and cycles are guarded by the visited set — the same cycle discipline `TraceStore.walk` already has, kept.

## 3. Layout: horizontal river + detail sidebar — the same Shneiderman/Munzner result as note 07

Three layouts were mocked for review before implementation (`docs/assets/dep-graph-mocks/index.html`, real Meridian identifiers): **A** a horizontal left→right river (upstream → focus → downstream), **B** a vertical DAG with routed edges, **C** a layered list. The decision composes **A + C**:

> **Decided (b): a horizontal river as the overview, a click-driven detail sidebar as details-on-demand.** The river (`depGraphRiver.ts`) is the spatial overview — upstream layers on the left, the focus in the centre, downstream layers on the right, colour-coded by object type. The sidebar (`depGraphSidebar.ts`) renders the clicked node's metadata and its neighbours grouped by depth and edge type.

The reasoning is the one note 07 §2 already established and this note reuses rather than re-litigates: this is Shneiderman's **Visual Information-Seeking Mantra** — "overview first, zoom and filter, details-on-demand" (Shneiderman, 1996) — with the river as overview and the sidebar as details-on-demand, and Munzner's warning (2014) that detail must be *reachable, not permanent* (so the sidebar is click-driven, not a second always-on graph). The left→right axis is not arbitrary: reading upstream→downstream as left→right maps causal/derivational flow onto the culturally-standard reading direction, the same way a provenance graph (W3C PROV-DM, 2013; note 07 §3) reads `wasDerivedFrom` as flow. **Vertical DAG (B) is rejected**: routed-edge crossing-minimisation is real implementation cost that buys nothing at Meridian's scale (tens of nodes, ≤4 layers), and a node-link tangle is exactly the false-precision *look* the project avoids (§6). The river carries the same information with no edge-routing and honest per-layer columns.

## 4. Scale honesty: two bounds, both stated, never a silent drop

Transitive fan-out can be large (issue #24 flags it). The view bounds it two ways, and the governing rule is that **every bound is stated where it bites** — the presentation-layer reading of G3 (surface dead-ends) and the spirit of G4 (no silent drop):

> **Decided (c): bound by depth and by per-layer width, and render both bounds explicitly.**
> - **Depth cap** (`maxDepth`, default 4): the walk stops at a fixed orientation-depth. When it stops with a **non-empty frontier still to explore**, that is surfaced — the river renders a stated end-cap (`… deeper sources` / `deeper effects …` `⋯`) on the truncated side, and `DepGraph` carries `upstreamTruncated`/`downstreamTruncated`. A depth cap that silently discarded the remainder would be precisely the silent truncation the project forbids; the cap is a *stated* bound, not a hidden one. *(This was the one gap between the shipped code and the project's own bar; closed in this slice — a walk stopped by depth now says so.)*
> - **Per-layer width cap** (`MAX_VISIBLE_PER_LAYER`, 5): a layer wider than the cap shows the first few chips plus `+ N more` **and a type summary of the whole layer** (`depth 2 · 4 knowledge, 1 world`) — the full count and composition are stated even when the individual chips are elided.
> - **Dead-ends** (G3): a neighbour hash the store does not know renders at reduced opacity, labelled `(dead end — G3)` — surfaced, never hidden, exactly as the one-hop menu already does.

The defaults (4, 5) are presentation latitude, not register matter — recalibrate after the SME checkpoint (comms §12), as the band-width and lint thresholds were (DEC-27). What is *not* latitude is the invariant: **a bound may elide detail but must never hide that it did so.** This is G3/G4 applied one level up, to the view — and it needs no new register line, because it is those invariants, not a new one. (Contrast the horizon note's proposed *"no silent COA-family drop"* invariant (§2.5, issue #43): that one is genuinely new because it governs *generation* — what COAs are thinkable. This view generates nothing; it projects an existing graph, so the existing surface-honesty invariants already cover it.)

## 5. Placement: a full-screen drill-in overlay, reached from any item — not a sixth tab

Issue #24 explicitly leaves placement open (fifth surface / overlay / full-screen mode). The decision:

> **Decided (d): a full-screen overlay, opened by a "View full graph →" link on the existing one-hop trace menu, dismissible by backdrop or Close.** Clicking a node in the river re-centres the whole view on that node (a pure re-projection — `depGraphByHash`), so the graph is *navigable*, not a static snapshot.

Rationale, and the register consistency it preserves: the dependency view is a **drill-in from any item on any tab**, not a role and not a standing surface. DEC-32 fixes the four role tabs (J-2 / planner / commander / observer); DEC-36 added the "Spatial · COA" tab as a deliberate, ratified exception — *a cross-role surface*. A dependency view is neither a role nor a surface one *works in*; it is the "why/where-does-this-go" question asked *about* whatever item is already on screen. So it takes the shape note 07 §2 reserved for L2 details-on-demand: **drill-in, not a fourth (here: sixth) always-on panel** that would drown the other tabs' audiences. An overlay is transient, carries the item as context, and returns you where you were — the honest shape for a lens you point at things, and it keeps DEC-32's tab count unextended without needing a new ratified exception.

Re-centring on click is **selection, not computation** — the same honesty line the COA-viz scrub draws (DEC-36(c): scrub = pure selection, no recompute, no glow). Navigating the graph reads the already-written edges; it never re-scores, re-compiles, or writes anything. The view is strictly read-only over the trace store.

## 6. Why this is the *antithesis* of thesis G, not an instance of it

Thesis G (interdependency / PMESII node-link) is catalogued as "horizon; highest false-precision risk" (concept §1), and knowledge-model §12 keeps PMESII interdependency shapes deliberately out. A node-link "dependency graph" could look like exactly that forbidden thing. It is not, and the distinction is sharp and worth recording so the two are never conflated:

- **Thesis G's danger is inventing edges.** A PMESII interdependency web asserts "instability *influences* legitimacy" as a modelled correlation nobody wrote down and nothing can trace — false precision because the edge is synthesised.
- **This view renders only edges a service actually wrote at compute time** (constitution III): `compiled_into` because the compiler compiled this K into that channel; `scored_from` because the scorer scored that verdict from this world; `sacrificed_in` because relax sacrificed that commitment in this report. Every edge has a named writer and a real computation behind it. There is nothing to invent, and dead-ends are shown as dead-ends.

So the dependency view is the honest **counter-example** to thesis G: it demonstrates that ASSAY *can* show a graph of relationships precisely because it only ever shows relationships it earned. It is a sibling of issue #43's forward-derivation sketch (which names #24 "a presentation slice, not a parent") and shares the same substrate the focused view would lean on, but it opens none of #43's register questions — it changes no schema and generates nothing.

## 7. Honesty invariants preserved (the SPEC-09 test, applied to a view)

Every invariant that would rule a mechanism out (note 04 §closing; the test SPEC-09 applied to weighted CSP) holds here by construction:

- **Banded honesty (G2/G6).** The view is structural, not evaluative — it renders no score and collapses no band. Where a band appears in a node's metadata it appears as `[lo,hi] unit` (`metadataString`), never a midpoint. No scalar is introduced anywhere.
- **Trace-to-named-knowledge (G3).** The view *is* the trace, rendered; dead-ends render as dead-ends; frozen identifiers only (labels are `logical_id · name`, K/C/R/P — vignette §8/§9, never drift).
- **No new engine (DEC-10).** A projection of the existing `TraceStore` + `EDGE_ORIENTATION`; no service is added, nothing is recomputed. Constitution III holds *a fortiori* — the view only reads edges, never reconstructs them.
- **No silent drop (G4, spirit).** §4: depth and width bounds are stated where they bite.

If any of these had failed, the view would be out. None do — because a faithful projection of an honest graph inherits the graph's honesty.

## 8. What the note does not decide (latitude / open items)

- **The cap defaults** (depth 4, width 5) are presentation latitude — recalibrate after the SME checkpoint (comms §12). Not register matter.
- **A future SVG/edge-drawn layout** (routed arrows within a layer) stays on the table as an enhancement if a later, denser world needs it; the river is correct for Meridian scale and is not a commitment against ever drawing edges.
- **An in-place "expand the +N more" affordance** and **raise-depth control** are natural next interactions; the honest bounds (§4) make either safe to add without changing the model.

## Sources

Shneiderman, B. (1996). "The Eyes Have It: A Task by Data Type Taxonomy for Information Visualizations." IEEE VL '96 — the overview→zoom/filter→details-on-demand mantra (via note 07). Munzner, T. (2014). *Visualization Analysis and Design* — overview+detail, detail reachable-not-permanent (via note 07). W3C PROV-DM (2013) — provenance as a typed derivation graph (via note 07 §3). ASSAY register DEC-2 (register-first), DEC-10 (scorer/services reused, no new engine), DEC-32 (four role tabs), DEC-36 (the ratified fifth-surface exception); constitution III (edges written at compute time), G3 (trace-to-named-knowledge / dead-ends surfaced), G4 (no silent drop), G6 (banded propagation). ASSAY docs: `assay-concept.md` §1 (thesis G, false-precision risk), §6 candidate 29; `assay-knowledge-model.md` §12 (PMESII kept out); research notes `05-surfaces.md` §4 (the `EDGE_ORIENTATION` map), `07-flow-view.md` §2–§3 (Shneiderman/Munzner/PROV), `08-analysis.md` §4 (the staleness orientation walk), `horizon-forward-derivation.md` §2.5/§3 (the generation-layer "no silent COA-family drop" invariant this view does *not* need). Issue #24 (the request); the review mocks `docs/assets/dep-graph-mocks/index.html`.
