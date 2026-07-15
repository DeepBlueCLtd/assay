import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import type {
  CompiledWorld,
  KnowledgeObject,
  ScenarioCOA,
  VignetteConfig,
} from '../src/generated/types.js';
import { KnowledgeService } from '../src/knowledge.js';
import { CompileService, type CompileResult } from '../src/compile.js';
import { canonicalJson } from '../src/canonical.js';
import { isRefusal } from '../src/seam.js';
import type { Ref } from '../src/store.js';
import { ENGINE_VERSION } from '../src/engine.js';

const load = <T>(name: string): T[] =>
  JSON.parse(readFileSync(new URL(`../fixtures/${name}.json`, import.meta.url), 'utf8')) as T[];

const knowledge = load<KnowledgeObject>('knowledge');
const coas = load<ScenarioCOA>('coas');
const config = JSON.parse(
  readFileSync(new URL('../fixtures/vignette-config.json', import.meta.url), 'utf8'),
) as VignetteConfig;

const byId = new Map(knowledge.map((k) => [k.logical_id, k]));
const K = (id: string): KnowledgeObject => structuredClone(byId.get(id)!);
const answered = (id: string): KnowledgeObject => ({ ...K(id), status: 'answered' });
const ref = (id: string): Ref => ({ logical_id: id, content_hash: '' });

/** The Meridian base compilable set: answered, spatial, non-weight, non-stale. */
const BASE = ['K1', 'K2', 'K3', 'K4', 'K6', 'K7', 'K8', 'K9'];
const ENGINE = ENGINE_VERSION;

async function setup(): Promise<{ svc: KnowledgeService; compiler: CompileService }> {
  const svc = new KnowledgeService();
  for (const id of BASE) await svc.create(answered(id));
  await svc.create(K('K12a')); // status contested (fixture)
  await svc.create(K('K12b'));
  for (const coa of coas) await svc.store.put(coa as unknown as Record<string, unknown>);
  return { svc, compiler: new CompileService({ knowledge: svc }) };
}

const ok = (r: CompileResult) => {
  if (isRefusal(r)) throw new Error(`expected success, got refusal ${r.reason}`);
  return r;
};

describe('US1 — contested knowledge never compiles (G5, the demo moment)', () => {
  it('compile refuses contested_knowledge naming the K12 pair and persists nothing', async () => {
    const { svc, compiler } = await setup();
    const worldsBefore = svc.store.size;
    const edgesBefore = svc.trace.edges.length;

    const result = await compiler.compile({
      knowledge: [...BASE, 'K12a', 'K12b'].map(ref),
      config,
      engine_version: ENGINE,
    });

    expect(isRefusal(result)).toBe(true);
    if (isRefusal(result)) {
      expect(result.reason).toBe('contested_knowledge');
      expect(result.offending.map((o) => o.logical_id).sort()).toEqual(['K12a', 'K12b']);
    }
    expect(svc.store.size).toBe(worldsBefore); // no CompiledWorld stored (SC-001)
    expect(svc.trace.edges.length).toBe(edgesBefore); // no compiled_into edge
  });

  it('resolving the contest lets the recompile succeed, mine_stock sourced from the survivor', async () => {
    const { svc, compiler } = await setup();
    svc.contest('K12a', 'K12b'); // write the contests edge so a resolution is possible
    svc.resolve('K12a', 'defector debrief corroborated; manifests predate the drawdown');

    const result = ok(await compiler.compile({ knowledge: [...BASE, 'K12a'].map(ref), config, engine_version: ENGINE }));
    const world = svc.store.get(result.world.content_hash) as CompiledWorld;
    const threat = world.channels.find((c) => c.kind === 'threat')!;
    const mineStock = threat.regions!.find((r) => r.region === 'mine_stock')!;
    expect(mineStock.source).toBe('K12a');
    expect(mineStock.value).toEqual({ lo: 30, hi: 60, unit: 'mines' });
  });

  it('unknown ref is refused unknown_ref', async () => {
    const { compiler } = await setup();
    const result = await compiler.compile({ knowledge: [ref('K1'), ref('KZZZ')], config, engine_version: ENGINE });
    expect(isRefusal(result) && result.reason).toBe('unknown_ref');
  });
});

describe('US2 — the same knowledge compiles to a byte-identical stamp (G1)', () => {
  it('identical inputs → identical stamp and world hash; order-independent', async () => {
    const { compiler } = await setup();
    const a = ok(await compiler.compile({ knowledge: BASE.map(ref), config, engine_version: ENGINE }));
    const b = ok(await compiler.compile({ knowledge: [...BASE].reverse().map(ref), config, engine_version: ENGINE }));
    expect(a.stamp).toBe(b.stamp);
    expect(a.world.content_hash).toBe(b.world.content_hash);
  });

  it('the engine bump moves the stamp: same inputs at 0.1.0 vs the current engine differ (SPEC-20 FR-005)', async () => {
    const { compiler } = await setup();
    const old_ = ok(await compiler.compile({ knowledge: BASE.map(ref), config, engine_version: '0.1.0' }));
    const cur = ok(await compiler.compile({ knowledge: BASE.map(ref), config, engine_version: ENGINE }));
    expect(ENGINE).not.toBe('0.1.0'); // the SPEC-20 precedence fix bumped the engine
    expect(old_.stamp).not.toBe(cur.stamp); // old stamps stay honest about what computed them (G1)
  });

  it('a COA excursion (R2) yields a different but reproducible stamp', async () => {
    const { compiler } = await setup();
    const base = ok(await compiler.compile({ knowledge: BASE.map(ref), config, engine_version: ENGINE }));
    const r2a = ok(await compiler.compile({ knowledge: BASE.map(ref), scenario: 'R2', config, engine_version: ENGINE }));
    const r2b = ok(await compiler.compile({ knowledge: BASE.map(ref), scenario: 'R2', config, engine_version: ENGINE }));
    expect(r2a.stamp).not.toBe(base.stamp);
    expect(r2a.stamp).toBe(r2b.stamp);
  });

  it('the R2 excursion lands its strait overrides on the compiled world', async () => {
    const { svc, compiler } = await setup();
    const r2 = ok(await compiler.compile({ knowledge: BASE.map(ref), scenario: 'R2', config, engine_version: ENGINE }));
    const world = svc.store.get(r2.world.content_hash) as CompiledWorld;
    const threat = world.channels.find((c) => c.kind === 'threat')!;
    expect(threat.regions!.some((r) => r.region === 'halcyon_strait' && r.source === 'R2')).toBe(true);
  });

  it('a compiled world is sparse — kilobytes, not the ~85 MB a dense world costs (SC-006)', async () => {
    const { svc, compiler } = await setup();
    const r = ok(await compiler.compile({ knowledge: BASE.map(ref), config, engine_version: ENGINE }));
    const world = svc.store.get(r.world.content_hash) as CompiledWorld;
    expect(canonicalJson(world).length).toBeLessThan(50_000); // sparse channels; dense would be ~85 MB
  });
});

describe('US3 — every channel traces backward to named knowledge (G3)', () => {
  it('exactly one compiled_into edge per consumed object; none for firewalled/unconsumed', async () => {
    const { svc, compiler } = await setup();
    const r = ok(await compiler.compile({ knowledge: BASE.map(ref), config, engine_version: ENGINE }));
    const compiledInto = svc.trace.edges.filter((e) => e.edge_type === 'compiled_into');
    expect(compiledInto).toHaveLength(BASE.length); // 8 consumed
    expect(r.compiled_from.map((c) => c.logical_id).sort()).toEqual([...BASE].sort());
  });

  it('every region override names its source, and the backward walk is complete', async () => {
    const { svc, compiler } = await setup();
    const r = ok(await compiler.compile({ knowledge: BASE.map(ref), config, engine_version: ENGINE }));
    const world = svc.store.get(r.world.content_hash) as CompiledWorld;
    for (const ch of world.channels) {
      for (const region of ch.regions ?? []) {
        expect(region.source, `${ch.kind}/${region.region}`).toBeTruthy();
        expect(svc.store.versions(region.source!).length).toBeGreaterThan(0); // names a stored object
      }
    }
    const chains = svc.trace.backward(r.world.content_hash, (h) => svc.store.exists(h));
    expect(chains.length).toBeGreaterThan(0);
    for (const chain of chains) expect(chain.complete).toBe(true); // no dead ends (G3)
  });

  it('no channel value is a bare scalar — every one is a Band with a unit (G2)', async () => {
    const { svc, compiler } = await setup();
    const r = ok(await compiler.compile({ knowledge: BASE.map(ref), config, engine_version: ENGINE }));
    const world = svc.store.get(r.world.content_hash) as CompiledWorld;
    for (const ch of world.channels) {
      expect(typeof ch.default.lo).toBe('number');
      expect(ch.default.unit).toBeTruthy();
      for (const region of ch.regions ?? []) {
        expect(region.value.unit, `${ch.kind}/${region.region}`).toBeTruthy();
      }
    }
  });
});

describe('US4 — stale knowledge never compiles silently', () => {
  it('a compile consuming stale K5 refuses stale_input; consuming live K9 succeeds', async () => {
    const svc = new KnowledgeService();
    await svc.create(answered('K5'));
    await svc.supersede(K('K9'), 'K5'); // K5 → superseded
    for (const coa of coas) await svc.store.put(coa as unknown as Record<string, unknown>);
    const compiler = new CompileService({ knowledge: svc });

    const stale = await compiler.compile({ knowledge: [ref('K5')], config, engine_version: ENGINE });
    expect(isRefusal(stale) && stale.reason).toBe('stale_input');
    if (isRefusal(stale)) expect(stale.offending[0]?.logical_id).toBe('K5');

    const fresh = await compiler.compile({ knowledge: [ref('K9')], config, engine_version: ENGINE });
    expect(isRefusal(fresh)).toBe(false);
  });
});

describe('US5 — the compile firewall holds: weights, waivers, encoding', () => {
  it('scenario_weight (K14a–c) never reaches a channel and gets no compiled_into edge', async () => {
    const { svc, compiler } = await setup();
    for (const id of ['K14a', 'K14b', 'K14c']) await svc.create(K(id));
    const r = ok(await compiler.compile({ knowledge: [...BASE, 'K14a', 'K14b', 'K14c'].map(ref), config, engine_version: ENGINE }));
    const world = svc.store.get(r.world.content_hash) as CompiledWorld;
    const sources = world.channels.flatMap((c) => (c.regions ?? []).map((rg) => rg.source));
    expect(sources.some((s) => s?.startsWith('K14'))).toBe(false);
    expect(r.compiled_from.some((c) => c.logical_id.startsWith('K14'))).toBe(false);
  });

  it('K8 compiles with exactly one waives edge', async () => {
    const { svc, compiler } = await setup();
    await compiler.compile({ knowledge: BASE.map(ref), config, engine_version: ENGINE });
    const waives = svc.trace.edges.filter((e) => e.edge_type === 'waives');
    expect(waives).toHaveLength(1);
  });

  it('defence in depth: an assumption-as-hard_constraint that slipped into the store is refused encoding_violation', async () => {
    const { svc, compiler } = await setup();
    // Simulate a bad object an earlier engine version let through (bypass the write firewall).
    const bad = {
      ...K('K8'),
      logical_id: 'KBAD',
      encoding_class: 'hard_constraint',
      provenance: { ...K('K8').provenance!, source_class: 'assumption' },
    };
    delete (bad as { waiver?: unknown }).waiver;
    await svc.store.put(bad as unknown as Record<string, unknown>);

    const result = await compiler.compile({ knowledge: [ref('KBAD')], config, engine_version: ENGINE });
    expect(isRefusal(result) && result.reason).toBe('encoding_violation');
  });
});
