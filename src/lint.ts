/**
 * SPEC-05 — confidence → band-width lint (research note 01-knowledge.md).
 *
 * ICD 203 keeps likelihood and confidence as separate axes: band width tracks
 * the quantity, confidence tracks the sourcing, so width cannot be *derived*
 * from confidence. The honest coupling is a floor — a low-confidence judgement
 * may not be dressed in a suspiciously tight band, the false-precision tell
 * ASSAY exists to catch. Warning-level only in v1 (recalibrated after SME
 * Checkpoint 1, DEC-27); a hard refusal on author-stated bands is premature.
 *
 * Relative width r = (hi − lo) / max(|lo|, |hi|) — needs no midpoint (DEC-15).
 */
import type { KnowledgeObject } from './generated/types.js';
import type { ConfidenceBand } from './generated/types.js';
import type { LintWarning } from './seam.js';
import type { Ref } from './store.js';

/** Minimum relative width per confidence level (research note 01 §2). */
export const WIDTH_FLOOR: Record<ConfidenceBand, number> = {
  low: 0.25,
  moderate: 0.1,
  high: 0,
};

export function relativeWidth(lo: number, hi: number): number {
  const denom = Math.max(Math.abs(lo), Math.abs(hi));
  return denom === 0 ? 0 : (hi - lo) / denom;
}

/**
 * SPEC-21 — missing-JIPOE-step lint (research note 01, amendment).
 *
 * Every question originates somewhere in the four-step JIPOE process; a
 * knowledge object that does not name its step leaves "doctrinally shaped"
 * asserted rather than auditable. Warning-level like the width lint
 * (recalibrated after Checkpoint 1, DEC-27) — but unlike it, `observed` is
 * NOT exempt: the width exemption protects fact from a precision test that
 * only bites assessments; origin applies to every source class, open
 * questions included.
 */
export function jipoeStepLint(ko: KnowledgeObject): LintWarning[] {
  if (ko.jipoe_step !== undefined) return [];
  const offending: Ref = { logical_id: ko.logical_id, content_hash: '' };
  return [
    {
      code: 'missing_jipoe_step',
      offending,
      message: `${ko.logical_id}: no originating JIPOE step named — the doctrinal-shape claim stays asserted, not auditable (research note 01, amendment).`,
    },
  ];
}

export function confidenceLint(ko: KnowledgeObject): LintWarning[] {
  const prov = ko.provenance;
  if (!ko.answer || !prov) return []; // open questions and un-provenanced objects are exempt
  if (prov.source_class === 'observed') return []; // fact is exempt (DEC-14)

  const floor = WIDTH_FLOOR[prov.confidence];
  const r = relativeWidth(ko.answer.lo, ko.answer.hi);
  if (r < floor) {
    const offending: Ref = { logical_id: ko.logical_id, content_hash: '' };
    return [
      {
        code: 'confidence_width_floor',
        offending,
        message: `${ko.logical_id}: ${prov.confidence}-confidence band has relative width ${r.toFixed(
          2,
        )}, below the ${floor.toFixed(2)} floor — possible false precision (research note 01).`,
      },
    ];
  }
  return [];
}
