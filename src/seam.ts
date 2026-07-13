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
import type { Band, CommitmentVerdict, PlanScore, RelaxationReport } from './generated/types.js';

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
