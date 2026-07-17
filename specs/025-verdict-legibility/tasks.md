# Tasks: Verdict legibility & the argument surface (SPEC-25)

Dependency-ordered. `[P]` = parallelisable. **Gate**: research note `docs/research/14-legibility.md` present (DEC-11, US2's gate) and concept §6 items 30/31 flagged — Phase A produces both; US2 (Phase C) does not start until Phase A lands. US1/3/4/5 build on the note-09 presentation audit already banked.

## Phase A — research note & register candidates (the DEC-11 gate for US2)

- [X] **T01** Author `docs/research/14-legibility.md`: the shadow-state preview contract and its five binding rules (same services/firewall; nothing persisted/no delta/no stamp mutation; previewed diff ≡ post-commit glow set byte-for-byte; ghost banded/uncommitted; pre-figures the glow set); the fork-is-cheap enabling property (immutability); the refusal-as-preview edge cases; and the audit trail for why US1/3/4/5 are register-neutral presentation (the CRT/Into-the-Breach/Red-Teaming-Handbook literatures; the incumbent-P1 at-risk basis; the sensitivity-projection challenge; the role→verb map).
- [X] **T02** Flag concept §6 items 30 (the consequence-preview interaction class) and 31 (per-role action menus as a standing shell element); **do not assert** either (DEC-2).

## Phase B — US1 the public verdict legend (register-neutral; oracle-derived)

- [X] **T03** `src/components/verdictLegend.ts` (pure): the four-region sign mapping (robust `m_lo>0` / marginal `m_lo=0≤m_hi` / tight `m_lo<0≤m_hi` / violated `m_hi<0`) illustrated by the frozen oracle O-3 sweep (`[9,13]` × `at_most T`, `T∈{8…14}`) computed through the pinned `marginBand`/`verdictFor`, with the marginal-is-measure-zero footnote; wall-mode-clean; no scalar. [P]
- [X] **T04** `src/components/legends.ts`: `verdict_legend` PILL_LEGEND entry; `verdictLegendFor(component)` emitting the legend for any verdict-bearing component. [P]

## Phase C — US2 the consequence preview (the substantive build; after Phase A)

- [X] **T05** `src/store.ts`, `src/trace.ts`, `src/deltas.ts`: `clone()` — copy the internal append-only state so a fork is a byte-faithful, independent shadow (note §2.2). [P]
- [X] **T06** `src/app/state.ts`: factor the service wiring in `seed()` into `#wireServices(svc)`; add `fork()` (clone store/trace/deltas → new `KnowledgeService` → `#wireServices` → copy `#resolved`/`#step`).
- [X] **T07** `src/preview.ts` (thin orchestrator): `ArmedAct` union; `applyArmedAct(app, act)`; `sigMapOf(snapshot)` (the shell's glow-attribute regex, shared); `previewAct(app, act) → PreviewResult` (fork → apply on the fork → diff sig maps → `{armed, changed, before, after, cells, refusal?}`); persists nothing on the committed app.
- [X] **T08** `src/app/shell.ts`: arm/commit/cancel preview controls; ghost rendering (unmistakably uncommitted, banded/four-stop, "previewed — not applied"); one armed act at a time; commit applies exactly the previewed act; cancel a no-op.

## Phase D — US3 cards v2 · US4 challenge · US5 menus (projections; after Phase B/C)

- [X] **T09** `src/app/state.ts` + `src/components/s3Cards.ts`: derive the "puts at risk" second line (verdict deltas vs the stated incumbent P1-under-R3m, degradations short of violation, four-stop decisiveness order), stated-absence when the incumbent cannot be scored; numbered, individually trace-linked reasons; `sacrificed` semantics unchanged; no decimal on the card face (G2).
- [X] **T10** `src/components/challengePanel.ts` (pure) + `src/app/state.ts` `challenge(planId, commitmentId)`: re-render the SPEC-11 ranking scoped to the challenged commitment (perturbed≠baseline at that index), single-source flags, S1 deep-links, the honest insensitive sentence; reuses the sensitivity call (same stamp), no new compute. [P]
- [X] **T11** `src/roleMenus.ts` + `src/components/roleMenu.ts` (pure) + `src/app/shell.ts`: the `ROLE_VERBS` source-of-truth map + renderer; per-tab menus; observer read-only; deferred/pipeline-automatic verbs labelled honestly (DEC-4); wired acts route through existing gated services (DEC-33); nothing silently removed. [P]
- [X] **T12** `src/components/legends.ts`: legend keys for the challenge (`challenge`) and role menus (`role_menu`); wire `verdictLegendFor` into the verdict-bearing panels in `src/app/state.ts` (matrix, coa verdicts, scenario strip, DSM, cards, sensitivity). [P]

## Phase E — gallery, tests, batch propagation & verify

- [X] **T13** `scripts/build-gallery.ts`: the SPEC-25 demo moment(s) — the verdict legend + a consequence-preview ghost diff rendered from the same fixture run. [P]
- [X] **T14** Tests: `tests/verdictLegend.test.ts`, `tests/preview.test.ts` (the core exhibit — preview≡commit byte-equal, cancel byte-identical, refusal-preview), `tests/challenge.test.ts`, `tests/roleMenu.test.ts`; extend `tests/s3Cards.test.ts` + an app test for the at-risk line; structural no-scalar assertions.
- [X] **T15** Sweep peers: `CLAUDE.md` current-phase line; `docs/status.yml` updates entry; seam-contract "Open items" gains the consequence-preview candidate (client-side v1; a `POST /preview` contract at ratification).
- [X] **T16** Regenerate committed assets that render the new surfaces: `npm run gallery`, `npm run build:app`.
- [X] **T17** Verify: `npm run typecheck` clean, `npm test` green; no oracle/verdict/coverage-row change; the legend + preview reproduce from a cold start.
