/**
 * SPEC-20 — layered overlay precedence in channel materialisation
 * (research note 02-compile.md §6): excursion-layer overrides beat
 * base-knowledge-derived overrides; within a layer the documented tie order
 * (later `from_step`, then innermost region) is unchanged; BASE worlds have a
 * single layer and are untouched.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type {
  Band,
  CompiledWorld,
  KnowledgeObject,
  RegionOverride,
  ScenarioCOA,
  VignetteConfig,
} from '../src/generated/types.js';
import { KnowledgeService } from '../src/knowledge.js';
import { CompileService } from '../src/compile.js';
import { channelAt } from '../src/materialise.js';
import { ENGINE_VERSION } from '../src/engine.js';
import { isRefusal } from '../src/seam.js';
import type { Ref } from '../src/store.js';

const load = <T>(name: string): T[] =>
  JSON.parse(readFileSync(new URL(`../fixtures/${name}.json`, import.meta.url), 'utf8')) as T[];

const knowledge = load<KnowledgeObject>('knowledge');
const coas = load<ScenarioCOA>('coas');
const config = JSON.parse(
  readFileSync(new URL('../fixtures/vignette-config.json', import.meta.url), 'utf8'),
) as VignetteConfig;

const byId = new Map(knowledge.map((k) => [k.logical_id, k]));
const answered = (id: string): KnowledgeObject => ({ ...structuredClone(byId.get(id)!), status: 'answered' });
const ref = (id: string): Ref => ({ logical_id: id, content_hash: '' });
const BASE = ['K1', 'K2', 'K3', 'K4', 'K6', 'K7', 'K8', 'K9'];

// The causeway region centre — the C5 `state` metric's read cell (metrics.ts).
const CAUSEWAY = { x: 22, y: 21 };
const HORIZON = config.grid.horizon_steps;
const K2_BAND = { lo: 20, hi: 40 }; // K2's engineering estimate (fixtures/knowledge.json)

async function compileWorld(scenario?: string): Promise<CompiledWorld> {
  const svc = new KnowledgeService();
  for (const id of BASE) await svc.create(answered(id));
  for (const coa of coas) await svc.store.put(coa as unknown as Record<string, unknown>);
  const compiler = new CompileService({ knowledge: svc });
  const r = await compiler.compile({
    knowledge: BASE.map(ref),
    config,
    engine_version: ENGINE_VERSION,
    ...(scenario ? { scenario } : {}),
  });
  if (isRefusal(r)) throw new Error(`compile refused: ${r.reason}`);
  return svc.store.get(r.world.content_hash) as CompiledWorld;
}

/** A hand-built world for the synthetic layering cases — never stored, never stamped. */
function syntheticWorld(scenario: string | undefined, regions: RegionOverride[]): CompiledWorld {
  const world: CompiledWorld = {
    logical_id: `W-${scenario ?? 'BASE'}`,
    version: 1,
    grid: config.grid,
    channels: [{ name: 'mobility', kind: 'mobility', default: { lo: 1, hi: 1, unit: 'transit factor' }, regions }],
    consumed: [],
    engine_version: ENGINE_VERSION,
    stamp: 'synthetic',
  };
  if (scenario) world.scenario = scenario;
  return world;
}

const band = (lo: number, hi: number): Band => ({ lo, hi, unit: 'transit factor' });

describe('SPEC-20 — excursions beat base on the same region (US1) 🎯 exit', () => {
  it('the R3m causeway read returns the demolition state, not the K2 estimate (US1-1)', async () => {
    const world = await compileWorld('R3m');
    const v = channelAt(world, config, 'mobility', CAUSEWAY.x, CAUSEWAY.y, HORIZON);
    expect(v.lo).toBe(0);
    expect(v.hi).toBe(0); // the excursion's zeroed transit factor — the causeway is down
  });

  it('the R3 causeway read returns the demolition state too (same excursion overlay)', async () => {
    const world = await compileWorld('R3');
    const v = channelAt(world, config, 'mobility', CAUSEWAY.x, CAUSEWAY.y, HORIZON);
    expect(v).toMatchObject({ lo: 0, hi: 0 });
  });

  it('the BASE read is unchanged — K2 wins where no excursion speaks (US1-2, FR-004)', async () => {
    const world = await compileWorld();
    const v = channelAt(world, config, 'mobility', CAUSEWAY.x, CAUSEWAY.y, HORIZON);
    expect(v).toMatchObject(K2_BAND);
  });

  it('an excursion on a region the base never overrode behaves as today (edge 1)', async () => {
    const world = await compileWorld('R2');
    // R2 mines the strait; no base mobility override exists on halcyon_strait
    // cells outside the causeway box — the excursion is the only active override.
    const v = channelAt(world, config, 'mobility', 30, 28, 0);
    expect(v).toMatchObject({ lo: 0.1, hi: 0.4 });
  });
});

describe('SPEC-20 — layer beats geometry, window beats layer (edge cases)', () => {
  it('a windowed excursion wins only inside its window; base semantics resume outside (edge 2)', () => {
    const world = syntheticWorld('RX', [
      { region: 'causeway', value: band(20, 40), source: 'K2' },
      { region: 'causeway', value: band(0, 0), source: 'RX', from_step: 10 },
    ]);
    expect(channelAt(world, config, 'mobility', CAUSEWAY.x, CAUSEWAY.y, 5)).toMatchObject(K2_BAND);
    expect(channelAt(world, config, 'mobility', CAUSEWAY.x, CAUSEWAY.y, 10)).toMatchObject({ lo: 0, hi: 0 });
    expect(channelAt(world, config, 'mobility', CAUSEWAY.x, CAUSEWAY.y, HORIZON)).toMatchObject({ lo: 0, hi: 0 });
  });

  it('an excursion on an OUTER region still beats a base override on an inner one (layer before geometry)', () => {
    // causeway ⊂ halcyon_strait at (22,21): the old innermost-wins rule kept the
    // base value; the layer rule gives the excursion the cell it re-describes.
    const world = syntheticWorld('RX', [
      { region: 'causeway', value: band(20, 40), source: 'K2' },
      { region: 'halcyon_strait', value: band(0.1, 0.4), source: 'RX' },
    ]);
    expect(channelAt(world, config, 'mobility', CAUSEWAY.x, CAUSEWAY.y, 0)).toMatchObject({ lo: 0.1, hi: 0.4 });
  });

  it('within the base layer the documented tie order is unchanged: later from_step wins (US1-3, FR-002)', () => {
    const world = syntheticWorld(undefined, [
      { region: 'causeway', value: band(20, 40), source: 'K2', from_step: 0 },
      { region: 'causeway', value: band(5, 10), source: 'K2b', from_step: 8 },
    ]);
    expect(channelAt(world, config, 'mobility', CAUSEWAY.x, CAUSEWAY.y, 4)).toMatchObject(K2_BAND);
    expect(channelAt(world, config, 'mobility', CAUSEWAY.x, CAUSEWAY.y, 12)).toMatchObject({ lo: 5, hi: 10 });
  });

  it('within the base layer, ties on window resolve innermost (smaller region) — unchanged', () => {
    const world = syntheticWorld(undefined, [
      { region: 'halcyon_strait', value: band(0.5, 0.7), source: 'KA' },
      { region: 'causeway', value: band(20, 40), source: 'K2' },
    ]);
    expect(channelAt(world, config, 'mobility', CAUSEWAY.x, CAUSEWAY.y, 0)).toMatchObject(K2_BAND);
  });

  it('two excursion-layer overrides overlapping resolve by the same within-layer tie order (edge 3)', () => {
    const world = syntheticWorld('RX', [
      { region: 'halcyon_strait', value: band(0.1, 0.4), source: 'RX' },
      { region: 'causeway', value: band(0, 0), source: 'RX' },
    ]);
    // same window ⇒ innermost excursion wins within the excursion layer
    expect(channelAt(world, config, 'mobility', CAUSEWAY.x, CAUSEWAY.y, 0)).toMatchObject({ lo: 0, hi: 0 });
  });

  it('no active override ⇒ the channel default, regardless of layers elsewhere', () => {
    const world = syntheticWorld('RX', [
      { region: 'causeway', value: band(0, 0), source: 'RX', from_step: 10 },
    ]);
    expect(channelAt(world, config, 'mobility', 0, 40, 5)).toMatchObject({ lo: 1, hi: 1 });
  });
});
