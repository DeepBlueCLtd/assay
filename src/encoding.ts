/**
 * SPEC-05 — the encoding-discipline firewall (knowledge model §9, normative).
 *
 * How an answer may enter the compiled world is a function of
 * `encoding_class` × `source_class`. Pure functions so the same policy is
 * testable in isolation and reusable by the SPEC-06 compile as defence in
 * depth (seam §4 — anything an earlier engine version let through).
 *
 *   hard_constraint × observed              → compiles
 *   hard_constraint × reported/assessed     → waiver_required (compiles with a waiver)
 *   hard_constraint × assumption            → encoding_violation (no waiver can license it)
 *   scenario_weight × anything              → never a constraint or cost, by any path
 */
import type { KnowledgeObject } from './generated/types.js';
import type { Refusal } from './seam.js';
import type { Ref } from './store.js';

const refOf = (ko: KnowledgeObject): Ref => ({ logical_id: ko.logical_id, content_hash: '' });

/**
 * Returns a Refusal if the object's encoding is not permitted at write time,
 * otherwise null. Called before anything is stored (a refusal persists
 * nothing).
 */
export function checkEncoding(ko: KnowledgeObject): Refusal | null {
  if (ko.encoding_class !== 'hard_constraint') return null;

  const sourceClass = ko.provenance?.source_class;

  if (sourceClass === 'assumption') {
    return {
      refused: true,
      reason: 'encoding_violation',
      offending: [refOf(ko)],
      explanation: `${ko.logical_id}: an assumption may never be a hard constraint — no waiver can license one.`,
    };
  }

  if ((sourceClass === 'reported' || sourceClass === 'assessed') && !ko.waiver) {
    return {
      refused: true,
      reason: 'waiver_required',
      offending: [refOf(ko)],
      explanation: `${ko.logical_id}: a ${sourceClass} value needs a recorded waiver to act as a hard constraint.`,
    };
  }

  return null;
}

/**
 * The scenario_weight firewall: a weight orders attention and reporting but
 * never compiles into a constraint or cost by any path (knowledge model §9).
 * Consumed by the SPEC-06 compile; asserted here at Stage 1.
 */
export function mayCompileAsConstraintOrCost(ko: KnowledgeObject): boolean {
  return ko.encoding_class !== 'scenario_weight';
}
