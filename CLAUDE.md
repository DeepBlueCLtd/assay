# CLAUDE.md — ASSAY working context

ASSAY is a docs-first demonstrator: JIPOE-derived knowledge, typed and banded, exploited by planning machinery honestly. Read `README.md` for the map; read `docs/assay-vignette.md` → `docs/assay-walkthrough.md` before touching anything.

## Where next steps live — check before starting work

1. **GitHub issues on this repo are the live queue.** Every planned next step, with its trigger condition ("after PR #N merges", "after Stage-1 exit"), is an open issue. List open issues before picking up work; close issues as part of finishing, not after.
2. **Plan-level intent** lives in the canonical docs and is authoritative over any issue: `docs/assay-delivery-plan.md` (slices, dependencies, waves), `docs/assay-build-plan.md` (stage exits, demo moments), `docs/assay-concept.md` §6 (register candidates awaiting ratification), `docs/assay-findings.md` §4 (ledger open items).
3. **Session-bound watchers do not survive sessions.** PR subscriptions and scheduled check-ins belong to the session that created them; if you are a new session picking up mid-stream, re-check open PR state yourself.

## Non-negotiables (from the register — do not re-derive these)

- **Register-first (ASSAY-DEC-2):** decisions originate in `docs/assay-register.md`, nowhere else. If your work implies a new decision, record a *candidate* in `docs/assay-concept.md` §6 and flag it — never assert it in a peer document.
- **Research-first (ASSAY-DEC-11):** a stage's implementation does not start until its research note exists in `docs/research/`. No exceptions; a missing note is the gate, not a formality.
- **Banded honesty (constitution II, seam G2):** no scalar from an assessed source appears unbanded anywhere — responses, stored objects, surfaces, logs. Code review rejects violations.
- **Identifiers are frozen** (`K*`, `C*`, `R*`, `FE-*`, `P*`, `O-*` — vignette §8/§9). The wireframes and gallery must render vignette identifiers only; drift is a defect.
- **Process from Stage 1 onward:** build slices run through spec-kit (`/speckit.specify` → plan → tasks per SPEC-##, seeded from the build plan's stage exits) — decided 2026-07-12. Stage 0 predates this and is not backfilled.
- **Batch propagation:** a change to one canonical doc sweeps its peers (including `assay-ui-wireframes.html` and this file's "current phase" line) in the same change.

## Commands

```
npm install          # once
npm run gen          # LinkML schema → src/generated/types.ts (never edit generated files)
npm run typecheck    # tsc --noEmit
npm test             # vitest — includes fixture validation and coverage-row protection
npm run gallery      # regenerates docs/assets/gallery/index.html from fixtures
npm run bench        # canonicalise+hash at dense-world scale (research note 00 §3)
```

The oracle cases (vignette §9, `O-1…O-4`) are hand-computed and must never be regenerated from implementation output.

## Current phase (update this line when it changes)

Stage 0 complete; PR #8 merged to `main`. Register batch 3 ratified (ASSAY-DEC-22…27, closing concept §6.6–6.11) — walkthrough and findings ledger now canonical, G6 a standing invariant. Stage 1 built (issue #10): research note `01-knowledge.md` (DEC-16 floor); SPEC-05 implemented (`src/{seam,deltas,encoding,lint,knowledge}.ts` + `components/{refusalBanner,s1Table}.ts`); all four Stage-1 exits demonstrated on Meridian. Stage 2 built: research note `docs/research/02-compile.md` (DEC-11 gate — decides the **sparse channel representation** from the Stage-0 dense-world numbers + ATP 2-01.3 MCOO doctrine, retiring dense `Channel.cells`); SPEC-06 specified via spec-kit (`specs/006-compile/`) and **implemented** (`src/compile.ts` + `components/channelTrace.ts`; `fixtures/vignette-config.json`; sparse-channel schema regen; 107 tests, typecheck clean; compile demo moment renders in the gallery). All three Stage-2 exits demonstrated on Meridian (K12 contested ⇒ compile refuses `contested_knowledge`, resolve⇒recompile; byte-identical stamp; every channel traces back to named knowledge via `compiled_into` + `source`). The sparse-channel schema change is recorded as a flagged register candidate (concept §6, item 12), built under seam open item 2's delegated authority pending batch ratification. **Next: Stage 3 — SPEC-07 score, then SPEC-08 plan** (research note `03-score-plan.md` first, DEC-11 — must define the four-stop verdict mapping and reproduce vignette §9 oracle cases O-1…O-4 / G6).
