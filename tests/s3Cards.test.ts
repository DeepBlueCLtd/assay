/**
 * SPEC-25 US3 — the S3 least-worst cards v2 (research note 13 §4).
 *
 * The "puts at risk" line and numbered reasons render correctly when residue
 * exists (constructed here, since Meridian's candidates are Pareto-clean). The
 * derivation is additive: `sacrificed` semantics are unchanged.
 */
import { describe, expect, it } from 'vitest';
import { s3Cards, type S3Card } from '../src/components/s3Cards.js';
import type { RelaxationCandidate } from '../src/generated/types.js';

const candidate = (plan: string, sacrificed: string[], narrative: string): RelaxationCandidate => ({
  plan,
  sacrificed,
  narrative,
});

describe('SPEC-25 US3 — relaxation cards v2', () => {
  const cards: S3Card[] = [
    {
      candidate: candidate('RX-A', ['C4', 'C5'], 'Parallel sweep — the causeway is already down.'),
      sacrificed: [
        { logical_id: 'C4', tier: 'should', statement: 'keep the amphibious group out of threatened water' },
        { logical_id: 'C5', tier: 'prefer', statement: 'take the Ledger causeway intact' },
      ],
      at_risk: [
        { logical_id: 'C3', from: 'robust', to: 'tight', statement: 'no fires into the populated port district' },
      ],
    },
  ];

  const html = s3Cards(cards, 'C3/C4 same-tier tie broken by id', { atRiskBasis: 'vs P1 under R3m' });

  it('renders the derived "puts at risk" line with word-to-word verdict movement (no decimal, G2)', () => {
    expect(html).toMatch(/puts at risk/i);
    expect(html).toContain('robust → tight');
    // No decimal on the card face (CSS px sizes stripped — G2 is about visible content).
    expect(html.replace(/style="[^"]*"/g, '')).not.toMatch(/\d+\.\d+/);
  });

  it('a degraded-but-not-violated commitment is at-risk, NOT sacrificed (sacrificed = violated only)', () => {
    // C3 appears in the at-risk line…
    expect(html).toMatch(/C3[\s\S]*robust → tight/);
    // …but the sacrificed chips are exactly C4 and C5 (the violated set, unchanged).
    const sacChips = [...html.matchAll(/font-weight:700;color:#B23A48[^>]*>(C\d)/g)].map((m) => m[1]);
    // (chip tint keys by tier, so assert the sacrificed statements instead)
    expect(html).toMatch(/gives up:.*out of threatened water.*\(C4\)/);
    expect(html).toMatch(/gives up:.*causeway intact.*\(C5\)/);
    expect(html).not.toMatch(/gives up:.*port district.*\(C3\)/); // C3 is at-risk, never "given up"
    void sacChips;
  });

  it('reasons render as a numbered, individually trace-walkable list (G3)', () => {
    expect(html).toContain('<ol');
    expect(html).toContain('data-logical-id="C4"'); // sacrificed reason
    expect(html).toContain('data-logical-id="C3"'); // at-risk reason
    expect(html).toMatch(/slips <b>robust → tight<\/b>/);
  });

  it('states the incumbent basis and reaffirms sacrificed semantics', () => {
    expect(html).toMatch(/basis —<\/b> vs P1 under R3m/);
    expect(html).toMatch(/sacrificed.*means exactly the violated set/);
  });

  it('a card with no residue renders no at-risk line (honest empty — Meridian is Pareto-clean)', () => {
    const clean: S3Card[] = [
      {
        candidate: candidate('RX-B', ['C2', 'C5'], 'Sequential sweep — the strait opens two days late.'),
        sacrificed: [
          { logical_id: 'C2', tier: 'must', statement: 'open the strait by D+7' },
          { logical_id: 'C5', tier: 'prefer', statement: 'take the causeway intact' },
        ],
      },
    ];
    const cleanHtml = s3Cards(clean);
    expect(cleanHtml).not.toMatch(/puts at risk/i);
  });
});
