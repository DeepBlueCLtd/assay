# Phase 1 — Data Model (SPEC-05)

The domain entities are **already generated** from LinkML (`src/generated/types.ts`, slice D2) and must not be hand-edited. This file maps the spec's entities to those types and defines the small set of **seam/service** types this slice adds (which are not stored objects and therefore not LinkML shapes).

## Existing LinkML types reused (source of truth — do not hand-edit)

| Entity | Type | Notes |
|---|---|---|
| KnowledgeObject | `KnowledgeObject` | `question, subject, encoding_class, answer?, provenance?, criticality, validity?, status, waiver?, expected_answers?, collection?` (+ `logical_id, version`). The central type (DEC-6, DEC-17). |
| Band | `Band` | `{lo, hi, unit}`, `lo ≤ hi`, **no midpoint** (DEC-15). |
| Provenance | `Provenance` | `{source_class, confidence, owner, single_source, collected_at?, note?}` (DEC-14, DEC-16). |
| Waiver | `Waiver` | inline slot `{granted_by, justification, granted_at}` — licenses `reported`/`assessed` to compile as `hard_constraint`. |
| ValidityWindow | `ValidityWindow` | `{valid_from, valid_until}` — scenario steps (DEC-17); drives K5→K9 staleness. |
| TraceEdge | `TraceEdge` | edge types include `supersedes | contests | resolves | waives` (DEC-21). |
| enums | `SourceClass, ConfidenceBand, EncodingClass, LifecycleStatus, Criticality` | frozen doctrine (DEC-14/16/6/17). |

## Lifecycle (DEC-17) — state transitions enforced by the service

```
open ──answer──▶ answered ──supersede──▶ superseded
                    │                        (prior version)
                    ├──(validity expires / superseded-by)──▶ stale
                    ├──contest──▶ contested ──resolve(survivor)──▶ resolved
                    └──withdraw/refuse──▶ retired
```

- **create**: `open` (unanswered) or `answered` (answer present). Refused writes never enter any state (K10 → nothing stored; the withdrawn attempt is `retired` only if a prior version existed).
- **supersede(new, old)**: `old` → `superseded`/`stale`; `new` is live. Cross-lineage allowed (K9 logical id ≠ K5).
- **contest(a, b)**: both → `contested`.
- **resolve(survivor)**: survivor leaves `contested` → `resolved`; a survivor not in the contest is refused.

## New seam/service types (not stored; defined in `src/seam.ts`)

```ts
// Reuses existing Ref from src/store.ts: { content_hash, logical_id?, version? }

type RefusalReason =
  | 'contested_knowledge' | 'stale_input' | 'waiver_required'
  | 'encoding_violation'  | 'stamp_mismatch' | 'unknown_ref';

interface Refusal {
  refused: true;
  reason: RefusalReason;
  offending: Ref[];        // exactly which objects triggered it
  explanation: string;     // one sentence, render-ready
}

type WriteResult = { ref: Ref; warnings?: LintWarning[] } | Refusal;

interface LintWarning {
  code: 'confidence_width_floor';
  offending: Ref;
  message: string;         // render-ready caution, not a refusal
}

interface Delta {
  seq: number;             // monotonic; ordering key
  actor: string;
  role: string;
  op: 'create' | 'supersede' | 'contest' | 'resolve';
  refs: Ref[];
  stamp?: string;
  at: string;              // ISO datetime — DISPLAY ONLY, never hashed (DEC-17)
}
```

## Validation rules (from Requirements, enforced by the service/firewall)

| Rule | Source | Where |
|---|---|---|
| `assumption` + `hard_constraint` → `encoding_violation` (waiver cannot rescue) | FR-001; km §9 | `encoding.ts` |
| `reported`/`assessed` + `hard_constraint` without `waiver` → `waiver_required` | FR-001; DEC-14 | `encoding.ts` |
| `scenario_weight` never compilable as constraint/cost | FR-003; km §9 | `encoding.ts` + `isCompilable` |
| refused write persists nothing (0 objects/edges/deltas) | FR-002; SC-001 | `knowledge.ts` (check before store) |
| supersede returns exactly the staled versions; cross-lineage ok | FR-006; DEC-21 | `knowledge.ts` |
| contest marks both `contested`; blocks compile until resolved | FR-007; G5 | `knowledge.ts` + `isCompilable` |
| resolve survivor must be in the contest, else refused | FR-008 | `knowledge.ts` |
| exposure returns complete chain; empty-but-complete when driving nothing | FR-009; G3 | `knowledge.ts` (TraceStore.forward) |
| exactly one delta per act; idempotent create publishes none | FR-010; DEC-5 | `deltas.ts` + `knowledge.ts` |
| no bare assessed scalar in any response or render | FR-011; G2 | service returns typed objects; surface uses band pill |
| Band has no midpoint; pill renders no point estimate | FR-012; DEC-15 | `bandPill.ts` (existing) |
| confidence width lint at warning level; `observed` exempt | FR-014; note 01 | `lint.ts` |
