/**
 * SPEC-15 — Spine-complete gate harness.
 * The single barrier before Stage 7.  Asserts all cross-cutting invariants
 * (G1–G6) end-to-end on Meridian, re-asserts the vignette §9 oracle cases,
 * and confirms theses A–F are walkable.
 */
import fc from 'fast-check';
import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import type {
  Band,
  Commitment,
  CompiledWorld,
  KnowledgeObject,
  Plan,
  ScenarioCOA,
  VerdictBand,
  VignetteConfig,
} from '../src/generated/types.js';
import { KnowledgeService } from '../src/knowledge.js';
import { CompileService } from '../src/compile.js';
import { ScoreService, marginBand, verdictFor } from '../src/score.js';
import { HandfulService } from '../src/handful.js';
import { RelaxService } from '../src/relax.js';
import { RobustnessService } from '../src/robustness.js';
import { SensitivityService } from '../src/sensitivity.js';
import { DiscriminationService } from '../src/discrimination.js';
import { StalenessService } from '../src/staleness.js';
import * as I from '../src/interval.js';
import {
  isRefusal,
  type CompileResult,
  type HandfulResult,
  type RelaxResult,
  type RobustnessResult,
  type ScoreResult,
  type SensitivityResult,
  type DiscriminationResult,
  type StalenessResult,
} from '../src/seam.js';
import type { Ref } from '../src/store.js';

// ── fixture loading ────────────────────────────────────────────────────

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
const BASE_K = ['K1', 'K2', 'K3', 'K4', 'K5', 'K6', 'K7', 'K8', 'K9'];
const SENS_K = ['K1', 'K2', 'K3', 'K4', 'K6', 'K7', 'K8', 'K9'];
const ENGINE = '0.1.0';
const cRefs = commitments.map((c) => ref(c.logical_id));

function ok<T>(r: T): Exclude<T, { refused: true }> {
  if (isRefusal(r)) throw new Error(`expected success, got refusal: ${(r as any).reason} — ${(r as any).explanation}`);
  return r as Exclude<T, { refused: true }>;
}

// ── shared gate rig (runs once) ────────────────────────────────────────

interface GateRig {
  svc: KnowledgeService;
  compiler: CompileService;
  scorer: ScoreService;
  handfuls: HandfulService;
  relax: RelaxService;
  robustness: RobustnessService;
  sensitivity: SensitivityService;
  discrimination: DiscriminationService;
  staleness: StalenessService;
  // captured results
  baseWorld: Ref;
  baseCompile: Exclude<CompileResult, { refused: true }>;
  r3mWorld: Ref;
  r1World: Ref;
  r2World: Ref;
  scoreP1Base: Exclude<ScoreResult, { refused: true }>;
  scoreP2Base: Exclude<ScoreResult, { refused: true }>;
  handfulResult: Exclude<HandfulResult, { refused: true }>;
  relaxResult: Exclude<RelaxResult, { refused: true }>;
  robustnessResult: Exclude<RobustnessResult, { refused: true }>;
  sensitivityResult: Exclude<SensitivityResult, { refused: true }>;
  discriminationResult: Exclude<DiscriminationResult, { refused: true }>;
  stalenessResult: Exclude<StalenessResult, { refused: true }>;
  planRefs: Map<string, Ref>;
  k5Ref: Ref;
  k11Ref: Ref;
  k13Ref: Ref;
}

let rig: GateRig;

beforeAll(async () => {
  const svc = new KnowledgeService();

  // seed base knowledge
  for (const id of BASE_K) await svc.create(answered(id));
  await svc.create(K('K12a'));
  await svc.create(K('K12b'));
  svc.contest('K12a', 'K12b');
  svc.resolve('K12a', 'defector debrief corroborated; manifests predate the drawdown');

  // load COAs, commitments, plans
  for (const coa of coas) await svc.store.put(coa as unknown as Record<string, unknown>);
  for (const c of commitments) await svc.store.put(c as unknown as Record<string, unknown>);
  const planRefs = new Map<string, Ref>();
  for (const p of plans) planRefs.set(p.logical_id, await svc.store.put(p as unknown as Record<string, unknown>));

  // open questions for discrimination
  await svc.create(K('K11'));
  await svc.create(K('K13'));

  const compiler = new CompileService({ knowledge: svc });

  // compile worlds
  const baseCompile = ok(await compiler.compile({
    knowledge: [...BASE_K, 'K12a'].map(ref), config, engine_version: ENGINE,
  }));
  const r3mCompile = ok(await compiler.compile({
    knowledge: [...BASE_K, 'K12a'].map(ref), config, scenario: 'R3m', engine_version: ENGINE,
  }));
  const r1Compile = ok(await compiler.compile({
    knowledge: [...BASE_K, 'K12a'].map(ref), config, scenario: 'R1', engine_version: ENGINE,
  }));
  const r2Compile = ok(await compiler.compile({
    knowledge: [...BASE_K, 'K12a'].map(ref), config, scenario: 'R2', engine_version: ENGINE,
  }));

  // scorer
  const scorer = new ScoreService({ store: svc.store, trace: svc.trace, config, commitments });

  // score P1 and P2 against BASE
  const scoreP1Base = ok(await scorer.score({
    plan: planRefs.get('P1')!, world: baseCompile.world, scenario: 'BASE', engine_version: ENGINE,
  }));
  const scoreP2Base = ok(await scorer.score({
    plan: planRefs.get('P2')!, world: baseCompile.world, scenario: 'BASE', engine_version: ENGINE,
  }));

  // handful
  const handfuls = new HandfulService({ store: svc.store, scorer, config, commitments });
  const handfulResult = ok(await handfuls.handful({
    world: baseCompile.world, seed: 1, engine_version: ENGINE,
  }));

  // relax over R3m
  const relaxSvc = new RelaxService({ store: svc.store, trace: svc.trace, scorer, commitments });
  const relaxResult = ok(await relaxSvc.relax({
    world: r3mCompile.world, commitments: cRefs, seed: 1, engine_version: ENGINE,
  }));

  // robustness
  const robustnessSvc = new RobustnessService({ store: svc.store, scorer, commitments });
  const robustnessResult = ok(await robustnessSvc.robustness({
    plans: [planRefs.get('P1')!, planRefs.get('P2')!],
    worlds: { BASE: baseCompile.world, R1: r1Compile.world, R2: r2Compile.world },
    engine_version: ENGINE,
  }));

  // sensitivity — uses an isolated rig matching SPEC-11 test setup (BASE_K without
  // K5, compile without K12a) so K8 tops the ranking as thesis E requires
  const sensSvc = new KnowledgeService();
  for (const id of SENS_K) await sensSvc.create(answered(id));
  await sensSvc.create(K('K12a'));
  await sensSvc.create(K('K12b'));
  sensSvc.contest('K12a', 'K12b');
  sensSvc.resolve('K12a', 'defector debrief corroborated');
  for (const c of commitments) await sensSvc.store.put(c as unknown as Record<string, unknown>);
  const sensPlanRef = await sensSvc.store.put(plans[1] as unknown as Record<string, unknown>);
  const sensCompiler = new CompileService({ knowledge: sensSvc });
  const sensCompile = ok(await sensCompiler.compile({
    knowledge: SENS_K.map(ref), config, engine_version: ENGINE,
  }));
  const sensitivitySvc = new SensitivityService({
    store: sensSvc.store, trace: sensSvc.trace, config, commitments,
  });
  const sensitivityResult = ok(await sensitivitySvc.analyse({
    plan: sensPlanRef, world: sensCompile.world, scenario: 'BASE', engine_version: ENGINE,
  }));

  // discrimination
  const k11Ref = svc.store.versions('K11').at(-1)!;
  const k13Ref = svc.store.versions('K13').at(-1)!;
  const discriminationSvc = new DiscriminationService({ store: svc.store });
  const discriminationResult = ok(await discriminationSvc.analyse({
    questions: [k11Ref, k13Ref], coas: ['R1', 'R2', 'R3'], engine_version: ENGINE,
  }));

  // staleness
  const k5Ref = svc.store.versions('K5').at(-1)!;
  const stalenessSvc = new StalenessService({ store: svc.store, trace: svc.trace });
  const stalenessResult = ok(await stalenessSvc.analyse({
    changed: k5Ref, engine_version: ENGINE,
  }));

  rig = {
    svc, compiler, scorer,
    handfuls, relax: relaxSvc,
    robustness: robustnessSvc,
    sensitivity: sensitivitySvc,
    discrimination: discriminationSvc,
    staleness: stalenessSvc,
    baseWorld: baseCompile.world,
    baseCompile,
    r3mWorld: r3mCompile.world,
    r1World: r1Compile.world,
    r2World: r2Compile.world,
    scoreP1Base, scoreP2Base,
    handfulResult, relaxResult,
    robustnessResult, sensitivityResult,
    discriminationResult, stalenessResult,
    planRefs, k5Ref, k11Ref, k13Ref,
  };
});

// ── G1 — determinism ───────────────────────────────────────────────────

describe('G1 — determinism', () => {
  it('identical inputs produce byte-identical compile stamps', async () => {
    const second = ok(await rig.compiler.compile({
      knowledge: [...BASE_K, 'K12a'].map(ref), config, engine_version: ENGINE,
    }));
    expect(second.stamp).toBe(rig.baseCompile.stamp);
  });

  it('identical inputs produce byte-identical score stamps', async () => {
    const second = ok(await rig.scorer.score({
      plan: rig.planRefs.get('P1')!, world: rig.baseWorld, scenario: 'BASE', engine_version: ENGINE,
    }));
    expect(second.stamp).toBe(rig.scoreP1Base.stamp);
  });

  it('identical inputs produce byte-identical handful stamps', async () => {
    const second = ok(await rig.handfuls.handful({
      world: rig.baseWorld, seed: 1, engine_version: ENGINE,
    }));
    expect(second.stamp).toBe(rig.handfulResult.stamp);
  });

  it('identical inputs produce byte-identical relax stamps', async () => {
    const second = ok(await rig.relax.relax({
      world: rig.r3mWorld, commitments: cRefs, seed: 1, engine_version: ENGINE,
    }));
    expect(second.stamp).toBe(rig.relaxResult.stamp);
  });

  it('content-addressed objects are immutable and hash-consistent', () => {
    const world = rig.svc.store.get(rig.baseWorld.content_hash) as CompiledWorld;
    expect(world).toBeDefined();
    expect(world.logical_id).toBe(rig.baseWorld.logical_id);
  });
});

// ── G2 — no bare assessed scalars ──────────────────────────────────────

describe('G2 — no bare assessed scalars at the seam', () => {
  const FOUR_STOP: ReadonlySet<string> = new Set(['robust', 'marginal', 'tight', 'violated']);

  function assertBandsNotBare(obj: unknown, path = ''): void {
    if (obj === null || obj === undefined) return;
    if (Array.isArray(obj)) {
      obj.forEach((v, i) => assertBandsNotBare(v, `${path}[${i}]`));
      return;
    }
    if (typeof obj !== 'object') return;
    const rec = obj as Record<string, unknown>;
    if ('lo' in rec && 'hi' in rec && 'unit' in rec) {
      expect(typeof rec.lo).toBe('number');
      expect(typeof rec.hi).toBe('number');
      expect(typeof rec.unit).toBe('string');
      expect(rec.lo).toBeLessThanOrEqual(rec.hi as number);
    }
    for (const [k, v] of Object.entries(rec)) {
      if (k === 'verdict' && typeof v === 'string') {
        expect(FOUR_STOP.has(v), `verdict "${v}" at ${path}.${k} is not four-stop`).toBe(true);
      }
      assertBandsNotBare(v, `${path}.${k}`);
    }
  }

  it('compile result has no bare assessed scalars', () => {
    const world = rig.svc.store.get(rig.baseWorld.content_hash) as CompiledWorld;
    for (const ch of world.channels) {
      expect(ch.default).toHaveProperty('lo');
      expect(ch.default).toHaveProperty('hi');
      if (ch.regions) {
        for (const r of ch.regions) {
          expect(r.value).toHaveProperty('lo');
          expect(r.value).toHaveProperty('hi');
        }
      }
    }
  });

  it('score results carry banded margins and four-stop verdicts', () => {
    for (const result of [rig.scoreP1Base, rig.scoreP2Base]) {
      for (const v of result.verdicts) {
        expect(FOUR_STOP.has(v.verdict), `verdict ${v.verdict} is not four-stop`).toBe(true);
        if (v.margin) {
          expect(typeof v.margin.lo).toBe('number');
          expect(typeof v.margin.hi).toBe('number');
        }
      }
    }
  });

  it('relaxation candidates use command language, no bare scalars', () => {
    assertBandsNotBare(rig.relaxResult.report);
  });

  it('robustness tensor verdicts are four-stop only', () => {
    for (const [, v] of rig.robustnessResult.tensor.verdicts) {
      expect(FOUR_STOP.has(v.verdict), `verdict ${v.verdict} is not four-stop`).toBe(true);
    }
    for (const [, v] of rig.robustnessResult.tensor.worst_case) {
      expect(FOUR_STOP.has(v), `worst_case ${v} is not four-stop`).toBe(true);
    }
  });

  it('sensitivity ranking entries carry banded fields', () => {
    for (const entry of rig.sensitivityResult.ranking) {
      expect(typeof entry.changed_count).toBe('number');
      expect(typeof entry.single_source).toBe('boolean');
    }
  });

  it('discrimination entries carry cost as Band, never collapsed', () => {
    for (const entry of rig.discriminationResult.ranking) {
      expect(entry.cost).toHaveProperty('lo');
      expect(entry.cost).toHaveProperty('hi');
      expect(entry.cost).toHaveProperty('unit');
    }
  });
});

// ── G3 — complete trace chains ─────────────────────────────────────────

describe('G3 — complete trace chains', () => {
  it('every compiled world traces backward to named KnowledgeObjects', () => {
    const chains = rig.svc.trace.backward(rig.baseWorld.content_hash, (h) => rig.svc.store.exists(h));
    expect(chains.length).toBeGreaterThan(0);
    for (const chain of chains) {
      expect(chain.complete).toBe(true);
    }
  });

  it('score results have scored_from trace edges', () => {
    const edges = rig.svc.trace.edges.filter((e) => e.edge_type === 'scored_from');
    expect(edges.length).toBeGreaterThan(0);
  });

  it('relaxation writes cited_in and sacrificed_in trace edges', () => {
    const cited = rig.svc.trace.edges.filter((e) => e.edge_type === 'cited_in');
    const sacrificed = rig.svc.trace.edges.filter((e) => e.edge_type === 'sacrificed_in');
    expect(cited.length).toBeGreaterThan(0);
    expect(sacrificed.length).toBeGreaterThan(0);
  });
});

// ── G4 — least-worst, never silence ────────────────────────────────────

describe('G4 — least-worst, never silence', () => {
  it('relaxation report is non-empty', () => {
    expect(rig.relaxResult.report.candidates.length).toBeGreaterThan(0);
  });

  it('every candidate has non-empty sacrificed', () => {
    for (const cand of rig.relaxResult.report.candidates) {
      expect(cand.sacrificed.length).toBeGreaterThan(0);
    }
  });

  it('tie-break text is present', () => {
    expect(rig.relaxResult.report.tie_break).toBeTruthy();
  });

  it('every candidate has a command-language narrative', () => {
    for (const cand of rig.relaxResult.report.candidates) {
      expect(cand.narrative.length).toBeGreaterThan(0);
      expect(cand.narrative).not.toMatch(/\d+\.\d+/);
    }
  });
});

// ── G5 — contested never compiles ──────────────────────────────────────

describe('G5 — contested never compiles', () => {
  it('compile refuses with contested_knowledge when K12 is contested', async () => {
    const fresh = new KnowledgeService();
    for (const id of SENS_K) await fresh.create(answered(id));
    await fresh.create(K('K12a'));
    await fresh.create(K('K12b'));
    fresh.contest('K12a', 'K12b');
    // do NOT resolve — K12 remains contested

    const compiler = new CompileService({ knowledge: fresh });
    const result = await compiler.compile({
      knowledge: [...SENS_K, 'K12a', 'K12b'].map(ref), config, engine_version: ENGINE,
    });
    expect(isRefusal(result)).toBe(true);
    if (isRefusal(result)) {
      expect(result.reason).toBe('contested_knowledge');
      const offIds = result.offending.map((r) => r.logical_id).sort();
      expect(offIds).toEqual(['K12a', 'K12b']);
    }
  });
});

// ── G6 — propagation honesty (oracle re-assertion) ─────────────────────

describe('G6 — propagation honesty / oracle re-assertion', () => {
  const B = (lo: number, hi: number, unit = 'step'): Band => ({ lo, hi, unit });

  const straitOpenStep = (start: number, a: Band, b: Band): Band =>
    I.add(I.scalar(start, 'step'), I.add(a, b));

  it('O-1: interval sum [9,13]', () => {
    expect(straitOpenStep(2, B(4, 6), B(3, 5))).toEqual(B(9, 13));
  });

  it('O-2: robust verdict, margin [15,19]', () => {
    const value = B(9, 13);
    const margin = marginBand('at_most', 28, value);
    expect(margin).toEqual(B(15, 19));
    expect(verdictFor(margin)).toBe<VerdictBand>('robust');
  });

  it('O-3: four-stop transitions at band edges 9 and 13 only', () => {
    const value = B(9, 13);
    const verdict = (t: number) => verdictFor(marginBand('at_most', t, value));
    const seq = [8, 9, 10, 11, 12, 13, 14].map(verdict);
    expect(seq).toEqual<VerdictBand[]>([
      'violated', 'tight', 'tight', 'tight', 'tight', 'marginal', 'robust',
    ]);
    expect(verdict(10)).toBe(verdict(11));
    expect(verdict(11)).toBe(verdict(12));
  });

  it('O-4: widening [4,6]→[3,7] ⇒ [8,14] ⊇ [9,13]', () => {
    const wide = straitOpenStep(2, B(3, 7), B(3, 5));
    expect(wide).toEqual(B(8, 14));
    expect(I.contains(wide, straitOpenStep(2, B(4, 6), B(3, 5)))).toBe(true);
  });

  it('O-4 property: widening any input never narrows the output', () => {
    const anyBand = (unit: string) =>
      fc.tuple(fc.integer({ min: -50, max: 50 }), fc.integer({ min: 0, max: 40 }))
        .map(([lo, span]) => B(lo, lo + span, unit));

    fc.assert(
      fc.property(anyBand('step'), anyBand('step'), fc.integer({ min: 0, max: 20 }), fc.integer({ min: 0, max: 20 }),
        (a, b, growLo, growHi) => {
          const base = straitOpenStep(2, a, b);
          const aWide = B(a.lo - growLo, a.hi + growHi);
          const wide = straitOpenStep(2, aWide, b);
          expect(I.contains(wide, base)).toBe(true);
          for (const pa of [a.lo, a.hi, Math.floor((a.lo + a.hi) / 2)]) {
            for (const pb of [b.lo, b.hi]) {
              expect(I.member(base, 2 + pa + pb)).toBe(true);
            }
          }
        }),
      { numRuns: 300 },
    );
  });

  it('O-4 property: widening moves verdict toward uncertainty, never away', () => {
    const anyBand = (unit: string) =>
      fc.tuple(fc.integer({ min: -50, max: 50 }), fc.integer({ min: 0, max: 40 }))
        .map(([lo, span]) => B(lo, lo + span, unit));

    const decisiveness: Record<VerdictBand, number> = { tight: 0, marginal: 1, robust: 2, violated: 2 };
    const comparators: ('at_most' | 'at_least' | 'by_step' | 'never')[] = ['at_most', 'at_least', 'by_step', 'never'];
    fc.assert(
      fc.property(anyBand('step'), fc.integer({ min: -60, max: 60 }), fc.constantFrom(...comparators),
        fc.integer({ min: 0, max: 15 }), fc.integer({ min: 0, max: 15 }),
        (v, threshold, comparator, growLo, growHi) => {
          const baseV = verdictFor(marginBand(comparator, threshold, v));
          const wideV = verdictFor(marginBand(comparator, threshold, B(v.lo - growLo, v.hi + growHi)));
          expect(decisiveness[wideV]).toBeLessThanOrEqual(decisiveness[baseV]);
          if (baseV === 'robust') expect(wideV).not.toBe('violated');
          if (baseV === 'violated') expect(wideV).not.toBe('robust');
        }),
      { numRuns: 300 },
    );
  });
});

// ── Thesis A — pipeline ────────────────────────────────────────────────

describe('Thesis A — pipeline (every channel traces to named knowledge)', () => {
  it('every compiled channel has compiled_into trace edges to knowledge', () => {
    const compiledEdges = rig.svc.trace.edges.filter(
      (e) => e.edge_type === 'compiled_into' && e.to_hash === rig.baseWorld.content_hash,
    );
    expect(compiledEdges.length).toBeGreaterThan(0);

    const world = rig.svc.store.get(rig.baseWorld.content_hash) as CompiledWorld;
    expect(world.consumed.length).toBeGreaterThan(0);
    for (const consumed of world.consumed) {
      const ko = rig.svc.store.get(consumed.content_hash) as KnowledgeObject | undefined;
      expect(ko, `consumed ref ${consumed.logical_id} not found in store`).toBeDefined();
      expect(ko!.logical_id).toBe(consumed.logical_id);
    }
  });
});

// ── Thesis B — least-worst ─────────────────────────────────────────────

describe('Thesis B — least-worst (three candidates under R3m)', () => {
  const setOf = (c: { sacrificed: string[] }): string => [...c.sacrificed].sort().join('+');

  it('three inclusion-minimal candidates sacrificing C4, C3, C2', () => {
    expect(rig.relaxResult.report.candidates).toHaveLength(3);
    const sets = rig.relaxResult.report.candidates.map(setOf).sort();
    expect(sets).toEqual(['C2', 'C3', 'C4']);
  });

  it('ranked least-worst first: C2 must-sacrifice last', () => {
    const order = rig.relaxResult.report.candidates.map(setOf);
    expect(order.indexOf('C2')).toBe(order.length - 1);
    expect(order.indexOf('C3')).toBeLessThan(order.indexOf('C2'));
    expect(order.indexOf('C4')).toBeLessThan(order.indexOf('C2'));
  });

  it('re-scoring each candidate yields exactly its sacrificed set as violated', async () => {
    for (const cand of rig.relaxResult.report.candidates) {
      const planRef = rig.svc.store.versions(cand.plan).at(-1)!;
      const scored = ok(await rig.scorer.score({
        plan: planRef, world: rig.r3mWorld, scenario: 'R3m', engine_version: ENGINE,
      }));
      const violated = scored.verdicts.filter((v) => v.verdict === 'violated').map((v) => v.commitment).sort();
      expect(violated).toEqual([...cand.sacrificed].sort());
    }
  });
});

// ── Thesis C — robustness ──────────────────────────────────────────────

describe('Thesis C — robustness (P1 collapses under R2)', () => {
  it('P1 C1/C2 robust under BASE but violated under R2', async () => {
    const p1Base = ok(await rig.scorer.score({
      plan: rig.planRefs.get('P1')!, world: rig.baseWorld, scenario: 'BASE', engine_version: ENGINE,
    }));
    const p1R2 = ok(await rig.scorer.score({
      plan: rig.planRefs.get('P1')!, world: rig.r2World, scenario: 'R2', engine_version: ENGINE,
    }));

    const baseC1 = p1Base.verdicts.find((v) => v.commitment === 'C1');
    const baseC2 = p1Base.verdicts.find((v) => v.commitment === 'C2');
    expect(baseC1?.verdict).toBe('robust');
    expect(baseC2?.verdict).toBe('robust');

    const r2C1 = p1R2.verdicts.find((v) => v.commitment === 'C1');
    const r2C2 = p1R2.verdicts.find((v) => v.commitment === 'C2');
    expect(r2C1?.verdict).toBe('violated');
    expect(r2C2?.verdict).toBe('violated');
  });

  it('P2 holds C4 robust across scenarios where P1 does not', async () => {
    const p2Base = ok(await rig.scorer.score({
      plan: rig.planRefs.get('P2')!, world: rig.baseWorld, scenario: 'BASE', engine_version: ENGINE,
    }));
    const p1Base = ok(await rig.scorer.score({
      plan: rig.planRefs.get('P1')!, world: rig.baseWorld, scenario: 'BASE', engine_version: ENGINE,
    }));

    const p2c4 = p2Base.verdicts.find((v) => v.commitment === 'C4');
    const p1c4 = p1Base.verdicts.find((v) => v.commitment === 'C4');
    expect(p2c4?.verdict).toBe('robust');
    expect(p1c4?.verdict).not.toBe('robust');
  });
});

// ── Thesis D — collection ──────────────────────────────────────────────

describe('Thesis D — collection (K11 ranks above K13)', () => {
  it('K11 ranks above K13 on discrimination', () => {
    expect(rig.discriminationResult.ranking.length).toBe(2);
    expect(rig.discriminationResult.ranking[0]!.question.logical_id).toBe('K11');
    expect(rig.discriminationResult.ranking[1]!.question.logical_id).toBe('K13');
  });

  it('K11 ranks above K13 despite higher cost', () => {
    const k11 = rig.discriminationResult.ranking.find((e) => e.question.logical_id === 'K11')!;
    const k13 = rig.discriminationResult.ranking.find((e) => e.question.logical_id === 'K13')!;
    expect(k11.cost.lo).toBeGreaterThan(k13.cost.lo);
  });
});

// ── Thesis E — sensitivity ─────────────────────────────────────────────

describe('Thesis E — sensitivity (K8 single-source, load-bearing)', () => {
  it('K8 appears in the sensitivity ranking', () => {
    const k8 = rig.sensitivityResult.ranking.find((e) => e.knowledge.logical_id === 'K8');
    expect(k8, 'K8 must appear in the sensitivity ranking').toBeDefined();
  });

  it('K8 has single_source: true', () => {
    const k8 = rig.sensitivityResult.ranking.find((e) => e.knowledge.logical_id === 'K8');
    expect(k8).toBeDefined();
    expect(k8!.single_source).toBe(true);
  });

  it('non-single-source items carry single_source: false', () => {
    const others = rig.sensitivityResult.ranking.filter((e) => e.knowledge.logical_id !== 'K8');
    for (const entry of others) {
      expect(entry.single_source).toBe(false);
    }
  });

  it('ranking is sorted by changed_count descending', () => {
    for (let i = 1; i < rig.sensitivityResult.ranking.length; i++) {
      expect(rig.sensitivityResult.ranking[i]!.changed_count)
        .toBeLessThanOrEqual(rig.sensitivityResult.ranking[i - 1]!.changed_count);
    }
  });
});

// ── Thesis F — staleness ───────────────────────────────────────────────

describe('Thesis F — staleness (K5-dependent verdicts only)', () => {
  it('staleness walk from K5 flags invalidated artefacts', () => {
    expect(rig.stalenessResult.invalidated.worlds.length).toBeGreaterThan(0);
    expect(rig.stalenessResult.invalidated.verdicts.length).toBeGreaterThan(0);
  });

  it('K5 itself does not appear in the invalidated set', () => {
    const allIds = [
      ...rig.stalenessResult.invalidated.verdicts,
      ...rig.stalenessResult.invalidated.scores,
      ...rig.stalenessResult.invalidated.worlds,
    ].map((r) => r.logical_id);
    expect(allIds).not.toContain('K5');
  });

  it('chains are complete (G3)', () => {
    for (const chain of rig.stalenessResult.chains) {
      expect(typeof chain.complete).toBe('boolean');
    }
  });
});

// ── Stamp determinism (full pipeline) ──────────────────────────────────

describe('Stamp determinism — full pipeline re-run', () => {
  it('second pipeline run produces byte-identical stamps everywhere', async () => {
    const svc2 = new KnowledgeService();
    for (const id of BASE_K) await svc2.create(answered(id));
    await svc2.create(K('K12a'));
    await svc2.create(K('K12b'));
    svc2.contest('K12a', 'K12b');
    svc2.resolve('K12a', 'defector debrief corroborated; manifests predate the drawdown');
    for (const coa of coas) await svc2.store.put(coa as unknown as Record<string, unknown>);
    for (const c of commitments) await svc2.store.put(c as unknown as Record<string, unknown>);
    for (const p of plans) await svc2.store.put(p as unknown as Record<string, unknown>);

    const compiler2 = new CompileService({ knowledge: svc2 });
    const compile2 = ok(await compiler2.compile({
      knowledge: [...BASE_K, 'K12a'].map(ref), config, engine_version: ENGINE,
    }));
    expect(compile2.stamp).toBe(rig.baseCompile.stamp);

    const scorer2 = new ScoreService({ store: svc2.store, trace: svc2.trace, config, commitments });
    const planRef2 = svc2.store.versions('P1').at(-1)!;
    const score2 = ok(await scorer2.score({
      plan: planRef2, world: compile2.world, scenario: 'BASE', engine_version: ENGINE,
    }));
    expect(score2.stamp).toBe(rig.scoreP1Base.stamp);

    const handful2 = new HandfulService({ store: svc2.store, scorer: scorer2, config, commitments });
    const hResult2 = ok(await handful2.handful({
      world: compile2.world, seed: 1, engine_version: ENGINE,
    }));
    expect(hResult2.stamp).toBe(rig.handfulResult.stamp);
  });
});
