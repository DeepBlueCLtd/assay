# Tasks: Interactive surfaces (SPEC-16)

Dependency-ordered. `[P]` = parallelisable. Gate: research note `05-surfaces.md` present (DEC-11) and concept §6 candidates flagged — both done.

## Phase A — pure, testable seams (no DOM)

- **T01** `src/traceView.ts` — `EDGE_ORIENTATION` map (note 05 §4) + `informs(hash, resolve)` / `influences(hash, resolve)` one-hop neighbour lookup over a `TraceStore`, resolving logical_id→latest hash; dead-ends carry `complete:false`. [P]
- **T02** `src/components/legends.ts` — per-component legend renderers (`<details>`) from note 05 §5; generated-types-only imports. [P]
- **T03** `src/app/glow.ts` — pure `dependencyHashes(panelModel)` + `changedPanels(prev, next)` set-diff; no DOM. [P]
- **T04** Tests: `tests/traceView.test.ts` (orientation, one-hop both directions, dead-end), `tests/glow.test.ts` (changed/unchanged/idempotent-edit).

## Phase B — the shell

- **T05** `src/app/state.ts` — the world model + `applyEdit(op)` that re-drives the pipeline (contest/resolve → compile → handful → score → relax, per `build-gallery.ts`) and returns the new panel models + changed-hash sets.
- **T06** `src/app/shell.ts` — render four tabs by calling the pure components; wire edit controls (band editor, resolve/contest buttons, scenario toggle, handful/relax triggers); apply glow classes; mount the trace menu on item chips; render legends.
- **T07** `src/app/bootstrap.ts` — construct store+services, seed from imported fixtures, mount the shell.
- **T08** `src/app/app.css` (or inline) — the glow `@keyframes` (~10s ease-out), tab chrome, popover.

## Phase C — build + publish

- **T09** Add esbuild dev dep; `scripts/build-app.ts` → `docs/assets/app/index.html` (self-contained); `package.json` `build:app`; `build:site` copies the app.
- **T10** App-bootstrap smoke test in Node (crypto.subtle ≥19): seed → resolve K12 → recompute; assert stamp change, verdict change, and the glow set equals the changed-hash set.

## Phase D — comms currency (part of "done", §6.14)

- **T11** Blog article `docs/blog/posts/interactive-surfaces.html` (self-contained, comms §6.2) embedding the shipped app; add to the blog index + updates feed.
- **T12** Home-page currency: `docs/assay-home.html` / `docs/status.yml` reflect the demonstrator as live (comms §6.12).

## Phase E — batch propagation + verify

- **T13** Sweep peers: `assay-ui-design.md` §6 (retire open question 2), delivery/build-plan status lines, `CLAUDE.md` current-phase line.
- **T14** `npm run typecheck` clean; `npm test` green; `npm run build:app`; drive the app in Chromium (SC-001…SC-005); oracle O-1…O-4 reproduce.
