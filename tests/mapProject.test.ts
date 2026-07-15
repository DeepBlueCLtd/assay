import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Commitment, KnowledgeObject, Plan, VignetteConfig } from '../src/generated/types.js';
import { KnowledgeService } from '../src/knowledge.js';
import { CompileService } from '../src/compile.js';
import { evaluateMetric, isSevered } from '../src/metrics.js';
import { isRefusal } from '../src/seam.js';
import type { CompiledWorld } from '../src/generated/types.js';
import type { Ref } from '../src/store.js';
import {
  cellAtPixel,
  cellInRegion,
  dayWindowToSteps,
  exposureProfile,
  legActiveAt,
  legRegions,
  makeProjection,
  overrideActiveAt,
  regionByName,
  regionRect,
  regionsContaining,
  routeEnters,
} from '../src/mapProject.js';

const load = <T>(name: string): T[] =>
  JSON.parse(readFileSync(new URL(`../fixtures/${name}.json`, import.meta.url), 'utf8')) as T[];
const knowledge = load<KnowledgeObject>('knowledge');
const plans = load<Plan>('plans');
const commitments = load<Commitment>('commitments');
const config = JSON.parse(
  readFileSync(new URL('../fixtures/vignette-config.json', import.meta.url), 'utf8'),
) as VignetteConfig;
const byId = new Map(knowledge.map((k) => [k.logical_id, k]));
const K = (id: string): KnowledgeObject => structuredClone(byId.get(id)!);
const BASE = ['K1', 'K2', 'K3', 'K4', 'K6', 'K7', 'K8', 'K9'];
const ref = (id: string): Ref => ({ logical_id: id, content_hash: '' });
const P1 = plans.find((p) => p.logical_id === 'P1')!;
const P2 = plans.find((p) => p.logical_id === 'P2')!;

async function compiledBase(): Promise<CompiledWorld> {
  const svc = new KnowledgeService();
  for (const id of BASE) await svc.create({ ...K(id), status: 'answered' });
  const compiler = new CompileService({ knowledge: svc });
  const r = await compiler.compile({ knowledge: BASE.map(ref), config, engine_version: '0.1.0' });
  if (isRefusal(r)) throw new Error(`compile refused ${r.reason}`);
  return svc.store.get(r.world.content_hash) as CompiledWorld;
}

describe('projection — grid → viewport, invertible, no invented geometry', () => {
  const p = makeProjection(config.grid, { width: 640, pad: 10 });

  it('projects the 60×60 grid uniformly with square cells', () => {
    expect(p.cell).toBeCloseTo((640 - 20) / 60);
    expect(p.px(0)).toBe(10);
    expect(p.py(0)).toBe(10);
    expect(p.px(60)).toBeCloseTo(630);
    expect(p.height).toBeCloseTo(640); // square grid ⇒ square viewport
  });

  it("a region's rectangle covers its inclusive cell range exactly", () => {
    const g = regionByName(config, 'fac_waters'); // 30,20 → 50,34
    const r = regionRect(g, p);
    expect(r.x).toBeCloseTo(p.px(30));
    expect(r.y).toBeCloseTo(p.py(20));
    expect(r.w).toBeCloseTo((50 - 30 + 1) * p.cell);
    expect(r.h).toBeCloseTo((34 - 20 + 1) * p.cell);
  });

  it('cellAtPixel inverts the projection and clamps to the grid', () => {
    expect(cellAtPixel(config.grid, p, p.cx(32), p.cy(22))).toEqual({ x: 32, y: 22 });
    expect(cellAtPixel(config.grid, p, -50, -50)).toEqual({ x: 0, y: 0 });
    expect(cellAtPixel(config.grid, p, 10_000, 10_000)).toEqual({ x: 59, y: 59 });
  });
});

describe('hit-geometry — mirrors the scoring semantics (materialise/metrics)', () => {
  it('containment is inclusive, as in materialise.ts', () => {
    const g = regionByName(config, 'fac_waters');
    expect(cellInRegion(g, 30, 20)).toBe(true); // corner in
    expect(cellInRegion(g, 50, 34)).toBe(true); // far corner in
    expect(cellInRegion(g, 29, 20)).toBe(false);
  });

  it("P1 FE-ANVIL's route enters fac_waters and NOT air_defence (the K6/K7 exhibit)", () => {
    const anvil = P1.elements.find((e) => e.force_element === 'FE-ANVIL')!.route!;
    expect(routeEnters(config, anvil, 'fac_waters')).toBe(true);
    expect(routeEnters(config, anvil, 'air_defence')).toBe(false);
  });

  it("a leg's waypoint cell names every containing region (the cell the metric reads)", () => {
    const anvil = P1.elements.find((e) => e.force_element === 'FE-ANVIL')!.route!;
    const at = legRegions(config, anvil[1]!); // (32, 22)
    expect(at).toContain('fac_waters');
    expect(at).toContain('halcyon_strait');
    expect(at).not.toContain('air_defence');
    expect(regionsContaining(config, 32, 22).map((g) => g.name)).toEqual(at);
  });

  it('leg and override window predicates match the shipped step semantics', () => {
    const leg = { x: 32, y: 22, enter_step: 8, exit_step: 9 };
    expect(legActiveAt(leg, 8)).toBe(true);
    expect(legActiveAt(leg, 9)).toBe(false); // [enter, exit)
    expect(overrideActiveAt({ from_step: 8, until_step: 36 }, 36)).toBe(true); // inclusive, as materialise.ts
    expect(overrideActiveAt({ from_step: 8, until_step: 36 }, 37)).toBe(false);
    expect(overrideActiveAt({}, 999)).toBe(true); // un-windowed
  });

  it("K9's stated peak 'D+5–D+7' converts to steps 20–28 at 6 h/step", () => {
    expect(dayWindowToSteps(5, 7, config.grid.timestep_hours)).toEqual({ from_step: 20, until_step: 28 });
  });
});

describe('exposure profile — the metric replayed leg by leg, never a lookalike', () => {
  it("P1 FE-ANVIL banks its whole C4 exposure [12, 36] in the single fac_waters dwell (steps 8–9)", async () => {
    const world = await compiledBase();
    const c4 = commitments.find((c) => c.logical_id === 'C4')!;
    const points = exposureProfile(P1, 'FE-ANVIL', world, config, 'threat', c4.unit);
    expect(points).toHaveLength(2);
    // Leg 0 is the quiet leg — the honest [0, 0], not missing data.
    expect(points[0]!.leg).toEqual({ lo: 0, hi: 0, unit: c4.unit });
    // Leg 1 dwells one step (6 h) at (32,22) inside fac_waters under K6's [2, 6].
    expect(points[1]!.regions).toContain('fac_waters');
    expect(points[1]!.leg).toEqual({ lo: 12, hi: 36, unit: c4.unit });
    expect(points[1]!.cum).toEqual({ lo: 12, hi: 36, unit: c4.unit });
  });

  it("the profile's final cum equals evaluateMetric's exposure band exactly (no drift)", async () => {
    const world = await compiledBase();
    const c4 = commitments.find((c) => c.logical_id === 'C4')!;
    for (const plan of [P1, P2]) {
      const metric = evaluateMetric(c4, plan, world, config);
      if (isSevered(metric)) throw new Error('unexpected severed route');
      const points = exposureProfile(plan, 'FE-ANVIL', world, config, 'threat', c4.unit);
      const final = points[points.length - 1]!.cum;
      expect(final).toEqual(metric.band);
    }
  });

  it("the compiled storm override carries K9's validity window (steps 8–36)", async () => {
    const world = await compiledBase();
    const storm = world.channels.find((c) => c.kind === 'storm')!;
    const k9 = (storm.regions ?? []).find((o) => o.source === 'K9')!;
    expect(k9.from_step).toBe(8);
    expect(k9.until_step).toBe(36);
    expect(k9.value).toEqual({ lo: 1.1, hi: 1.8, unit: 'm surge' });
  });
});
