# Implementation Plan: Interactive surfaces (SPEC-16)

**Spec**: `specs/016-surfaces/spec.md` · **Research note**: `docs/research/05-surfaces.md` (DEC-11 gate) · **Register**: concept §6 items 14–16 (flagged)

## Architecture — the shell / pure-component split

The one load-bearing decision (note 05 §2): **components stay pure; a new `src/app/` shell owns all state.**

```
fixtures/*.json ─(static import)─▶ src/app/bootstrap.ts
                                     │  new ObjectStore + TraceStore
                                     │  new Knowledge/Compile/Score/Handful/Relax
                                     ▼
                              src/app/state.ts   ── the world model: current knowledge,
                                     │               compiled world, handful, relax report,
                                     │               deltas, + prior-render dependency-hash sets
                                     ▼
   src/app/shell.ts  ── renders 4 tabs by calling the PURE components with fresh objects,
        │                wires edit controls, runs recompute, computes + applies glow
        ├─▶ src/components/*  (unchanged, pure)      ── the panels
        ├─▶ src/components/legends.ts (new, pure)    ── per-component keys
        └─▶ src/traceView.ts (new, pure)             ── one-hop informs/influences (orientation map)
```

Nothing in `src/components/*` learns there is a store. Nothing in `src/app/*` re-implements pipeline maths — it calls the services `build-gallery.ts` already drives.

## Build

- Add **esbuild** (dev dep). New `scripts/build-app.ts` bundles `src/app/bootstrap.ts` + an HTML template into `docs/assets/app/index.html` (self-contained; fixtures imported as modules, inlined by the bundler). Scripts: `build:app`; `build:site` gains an app copy step.

## Recompute + glow (note 05 §4)

- On any edit, `state.ts` re-drives the pipeline (the exact sequence in `build-gallery.ts`: contest/resolve → compile → handful → score → relax) and records, per panel, the `content_hash` set it depends on.
- The shell diffs new vs prior dependency-hash sets; the symmetric difference being non-empty ⇒ glow that panel and its owning tab. A CSS `@keyframes` ~10s ease-out, class toggled by the shell, cleared on a per-panel timer.

## Trace menu (note 05 §4)

- `src/traceView.ts`: `EDGE_ORIENTATION` map + `informs(hash)` / `influences(hash)` returning one-hop neighbour refs (label + edge_type + `complete`). The shell renders a `<details>`/popover on item chips; expanding a neighbour re-calls with its hash. Cycle guard inherited from `TraceStore.walk`.

## Honesty gating (note 05 §3)

- Edit controls submit through the services; a returned `Refusal` renders via `refusalBanner` in place; a `LintWarning` renders as the s1Table caution. Value editor edits `Band.{lo,hi,unit}` only.

## Testable seams (Node, vitest)

- `src/traceView.ts` — orientation map + one-hop informs/influences over a seeded `TraceStore` (mirrors `tests/trace.test.ts`).
- `src/app/glow.ts` — a pure `changedPanels(prev, next)` set-diff (no DOM), unit-tested.
- The in-browser pipeline is the same services already covered; add an app-bootstrap smoke that runs the seed+resolve+recompute in Node (crypto.subtle works in Node ≥19) and asserts the K12 cascade + glow set, no DOM required.

## Out of scope (tracked as issue)

- The focused transitive dependency graph view (note 05 §4, horizon-only).
