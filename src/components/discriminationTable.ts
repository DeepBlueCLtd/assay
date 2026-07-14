/**
 * SPEC-12 — discrimination ranking table (thesis D; ui-design §S6-disc).
 *
 * Renders the COA-pair separation ranking as a table: one row per open question,
 * ranked by discrimination value (already sorted by the service). Each row shows
 * the question logical_id, the best separation band, the collection cost band,
 * and per-pair separation chips. Positive separation (disjoint expected-answer
 * bands) is green; negative (overlapping) is amber/red. Cost and value are shown
 * alongside, never collapsed (DEC-19). Pure component: HTML string from data,
 * no DOM, no state (constitution I). Glow ids follow the SPEC-16 pattern.
 */
import type { Band } from '../generated/types.js';
import type { CoaPairSeparation, DiscriminationEntry } from '../seam.js';

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function bandPill(b: Band): string {
  const text = b.lo === b.hi ? `${b.lo} ${b.unit}` : `${b.lo}–${b.hi} ${b.unit}`;
  return `<span style="display:inline-block;padding:1px 6px;border-radius:8px;font-family:ui-monospace,monospace;font-size:10px;font-weight:600;background:#E0E8ED;color:#1B2732;margin:1px 2px">${esc(text)}</span>`;
}

function separationChip(sep: Band): string {
  const isPositive = sep.lo > 0;
  const isNegative = sep.hi < 0;
  const bg = isPositive ? '#1E6B3A' : isNegative ? '#8A2020' : '#7A6A12';
  const fg = '#FFFFFF';
  const text = sep.lo === sep.hi ? `${sep.lo} ${sep.unit}` : `${sep.lo}–${sep.hi} ${sep.unit}`;
  return `<span style="display:inline-block;padding:1px 6px;border-radius:8px;font-family:ui-monospace,monospace;font-size:10px;font-weight:700;background:${bg};color:${fg};margin:1px 2px">${esc(text)}</span>`;
}

function pairChip(pair: CoaPairSeparation): string {
  const label = `${esc(pair.coa_a)} vs ${esc(pair.coa_b)}`;
  return `<span style="display:inline-flex;align-items:center;gap:3px;margin:2px 0"><span style="font-family:ui-monospace,monospace;font-size:9.5px;color:#5B6B77">${label}</span>${separationChip(pair.separation)}</span>`;
}

export function discriminationTable(ranking: DiscriminationEntry[]): string {
  if (ranking.length === 0) {
    return '<div style="font-family:ui-monospace,monospace;font-size:11px;color:#5B6B77;padding:8px">No discrimination data.</div>';
  }

  const head = `<tr style="text-align:left">
    <th style="padding:5px 10px;font-size:10px;color:#5B6B77;border-bottom:2px solid #D8DFE4">Question ID</th>
    <th style="padding:5px 10px;font-size:10px;color:#5B6B77;border-bottom:2px solid #D8DFE4;text-align:center">Best Separation</th>
    <th style="padding:5px 10px;font-size:10px;color:#5B6B77;border-bottom:2px solid #D8DFE4;text-align:center">Cost</th>
    <th style="padding:5px 10px;font-size:10px;color:#5B6B77;border-bottom:2px solid #D8DFE4">Per-pair Separation</th>
  </tr>`;

  const rows = ranking
    .map((entry) => {
      const logicalId = entry.question.logical_id;
      const pairChips = entry.pairs.map(pairChip).join('<br>');
      return `<tr data-glow-id="disc:${esc(logicalId)}" data-glow-sig="${entry.best_separation.lo}">
        <td style="padding:5px 10px;font-family:ui-monospace,monospace;font-size:11px;font-weight:600;color:#1B2732;border-bottom:1px solid #EDF0F2;white-space:nowrap">${esc(logicalId)}</td>
        <td style="padding:5px 10px;text-align:center;border-bottom:1px solid #EDF0F2">${separationChip(entry.best_separation)}</td>
        <td style="padding:5px 10px;text-align:center;border-bottom:1px solid #EDF0F2">${bandPill(entry.cost)}</td>
        <td style="padding:5px 10px;border-bottom:1px solid #EDF0F2">${pairChips}</td>
      </tr>`;
    })
    .join('');

  return `<div style="overflow-x:auto"><table class="assay-discrimination-table" style="border-collapse:collapse;width:100%">
  <thead>${head}</thead>
  <tbody>${rows}</tbody>
</table></div>`;
}
