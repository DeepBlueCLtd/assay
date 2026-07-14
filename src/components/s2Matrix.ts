/**
 * SPEC-07 — S2 planner verdict matrix, "the honest matrix" (ui-design §2, §S2).
 *
 * Renders plans × commitments as a grid of four-stop chips — robust / marginal /
 * tight / violated, one colour language, no decimals in any cell (DEC-9). The
 * `margin` Band appears only on demand (a hover title), never as a headline
 * number (knowledge model §108; G2). Framework-free HTML string; depends only on
 * generated types and the scorer's verdict objects; calls no service and holds
 * no state (constitution I — it arranges projections only). A verdict cell links
 * conceptually to its trace chain (the `scored_from` edge the scorer wrote); the
 * click-through surface is the S3 why-chain (a later slice).
 */
import type { Band, CommitmentVerdict, VerdictBand } from '../generated/types.js';

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** One colour language across every surface (ui-design §2). */
const STOP: Record<VerdictBand, { bg: string; fg: string; label: string }> = {
  robust: { bg: '#1E6B3A', fg: '#FFFFFF', label: 'robust' },
  marginal: { bg: '#7A6A12', fg: '#FFFFFF', label: 'marginal' },
  tight: { bg: '#9A5212', fg: '#FFFFFF', label: 'tight' },
  violated: { bg: '#8A2020', fg: '#FFFFFF', label: 'violated' },
};

const marginText = (m?: Band): string =>
  m === undefined
    ? 'no margin (objective unreachable)'
    : m.lo === m.hi
      ? `margin ${m.lo} ${m.unit}`
      : `margin ${m.lo}–${m.hi} ${m.unit}`;

function chip(v: CommitmentVerdict): string {
  const s = STOP[v.verdict];
  // The margin band rides on the hover title — shown only on demand, never a
  // decimal in the cell face (G2). The cell face is the four-stop word alone.
  // Glow signature is the four-stop CATEGORY only (the visible face): a cell
  // glows when its verdict *flips*, not when an unrelated re-stamp moves the
  // hidden margin — matches "no decimals on the face" (G2).
  return `<td data-glow-id="v:${esc(v.plan)}:${esc(v.commitment)}" data-glow-sig="${esc(v.verdict)}" style="padding:5px 7px;text-align:center;border-bottom:1px solid #EDF0F2">
    <span class="assay-verdict-chip" title="${esc(marginText(v.margin))}" style="display:inline-block;min-width:66px;padding:3px 8px;border-radius:11px;font-family:ui-monospace,monospace;font-size:10.5px;font-weight:700;background:${s.bg};color:${s.fg}">${s.label}</span>
  </td>`;
}

export interface S2Cell {
  plan: string;
  verdicts: CommitmentVerdict[];
}

/**
 * @param commitmentIds  column order (e.g. ['C1','C2','C3','C4','C5','C6'])
 * @param rows           one entry per plan, its verdict objects (any order)
 */
export function s2Matrix(commitmentIds: string[], rows: S2Cell[]): string {
  const head = `<tr style="text-align:center;color:#5B6B77;font-size:10.5px;text-transform:uppercase;letter-spacing:.04em">
    <th style="padding:6px 10px;text-align:left">plan \\ commitment</th>
    ${commitmentIds.map((c) => `<th data-logical-id="${esc(c)}" style="padding:6px 8px;cursor:pointer;text-decoration:underline dotted">${esc(c)}</th>`).join('')}
  </tr>`;
  const body = rows
    .map((row) => {
      const byCommitment = new Map(row.verdicts.map((v) => [v.commitment, v]));
      const cells = commitmentIds
        .map((cid) => {
          const v = byCommitment.get(cid);
          return v ? chip(v) : `<td style="padding:5px 7px;text-align:center;color:#B0BAC2">—</td>`;
        })
        .join('');
      const planId = row.plan.split(' ')[0] ?? row.plan;
      return `<tr data-logical-id="${esc(planId)}"><td style="padding:6px 10px;font-family:ui-monospace,monospace;font-size:11px;font-weight:600;color:#1B2732">${esc(row.plan)}</td>${cells}</tr>`;
    })
    .join('');
  return `<table class="assay-s2-matrix" style="border-collapse:collapse;width:100%">
  <thead>${head}</thead>
  <tbody>${body}</tbody>
</table>`;
}
