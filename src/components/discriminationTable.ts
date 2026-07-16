/**
 * SPEC-12 — discrimination ranking table (thesis D; ui-design §S6-disc).
 *
 * Renders the COA-pair separation ranking as a table: one row per open question,
 * ranked by discrimination value (already sorted by the service). Each row shows
 * the question logical_id, the separation bands, the collection cost band,
 * per-pair separation chips, and the expected-answer bands the separations were
 * read from. Positive separation (disjoint expected-answer bands) is green;
 * negative (overlapping) is amber/red. Cost and value are shown alongside, never
 * collapsed (DEC-19). Pure component: HTML string from data, no DOM, no state
 * (constitution I). Glow ids follow the SPEC-16 pattern.
 *
 * SPEC-23 (v2, research note 08 §7): a mode line states how the ranking is
 * conditioned — the operative pairs with their witnesses, or the honest
 * fallback/degenerate statement. In operative mode an "operative separation"
 * column leads and operative pair chips are marked. Every pair carries its
 * three-way classification word + mark (✓ discriminates / ~ could / ✕ cannot),
 * legend-keyed. Expected bands render with their provenance chips (G3 applies
 * to the event matrix, not just through it); a provenance-less row is marked,
 * never silently bare.
 */
import type { Band, ExpectedAnswer } from '../generated/types.js';
import type { CoaPairSeparation, DiscriminationEntry, DiscriminationSuccess, OperativePairs, SeparationClass } from '../seam.js';
import { provenanceChip } from './provenanceChip.js';

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

/** The classification word + mark, legend-keyed (note 08 §7.2). */
const CLASS_LABEL: Record<SeparationClass, { mark: string; word: string; fg: string; bg: string }> = {
  disjoint: { mark: '✓', word: 'discriminates', fg: '#1E6B3A', bg: '#E4F0E8' },
  partial: { mark: '~', word: 'weak — could discriminate', fg: '#7A6A12', bg: '#F5F0DC' },
  nested: { mark: '✕', word: 'cannot discriminate', fg: '#8A2020', bg: '#F6E4E4' },
};

function classChip(c: SeparationClass): string {
  const l = CLASS_LABEL[c];
  return `<span data-separation-class="${c}" style="display:inline-block;padding:1px 6px;border-radius:8px;font-family:ui-monospace,monospace;font-size:9.5px;font-weight:600;background:${l.bg};color:${l.fg};margin:1px 2px">${l.mark} ${esc(l.word)}</span>`;
}

function pairChip(pair: CoaPairSeparation): string {
  const operativeTag = pair.operative
    ? `<span style="font-family:ui-monospace,monospace;font-size:9px;font-weight:700;color:#3E5D8A;background:#EAF0F7;border:1px solid #C9D7E8;border-radius:3px;padding:0 4px">operative</span>`
    : '';
  const label = `${esc(pair.coa_a)}↔${esc(pair.coa_b)}`;
  return `<span data-pair="${esc(pair.coa_a)}-${esc(pair.coa_b)}" style="display:inline-flex;align-items:center;gap:3px;margin:2px 0"><span style="font-family:ui-monospace,monospace;font-size:9.5px;color:#5B6B77">${label}</span>${separationChip(pair.separation)}${classChip(pair.classification)}${operativeTag}</span>`;
}

/** Expected-answer bands with their provenance chips — G3 applies to the matrix itself (SPEC-23). */
function expectedBlock(expected: ExpectedAnswer[]): string {
  const rows = expected
    .map((ea) => {
      const chip = ea.provenance
        ? provenanceChip(ea.provenance)
        : `<span style="font-family:ui-monospace,monospace;font-size:9.5px;color:#A33131;background:#F8E2E2;border:1px solid #EFC6C6;border-radius:3px;padding:1px 5px">no provenance — expectation unattributed</span>`;
      return `<div data-expected-coa="${esc(ea.coa)}" style="display:flex;align-items:center;gap:4px;margin:2px 0;flex-wrap:wrap"><span style="font-family:ui-monospace,monospace;font-size:9.5px;font-weight:600;color:#1B2732">${esc(ea.coa)}</span>${bandPill(ea.band)}${chip}</div>`;
    })
    .join('');
  return `<details style="margin-top:3px"><summary style="cursor:pointer;font-size:10px;color:#3E5D8A">expected answers (who says the COA would look like that)</summary><div style="margin-top:3px">${rows}</div></details>`;
}

/** The operative pairs and their witnesses, in words ("operative: R1↔R2 — P1's C1, C2 turn on it"). */
function operativeLine(operative: OperativePairs): string {
  const parts = operative.pairs.map((p) => {
    const byPlan = new Map<string, string[]>();
    for (const e of p.evidence) {
      const list = byPlan.get(e.plan) ?? [];
      if (!list.includes(e.commitment)) list.push(e.commitment);
      byPlan.set(e.plan, list);
    }
    const witnesses = [...byPlan.entries()]
      .map(([plan, commitments]) => `${esc(plan)}'s ${commitments.map(esc).join(', ')}`)
      .join('; ');
    return `<span data-operative-pair="${esc(p.a)}-${esc(p.b)}" style="display:inline-block;margin-right:10px"><strong>${esc(p.a)}↔${esc(p.b)}</strong> — ${witnesses} turn on it</span>`;
  });
  return `operative: ${parts.join(' ')}`;
}

export interface DiscriminationTableOpts {
  mode?: DiscriminationSuccess['mode'] | undefined;
  statement?: string | undefined;
  operative?: OperativePairs | undefined;
}

export function discriminationTable(ranking: DiscriminationEntry[], opts: DiscriminationTableOpts = {}): string {
  const mode = opts.mode ?? 'all_pairs';

  // The mode line — how the ranking is conditioned, or the honest fallback.
  // Never silent: a fallback or degenerate state states itself (FR-006).
  const lines: string[] = [];
  if (mode === 'operative' && opts.operative) {
    lines.push(
      `<div class="assay-discrimination-mode" data-mode="operative" style="font-family:ui-monospace,monospace;font-size:10.5px;color:#3E5D8A;background:#EAF0F7;border:1px solid #C9D7E8;border-radius:4px;padding:4px 8px;margin-bottom:6px">${operativeLine(opts.operative)}</div>`,
    );
  }
  if (opts.statement) {
    lines.push(
      `<div class="assay-discrimination-statement" data-mode="${esc(mode)}" style="font-family:ui-monospace,monospace;font-size:10.5px;color:#5B6B77;background:#F1F3F5;border:1px solid #D8DFE4;border-radius:4px;padding:4px 8px;margin-bottom:6px">${esc(opts.statement)}</div>`,
    );
  }

  if (ranking.length === 0) {
    const empty = '<div style="font-family:ui-monospace,monospace;font-size:11px;color:#5B6B77;padding:8px">No discrimination data.</div>';
    return lines.join('') + empty;
  }

  const th = (label: string, center = false): string =>
    `<th style="padding:5px 10px;font-size:10px;color:#5B6B77;border-bottom:2px solid #D8DFE4${center ? ';text-align:center' : ''}">${label}</th>`;

  const operativeCol = mode === 'operative';
  const head = `<tr style="text-align:left">
    ${th('Question ID')}
    ${operativeCol ? th('Operative Separation', true) : ''}
    ${th(operativeCol ? 'Best Separation (all pairs)' : 'Best Separation', true)}
    ${th('Cost', true)}
    ${th('Per-pair Separation')}
  </tr>`;

  const rows = ranking
    .map((entry) => {
      const logicalId = entry.question.logical_id;
      const pairChips = entry.pairs.map(pairChip).join('<br>');
      const operativeCell = operativeCol
        ? `<td style="padding:5px 10px;text-align:center;border-bottom:1px solid #EDF0F2">${
            entry.operative_best
              ? separationChip(entry.operative_best)
              : '<span style="font-family:ui-monospace,monospace;font-size:9.5px;color:#8A2020">no could-discriminate operative pair</span>'
          }</td>`
        : '';
      const glowSig = `${mode}:${entry.operative_best ? `${entry.operative_best.lo}` : ''}:${entry.best_separation.lo}`;
      return `<tr data-logical-id="${esc(logicalId)}" data-glow-id="disc:${esc(logicalId)}" data-glow-sig="${esc(glowSig)}">
        <td style="padding:5px 10px;font-family:ui-monospace,monospace;font-size:11px;font-weight:600;color:#1B2732;border-bottom:1px solid #EDF0F2;white-space:nowrap;vertical-align:top">${esc(logicalId)}</td>
        ${operativeCell}
        <td style="padding:5px 10px;text-align:center;border-bottom:1px solid #EDF0F2;vertical-align:top">${separationChip(entry.best_separation)}</td>
        <td style="padding:5px 10px;text-align:center;border-bottom:1px solid #EDF0F2;vertical-align:top">${bandPill(entry.cost)}</td>
        <td style="padding:5px 10px;border-bottom:1px solid #EDF0F2">${pairChips}${expectedBlock(entry.expected_answers)}</td>
      </tr>`;
    })
    .join('');

  return `${lines.join('')}<div style="overflow-x:auto"><table class="assay-discrimination-table" style="border-collapse:collapse;width:100%">
  <thead>${head}</thead>
  <tbody>${rows}</tbody>
</table></div>`;
}
