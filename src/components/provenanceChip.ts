/**
 * SPEC-14 — provenance chip, welded to every rendered value (DEC-9).
 *
 * The `single-source` and `assessment, not fact` markings are MANDATORY
 * whenever they apply (constitution II) — this component owns that rule so
 * no surface can forget it. Depends only on generated LinkML types.
 */
import type { Provenance } from '../generated/types.js';

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const chip = (text: string, fg: string, bg: string, border: string): string =>
  `<span style="font-family:ui-monospace,monospace;font-size:10.5px;padding:2px 7px;border-radius:3px;background:${bg};color:${fg};border:1px solid ${border};margin-right:5px;white-space:nowrap">${esc(text)}</span>`;

export function provenanceChip(prov: Provenance): string {
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
  parts.push(chip(`owner: ${prov.owner}`, '#5B6B77', '#F1F3F5', '#D8DFE4'));
  return `<span class="assay-provenance">${parts.join('')}</span>`;
}
