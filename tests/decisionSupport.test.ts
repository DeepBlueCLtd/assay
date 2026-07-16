/**
 * SPEC-24 — the decision support matrix (research note 12; review §4.2/M1).
 *
 * The Meridian exhibit rows are PINNED here (FR-008): the note §7 table is the
 * oracle-style fixture — changing these rows is a register/coverage matter,
 * never a casual code change.
 */
import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import type {
  Commitment,
  KnowledgeObject,
  Plan,
  ScenarioCOA,
  VignetteConfig,
} from '../src/generated/types.js';
import { KnowledgeService } from '../src/knowledge.js';
import { CompileService } from '../src/compile.js';
import { ScoreService } from '../src/score.js';
import { RobustnessService } from '../src/robustness.js';
import { DecisionSupportService } from '../src/decisionSupport.js';
import { dsmTable } from '../src/components/dsmTable.js';
import { componentLegend } from '../src/components/legends.js';
import { isRefusal, type DecisionSupportResult, type DecisionSupportSuccess, type DpEvidence } from '../src/seam.js';
import type { Ref } from '../src/store.js';
import { ENGINE_VERSION } from '../src/engine.js';

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
const COAS = ['R1', 'R2', 'R3'];

interface Rig {
  svc: KnowledgeService;
  dsm: DecisionSupportService;
  planRef: (id: string) => Ref;
  worlds: Record<string, Ref>;
  analyse: (planId: string, overrides?: Partial<Parameters<DecisionSupportService['analyse']>[0]>) => Promise<DecisionSupportResult>;
}

async function setup(): Promise<Rig> {
  const svc = new KnowledgeService();
  for (const id of BASE_K) await svc.create(answered(id));
  await svc.create(K('K12a'));
  await svc.create(K('K12b'));
  svc.contest('K12a', 'K12b');
  svc.resolve('K12a', 'defector debrief corroborated; manifests predate the drawdown');
  await svc.create(K('K11'));
  await svc.create(K('K13'));
  for (const coa of coas) await svc.store.put(coa as unknown as Record<string, unknown>);
  for (const c of commitments) await svc.store.put(c as unknown as Record<string, unknown>);
  const planRefs = new Map<string, Ref>();
  for (const p of plans) planRefs.set(p.logical_id, await svc.store.put(p as unknown as Record<string, unknown>));

  const compiler = new CompileService({ knowledge: svc });
  const worlds: Record<string, Ref> = {};
  for (const sid of ['BASE', 'R1', 'R2', 'R3']) {
    const r = await compiler.compile({
      knowledge: [...BASE_K, 'K12a'].map(ref),
      config,
      engine_version: ENGINE_VERSION,
      ...(sid === 'BASE' ? {} : { scenario: sid }),
    });
    if (isRefusal(r)) throw new Error(`compile ${sid} refused: ${r.reason}`);
    worlds[sid] = r.world;
  }

  const scorer = new ScoreService({ store: svc.store, trace: svc.trace, config, commitments });
  const robustness = new RobustnessService({ store: svc.store, scorer, commitments });
  const dsm = new DecisionSupportService({ store: svc.store, trace: svc.trace, config, robustness });

  const analyse: Rig['analyse'] = (planId, overrides = {}) =>
    dsm.analyse({
      plan: planRefs.get(planId)!,
      world: worlds.BASE!,
      worlds,
      coas: COAS,
      commitments: commitments.map((c) => ref(c.logical_id)),
      questions: [svc.store.versions('K11').at(-1)!, svc.store.versions('K13').at(-1)!],
      engine_version: ENGINE_VERSION,
      ...overrides,
    });

  return { svc, dsm, planRef: (id) => planRefs.get(id)!, worlds, analyse };
}

const ok = (r: DecisionSupportResult): DecisionSupportSuccess => {
  if (isRefusal(r)) throw new Error(`expected success, got refusal: ${r.reason} — ${r.explanation}`);
  return r;
};

const divergences = (evidence: DpEvidence[]) =>
  evidence.filter((e): e is Extract<DpEvidence, { kind: 'scenario_divergence' }> => e.kind === 'scenario_divergence');

describe('SPEC-24 — the pinned Meridian exhibit (note 12 §7, FR-008)', () => {
  let rig: Rig;
  beforeEach(async () => {
    rig = await setup();
  });

  it('P2: exactly {C1, C2, C5} are decision points — uniformly violated (C3) and uniformly robust (C4, C6) are not', async () => {
    const r = ok(await rig.analyse('P2'));
    expect(r.rows.map((row) => row.commitment)).toEqual(['C1', 'C2', 'C5']);
    expect(r.statement).toBeUndefined();
    expect(r.lead).toBe(0);
  });

  it('P2-C1: divergent, commits at step 10 (FE-PACKHORSE enters the strait), KINGFISHER in time with slack 2', async () => {
    const r = ok(await rig.analyse('P2'));
    const c1 = r.rows.find((row) => row.commitment === 'C1')!;
    expect(c1.commit_kind).toBe('route_leg');
    expect(c1.commit_step).toBe(10);
    expect(c1.ltiov).toBe(10);
    expect(c1.commit_detail).toContain('FE-PACKHORSE');
    const divs = divergences(c1.evidence).map((e) => `${e.a}:${e.verdict_a}|${e.b}:${e.verdict_b}`);
    expect(divs).toEqual(['R1:robust|R2:violated', 'R2:violated|R3:robust']);

    // K11 leads (its {R1,R2} bands are disjoint); K13 attaches second (partial).
    expect(c1.discriminators.map((d) => d.question.logical_id)).toEqual(['K11', 'K13']);
    const k11 = c1.discriminators[0]!;
    const r1r2 = k11.pairs.find((p) => p.a === 'R1' && p.b === 'R2')!;
    expect(r1r2.classification).toBe('disjoint');
    expect(r1r2.separation.lo).toBeCloseTo(0.5, 10);
    const kingfisher = k11.collection[0]!;
    expect(kingfisher.method).toContain('KINGFISHER');
    expect(kingfisher.earliest_result).toBe(8);
    expect(kingfisher.in_time).toBe(true);
    expect(kingfisher.slack).toBe(2); // holds the decision open two steps past the report
    expect(c1.tripwires).toEqual([]);
  });

  it('P2-C2: the sweeper commits at step 2 — no collection can answer in time (the honest red state, FR-005)', async () => {
    const r = ok(await rig.analyse('P2'));
    const c2 = r.rows.find((row) => row.commitment === 'C2')!;
    expect(c2.commit_step).toBe(2);
    expect(c2.ltiov).toBe(2);
    expect(c2.commit_detail).toContain('FE-BROOM');
    for (const d of c2.discriminators) {
      for (const co of d.collection) {
        expect(co.in_time).toBe(false); // 8 > 2 and 4 > 2 — red, but the row is present, never dropped
        expect(co.slack).toBeUndefined();
      }
    }
  });

  it('P2-C5: world-decided at the horizon (state metric), margin + divergence evidence, the K9 tripwire (36 < 56)', async () => {
    const r = ok(await rig.analyse('P2'));
    const c5 = r.rows.find((row) => row.commitment === 'C5')!;
    expect(c5.commit_kind).toBe('world_decided');
    expect(c5.commit_step).toBe(config.grid.horizon_steps); // 56
    const divs = divergences(c5.evidence).map((e) => `${e.a}|${e.b}`);
    expect(divs).toEqual(['R1|R3', 'R2|R3']);
    expect(c5.evidence.some((e) => e.kind === 'margin' && e.verdict === 'marginal')).toBe(true);

    // K13's R1/R3 expected bands nest — classified, and K11 still leads.
    const k13 = c5.discriminators.find((d) => d.question.logical_id === 'K13')!;
    expect(k13.pairs.find((p) => p.a === 'R1' && p.b === 'R3')!.classification).toBe('nested');
    expect(c5.discriminators[0]!.question.logical_id).toBe('K11');

    expect(c5.tripwires).toHaveLength(1);
    expect(c5.tripwires[0]!.knowledge.logical_id).toBe('K9');
    expect(c5.tripwires[0]!.valid_until).toBe(36);
    expect(c5.tripwires[0]!.commit_step).toBe(56);
  });

  it('P1: {C1, C2, C3, C4, C5} — strait-early forecloses C1/C2 at step 4, before KINGFISHER can report', async () => {
    const r = ok(await rig.analyse('P1'));
    expect(r.rows.map((row) => row.commitment)).toEqual(['C1', 'C2', 'C3', 'C4', 'C5']);

    for (const cid of ['C1', 'C2']) {
      const row = r.rows.find((x) => x.commitment === cid)!;
      expect(row.commit_step).toBe(4);
      const k11 = row.discriminators.find((d) => d.question.logical_id === 'K11')!;
      expect(k11.collection[0]!.in_time).toBe(false); // 8 > 4 — a day late; P2 held this decision open
    }

    // C3 is margin-class only: no scenario branch, no commit step — a stated absence, never an invented step.
    const c3 = r.rows.find((x) => x.commitment === 'C3')!;
    expect(c3.commit_kind).toBe('none');
    expect(c3.commit_step).toBeUndefined();
    expect(c3.ltiov).toBeUndefined();
    expect(c3.evidence).toEqual([
      { kind: 'margin', scenario: 'BASE', verdict: 'marginal', margin: { lo: 0, hi: 0, unit: 'district cells fired upon' } },
    ]);
    expect(c3.discriminators).toEqual([]);
    expect(c3.commit_detail).toContain('margin-class');

    // C4: FE-ANVIL enters the contested water at step 8 — in time exactly at the boundary (slack 0).
    const c4 = r.rows.find((x) => x.commitment === 'C4')!;
    expect(c4.commit_step).toBe(8);
    const k11c4 = c4.discriminators.find((d) => d.question.logical_id === 'K11')!;
    expect(k11c4.collection[0]!.in_time).toBe(true);
    expect(k11c4.collection[0]!.slack).toBe(0);
  });
});

describe('SPEC-24 — determinism, traces, honesty states', () => {
  let rig: Rig;
  beforeEach(async () => {
    rig = await setup();
  });

  it('G1: byte-identical result on re-run — same stamp, same rows', async () => {
    const a = ok(await rig.analyse('P2'));
    const b = ok(await rig.analyse('P2'));
    expect(b.stamp).toBe(a.stamp);
    expect(JSON.stringify(b)).toBe(JSON.stringify(a));
  });

  it('G3: cited_in edges written at compute time — evidence verdicts, discriminator questions, tripwire knowledge all anchor in the store', async () => {
    ok(await rig.analyse('P2'));
    const edges = rig.svc.trace.edges.filter((e) => e.written_by === 'decision-support-service');
    expect(edges.length).toBeGreaterThan(0);
    expect(edges.every((e) => e.edge_type === 'cited_in')).toBe(true);
    // Every edge terminates in a real stored object — no dead ends (G3).
    for (const e of edges) {
      expect(rig.svc.store.exists(e.from_hash)).toBe(true);
      expect(rig.svc.store.exists(e.to_hash)).toBe(true);
    }
    // The discriminator question and the tripwire knowledge are among the cited.
    const k11Hash = rig.svc.store.versions('K11').at(-1)!.content_hash;
    const k9Hash = rig.svc.store.versions('K9').at(-1)!.content_hash;
    const froms = new Set(edges.map((e) => e.from_hash));
    expect(froms.has(k11Hash)).toBe(true);
    expect(froms.has(k9Hash)).toBe(true);
  });

  it('the honest empty state: a commitment set with nothing at stake states itself, never padded', async () => {
    const r = ok(await rig.analyse('P2', { commitments: [ref('C6')] }));
    expect(r.rows).toEqual([]);
    expect(r.statement).toContain('no verdict turns on open information');
  });

  it('uniformly violated is not a decision point — a plan defect is relax’s business, not a DSM row', async () => {
    const r = ok(await rig.analyse('P2', { commitments: [ref('C3')] }));
    expect(r.rows).toEqual([]); // P2-C3 is violated under every scenario
  });

  it('no discriminating question ⇒ the named intelligence gap, not an empty cell', async () => {
    const r = ok(await rig.analyse('P2', { questions: [] }));
    const c1 = r.rows.find((row) => row.commitment === 'C1')!;
    expect(c1.discriminators).toEqual([]);
    expect(c1.gap).toContain('intelligence gap');
    expect(c1.gap).toContain('R1↔R2');
  });

  it('a collection with no stated earliest result is never assumed answerable', async () => {
    const kt: KnowledgeObject = {
      ...K('K11'),
      logical_id: 'KT',
      collection: [{ method: 'unscheduled source', cost: { lo: 1, hi: 2, unit: 'det-days' } }],
    };
    await rig.svc.create(kt);
    const r = ok(await rig.analyse('P2', { questions: [rig.svc.store.versions('KT').at(-1)!] }));
    const c1 = r.rows.find((row) => row.commitment === 'C1')!;
    const co = c1.discriminators[0]!.collection[0]!;
    expect(co.earliest_result).toBeUndefined();
    expect(co.in_time).toBeUndefined();
    expect(co.slack).toBeUndefined();
  });

  it('mixed stamp lineages: divergence evidence is suppressed with the reason stated — margin-class rows only', async () => {
    // A world compiled from a different knowledge set has a different lineage.
    const compiler = new CompileService({ knowledge: rig.svc });
    const thin = await compiler.compile({
      knowledge: ['K1', 'K2', 'K4', 'K6', 'K7', 'K8', 'K9', 'K12a'].map(ref),
      config,
      scenario: 'R1',
      engine_version: ENGINE_VERSION,
    });
    if (isRefusal(thin)) throw new Error('thin compile refused');
    const r = ok(await rig.analyse('P2', { worlds: { ...rig.worlds, R1: thin.world } }));
    expect(r.stamps_compatible).toBe(false);
    expect(r.statement).toContain('mixed stamp lineages');
    for (const row of r.rows) {
      expect(divergences(row.evidence)).toEqual([]); // margin-class evidence only
    }
  });

  it('the selected world must be among the scenario worlds — otherwise a first-class refusal', async () => {
    const { BASE: _unused, ...withoutBase } = rig.worlds;
    const r = await rig.analyse('P2', { worlds: withoutBase });
    expect(isRefusal(r)).toBe(true);
    if (isRefusal(r)) expect(r.reason).toBe('stamp_mismatch');
  });

  it('FR-003: no urgency, priority, weight, or risk scalar exists anywhere in the result', async () => {
    const r = ok(await rig.analyse('P2'));
    const keys: string[] = [];
    const walk = (o: unknown): void => {
      if (Array.isArray(o)) return o.forEach(walk);
      if (o && typeof o === 'object') {
        for (const [k, v] of Object.entries(o)) {
          keys.push(k);
          walk(v);
        }
      }
    };
    walk(r);
    expect(keys.filter((k) => /urgenc|priorit|weight|risk|utility|rank/i.test(k))).toEqual([]);
  });
});

describe('SPEC-24 — the surface (dsmTable, pure)', () => {
  let rig: Rig;
  let result: DecisionSupportSuccess;
  let html: string;
  const kb = Object.fromEntries(knowledge.map((k) => [k.logical_id, k])) as Record<string, KnowledgeObject>;

  beforeEach(async () => {
    rig = await setup();
    result = ok(await rig.analyse('P2'));
    html = dsmTable(result, { knowledgeById: kb, selectionNote: 'no /select selection exists — derived for the viewer-chosen P2' });
  });

  it('renders the red state with its arithmetic visible, never dropped (FR-005)', () => {
    expect(html).toContain('cannot answer in time — earliest result 8 &gt; LTIOV 2');
    expect(html).toContain('in time — earliest result 8 ≤ LTIOV 10 (slack 2 steps)');
  });

  it('renders the tripwire with the lapse arithmetic and the world-level wording', () => {
    expect(html).toContain('lapses at 36 — before the commit step (56)');
    expect(html).toContain('re-validate before committing');
  });

  it('FR-007: no tasking affordance — no button, no input, no write verb', () => {
    expect(html).not.toMatch(/<button|<input|<select|<form/i);
    expect(html).not.toMatch(/task (this|now|the collection)|collect now|approve|execute/i);
  });

  it('SC-003: no scalar urgency or priority number exists anywhere in the DOM', () => {
    expect(html).not.toMatch(/(urgency|priority|risk score)[ :=]*[\d.]/i);
    // Every rendered quantity is a step count, a band, a verdict, or a classification word.
  });

  it('stamps a value-keyed glow sig per row (G6)', () => {
    expect(html).toContain('data-glow-id="dsm:P2:C1"');
    expect(html).toContain('data-glow-id="dsm:P2:C2"');
    expect(html).toContain('data-glow-id="dsm:P2:C5"');
  });

  it('expected-answer bands render with their provenance chips (SPEC-23 — G3 applies to the matrix)', () => {
    expect(html).toContain('assessment, not fact');
    expect(html).toContain('owner: J-2 red cell');
  });

  it('the honest empty state renders the statement and nothing else', async () => {
    const empty = ok(await rig.analyse('P2', { commitments: [ref('C6')] }));
    const emptyHtml = dsmTable(empty, { knowledgeById: kb });
    expect(emptyHtml).toContain('no verdict turns on open information');
    expect(emptyHtml).not.toContain('<table');
  });

  it('the component legend keys the DSM marks', () => {
    const legendHtml = componentLegend('dsmTable');
    expect(legendHtml).toContain('decision point (derived)');
    expect(legendHtml).toContain('LTIOV state');
    expect(legendHtml).toContain('tripwire');
  });
});
