import { describe, expect, it } from 'vitest';
import type { CommitmentVerdict } from '../src/generated/types.js';
import { s2Matrix, type S2Cell } from '../src/components/s2Matrix.js';

const V = (commitment: string, verdict: CommitmentVerdict['verdict'], margin?: { lo: number; hi: number; unit: string }): CommitmentVerdict => ({
  logical_id: `V-P1-${commitment}-BASE`,
  version: 1,
  plan: 'P1',
  commitment,
  scenario: 'BASE',
  world_stamp: 'abc',
  verdict,
  engine_version: '0.1.0',
  ...(margin ? { margin } : {}),
});

const rows: S2Cell[] = [
  {
    plan: 'P1',
    verdicts: [
      V('C1', 'robust', { lo: 8, hi: 8, unit: 'step' }),
      V('C2', 'robust', { lo: 6, hi: 6, unit: 'step' }),
      V('C3', 'marginal', { lo: 0, hi: 0, unit: 'district cells fired upon' }),
      V('C4', 'tight', { lo: -24, hi: 0, unit: 'band-hours' }),
      V('C5', 'marginal'),
      V('C6', 'robust', { lo: 8, hi: 8, unit: 'step' }),
    ],
  },
];

describe('s2Matrix — the honest matrix (ui-design §2)', () => {
  const html = s2Matrix(['C1', 'C2', 'C3', 'C4', 'C5', 'C6'], rows);

  it('renders a four-stop chip per cell', () => {
    for (const stop of ['robust', 'marginal', 'tight']) {
      expect(html).toContain(`>${stop}</span>`);
    }
    expect((html.match(/assay-verdict-chip/g) ?? []).length).toBe(6);
  });

  it('shows the margin band only on hover (a title), never as a decimal in the cell face', () => {
    expect(html).toContain('title="margin -24–0 band-hours"'); // C4 margin on hover
    // the cell FACE carries only the four-stop word — no numeric margin leaks into it
    const faces = [...html.matchAll(/assay-verdict-chip[^>]*>([^<]*)</g)].map((m) => m[1]);
    for (const face of faces) {
      expect(face).not.toMatch(/\d/); // no digit in any verdict cell face (G2, no decimals)
      expect(['robust', 'marginal', 'tight', 'violated']).toContain(face);
    }
  });

  it('places columns in the given commitment order', () => {
    const order = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'].map((c) => html.indexOf(`>${c}</th>`));
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(order.every((i) => i >= 0)).toBe(true);
  });
});
