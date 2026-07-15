import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import type { KnowledgeObject } from '../src/generated/types.js';
import { ObjectStore, type Ref } from '../src/store.js';
import { DiscriminationService } from '../src/discrimination.js';
import { isRefusal, type DiscriminationResult } from '../src/seam.js';
import { ENGINE_VERSION } from '../src/engine.js';

const load = <T>(name: string): T[] =>
  JSON.parse(readFileSync(new URL(`../fixtures/${name}.json`, import.meta.url), 'utf8')) as T[];

const knowledge = load<KnowledgeObject>('knowledge');
const byId = new Map(knowledge.map((k) => [k.logical_id, k]));
const ENGINE = ENGINE_VERSION;

interface Rig {
  store: ObjectStore;
  discrimination: DiscriminationService;
  k11Ref: Ref;
  k13Ref: Ref;
}

async function setup(): Promise<Rig> {
  const store = new ObjectStore();
  const k11 = structuredClone(byId.get('K11')!);
  const k13 = structuredClone(byId.get('K13')!);
  const k11Ref = await store.put(k11 as unknown as Record<string, unknown>);
  const k13Ref = await store.put(k13 as unknown as Record<string, unknown>);
  const discrimination = new DiscriminationService({ store });
  return { store, discrimination, k11Ref, k13Ref };
}

const ok = (r: DiscriminationResult) => {
  if (isRefusal(r)) throw new Error(`expected success, got refusal: ${r.reason} — ${r.explanation}`);
  return r;
};

describe('SPEC-12 — discrimination analysis (thesis D)', () => {
  let rig: Rig;
  beforeEach(async () => {
    rig = await setup();
  });

  it('K11 ranks above K13 (thesis-D exit)', async () => {
    const result = ok(await rig.discrimination.analyse({
      questions: [rig.k11Ref, rig.k13Ref],
      coas: ['R1', 'R2', 'R3'],
      engine_version: ENGINE,
    }));
    expect(result.ranking.length).toBe(2);
    expect(result.ranking[0]!.question.logical_id).toBe('K11');
    expect(result.ranking[1]!.question.logical_id).toBe('K13');
  });

  it('K11 R1-R2 separation is positive (disjoint bands)', async () => {
    const result = ok(await rig.discrimination.analyse({
      questions: [rig.k11Ref],
      coas: ['R1', 'R2', 'R3'],
      engine_version: ENGINE,
    }));
    const k11 = result.ranking[0]!;
    const r1r2 = k11.pairs.find((p) => p.coa_a === 'R1' && p.coa_b === 'R2');
    expect(r1r2).toBeDefined();
    expect(r1r2!.separation.lo).toBeGreaterThan(0);
  });

  it('K13 all-pair separations are negative (overlapping bands)', async () => {
    const result = ok(await rig.discrimination.analyse({
      questions: [rig.k13Ref],
      coas: ['R1', 'R2', 'R3'],
      engine_version: ENGINE,
    }));
    const k13 = result.ranking[0]!;
    for (const pair of k13.pairs) {
      expect(pair.separation.lo).toBeLessThan(0);
    }
  });

  it('cost is present as a Band, never collapsed with separation', async () => {
    const result = ok(await rig.discrimination.analyse({
      questions: [rig.k11Ref, rig.k13Ref],
      coas: ['R1', 'R2', 'R3'],
      engine_version: ENGINE,
    }));
    for (const entry of result.ranking) {
      expect(entry.cost).toBeDefined();
      expect(typeof entry.cost.lo).toBe('number');
      expect(typeof entry.cost.hi).toBe('number');
      expect(entry.cost.unit).toBeTruthy();
    }
  });

  it('K11 cost is higher than K13 cost', async () => {
    const result = ok(await rig.discrimination.analyse({
      questions: [rig.k11Ref, rig.k13Ref],
      coas: ['R1', 'R2', 'R3'],
      engine_version: ENGINE,
    }));
    const k11 = result.ranking.find((e) => e.question.logical_id === 'K11')!;
    const k13 = result.ranking.find((e) => e.question.logical_id === 'K13')!;
    expect(k11.cost.lo).toBeGreaterThan(k13.cost.lo);
  });

  it('per-COA-pair separations are reported', async () => {
    const result = ok(await rig.discrimination.analyse({
      questions: [rig.k11Ref],
      coas: ['R1', 'R2', 'R3'],
      engine_version: ENGINE,
    }));
    const k11 = result.ranking[0]!;
    expect(k11.pairs.length).toBe(3);
    const pairLabels = k11.pairs.map((p) => `${p.coa_a}-${p.coa_b}`).sort();
    expect(pairLabels).toEqual(['R1-R2', 'R1-R3', 'R2-R3']);
  });

  it('deterministic: same inputs produce the same stamp (G1)', async () => {
    const req = {
      questions: [rig.k11Ref, rig.k13Ref],
      coas: ['R1', 'R2', 'R3'],
      engine_version: ENGINE,
    };
    const a = ok(await rig.discrimination.analyse(req));
    const b = ok(await rig.discrimination.analyse(req));
    expect(a.stamp).toBe(b.stamp);
  });

  it('refuses when fewer than two COAs', async () => {
    const result = await rig.discrimination.analyse({
      questions: [rig.k11Ref],
      coas: ['R1'],
      engine_version: ENGINE,
    });
    expect(isRefusal(result)).toBe(true);
  });

  it('best_separation matches the widest pair', async () => {
    const result = ok(await rig.discrimination.analyse({
      questions: [rig.k11Ref],
      coas: ['R1', 'R2', 'R3'],
      engine_version: ENGINE,
    }));
    const k11 = result.ranking[0]!;
    const maxSep = Math.max(...k11.pairs.map((p) => p.separation.lo));
    expect(k11.best_separation.lo).toBe(maxSep);
  });
});
