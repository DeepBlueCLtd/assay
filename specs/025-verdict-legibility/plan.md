# Implementation Plan: Verdict legibility & the argument surface (SPEC-25)

**Spec**: `specs/025-verdict-legibility/spec.md` · **Research note**: `docs/research/13-legibility.md` (**DEC-11 gate for US2 — authored first**; decides the shadow-state preview contract, its five binding rules, the fork-is-cheap enabling property, the refusal-as-preview edge cases, and records why US1/3/4/5 are register-neutral presentation) · **Register**: concept §6 items 29 (the consequence-preview interaction class — a new *read*, honesty rule "previewed = computed, never estimated") and 30 (per-role action menus as a standing shell element — a DEC-32-class finding, register-neutral iff pure re-arrangement); both flagged, not asserted (DEC-2)

## Shape — the note decides US2, the code carries; US1/3/4/5 project banked output

```
Phase A  note 13 + concept §6.29/§6.30              ── the preview contract; the four register-neutral projections recorded
   ▼
Phase B  US1 verdict legend (pure, oracle-derived)  ── src/components/verdictLegend.ts + legends.ts key; reachable everywhere a verdict renders
   ▼
Phase C  US2 consequence preview (the substantive)  ── src/preview.ts (fork + diff) + AppState.fork/preview; store/trace/delta clone; ghost render; shell arm/commit/cancel
   ▼
Phase D  US3 cards v2  ·  US4 challenge  ·  US5 menus ── projections over SPEC-07/09 (at-risk), SPEC-11 (challenge), the role→verb map (menus)
   ▼
Phase E  gallery + tests + batch propagation + verify
```

Nothing in B–E asserts a register decision; both candidates are **flagged** (§6.29/§6.30). US2 does not start before the note lands (DEC-11); US1/3/4/5 build on the note-09 presentation audit already banked.

## The load-bearing facts

- **Everything re-renders computed output** (FR-007, honesty stance): the legend renders the *frozen oracle O-3* mapping through the pinned `marginBand`/`verdictFor` (not live data); the preview runs the *real* services over a clone; cards v2 fold over *scorer* verdicts; challenge projects the *SPEC-11* ranking; menus re-present *existing gated* affordances. No new engine, no new scalar, no schema change, no seam change.
- **The preview is a fork, not an estimate** (note §2, DEC-10): `AppState.fork()` clones store/trace/delta log (three append-only containers, cheap because the store is immutable — SPEC-01) and wires fresh service instances over the clone; the armed act runs through the same service methods; the diff is the value-keyed glow-signature set difference between the committed snapshot and the shadow snapshot. Previewed diff ≡ post-commit glow set, byte-for-byte (rule 3; G1 guarantees it).
- **The glow signature map is the diff substrate** (SPEC-16): `sigMap(snapshot)` extracts `data-glow-id → data-glow-sig` from panel HTML (the exact map the shell diffs); `changedGlowUnits(before, after)` (existing, pure) is reused unchanged for the ghost diff.
- **The at-risk incumbent is P1 under R3m, stated** (note §4): apples-to-apples with the candidates; where P1 cannot be scored the basis renders as a stated absence, never a silent empty line. `sacrificed` stays exactly the violated set (SPEC-09 unchanged).
- **The challenge reuses the sensitivity call** (note §5): `SensitivityService.analyse` for the challenged plan/world — same inputs, same stamp — projected onto the challenged commitment's index (the scorer's canonical commitment order). Insensitive ⇒ the honest sentence, first-class.
- **Menus reorganise, never restrict** (note §6, FR-006): a single `ROLE_VERBS` map is the source of truth; observer exposes no write; deferred verbs are labelled, never faked.

## Seam / schema

- **No schema change, no seam change.** The preview is client-side orchestration of existing service calls over a cloned store (`PreviewState` is app-layer only, never stored, never stamped). New store/trace/delta `clone()` helpers are internal plumbing, not seam movement types.

## Surfaces & modules

- `src/components/verdictLegend.ts` (pure): the four-region sign mapping + the frozen O-3 sweep table + the marginal (measure-zero) footnote; obeys wall mode; keyed `verdict_legend` in `legends.ts`; a `verdictLegendFor(component)` helper emits it for any verdict-bearing component.
- `src/components/legends.ts`: `verdict_legend` entry; `verdictLegendFor`.
- `src/store.ts` / `src/trace.ts` / `src/deltas.ts`: `clone()` — copy the internal append-only state (enabling the fork; note §2.2).
- `src/preview.ts` (thin orchestrator): `ArmedAct` union (resolve / reopen / band-edit / waypoint-move / window-shift), `applyArmedAct(app, act)`, `previewAct(app, act) → PreviewResult {armed, changed:Set, before, after, cells, refusal?}`; `sigMapOf(snapshot)` (the shell's regex, shared).
- `src/app/state.ts`: `#wireServices(svc)` (factored from `seed()`), `fork()` (clone → wire → copy resolved/step), `challenge(planId, commitmentId)` (sensitivity projection), at-risk derivation feeding `s3Cards`; the verdict legend appended to verdict panels.
- `src/components/s3Cards.ts`: the derived "puts at risk" second line + numbered, trace-linked reasons; `sacrificed` semantics unchanged.
- `src/components/challengePanel.ts` (pure): the SPEC-11 contributors scoped to a verdict, single-source flags, S1 deep-links, the honest insensitive sentence.
- `src/roleMenus.ts` + `src/components/roleMenu.ts` (pure): `ROLE_VERBS` source of truth + renderer; wired per tab in the shell.
- `src/app/shell.ts`: arm/commit/cancel preview controls + ghost rendering; the challenge affordance on verdict cells; per-tab role menus; the verdict legend reachable everywhere.

## The preview, restated tight (note §2)

1. `fork()`: clone store/trace/deltas; new `KnowledgeService` over the clone; `#wireServices`; copy `#resolved`, `#step`. The committed state is never touched.
2. `applyArmedAct(shadow, act)`: run the act through the shadow's service methods (resolve/contest/editBand/moveWaypoint/shiftWindow) — the same firewall applies.
3. `before = sigMapOf(await app.snapshot())`, `after = sigMapOf(await shadow.snapshot())`; `changed = changedGlowUnits(before, after)`.
4. `cells` = the changed verdict units (id → from/to verdict word) for the ghost; `refusal` = the shadow's notice if the act refused.
5. Commit = `applyArmedAct(app, act)` (real); cancel = drop the fork (no-op). Rule 3: the same-act glow set on commit equals `changed`.

## Testable seams (Node, vitest)

- `tests/verdictLegend.test.ts` — four regions with sign conditions; the O-3 illustration `[9,13]` × `at_most {8…14}` → `[violated, tight×4, marginal, robust]`; the marginal/measure-zero footnote; oracle-derived (uses the frozen constants). Structural: the legend appears on every verdict-bearing panel of the live app.
- `tests/preview.test.ts` — **the core exhibit** (US2 Independent Test, SC-002): arm K12a-resolve ⇒ ghost-diff set equals the glow set of the committed resolve (byte-equal); `arm → cancel` ⇒ store size + delta count + every stamp byte-identical; a dishonest K3 band edit previews its `encoding_violation` refusal and commits nothing; preview persists nothing (store/deltas unchanged after preview).
- `tests/s3Cards.test.ts` (extend) + app test — the at-risk line derived from verdict deltas (pinned once observed); `sacrificed` still exactly the violated set; numbered reasons carry `data-logical-id` (trace-walkable); no decimal on the card face.
- `tests/challenge.test.ts` — challenge C4 ⇒ SPEC-11 contributors for C4, K8 present with `single_source`, stamp matches an equivalent sensitivity call; an insensitive verdict ⇒ the honest sentence.
- `tests/roleMenu.test.ts` — each tab's menu equals its documented legal verb set; observer exposes no write; no wired act removed; structural no-scalar over the rendered menus.
- No oracle/verdict/coverage-row change; no forbidden urgency/score scalar in any new surface (structural regex).

## Out of scope / deferred (tracked, note §7)

- **`/select`** — the commander's `select` verb is named-but-unbuilt; the menu labels it deferred; the DSM's "no selection exists" statement stands.
- **Seam-level `POST /preview`** — a later candidate if a second consumer appears; v1 previews client-side.
- **Composed multi-arm preview** — one armed act at a time (note §2.3); two-edit attribution deferred.
- **Register ratification** of §6.29/§6.30 (next batch).
