/**
 * SPEC-09 — the S3 least-worst cards (seam §7; ui-design §S3).
 *
 * Renders a `RelaxationReport` as one card per candidate: what it gives up
 * (`sacrificed` — commitment ids, tiers, and the commander's own statements) and
 * the `narrative` in command language, ranked least-worst first, with the report's
 * stated `tie_break` note below the set. It arranges projections only
 * (constitution I): no service call, no state, depends only on the returned report
 * (and the commitment statements handed in for legibility). The card face carries
 * NO decimal and NO verdict-internal token (`margin`, `m_lo`) — the sacrifice is an
 * argument in command language, and the banded margin stays in the trace drawer (G2).
 */
import type { RelaxationCandidate } from '../generated/types.js';

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** One sacrificed commitment, resolved for legibility (statement + tier). */
export interface SacrificedCommitment {
  logical_id: string;
  tier: string; // must | should | prefer
  statement: string;
}

export interface S3Card {
  candidate: RelaxationCandidate;
  /** The sacrificed commitments, aligned to `candidate.sacrificed` (resolved). */
  sacrificed: SacrificedCommitment[];
}

const TIER_TINT: Record<string, string> = {
  must: '#B23A48', // giving up a must is the gravest
  should: '#C46A1E',
  prefer: '#5B6B77',
};

function chip(c: SacrificedCommitment): string {
  const tint = TIER_TINT[c.tier] ?? '#5B6B77';
  return `<span style="display:inline-flex;gap:6px;align-items:baseline;border:1px solid ${tint};border-radius:4px;padding:2px 8px;background:#FFF">
      <span style="font-family:ui-monospace,monospace;font-size:11px;font-weight:700;color:${tint}">${esc(c.logical_id)}</span>
      <span style="font-size:10px;text-transform:uppercase;letter-spacing:.04em;color:${tint}">${esc(c.tier)}</span>
    </span>`;
}

/**
 * @param cards      one per candidate, in the report's ranked (least-worst-first) order.
 * @param tie_break  the report's stated tie-break prose, if any (rendered below the set).
 */
export function s3Cards(cards: S3Card[], tie_break?: string): string {
  const items = cards
    .map((card, i) => {
      const chips = card.sacrificed.map(chip).join('\n      ');
      const statements = card.sacrificed
        .map((c) => `<li style="margin:0">gives up: <b>${esc(c.statement)}</b> <span style="color:#8A97A0">(${esc(c.logical_id)})</span></li>`)
        .join('\n        ');
      return `<li style="margin:0;padding:12px 14px;border:1px solid #D8DFE4;border-radius:6px;background:#FCFDFD;list-style:none">
    <div style="display:flex;gap:8px;align-items:baseline;flex-wrap:wrap;margin-bottom:6px">
      <span style="font-family:ui-monospace,monospace;font-size:11px;color:#8A97A0">least-worst #${i + 1}</span>
      <span style="font-family:ui-monospace,monospace;font-size:11.5px;font-weight:700;color:#1B2732">${esc(card.candidate.plan)}</span>
      ${chips}
    </div>
    <div style="font-size:12.5px;color:#33424E;margin-bottom:6px">${esc(card.candidate.narrative)}</div>
    <ul style="margin:0;padding-left:18px;font-size:11.5px;color:#5B6B77">
        ${statements}
    </ul>
  </li>`;
    })
    .join('\n');
  const tie = tie_break
    ? `<p style="margin:8px 2px 0;font-size:11px;color:#8A97A0"><b>Tie-break —</b> ${esc(tie_break)}</p>`
    : '';
  return `<div class="assay-s3-cards">
  <ul style="display:grid;gap:10px;margin:0;padding:0">
${items}
  </ul>
  ${tie}
</div>`;
}
