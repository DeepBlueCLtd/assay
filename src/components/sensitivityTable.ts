/**
 * SPEC-11 — sensitivity ranking table (thesis E; ui-design §S6-sens).
 *
 * Renders the tornado-perturbation sensitivity ranking as a table: one row per
 * knowledge item, ranked by verdict-change count (desc, already sorted by the
 * service). Each row shows the knowledge logical_id, how many verdicts changed
 * under band-edge perturbation, whether the item is single-source (ICD 203
 * uncorroborated flag), and a baseline vs perturbed verdict chip comparison.
 * Pure component: HTML string from data, no DOM, no state (constitution I).
 * Glow ids follow the SPEC-16 pattern.
 */
import type { VerdictBand } from '../generated/types.js';
import type { SensitivityRanking } from '../seam.js';

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const STOP: Record<VerdictBand, { bg: string; fg: string; label: string }> = {
  robust: { bg: '#1E6B3A', fg: '#FFFFFF', label: 'robust' },
  marginal: { bg: '#7A6A12', fg: '#FFFFFF', label: 'marginal' },
  tight: { bg: '#9A5212', fg: '#FFFFFF', label: 'tight' },
  violated: { bg: '#8A2020', fg: '#FFFFFF', label: 'violated' },
};

function verdictChip(v: VerdictBand): string {
  const s = STOP[v];
  return `<span style="display:inline-block;padding:1px 5px;border-radius:8px;font-family:ui-monospace,monospace;font-size:10px;font-weight:700;background:${s.bg};color:${s.fg};margin:1px 2px">${s.label}</span>`;
}

function verdictSequence(verdicts: VerdictBand[]): string {
  return verdicts.map(verdictChip).join('');
}

export function sensitivityTable(ranking: SensitivityRanking[]): string {
  if (ranking.length === 0) {
    return '<div style="font-family:ui-monospace,monospace;font-size:11px;color:#5B6B77;padding:8px">No sensitivity data.</div>';
  }

  const head = `<tr style="text-align:left">
    <th style="padding:5px 10px;font-size:10px;color:#5B6B77;border-bottom:2px solid #D8DFE4">Knowledge ID</th>
    <th style="padding:5px 10px;font-size:10px;color:#5B6B77;border-bottom:2px solid #D8DFE4;text-align:center">Changed</th>
    <th style="padding:5px 10px;font-size:10px;color:#5B6B77;border-bottom:2px solid #D8DFE4;text-align:center">Source</th>
    <th style="padding:5px 10px;font-size:10px;color:#5B6B77;border-bottom:2px solid #D8DFE4">Baseline</th>
    <th style="padding:5px 10px;font-size:10px;color:#5B6B77;border-bottom:2px solid #D8DFE4">Perturbed</th>
  </tr>`;

  const rows = ranking
    .map((entry) => {
      const logicalId = entry.knowledge.logical_id;
      const changedStyle =
        entry.changed_count > 0
          ? 'font-weight:700;color:#8A2020'
          : 'color:#5B6B77';
      const singleSourceChip = entry.single_source
        ? '<span style="display:inline-block;padding:1px 6px;border-radius:8px;font-family:ui-monospace,monospace;font-size:10px;font-weight:700;background:#8A2020;color:#FFFFFF">single-source</span>'
        : '<span style="font-family:ui-monospace,monospace;font-size:10px;color:#5B6B77">—</span>';
      return `<tr data-glow-id="sens:${esc(logicalId)}" data-glow-sig="${entry.changed_count}">
        <td style="padding:5px 10px;font-family:ui-monospace,monospace;font-size:11px;font-weight:600;color:#1B2732;border-bottom:1px solid #EDF0F2;white-space:nowrap">${esc(logicalId)}</td>
        <td style="padding:5px 10px;text-align:center;font-family:ui-monospace,monospace;font-size:11px;${changedStyle};border-bottom:1px solid #EDF0F2">${entry.changed_count}</td>
        <td style="padding:5px 10px;text-align:center;border-bottom:1px solid #EDF0F2">${singleSourceChip}</td>
        <td style="padding:5px 10px;border-bottom:1px solid #EDF0F2">${verdictSequence(entry.baseline_verdicts)}</td>
        <td style="padding:5px 10px;border-bottom:1px solid #EDF0F2">${verdictSequence(entry.perturbed_verdicts)}</td>
      </tr>`;
    })
    .join('');

  return `<div style="overflow-x:auto"><table class="assay-sensitivity-table" style="border-collapse:collapse;width:100%">
  <thead>${head}</thead>
  <tbody>${rows}</tbody>
</table></div>`;
}
