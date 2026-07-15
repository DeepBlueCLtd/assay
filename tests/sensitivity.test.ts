import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import type {
  Commitment,
  KnowledgeObject,
  Plan,
  VignetteConfig,
} from '../src/generated/types.js';
import { KnowledgeService } from '../src/knowledge.js';
import { CompileService } from '../src/compile.js';
import { SensitivityService } from '../src/sensitivity.js';
import { isRefusal, type SensitivityResult } from '../src/seam.js';
import type { Ref } from '../src/store.js';
import { ENGINE_VERSION } from '../src/engine.js';

const load = <T>(name: string): T[] =>
  JSON.parse(readFileSync(new URL(`../fixtures/${name}.json`, import.meta.url), 'utf8')) as T[];

const knowledge = load<KnowledgeObject>('knowledge');
const commitments = load<Commitment>('commitments');
const plans = load<Plan>('plans');
const config = JSON.parse(
  readFileSync(new URL('../fixtures/vignette-config.json', import.meta.url), 'utf8'),
) as VignetteConfig;

const byId = new Map(knowledge.map((k) => [k.logical_id, k]));
const K = (id: string): KnowledgeObject => structuredClone(byId.get(id)!);
const answered = (id: string): KnowledgeObject => ({ ...K(id), status: 'answered' });
const ref = (id: string): Ref => ({ logical_id: id, content_hash: '' });
const BASE_K = ['K1', 'K2', 'K3', 'K4', 'K6', 'K7', 'K8', 'K9'];
const ENGINE = ENGINE_VERSION;

interface Rig {
  svc: KnowledgeService;
  sensitivity: SensitivityService;
  planRef: Ref;
  worldRef: Ref;
}

async function setup(): Promise<Rig> {
  const svc = new KnowledgeService();
  for (const id of BASE_K) await svc.create(answered(id));
  await svc.create(K('K12a'));
  await svc.create(K('K12b'));
  svc.contest('K12a', 'K12b');
  svc.resolve('K12a', 'defector debrief corroborated');
  for (const c of commitments) await svc.store.put(c as unknown as Record<string, unknown>);
  const planRef = await svc.store.put(plans[1] as unknown as Record<string, unknown>);

  const compiler = new CompileService({ knowledge: svc });
  const compileReq = { knowledge: BASE_K.map(ref), config, engine_version: ENGINE };
  const compileResult = await compiler.compile(compileReq);
  if (isRefusal(compileResult)) throw new Error(`compile refused: ${compileResult.reason}`);

  const sensitivity = new SensitivityService({
    store: svc.store,
    trace: svc.trace,
    config,
    commitments,
  });

  return { svc, sensitivity, planRef, worldRef: compileResult.world };
}

const ok = (r: SensitivityResult) => {
  if (isRefusal(r)) throw new Error(`expected success, got refusal: ${r.reason} — ${r.explanation}`);
  return r;
};

describe('SPEC-11 — sensitivity analysis (thesis E)', () => {
  let rig: Rig;
  beforeEach(async () => {
    rig = await setup();
  });

  it('returns a ranking of consumed knowledge items', async () => {
    const result = ok(await rig.sensitivity.analyse({
      plan: rig.planRef,
      world: rig.worldRef,
      scenario: 'BASE',
      engine_version: ENGINE,
    }));
    expect(result.ranking.length).toBeGreaterThan(0);
    expect(result.stamp).toBeTruthy();
  });

  it('each ranking entry has the required fields', async () => {
    const result = ok(await rig.sensitivity.analyse({
      plan: rig.planRef,
      world: rig.worldRef,
      scenario: 'BASE',
      engine_version: ENGINE,
    }));
    for (const entry of result.ranking) {
      expect(entry.knowledge).toBeDefined();
      expect(entry.knowledge.logical_id).toBeTruthy();
      expect(entry.baseline_verdicts).toBeDefined();
      expect(entry.perturbed_verdicts).toBeDefined();
      expect(typeof entry.changed_count).toBe('number');
      expect(typeof entry.single_source).toBe('boolean');
    }
  });

  it('ranking is sorted by changed_count descending', async () => {
    const result = ok(await rig.sensitivity.analyse({
      plan: rig.planRef,
      world: rig.worldRef,
      scenario: 'BASE',
      engine_version: ENGINE,
    }));
    for (let i = 1; i < result.ranking.length; i++) {
      expect(result.ranking[i]!.changed_count).toBeLessThanOrEqual(result.ranking[i - 1]!.changed_count);
    }
  });

  it('K8 carries single_source: true', async () => {
    const result = ok(await rig.sensitivity.analyse({
      plan: rig.planRef,
      world: rig.worldRef,
      scenario: 'BASE',
      engine_version: ENGINE,
    }));
    const k8 = result.ranking.find((e) => e.knowledge.logical_id === 'K8');
    expect(k8).toBeDefined();
    expect(k8!.single_source).toBe(true);
  });

  it('non-single-source items carry single_source: false', async () => {
    const result = ok(await rig.sensitivity.analyse({
      plan: rig.planRef,
      world: rig.worldRef,
      scenario: 'BASE',
      engine_version: ENGINE,
    }));
    const others = result.ranking.filter((e) => e.knowledge.logical_id !== 'K8');
    for (const entry of others) {
      expect(entry.single_source).toBe(false);
    }
  });

  it('deterministic: same inputs produce the same stamp (G1)', async () => {
    const req = {
      plan: rig.planRef,
      world: rig.worldRef,
      scenario: 'BASE',
      engine_version: ENGINE,
    };
    const a = ok(await rig.sensitivity.analyse(req));
    const b = ok(await rig.sensitivity.analyse(req));
    expect(a.stamp).toBe(b.stamp);
  });

  it('refuses unknown plan ref', async () => {
    const result = await rig.sensitivity.analyse({
      plan: { logical_id: 'P-NONEXISTENT', content_hash: 'bad' },
      world: rig.worldRef,
      scenario: 'BASE',
      engine_version: ENGINE,
    });
    expect(isRefusal(result)).toBe(true);
  });

  it('refuses unknown world ref', async () => {
    const result = await rig.sensitivity.analyse({
      plan: rig.planRef,
      world: { logical_id: 'W-NONEXISTENT', content_hash: 'bad' },
      scenario: 'BASE',
      engine_version: ENGINE,
    });
    expect(isRefusal(result)).toBe(true);
  });

  it('degenerate bands (lo === hi) produce changed_count 0', async () => {
    const result = ok(await rig.sensitivity.analyse({
      plan: rig.planRef,
      world: rig.worldRef,
      scenario: 'BASE',
      engine_version: ENGINE,
    }));
    const k1 = result.ranking.find((e) => e.knowledge.logical_id === 'K1');
    if (k1) {
      expect(k1.changed_count).toBe(0);
    }
  });
});
