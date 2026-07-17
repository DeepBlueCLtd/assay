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

/**
 * SPEC-25 US3 — one "puts at risk" degradation: a NON-sacrificed commitment whose
 * verdict is worse under this candidate than under the incumbent, short of
 * violation (e.g. robust → tight). Derived from verdict deltas by the reused
 * scorer, never authored — the risk residue the violated-only `sacrificed` set
 * hides (review §3.3). `statement` is the commander's own commitment statement.
 */
export interface AtRiskDegradation {
  logical_id: string;
  from: string; // incumbent verdict word
  to: string; // candidate verdict word (worse than `from`, but not `violated`)
  statement: string;
}

export interface S3Card {
  candidate: RelaxationCandidate;
  /** The sacrificed commitments, aligned to `candidate.sacrificed` (resolved). */
  sacrificed: SacrificedCommitment[];
  /** SPEC-25 US3: commitments degraded short of violation vs the incumbent (derived). */
  at_risk?: AtRiskDegradation[];
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

/** A "puts at risk" chip: worse-but-not-failed, in command words (no decimal, G2). */
function atRiskChip(d: AtRiskDegradation): string {
  return `<span data-logical-id="${esc(d.logical_id)}" style="display:inline-flex;gap:6px;align-items:baseline;border:1px dashed #C46A1E;border-radius:4px;padding:2px 8px;background:#FBF3E8">
      <span style="font-family:ui-monospace,monospace;font-size:11px;font-weight:700;color:#8A5212">${esc(d.logical_id)}</span>
      <span style="font-family:ui-monospace,monospace;font-size:10px;color:#8A5212">${esc(d.from)} → ${esc(d.to)}</span>
    </span>`;
}

/**
 * @param cards      one per candidate, in the report's ranked (least-worst-first) order.
 * @param tie_break  the report's stated tie-break prose, if any (rendered below the set).
 * @param opts.atRiskBasis  the stated incumbent basis for the "puts at risk" line
 *                          (e.g. "vs P1 under R3m"), or a stated-absence sentence.
 */
export function s3Cards(cards: S3Card[], tie_break?: string, opts: { atRiskBasis?: string } = {}): string {
  const items = cards
    .map((card, i) => {
      const chips = card.sacrificed.map(chip).join('\n      ');
      const atRisk = card.at_risk ?? [];
      const atRiskLine =
        atRisk.length > 0
          ? `<div style="display:flex;gap:6px;align-items:baseline;flex-wrap:wrap;margin-bottom:6px">
      <span style="font-size:10.5px;text-transform:uppercase;letter-spacing:.04em;color:#8A5212;font-weight:700">puts at risk</span>
      ${atRisk.map(atRiskChip).join('\n      ')}
    </div>`
          : '';
      // Numbered, individually-traceable reasons (the matrix-game move form: a
      // claim, then enumerated reasons). Each reason carries its commitment id so
      // the one-hop trace menu opens its chain (G3). Sacrifices first (the claim's
      // strongest points), then the at-risk residue — never a decimal (G2).
      const reasons = [
        ...card.sacrificed.map(
          (c) => `<li data-logical-id="${esc(c.logical_id)}" style="margin:0">gives up: <b>${esc(c.statement)}</b> <span style="color:#8A97A0">(${esc(c.logical_id)})</span></li>`,
        ),
        ...atRisk.map(
          (d) => `<li data-logical-id="${esc(d.logical_id)}" style="margin:0">slips <b>${esc(d.from)} → ${esc(d.to)}</b> on <b>${esc(d.statement)}</b> <span style="color:#8A97A0">(${esc(d.logical_id)} — a risk, not a sacrifice)</span></li>`,
        ),
      ].join('\n        ');
      // Identity = the sacrifice set (stable across re-ranks); signature = what
      // the card shows (rank, narrative, sacrificed tiers, at-risk residue).
      const glowId = `card:${[...card.candidate.sacrificed].sort().join(',')}`;
      const atRiskSig = atRisk.map((d) => `${d.logical_id}:${d.from}>${d.to}`).join(',');
      const sig = `${i}|${card.candidate.narrative}|${card.sacrificed.map((c) => `${c.logical_id}:${c.tier}`).join(',')}|risk:${atRiskSig}`;
      return `<li data-logical-id="${esc(card.candidate.plan)}" data-glow-id="${esc(glowId)}" data-glow-sig="${esc(sig)}" style="margin:0;padding:12px 14px;border:1px solid #D8DFE4;border-radius:6px;background:#FCFDFD;list-style:none">
    <div style="display:flex;gap:8px;align-items:baseline;flex-wrap:wrap;margin-bottom:6px">
      <span style="font-family:ui-monospace,monospace;font-size:11px;color:#8A97A0">least-worst #${i + 1}</span>
      <span style="font-family:ui-monospace,monospace;font-size:11.5px;font-weight:700;color:#1B2732">${esc(card.candidate.plan)}</span>
      ${chips}
    </div>
    <div style="font-size:12.5px;color:#33424E;margin-bottom:6px">${esc(card.candidate.narrative)}</div>
    ${atRiskLine}
    <ol style="margin:0;padding-left:18px;font-size:11.5px;color:#5B6B77">
        ${reasons}
    </ol>
  </li>`;
    })
    .join('\n');
  const basis = opts.atRiskBasis
    ? `<p style="margin:8px 2px 0;font-size:11px;color:#8A97A0"><b>“Puts at risk” basis —</b> ${esc(opts.atRiskBasis)}. Derived from verdict deltas, never authored; <b>sacrificed</b> still means exactly the violated set (SPEC-09 unchanged).</p>`
    : '';
  const tie = tie_break
    ? `<p style="margin:8px 2px 0;font-size:11px;color:#8A97A0"><b>Tie-break —</b> ${esc(tie_break)}</p>`
    : '';
  return `<div class="assay-s3-cards">
  <ul style="display:grid;gap:10px;margin:0;padding:0">
${items}
  </ul>
  ${basis}
  ${tie}
</div>`;
}
