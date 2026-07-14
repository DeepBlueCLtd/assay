/**
 * SPEC-10 — scenario strip component (thesis C; ui-design §S2).
 *
 * Renders a plan × commitment × scenario verdict grid: one row per plan, one
 * column group per commitment, one sub-column per toggled scenario. Each cell
 * is a four-stop verdict chip (reuses s2Matrix colour language). Collapse —
 * a verdict dropping from its BASE value under a scenario — is visually marked
 * with a downward arrow. No decimals, no robustness index, no scenario weights
 * (DEC-9/15/19; FR-005). Pure component: HTML string from data, no DOM, no
 * state (constitution I). Glow ids follow the SPEC-16 pattern.
 */
import type { CommitmentVerdict, VerdictBand } from '../generated/types.js';
import type { ScenarioVerdictTensor } from '../seam.js';

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const STOP: Record<VerdictBand, { bg: string; fg: string; label: string }> = {
  robust: { bg: '#1E6B3A', fg: '#FFFFFF', label: 'robust' },
  marginal: { bg: '#7A6A12', fg: '#FFFFFF', label: 'marginal' },
  tight: { bg: '#9A5212', fg: '#FFFFFF', label: 'tight' },
  violated: { bg: '#8A2020', fg: '#FFFFFF', label: 'violated' },
};

const VERDICT_ORDER: Record<VerdictBand, number> = {
  violated: 0, tight: 1, marginal: 2, robust: 3,
};

const marginText = (v: CommitmentVerdict): string =>
  v.margin === undefined
    ? 'no margin (objective unreachable)'
    : v.margin.lo === v.margin.hi
      ? `margin ${v.margin.lo} ${v.margin.unit}`
      : `margin ${v.margin.lo}–${v.margin.hi} ${v.margin.unit}`;

function chipCell(v: CommitmentVerdict, collapsed: boolean): string {
  const s = STOP[v.verdict];
  const arrow = collapsed ? ' ▼' : '';
  return `<td data-glow-id="vs:${esc(v.plan)}:${esc(v.commitment)}:${esc(v.scenario)}" data-glow-sig="${esc(v.verdict)}" style="padding:4px 5px;text-align:center;border-bottom:1px solid #EDF0F2">
    <span class="assay-verdict-chip" title="${esc(v.scenario)}: ${esc(marginText(v))}" style="display:inline-block;min-width:54px;padding:2px 6px;border-radius:10px;font-family:ui-monospace,monospace;font-size:10px;font-weight:700;background:${s.bg};color:${s.fg}">${s.label}${arrow}</span>
  </td>`;
}

function worstChip(planId: string, commitmentId: string, verdict: VerdictBand): string {
  const s = STOP[verdict];
  return `<td data-glow-id="vw:${esc(planId)}:${esc(commitmentId)}" data-glow-sig="${esc(verdict)}" style="padding:4px 5px;text-align:center;border-bottom:1px solid #EDF0F2;border-left:2px solid #1B2732">
    <span class="assay-verdict-chip" title="worst case across all scenarios" style="display:inline-block;min-width:54px;padding:2px 6px;border-radius:10px;font-family:ui-monospace,monospace;font-size:10px;font-weight:700;background:${s.bg};color:${s.fg}">${s.label}</span>
  </td>`;
}

export interface ScenarioStripOpts {
  planNames?: Record<string, string>; // logical_id → display name
}

export function scenarioStrip(tensor: ScenarioVerdictTensor, opts?: ScenarioStripOpts): string {
  const { scenarios, plans, commitments, verdicts, worst_case, stamps_compatible } = tensor;
  const planName = (id: string) => opts?.planNames?.[id] ?? id;

  const incompatBanner = stamps_compatible
    ? ''
    : `<div class="assay-scenario-incompat" style="background:#FFF3E0;border:1px solid #E6A817;border-radius:5px;padding:8px 12px;margin-bottom:10px;font-size:11.5px;color:#7A5500;font-family:ui-monospace,monospace">⚠ stamp lineages differ — cross-scenario comparison may be misleading (G1 comparability guard)</div>`;

  const scenarioHeaders = commitments
    .map((cid) => {
      const group = scenarios
        .map((sid) => `<th style="padding:4px 5px;font-size:9.5px;font-weight:600;color:#5B6B77;text-transform:uppercase;letter-spacing:.03em">${esc(sid)}</th>`)
        .join('');
      const worstCol = `<th style="padding:4px 5px;font-size:9.5px;font-weight:700;color:#1B2732;text-transform:uppercase;letter-spacing:.03em;border-left:2px solid #1B2732">worst</th>`;
      return group + worstCol;
    })
    .join('');

  const commitmentHeaders = commitments
    .map((cid) => `<th colspan="${scenarios.length + 1}" style="padding:5px 8px;text-align:center;font-size:10.5px;color:#1B2732;letter-spacing:.04em;border-bottom:2px solid #D8DFE4">${esc(cid)}</th>`)
    .join('');

  const head = `<tr style="text-align:center">
    <th style="padding:5px 10px;text-align:left"></th>
    ${commitmentHeaders}
  </tr>
  <tr style="text-align:center">
    <th style="padding:4px 10px;text-align:left;font-size:10px;color:#5B6B77">plan \\ scenario</th>
    ${scenarioHeaders}
  </tr>`;

  const body = plans
    .map((pid) => {
      const cells = commitments
        .map((cid) => {
          const baseVerdict = verdicts.get(`${pid}-${cid}-${scenarios[0]}`);
          const baseOrd = baseVerdict ? VERDICT_ORDER[baseVerdict.verdict] : 3;

          const scenarioCells = scenarios.map((sid) => {
            const v = verdicts.get(`${pid}-${cid}-${sid}`);
            if (!v) return `<td style="padding:4px 5px;text-align:center;color:#B0BAC2">—</td>`;
            const collapsed = VERDICT_ORDER[v.verdict] < baseOrd;
            return chipCell(v, collapsed);
          });

          const wc = worst_case.get(`${pid}-${cid}`) ?? 'robust';
          return scenarioCells.join('') + worstChip(pid, cid, wc);
        })
        .join('');
      return `<tr><td style="padding:5px 10px;font-family:ui-monospace,monospace;font-size:11px;font-weight:600;color:#1B2732;white-space:nowrap">${esc(planName(pid))}</td>${cells}</tr>`;
    })
    .join('');

  return `${incompatBanner}<div style="overflow-x:auto"><table class="assay-scenario-strip" style="border-collapse:collapse;width:100%">
  <thead>${head}</thead>
  <tbody>${body}</tbody>
</table></div>`;
}
