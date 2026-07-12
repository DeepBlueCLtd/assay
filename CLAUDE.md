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

Stage 0 complete; PR #8 merged to `main`. Register batch 3 ratified (ASSAY-DEC-22…27, closing concept §6.6–6.11) on branch `claude/specs-review-3yxirx` — walkthrough and findings ledger now canonical, G6 a standing invariant. Stage 1 built (issue #10): research note `docs/research/01-knowledge.md` (DEC-11 gate — decides the DEC-16 confidence→band-width floor); SPEC-05 specified via spec-kit and **implemented** (`src/{seam,deltas,encoding,lint,knowledge}.ts` + `components/{refusalBanner,s1Table}.ts`; 89 tests, typecheck clean; demo moment renders in the gallery). All four Stage-1 exits demonstrated on Meridian (K10 refused `encoding_violation`; K8 waiver visible; K9 stales K5; K12 pair blocks compile). Build refinements: lifecycle status is edge-derived (`effectiveStatus`, DEC-21), the `waives` edge is compile-time (seam §4), and the K10 fixture/vignette was corrected `assessed`→`assumption` to conform to the §9 firewall. **Next: Stage 2 — SPEC-06 compile** (research note `02-compile.md` first, DEC-11).
