import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import type {
  Commitment,
  CommitmentVerdict,
  KnowledgeObject,
  Plan,
  ScenarioCOA,
  VignetteConfig,
  VerdictBand,
} from '../src/generated/types.js';
import { KnowledgeService } from '../src/knowledge.js';
import { CompileService } from '../src/compile.js';
import { ScoreService } from '../src/score.js';
import { RobustnessService } from '../src/robustness.js';
import { HandfulService } from '../src/handful.js';
import { scenarioStrip } from '../src/components/scenarioStrip.js';
import { isRefusal, type RobustnessResult, type ScenarioVerdictTensor } from '../src/seam.js';
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
const BASE_K = ['K1', 'K2', 'K3', 'K4', 'K6', 'K7', 'K8', 'K9'];
const ENGINE = '0.1.0';

interface Rig {
  svc: KnowledgeService;
  robustness: RobustnessService;
  planRef: (id: string) => Ref;
  worldRef: (scenario?: string) => Promise<Ref>;
}

async function setup(): Promise<Rig> {
  const svc = new KnowledgeService();
  for (const id of BASE_K) await svc.create(answered(id));
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
    const req = { knowledge: [...BASE_K, 'K12a'].map(ref), config, engine_version: ENGINE, ...(scenario ? { scenario } : {}) };
    const r = await compiler.compile(req);
    if (isRefusal(r)) throw new Error(`compile refused: ${r.reason}`);
    return r.world;
  };

  const scorer = new ScoreService({ store: svc.store, trace: svc.trace, config, commitments });
  const robustness = new RobustnessService({ store: svc.store, scorer, commitments });
  return { svc, robustness, planRef: (id) => planRefs.get(id)!, worldRef };
}

const ok = (r: RobustnessResult) => {
  if (isRefusal(r)) throw new Error(`expected success, got refusal: ${r.reason} — ${r.explanation}`);
  return r;
};

describe('SPEC-10 — scenario robustness (thesis C)', () => {
  let rig: Rig;
  beforeEach(async () => {
    rig = await setup();
  });

  it('SC-001: strait_early C2 is robust/marginal/tight under BASE but violated under R2', async () => {
    const worlds: Record<string, Ref> = {
      BASE: await rig.worldRef(),
      R1: await rig.worldRef('R1'),
      R2: await rig.worldRef('R2'),
      R3: await rig.worldRef('R3'),
    };
    const r = ok(await rig.robustness.robustness({
      plans: [rig.planRef('P1')],
      worlds,
      engine_version: ENGINE,
    }));

    const baseC2 = r.tensor.verdicts.get('P1-C2-BASE');
    const r2C2 = r.tensor.verdicts.get('P1-C2-R2');
    expect(baseC2).toBeDefined();
    expect(r2C2).toBeDefined();
    expect(['robust', 'marginal', 'tight']).toContain(baseC2!.verdict);
    expect(r2C2!.verdict).toBe('violated');
  });

  it('SC-002: sweep_first trades differently from strait_early — P2 holds C4 robust across all scenarios where P1 does not', async () => {
    const worlds: Record<string, Ref> = {
      BASE: await rig.worldRef(),
      R1: await rig.worldRef('R1'),
      R2: await rig.worldRef('R2'),
      R3: await rig.worldRef('R3'),
    };
    const r = ok(await rig.robustness.robustness({
      plans: [rig.planRef('P1'), rig.planRef('P2')],
      worlds,
      engine_version: ENGINE,
    }));

    const scenarios = ['BASE', 'R1', 'R2', 'R3'];
    const passing: VerdictBand[] = ['robust', 'marginal'];

    for (const sid of scenarios) {
      const p2c4 = r.tensor.verdicts.get(`P2-C4-${sid}`);
      expect(p2c4, `P2-C4-${sid} should have a verdict`).toBeDefined();
      expect(passing, `P2-C4-${sid} should be marginal or better, got ${p2c4!.verdict}`).toContain(p2c4!.verdict);
    }

    const p1c4worst = r.tensor.worst_case.get('P1-C4');
    const p2c4worst = r.tensor.worst_case.get('P2-C4');
    expect(p2c4worst).toBe('robust');
    expect(p1c4worst).not.toBe('robust');
  });

  it('stamps_compatible is true when all worlds share the same consumed knowledge set', async () => {
    const worlds: Record<string, Ref> = {
      BASE: await rig.worldRef(),
      R1: await rig.worldRef('R1'),
      R2: await rig.worldRef('R2'),
    };
    const r = ok(await rig.robustness.robustness({
      plans: [rig.planRef('P1')],
      worlds,
      engine_version: ENGINE,
    }));
    expect(r.tensor.stamps_compatible).toBe(true);
  });

  it('stamps_compatible is false when worlds come from different knowledge sets', async () => {
    const world1 = await rig.worldRef();

    await rig.svc.create({ ...answered('K9'), logical_id: 'K9', version: 2, answer: { lo: 0, hi: 1, unit: 'binary' } });
    const world2 = await rig.worldRef('R1');

    const r = ok(await rig.robustness.robustness({
      plans: [rig.planRef('P1')],
      worlds: { BASE: world1, R1: world2 },
      engine_version: ENGINE,
    }));
    expect(r.tensor.stamps_compatible).toBe(false);
  });

  it('deterministic stamp — same inputs produce identical stamp', async () => {
    const worlds: Record<string, Ref> = {
      BASE: await rig.worldRef(),
      R1: await rig.worldRef('R1'),
    };
    const a = ok(await rig.robustness.robustness({
      plans: [rig.planRef('P1')],
      worlds,
      engine_version: ENGINE,
    }));
    const b = ok(await rig.robustness.robustness({
      plans: [rig.planRef('P1')],
      worlds,
      engine_version: ENGINE,
    }));
    expect(a.stamp).toBe(b.stamp);
  });

  it('worst-case verdict is the minimax across scenarios', async () => {
    const worlds: Record<string, Ref> = {
      BASE: await rig.worldRef(),
      R1: await rig.worldRef('R1'),
      R2: await rig.worldRef('R2'),
      R3: await rig.worldRef('R3'),
    };
    const r = ok(await rig.robustness.robustness({
      plans: [rig.planRef('P1')],
      worlds,
      engine_version: ENGINE,
    }));

    const VERDICT_ORDER: Record<VerdictBand, number> = { violated: 0, tight: 1, marginal: 2, robust: 3 };
    for (const cid of r.tensor.commitments) {
      const wc = r.tensor.worst_case.get(`P1-${cid}`);
      expect(wc).toBeDefined();
      let expectedWorst = 3;
      for (const sid of r.tensor.scenarios) {
        const v = r.tensor.verdicts.get(`P1-${cid}-${sid}`);
        if (v) {
          const ord = VERDICT_ORDER[v.verdict];
          if (ord < expectedWorst) expectedWorst = ord;
        }
      }
      const NAMES: VerdictBand[] = ['violated', 'tight', 'marginal', 'robust'];
      expect(wc).toBe(NAMES[expectedWorst]);
    }
  });

  it('tensor has correct dimensions', async () => {
    const worlds: Record<string, Ref> = {
      BASE: await rig.worldRef(),
      R1: await rig.worldRef('R1'),
    };
    const r = ok(await rig.robustness.robustness({
      plans: [rig.planRef('P1'), rig.planRef('P2')],
      worlds,
      engine_version: ENGINE,
    }));

    expect(r.tensor.scenarios).toEqual(['BASE', 'R1']);
    expect(r.tensor.plans).toEqual(['P1', 'P2']);
    expect(r.tensor.commitments).toEqual(['C1', 'C2', 'C3', 'C4', 'C5', 'C6']);
    expect(r.tensor.verdicts.size).toBe(2 * 6 * 2); // 2 plans × 6 commitments × 2 scenarios
    expect(r.tensor.worst_case.size).toBe(2 * 6); // 2 plans × 6 commitments
  });

  it('refuses on empty scenario set', async () => {
    const r = await rig.robustness.robustness({
      plans: [rig.planRef('P1')],
      worlds: {},
      engine_version: ENGINE,
    });
    expect(isRefusal(r)).toBe(true);
  });

  it('refuses on unknown plan ref', async () => {
    const worlds: Record<string, Ref> = { BASE: await rig.worldRef() };
    const r = await rig.robustness.robustness({
      plans: [{ logical_id: 'P-NONEXISTENT', content_hash: 'bad' }],
      worlds,
      engine_version: ENGINE,
    });
    expect(isRefusal(r)).toBe(true);
  });

  it('refuses on unknown world ref', async () => {
    const r = await rig.robustness.robustness({
      plans: [rig.planRef('P1')],
      worlds: { BASE: { logical_id: 'W-NONEXISTENT', content_hash: 'bad' } },
      engine_version: ENGINE,
    });
    expect(isRefusal(r)).toBe(true);
  });
});

describe('oracle regression guard — robustness path preserves scorer verdicts', () => {
  it('verdicts through robustness match direct scorer verdicts (no information destroyed)', async () => {
    const rig = await setup();
    const scorer = new ScoreService({ store: rig.svc.store, trace: rig.svc.trace, config, commitments });
    const world = await rig.worldRef();
    const direct = await scorer.score({ plan: rig.planRef('P1'), world, scenario: 'BASE', engine_version: ENGINE });
    if (isRefusal(direct)) throw new Error(`refused: ${direct.reason}`);

    const r = ok(await rig.robustness.robustness({
      plans: [rig.planRef('P1')],
      worlds: { BASE: world },
      engine_version: ENGINE,
    }));

    for (const dv of direct.verdicts) {
      const rv = r.tensor.verdicts.get(`P1-${dv.commitment}-BASE`);
      expect(rv, `${dv.commitment} should exist in tensor`).toBeDefined();
      expect(rv!.verdict).toBe(dv.verdict);
      if (dv.margin) {
        expect(rv!.margin).toEqual(dv.margin);
      }
    }
  });

  it('all margin bands are honestly ordered (lo ≤ hi, G6)', async () => {
    const rig = await setup();
    const worlds: Record<string, Ref> = {
      BASE: await rig.worldRef(),
      R1: await rig.worldRef('R1'),
      R2: await rig.worldRef('R2'),
    };
    const r = ok(await rig.robustness.robustness({
      plans: [rig.planRef('P1'), rig.planRef('P2')],
      worlds,
      engine_version: ENGINE,
    }));

    for (const [, v] of r.tensor.verdicts) {
      if (v.margin) {
        expect(v.margin.lo).toBeLessThanOrEqual(v.margin.hi);
      }
    }
  });
});

describe('integration — full pipeline: knowledge → compile → handful → robustness', () => {
  it('thesis-C exit: the generated handful scored across R1/R2/R3 reproduces the collapse', async () => {
    const rig = await setup();
    const scorer = new ScoreService({ store: rig.svc.store, trace: rig.svc.trace, config, commitments });
    const handfulSvc = new HandfulService({ store: rig.svc.store, scorer, config, commitments });
    const baseWorld = await rig.worldRef();

    const h = await handfulSvc.handful({ world: baseWorld, seed: 1, engine_version: ENGINE });
    if (isRefusal(h)) throw new Error(`handful refused: ${h.reason}`);
    expect(h.plans.length).toBeGreaterThanOrEqual(3);

    const worlds: Record<string, Ref> = {
      BASE: baseWorld,
      R1: await rig.worldRef('R1'),
      R2: await rig.worldRef('R2'),
      R3: await rig.worldRef('R3'),
    };

    const r = ok(await rig.robustness.robustness({
      plans: h.plans,
      worlds,
      engine_version: ENGINE,
    }));

    expect(r.tensor.scenarios).toEqual(['BASE', 'R1', 'R2', 'R3']);
    expect(r.tensor.plans.length).toBe(h.plans.length);
    expect(r.tensor.commitments).toEqual(['C1', 'C2', 'C3', 'C4', 'C5', 'C6']);
    expect(r.tensor.stamps_compatible).toBe(true);

    // At least one plan should have a violated worst-case (the collapse under R2)
    let hasCollapse = false;
    for (const pid of r.tensor.plans) {
      for (const cid of r.tensor.commitments) {
        if (r.tensor.worst_case.get(`${pid}-${cid}`) === 'violated') {
          hasCollapse = true;
        }
      }
    }
    expect(hasCollapse).toBe(true);

    // The scenario strip renders without error
    const html = scenarioStrip(r.tensor);
    expect(html).toContain('assay-scenario-strip');
    expect(html).toContain('▼');
  });
});

describe('scenarioStrip component rendering', () => {
  function makeTensor(opts?: { stamps_compatible?: boolean }): ScenarioVerdictTensor {
    const verdicts = new Map<string, CommitmentVerdict>();
    const addV = (plan: string, commitment: string, scenario: string, verdict: VerdictBand) => {
      verdicts.set(`${plan}-${commitment}-${scenario}`, {
        logical_id: `V-${plan}-${commitment}-${scenario}`,
        version: 1,
        plan,
        commitment,
        scenario,
        world_stamp: 'test-stamp',
        verdict,
        engine_version: '0.1.0',
      });
    };

    addV('P1', 'C1', 'BASE', 'robust');
    addV('P1', 'C1', 'R2', 'violated');
    addV('P2', 'C1', 'BASE', 'robust');
    addV('P2', 'C1', 'R2', 'robust');

    const worst_case = new Map<string, VerdictBand>();
    worst_case.set('P1-C1', 'violated');
    worst_case.set('P2-C1', 'robust');

    return {
      scenarios: ['BASE', 'R2'],
      plans: ['P1', 'P2'],
      commitments: ['C1'],
      verdicts,
      worst_case,
      stamps_compatible: opts?.stamps_compatible ?? true,
    };
  }

  it('produces correct number of scenario columns and verdict chips', () => {
    const html = scenarioStrip(makeTensor());
    const chipCount = (html.match(/assay-verdict-chip/g) ?? []).length;
    // 2 plans × 1 commitment × (2 scenarios + 1 worst) = 6 chips
    expect(chipCount).toBe(6);
  });

  it('marks collapsed cells with ▼', () => {
    const html = scenarioStrip(makeTensor());
    expect(html).toContain('▼');
    // P1-C1-R2 (violated) is worse than P1-C1-BASE (robust) → collapse marker
    // P2-C1-R2 (robust) is not worse than P2-C1-BASE (robust) → no collapse
    const collapseCount = (html.match(/▼/g) ?? []).length;
    expect(collapseCount).toBe(1);
  });

  it('renders glow attributes on verdict cells', () => {
    const html = scenarioStrip(makeTensor());
    expect(html).toContain('data-glow-id="vs:P1:C1:BASE"');
    expect(html).toContain('data-glow-id="vs:P1:C1:R2"');
    expect(html).toContain('data-glow-id="vw:P1:C1"');
    expect(html).toContain('data-glow-sig="robust"');
    expect(html).toContain('data-glow-sig="violated"');
  });

  it('renders plan names when provided', () => {
    const html = scenarioStrip(makeTensor(), { planNames: { P1: 'Strait-early', P2: 'Sweep-first' } });
    expect(html).toContain('Strait-early');
    expect(html).toContain('Sweep-first');
  });

  it('renders no incompatibility banner when stamps_compatible is true', () => {
    const html = scenarioStrip(makeTensor({ stamps_compatible: true }));
    expect(html).not.toContain('assay-scenario-incompat');
  });

  it('renders incompatibility banner when stamps_compatible is false', () => {
    const html = scenarioStrip(makeTensor({ stamps_compatible: false }));
    expect(html).toContain('assay-scenario-incompat');
    expect(html).toContain('stamp lineages differ');
  });

  it('renders an HTML table with correct structure', () => {
    const html = scenarioStrip(makeTensor());
    expect(html).toContain('<table class="assay-scenario-strip"');
    expect(html).toContain('<thead>');
    expect(html).toContain('<tbody>');
    expect(html).toContain('worst');
  });
});
