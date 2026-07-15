import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Commitment, KnowledgeObject, Plan, VignetteConfig } from '../src/generated/types.js';
import { KnowledgeService } from '../src/knowledge.js';
import { CompileService } from '../src/compile.js';
import { isRefusal } from '../src/seam.js';
import type { CompiledWorld } from '../src/generated/types.js';
import type { Ref } from '../src/store.js';
import { dayWindowToSteps, exposureProfile } from '../src/mapProject.js';
import { coaTimeline, type CoaTimelineOptions } from '../src/components/coaTimeline.js';

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

async function compiledBase(): Promise<CompiledWorld> {
  const svc = new KnowledgeService();
  for (const id of BASE) await svc.create({ ...K(id), status: 'answered' });
  const compiler = new CompileService({ knowledge: svc });
  const r = await compiler.compile({ knowledge: BASE.map(ref), config, engine_version: '0.1.0' });
  if (isRefusal(r)) throw new Error(`compile refused ${r.reason}`);
  return svc.store.get(r.world.content_hash) as CompiledWorld;
}

async function renderedTimeline(): Promise<string> {
  const world = await compiledBase();
  const c4 = commitments.find((c) => c.logical_id === 'C4')!;
  const peak = dayWindowToSteps(5, 7, config.grid.timestep_hours);
  const opts: CoaTimelineOptions = {
    step: 8,
    knowledge: [byId.get('K5')!, byId.get('K9')!],
    supersessions: [{ from: 'K5', to: 'K9' }],
    annotations: [
      {
        label: '“surge peaking D+5–D+7” — stated by METOC (K9)',
        from_step: peak.from_step,
        until_step: peak.until_step,
        source: 'K9',
      },
    ],
    profiles: [
      {
        plan: 'P1',
        element: 'FE-ANVIL',
        points: exposureProfile(P1, 'FE-ANVIL', world, config, 'threat', c4.unit),
        unit: c4.unit,
        threshold: { commitment: 'C4', value: c4.threshold },
      },
    ],
  };
  return coaTimeline(world, config, plans, opts);
}

describe('coaTimeline — validity rendered, certainty never interpolated (thesis F/G2)', () => {
  it("K5 (steps 0–16) and K9 (steps 8–36) render as discrete windows with the supersession edge", async () => {
    const html = await renderedTimeline();
    expect(html).toContain('data-glow-id="coa:win:K5"');
    expect(html).toContain('data-glow-sig="0-16|0.4-0.9"');
    expect(html).toContain('data-glow-id="coa:win:K9"');
    expect(html).toContain('data-glow-sig="8-36|1.1-1.8"');
    expect(html).toContain('K9 supersedes K5');
    expect(html).toContain('superseded — not compiled'); // K5 marked, never passed off as live
  });

  it('the storm ridge is a FLAT banded rectangle, and the lapsed tail is marked', async () => {
    const html = await renderedTimeline();
    expect(html).toContain('data-glow-id="coa:ridge:open_water"');
    expect(html).toContain('1.1–1.8 m surge');
    // beyond step 36 the channel falls back to its default — marked, not carried forward
    expect(html).toContain('lapsed → default 0 m surge');
  });

  it('no curve commands anywhere — nothing tweens a band into implied certainty', async () => {
    const html = await renderedTimeline();
    expect(html).not.toMatch(/<path[^>]+d="[^"]*[CQTSA][^"]*"/);
  });

  it('the stated peak renders as a quoted, attributed annotation at steps 20–28 — never a curve', async () => {
    const html = await renderedTimeline();
    expect(html).toContain('“surge peaking D+5–D+7” — stated by METOC (K9)');
    expect(html).toContain('Quoted statement, steps 20–28 — attributed to K9');
  });

  it("the exposure staircase banks [12, 36] band-hours in fac_waters and ends on the C4 threshold line", async () => {
    const html = await renderedTimeline();
    expect(html).toContain('data-glow-id="coa:profile:P1:FE-ANVIL"');
    expect(html).toContain('data-glow-sig="12-36 band-hours"');
    expect(html).toContain('+[12, 36] in fac_waters');
    expect(html).toContain('[12, 36] band-hours'); // the final cum, both endpoints, no single value
    expect(html).toContain('C4 threshold 12 band-hours');
  });

  it("every plan leg renders as a task-window extent matching plans.json", async () => {
    const html = await renderedTimeline();
    for (const plan of plans) {
      for (const ep of plan.elements) {
        (ep.route ?? []).forEach((l, i) => {
          expect(html).toContain(`data-glow-id="coa:task:${plan.logical_id}:${ep.force_element}:${i}"`);
          expect(html).toContain(`data-glow-sig="${l.x},${l.y}@${l.enter_step}-${l.exit_step}"`);
        });
      }
    }
  });
});
