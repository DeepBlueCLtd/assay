import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { KnowledgeObject, ScenarioCOA, VignetteConfig } from '../src/generated/types.js';
import { KnowledgeService } from '../src/knowledge.js';
import { CompileService } from '../src/compile.js';
import { channelTrace } from '../src/components/channelTrace.js';
import { isRefusal } from '../src/seam.js';
import type { CompiledWorld } from '../src/generated/types.js';
import type { Ref } from '../src/store.js';

const load = <T>(name: string): T[] =>
  JSON.parse(readFileSync(new URL(`../fixtures/${name}.json`, import.meta.url), 'utf8')) as T[];
const knowledge = load<KnowledgeObject>('knowledge');
const coas = load<ScenarioCOA>('coas');
const config = JSON.parse(
  readFileSync(new URL('../fixtures/vignette-config.json', import.meta.url), 'utf8'),
) as VignetteConfig;
const byId = new Map(knowledge.map((k) => [k.logical_id, k]));
const K = (id: string): KnowledgeObject => structuredClone(byId.get(id)!);
const BASE = ['K1', 'K2', 'K3', 'K4', 'K6', 'K7', 'K8', 'K9'];
const ref = (id: string): Ref => ({ logical_id: id, content_hash: '' });

async function compiledBase(): Promise<{ world: CompiledWorld; knowledgeById: Record<string, KnowledgeObject> }> {
  const svc = new KnowledgeService();
  for (const id of BASE) await svc.create({ ...K(id), status: 'answered' });
  for (const coa of coas) await svc.store.put(coa as unknown as Record<string, unknown>);
  const compiler = new CompileService({ knowledge: svc });
  const r = await compiler.compile({ knowledge: BASE.map(ref), config, engine_version: '0.1.0' });
  if (isRefusal(r)) throw new Error(`compile refused ${r.reason}`);
  const world = svc.store.get(r.world.content_hash) as CompiledWorld;
  return { world, knowledgeById: Object.fromEntries(BASE.map((id) => [id, byId.get(id)!])) };
}

describe('channel-trace surface — every channel value walks back to named knowledge (G3)', () => {
  it('renders each region with its backing knowledge id and its owner (provenance)', async () => {
    const { world, knowledgeById } = await compiledBase();
    const html = channelTrace(world, knowledgeById);
    // every region override names its source knowledge object and its owner
    for (const ch of world.channels) {
      for (const region of ch.regions ?? []) {
        expect(html.includes(region.source!), `${ch.kind}/${region.region} names ${region.source}`).toBe(true);
      }
    }
    expect(html.includes('owner:')).toBe(true);
    // the mandatory "assessment, not fact" marking rides along for assessed values (G2)
    expect(html.includes('assessment, not fact')).toBe(true);
  });

  it('renders no bare assessed scalar — every value goes through a band pill', async () => {
    const { world, knowledgeById } = await compiledBase();
    const html = channelTrace(world, knowledgeById);
    // one band pill per region override plus one per channel default
    const regionCount = world.channels.reduce((n, c) => n + (c.regions?.length ?? 0), 0);
    const pills = (html.match(/assay-band/g) ?? []).length;
    expect(pills).toBe(regionCount + world.channels.length); // defaults + region values, all banded
  });

  it('flags an unsourced override as a trace dead end rather than hiding it (G3)', () => {
    const world: CompiledWorld = {
      logical_id: 'W-X',
      version: 1,
      grid: config.grid,
      channels: [{ name: 'threat', kind: 'threat', default: { lo: 0, hi: 0, unit: 'threat index' }, regions: [{ region: 'garrison', value: { lo: 1, hi: 2, unit: 'x' } }] }],
      consumed: [],
      engine_version: '0.1.0',
      stamp: 'x',
    };
    expect(channelTrace(world).includes('dead end')).toBe(true);
  });
});
