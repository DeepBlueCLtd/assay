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
import type { Band, CommitmentVerdict, PlanScore, RelaxationReport, VerdictBand } from './generated/types.js';

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
  code: 'confidence_width_floor';
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
  op: 'create' | 'supersede' | 'contest' | 'resolve';
  refs: Ref[];
  stamp?: string;
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
 */
export interface DiscriminationRequest {
  questions?: Ref[];
  coas: string[];
  engine_version: string;
}

export interface CoaPairSeparation {
  coa_a: string;
  coa_b: string;
  separation: Band;
}

export interface DiscriminationEntry {
  question: Ref;
  pairs: CoaPairSeparation[];
  best_separation: Band;
  cost: Band;
}

export interface DiscriminationSuccess {
  ranking: DiscriminationEntry[];
  stamp: string;
}

export type DiscriminationResult = DiscriminationSuccess | Refusal;

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
