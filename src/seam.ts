/**
 * SPEC-05 — shared seam types.
 *
 * The refusal model (seam contract §1): a service that declines to compute
 * returns a first-class `Refusal`, never an HTTP-shaped error and never a
 * degraded result. Deltas (seam §10) stamp every cross-surface write. These
 * are movement/response types, not stored LinkML objects, so they live here
 * rather than in the generated schema.
 */
import type { Ref } from './store.js';
import type { TraceChain } from './trace.js';
import type { Band, CommitmentVerdict, ExpectedAnswer, PlanScore, RelaxationReport, VerdictBand } from './generated/types.js';

export type RefusalReason =
  | 'contested_knowledge'
  | 'stale_input'
  | 'waiver_required'
  | 'encoding_violation'
  | 'stamp_mismatch'
  | 'unknown_ref';

export interface Refusal {
  refused: true;
  reason: RefusalReason;
  offending: Ref[]; // exactly which objects triggered it
  explanation: string; // one sentence, render-ready
}

/** A warning is not a refusal — the write still succeeds (research note 01). */
export interface LintWarning {
  code: 'confidence_width_floor' | 'missing_jipoe_step' | 'missing_expected_answer_provenance';
  offending: Ref;
  message: string;
}

export interface WriteSuccess {
  ref: Ref;
  warnings?: LintWarning[];
}

export type WriteResult = WriteSuccess | Refusal;

export interface Delta {
  seq: number; // monotonic; the feed's ordering key
  actor: string;
  role: string;
  // `refused` records a write attempt the firewall declined (SPEC-26 T03/DEC-5
  // coverage): the attempt is part of the record, so the cursor has a position
  // for it, but no object is written and no edge added (state is unchanged from
  // the prior seq). A value on the existing union — the Delta shape is unchanged.
  op: 'create' | 'supersede' | 'contest' | 'resolve' | 'refused';
  refs: Ref[];
  stamp?: string;
  warnings?: LintWarning[]; // lint warnings the write drew (SPEC-21); envelope, outside content addressing
  at: string; // display-only envelope; never participates in content addressing (DEC-17)
}

/** Discriminates any service result — a success carries no `refused` flag. */
export function isRefusal(r: unknown): r is Refusal {
  return typeof r === 'object' && r !== null && (r as Refusal).refused === true;
}

/**
 * SPEC-07 — scorer movement types (seam §5). The perturbation hook substitutes
 * an answer for this call only (nothing stored); `scenario` is recorded on the
 * verdicts for provenance — the world is already excursioned (DEC-10).
 */
export interface KnowledgeOverride {
  ref: Ref;
  answer: Band;
}

export interface ScoreRequest {
  plan: Ref;
  world: Ref;
  scenario: string;
  knowledge_overrides?: KnowledgeOverride[];
  engine_version: string;
}

export interface ScoreSuccess {
  verdicts: CommitmentVerdict[];
  scores: PlanScore[];
  stamp: string;
}

export type ScoreResult = ScoreSuccess | Refusal;

/**
 * SPEC-08 — handful movement types (seam §6). `/plan/handful` generates a
 * strategy-biased fan-out, scores each via §5, and organises by banded
 * non-domination into 3–5 genuinely distinct plans. `count` is clamped to the
 * contract band [3,5]. `organisation.distinct_because` is a DERIVED view (one
 * reason per returned plan, aligned to `plans`), never a hand-authored caption.
 */
export interface HandfulRequest {
  world: Ref;
  seed: number;
  count?: number; // clamped to [3,5]; default 5
  engine_version: string;
}

export interface HandfulOrganisation {
  distinct_because: string[]; // aligned index-for-index with `plans`
}

export interface HandfulSuccess {
  plans: Ref[];
  scores: PlanScore[];
  organisation: HandfulOrganisation;
  stamp: string;
}

export type HandfulResult = HandfulSuccess | Refusal;

/**
 * SPEC-09 — relaxation movement types (seam §7). `/relax` is called on an
 * infeasible commitment set; it returns a `RelaxationReport` whose candidates each
 * name their `sacrificed` commitments (non-empty, G4), ranked least-worst first.
 * `feasible` is set ONLY when a candidate needs no sacrifice at all — feasibility
 * is reported first-class rather than as a candidate with an empty `sacrificed`
 * (G4 requires `sacrificed` non-empty). Scenario is derived from the world (DEC-10).
 */
export interface RelaxRequest {
  world: Ref;
  commitments: Ref[];
  seed: number;
  engine_version: string;
}

export interface RelaxSuccess {
  report: RelaxationReport;
  stamp: string;
  feasible?: { plan: Ref }; // present only when the set turned out to be satisfiable
}

export type RelaxResult = RelaxSuccess | Refusal;

/**
 * SPEC-10 — robustness movement types (seam §8, thesis C). Multi-scenario scoring
 * of a plan set across the adversary COA set (R1/R2/R3). The orchestration is a
 * loop over the SPEC-07 scorer (DEC-10) — no new engine. The minimax (worst-case)
 * posture is decided by research note `docs/research/06-robustness.md` §1.
 */
export interface RobustnessRequest {
  plans: Ref[];
  worlds: Record<string, Ref>; // keyed by scenario id (e.g. {R1: ref, R2: ref, R3: ref})
  engine_version: string;
}

export interface ScenarioVerdictTensor {
  scenarios: string[];       // ordered scenario ids
  plans: string[];           // ordered plan logical ids
  commitments: string[];     // ordered commitment logical ids
  verdicts: Map<string, CommitmentVerdict>; // key: `${plan}-${commitment}-${scenario}`
  worst_case: Map<string, VerdictBand>;     // key: `${plan}-${commitment}` → worst verdict across scenarios
  stamps_compatible: boolean; // whether all worlds share the same consumed-knowledge stamp lineage
}

export interface RobustnessSuccess {
  tensor: ScenarioVerdictTensor;
  stamp: string;
}

export type RobustnessResult = RobustnessSuccess | Refusal;

/**
 * SPEC-11 — sensitivity movement types (seam §8, thesis E). Band-edge
 * perturbation loop over the scorer; ranks knowledge items by verdict-change
 * count. The `single_source` flag is carried through from provenance, not
 * used in the ranking arithmetic (research note `08-analysis.md` §1–2).
 */
export interface SensitivityRequest {
  plan: Ref;
  world: Ref;
  scenario: string;
  engine_version: string;
}

export interface SensitivityRanking {
  knowledge: Ref;
  baseline_verdicts: VerdictBand[];
  perturbed_verdicts: VerdictBand[];
  changed_count: number;
  single_source: boolean;
}

export interface SensitivitySuccess {
  ranking: SensitivityRanking[];
  stamp: string;
}

export type SensitivityResult = SensitivitySuccess | Refusal;

/**
 * SPEC-12 — discrimination movement types (seam §8, thesis D). COA-pair
 * separation over open questions' expected-answer bands (DEC-18). Cost and
 * value are shown alongside, never collapsed (DEC-19).
 *
 * SPEC-23 (v2, research note 08 §7): the ranking is conditioned on the
 * OPERATIVE pairs — the scenario pairs the current plan-set's verdicts
 * actually turn on, derived from the SPEC-10 tensor, never curated and never
 * likelihood-weighted (the §9 firewall; K14 does not enter). Each pair also
 * carries a three-way classification (disjoint / partial / nested) — additive
 * over the v1 numbers, never a rescore.
 */
export interface DiscriminationRequest {
  questions?: Ref[];
  coas: string[];
  /** SPEC-23: the live decision's verdict tensor; absent ⇒ all-pairs v1 semantics, stated. */
  tensor?: ScenarioVerdictTensor;
  engine_version: string;
}

/** Note 08 §7.2: nested = the inner COA has no exclusive region — no observation can single it out. */
export type SeparationClass = 'disjoint' | 'partial' | 'nested';

export interface CoaPairSeparation {
  coa_a: string;
  coa_b: string;
  separation: Band;
  classification: SeparationClass;
  /** True iff the pair is operative under the supplied tensor (mode 'operative' only). */
  operative?: boolean;
}

/** One witness that a scenario pair is operative: a plan×commitment whose verdicts differ across it. */
export interface OperativePairEvidence {
  plan: string;
  commitment: string;
  verdict_a: VerdictBand;
  verdict_b: VerdictBand;
}

export interface OperativePair {
  a: string;
  b: string;
  evidence: OperativePairEvidence[];
}

/** Derived, seam-visible; a pure function of the tensor — no curation, no likelihood (note 08 §7.1). */
export interface OperativePairs {
  pairs: OperativePair[];
  stamp: string;
}

export interface DiscriminationEntry {
  question: Ref;
  pairs: CoaPairSeparation[];
  /** All-pairs best — v1 semantics, unchanged; context in operative mode (FR-002). */
  best_separation: Band;
  /** Best separation over could-discriminate (non-nested) operative pairs; absent when none exists. */
  operative_best?: Band;
  cost: Band;
  /** The event-matrix rows the separations were read from, provenance included — chips render wherever expected bands render (G3, SPEC-23). */
  expected_answers: ExpectedAnswer[];
}

export interface DiscriminationSuccess {
  ranking: DiscriminationEntry[];
  /** How the ranking is conditioned; fallbacks and degenerate states are stated, never silent (FR-006). */
  mode: 'operative' | 'all_pairs' | 'degenerate';
  operative?: OperativePairs;
  /** Render-ready honest statement for fallback/degenerate modes (and the every-pair-operative case). */
  statement?: string;
  stamp: string;
}

export type DiscriminationResult = DiscriminationSuccess | Refusal;

/**
 * SPEC-24 — decision-support movement types (seam §8; review slice S-D, the
 * keystone). `POST /analyse/decision-support` derives the doctrinal DSM —
 * decision points, commit steps, LTIOV, discriminators, tripwires — as a thin
 * orchestration over the tensor (SPEC-10), the SPEC-12/23 separation
 * classification, plan geometry (DEC-20 stated routes), and validity windows.
 * The derivation rules are decided by research note
 * `docs/research/12-decision-support.md` (DEC-11 gate): the two-class DP
 * predicate (§2), the commit-step rule per metric kind (§3), LTIOV =
 * commit_step − lead with lead 0 stated (§4), the three-state
 * answerable-in-time predicate with the honest red branch (§4), world-level
 * tripwire scope (§5). Every quantity is a band, a step, a verdict, or a
 * classification word — no urgency/priority/risk scalar exists (DEC-19).
 * Register candidates concept §6.27/§6.28 — flagged, not asserted (DEC-2).
 */
export interface DecisionSupportRequest {
  plan: Ref;
  /** The selected world — margin-class evidence is read under it (note 12 §2). */
  world: Ref;
  /** Scenario worlds the tensor ranges over, keyed by scenario id; must include the selected world. */
  worlds: Record<string, Ref>;
  /** The adversary COA vocabulary — divergence is measured over these only (note 12 §2). */
  coas: string[];
  commitments: Ref[];
  /** Open-question refs (the store is class-blind — callers supply refs, as discrimination does). */
  questions?: Ref[];
  engine_version: string;
}

/** The verdict pattern that makes a row a decision point (note 12 §2). */
export type DpEvidence =
  | { kind: 'scenario_divergence'; a: string; b: string; verdict_a: VerdictBand; verdict_b: VerdictBand }
  | { kind: 'margin'; scenario: string; verdict: VerdictBand; margin?: Band };

/** One collection option's answerable-in-time state — three states, never collapsed
 *  (note 12 §4): `in_time` absent ⟺ no `earliest_result` stated (never assumed
 *  answerable); `slack` (a step count) present iff in time. */
export interface DsmCollection {
  method: string;
  cost: Band;
  earliest_result?: number;
  in_time?: boolean;
  slack?: number;
}

/** An open question attached to a DP: its per-evidence-pair classification and
 *  its collection options. Attached iff at least one pair is non-nested. */
export interface DsmDiscriminator {
  question: Ref;
  pairs: { a: string; b: string; classification: SeparationClass; separation: Band }[];
  collection: DsmCollection[];
}

export interface DsmTripwire {
  knowledge: Ref;
  valid_until: number;
  commit_step: number;
}

export interface DecisionPointRow {
  commitment: string;
  tier: string;
  statement: string;
  evidence: DpEvidence[];
  /** How the commit step was derived: a route leg, the horizon (world-decided),
   *  or none (margin-class only / underivable — stated, never invented). */
  commit_kind: 'route_leg' | 'world_decided' | 'none';
  /** Render-ready sentence: where the commitment happens, in words. */
  commit_detail: string;
  commit_step?: number;
  ltiov?: number;
  discriminators: DsmDiscriminator[];
  /** The named intelligence gap — set iff divergence evidence exists but no question can settle any pair. */
  gap?: string;
  tripwires: DsmTripwire[];
}

export interface DecisionSupportSuccess {
  rows: DecisionPointRow[];
  plan: string;
  /** Scenario key of the selected world. */
  selected: string;
  coas: string[];
  /** Decision-cycle lead, 0 in v1 — stated, never silently assumed (note 12 §4). */
  lead: number;
  stamps_compatible: boolean;
  /** Honest empty state / mixed-stamps fallback sentence, render-ready. */
  statement?: string;
  stamp: string;
}

export type DecisionSupportResult = DecisionSupportSuccess | Refusal;

/**
 * SPEC-13 — staleness movement types (seam §8, thesis F). Transitive forward
 * trace walk from a superseded/changed knowledge object; returns exactly the
 * dependent artefacts and nothing else. Nothing recomputes — flags, then humans
 * decide (constitution).
 */
export interface StalenessRequest {
  changed: Ref;
  engine_version: string;
}

export interface StalenessSuccess {
  invalidated: {
    verdicts: Ref[];
    scores: Ref[];
    worlds: Ref[];
  };
  chains: TraceChain[];
  stamp: string;
}

export type StalenessResult = StalenessSuccess | Refusal;
