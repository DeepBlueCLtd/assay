# ASSAY — Seam Contract

**Founding doc 3** · REST shapes and semantics
Status: draft for review · v0.1 · 2026-07-11
Authority: ASSAY-DEC-4 (mock behind seam; scorer honestly real), DEC-5 (store, services, trace graph, stamped deltas), DEC-10 (scorer independently callable), DEC-13 (invariants live here in §G while `assay-architecture.md` is deferred), DEC-15/17/19/21 via the shapes they constrain.
Companions: `assay-knowledge-model.md` (every payload shape named here is defined there), `assay-vignette.md` (the fixture instances), `assay-ui-design.md` §3 (which surface calls what).

The seam is the durable asset (DEC-4). The v1 implementation is an in-browser mock; it is exempt from resembling any future real service internally and exempt from nothing else — shapes, error model, refusal paths, and invariants bind the mock exactly as they would bind a server. Every service response carries `{engine_version, stamp}`; every write lands a delta; every computation writes its own trace edges.

All object payloads are canonical-JSON instances of the LinkML classes (knowledge model §11); this document defines *movement*, not shape.

---

## 1. Conventions

- **Addressing.** Objects are addressed by `content_hash`; lineages by `logical_id`. `Ref = {logical_id, content_hash}` — requests pass whichever is natural, responses always return both.
- **Stamps (G1).** A `stamp` is the hash over `{consumed refs, config, engine_version, seed?}` of a computation. Identical stamp + engine version ⇒ byte-identical result. All randomness flows from explicit `seed` parameters — there is no ambient entropy behind the seam.
- **Refusal model.** A service that declines to compute returns a `Refusal`, not an HTTP-shaped error and not a degraded result:

  ```ts
  Refusal = {
    refused: true,
    reason: 'contested_knowledge' | 'stale_input' | 'waiver_required'
          | 'encoding_violation' | 'stamp_mismatch' | 'unknown_ref',
    offending: Ref[],          // exactly which objects triggered it
    explanation: string        // one sentence, render-ready
  }
  ```

  Refusals are honest outcomes, first-class in demos (K10's refusal *is* a Stage-1 exit criterion). Infeasibility is **not** a refusal — an unsatisfiable commitment set returns a `RelaxationReport` with `sacrificed` populated (G4).
- **Scenario clock.** Every time parameter is a `Timestep` (D-day origin). Wall clock exists only in delta envelopes (§10).
- **Determinism note for the mock.** The mock runs synchronously in-browser; "endpoints" are typed async functions with these exact request/response shapes, so a real transport can replace them without client change (DEC-4).

## 2. Store

```
PUT  /objects                      {object}                → {ref: Ref}            // hash computed here
GET  /objects/{hash}                                       → {object}
GET  /objects/exists/{hash}                                → {exists: boolean}
GET  /objects/{logical_id}/versions                        → {versions: Ref[]}     // lineage, oldest first
```

`PUT` of byte-identical content is idempotent and returns the same hash. There is no update and no delete (knowledge model §2).

## 3. Knowledge service

```
GET  /knowledge?status=open|answered|stale|contested|…     → {objects: KnowledgeObject[]}
POST /knowledge                    {object}                → {ref} | Refusal        // encoding discipline enforced here
POST /knowledge/{id}/supersede     {object}                → {ref, stale: Ref[]}    // writes supersedes edge; returns what it staled
POST /knowledge/{id}/contest       {object}                → {refs: Ref[2]}         // writes contests edge; both → contested
POST /knowledge/{id}/resolve       {surviving: Ref, note}  → {ref}                  // writes resolves edge
GET  /knowledge/{id}/exposure                              → {chains: TraceChain[]} // forward walk: what does this drive?
```

Create/supersede enforce the encoding-discipline table (knowledge model §9) at write time: an `assumption` claiming `hard_constraint` is refused `encoding_violation`; `reported`/`assessed` claiming `hard_constraint` without a `waiver` is refused `waiver_required`. Supersession may cross lineages (K9 supersedes K5); the response's `stale` list is exactly the versions the edge staled.

## 4. Compile

```
POST /compile   {knowledge: Ref[] | selector, scenario?: Ref, config: VignetteConfigRef, engine_version}
                → {world: Ref, stamp, compiled_from: Ref[]} | Refusal
```

Deterministic: same knowledge set + config + engine version ⇒ byte-identical stamp (Stage-2 exit). Refuses on `contested_knowledge` (G5), `stale_input`, `waiver_required`/`encoding_violation` (anything the knowledge service let through in an earlier engine version — defence in depth). Writes one `compiled_into` edge per consumed object, and `waives` edges where a waiver licensed a constraint. `scenario` present ⇒ the COA's `excursion` overrides are applied and recorded in the stamp's config.

## 5. Score (DEC-10 — the unit everything else orbits)

```
POST /score     {plan: Ref, world: Ref, scenario: Ref,
                 knowledge_overrides?: {ref: Ref, answer: Band}[]}   // the perturbation hook
                → {verdicts: CommitmentVerdict[], scores: PlanScore[], stamp}
```

Independently callable, scenario-blind (the world already carries the excursion), and honestly real even in the mock (DEC-4 invariant). `knowledge_overrides` substitutes answers *for this call only* — nothing is stored, no edges written except on the returned artefacts' own stamp lineage; it exists so sensitivity (§8) is a re-scoring loop, not a fork. Scoring propagates bands (DEC-15); verdicts come back on the four-stop scale with `margin` bands. Mixed stamps between `plan`'s assumptions and `world` refuse `stamp_mismatch` (comparability guard).

## 6. Plan / handful

```
POST /plan/handful   {world: Ref, seed: integer, count?: 3..5}
                     → {plans: Ref[], scores: PlanScore[], organisation: {distinct_because: string[]}, stamp}
```

Generates (strategy-biased fan-out, seeded), scores via §5, organises by banded non-domination into 3–5 genuinely distinct plans. Same stamp + seed ⇒ identical handful (Stage-3 exit). The generator is sacrificial scope (delivery plan §3): a canned handful satisfying this contract keeps every downstream consumer honest.

## 7. Relax (G4)

```
POST /relax     {world: Ref, commitments: Ref[], seed}
                → {report: RelaxationReport, stamp}
```

Called when the commitment set is unsatisfiable (or to ask "what would we give up if it were?"). Sacrifices from `prefer` up through `must`, minimally; every candidate names `sacrificed` (non-empty) with its narrative in command language; same-tier tie-breaks are stated in `tie_break` (DEC-19). Never returns an empty candidate list; never silently drops a constraint.

## 8. Analysis (thin orchestrations — scorer in a loop + trace walks, DEC-10)

```
POST /analyse/sensitivity      {plan: Ref, world: Ref, scenario: Ref}
     → {ranking: {knowledge: Ref, effect: Band, single_source: boolean}[], stamp}
POST /analyse/discrimination   {questions?: Ref[], coas: Ref[]}
     → {ranking: {question: Ref, separation: Band, cost: Band, pairs: [Ref, Ref][]}[], stamp}
POST /analyse/staleness        {changed: Ref}
     → {invalidated: {verdicts: Ref[], scores: Ref[], worlds: Ref[]}, chains: TraceChain[], stamp}
```

- **Sensitivity**: re-scores at each answer's band edges via `knowledge_overrides`; ranks by verdict/score movement; carries the `single_source` flag through (thesis E — K8 tops this ranking in Meridian).
- **Discrimination**: ranks open questions by separation of their `expected_answers` bands across the live COA set (DEC-18), reporting collection `cost` alongside — value and cost are shown, never collapsed into one number (K11 beats K13 on separation despite higher cost).
- **Staleness**: transitive forward trace walk from the changed/superseded object; returns exactly the dependent artefacts and nothing else (thesis F — K9's arrival flags exactly the K5-dependent verdicts). Nothing recomputes automatically: flags, then humans decide (constitution, writes-are-events).

## 9. Trace

```
GET /trace/backward/{hash}     → {chains: TraceChain[]}   // artefact → … → named KnowledgeObjects
GET /trace/forward/{hash}      → {chains: TraceChain[]}   // knowledge → … → artefacts/rationale

TraceChain = {nodes: Ref[], edges: TraceEdge[], complete: boolean}
```

`complete: false` (a dead end) is a defect surfaced, never hidden (G3): the trace drawer renders it as an error state. Backward chains terminate in KnowledgeObjects with named owners or they are not complete.

## 10. Deltas

```
GET /deltas?since=seq          → {deltas: Delta[]}

Delta = {seq: integer, actor: string, role: string, op: string,
         refs: Ref[], stamp?: string, at: iso-datetime}   // 'at' is display-only envelope,
                                                          // outside content addressing (DEC-17)
```

Every cross-surface write publishes exactly one delta (DEC-5). The feed is ordered by `seq`; `at` never participates in any computation or hash. S4 is a rendering of this endpoint.

## §G Invariants (normative; projected into the constitution)

| ID | Invariant |
|---|---|
| **G1** | **Determinism.** Identical stamp and engine version yield byte-identical results; all randomness flows from explicit seeds; stored objects are immutable and content-addressed. |
| **G2** | **No bare assessed scalars at the seam.** Every value derived from a `reported`/`assessed`/`assumption` source crosses the seam as a `Band` with provenance attached; verdicts cross only as the four-stop scale. A response containing an unbanded assessed scalar is a contract violation regardless of what any surface does with it. |
| **G3** | **Complete trace chains.** Every computed artefact is backward-traceable, transitively, to named KnowledgeObjects with named owners; edges are written at compute time by the computing service; a dead-end chain surfaces as a visible error. |
| **G4** | **Least-worst, never silence.** An infeasible commitment set returns a RelaxationReport whose candidates each name their `sacrificed` commitments — never an empty set, never a silent constraint drop, tie-breaks stated. |
| **G5** | **Contested never compiles.** Knowledge with `status = contested` reaches no CompiledWorld by any path; the compile refuses with `contested_knowledge` naming the pair. |

These five are standing acceptance criteria for every feature (constitution, Additional Constraints) and the spine-complete gate asserts them end-to-end on Meridian (SPEC-15).

## Open items (register candidates)

1. Whether `/plan/handful` should accept an explicit commitment set (making it relax-aware) or stay pure and let S2 call `/relax` separately — currently the latter.
2. Pagination/streaming for `/deltas` and channel payload size in `CompiledWorld` responses — mock-irrelevant, real-service-relevant; decide when a real service is scoped.
3. Whether `knowledge_overrides` should be permitted on `/plan/handful` (whole-handful sensitivity) or stay scorer-only — currently scorer-only.
