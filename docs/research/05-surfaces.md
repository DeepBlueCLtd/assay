# Research note 05 — Interactive surfaces, live and honest

Front-end lane (SPEC-16) · per ASSAY-DEC-11 · 2026-07-13 · bounded to hours, one page preferred
Prompts (delivery plan §SPEC-16; concept §6 items 4/5; ui-design §6 item 2): decide the surface shell (tabs vs role-switch vs micro-frontends); decide whether the published app can run the real pipeline in the browser and how; decide how operator edits stay honest; decide how downstream change is made visible without lying about it; decide how a reader interrogates the relationships between chunks of knowledge/logic. Output feeds SPEC-16 (`src/app/*` shell + the interactive published surfaces) and a SPEC-14 delta (per-component legends, trace-menu mount hooks). Register candidates: concept §6 items 14–16.

## 1. The pipeline is already a browser program — this is the load-bearing finding

The published app is static today (`scripts/build-gallery.ts` runs the real services at build time and bakes HTML). The temptation, faced with "make it interactive with live downstream consequences," is to fake the downstream — hand-author a before/after pair, or ship precomputed snapshots and switch between them. That is the exact dishonesty this project refuses everywhere else, and it is **unnecessary**, because the demonstrator's compute core is already browser-safe by construction:

- **Hashing** is one code path for Node and browser: `contentHash` uses `globalThis.crypto.subtle.digest('SHA-256', …)` (`canonical.ts:63`), which exists in every browser and in Node ≥ 19. The determinism spine (G1) needs no adaptation.
- **The services** (`Knowledge/Compile/Score/Handful/Relax`, `ObjectStore`, `TraceStore`, `DeltaLog`) import only generated types and each other — no `node:fs`, `node:crypto`, or other host API. The *only* Node dependency in the whole path is `readFileSync` of the fixtures, and that lives in the build **scripts**, not in `src/`.

So the decision is settled by the code, not invented: **run the real services in the browser.** The reachable-intervention space is not enumerated and frozen; it is *computed live* by the same functions the tests and oracle cases exercise. "Live downstream consequences" is honest because it is literally the same recompute the gallery already performs — moved from build time to click time.

**Bundling.** Replace the scripts' `readFileSync` with static imports of the fixture JSON, and bundle `src/app/bootstrap.ts` with **esbuild** — a single dev-dependency, no framework, no runtime, honoring SPEC-14's framework-free ethos (the components are HTML strings; the shell is vanilla TS + DOM). New script `build:app` emits a self-contained `docs/assets/app/` bundle (inlined fixtures, no external services, no CDNs — the comms §6.2 rule-4 embed shape at no extra cost). React/Vue/Svelte are rejected: they buy nothing the eight pure string-renderers don't already give, and they would break the "components depend only on generated types" extractability rule.

## 2. The shell — tabs, one store, the split that keeps SPEC-14 intact

The long-open shell question (concept §6 item 4; ui-design §6 item 2) is decided **literal tabs in one page over one shared client store** (candidate §6.14). Role-switch-with-distinct-chrome buys demo theatre at the cost of hiding the very thing this project is about — that the four roles operate on *one* seam. Tabs make the heartbeat loop (J-2 writes → planner compiles/plans → commander selects → PIRs back, ui-design §3) visible *as* propagation across tabs, which is the honest version of "different roles."

The hard constraint is SPEC-14's extractability rule: **components depend only on generated types, never on app state or services.** Live editing needs state. The resolution is a **shell / pure-component split**, and it is the whole architecture:

- **`src/components/*` stay pure** — types-in, HTML-string-out. Untouched but for an additive, still-types-only **legend** export (§5). They never learn there is a store.
- **`src/app/` is new and owns everything stateful** — it holds one `ObjectStore` + one `TraceStore` + one instance of each service (constructed exactly as `build-gallery.ts` constructs them, seeded from the imported fixtures), renders the four tabs by *calling the pure components with fresh objects*, wires the edit controls, runs the recompute, and computes the glow. State lives in the shell; rendering stays pure. Extractability survives because the extractable thing — the component kit — is exactly what stayed pure.

## 3. Editing stays honest by routing through the services that already refuse

Full editability is honest **only** because every edit is a service call, not a mutation of stored state (objects are immutable, DEC-21; the store has no update path, `store.ts`). An operator edit *creates a new version* through `KnowledgeService.create/supersede/contest/resolve`, which enforce the encoding firewall (`checkEncoding`), confidence-lint floor (`confidenceLint`), and the contested-never-compiles rule (`isCompilable`, G5) — the same gates the tests pin. Therefore:

- A dishonest edit (an assumption dressed as a hard constraint; a low-confidence judgement given a suspiciously tight band) returns a first-class **`Refusal`/`waiver_required`** rendered by `refusalBanner`, and **nothing persists** — never a fabricated result.
- No assessed scalar is ever rendered unbanded, live-edited or not: values render through `bandPill`, and the edit control edits **band endpoints** (`lo`/`hi`/`unit`), never a scalar (G2).
- Every write publishes exactly one `Delta` (seam §10) — the S4 observer feed is the delta log, live.

This makes the surfaces the "light authoring surface" of concept §6 item 5, seeded from the JSON fixtures rather than replacing them.

## 4. The glow is the trace graph, and the trace menu reads the same graph

"Downstream UI changed → glow yellow" and "before/after menu of what informs / is influenced by this" are the **same question asked of the same graph** — the `TraceEdge` set already written at compute time (`compiled_into`, `scored_from`, `cited_in`, `sacrificed_in`, `supersedes`, `contests`, `resolves`, `waives`). Two mechanisms, one substrate:

**Glow (G6 made visible).** Every rendered object is content-addressed. Each panel and tab declares the set of `content_hash`es it depends on (the objects it renders). After a recompute, the shell diffs each panel's current dependency-hash set against its prior set; **a panel glows iff a hash it depends on changed** (added, removed, or replaced by a new version). The owning tab button lights the same way. This is not an animation *of* propagation — it *is* the propagation graph, so it cannot under-report (the invariant G6 demands: no silently-dropped consequence). A fixed ~10s ease-out window (CSS `@keyframes`, class toggled by the shell) is display-only and never enters content addressing (DEC-17).

**The orientation map — the one real piece of new logic.** `TraceStore.walk` follows raw hash direction; it does not know "upstream vs downstream," and the edges are written in **mixed orientations**: `compiled_into` and `waives` point upstream→downstream (K → World), while `scored_from`, `cited_in`, `sacrificed_in` point downstream→upstream (Verdict → World; Candidate/Commitment → Report). A naive `forward` walk from K therefore reaches the world and *stops* (the verdict edges point *into* the world, not out). So "downstream/influences" is not a single direction — it is a per-`edge_type` decision. Decided map (`src/traceView.ts`, testable, reused by glow and menu):

| edge_type | from → to | to reach **downstream / influenced-by**, walk |
|---|---|---|
| `compiled_into` | K → World | forward |
| `waives` | K → World | forward |
| `scored_from` | Verdict → World | **backward** |
| `cited_in` | Verdict/Score → Report | **backward** |
| `sacrificed_in` | Commitment → Report | **backward** |
| `supersedes` | K_new → K_prior | backward (the prior is upstream of the new) |
| `contests` | K_a → K_b | either (symmetric — a peer relation, shown as "contested with") |
| `resolves` | K_survivor → K_loser | forward |

"Informs / upstream" is the mirror of each row. A logical id (K12) resolves to its latest version hash first (`ObjectStore.versions`, the services' `#latestHash` pattern). **Scope decision: one hop, expandable.** The menu shows only immediate neighbours; each neighbour re-invokes the same one-hop lookup on click. The full transitive focus view (pick an item, see the whole up/downstream chain as a graph) is genuinely more work and is **horizon-only** — tracked as an issue, not built here — but this note's orientation map is exactly its substrate, so it lands cheap later.

## 5. Legends — the key, per component, authored once here

Data pills are not self-explanatory to a first-time reader (the reported shortcoming). Decided: each component carries a **collapsible legend** (`<details>`), authored from the canonical key text below, defining every pill type it shows and *why it is banded*. The legend is a pure, types-only string renderer (`src/components/legends.ts`) so it does not touch the extractability rule. Canonical key text (the source of truth for the legend copy):

- **Band pill** — `lo–hi unit`. A range, not a number: an assessed value is shown as the interval it honestly occupies. **No midpoint** is drawn (DEC-15) — there is no "average" to read. Teal = degenerate (a single observed value); amber = a genuine assessed band.
- **Provenance chip** — `source_class · confidence`, with a forced `assessment, not fact` marker on anything not directly observed, a red `single-source` marker when uncorroborated, and the owner. Provenance is welded on, never optional (DEC-9).
- **Four-stop verdict** — `robust / marginal / tight / violated`: one colour language for how a plan meets a commitment, read off the signed margin band's sign only (research note 03). No decimals; the banded margin rides on hover (G2).
- **Tier chip** — `must / should / prefer`: the commander's ordinal priority on a commitment. Ordinal, never a numeric weight (DEC-19).
- **Waiver / blocks-compile pills** — a `waiver W-1` marks a value admitted only under an explicit waiver; `blocks compile` marks contested knowledge that reaches no world (G5).
- **Refusal banner** — the system declined to compute rather than launder a dishonest input; it names what offended and why (seam §1).

## 6. Honesty proof obligation (the acceptance the note gates)

SPEC-16 must demonstrate, on the running build, that interaction cannot break the invariants:

- **G2** — no bare assessed scalar appears in any surface state, including mid-edit and glowed states; the edit control edits band endpoints, never a scalar.
- **G4/G6** — every downstream object that changed on a recompute glows (the glow set equals the changed-hash set — no under-report); no consequence is silently dropped.
- **G5** — a live contest blocks compile; the refusal renders in place.
- **G1** — same edits in the same order reproduce the same stamps; the oracle cases O-1…O-4 reproduce exactly from the in-browser pipeline (never regenerated).
- **Frozen identifiers** — surfaces render vignette ids only (K*/C*/R*/FE-*/P*).

## 7. What this decides for SPEC-16

Run the real services in-browser (esbuild bundle, inlined fixtures, no framework). Four literal role tabs over one shared client store. Edits are service calls, honest-by-refusal. Glow = changed-content-hash set per panel/tab, a display of the trace graph, ~10s window. One-hop expandable "informs / influenced by" menu over the stated per-edge-type orientation map (`src/traceView.ts`). Per-component legends from §5 (SPEC-14 delta, pure). The focused transitive dependency view is horizon-only, tracked as an issue. No schema change (`npm run gen` not run — all shapes exist); the store, trace walk, services, and components are reused, not re-implemented.
