# Implementation Plan: Knowledge service & encoding discipline (SPEC-05)

**Branch**: `claude/specs-review-3yxirx` (spec dir `005-knowledge-service`) | **Date**: 2026-07-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/005-knowledge-service/spec.md`

## Summary

Add the `/knowledge` seam service — create, supersede, contest, resolve, exposure — over the existing content-addressed store (SPEC-01, `src/store.ts`) and trace store (SPEC-02, `src/trace.ts`), enforcing the encoding-discipline firewall (knowledge model §9) at write time and returning first-class `Refusal` values rather than thrown errors. Every cross-surface act publishes exactly one delta. The confidence→band-width warning lint from research note `01-knowledge.md` runs on write. A framework-free minimal S1 knowledge table renders the Meridian K1–K14 fixtures through the band pill and provenance chip (already scaffolded), surfacing the refusal banner, waiver chip, single-source marking, and contested-pair blocking flag. Scope excludes the generator and scorer (SPEC-07/08).

## Technical Context

**Language/Version**: TypeScript (strict, ESM, `.js` import specifiers), targeting in-browser + Node ≥ 19 for tests (WebCrypto one code path — research note 00).

**Primary Dependencies**: none at runtime (offline, no server); dev: `vitest`, `tsx`, `tsc`, LinkML type-gen (`npm run gen`). Reuses `src/store.ts`, `src/trace.ts`, `src/canonical.ts`, `src/validate.ts`, `src/generated/types.ts`, `src/components/{bandPill,provenanceChip}.ts`.

**Storage**: in-memory content-addressed `ObjectStore` + `TraceStore` (existing). No persistence layer added; a new append-only in-memory `DeltaLog`.

**Testing**: `vitest` (`npm test`). Contract-invariant tests for the five acts written against the seam shapes and confirmed failing before implementation (constitution quality gate 2).

**Target Platform**: browser (offline SPA) and Node test runner; single code path.

**Project Type**: single project (in-browser demonstrator behind a service seam).

**Performance Goals**: not a Stage-1 concern — the knowledge set is 14 objects; determinism (G1) matters, throughput does not. (Channel-scale cost is a Stage-2 concern, seam open item 2.)

**Constraints**: offline-capable; LinkML is the source of truth (types generated, never hand-drifted); surfaces arrange projections only (no private derived state); banded honesty enforced at the seam and on the surface.

**Scale/Scope**: 14 knowledge objects, one minimal surface, five service acts, two new components (S1 table, refusal banner) plus reuse of two existing ones.

## Constitution Check

*GATE: evaluated before Phase 0 and re-checked after Phase 1 design.*

**Principle I — Seam Contract Is the Invariant.** PASS. The service implements seam §3 shapes exactly (create/supersede/contest/resolve/exposure); the S1 table only arranges projections of the store and the service's responses (FR-016), holds no private derived state, and computes nothing. Refusals are first-class returns, not HTTP errors (seam §1).

**Principle II — Banded Honesty (NON-NEGOTIABLE).** PASS and central. FR-011/012/013 forbid any bare assessed scalar in a response or on the surface; the band pill has no midpoint by construction; the provenance chip carries source class, confidence, owner, single-source, and "assessment, not fact" markings. This is the invariant the whole slice exists to make observable. **(G2)**

**Principle III — Traceability Terminates in Named Knowledge.** PASS. `supersedes`/`contests`/`resolves`/`waives` edges are written at the moment of the act by the service performing it (FR-006/007/008, FR-004); exposure returns a complete forward chain and an object driving nothing returns empty-but-complete, never a dead end (FR-009). Encoding discipline (the firewall) is enforced here as part of this principle. **(G3, G5)**

**Principle IV — Determinism and Content Addressing.** PASS. Objects are immutable and content-addressed via the existing store; revision is supersession-as-edge, never mutation (FR-006); byte-identical re-create is idempotent and publishes no delta (FR-010). No ambient entropy: the delta `seq` is a monotonic counter, and the display-only `at` timestamp never participates in content addressing (seam §10; DEC-17). **(G1)**

**Principle V — Research Before Implementation.** PASS. `docs/research/01-knowledge.md` exists and decides the confidence→band-width mapping this plan implements (FR-014).

**Principle VI — Register Supremacy.** PASS. Every FR cites the register DEC or invariant it restates; no new decision originates here. The confidence-lint calibration traces to research note 01, not to recollection.

**Invariant applicability at Stage 1**: G1 (determinism), G2 (no bare assessed scalars), G3 (complete chains), G5 (contested never compiles — Stage-1 half: mark + block; the compile refusal is SPEC-06). G4 (least-worst) and G6 (propagation honesty) are **not exercised** at this stage — no relaxation and no interval arithmetic here — and are asserted at SPEC-09 and SPEC-07/oracle cases respectively.

**Gate result**: PASS, no violations. Complexity Tracking table omitted (nothing to justify).

## Project Structure

### Documentation (this feature)

```text
specs/005-knowledge-service/
├── plan.md              # this file
├── spec.md              # feature spec
├── research.md          # Phase 0 — design decisions
├── data-model.md        # Phase 1 — entities & type mapping
├── quickstart.md        # Phase 1 — validation guide
├── contracts/
│   └── knowledge-service.md   # the five acts: request/response/refusal shapes
└── checklists/
    └── requirements.md  # spec quality checklist (from /speckit-specify)
```

### Source Code (repository root)

```text
src/
├── generated/types.ts        # LinkML → TS (existing; regenerated, never hand-edited)
├── canonical.ts              # canonical JSON + hashing (existing)
├── store.ts                  # ObjectStore: put/get/exists/versions (existing, SPEC-01)
├── trace.ts                  # TraceStore: add/forward/backward (existing, SPEC-02)
├── validate.ts               # validateInstance (existing)
├── seam.ts                   # NEW — shared seam types: Refusal, RefusalReason, Delta, WriteResult
├── deltas.ts                 # NEW — DeltaLog: append-only, publish(op,refs), since(seq)
├── encoding.ts               # NEW — encoding-discipline firewall (knowledge model §9), pure
├── lint.ts                   # NEW — confidence→band-width warning lint (research note 01)
├── knowledge.ts              # NEW — KnowledgeService: create/supersede/contest/resolve/exposure
└── components/
    ├── bandPill.ts           # existing (SPEC-14)
    ├── provenanceChip.ts     # existing (SPEC-14) — single-source + "assessment, not fact"
    ├── refusalBanner.ts      # NEW — renders a Refusal in place (ui-design §3.4.1)
    └── s1Table.ts            # NEW — minimal S1 knowledge table over fixtures

tests/
├── encoding.test.ts          # NEW — firewall table: K10 refused, waiver path, K14 firewall
├── knowledge.test.ts         # NEW — the five acts; G2/G3/G5/G1 contract-invariant tests
├── lint.test.ts              # NEW — confidence floors; observed exempt; degenerate band
└── s1Table.test.ts           # NEW — no bare scalars; banner/chip/blocking-flag render
```

**Structure Decision**: Single project, extending the existing `src/` flat layout. The knowledge service is one class (`KnowledgeService`) composing the existing `ObjectStore` and `TraceStore` plus a new `DeltaLog`; the firewall and lint are pure functions it calls on write, so they are independently testable (and reusable by the SPEC-06 compile defence-in-depth). Components stay framework-free HTML-string builders depending only on generated types, matching `bandPill.ts`/`provenanceChip.ts` and preserving the SPEC-14 extractability constraint.

## Approach (how the pieces fit)

- **Refusal as a value, not an exception.** `seam.ts` defines `Refusal = { refused: true, reason, offending: Ref[], explanation }` with `RefusalReason` the seam §1 union; write acts return `WriteResult = { ref: Ref } | Refusal`. Callers discriminate on `refused`. Nothing is persisted on a refusal (FR-002) — the service computes the refusal *before* touching the store.
- **Firewall at write (`encoding.ts`).** A pure `checkEncoding(ko): Refusal | null` implements knowledge model §9: `assumption` claiming `hard_constraint` → `encoding_violation` (even with a waiver); `reported`/`assessed` claiming `hard_constraint` without `waiver` → `waiver_required`; `scenario_weight` may never be a constraint/cost. `create` and `supersede` call it first.
- **Deltas.** `DeltaLog.publish(op, refs, stamp?)` appends one `Delta` with a monotonic `seq`; `create/supersede/contest/resolve` each publish exactly once; a byte-identical `create` (store reports the hash already exists) publishes none (FR-010). `at` is display-only, outside content addressing.
- **Lint.** `lint.ts` `confidenceLint(ko): LintWarning[]` computes `r = (hi−lo)/max(|lo|,|hi|)` and compares to the floor for `ko.provenance.confidence`; `observed` and absent-answer objects are exempt; returns warnings (never a refusal). The service attaches warnings to a successful result; the S1 table renders them as an inline caution.
- **Exposure & contested-block.** `exposure(id)` is `TraceStore.forward` over the object's live hash, returning a complete chain (empty-but-complete when it drives nothing). Contested-blocking is a status predicate the service exposes (`isCompilable(ref)` → false while `contested`) that SPEC-06's compile will consult; the S1 table reads the same predicate for the blocking flag.
- **Surface.** `s1Table.ts` maps each `KnowledgeObject` to a row: question, `bandPill(answer)` (or unbanded for `observed`), `provenanceChip(provenance)`, lifecycle status, and — where applicable — the waiver chip, single-source marking, contested blocking flag, and (for a refused create attempt) the `refusalBanner`. It calls no service and holds no state; the harness/demo passes it projections.

## Complexity Tracking

No constitution violations to justify — table omitted.
