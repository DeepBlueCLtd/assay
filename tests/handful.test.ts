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
import { HandfulService } from '../src/handful.js';
import { isRefusal, type HandfulResult } from '../src/seam.js';
import { type Criterion, type CriteriaVector, distinct } from '../src/dominance.js';
import type { Ref } from '../src/store.js';

const load = <T>(name: string): T[] =>
  JSON.parse(readFileSync(new URL(`../fixtures/${name}.json`, import.meta.url), 'utf8')) as T[];

const knowledge = load<KnowledgeObject>('knowledge');
const coas = load<ScenarioCOA>('coas');
const commitments = load<Commitment>('commitments');
const config = JSON.parse(
  readFileSync(new URL('../fixtures/vignette-config.json', import.meta.url), 'utf8'),
) as VignetteConfig;

const byId = new Map(knowledge.map((k) => [k.logical_id, k]));
const K = (id: string): KnowledgeObject => structuredClone(byId.get(id)!);
const answered = (id: string): KnowledgeObject => ({ ...K(id), status: 'answered' });
const ref = (id: string): Ref => ({ logical_id: id, content_hash: '' });
const BASE = ['K1', 'K2', 'K3', 'K4', 'K6', 'K7', 'K8', 'K9'];
const ENGINE = '0.1.0';
const cids = commitments.map((c) => c.logical_id).sort();

interface Rig {
  svc: KnowledgeService;
  scorer: ScoreService;
  handfuls: HandfulService;
  worldRef: Ref;
}

async function setup(): Promise<Rig> {
  const svc = new KnowledgeService();
  for (const id of BASE) await svc.create(answered(id));
  await svc.create(K('K12a'));
  await svc.create(K('K12b'));
  svc.contest('K12a', 'K12b');
  svc.resolve('K12a', 'defector debrief corroborated');
  for (const coa of coas) await svc.store.put(coa as unknown as Record<string, unknown>);
  for (const c of commitments) await svc.store.put(c as unknown as Record<string, unknown>);

  const compiler = new CompileService({ knowledge: svc });
  const compiled = await compiler.compile({ knowledge: [...BASE, 'K12a'].map(ref), config, engine_version: ENGINE });
  if (isRefusal(compiled)) throw new Error(`compile refused: ${compiled.reason}`);

  const scorer = new ScoreService({ store: svc.store, trace: svc.trace, config, commitments });
  const handfuls = new HandfulService({ store: svc.store, scorer, config, commitments });
  return { svc, scorer, handfuls, worldRef: compiled.world };
}

const ok = (r: HandfulResult) => {
  if (isRefusal(r)) throw new Error(`expected success, got refusal ${r.reason}`);
  return r;
};

/** Re-score a returned plan to recover its C1–C6 margin vector for domination checks. */
async function vectorOf(rig: Rig, planRef: Ref): Promise<CriteriaVector> {
  const scored = await rig.scorer.score({ plan: planRef, world: rig.worldRef, scenario: 'BASE', engine_version: ENGINE });
  if (isRefusal(scored)) throw new Error('re-score refused');
  const byC = new Map(scored.verdicts.map((v: CommitmentVerdict) => [v.commitment, v]));
  return cids.map((id) => (byC.get(id)?.margin ?? null) as Criterion);
}

describe('SPEC-08 — /plan/handful over the Meridian base world', () => {
  let rig: Rig;
  beforeEach(async () => {
    rig = await setup();
  });

  it('returns 3–5 plans, each resolving to a stored Plan (US1-1, SC-001)', async () => {
    const h = ok(await rig.handfuls.handful({ world: rig.worldRef, seed: 1, engine_version: ENGINE }));
    expect(h.plans.length).toBeGreaterThanOrEqual(3);
    expect(h.plans.length).toBeLessThanOrEqual(5);
    for (const p of h.plans) {
      const plan = rig.svc.store.get(p.content_hash) as Plan | undefined;
      expect(plan).toBeDefined();
      expect(plan!.logical_id).toBe(p.logical_id);
    }
  });

  it('every pair in the handful is mutually non-dominated (US1-2, SC-001)', async () => {
    const h = ok(await rig.handfuls.handful({ world: rig.worldRef, seed: 1, engine_version: ENGINE }));
    const vectors = await Promise.all(h.plans.map((p) => vectorOf(rig, p)));
    for (let i = 0; i < vectors.length; i++) {
      for (let j = i + 1; j < vectors.length; j++) {
        expect(distinct(vectors[i]!, vectors[j]!)).toBe(true); // neither ε-dominates the other
      }
    }
  });

  it('the handful shows more than one distinct verdict on at least two commitments (US1-3)', async () => {
    const h = ok(await rig.handfuls.handful({ world: rig.worldRef, seed: 1, engine_version: ENGINE }));
    const perCommitment: Map<string, Set<string>> = new Map(cids.map((id) => [id, new Set<string>()]));
    for (const p of h.plans) {
      const scored = await rig.scorer.score({ plan: p, world: rig.worldRef, scenario: 'BASE', engine_version: ENGINE });
      if (isRefusal(scored)) throw new Error('score refused');
      for (const v of scored.verdicts) perCommitment.get(v.commitment)!.add(v.verdict);
    }
    const varying = [...perCommitment.values()].filter((s) => s.size > 1).length;
    expect(varying).toBeGreaterThanOrEqual(2);
  });

  it('same (world, seed) ⇒ identical stamp, plans, scores, organisation (US2-1, SC-002)', async () => {
    const a = ok(await rig.handfuls.handful({ world: rig.worldRef, seed: 1, engine_version: ENGINE }));
    const b = ok(await rig.handfuls.handful({ world: rig.worldRef, seed: 1, engine_version: ENGINE }));
    expect(a.stamp).toBe(b.stamp);
    expect(a.plans).toEqual(b.plans);
    expect(a.scores).toEqual(b.scores);
    expect(a.organisation).toEqual(b.organisation);
  });

  it('a different seed changes the stamp (US2-2, SC-002)', async () => {
    const a = ok(await rig.handfuls.handful({ world: rig.worldRef, seed: 1, engine_version: ENGINE }));
    const b = ok(await rig.handfuls.handful({ world: rig.worldRef, seed: 2, engine_version: ENGINE }));
    expect(a.stamp).not.toBe(b.stamp);
  });

  it('derives a non-empty distinct_because per plan, aligned to plans (FR-010, SC-006)', async () => {
    const h = ok(await rig.handfuls.handful({ world: rig.worldRef, seed: 1, engine_version: ENGINE }));
    expect(h.organisation.distinct_because).toHaveLength(h.plans.length);
    for (const reason of h.organisation.distinct_because) {
      expect(reason.length).toBeGreaterThan(0);
      expect(reason).toMatch(/non-dominated/);
    }
  });

  it('every handful member opens a complete trace chain verdict → world → knowledge (G3, SC-005)', async () => {
    const h = ok(await rig.handfuls.handful({ world: rig.worldRef, seed: 1, engine_version: ENGINE }));
    const worldHash = rig.worldRef.content_hash;
    for (const p of h.plans) {
      const scored = await rig.scorer.score({ plan: p, world: rig.worldRef, scenario: 'BASE', engine_version: ENGINE });
      if (isRefusal(scored)) throw new Error('score refused');
      // Each verdict was written with a scored_from edge to the world it rests on…
      const verdictHash = (await rig.svc.store.put(scored.verdicts[0]! as unknown as Record<string, unknown>)).content_hash;
      const scoredFrom = rig.svc.trace.edges.filter(
        (e) => e.edge_type === 'scored_from' && e.from_hash === verdictHash && e.to_hash === worldHash,
      );
      expect(scoredFrom.length).toBeGreaterThan(0);
    }
    // …and the world carries incoming compiled_into edges from named knowledge, so
    // the chain verdict → world → knowledge terminates at named owners (G3).
    const compiledInto = rig.svc.trace.edges.filter((e) => e.edge_type === 'compiled_into' && e.to_hash === worldHash);
    expect(compiledInto.length).toBeGreaterThan(0);
  });

  describe('count clamping (FR-001)', () => {
    it('count = 3 returns exactly 3 by diversity cap (SC-001)', async () => {
      const h = ok(await rig.handfuls.handful({ world: rig.worldRef, seed: 1, count: 3, engine_version: ENGINE }));
      expect(h.plans).toHaveLength(3);
    });

    it('count below 3 is clamped up to 3, count above 5 is clamped down to 5', async () => {
      const low = ok(await rig.handfuls.handful({ world: rig.worldRef, seed: 1, count: 1, engine_version: ENGINE }));
      expect(low.plans.length).toBeGreaterThanOrEqual(3);
      const high = ok(await rig.handfuls.handful({ world: rig.worldRef, seed: 1, count: 9, engine_version: ENGINE }));
      expect(high.plans.length).toBeLessThanOrEqual(5);
    });
  });

  it('refuses unknown_ref when the world cannot be resolved, persisting nothing (FR-011)', async () => {
    const before = rig.svc.store.size;
    const r = await rig.handfuls.handful({ world: { logical_id: 'NO-SUCH-WORLD', content_hash: '' }, seed: 1, engine_version: ENGINE });
    expect(isRefusal(r)).toBe(true);
    if (isRefusal(r)) expect(r.reason).toBe('unknown_ref');
    expect(rig.svc.store.size).toBe(before); // nothing generated/stored on refusal
  });
});
