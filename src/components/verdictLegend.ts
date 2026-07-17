/**
 * SPEC-25 US1 — the public verdict legend (research note `14-legibility.md` §3).
 *
 * The four-stop verdict mapping laid open, CRT-style (the hex-wargame Combat
 * Results Table: the mapping from inputs to outcome on the rulebook page, never a
 * hidden judgement). Renders the four verdicts as REGIONS of the signed-margin
 * sign rule and illustrates the mapping's honesty property with the FROZEN oracle
 * O-3 sweep — the verdict changes only at the band edges 9 and 13, never inside.
 *
 * Oracle-derived, never live-derived: the illustration is computed from the
 * frozen O-3 constants through the SAME `marginBand`/`verdictFor` the scorer uses
 * (via `src/verdictMap.ts`), so a change to it is a register/oracle matter, not a
 * data event (FR-001). It renders a MAPPING, never a score (DEC-19): the regions
 * are labelled by their sign condition, with no scale and no distance headline.
 *
 * Pure and self-contained (SPEC-14 extractable): depends only on generated types
 * and the pure verdict mapping. Obeys `data-projection="wall"` like every
 * component (SPEC-17); display-only, never content-addressed.
 */
import type { VerdictBand } from '../generated/types.js';
import { oracleO3Sweep, ORACLE_O3 } from '../verdictMap.js';

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** One colour language across every surface — the same stops the matrix renders. */
const STOP: Record<VerdictBand, { bg: string; label: string; condition: string; gloss: string }> = {
  robust: {
    bg: '#1E6B3A',
    label: 'robust',
    condition: 'm_lo > 0',
    gloss: 'the worst case still satisfies, with room — above the band, decisively fine',
  },
  marginal: {
    bg: '#7A6A12',
    label: 'marginal',
    condition: 'm_lo = 0 ≤ m_hi',
    gloss: 'the worst case sits exactly on the line — the boundary verdict',
  },
  tight: {
    bg: '#9A5212',
    label: 'tight',
    condition: 'm_lo < 0 ≤ m_hi',
    gloss: 'the band straddles the line — neither definitely fine nor definitely failed',
  },
  violated: {
    bg: '#8A2020',
    label: 'violated',
    condition: 'm_hi < 0',
    gloss: 'even the best case already fails — below the band, decisively failed',
  },
};

/** The mapping order, worst-margin ascending (the sweep's own order): violated → robust. */
const ORDER: VerdictBand[] = ['violated', 'tight', 'marginal', 'robust'];

function regionRows(): string {
  return ORDER.map((v) => {
    const s = STOP[v];
    return `<tr>
      <td style="padding:4px 8px"><span style="display:inline-block;min-width:66px;padding:2px 8px;border-radius:11px;font-family:ui-monospace,monospace;font-size:10.5px;font-weight:700;background:${s.bg};color:#fff;text-align:center">${s.label}</span></td>
      <td style="padding:4px 8px;font-family:ui-monospace,monospace;font-size:11px;color:#1B2732;white-space:nowrap">${esc(s.condition)}</td>
      <td style="padding:4px 8px;font-size:11px;color:#5B6B77">${esc(s.gloss)}</td>
    </tr>`;
  }).join('');
}

function sweepCells(): string {
  return oracleO3Sweep()
    .map(({ threshold, verdict }) => {
      const s = STOP[verdict];
      const edge = threshold === ORACLE_O3.value.lo || threshold === ORACLE_O3.value.hi;
      return `<td style="padding:3px 5px;text-align:center;border:1px solid #E4E9ED${edge ? ';outline:2px solid #1B2732;outline-offset:-2px' : ''}">
        <div style="font-family:ui-monospace,monospace;font-size:10px;color:#5B6B77">T=${threshold}${edge ? ' ◆' : ''}</div>
        <div style="margin-top:2px"><span style="display:inline-block;padding:1px 5px;border-radius:8px;font-family:ui-monospace,monospace;font-size:9.5px;font-weight:700;background:${s.bg};color:#fff">${s.label}</span></div>
      </td>`;
    })
    .join('');
}

/**
 * The verdict legend, as a collapsible <details> so surfaces stay clean until the
 * reader asks "why this word?". `open` renders it expanded (for a standalone
 * gallery moment).
 */
export function verdictLegend(opts: { open?: boolean } = {}): string {
  const v = ORACLE_O3.value;
  return `<details class="assay-verdict-legend" ${opts.open ? 'open' : ''} style="margin:8px 0;border:1px solid #C8D2DA;border-radius:6px;padding:6px 12px;background:#FBFCFD">
  <summary style="cursor:pointer;font-size:11.5px;color:#1B2732;font-weight:700">Verdict legend — how a margin band becomes one of four words (the mapping, laid open)</summary>
  <div style="margin-top:8px">
    <p style="font-size:11.5px;color:#33424E;margin:0 0 6px">A commitment reduces to a <b>signed margin band</b> — satisfied when the margin is ≥ 0, its low endpoint the worst case. The four-stop verdict is read off the <b>signs of that band's endpoints only</b> — no midpoint, no interior cut, no score (DEC-15/19). It is a lookup, like a wargame's Combat Results Table: inspectable, never a hidden judgement.</p>
    <table style="border-collapse:collapse;width:100%;margin-bottom:10px">
      <thead><tr style="text-align:left;color:#5B6B77;font-size:10px;text-transform:uppercase;letter-spacing:.04em"><th style="padding:0 8px 4px">verdict</th><th style="padding:0 8px 4px">when</th><th style="padding:0 8px 4px">meaning</th></tr></thead>
      <tbody>${regionRows()}</tbody>
    </table>
    <p style="font-size:11.5px;color:#33424E;margin:0 0 5px">The mapping's honesty property, shown not asserted — the frozen oracle <b>O-3</b> sweep: <span style="font-family:ui-monospace,monospace">strait_open_step [${v.lo},${v.hi}]</span> against <span style="font-family:ui-monospace,monospace">at_most&nbsp;T</span>, T swept ${ORACLE_O3.sweep[0]}→${ORACLE_O3.sweep[ORACLE_O3.sweep.length - 1]!}. The verdict changes <b>only at the band edges ${v.lo} and ${v.hi}</b> (◆), never strictly inside:</p>
    <table style="border-collapse:collapse;margin-bottom:8px"><tbody><tr>${sweepCells()}</tr></tbody></table>
    <p style="font-size:10.5px;color:#8091A0;margin:0"><b>Footnote —</b> <span style="font-family:ui-monospace,monospace">marginal</span> fires only when the worst-case margin sits <i>exactly</i> on the line (m_lo = 0) — a coincidence of band edge and threshold that, in a continuous domain, is <b>measure-zero</b>. It is the boundary verdict at the upper band edge, never an interior transition. The illustration derives from the frozen O-3 constants, not live data — a change to it is a register/oracle matter.</p>
  </div>
</details>`;
}
