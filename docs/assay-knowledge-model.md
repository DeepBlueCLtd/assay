# ASSAY — Knowledge Model

**Founding doc 2** · LinkML schema + commentary
Status: draft for review · v0.2 · 2026-07-12 · DEC-16 confidence → band-width mapping decided in research note `01-knowledge.md` (relative-width floor; §3 Provenance)
Authority: ASSAY-DEC-3 (independent schema), DEC-6 (knowledge object as central type), DEC-9/15 (banded honesty; pure intervals), DEC-14 (fact/assessment split), DEC-16 (ICD 203 confidence enum), DEC-17 (embedded question; lifecycle; scenario clock), DEC-18 (expected-answer-per-COA), DEC-19 (commitment tiers), DEC-20 (plan shape), DEC-21 (two-tier identity).
Companions: `assay-seam-contract.md` (how these shapes move), `assay-vignette.md` (the Meridian instances K1–K14, C1–C6, R1–R3).

This document is the source of truth for every data shape in ASSAY. TypeScript types are generated from the LinkML schema in §11 (SPEC-03), never hand-drifted. Commentary sections are normative where they state invariants and refusal behaviour; the schema and the commentary are maintained together — a change to one without the other is a defect.

---

## 1. Principles, restated as schema decisions

1. **Assessment is never a scalar.** Any value whose provenance is `reported`, `assessed`, or `assumption` is carried as a `Band` — a closed interval `{lo, hi, unit}` with no stored midpoint and no distributional claim (DEC-15). Only `observed` values (fact, narrowly defined: charted, surveyed, own-force — never inferred) and commander's directive thresholds (fact-of-intent) may be scalar (DEC-14).
2. **The question is the object.** A KnowledgeObject exists from the moment a JIPOE question is posed, before any answer exists (DEC-17). Collection queues, discrimination rankings, and exposure views are lifecycle views of one type, not joins across several.
3. **Relationships are edges, not fields.** Supersession, contestation, resolution, waiver-of, compiled-into: all are TraceEdges written at the moment the relationship is created (DEC-21, constitution III). Classes carry no `supersedes`/`superseded_by` slots — the graph is the single home of history.
4. **Time is scenario time.** All windows, forecasts, routes, and task times are expressed in scenario-clock timesteps (D-day origin). Wall-clock time appears only in the delta feed envelope, which is not content-addressed and feeds no computation (DEC-17; seam G1).
5. **Everything stored is immutable and content-addressed.** Two-tier identity: a stable `logical_id` (`K9`, `C2`, `R1`, `P3`) names the thing; a content hash names each version of it (DEC-21, §2).

## 2. Identity, versioning, canonical form

Every stored object carries:

- `logical_id` — short, stable, human-assigned (`K1`…, `C1`…, `R1`…, `P`n, `W`n). Never reused, never changed across versions.
- `version` — integer, 1-origin, incremented on supersession within a lineage.
- `content_hash` — SHA-256 over the object's **canonical JSON**, computed at `PUT`, and the object's address in the store. Not a field of the hashed payload.

Canonical JSON (normative for SPEC-01; pitfalls are Stage-0 research): UTF-8; object keys sorted lexicographically; no insignificant whitespace; numbers serialised in shortest round-trip decimal form; no `NaN`/`Infinity`; optional absent slots omitted entirely (never `null`).

Revision is supersession: a new object version is `PUT`, and a `supersedes` TraceEdge is written from the new version's hash to the old. Cross-lineage supersession is legal and meaningful — in Meridian, `K9` (a fresh forecast) supersedes `K5` (the expiring one) — the edge carries the relationship whether or not logical ids match. Mutation does not exist; deletion does not exist (retirement is a lifecycle status).

## 3. Primitives

### Band (DEC-15)

`{lo: float, hi: float, unit: string}` — a closed interval, `lo ≤ hi`. **No midpoint slot exists and none may be added**; any code needing a representative point is making a banded-honesty error by construction. Scoring propagates intervals (worst-and-best case within band); dominance, verdicts, and rankings are computed in banded space only. A degenerate band (`lo == hi`) is legal and is how an `observed` value is carried when it flows through banded machinery.

### Provenance (DEC-14, DEC-16)

`{source_class, confidence, owner, single_source, collected_at, note}`.

- `source_class`: `observed | reported | assessed | assumption`. `observed` is fact — directly charted, surveyed, or own-force, never inferred — and is the only class that may render unbanded. Everything else is banded and carries the "assessment, not fact" marking on every surface (constitution II).
- `confidence`: `low | moderate | high` — ICD 203's confidence levels, fixed now. The confidence → band-width mapping DEC-16 deferred is **decided in research note `01-knowledge.md`**: a minimum relative width per level (`low ≥ 0.25, moderate ≥ 0.10, high ≥ 0`, with `r = (hi−lo)/max(|lo|,|hi|)` — no midpoint, DEC-15-safe), enforced at `POST /knowledge` as a warning-level lint (`observed` exempt). It enters the schema as an `annotations:` note on `ConfidenceBand` — a metadata annotation, not a shape change — under SPEC-05.
- `single_source: boolean` — set when corroboration is absent; drives the deception flag in sensitivity ranking (thesis E). Mandatory rendering wherever the value renders.
- `owner` — the accountable analyst/staff cell. Trace chains terminate in named owners (constitution III).
- `collected_at` — scenario timestep of collection/observation.

### Scenario clock

`timestep: integer ≥ 0`, D-day origin. The vignette fixes the calibration (Meridian: 6-hour steps, horizon D+14 = 56 steps). `ValidityWindow {valid_from, valid_until}` is compared against the *world's* scenario clock at compile/score time — never against wall clock (DEC-17).

## 4. KnowledgeObject (DEC-6, DEC-17, DEC-18)

The central type: one quantified JIPOE Q&A, whole-life.

| Slot | Type | Notes |
|---|---|---|
| `question` | string, required | The JIPOE question, doctrinally shaped ("What is the load capacity of the Ledger causeway?") |
| `subject` | string, required | What the answer informs — a compile channel or topic key (`mobility.causeway`, `threat.battery`, `scenario.likelihood`) |
| `encoding_class` | enum, required | `hard_constraint | banded_soft_cost | scenario_weight` — how the answer is *allowed* to enter the compile (§9) |
| `answer` | Band, optional | Absent while `status = open`. Banded always; degenerate band for `observed` |
| `provenance` | Provenance | Required once `answer` present |
| `criticality` | `routine | important | critical` | J-2's judgement of how much rides on the question |
| `validity` | ValidityWindow, optional | Perishable answers (forecasts) carry one; expiry against scenario clock ⇒ `stale` |
| `status` | LifecycleStatus | `open → answered → (superseded | stale | contested) → resolved | retired` (DEC-17) |
| `waiver` | Waiver, optional | Required for an assessed/reported source claiming `hard_constraint` (§9); `{granted_by, justification, granted_at}` |
| `expected_answers` | ExpectedAnswer[], optional | The miniature event matrix (DEC-18): per ScenarioCOA, the band the answer is expected to fall in if that COA is the truth. Meaningful for `open` questions; retained after answering for audit. Each row carries its own `provenance` (optional in schema, warning-linted when absent) — an expectation is an assessment, owed a chip like every other (research note `08-analysis.md` §7.3; SPEC-23; register candidate concept §6.25) |
| `collection` | CollectionOption[], optional | For open questions: `{method, cost: Band, earliest_result: timestep}` — cost is an estimate, therefore banded |
| `jipoe_step` | JipoeStep, optional | The *originating* JIPOE step (singular by design — usage lives in the trace graph). Assignments decided in research note `01-knowledge.md` (amendment); a step-less write draws a warning-level lint (`observed` not exempt). SPEC-21; register candidate concept §6.23 |

**Lifecycle (normative).** `open`: posed, unanswered — ranked by discrimination (from `expected_answers` separation) and carried in S1's collect queue. `answered`: answer + provenance present. `superseded`: a `supersedes` edge points at this version; the superseding object identifies exactly the verdicts this version fed (thesis F is a trace walk from here). `stale`: validity window expired on the scenario clock, or superseded. `contested`: a `contests` edge links two live objects answering the same question — **neither may compile** (G5) until a `resolves` edge lands. `resolved`: contest closed with a surviving answer. `retired`: withdrawn from use by owner decision, without replacement.

**Discrimination (DEC-18).** The discrimination value of an open question is a function of the separation between its `expected_answers` bands across the live COA set — disjoint bands discriminate; partially overlapping bands could (a lucky observation settles the pair); nested bands cannot single out the inner COA (research note `08-analysis.md` §7.2). `/analyse/discrimination` computes this; nothing stores it (it changes whenever the COA set or bands change). Since SPEC-23 the ranking leads with the **operative pairs** — the scenario pairs the current plan-set's verdicts actually turn on, derived from the SPEC-10 tensor, never curated (note §7.1; register candidate concept §6.26).

## 5. Commitment (DEC-19)

A commander-owned condition a plan is held to. `{statement, tier, metric, comparator, threshold, unit, owner, scope}`.

- `statement` — command language, verbatim ("Halcyon Strait open to deep-draught traffic by D+7"). This is what surfaces render; the typed slots below are its machine form.
- `tier` — `must | should | prefer` (DEC-19). Ordinal only; **no numeric weight slot exists**. Relaxation sacrifices from the bottom tier up; within-tier ties are broken explicitly in the RelaxationReport, never silently.
- `metric`, `comparator` (`at_most | at_least | by_step | never`), `threshold`, `unit` — the testable predicate over a scored plan/world. `threshold` is scalar by design: a directive is fact-of-intent, not an assessment (DEC-14). Where a commitment references an assessed quantity, it references the *channel* (which is banded), not a private copy of the number.
- Verdicts against commitments are computed objects (§8), never fields of the commitment.

## 6. ScenarioCOA

One adversary course of action, held as a first-class scenario. `{name, narrative, excursion, likelihood}`.

- `narrative` — the red COA statement in doctrinal form (situation-template prose).
- `excursion` — how this COA perturbs the compiled world: a list of `ChannelOverride {channel, region?, override: Band}` applied at compile time. A COA is a *world variant*, not a special case in the scorer (DEC-10 keeps the scorer scenario-blind: it scores plan × world × scenario by being handed the excursion world).
- `likelihood` — a reference (logical id) to a KnowledgeObject whose `encoding_class = scenario_weight`. The likelihood of a COA is an assessment like any other: banded, provenanced, contestable, supersedable. **Firewall (§9): it may weight attention and reporting, and never compiles into a constraint or cost.**
- Indicators live on the questions, not the COA: any open KnowledgeObject whose `expected_answers` separate this COA from another is an indicator for the pair (DEC-18).

## 7. CompiledWorld, Plan, ForceElement

**CompiledWorld** — the deterministic product of compile (DEC-5): `{grid, channels, consumed, scenario, engine_version, stamp}`.

- `grid` — `{cols, rows, cell_km, timestep_hours, horizon_steps}` (Meridian: 60×60, 2 km, 6 h, 56).
- `channels` — named layers (`mobility`, `tide`, `storm`, `civil_density`, `sensor`, `threat`), each stored **sparse**: a `default: Band` plus a set of `RegionOverride {region, value: Band, from_step?, until_step?, source?}` — named, optionally time-boxed deviations from the default, the MCOO idiom (research note `02-compile.md`; **retires the dense `{x, y, t, value}` cell array**, resolving seam open item 2). Channel values are banded because their sources are; an override built solely from `observed` inputs carries a degenerate band; `source` names the KnowledgeObject the value derives from (G3). Region→cell geometry lives once in the **VignetteConfig** (`{grid, channels: ChannelDefault[], regions: RegionGeometry[], subject_map: SubjectMapEntry[]}`), never per world; region→cell materialisation is a lazy, unstored, score-time function — no dense per-cell channel is ever stored or hashed.
- `consumed` — the exact set of `{logical_id, content_hash}` knowledge versions the compile read (sorted, so the stamp is order-independent). The `stamp` is a hash over `consumed` + vignette config + engine version (+ any scenario excursion): same knowledge set ⇒ byte-identical stamp (G1) — the stamp is over *inputs*, never over materialised cells. `compiled_into` edges are written per consumed object at compile time.

**Plan** (DEC-20) — `{name, seed, generator, elements: ElementPlan[]}`; `ElementPlan {force_element, route: RouteLeg[], tasks: TaskWindow[]}`; `RouteLeg {x, y, enter_step, exit_step}`; `TaskWindow {task, x, y, from_step, until_step}`. Nothing richer: no inter-element dependencies, no abstract action language in v1.

**ForceElement** — vignette-owned: `{name, kind, mobility_class, notes}`.

## 8. Computed artefacts: verdicts, scores, rationale

All computed objects are stored, content-addressed, and stamped; each is written together with the trace edges that justify it (constitution III).

- **CommitmentVerdict** — `{plan, commitment, scenario, world_stamp, verdict, margin, engine_version}`. `verdict` is the four-stop scale `robust | marginal | tight | violated` — no decimals anywhere; `margin` is a Band shown only on demand (hover), never as a headline number.
- **PlanScore** — `{plan, scenario, world_stamp, criterion, score: Band}`. Dominance between plans is judged over these bands (banded non-domination), per scenario and across the scenario set (thesis C).
- **RelaxationReport** (G4) — `{world_stamp, scenario, candidates: RelaxationCandidate[], tie_break}`. Each `RelaxationCandidate {plan, sacrificed: Commitment-refs (non-empty), narrative}` states its sacrifice in command language ("opens the strait D+9, two days late"). An infeasible commitment set returns candidates with `sacrificed` populated — never an empty set, never a silent constraint drop. `tie_break` is required prose whenever two same-tier sacrifices were ordered (DEC-19).
- **SelectionRationale** — `{selected_plan, relaxation_report, statement, decided_by}`. The commander's act, recorded; its arrival re-prioritises verification of the knowledge under the decision (exposure view).

## 9. Encoding discipline (normative — the compile firewall)

How an answer may enter the compiled world is a function of `encoding_class` × `source_class`:

| | `observed` | `reported` / `assessed` | `assumption` |
|---|---|---|---|
| `hard_constraint` | compiles | **waiver required** — refused as `waiver_required` without one; with one, compiles and the waiver renders wherever the constraint bites | refused (`encoding_violation`) |
| `banded_soft_cost` | compiles (degenerate band) | compiles, banded | compiles, banded, `assumption` marking mandatory |
| `scenario_weight` | — (a weight is never observed) | **never compiles into constraint or cost by any path** — weights order attention and reporting only | same |

Plus, regardless of class: `contested` never compiles (G5, refusal `contested_knowledge`); `stale` never compiles silently (refusal `stale_input`; recompiling past staleness is an explicit human act of re-validation or supersession). Meridian exercises every refusal row (K10, K8, K12, K5 respectively).

## 10. TraceEdge (DEC-5, DEC-21)

`{from_hash, to_hash, edge_type, stamp?, written_by}` with `edge_type`:

| Edge | From → To | Written by / when |
|---|---|---|
| `compiled_into` | KnowledgeObject → CompiledWorld channel | compile, per consumed object |
| `scored_from` | CompiledWorld / Plan / ScenarioCOA → CommitmentVerdict / PlanScore | scorer, per output |
| `cited_in` | CommitmentVerdict / PlanScore → RelaxationReport / SelectionRationale | relax / selection |
| `sacrificed_in` | Commitment → RelaxationCandidate | relax |
| `supersedes` | new version → old version | knowledge service, on supersede |
| `contests` | KnowledgeObject ↔ KnowledgeObject | knowledge service, on contest |
| `resolves` | resolving object → contested pair | knowledge service, on resolve |
| `waives` | Waiver-carrying object → the constraint use it licenses | compile |

Edges are written at compute time by the service performing the computation, never reconstructed after the fact. Every computed artefact must be backward-walkable to named KnowledgeObjects with named owners; a dead-end chain is a defect that surfaces as a visible error (constitution III). Forward walks from a knowledge object are the exposure and staleness views (theses E/F).

## 11. LinkML schema

```yaml
id: https://deepbluecltd.github.io/assay/schema/assay-knowledge-model
name: assay-knowledge-model
description: >-
  ASSAY canonical shapes (ASSAY-DEC-3, DEC-6). Source of truth for generated
  TypeScript types (SPEC-03). Independent of REMIT by decision.
license: https://opensource.org/license/mit
prefixes:
  linkml: https://w3id.org/linkml/
  assay: https://deepbluecltd.github.io/assay/schema/
default_prefix: assay
default_range: string
imports:
  - linkml:types

types:
  Timestep:
    typeof: integer
    description: Scenario-clock timestep, D-day origin (ASSAY-DEC-17). Never wall clock.
  LogicalId:
    typeof: string
    description: Stable human-assigned id (K9, C2, R1, ...) (ASSAY-DEC-21).
  ContentHash:
    typeof: string
    description: SHA-256 of canonical JSON; the store address. Not part of the hashed payload.
  RegionName:
    typeof: string
    description: Named region on the grid (MCOO overlay region). Geometry lives once in VignetteConfig (research note 02-compile.md).

enums:
  SourceClass:
    description: ASSAY-DEC-14. Only 'observed' is fact and may render unbanded.
    permissible_values: {observed: {}, reported: {}, assessed: {}, assumption: {}}
  ConfidenceBand:
    description: ICD 203 confidence levels (ASSAY-DEC-16). Width mapping decided in research note 01-knowledge.md — minimum relative width per level (low 0.25 / moderate 0.10 / high 0), enforced as a warning-level lint at write (observed exempt).
    permissible_values: {low: {}, moderate: {}, high: {}}
  EncodingClass:
    description: ASSAY-DEC-6; compile firewall rules in knowledge-model §9.
    permissible_values: {hard_constraint: {}, banded_soft_cost: {}, scenario_weight: {}}
  JipoeStep:
    description: >-
      Originating JIPOE step, singular by design (SPEC-21; assignments and lint posture decided in
      research note 01-knowledge.md amendment). JP 2-01.3 ch. II names the four steps verbatim:
      Step 1 — Define the Operational Environment; Step 2 — Describe the Impact of the Operational
      Environment; Step 3 — Evaluate the Adversary; Step 4 — Determine Adversary Courses of Action.
      Downstream usage lives in the trace graph, never in this slot.
    permissible_values: {step1_define_oe: {}, step2_describe_effects: {}, step3_evaluate_adversary: {}, step4_determine_adversary_coas: {}}
  LifecycleStatus:
    description: ASSAY-DEC-17.
    permissible_values: {open: {}, answered: {}, superseded: {}, stale: {}, contested: {}, resolved: {}, retired: {}}
  Criticality:
    permissible_values: {routine: {}, important: {}, critical: {}}
  CommitmentTier:
    description: ASSAY-DEC-19. Ordinal only; no numeric weights exist.
    permissible_values: {must: {}, should: {}, prefer: {}}
  Comparator:
    permissible_values: {at_most: {}, at_least: {}, by_step: {}, never: {}}
  VerdictBand:
    description: Four stops, no decimals (ASSAY-DEC-9).
    permissible_values: {robust: {}, marginal: {}, tight: {}, violated: {}}
  ChannelKind:
    permissible_values: {mobility: {}, tide: {}, storm: {}, civil_density: {}, sensor: {}, threat: {}}
  TraceEdgeType:
    permissible_values:
      compiled_into: {}
      scored_from: {}
      cited_in: {}
      sacrificed_in: {}
      supersedes: {}
      contests: {}
      resolves: {}
      waives: {}

classes:
  Band:
    description: Closed interval, lo <= hi. No midpoint slot may ever be added (ASSAY-DEC-15).
    attributes:
      lo: {range: float, required: true}
      hi: {range: float, required: true}
      unit: {required: true}

  Provenance:
    attributes:
      source_class: {range: SourceClass, required: true}
      confidence: {range: ConfidenceBand, required: true}
      owner: {required: true, description: Accountable analyst/staff cell; trace chains terminate here.}
      single_source: {range: boolean, required: true}
      collected_at: {range: Timestep}
      note: {}

  ValidityWindow:
    attributes:
      valid_from: {range: Timestep, required: true}
      valid_until: {range: Timestep, required: true}

  Waiver:
    description: Licenses an assessed/reported source to compile as hard_constraint (knowledge-model §9).
    attributes:
      granted_by: {required: true}
      justification: {required: true}
      granted_at: {range: Timestep, required: true}

  ExpectedAnswer:
    description: One row of the miniature event matrix (ASSAY-DEC-18).
    attributes:
      coa: {range: LogicalId, required: true}
      band: {range: Band, required: true}
      provenance: {range: Provenance, description: Who says the COA would look like that — the row is an assessment (research note 08-analysis.md §7.3; warning-linted when absent). SPEC-23; register candidate concept §6.25.}

  CollectionOption:
    attributes:
      method: {required: true}
      cost: {range: Band, required: true, description: An estimate, therefore banded.}
      earliest_result: {range: Timestep}

  StoredObject:
    abstract: true
    description: Two-tier identity (ASSAY-DEC-21). Relationships are TraceEdges, never slots.
    attributes:
      logical_id: {range: LogicalId, required: true}
      version: {range: integer, required: true}

  KnowledgeObject:
    is_a: StoredObject
    description: The central type (ASSAY-DEC-6, DEC-17); commentary in knowledge-model §4.
    attributes:
      question: {required: true}
      subject: {required: true}
      encoding_class: {range: EncodingClass, required: true}
      answer: {range: Band}
      provenance: {range: Provenance}
      criticality: {range: Criticality, required: true}
      validity: {range: ValidityWindow}
      status: {range: LifecycleStatus, required: true}
      waiver: {range: Waiver}
      expected_answers: {range: ExpectedAnswer, multivalued: true, inlined_as_list: true}
      collection: {range: CollectionOption, multivalued: true, inlined_as_list: true}
      jipoe_step: {range: JipoeStep, description: Originating JIPOE step (research note 01-knowledge.md amendment; warning-linted when absent — observed not exempt).}

  Commitment:
    is_a: StoredObject
    description: ASSAY-DEC-19; threshold is scalar fact-of-intent (ASSAY-DEC-14).
    attributes:
      statement: {required: true}
      tier: {range: CommitmentTier, required: true}
      metric: {required: true}
      comparator: {range: Comparator, required: true}
      threshold: {range: float, required: true}
      unit: {required: true}
      owner: {required: true}
      scope: {}

  ChannelOverride:
    attributes:
      channel: {range: ChannelKind, required: true}
      region: {}
      override: {range: Band, required: true}

  ScenarioCOA:
    is_a: StoredObject
    attributes:
      name: {required: true}
      narrative: {required: true}
      excursion: {range: ChannelOverride, multivalued: true, inlined_as_list: true}
      likelihood:
        range: LogicalId
        description: Ref to a scenario_weight KnowledgeObject. Never compiles into constraint or cost (knowledge-model §9).

  GridSpec:
    attributes:
      cols: {range: integer, required: true}
      rows: {range: integer, required: true}
      cell_km: {range: float, required: true}
      timestep_hours: {range: integer, required: true}
      horizon_steps: {range: integer, required: true}

  RegionOverride:
    description: One named, optionally time-boxed deviation from a channel default (sparse channels, research note 02-compile.md). Values are banded because their sources are (G2); source names the KnowledgeObject the value derives from (G3).
    attributes:
      region: {range: RegionName, required: true}
      value: {range: Band, required: true}
      from_step: {range: Timestep}
      until_step: {range: Timestep}
      source: {range: LogicalId, description: The KnowledgeObject this override derives from; complements the compiled_into edge (G3).}

  Channel:
    description: A compile layer stored sparse — a default plus deviations, the MCOO idiom (research note 02-compile.md). Dense per-cell channels are never stored or hashed (retired ChannelCell; resolves seam open item 2).
    attributes:
      name: {required: true}
      kind: {range: ChannelKind, required: true}
      default: {range: Band, required: true, description: The quiet baseline; region overrides deviate from it.}
      regions: {range: RegionOverride, multivalued: true, inlined_as_list: true}

  ConsumedRef:
    attributes:
      logical_id: {range: LogicalId, required: true}
      content_hash: {range: ContentHash, required: true}

  CompiledWorld:
    is_a: StoredObject
    description: Deterministic compile product; stamp semantics in seam contract §1 (G1).
    attributes:
      grid: {range: GridSpec, required: true}
      channels: {range: Channel, multivalued: true, inlined_as_list: true, required: true}
      consumed: {range: ConsumedRef, multivalued: true, inlined_as_list: true, required: true}
      scenario: {range: LogicalId}
      engine_version: {required: true}
      stamp: {required: true}

  ChannelDefault:
    description: The quiet baseline band for a channel kind, held once in VignetteConfig (research note 02-compile.md).
    attributes:
      kind: {range: ChannelKind, required: true}
      default: {range: Band, required: true}

  RegionGeometry:
    description: A named region's extent as a bounding rect on the grid (demonstrator-sufficient geometry, research note 02-compile.md).
    attributes:
      name: {range: RegionName, required: true}
      x0: {range: integer, required: true}
      y0: {range: integer, required: true}
      x1: {range: integer, required: true}
      y1: {range: integer, required: true}

  SubjectMapEntry:
    description: Routes a KnowledgeObject subject (topic key, knowledge-model §5) to a channel region at compile. scenario.* subjects are absent (firewalled).
    attributes:
      subject: {required: true}
      channel: {range: ChannelKind, required: true}
      region: {range: RegionName, required: true}

  VignetteConfig:
    is_a: StoredObject
    description: The single home of grid, per-channel defaults, region geometry, and subject routing consumed by compile (research note 02-compile.md; seam §4 config).
    attributes:
      grid: {range: GridSpec, required: true}
      channels: {range: ChannelDefault, multivalued: true, inlined_as_list: true, required: true}
      regions: {range: RegionGeometry, multivalued: true, inlined_as_list: true, required: true}
      subject_map: {range: SubjectMapEntry, multivalued: true, inlined_as_list: true, required: true}

  ForceElement:
    is_a: StoredObject
    attributes:
      name: {required: true}
      kind: {required: true}
      mobility_class: {required: true}
      notes: {}

  RouteLeg:
    attributes:
      x: {range: integer, required: true}
      y: {range: integer, required: true}
      enter_step: {range: Timestep, required: true}
      exit_step: {range: Timestep, required: true}

  TaskWindow:
    attributes:
      task: {required: true}
      x: {range: integer, required: true}
      y: {range: integer, required: true}
      from_step: {range: Timestep, required: true}
      until_step: {range: Timestep, required: true}

  ElementPlan:
    attributes:
      force_element: {range: LogicalId, required: true}
      route: {range: RouteLeg, multivalued: true, inlined_as_list: true}
      tasks: {range: TaskWindow, multivalued: true, inlined_as_list: true}

  Plan:
    is_a: StoredObject
    description: Timed routes + task windows, nothing richer in v1 (ASSAY-DEC-20).
    attributes:
      name: {required: true}
      seed: {range: integer, required: true}
      generator: {required: true}
      elements: {range: ElementPlan, multivalued: true, inlined_as_list: true, required: true}

  CommitmentVerdict:
    is_a: StoredObject
    attributes:
      plan: {range: LogicalId, required: true}
      commitment: {range: LogicalId, required: true}
      scenario: {range: LogicalId, required: true}
      world_stamp: {required: true}
      verdict: {range: VerdictBand, required: true}
      margin: {range: Band}
      engine_version: {required: true}

  PlanScore:
    is_a: StoredObject
    attributes:
      plan: {range: LogicalId, required: true}
      scenario: {range: LogicalId, required: true}
      world_stamp: {required: true}
      criterion: {required: true}
      score: {range: Band, required: true}
      engine_version: {required: true}

  RelaxationCandidate:
    attributes:
      plan: {range: LogicalId, required: true}
      sacrificed: {range: LogicalId, multivalued: true, required: true, description: Non-empty by G4.}
      narrative: {required: true, description: The sacrifice in command language.}

  RelaxationReport:
    is_a: StoredObject
    description: G4 — never empty, never a silent drop; tie-breaks stated (ASSAY-DEC-19).
    attributes:
      world_stamp: {required: true}
      scenario: {range: LogicalId, required: true}
      candidates: {range: RelaxationCandidate, multivalued: true, inlined_as_list: true, required: true}
      tie_break: {description: Required prose whenever same-tier sacrifices were ordered.}

  SelectionRationale:
    is_a: StoredObject
    attributes:
      selected_plan: {range: LogicalId, required: true}
      relaxation_report: {range: LogicalId}
      statement: {required: true}
      decided_by: {required: true}

  TraceEdge:
    description: Written at compute time, never reconstructed (constitution III).
    attributes:
      from_hash: {range: ContentHash, required: true}
      to_hash: {range: ContentHash, required: true}
      edge_type: {range: TraceEdgeType, required: true}
      stamp: {}
      written_by: {required: true}
```

## 12. Deliberate absences (register-backed)

- **No midpoint, no distribution parameters** on Band (DEC-15).
- **No numeric commitment weights** (DEC-19).
- **No `supersedes`/`contests` slots** on classes — edges only (DEC-21).
- **No wall-clock fields** on stored objects (DEC-17; G1). The delta feed's display time lives in the event envelope (seam contract §10), outside content addressing.
- **No REMIT imports** of any kind (DEC-3). Convergence findings go back as REMIT register candidates.
- **No PMESII node-link classes** — thesis G is horizon (concept §1); admitting shapes for it now would be false-precision risk with no consumer.

Open items for a future register batch: whether `criticality` earns its keep once discrimination/sensitivity rankings exist (it may be redundant with computed priority). ~~Whether `ExpectedAnswer` needs a provenance of its own (who says the COA would look like that?)~~ — answered yes by research note `08-analysis.md` §7.3 (SPEC-23); flagged as register candidate concept §6.25, awaiting ratification.
