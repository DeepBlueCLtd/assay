/**
 * Instrumented trace: K3 (civil population in Port Halcyon) from knowledge
 * object through compile, score, handful, relaxation, to commander's COA
 * selection. This test documents every stage of the journey for the blog
 * article (research spike SPEC-18).
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type {
  Band,
  Commitment,
  CompiledWorld,
  KnowledgeObject,
  Plan,
  ScenarioCOA,
  VignetteConfig,
} from '../src/generated/types.js';
import { KnowledgeService } from '../src/knowledge.js';
import { CompileService } from '../src/compile.js';
import { ScoreService, marginBand, verdictFor } from '../src/score.js';
import { channelAt } from '../src/materialise.js';
import { evaluateMetric, isSevered } from '../src/metrics.js';
import { isRefusal } from '../src/seam.js';
import type { Ref } from '../src/store.js';

const load = <T>(name: string): T[] =>
  JSON.parse(readFileSync(new URL(`../fixtures/${name}.json`, import.meta.url), 'utf8')) as T[];

const knowledge = load<KnowledgeObject>('knowledge');
const coas = load<ScenarioCOA>('coas');
const commitments = load<Commitment>('commitments');
const plans = load<Plan>('plans');
const config = JSON.parse(
  readFileSync(new URL('../fixtures/vignette-config.json', import.meta.url), 'utf8'),
) as VignetteConfig;

const byId = new Map(knowledge.map((k) => [k.logical_id, k]));
const K = (id: string): KnowledgeObject => structuredClone(byId.get(id)!);
const answered = (id: string): KnowledgeObject => ({ ...K(id), status: 'answered' as const });
const ref = (id: string): Ref => ({ logical_id: id, content_hash: '' });
const BASE_IDS = ['K1', 'K2', 'K3', 'K4', 'K6', 'K7', 'K8', 'K9'];
const ENGINE = '0.1.0';

async function buildWorld(svc: KnowledgeService, scenario?: string) {
  const compiler = new CompileService({ knowledge: svc });
  const req = {
    knowledge: [...BASE_IDS, 'K12a'].map(ref),
    config,
    engine_version: ENGINE,
    ...(scenario ? { scenario } : {}),
  };
  const r = await compiler.compile(req);
  if (isRefusal(r)) throw new Error(`compile refused: ${r.reason}`);
  const world = svc.store.get(r.world.content_hash) as CompiledWorld;
  return { world, worldRef: r.world };
}

async function makeRig() {
  const svc = new KnowledgeService();
  for (const id of BASE_IDS) await svc.create(answered(id));
  await svc.create(K('K12a'));
  await svc.create(K('K12b'));
  svc.contest('K12a', 'K12b');
  svc.resolve('K12a', 'defector debrief corroborated');
  for (const coa of coas) await svc.store.put(coa as unknown as Record<string, unknown>);
  for (const c of commitments) await svc.store.put(c as unknown as Record<string, unknown>);
  const planRefs = new Map<string, Ref>();
  for (const p of plans)
    planRefs.set(p.logical_id, await svc.store.put(p as unknown as Record<string, unknown>));
  return { svc, planRefs };
}

describe('K3 end-to-end trace: civil population → COA verdict', () => {
  it('Stage 1 — K3 is a banded knowledge object with an 18-month-old census', () => {
    const k3 = byId.get('K3')!;
    expect(k3.question).toBe('What is the civil population in the Port Halcyon district?');
    expect(k3.subject).toBe('civil_density.port_district');
    expect(k3.answer).toEqual({ lo: 35000, hi: 55000, unit: 'persons' });
    expect(k3.provenance.source_class).toBe('reported');
    expect(k3.provenance.confidence).toBe('moderate');
    console.log('[K3] answer band: [%d, %d] %s', k3.answer!.lo, k3.answer!.hi, k3.answer!.unit);
    console.log('[K3] provenance: %s confidence, source: %s', k3.provenance.confidence, k3.provenance.source_class);
  });

  it('Stage 2 — config routes K3.subject to civil_density channel / port_district region', () => {
    const entry = config.subject_map.find((e) => e.subject === 'civil_density.port_district');
    expect(entry).toBeDefined();
    expect(entry!.channel).toBe('civil_density');
    expect(entry!.region).toBe('port_district');

    const region = config.regions.find((r) => r.name === 'port_district');
    expect(region).toBeDefined();
    console.log(
      '[route] civil_density.port_district → channel:%s, region:%s (x:%d-%d, y:%d-%d)',
      entry!.channel, entry!.region,
      region!.x0, region!.x1, region!.y0, region!.y1,
    );
  });

  it('Stage 3 — compile lays K3 answer as a RegionOverride on the civil_density channel', async () => {
    const { world } = await buildWorld((await makeRig()).svc);
    const cd = world.channels.find((c) => c.kind === 'civil_density')!;

    expect(cd.default).toEqual({ lo: 0, hi: 0, unit: 'persons' });
    const k3region = cd.regions!.find((r) => r.source === 'K3');
    expect(k3region).toBeDefined();
    expect(k3region!.region).toBe('port_district');
    expect(k3region!.value).toEqual({ lo: 35000, hi: 55000, unit: 'persons' });

    console.log('[compile] civil_density channel default: [%d, %d]', cd.default.lo, cd.default.hi);
    console.log(
      '[compile] K3 override on region "%s": [%d, %d] %s (source: %s)',
      k3region!.region, k3region!.value.lo, k3region!.value.hi, k3region!.value.unit, k3region!.source,
    );
  });

  it('Stage 4 — materialiser resolves K3 band inside port_district, default outside', async () => {
    const { world } = await buildWorld((await makeRig()).svc);
    const region = config.regions.find((r) => r.name === 'port_district')!;
    const insideX = Math.floor((region.x0 + region.x1) / 2);
    const insideY = Math.floor((region.y0 + region.y1) / 2);
    const outsideX = 5;
    const outsideY = 5;

    const inside = channelAt(world, config, 'civil_density', insideX, insideY, 0);
    const outside = channelAt(world, config, 'civil_density', outsideX, outsideY, 0);

    expect(inside).toEqual({ lo: 35000, hi: 55000, unit: 'persons' });
    expect(outside).toEqual({ lo: 0, hi: 0, unit: 'persons' });

    console.log('[materialise] civil_density at (%d,%d) inside port_district: [%d, %d]', insideX, insideY, inside.lo, inside.hi);
    console.log('[materialise] civil_density at (%d,%d) outside port_district: [%d, %d]', outsideX, outsideY, outside.lo, outside.hi);
  });

  it('Stage 5 — C3 fires metric counts FE-FALCON legs inside port_district (NOT reading K3 band)', async () => {
    const c3 = commitments.find((c) => c.logical_id === 'C3')!;
    expect(c3.metric).toBe('civil_harm_exposure');
    expect(c3.comparator).toBe('at_most');
    expect(c3.threshold).toBe(0);
    expect(c3.scope).toBe('port_district');

    const { world } = await buildWorld((await makeRig()).svc);
    const p1 = plans.find((p) => p.logical_id === 'P1')!;
    const p2 = plans.find((p) => p.logical_id === 'P2')!;

    const falconP1 = p1.elements.find((e) => e.force_element === 'FE-FALCON')!;
    const falconP2 = p2.elements.find((e) => e.force_element === 'FE-FALCON')!;
    const portRegion = config.regions.find((r) => r.name === 'port_district')!;

    console.log('[C3] commitment: "%s"', c3.statement);
    console.log('[C3] metric: %s, comparator: %s, threshold: %d', c3.metric, c3.comparator, c3.threshold);
    console.log('[C3] scope: %s (region x:%d-%d, y:%d-%d)', c3.scope, portRegion.x0, portRegion.x1, portRegion.y0, portRegion.y1);

    console.log('[P1] FE-FALCON route:');
    for (const leg of falconP1.route) {
      const inside = leg.x >= portRegion.x0 && leg.x <= portRegion.x1 &&
                     leg.y >= portRegion.y0 && leg.y <= portRegion.y1;
      console.log('  leg (%d,%d) steps %d-%d: %s port_district', leg.x, leg.y, leg.enter_step, leg.exit_step, inside ? 'INSIDE' : 'outside');
    }

    console.log('[P2] FE-FALCON route:');
    for (const leg of falconP2.route) {
      const inside = leg.x >= portRegion.x0 && leg.x <= portRegion.x1 &&
                     leg.y >= portRegion.y0 && leg.y <= portRegion.y1;
      console.log('  leg (%d,%d) steps %d-%d: %s port_district', leg.x, leg.y, leg.enter_step, leg.exit_step, inside ? 'INSIDE' : 'outside');
    }

    const resultP1 = evaluateMetric(c3, p1, world, config);
    const resultP2 = evaluateMetric(c3, p2, world, config);
    expect(isSevered(resultP1)).toBe(false);
    expect(isSevered(resultP2)).toBe(false);
    if (!isSevered(resultP1) && !isSevered(resultP2)) {
      console.log('[score] P1 C3 fires metric: [%d, %d] (FE-FALCON legs inside district)', resultP1.band.lo, resultP1.band.hi);
      console.log('[score] P2 C3 fires metric: [%d, %d] (FE-FALCON legs inside district)', resultP2.band.lo, resultP2.band.hi);

      const marginP1 = marginBand(c3.comparator, c3.threshold, resultP1.band);
      const marginP2 = marginBand(c3.comparator, c3.threshold, resultP2.band);
      const verdictP1 = verdictFor(marginP1);
      const verdictP2 = verdictFor(marginP2);

      console.log('[verdict] P1 C3: margin [%d, %d] → %s', marginP1.lo, marginP1.hi, verdictP1);
      console.log('[verdict] P2 C3: margin [%d, %d] → %s', marginP2.lo, marginP2.hi, verdictP2);
    }
  });

  it('Stage 5b — THE GAP: K3 band is compiled but the fires metric never reads it', async () => {
    const { world } = await buildWorld((await makeRig()).svc);
    const c3 = commitments.find((c) => c.logical_id === 'C3')!;
    const p2 = plans.find((p) => p.logical_id === 'P2')!;

    const falconP2 = p2.elements.find((e) => e.force_element === 'FE-FALCON')!;
    const districtLeg = falconP2.route.find((leg) => {
      const pr = config.regions.find((r) => r.name === 'port_district')!;
      return leg.x >= pr.x0 && leg.x <= pr.x1 && leg.y >= pr.y0 && leg.y <= pr.y1;
    });

    if (districtLeg) {
      const civilDensityAtLeg = channelAt(world, config, 'civil_density', districtLeg.x, districtLeg.y, districtLeg.enter_step);
      console.log('[GAP] FE-FALCON leg (%d,%d) is inside port_district', districtLeg.x, districtLeg.y);
      console.log('[GAP] civil_density at that cell: [%d, %d] %s (K3 band — PRESENT in the world)', civilDensityAtLeg.lo, civilDensityAtLeg.hi, civilDensityAtLeg.unit);
      console.log('[GAP] But the fires metric counts legs, not density. It returns a COUNT of legs inside the region.');
      console.log('[GAP] K3\'s band [35000, 55000] is compiled into the world but NEVER READ by the C3 scorer.');
      console.log('[GAP] The commitment "no fires into the populated port district" is purely geometric — the population number is decoration.');
    }

    const resultWithK3 = evaluateMetric(c3, p2, world, config);

    // Now score without K3 — should be identical
    const svc2 = new KnowledgeService();
    const noK3ids = BASE_IDS.filter((id) => id !== 'K3');
    for (const id of noK3ids) await svc2.create(answered(id));
    await svc2.create(K('K12a'));
    await svc2.create(K('K12b'));
    svc2.contest('K12a', 'K12b');
    svc2.resolve('K12a', 'corroborated');
    for (const coa of coas) await svc2.store.put(coa as unknown as Record<string, unknown>);

    const compiler2 = new CompileService({ knowledge: svc2 });
    const r2 = await compiler2.compile({
      knowledge: [...noK3ids, 'K12a'].map(ref),
      config,
      engine_version: ENGINE,
    });
    if (isRefusal(r2)) throw new Error(`compile refused: ${r2.reason}`);
    const worldNoK3 = svc2.store.get(r2.world.content_hash) as CompiledWorld;

    const resultWithoutK3 = evaluateMetric(c3, p2, worldNoK3, config);

    expect(isSevered(resultWithK3)).toBe(false);
    expect(isSevered(resultWithoutK3)).toBe(false);
    if (!isSevered(resultWithK3) && !isSevered(resultWithoutK3)) {
      expect(resultWithK3.band.lo).toBe(resultWithoutK3.band.lo);
      expect(resultWithK3.band.hi).toBe(resultWithoutK3.band.hi);
      console.log('[PROOF] C3 verdict with K3:    fires = [%d, %d]', resultWithK3.band.lo, resultWithK3.band.hi);
      console.log('[PROOF] C3 verdict without K3: fires = [%d, %d]', resultWithoutK3.band.lo, resultWithoutK3.band.hi);
      console.log('[PROOF] IDENTICAL — K3\'s banded answer has zero effect on any COA verdict.');
    }
  });

  it('Stage 6 — full score matrix: K3 changes no verdict for P1 or P2', async () => {
    const { svc, planRefs } = await makeRig();
    const { worldRef } = await buildWorld(svc);
    const scorer = new ScoreService({ store: svc.store, trace: svc.trace, config, commitments });

    for (const pid of ['P1', 'P2'] as const) {
      const r = await scorer.score({
        plan: planRefs.get(pid)!,
        world: worldRef,
        scenario: 'BASE',
        engine_version: ENGINE,
      });
      if (isRefusal(r)) throw new Error(`score refused: ${r.reason}`);
      const c3v = r.verdicts.find((v) => v.commitment === 'C3')!;
      console.log('[matrix] %s × C3: verdict=%s, margin=[%s, %s]',
        pid, c3v.verdict,
        c3v.margin?.lo ?? 'n/a', c3v.margin?.hi ?? 'n/a');
    }
  });
});
