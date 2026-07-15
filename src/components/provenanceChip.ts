/**
 * SPEC-14 — provenance chip, welded to every rendered value (DEC-9).
 *
 * The `single-source` and `assessment, not fact` markings are MANDATORY
 * whenever they apply (constitution II) — this component owns that rule so
 * no surface can forget it. Depends only on generated LinkML types.
 *
 * SPEC-21: the chip also renders the originating JIPOE step, in words —
 * doctrinal origin is visible wherever provenance is visible.
 */
import type { JipoeStep, Provenance } from '../generated/types.js';

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const chip = (text: string, fg: string, bg: string, border: string): string =>
  `<span style="font-family:ui-monospace,monospace;font-size:10.5px;padding:2px 7px;border-radius:3px;background:${bg};color:${fg};border:1px solid ${border};margin-right:5px;white-space:nowrap">${esc(text)}</span>`;

/** The step in words (JP 2-01.3's four steps), never a bare number (SPEC-21). */
export const JIPOE_STEP_LABEL: Record<JipoeStep, string> = {
  step1_define_oe: 'JIPOE 1 · define the OE',
  step2_describe_effects: 'JIPOE 2 · describe OE effects',
  step3_evaluate_adversary: 'JIPOE 3 · evaluate the adversary',
  step4_determine_adversary_coas: 'JIPOE 4 · determine adversary COAs',
};

export function provenanceChip(prov: Provenance, jipoeStep?: JipoeStep): string {
  const parts: string[] = [];
  if (prov.source_class === 'observed') {
    parts.push(chip(`observed · ${prov.confidence}`, '#14655F', '#E2EFEA', '#BFDCD3'));
  } else {
    parts.push(chip(`${prov.source_class} · ${prov.confidence}`, '#9A6A14', '#F7EDD8', '#E7D3A6'));
    // Mandatory marking — rendered wherever the value renders (DEC-9, DEC-14).
    parts.push(chip('assessment, not fact', '#9A6A14', '#F7EDD8', '#E7D3A6'));
  }
  if (prov.single_source) {
    // Mandatory whenever corroboration is absent (knowledge model §3).
    parts.push(chip('single-source', '#A33131', '#F8E2E2', '#EFC6C6'));
  }
  if (jipoeStep) {
    parts.push(chip(JIPOE_STEP_LABEL[jipoeStep], '#3E5D8A', '#EAF0F7', '#C9D7E8'));
  }
  parts.push(chip(`owner: ${prov.owner}`, '#5B6B77', '#F1F3F5', '#D8DFE4'));
  return `<span class="assay-provenance">${parts.join('')}</span>`;
}
