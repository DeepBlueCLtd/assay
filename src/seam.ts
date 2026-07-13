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
import type { Band, CommitmentVerdict, PlanScore } from './generated/types.js';

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
