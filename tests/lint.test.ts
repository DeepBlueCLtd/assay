import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { KnowledgeObject } from '../src/generated/types.js';
import { confidenceLint, jipoeStepLint, relativeWidth, WIDTH_FLOOR } from '../src/lint.js';

const knowledge = JSON.parse(
  readFileSync(new URL('../fixtures/knowledge.json', import.meta.url), 'utf8'),
) as KnowledgeObject[];
const byId = new Map(knowledge.map((k) => [k.logical_id, k]));
const K = (id: string): KnowledgeObject => structuredClone(byId.get(id)!);

describe('confidence → band-width lint (research note 01-knowledge.md; SPEC-05)', () => {
  it('relative width is midpoint-free and matches the note', () => {
    expect(relativeWidth(2, 6)).toBeCloseTo(0.667, 2); // K6
    expect(relativeWidth(20, 40)).toBeCloseTo(0.5, 5); // K2
    expect(relativeWidth(7.5, 7.5)).toBe(0); // degenerate (observed)
  });

  it('every Meridian assessed/reported band clears its floor — fixtures validate the rule', () => {
    for (const k of knowledge) {
      expect(confidenceLint(k), `${k.logical_id} should not trip the lint`).toEqual([]);
    }
  });

  it('K6 (low confidence, widest band) is not flagged', () => {
    expect(confidenceLint(K('K6'))).toEqual([]);
  });

  it('a low-confidence value dressed in a tight band IS flagged (false precision)', () => {
    const k = K('K6');
    k.answer = { lo: 4.0, hi: 4.2, unit: 'sorties/day' }; // r ≈ 0.05 < 0.25 floor
    const warnings = confidenceLint(k);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]?.code).toBe('confidence_width_floor');
    expect(warnings[0]?.offending.logical_id).toBe('K6');
  });

  it('the same tight band at high confidence is permitted (no floor)', () => {
    const k = K('K5'); // reported · high
    k.answer = { lo: 4.0, hi: 4.2, unit: 'm surge' };
    expect(confidenceLint(k)).toEqual([]);
    expect(WIDTH_FLOOR.high).toBe(0);
  });

  it('observed values are exempt even when degenerate', () => {
    expect(confidenceLint(K('K1'))).toEqual([]); // observed, degenerate band
  });

  it('open questions with no answer are exempt', () => {
    expect(confidenceLint(K('K11'))).toEqual([]);
  });
});

describe('missing-JIPOE-step lint (research note 01 amendment; SPEC-21)', () => {
  it('every Meridian object carries its step — fixtures validate the rule', () => {
    for (const k of knowledge) {
      expect(jipoeStepLint(k), `${k.logical_id} should not trip the lint`).toEqual([]);
    }
  });

  it('a step-less object draws the warning, naming the missing slot', () => {
    const k = K('K2');
    delete k.jipoe_step;
    const warnings = jipoeStepLint(k);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]?.code).toBe('missing_jipoe_step');
    expect(warnings[0]?.offending.logical_id).toBe('K2');
    expect(warnings[0]?.message).toContain('JIPOE step');
  });

  it('observed objects get NO exemption — origin applies to facts too (unlike the width lint)', () => {
    const k = K('K1'); // observed
    delete k.jipoe_step;
    expect(jipoeStepLint(k)).toHaveLength(1);
    expect(confidenceLint(k)).toEqual([]); // the width exemption stands untouched
  });

  it('open questions are covered — they are the step-1-gap-origin objects', () => {
    const k = K('K11'); // open, no answer, no provenance
    delete k.jipoe_step;
    expect(jipoeStepLint(k)).toHaveLength(1);
  });
});
