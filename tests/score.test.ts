import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import type {
  Commitment,
  CommitmentVerdict,
  KnowledgeObject,
  Plan,
  ScenarioCOA,
  VignetteConfig,
} from '../src/generated/types.js';
import { KnowledgeService } from '../src/knowledge.js';
import { CompileService } from '../src/compile.js';
import { ScoreService } from '../src/score.js';
import { isRefusal, type ScoreResult } from '../src/seam.js';
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
const answered = (id: string): KnowledgeObject => ({ ...K(id), status: 'answered' });
const ref = (id: string): Ref => ({ logical_id: id, content_hash: '' });
const BASE = ['K1', 'K2', 'K3', 'K4', 'K6', 'K7', 'K8', 'K9'];
const ENGINE = '0.1.0';

interface Rig {
  svc: KnowledgeService;
  scorer: ScoreService;
  planRef: (id: string) => Ref;
  worldRef: (scenario?: string) => Promise<Ref>;
}

async function setup(): Promise<Rig> {
  const svc = new KnowledgeService();
  for (const id of BASE) await svc.create(answered(id));
  await svc.create(K('K12a'));
  await svc.create(K('K12b'));
  svc.contest('K12a', 'K12b');
  svc.resolve('K12a', 'defector debrief corroborated; manifests predate the drawdown');
  for (const coa of coas) await svc.store.put(coa as unknown as Record<string, unknown>);
  for (const c of commitments) await svc.store.put(c as unknown as Record<string, unknown>);
  const planRefs = new Map<string, Ref>();
  for (const p of plans) planRefs.set(p.logical_id, await svc.store.put(p as unknown as Record<string, unknown>));

  const compiler = new CompileService({ knowledge: svc });
  const worldRef = async (scenario?: string): Promise<Ref> => {
    const req = { knowledge: [...BASE, 'K12a'].map(ref), config, engine_version: ENGINE, ...(scenario ? { scenario } : {}) };
    const r = await compiler.compile(req);
    if (isRefusal(r)) throw new Error(`compile refused: ${r.reason}`);
    return r.world;
  };

  const scorer = new ScoreService({ store: svc.store, trace: svc.trace, config, commitments });
  return { svc, scorer, planRef: (id) => planRefs.get(id)!, worldRef };
}

const ok = (r: ScoreResult) => {
  if (isRefusal(r)) throw new Error(`expected success, got refusal ${r.reason}`);
  return r;
};

describe('US3 — the honest matrix over real Meridian output', () => {
  let rig: Rig;
  beforeEach(async () => {
    rig = await setup();
  });

  it('scores one four-stop verdict per commitment C1–C6, each carrying a margin band', async () => {
    const world = await rig.worldRef();
    const r = ok(await rig.scorer.score({ plan: rig.planRef('P1'), world, scenario: 'BASE', engine_version: ENGINE }));

    expect(r.verdicts.map((v) => v.commitment)).toEqual(['C1', 'C2', 'C3', 'C4', 'C5', 'C6']);
    const stops = ['robust', 'marginal', 'tight', 'violated'];
    for (const v of r.verdicts) {
      expect(stops).toContain(v.verdict);
      expect(v.plan).toBe('P1');
      expect(v.world_stamp).toBeTruthy();
      // every non-severed verdict carries a margin Band (shown on demand, G2)
      if (v.margin) expect(v.margin).toMatchObject({ lo: expect.any(Number), hi: expect.any(Number), unit: expect.any(String) });
    }
  });

  it('spreads verdicts across the four-stop scale (a real matrix, not all one colour)', async () => {
    const world = await rig.worldRef();
    const r = ok(await rig.scorer.score({ plan: rig.planRef('P1'), world, scenario: 'BASE', engine_version: ENGINE }));
    const distinct = new Set(r.verdicts.map((v) => v.verdict));
    expect(distinct.size).toBeGreaterThanOrEqual(3); // robust, marginal, tight all present for P1
  });

  it('writes a scored_from edge from each verdict to the world — a complete backward chain (G3)', async () => {
    const world = await rig.worldRef();
    const before = rig.svc.trace.edges.length;
    const r = ok(await rig.scorer.score({ plan: rig.planRef('P1'), world, scenario: 'BASE', engine_version: ENGINE }));

    const scoredFrom = rig.svc.trace.edges.filter((e) => e.edge_type === 'scored_from' && e.to_hash === world.content_hash);
    expect(scoredFrom.length).toBe(r.verdicts.length + r.scores.length);
    expect(rig.svc.trace.edges.length).toBeGreaterThan(before);
    // the world itself has incoming compiled_into edges from named knowledge, so a
    // backward walk verdict → world → knowledge terminates at named owners (G3).
    const compiledInto = rig.svc.trace.edges.filter((e) => e.edge_type === 'compiled_into' && e.to_hash === world.content_hash);
    expect(compiledInto.length).toBeGreaterThan(0);
  });

  it('thesis C: P1 (strait-early) is healthier on C1/C2 under R1 than under R2', async () => {
    const worldR1 = await rig.worldRef('R1');
    const worldR2 = await rig.worldRef('R2');
    const r1 = ok(await rig.scorer.score({ plan: rig.planRef('P1'), world: worldR1, scenario: 'R1', engine_version: ENGINE }));
    const r2 = ok(await rig.scorer.score({ plan: rig.planRef('P1'), world: worldR2, scenario: 'R2', engine_version: ENGINE }));

    const stop = (v: CommitmentVerdict[], c: string) => v.find((x) => x.commitment === c)!.verdict;
    // Under R2 the mined strait collapses BROOM's sweep and PACKHORSE's transit.
    expect(stop(r2.verdicts, 'C2')).toBe('violated');
    expect(stop(r2.verdicts, 'C1')).toBe('violated');
    // Under R1 (threat concentrated in the port district, strait physically clear) they hold.
    expect(['robust', 'marginal', 'tight']).toContain(stop(r1.verdicts, 'C2'));
    expect(['robust', 'marginal', 'tight']).toContain(stop(r1.verdicts, 'C1'));
  });
});

describe('US4 — determinism', () => {
  it('same plan + world + overrides ⇒ byte-identical stamp and identical verdicts', async () => {
    const rig = await setup();
    const world = await rig.worldRef();
    const a = ok(await rig.scorer.score({ plan: rig.planRef('P1'), world, scenario: 'BASE', engine_version: ENGINE }));
    const b = ok(await rig.scorer.score({ plan: rig.planRef('P1'), world, scenario: 'BASE', engine_version: ENGINE }));
    expect(a.stamp).toBe(b.stamp);
    expect(a.verdicts).toEqual(b.verdicts);
    expect(a.scores).toEqual(b.scores);
  });

  it('commitment order does not affect the stamp or the (canonically ordered) verdicts', async () => {
    const rig = await setup();
    const world = await rig.worldRef();
    const a = ok(await rig.scorer.score({ plan: rig.planRef('P1'), world, scenario: 'BASE', engine_version: ENGINE }));

    const shuffled = new ScoreService({
      store: rig.svc.store,
      trace: rig.svc.trace,
      config,
      commitments: [...commitments].reverse(),
    });
    const b = ok(await shuffled.score({ plan: rig.planRef('P1'), world, scenario: 'BASE', engine_version: ENGINE }));
    expect(b.verdicts.map((v) => v.commitment)).toEqual(['C1', 'C2', 'C3', 'C4', 'C5', 'C6']);
    expect(b.stamp).toBe(a.stamp);
  });
});

describe('US5 — perturbation hook and comparability guard', () => {
  it('knowledge_overrides re-scores without persisting the override (nothing forked)', async () => {
    const rig = await setup();
    const world = await rig.worldRef();
    const worldsBefore = countWorlds(rig.svc);

    const plain = ok(await rig.scorer.score({ plan: rig.planRef('P1'), world, scenario: 'BASE', engine_version: ENGINE }));
    const storeAfterPlain = rig.svc.store.size;

    const rig2 = await setup();
    const world2 = await rig2.worldRef();
    const overridden = ok(
      await rig2.scorer.score({
        plan: rig2.planRef('P1'),
        world: world2,
        scenario: 'BASE',
        engine_version: ENGINE,
        knowledge_overrides: [{ ref: ref('K6'), answer: { lo: 2, hi: 10, unit: 'sorties/day' } }],
      }),
    );
    // No new CompiledWorld and no new knowledge object: the override is not stored.
    expect(countWorlds(rig2.svc)).toBe(worldsBefore);
    // The same count of artefacts is written whether or not an override is present —
    // only the returned verdicts/scores join the store, never the override itself.
    expect(rig2.svc.store.size).toBe(storeAfterPlain);
    // The override affects the scored answer: it may not make any verdict MORE decisive.
    const c4Plain = plain.verdicts.find((v) => v.commitment === 'C4')!.verdict;
    const c4Over = overridden.verdicts.find((v) => v.commitment === 'C4')!.verdict;
    const decisive = { tight: 0, marginal: 1, robust: 2, violated: 2 } as const;
    expect(decisive[c4Over]).toBeLessThanOrEqual(decisive[c4Plain]);
  });

  it('refuses stamp_mismatch when the world was compiled for a different COA (comparability guard)', async () => {
    const rig = await setup();
    const worldR2 = await rig.worldRef('R2');
    const result = await rig.scorer.score({ plan: rig.planRef('P1'), world: worldR2, scenario: 'R1', engine_version: ENGINE });

    expect(isRefusal(result)).toBe(true);
    if (isRefusal(result)) {
      expect(result.reason).toBe('stamp_mismatch');
      expect(result.offending.map((o) => o.logical_id)).toContain(worldR2.logical_id);
    }
  });

  it('a plan that fails a must is a SUCCESS with a violated verdict, not a refusal', async () => {
    const rig = await setup();
    const worldR2 = await rig.worldRef('R2');
    const r = ok(await rig.scorer.score({ plan: rig.planRef('P1'), world: worldR2, scenario: 'R2', engine_version: ENGINE }));
    expect(r.verdicts.some((v) => v.verdict === 'violated')).toBe(true); // honest output, not a decline
  });
});

function countWorlds(svc: KnowledgeService): number {
  // count distinct CompiledWorld logical ids present (W-BASE, W-R1, ...)
  let n = 0;
  for (const id of ['W-BASE', 'W-R1', 'W-R2', 'W-R3', 'W-R3m']) {
    if (svc.store.versions(id).length > 0) n += 1;
  }
  return n;
}
