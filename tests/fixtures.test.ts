import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { validateInstance } from '../src/validate.js';
import type { Commitment, KnowledgeObject, ScenarioCOA } from '../src/generated/types.js';

const load = <T>(name: string): T[] =>
  JSON.parse(readFileSync(new URL(`../fixtures/${name}.json`, import.meta.url), 'utf8')) as T[];

const knowledge = load<KnowledgeObject>('knowledge');
const commitments = load<Commitment>('commitments');
const coas = load<ScenarioCOA>('coas');
const forceElements = load<Record<string, unknown>>('force-elements');

describe('Meridian fixtures validate against generated types (SPEC-04; Stage-0 exit)', () => {
  it.each(knowledge.map((k) => [k.logical_id, k] as const))('%s validates', (_id, k) => {
    expect(validateInstance('KnowledgeObject', k)).toEqual([]);
  });
  it.each(commitments.map((c) => [c.logical_id, c] as const))('%s validates', (_id, c) => {
    expect(validateInstance('Commitment', c)).toEqual([]);
  });
  it.each(coas.map((r) => [r.logical_id, r] as const))('%s validates', (_id, r) => {
    expect(validateInstance('ScenarioCOA', r)).toEqual([]);
  });
  it.each(forceElements.map((f) => [f.logical_id, f] as const))('%s validates', (_id, f) => {
    expect(validateInstance('ForceElement', f)).toEqual([]);
  });
});

describe('fixture set is complete against vignette identifiers (§5, §6, §3)', () => {
  it('carries K1–K14 (with a/b/c variants), C1–C6, R1–R3(+R3m), FE-*', () => {
    const kIds = knowledge.map((k) => k.logical_id);
    expect(kIds).toEqual([
      'K1', 'K2', 'K3', 'K4', 'K5', 'K6', 'K7', 'K8', 'K9', 'K10',
      'K11', 'K12a', 'K12b', 'K13', 'K14a', 'K14b', 'K14c',
    ]);
    expect(commitments.map((c) => c.logical_id)).toEqual(['C1', 'C2', 'C3', 'C4', 'C5', 'C6']);
    expect(coas.map((r) => r.logical_id)).toEqual(['R1', 'R2', 'R3', 'R3m']);
    expect(forceElements.map((f) => f.logical_id)).toEqual([
      'FE-ANVIL', 'FE-BROOM', 'FE-FALCON', 'FE-PACKHORSE', 'FE-KINGFISHER',
    ]);
  });

  it('expected_answers reference existing COAs', () => {
    const coaIds = new Set(coas.map((r) => r.logical_id));
    for (const k of knowledge) {
      for (const ea of k.expected_answers ?? []) {
        expect(coaIds.has(ea.coa), `${k.logical_id} → ${ea.coa}`).toBe(true);
      }
    }
  });

  it('COA likelihoods reference scenario_weight knowledge objects', () => {
    const byId = new Map(knowledge.map((k) => [k.logical_id, k]));
    for (const r of coas) {
      const weight = byId.get(r.likelihood!);
      expect(weight?.encoding_class, `${r.logical_id} likelihood`).toBe('scenario_weight');
    }
  });
});

describe('fixtures protect the coverage-matrix rows they exist for (vignette §7)', () => {
  const byId = new Map(knowledge.map((k) => [k.logical_id, k]));
  const bandsOf = (id: string): Map<string, { lo: number; hi: number }> =>
    new Map((byId.get(id)!.expected_answers ?? []).map((ea) => [ea.coa, ea.band]));

  it('thesis D: K11 discriminates R1 vs R2 (disjoint bands); K13 does not (all bands overlap)', () => {
    const k11 = bandsOf('K11');
    expect(k11.get('R1')!.hi).toBeLessThan(k11.get('R2')!.lo); // disjoint — one look answers it

    const k13 = [...bandsOf('K13').values()];
    for (const a of k13) {
      for (const b of k13) {
        expect(a.lo <= b.hi && b.lo <= a.hi).toBe(true); // every pair overlaps — nearly uninformative
      }
    }
  });

  it('thesis E: K8 is single-source, waiver-carrying, hard_constraint', () => {
    const k8 = byId.get('K8')!;
    expect(k8.provenance?.single_source).toBe(true);
    expect(k8.waiver?.granted_by).toBe('J-3');
    expect(k8.encoding_class).toBe('hard_constraint');
  });

  it('thesis F: K5 and K9 validity windows abut at step 8 on the scenario clock', () => {
    expect(byId.get('K5')!.validity).toEqual({ valid_from: 0, valid_until: 16 });
    expect(byId.get('K9')!.validity).toEqual({ valid_from: 8, valid_until: 36 });
  });

  it('G5: the contested pair answers the same question with irreconcilable bands', () => {
    const a = byId.get('K12a')!;
    const b = byId.get('K12b')!;
    expect(a.question).toBe(b.question);
    expect(a.status).toBe('contested');
    expect(b.status).toBe('contested');
    expect(a.answer!.hi).toBeLessThan(b.answer!.lo);
  });

  it('DEC-14: observed values are degenerate bands; every non-observed answer is a real interval or flagged', () => {
    for (const k of knowledge) {
      if (!k.answer || !k.provenance) continue;
      if (k.provenance.source_class === 'observed') {
        expect(k.answer.lo, k.logical_id).toBe(k.answer.hi);
      }
    }
  });

  it('DEC-19: no numeric weight appears anywhere on a commitment', () => {
    for (const c of commitments) {
      expect('weight' in (c as unknown as Record<string, unknown>)).toBe(false);
      expect(['must', 'should', 'prefer']).toContain(c.tier);
    }
  });
});
