# Contract — Knowledge service (SPEC-05)

The seam §3 knowledge acts, expressed as typed async functions on `KnowledgeService`
(the mock runs synchronously in-browser; signatures are async so a real transport can
replace them without client change — DEC-4, seam §1). Every act either returns its
success shape or a first-class `Refusal` (never throws for a domain refusal). Shapes
reference `src/generated/types.ts` and the seam types in `data-model.md`.

## `create(ko: KnowledgeObject, actor): WriteResult`
Seam: `POST /knowledge`.
- **Pre**: `ko` validates against the generated `KnowledgeObject` shape (`validateInstance`).
- **Refuses**: `encoding_violation` (assumption/any claiming `hard_constraint` unlicensed; `scenario_weight` claiming constraint/cost); `waiver_required` (reported/assessed claiming `hard_constraint`, no `waiver`).
- **On success**: stores the object (content-addressed), writes a `waives` edge if a waiver licensed a `hard_constraint`, publishes exactly one `create` delta, and attaches any `confidence_width_floor` warnings. A byte-identical re-create returns the same ref and publishes **no** delta.
- **Invariants**: FR-001/002/003/004/010/014; G2 (no bare scalar leaves the seam); a refused create persists nothing.

## `supersede(next: KnowledgeObject, priorId: LogicalId, actor): { ref, stale: Ref[] } | Refusal`
Seam: `POST /knowledge/{id}/supersede`.
- **Behaviour**: stores `next`, writes a `supersedes` edge `next → prior`, moves the prior version to `superseded`/`stale`, returns `stale` = **exactly** the versions the edge staled. Cross-lineage allowed (`next.logical_id ≠ priorId`).
- **Refuses**: `unknown_ref` if `priorId` has no live version; `encoding_violation`/`waiver_required` as in `create` (the firewall runs on `next`).
- **Publishes**: one `supersede` delta.
- **Invariants**: FR-005/006/010; DEC-21; K9→K5.

## `contest(aId, bId, actor): { refs: [Ref, Ref] } | Refusal`
Seam: `POST /knowledge/{id}/contest`.
- **Behaviour**: marks both live versions `contested`, writes a `contests` edge between them; thereafter `isCompilable` is false for both lineages.
- **Refuses**: `unknown_ref` if either id has no live version.
- **Publishes**: one `contest` delta.
- **Invariants**: FR-007; G5 (Stage-1 half: mark + block); K12a/K12b.

## `resolve(survivor: Ref, note, actor): { ref } | Refusal`
Seam: `POST /knowledge/{id}/resolve`.
- **Behaviour**: writes a `resolves` edge, moves `survivor` out of `contested` → `resolved`; the losing version stays superseded/retired per the note.
- **Refuses**: `unknown_ref`, or a domain refusal if `survivor` was not part of an open contest (a resolution must name a contested version).
- **Publishes**: one `resolve` delta.
- **Invariants**: FR-008.

## `exposure(id: LogicalId): { chains: TraceChain[] }`
Seam: `GET /knowledge/{id}/exposure`.
- **Behaviour**: forward trace walk from the object's live hash — what does this knowledge drive? An object driving nothing returns an **empty-but-complete** chain (`complete: true`, no nodes beyond the root), never a dead-end error.
- **Invariants**: FR-009; G3.

## `isCompilable(id: LogicalId): boolean` (predicate, not a seam write)
- **Behaviour**: false while any live version of the lineage is `contested`; consumed by the S1 blocking flag now and the SPEC-06 compile refusal later. One source of truth for G5.

## Contract-invariant tests (write first, confirm failing — constitution gate 2)

`tests/knowledge.test.ts` and `tests/encoding.test.ts` assert, before implementation:
1. K10 (assessed, `hard_constraint`, no waiver) → `create` refuses `encoding_violation`, offending = K10, store unchanged, delta log unchanged. **(SC-001)**
2. K8 with waiver W-1 → accepted; without waiver → `waiver_required`. **(SC-005)**
3. K14a (`scenario_weight`) → any constraint/cost encoding refused; storable as weight. **(FR-003)**
4. supersede(K9, K5) → `stale == [K5]` exactly; cross-lineage edge present; one delta. **(SC-003)**
5. contest(K12a, K12b) → both `contested`; `isCompilable` false for both; one delta. **(SC-004)**
6. resolve(survivor not in contest) → refused. **(FR-008)**
7. exposure(K11, unanswered) → empty-but-complete chain, not an error. **(FR-009/G3)**
8. every act publishes exactly one delta; byte-identical create publishes none. **(SC-006)**
9. no service response carries a bare assessed scalar (all assessed values are `Band`). **(SC-002/G2)**
