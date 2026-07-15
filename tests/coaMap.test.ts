import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { KnowledgeObject, Plan, VignetteConfig } from '../src/generated/types.js';
import { KnowledgeService } from '../src/knowledge.js';
import { CompileService } from '../src/compile.js';
import { isRefusal } from '../src/seam.js';
import type { CompiledWorld } from '../src/generated/types.js';
import type { Ref } from '../src/store.js';
import { makeProjection, regionByName, regionRect } from '../src/mapProject.js';
import { coaMap } from '../src/components/coaMap.js';

const load = <T>(name: string): T[] =>
  JSON.parse(readFileSync(new URL(`../fixtures/${name}.json`, import.meta.url), 'utf8')) as T[];
const knowledge = load<KnowledgeObject>('knowledge');
const plans = load<Plan>('plans');
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
  const compiler = new CompileService({ knowledge: svc });
  const r = await compiler.compile({ knowledge: BASE.map(ref), config, engine_version: '0.1.0' });
  if (isRefusal(r)) throw new Error(`compile refused ${r.reason}`);
  return {
    world: svc.store.get(r.world.content_hash) as CompiledWorld,
    knowledgeById: Object.fromEntries(BASE.map((id) => [id, byId.get(id)!])),
  };
}

describe('coaMap — a projection of fixtures, banded throughout (G2/DEC-4)', () => {
  it('renders every config region at exactly its bounding-box rectangle', async () => {
    const { world, knowledgeById } = await compiledBase();
    const html = coaMap(world, config, plans, { knowledgeById, width: 640 });
    const p = makeProjection(config.grid, { width: 640, pad: 10 });
    for (const g of config.regions) {
      expect(html).toContain(`data-region="${g.name}"`);
      const r = regionRect(g, p);
      // the region outline rect carries the projected fixture geometry verbatim
      expect(html).toContain(`x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="none"`);
    }
  });

  it('renders every active assessed override as a TWO-stop split fill, never one stop (G2)', async () => {
    const { world, knowledgeById } = await compiledBase();
    const html = coaMap(world, config, plans, { knowledgeById, step: 10 });
    for (const ch of world.channels) {
      for (const o of ch.regions ?? []) {
        const active =
          (o.from_step === undefined || 10 >= o.from_step) && (o.until_step === undefined || 10 <= o.until_step);
        if (!active) continue;
        expect(html).toContain(`data-glow-id="coa:cell:${ch.kind}:${o.region}"`);
        // exact band + source ride the surface (assessment, not fact)
        expect(html).toContain(`[${o.value.lo}, ${o.value.hi}] ${o.value.unit} — ${o.source}`);
        if (o.value.lo !== o.value.hi) {
          // the gradient carries both endpoints as hard stops at 50% — a split, not a blend
          const gid = html.match(new RegExp(`<linearGradient id="(coamap-g-${ch.kind}-${o.region}-\\d+)"`));
          expect(gid, `${ch.kind}/${o.region} has a split gradient`).toBeTruthy();
          const gradient = html.slice(html.indexOf(gid![1]!));
          expect(gradient.slice(0, 400)).toContain('offset="0.5"');
        }
      }
    }
    expect(html).toContain('assessment, not fact');
  });

  it("the step selects the world: K9's storm surface renders at step 10, not at step 40", async () => {
    const { world, knowledgeById } = await compiledBase();
    const at10 = coaMap(world, config, plans, { knowledgeById, step: 10 });
    const at40 = coaMap(world, config, plans, { knowledgeById, step: 40 });
    expect(at10).toContain('data-glow-id="coa:cell:storm:open_water"');
    expect(at40).not.toContain('data-glow-id="coa:cell:storm:open_water"'); // lapsed ⇒ not live
  });

  it('routes render the stated plans.json legs verbatim — waypoints, windows, containing regions', async () => {
    const { world, knowledgeById } = await compiledBase();
    const html = coaMap(world, config, plans, { knowledgeById });
    for (const plan of plans) {
      for (const ep of plan.elements) {
        (ep.route ?? []).forEach((l, i) => {
          expect(html).toContain(`data-glow-id="coa:wp:${plan.logical_id}:${ep.force_element}:${i}"`);
          expect(html).toContain(`data-glow-sig="${l.x},${l.y}@${l.enter_step}-${l.exit_step}"`);
        });
      }
    }
    // the honest-gap exhibit is on the canvas: ANVIL's fac_waters dwell, air_defence never entered
    const anvilLeg1 = html.match(/P1 · FE-ANVIL leg 1:[^<]*/)?.[0] ?? '';
    expect(anvilLeg1).toContain('(32,22) steps 8–9');
    expect(anvilLeg1).toContain('fac_waters');
    expect(anvilLeg1).not.toContain('air_defence');
  });

  it('no curve commands and no midpoint anywhere (DEC-15)', async () => {
    const { world, knowledgeById } = await compiledBase();
    const html = coaMap(world, config, plans, { knowledgeById });
    expect(html).not.toMatch(/<path[^>]+d="[^"]*[CQTS][^"]*"/); // no Béziers/arcs smoothing anything
    expect(html).not.toContain('midpoint');
  });
});
