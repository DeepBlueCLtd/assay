# Phase 0 — Research & Design Decisions (SPEC-05)

The doctrinal/confidence research is done in `docs/research/01-knowledge.md` (the DEC-11 gate). This file records the **implementation** decisions the plan rests on; there are no open `NEEDS CLARIFICATION` items — the scope is fixed by the build plan and delivery plan §2.2.

## D1 — Refusal as a return value, not a thrown exception

- **Decision**: Write acts return `WriteResult = { ref: Ref } | Refusal`; callers discriminate on the `refused` field. A `Refusal` is `{ refused: true, reason, offending: Ref[], explanation }`.
- **Rationale**: Seam §1 mandates refusals are honest outcomes, first-class in demos, "not an HTTP-shaped error and not a degraded result". A thrown error would be caught-and-logged or crash a surface; a returned value is rendered (the refusal banner) exactly where the save was attempted (FR-002, SC-001).
- **Alternatives**: throw a typed error (rejected — invites `try/catch` swallowing and a degraded save); return `null` + out-of-band reason (rejected — loses the offending refs and explanation the banner needs).

## D2 — Waiver is an inline slot on KnowledgeObject, not a separate stored object

- **Decision**: Use the generated `KnowledgeObject.waiver?: Waiver` slot ({granted_by, justification, granted_at}); the waiver is recorded inline and retrievable at create. The `waives` trace edge belongs to compile time (seam §4) — the edge is written when the constraint is actually built — so knowledge-create fabricates no self-referential edge.
- **Rationale**: The schema (D2, already generated) models the waiver inline; K8 in the vignette carries "under J-3 waiver W-1" as part of the object. No new stored type is needed. The trace edge still records the licence for G3 traceability.
- **Alternatives**: a standalone `Waiver` object referenced by hash (rejected — the schema didn't model it that way; would drift types from LinkML, violating the source-of-truth rule).

## D3 — Encoding firewall as a pure function

- **Decision**: `checkEncoding(ko): Refusal | null` in `src/encoding.ts`, called first by `create`/`supersede`. Implements knowledge model §9 exactly: `assumption`+`hard_constraint` → `encoding_violation` (waiver cannot rescue it); `reported`/`assessed`+`hard_constraint` without `waiver` → `waiver_required`; `scenario_weight` may never carry a constraint/cost encoding.
- **Rationale**: Purity makes the firewall independently testable (`tests/encoding.test.ts`) and reusable by SPEC-06's compile as defence-in-depth (seam §4 — "anything the knowledge service let through in an earlier engine version"). Separating policy from the service keeps `knowledge.ts` a thin orchestration.
- **Alternatives**: inline the checks in each act (rejected — duplicates policy, harder to reuse at compile).

## D4 — Confidence lint at warning level, computed midpoint-free

- **Decision**: `confidenceLint(ko): LintWarning[]` computes `r = (hi − lo) / max(|lo|, |hi|)` and compares to the per-level floor (low 0.25 / moderate 0.10 / high 0) from research note 01; `observed` and answer-absent objects are exempt; output is warnings, never a refusal.
- **Rationale**: `r` needs **no midpoint** (DEC-15 — the component and the schema forbid a stored/representative centre; a transient `max(|lo|,|hi|)` denominator avoids computing a centre at all). Warning-not-refusal is deliberate: the calibration is provisional pending SME Checkpoint 1 (DEC-27), and hard-refusing author-stated bands before that evidence is too aggressive (research note 01, "what we will do differently" §2).
- **Alternatives**: refuse below the floor (rejected — premature; would block honest wide-then-narrowed authoring); relative width as `(hi−lo)/midpoint` (rejected — reintroduces a midpoint, a banded-honesty error by construction).

## D5 — Deltas via an append-only in-memory log with a monotonic seq

- **Decision**: `DeltaLog.publish(op, refs, stamp?)` appends one `Delta { seq, actor, role, op, refs, stamp?, at }`; `since(seq)` serves the feed. Each of create/supersede/contest/resolve publishes exactly one; a byte-identical create publishes none.
- **Rationale**: Seam §10 / DEC-5 — every cross-surface write is exactly one stamped delta, ordered by `seq`; `at` is display-only and never hashed (DEC-17, preserving G1). Idempotent create publishing nothing follows from the store reporting the hash already present.
- **Alternatives**: derive the feed from trace edges (rejected — not every delta is an edge; conflates two concerns).

## D6 — S1 table and refusal banner as framework-free HTML builders

- **Decision**: `s1Table.ts` and `refusalBanner.ts` are HTML-string builders depending only on generated types and the existing `bandPill`/`provenanceChip`, matching the established component style; they call no service and hold no state.
- **Rationale**: Constitution I / DEC-5 (surfaces arrange projections only) and the SPEC-14 extractability constraint (components depend only on generated LinkML types). The existing `bandPill.ts` sets the pattern (framework-free, self-contained styling, types-only import).
- **Alternatives**: a stateful component pulling from the service (rejected — private derived state on a surface violates constitution I).

## D7 — Contested-blocking exposed as a predicate, consumed by both surface and (later) compile

- **Decision**: The service exposes `isCompilable(ref): boolean` (false while any live version of the lineage is `contested`); the S1 table reads it for the blocking flag now, and SPEC-06's compile will read it for the `contested_knowledge` refusal.
- **Rationale**: Keeps the "contested never compiles" truth (G5) in one place; the Stage-1 exit is *mark + block-flag*, Stage-2 completes it at the compile refusal. One predicate, two consumers, no duplicated status logic.
- **Alternatives**: recompute contested status on each surface (rejected — duplicates the invariant, invites drift).

**Output**: all decisions resolved; no NEEDS CLARIFICATION remain. Proceed to Phase 1.
