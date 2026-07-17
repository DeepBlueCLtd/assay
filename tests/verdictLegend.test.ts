/**
 * SPEC-25 US1 — the public verdict legend (research note 14 §3).
 *
 * The four-stop mapping laid open, oracle-derived: the legend renders the four
 * regions of the signed-margin sign rule and illustrates the honesty property
 * with the FROZEN oracle O-3 sweep. A change to it is a register/oracle matter,
 * not a data event — so it is pinned here against the same constants the oracle
 * test pins independently.
 */
import { describe, expect, it } from 'vitest';
import { verdictLegend } from '../src/components/verdictLegend.js';
import { oracleO3Sweep, ORACLE_O3 } from '../src/verdictMap.js';
import type { VerdictBand } from '../src/generated/types.js';

describe('SPEC-25 US1 — the verdict legend, oracle-derived', () => {
  const html = verdictLegend();

  it('renders the four verdict regions with their sign conditions', () => {
    for (const stop of ['robust', 'marginal', 'tight', 'violated']) {
      expect(html).toContain(`>${stop}</span>`);
    }
    // The sign rules, verbatim — the mapping, not a score.
    expect(html).toContain('m_lo &gt; 0'); // robust
    expect(html).toContain('m_lo = 0 ≤ m_hi'); // marginal
    expect(html).toContain('m_lo &lt; 0 ≤ m_hi'); // tight
    expect(html).toContain('m_hi &lt; 0'); // violated
  });

  it('illustrates with the frozen O-3 sweep [9,13] × at_most T over 8→14', () => {
    // The oracle constants themselves (not live data).
    expect(ORACLE_O3.value).toEqual({ lo: 9, hi: 13, unit: 'step' });
    expect(ORACLE_O3.comparator).toBe('at_most');
    expect(ORACLE_O3.sweep).toEqual([8, 9, 10, 11, 12, 13, 14]);

    // The sweep, computed through the SAME pinned mapping the scorer uses.
    const seq = oracleO3Sweep().map((s) => s.verdict);
    expect(seq).toEqual<VerdictBand[]>([
      'violated', 'tight', 'tight', 'tight', 'tight', 'marginal', 'robust',
    ]);

    // The illustration is in the rendered legend (band edges 9 and 13 present).
    expect(html).toContain('[9,13]');
    expect(html).toContain('T=9');
    expect(html).toContain('T=13');
  });

  it('carries the marginal-is-measure-zero footnote', () => {
    expect(html).toMatch(/measure-zero/i);
    expect(html).toMatch(/boundary verdict/i);
    // The verdict changes only at the band edges — asserted honesty property.
    expect(html).toMatch(/only at the band edges/i);
  });

  it('is a mapping, not a score — no urgency/percentage scalar (DEC-19)', () => {
    // No numeric scalar the reader could mistake for "how robust": no percentage,
    // no "score: N", no urgency/priority number. CSS (width:100% etc.) stripped —
    // G2/DEC-19 is about visible content. ("score" appears only in "no score".)
    const content = html.replace(/style="[^"]*"/g, '');
    expect(content).not.toMatch(/\d+\s*%/);
    expect(content).not.toMatch(/score:\s*\d/i);
    expect(content).not.toMatch(/\burgency\b|priority:\s*\d/i);
  });
});
