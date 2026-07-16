/**
 * SPEC-22 — the scenario strip's attention block (research note
 * docs/research/11-attention.md §5; spec US1).
 *
 * The likelihood bands render ABOVE the verdict grid, under the interval
 * order: R1 strictly above the level, visibly overlapping {R2, R3}; every
 * value banded via the shared 0–100 % track; provenance welded on (DEC-9);
 * the attention-only label persistent; and the verdict grid itself
 * byte-identical with or without the block — likelihood moves nothing but
 * position and emphasis in the attention layer.
 */
import { describe, expect, it } from 'vitest';
import type { Band, CommitmentVerdict, Provenance } from '../src/generated/types.js';
import type { ScenarioVerdictTensor } from '../src/seam.js';
import { scenarioStrip, type ScenarioLikelihood } from '../src/components/scenarioStrip.js';

const pct = (lo: number, hi: number): Band => ({ lo, hi, unit: '%' });

const j2: Provenance = {
  source_class: 'assessed',
  confidence: 'moderate',
  owner: 'J-2 fusion',
  single_source: false,
  collected_at: 2,
};

const verdict = (plan: string, commitment: string, scenario: string): CommitmentVerdict => ({
  logical_id: `V-${plan}-${commitment}-${scenario}`,
  version: 1,
  plan,
  commitment,
  scenario,
  verdict: 'robust',
  world_stamp: 'w1',
  engine_version: '0.2.0',
  margin: { lo: 5, hi: 9, unit: 'steps' },
});

function makeTensor(): ScenarioVerdictTensor {
  const scenarios = ['BASE', 'R1', 'R2', 'R3'];
  const verdicts = new Map<string, CommitmentVerdict>();
  for (const s of scenarios) verdicts.set(`P1-C1-${s}`, verdict('P1', 'C1', s));
  return {
    scenarios,
    plans: ['P1'],
    commitments: ['C1'],
    verdicts,
    worst_case: new Map([['P1-C1', 'robust']]),
    stamps_compatible: true,
  };
}

const meridianLikelihoods: ScenarioLikelihood[] = [
  { scenario: 'R1', name: 'Fortress Halcyon', logical_id: 'K14a', band: pct(45, 70), provenance: j2 },
  { scenario: 'R2', name: 'Strait Denial', logical_id: 'K14b', band: pct(20, 40), provenance: j2 },
  { scenario: 'R3', name: 'Spoiling Withdrawal', logical_id: 'K14c', band: pct(10, 25), provenance: j2 },
];

describe('scenarioStrip — the attention block (SPEC-22)', () => {
  it('renders R1 strictly above a level {R2, R3} — structurally, as stacked layers', () => {
    const html = scenarioStrip(makeTensor(), { likelihoods: meridianLikelihoods });
    const layer0 = html.match(/<div class="assay-attention-layer" data-attention-layer="0"[\s\S]*?(?=<div class="assay-attention-layer" data-attention-layer="1")/)?.[0];
    const layer1 = html.match(/<div class="assay-attention-layer" data-attention-layer="1"[\s\S]*$/)?.[0];
    expect(layer0).toBeTruthy();
    expect(layer1).toBeTruthy();
    expect(layer0).toContain('R1 · Fortress Halcyon');
    expect(layer0).not.toContain('R2');
    expect(layer1).toContain('R2 · Strait Denial');
    expect(layer1).toContain('R3 · Spoiling Withdrawal');
    // The level pair is named as honestly unranked.
    expect(layer1).toContain('level — bands overlap; honestly unranked');
  });

  it('every likelihood is a band on the shared 0–100 track — no scalar, no midpoint, no sort key', () => {
    const html = scenarioStrip(makeTensor(), { likelihoods: meridianLikelihoods });
    expect(html).toContain('45–70 %');
    expect(html).toContain('20–40 %');
    expect(html).toContain('10–25 %');
    // No midpoint of any band appears anywhere (57.5, 30, 17.5).
    expect(html).not.toMatch(/57\.5|17\.5/);
    // No sort-key attribute exists — ordering is structural (layer nesting only).
    expect(html).not.toMatch(/data-(sort|rank|order|weight)/);
  });

  it('the attention-only label is persistent and provenance is welded on (DEC-9)', () => {
    const html = scenarioStrip(makeTensor(), { likelihoods: meridianLikelihoods });
    expect(html).toContain('orders attention — never compiles');
    expect(html).toContain('assessment, not fact');
    expect(html).toContain('owner: J-2 fusion');
    // The G3 trace hook is present on each scenario line.
    expect(html).toContain('data-logical-id="K14a"');
    expect(html).toContain('data-logical-id="K14b"');
    expect(html).toContain('data-logical-id="K14c"');
  });

  it('the verdict grid is byte-identical with and without the attention block (US1 AS-2)', () => {
    const bare = scenarioStrip(makeTensor());
    const withBlock = scenarioStrip(makeTensor(), { likelihoods: meridianLikelihoods });
    // The block is strictly prepended: stripping it recovers the SPEC-10 output.
    expect(withBlock.endsWith(bare)).toBe(true);
    expect(withBlock).not.toBe(bare);
  });

  it('a scenario with no likelihood object renders unranked — "no assessment", never defaulted', () => {
    const html = scenarioStrip(makeTensor(), {
      likelihoods: [
        { scenario: 'R1', name: 'Fortress Halcyon', logical_id: 'K14a', band: pct(45, 70), provenance: j2 },
        { scenario: 'R2', name: 'Strait Denial' },
      ],
    });
    expect(html).toContain('no assessment — unranked, never defaulted');
    expect(html).toContain('assay-attention-unranked');
  });

  it('a contested weight renders its mark and joins the unranked group', () => {
    const html = scenarioStrip(makeTensor(), {
      likelihoods: meridianLikelihoods.map((l) => (l.scenario === 'R1' ? { ...l, contested: true } : l)),
    });
    expect(html).toContain('contested — orders nothing until resolved');
    // R1 is out of the ranked layers: R2/R3 form the single (level) layer.
    const layer0 = html.match(/<div class="assay-attention-layer" data-attention-layer="0"[\s\S]*?<div class="assay-attention-unranked"/)?.[0];
    expect(layer0).toBeTruthy();
    expect(layer0).toContain('R2 · Strait Denial');
    expect(layer0).not.toContain('R1 · Fortress Halcyon');
  });

  it('all-overlapping bands render one level layer — the honest "we cannot rank these"', () => {
    const html = scenarioStrip(makeTensor(), {
      likelihoods: [
        { scenario: 'R1', band: pct(30, 60), provenance: j2 },
        { scenario: 'R2', band: pct(20, 40), provenance: j2 },
        { scenario: 'R3', band: pct(10, 35), provenance: j2 },
      ],
    });
    expect(html).toContain('data-attention-layer="0"');
    expect(html).not.toContain('data-attention-layer="1"');
    expect(html).toContain('level — bands overlap; honestly unranked');
  });
});
