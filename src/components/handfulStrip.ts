/**
 * SPEC-08 — the handful organisation strip (seam §6; ui-design §S2).
 *
 * Renders the organiser's answer to "why is this plan one of the handful?" — one
 * row per plan with its axis signature and the DERIVED `distinct_because` reason
 * the service returned (the commitments it leads on; never a hand-authored
 * caption). It arranges projections only (constitution I): no service call, no
 * state, depends only on the returned `plans`/`organisation`. It sits above the
 * SPEC-07 S2 matrix, which renders the same handful as four-stop chips — the
 * strip explains membership, the matrix shows the verdicts.
 */
import type { Ref } from '../store.js';

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export interface HandfulStripRow {
  plan: Ref;
  name?: string; // the plan's human name (axis signature), if to hand
  distinct_because: string;
}

/**
 * @param rows  one per handful member, aligned to the service's `plans` order.
 */
export function handfulStrip(rows: HandfulStripRow[]): string {
  const items = rows
    .map((r) => {
      const id = esc(r.plan.logical_id);
      const name = r.name ? `<span style="color:#5B6B77;font-size:11.5px">${esc(r.name)}</span>` : '';
      return `<li style="margin:0;padding:9px 12px;border:1px solid #D8DFE4;border-radius:6px;background:#FCFDFD;list-style:none">
    <div style="display:flex;gap:8px;align-items:baseline;flex-wrap:wrap">
      <span style="font-family:ui-monospace,monospace;font-size:11.5px;font-weight:700;color:#1B2732">${id}</span>
      ${name}
    </div>
    <div style="margin-top:4px;font-size:12px;color:#33424E">${esc(r.distinct_because)}</div>
  </li>`;
    })
    .join('\n');
  return `<ul class="assay-handful-strip" style="display:grid;gap:8px;margin:0;padding:0">
${items}
</ul>`;
}
