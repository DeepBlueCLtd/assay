import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { VignetteConfig } from '../src/generated/types.js';
import { validateInstance } from '../src/validate.js';
import { AXES, allSignatures, generateCandidates, signatureId } from '../src/generate.js';

const config = JSON.parse(
  readFileSync(new URL('../fixtures/vignette-config.json', import.meta.url), 'utf8'),
) as VignetteConfig;

const FORCE_ELEMENTS = ['FE-BROOM', 'FE-PACKHORSE', 'FE-ANVIL', 'FE-FALCON', 'FE-KINGFISHER'];

describe('SPEC-08 — the seeded axis fan-out generator (research note 03 §5.2)', () => {
  it('produces one valid Plan per axis signature (2⁴ = 16) with all five force elements (US4-1)', () => {
    const plans = generateCandidates(config, 1);
    expect(plans).toHaveLength(16);
    for (const p of plans) {
      expect(validateInstance('Plan', p)).toEqual([]); // validates against the generated LinkML type
      const elements = p.elements.map((e) => e.force_element).sort();
      expect(elements).toEqual([...FORCE_ELEMENTS].sort());
      expect(p.logical_id.startsWith('P-')).toBe(true); // P* frozen family (vignette §8)
      expect(p.generator).toMatch(/axis fan-out/);
    }
    const ids = new Set(plans.map((p) => p.logical_id));
    expect(ids.size).toBe(16); // every signature is a distinct plan
  });

  it('spans both settings of all four axes across the candidate set (US4-2)', () => {
    const sigs = allSignatures();
    for (const axis of Object.keys(AXES) as (keyof typeof AXES)[]) {
      const settings = new Set(sigs.map((s) => s[axis]));
      expect(settings.size).toBe(2); // both settings of each axis appear
    }
  });

  it('is deterministic in (config, seed) — same seed ⇒ identical candidate list (US4-3)', () => {
    const a = generateCandidates(config, 7);
    const b = generateCandidates(config, 7);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('stamps the seed onto every candidate; the candidate SET is seed-independent', () => {
    const a = generateCandidates(config, 1);
    const b = generateCandidates(config, 2);
    expect(a.every((p) => p.seed === 1)).toBe(true);
    expect(b.every((p) => p.seed === 2)).toBe(true);
    // Same signatures, only the stamped seed differs (the organiser uses the seed).
    expect(a.map((p) => p.logical_id)).toEqual(b.map((p) => p.logical_id));
  });

  it('the logical id encodes the axis signature (self-documenting P* id)', () => {
    expect(signatureId({ approach: 'strait_early', suppression: 'fires_forward', causeway: 'contest', extraction: 'pull_early' }))
      .toBe('P-SeFfCcXe');
  });
});
