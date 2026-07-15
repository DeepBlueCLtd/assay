# Implementation Plan: Compile-overlay precedence — excursions beat base (SPEC-20)

**Spec**: `specs/020-compile-precedence/spec.md` · **Research note**: `docs/research/02-compile.md` **§6 amendment** (DEC-11 gate — decides the layered rule and its full tie order) · **Register**: concept §6 item 22 (flagged); rides DEC-8/DEC-29 · **Origin**: review 2026-07-14 §3.6 / action A5 / addendum slice S-B

## Shape — fix-class, research-note-gated

```
Amend 02-compile.md §6      ── decide: layer beats geometry; within-layer tie order unchanged;
  │                            audit the frozen tableau for every excursion/base coincidence
  ▼
Flag concept §6.22          ── register candidate (DEC-2); the spec is never the authority
  ▼
src/materialise.ts          ── channelAt resolves by layer first (excursion wins), then the
  │                            documented §3 tie order within the layer
  ▼
engine_version 0.2.0        ── behaviour changed over identical inputs; stamps move; the
  │                            comparability guard learns engine lineage
  ▼
consequence management      ── C5 violated under R3/R3m; sacrifice sets {C4,C5}/{C3,C5}/{C2,C5};
                               batch propagation + artifact regeneration, never a silent test edit
```

## The load-bearing finding — the layer is derived, not stored

The compile already writes every excursion override with `source = <scenario logical_id>` (DEC-8 overlay path) and stamps the world with `scenario`. So an override's layer is a pure function of data the world already carries:

```
excursion-layer(o, world)  ⟺  world.scenario !== undefined && o.source === world.scenario
```

Base overrides carry `source = K*` (a knowledge id — the G3 traceability slot), never a scenario id. **No schema change, no fixture change, no stamp-payload change**; the spec's conditional layer-tag (Key Entities) is not needed. BASE worlds have no excursion layer, so BASE materialisation is byte-identical (FR-004) by construction — the code path is unchanged when `world.scenario` is absent.

## Resolution order in `channelAt` (FR-001/002/003)

1. **Window + geometry filter** (unchanged): active iff `from_step ≤ t ≤ until_step` and the region contains the cell.
2. **Layer**: if any active candidate is excursion-layer, only excursion-layer candidates remain in contention.
3. **Within-layer tie order** (unchanged, note 02 §3): later `from_step` first, then the geometrically smaller (innermost) region.
4. No active candidate ⇒ the channel `default`.

The code comment cites `02-compile.md §6` — a stated rule, never an emergent one (FR-003).

## Blast radius — audited, not assumed (spec Assumptions; note §6)

Same-region coincidence: only `mobility.causeway` (K2 vs R3/R3m demolition). Geometric overlaps that *could* flip under the layer rule (R1 `threat.port_district` ⊃ `garrison` cells; R2/R3m `threat.halcyon_strait` ∩ `ledger_quay`/`mine_stock`; R2 `mobility.halcyon_strait` ∩ `causeway`): no fixture route leg or state read lands on a disagreeing cell — walked in the note. Tableau-visible change = C5 under R3/R3m only. The full test suite is the enforcement.

## Engine version & comparability (FR-005)

- New `src/engine.ts` exporting `ENGINE_VERSION = '0.2.0'` (single source; the scattered `'0.1.0'` literals in `src/app/state.ts`, `src/flow.ts`, `src/app/coaViz.ts` and the build scripts consume it).
- `RobustnessService.#stampsCompatible` extends its lineage key with `engine_version` — mixed-engine worlds grey the scenario strip exactly as mixed-knowledge worlds do.
- Tests: same inputs, different `engine_version` ⇒ different stamps; a mixed-engine tensor renders the incompatibility banner.

## Consequence management (US2/US3)

- **Scoring/relax machinery: no change** (spec Assumption 3). `sacrificed` ≡ the `violated` set, so C5 joins every R3m candidate's set; minimality and ranking (tier cost, id tie-break) are unchanged — {C4,C5}, {C3,C5}, {C2,C5}, must-sacrifice last, C3/C4 tie-break stated.
- **`src/relaxCandidates.ts` narratives** gain the causeway state in command language (US3 acceptance: the cards mention it; the sacrifice itself stays computed).
- **Batch propagation** (FR-007): vignette §6/§7 rows, walkthrough beat 4 + sequence diagram, flow-infographic spec + wireframes, gallery/flow captions, `narratives.ts` beat text, build-plan Stage-4 exit annotation, `CLAUDE.md` current-phase line, `status.yml` updates entry.
- **Regenerate** checked-in artifacts (`npm run gallery / flow / coa-viz / build:app / embeds`) — stamps and the R3m exhibit move.

## Testable seams (Node, vitest)

- `tests/materialise.test.ts` (extend): R3m causeway read returns the demolition band; BASE unchanged; excursion window edges (before/inside/after); within-layer tie order preserved (US1 acceptance 1–3, edge cases).
- `tests/relax.test.ts` / `tests/gate.test.ts` / `tests/flow.test.ts`: sets {C4,C5}/{C3,C5}/{C2,C5}; supersets still inclusion-dropped; ranking/tie-break unchanged (US2/US3, SC-002/003).
- Oracles O-1…O-4 and the G6 `fast-check` property re-run untouched (FR-008, SC-004).

## Out of scope

- A stored layer tag on `RegionOverride` (schema) — not needed; would re-open only if a third layer ever arrives.
- Any `/relax`, scorer, or tiers change — the corrected sets fall out of honest scoring.
- Re-ranking semantics for same-tier sacrifices — DEC-19's stated tie-break stands.
