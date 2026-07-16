import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import type {
  Commitment,
  CommitmentVerdict,
  KnowledgeObject,
  Plan,
  ScenarioCOA,
  VerdictBand,
  VignetteConfig,
} from '../src/generated/types.js';
import { ObjectStore, type Ref } from '../src/store.js';
import { KnowledgeService } from '../src/knowledge.js';
import { CompileService } from '../src/compile.js';
import { ScoreService } from '../src/score.js';
import { RobustnessService } from '../src/robustness.js';
import { DiscriminationService, classifySeparation, deriveOperativePairs } from '../src/discrimination.js';
import { discriminationTable } from '../src/components/discriminationTable.js';
import { isRefusal, type DiscriminationResult, type ScenarioVerdictTensor } from '../src/seam.js';
import { ENGINE_VERSION } from '../src/engine.js';

const load = <T>(name: string): T[] =>
  JSON.parse(readFileSync(new URL(`../fixtures/${name}.json`, import.meta.url), 'utf8')) as T[];

const knowledge = load<KnowledgeObject>('knowledge');
const byId = new Map(knowledge.map((k) => [k.logical_id, k]));
const ENGINE = ENGINE_VERSION;

interface Rig {
  store: ObjectStore;
  discrimination: DiscriminationService;
  k11Ref: Ref;
  k13Ref: Ref;
}

async function setup(): Promise<Rig> {
  const store = new ObjectStore();
  const k11 = structuredClone(byId.get('K11')!);
  const k13 = structuredClone(byId.get('K13')!);
  const k11Ref = await store.put(k11 as unknown as Record<string, unknown>);
  const k13Ref = await store.put(k13 as unknown as Record<string, unknown>);
  const discrimination = new DiscriminationService({ store });
  return { store, discrimination, k11Ref, k13Ref };
}

const ok = (r: DiscriminationResult) => {
  if (isRefusal(r)) throw new Error(`expected success, got refusal: ${r.reason} — ${r.explanation}`);
  return r;
};

describe('SPEC-12 — discrimination analysis (thesis D)', () => {
  let rig: Rig;
  beforeEach(async () => {
    rig = await setup();
  });

  it('K11 ranks above K13 (thesis-D exit)', async () => {
    const result = ok(await rig.discrimination.analyse({
      questions: [rig.k11Ref, rig.k13Ref],
      coas: ['R1', 'R2', 'R3'],
      engine_version: ENGINE,
    }));
    expect(result.ranking.length).toBe(2);
    expect(result.ranking[0]!.question.logical_id).toBe('K11');
    expect(result.ranking[1]!.question.logical_id).toBe('K13');
  });

  it('K11 R1-R2 separation is positive (disjoint bands)', async () => {
    const result = ok(await rig.discrimination.analyse({
      questions: [rig.k11Ref],
      coas: ['R1', 'R2', 'R3'],
      engine_version: ENGINE,
    }));
    const k11 = result.ranking[0]!;
    const r1r2 = k11.pairs.find((p) => p.coa_a === 'R1' && p.coa_b === 'R2');
    expect(r1r2).toBeDefined();
    expect(r1r2!.separation.lo).toBeGreaterThan(0);
  });

  it('K13 all-pair separations are negative (overlapping bands)', async () => {
    const result = ok(await rig.discrimination.analyse({
      questions: [rig.k13Ref],
      coas: ['R1', 'R2', 'R3'],
      engine_version: ENGINE,
    }));
    const k13 = result.ranking[0]!;
    for (const pair of k13.pairs) {
      expect(pair.separation.lo).toBeLessThan(0);
    }
  });

  it('cost is present as a Band, never collapsed with separation', async () => {
    const result = ok(await rig.discrimination.analyse({
      questions: [rig.k11Ref, rig.k13Ref],
      coas: ['R1', 'R2', 'R3'],
      engine_version: ENGINE,
    }));
    for (const entry of result.ranking) {
      expect(entry.cost).toBeDefined();
      expect(typeof entry.cost.lo).toBe('number');
      expect(typeof entry.cost.hi).toBe('number');
      expect(entry.cost.unit).toBeTruthy();
    }
  });

  it('K11 cost is higher than K13 cost', async () => {
    const result = ok(await rig.discrimination.analyse({
      questions: [rig.k11Ref, rig.k13Ref],
      coas: ['R1', 'R2', 'R3'],
      engine_version: ENGINE,
    }));
    const k11 = result.ranking.find((e) => e.question.logical_id === 'K11')!;
    const k13 = result.ranking.find((e) => e.question.logical_id === 'K13')!;
    expect(k11.cost.lo).toBeGreaterThan(k13.cost.lo);
  });

  it('per-COA-pair separations are reported', async () => {
    const result = ok(await rig.discrimination.analyse({
      questions: [rig.k11Ref],
      coas: ['R1', 'R2', 'R3'],
      engine_version: ENGINE,
    }));
    const k11 = result.ranking[0]!;
    expect(k11.pairs.length).toBe(3);
    const pairLabels = k11.pairs.map((p) => `${p.coa_a}-${p.coa_b}`).sort();
    expect(pairLabels).toEqual(['R1-R2', 'R1-R3', 'R2-R3']);
  });

  it('deterministic: same inputs produce the same stamp (G1)', async () => {
    const req = {
      questions: [rig.k11Ref, rig.k13Ref],
      coas: ['R1', 'R2', 'R3'],
      engine_version: ENGINE,
    };
    const a = ok(await rig.discrimination.analyse(req));
    const b = ok(await rig.discrimination.analyse(req));
    expect(a.stamp).toBe(b.stamp);
  });

  it('refuses when fewer than two COAs', async () => {
    const result = await rig.discrimination.analyse({
      questions: [rig.k11Ref],
      coas: ['R1'],
      engine_version: ENGINE,
    });
    expect(isRefusal(result)).toBe(true);
  });

  it('best_separation matches the widest pair', async () => {
    const result = ok(await rig.discrimination.analyse({
      questions: [rig.k11Ref],
      coas: ['R1', 'R2', 'R3'],
      engine_version: ENGINE,
    }));
    const k11 = result.ranking[0]!;
    const maxSep = Math.max(...k11.pairs.map((p) => p.separation.lo));
    expect(k11.best_separation.lo).toBe(maxSep);
  });
});

// ---------------------------------------------------------------------------
// SPEC-23 — discrimination v2 (research note 08 §7): operative-pair
// conditioning, three-way classification, ExpectedAnswer provenance.
// ---------------------------------------------------------------------------

/** Synthetic tensor builder: verdicts are a pure function of (plan, commitment, scenario). */
function tensorOf(opts: {
  scenarios: string[];
  plans: string[];
  commitments: string[];
  verdictFn: (p: string, c: string, s: string) => VerdictBand;
  compatible?: boolean;
}): ScenarioVerdictTensor {
  const verdicts = new Map<string, CommitmentVerdict>();
  for (const p of opts.plans) {
    for (const c of opts.commitments) {
      for (const s of opts.scenarios) {
        verdicts.set(`${p}-${c}-${s}`, {
          logical_id: `V-${p}-${c}-${s}`,
          version: 1,
          plan: p,
          commitment: c,
          scenario: s,
          world_stamp: 'w0',
          verdict: opts.verdictFn(p, c, s),
          engine_version: ENGINE,
        });
      }
    }
  }
  return {
    scenarios: opts.scenarios,
    plans: opts.plans,
    commitments: opts.commitments,
    verdicts,
    worst_case: new Map(),
    stamps_compatible: opts.compatible ?? true,
  };
}

/** The frozen-tableau shape: P1's C1/C2 flip between R1 and R2 (violated under R2 only). */
const tableauTensor = (): ScenarioVerdictTensor =>
  tensorOf({
    scenarios: ['BASE', 'R1', 'R2', 'R3'],
    plans: ['P1', 'P2'],
    commitments: ['C1', 'C2', 'C4'],
    verdictFn: (p, c, s) => (p === 'P1' && (c === 'C1' || c === 'C2') && s === 'R2' ? 'violated' : 'robust'),
  });

/** A minimal open question with provenanced expected answers. */
const question = (
  id: string,
  bands: Record<string, { lo: number; hi: number }>,
  unit = 'units',
): KnowledgeObject => ({
  logical_id: id,
  version: 1,
  question: `synthetic ${id}?`,
  subject: `synthetic.${id}`,
  encoding_class: 'banded_soft_cost',
  criticality: 'routine',
  status: 'open',
  jipoe_step: 'step4_determine_adversary_coas',
  expected_answers: Object.entries(bands).map(([coa, b]) => ({
    coa,
    band: { ...b, unit },
    provenance: {
      source_class: 'assessed',
      confidence: 'moderate',
      owner: 'J-2 red cell',
      single_source: false,
    },
  })),
  collection: [{ method: 'synthetic collection', cost: { lo: 1, hi: 2, unit: 'det-days' } }],
});

describe('SPEC-23 — the operative-pair derivation (note 08 §7.1)', () => {
  it('SC-001: a pair is operative iff some plan×commitment verdict diverges across it; evidence carried', async () => {
    const op = await deriveOperativePairs(tableauTensor(), ['R1', 'R2', 'R3']);
    const keys = op.pairs.map((p) => `${p.a}|${p.b}`).sort();
    // P1's C1/C2 are violated under R2 only ⇒ {R1,R2} and {R2,R3} operative, {R1,R3} inert.
    expect(keys).toEqual(['R1|R2', 'R2|R3']);
    const r1r2 = op.pairs.find((p) => p.a === 'R1' && p.b === 'R2')!;
    const witnesses = r1r2.evidence.map((e) => `${e.plan}-${e.commitment}`).sort();
    expect(witnesses).toEqual(['P1-C1', 'P1-C2']);
    expect(r1r2.evidence[0]!.verdict_a).toBe('robust');
    expect(r1r2.evidence[0]!.verdict_b).toBe('violated');
  });

  it('the derivation is restricted to the requested COA vocabulary — BASE never forms a pair', async () => {
    const op = await deriveOperativePairs(tableauTensor(), ['R1', 'R2', 'R3']);
    for (const p of op.pairs) {
      expect(p.a).not.toBe('BASE');
      expect(p.b).not.toBe('BASE');
    }
  });

  it('the derivation is deterministic (G1): same tensor, same stamp', async () => {
    const a = await deriveOperativePairs(tableauTensor(), ['R1', 'R2', 'R3']);
    const b = await deriveOperativePairs(tableauTensor(), ['R1', 'R2', 'R3']);
    expect(a.stamp).toBe(b.stamp);
  });

  it('FR-007: verdicts are the ONLY input — the derivation reads no likelihood, no K14', async () => {
    // Structural assertion: the function signature admits nothing but the
    // tensor and the COA vocabulary; a tensor with identical verdicts yields
    // an identical derivation regardless of any knowledge state.
    const noDivergence = tensorOf({
      scenarios: ['R1', 'R2', 'R3'],
      plans: ['P1'],
      commitments: ['C1'],
      verdictFn: () => 'robust',
    });
    const op = await deriveOperativePairs(noDivergence, ['R1', 'R2', 'R3']);
    expect(op.pairs).toEqual([]);
  });
});

describe('SPEC-23 — the three-way classification (note 08 §7.2)', () => {
  const B = (lo: number, hi: number) => ({ lo, hi, unit: 'u' });

  it('disjoint / partial / nested predicates', () => {
    expect(classifySeparation(B(0, 1), B(2, 3))).toBe('disjoint');
    expect(classifySeparation(B(0, 5), B(3, 8))).toBe('partial');
    expect(classifySeparation(B(2, 3), B(0, 10))).toBe('nested');
    expect(classifySeparation(B(0, 10), B(2, 3))).toBe('nested');
  });

  it('the boundary, stated: touching at exactly one endpoint is PARTIAL (zero separation, unchanged)', () => {
    expect(classifySeparation(B(0, 5), B(5, 10))).toBe('partial');
  });

  it('containment sharing an endpoint is NESTED (the inner band has no exclusive region); identical bands too', () => {
    expect(classifySeparation(B(0, 4), B(0, 10))).toBe('nested');
    expect(classifySeparation(B(6, 10), B(0, 10))).toBe('nested');
    expect(classifySeparation(B(1, 2), B(1, 2))).toBe('nested');
  });

  it('SC-003: the frozen matrix classifies — K11 disjoint/disjoint/partial, K13 partial/nested/partial', async () => {
    const rig = await setup();
    const result = ok(await rig.discrimination.analyse({
      questions: [rig.k11Ref, rig.k13Ref],
      coas: ['R1', 'R2', 'R3'],
      engine_version: ENGINE,
    }));
    const classOf = (id: string, a: string, b: string) =>
      result.ranking
        .find((e) => e.question.logical_id === id)!
        .pairs.find((p) => p.coa_a === a && p.coa_b === b)!.classification;
    expect(classOf('K11', 'R1', 'R2')).toBe('disjoint');
    expect(classOf('K11', 'R1', 'R3')).toBe('disjoint');
    expect(classOf('K11', 'R2', 'R3')).toBe('partial');
    expect(classOf('K13', 'R1', 'R2')).toBe('partial');
    expect(classOf('K13', 'R1', 'R3')).toBe('nested'); // [40,90] ⊂ [30,100] — cannot single out R1
    expect(classOf('K13', 'R2', 'R3')).toBe('partial');
  });
});

describe('SPEC-23 — the operative-conditioned ranking (note 08 §7.1)', () => {
  const store = () => new ObjectStore();

  it('SC-002: K11 ranks above K13 on the operative ranking; cost still a separate band (DEC-19)', async () => {
    const rig = await setup();
    const result = ok(await rig.discrimination.analyse({
      questions: [rig.k11Ref, rig.k13Ref],
      coas: ['R1', 'R2', 'R3'],
      tensor: tableauTensor(),
      engine_version: ENGINE,
    }));
    expect(result.mode).toBe('operative');
    expect(result.operative).toBeDefined();
    expect(result.ranking[0]!.question.logical_id).toBe('K11');
    expect(result.ranking[1]!.question.logical_id).toBe('K13');
    expect(result.ranking[0]!.operative_best!.lo).toBeGreaterThan(0);
    expect(result.ranking[1]!.operative_best!.lo).toBeLessThan(0);
    for (const entry of result.ranking) {
      expect(entry.cost.unit).toBeTruthy(); // value and cost never collapsed
    }
  });

  it('the pinned divergence case: v1 ranks the inert-pair separator first, v2 ranks it below (SC-002)', async () => {
    const s = store();
    // QA separates the INERT pair {R1,R3} strongly (gap 90) but overlaps both
    // operative pairs; QB separates the operative {R1,R2} moderately (gap 2).
    const qaRef = await s.put(question('QA', { R1: { lo: 0, hi: 10 }, R2: { lo: 5, hi: 105 }, R3: { lo: 100, hi: 110 } }) as unknown as Record<string, unknown>);
    const qbRef = await s.put(question('QB', { R1: { lo: 0, hi: 4 }, R2: { lo: 6, hi: 10 }, R3: { lo: 3, hi: 7 } }) as unknown as Record<string, unknown>);
    const svc = new DiscriminationService({ store: s });
    const tensor = tensorOf({
      scenarios: ['R1', 'R2', 'R3'],
      plans: ['P1'],
      commitments: ['C1'],
      verdictFn: (_p, _c, sid) => (sid === 'R2' ? 'violated' : 'robust'), // {R1,R2}, {R2,R3} operative; {R1,R3} inert
    });

    const v1 = ok(await svc.analyse({ questions: [qaRef, qbRef], coas: ['R1', 'R2', 'R3'], engine_version: ENGINE }));
    expect(v1.mode).toBe('all_pairs');
    expect(v1.ranking.map((e) => e.question.logical_id)).toEqual(['QA', 'QB']); // pinned v1 ordering

    const v2 = ok(await svc.analyse({ questions: [qaRef, qbRef], coas: ['R1', 'R2', 'R3'], tensor, engine_version: ENGINE }));
    expect(v2.mode).toBe('operative');
    expect(v2.ranking.map((e) => e.question.logical_id)).toEqual(['QB', 'QA']); // pinned v2 ordering
    expect(v2.ranking[0]!.operative_best!.lo).toBe(2);
    expect(v2.ranking[1]!.operative_best!.lo).toBe(-5);
  });

  it('US2 AS-2: the v1 numeric separations are byte-identical with and without the tensor', async () => {
    const rig = await setup();
    const without = ok(await rig.discrimination.analyse({
      questions: [rig.k11Ref, rig.k13Ref],
      coas: ['R1', 'R2', 'R3'],
      engine_version: ENGINE,
    }));
    const withTensor = ok(await rig.discrimination.analyse({
      questions: [rig.k11Ref, rig.k13Ref],
      coas: ['R1', 'R2', 'R3'],
      tensor: tableauTensor(),
      engine_version: ENGINE,
    }));
    for (const entry of without.ranking) {
      const twin = withTensor.ranking.find((e) => e.question.logical_id === entry.question.logical_id)!;
      for (const pair of entry.pairs) {
        const twinPair = twin.pairs.find((p) => p.coa_a === pair.coa_a && p.coa_b === pair.coa_b)!;
        expect(twinPair.separation).toEqual(pair.separation);
      }
      expect(twin.best_separation).toEqual(entry.best_separation); // all-pairs context preserved (FR-002)
    }
  });

  it('nested pairs are excluded from could-discriminate emphasis: an all-nested question has no operative_best', async () => {
    const s = store();
    // QN is nested on BOTH operative pairs; QP is partial on {R1,R2}.
    const qnRef = await s.put(question('QN', { R1: { lo: 2, hi: 3 }, R2: { lo: 0, hi: 10 }, R3: { lo: 1, hi: 4 } }) as unknown as Record<string, unknown>);
    const qpRef = await s.put(question('QP', { R1: { lo: 0, hi: 6 }, R2: { lo: 4, hi: 10 }, R3: { lo: 3, hi: 8 } }) as unknown as Record<string, unknown>);
    const svc = new DiscriminationService({ store: s });
    const tensor = tensorOf({
      scenarios: ['R1', 'R2', 'R3'],
      plans: ['P1'],
      commitments: ['C1'],
      verdictFn: (_p, _c, sid) => (sid === 'R2' ? 'violated' : 'robust'),
    });
    const result = ok(await svc.analyse({ questions: [qnRef, qpRef], coas: ['R1', 'R2', 'R3'], tensor, engine_version: ENGINE }));
    const qn = result.ranking.find((e) => e.question.logical_id === 'QN')!;
    const qp = result.ranking.find((e) => e.question.logical_id === 'QP')!;
    expect(qn.operative_best).toBeUndefined();
    expect(qp.operative_best).toBeDefined();
    // The no-could-discriminate entry sorts after the one with an operative_best.
    expect(result.ranking[0]!.question.logical_id).toBe('QP');
  });

  it('determinism (G1): same inputs incl. tensor produce the same stamp', async () => {
    const rig = await setup();
    const req = {
      questions: [rig.k11Ref, rig.k13Ref],
      coas: ['R1', 'R2', 'R3'],
      tensor: tableauTensor(),
      engine_version: ENGINE,
    };
    const a = ok(await rig.discrimination.analyse(req));
    const b = ok(await rig.discrimination.analyse(req));
    expect(a.stamp).toBe(b.stamp);
  });
});

describe('SPEC-23 — degenerate states render honest statements (FR-006)', () => {
  it('no tensor: all-pairs fallback, stated', async () => {
    const rig = await setup();
    const result = ok(await rig.discrimination.analyse({
      questions: [rig.k11Ref, rig.k13Ref],
      coas: ['R1', 'R2', 'R3'],
      engine_version: ENGINE,
    }));
    expect(result.mode).toBe('all_pairs');
    expect(result.statement).toContain('no live decision');
  });

  it('incomparable tensor (stamps_compatible=false): greyed, never silently conditioning', async () => {
    const rig = await setup();
    const tensor = tableauTensor();
    tensor.stamps_compatible = false;
    const result = ok(await rig.discrimination.analyse({
      questions: [rig.k11Ref, rig.k13Ref],
      coas: ['R1', 'R2', 'R3'],
      tensor,
      engine_version: ENGINE,
    }));
    expect(result.mode).toBe('all_pairs');
    expect(result.operative).toBeUndefined();
    expect(result.statement).toContain('cannot condition');
  });

  it('one scenario live: nothing is ranked — the queue says so honestly', async () => {
    const rig = await setup();
    const tensor = tensorOf({
      scenarios: ['BASE', 'R1'],
      plans: ['P1'],
      commitments: ['C1'],
      verdictFn: () => 'robust',
    });
    const result = ok(await rig.discrimination.analyse({
      questions: [rig.k11Ref, rig.k13Ref],
      coas: ['R1', 'R2', 'R3'],
      tensor,
      engine_version: ENGINE,
    }));
    expect(result.mode).toBe('degenerate');
    expect(result.ranking).toEqual([]);
    expect(result.statement).toContain('one scenario live');
  });

  it('no divergence anywhere: operative set empty — all-pairs shown, stated', async () => {
    const rig = await setup();
    const tensor = tensorOf({
      scenarios: ['R1', 'R2', 'R3'],
      plans: ['P1'],
      commitments: ['C1'],
      verdictFn: () => 'robust',
    });
    const result = ok(await rig.discrimination.analyse({
      questions: [rig.k11Ref, rig.k13Ref],
      coas: ['R1', 'R2', 'R3'],
      tensor,
      engine_version: ENGINE,
    }));
    expect(result.mode).toBe('all_pairs');
    expect(result.statement).toContain('verdicts do not diverge');
    expect(result.ranking[0]!.question.logical_id).toBe('K11'); // v1 ordering preserved
  });

  it('every pair operative: v2 degenerates gracefully toward v1, stated', async () => {
    const rig = await setup();
    // C1 takes a different verdict under each scenario ⇒ every pair diverges.
    const verdictBy: Record<string, VerdictBand> = { R1: 'robust', R2: 'violated', R3: 'tight' };
    const tensor = tensorOf({
      scenarios: ['R1', 'R2', 'R3'],
      plans: ['P1'],
      commitments: ['C1'],
      verdictFn: (_p, _c, sid) => verdictBy[sid]!,
    });
    const result = ok(await rig.discrimination.analyse({
      questions: [rig.k11Ref, rig.k13Ref],
      coas: ['R1', 'R2', 'R3'],
      tensor,
      engine_version: ENGINE,
    }));
    expect(result.mode).toBe('operative');
    expect(result.operative!.pairs).toHaveLength(3);
    expect(result.statement).toContain('every pair operative');
  });
});

describe('SPEC-23 — the discrimination table renders the v2 surface', () => {
  const B = (lo: number, hi: number, unit = 'u') => ({ lo, hi, unit });

  async function operativeResult() {
    const rig = await setup();
    return ok(await rig.discrimination.analyse({
      questions: [rig.k11Ref, rig.k13Ref],
      coas: ['R1', 'R2', 'R3'],
      tensor: tableauTensor(),
      engine_version: ENGINE,
    }));
  }

  it('US2 AS-1: a nested cell reads "cannot discriminate" (word + mark), distinct from partial\'s "weak"', async () => {
    const result = await operativeResult();
    const html = discriminationTable(result.ranking, { mode: result.mode, operative: result.operative });
    expect(html).toContain('✕ cannot discriminate');
    expect(html).toContain('~ weak — could discriminate');
    expect(html).toContain('✓ discriminates');
  });

  it('US1 AS-1: the operative pairs render with their evidence, in words', async () => {
    const result = await operativeResult();
    const html = discriminationTable(result.ranking, { mode: result.mode, operative: result.operative });
    expect(html).toContain('operative:');
    expect(html).toContain('R1↔R2');
    expect(html).toContain("P1's C1, C2 turn on it");
    expect(html).toContain('>operative<'); // pair chips marked
    expect(html).toContain('Operative Separation'); // the leading column
  });

  it('US3 AS-1: expected bands render with their provenance chips — named owner, assessment not fact (G3)', async () => {
    const result = await operativeResult();
    const html = discriminationTable(result.ranking, { mode: result.mode, operative: result.operative });
    expect(html).toContain('expected answers');
    expect(html).toContain('owner: J-2 red cell');
    expect(html).toContain('assessment, not fact');
  });

  it('an unprovenanced expected row is marked, never silently bare', () => {
    const entry = {
      question: { logical_id: 'QX', content_hash: 'h' },
      pairs: [{ coa_a: 'R1', coa_b: 'R2', separation: B(1, 1), classification: 'disjoint' as const }],
      best_separation: B(1, 1),
      cost: B(1, 2, 'det-days'),
      expected_answers: [
        { coa: 'R1', band: B(0, 1) },
        { coa: 'R2', band: B(2, 3) },
      ],
    };
    const html = discriminationTable([entry]);
    expect(html).toContain('no provenance — expectation unattributed');
  });

  it('FR-006: fallback and degenerate statements render', async () => {
    const rig = await setup();
    const v1 = ok(await rig.discrimination.analyse({
      questions: [rig.k11Ref, rig.k13Ref],
      coas: ['R1', 'R2', 'R3'],
      engine_version: ENGINE,
    }));
    const html = discriminationTable(v1.ranking, { mode: v1.mode, statement: v1.statement });
    expect(html).toContain('no live decision — showing all-pairs separation.');
    const empty = discriminationTable([], { mode: 'degenerate', statement: 'one scenario live — nothing to discriminate.' });
    expect(empty).toContain('one scenario live');
    expect(empty).toContain('No discrimination data.');
  });
});

describe('SPEC-23 — the exhibit reproduces on the REAL frozen tensor (compile → score → robustness → discrimination)', () => {
  const coasFx = load<ScenarioCOA>('coas');
  const commitmentsFx = load<Commitment>('commitments');
  const plansFx = load<Plan>('plans');
  const config = JSON.parse(
    readFileSync(new URL('../fixtures/vignette-config.json', import.meta.url), 'utf8'),
  ) as VignetteConfig;
  const answered = (id: string): KnowledgeObject => ({ ...structuredClone(byId.get(id)!), status: 'answered' });
  const refOf = (id: string): Ref => ({ logical_id: id, content_hash: '' });
  const BASE_K = ['K1', 'K2', 'K3', 'K4', 'K6', 'K7', 'K8', 'K9'];

  it('SC-001/SC-002: {R1,R2} derives operative from P1\'s C1/C2 flips; K11 tops the operative ranking', async () => {
    const svc = new KnowledgeService();
    for (const id of BASE_K) await svc.create(answered(id));
    await svc.create(structuredClone(byId.get('K12a')!));
    await svc.create(structuredClone(byId.get('K12b')!));
    svc.contest('K12a', 'K12b');
    svc.resolve('K12a', 'defector debrief corroborated');
    await svc.create(structuredClone(byId.get('K11')!));
    await svc.create(structuredClone(byId.get('K13')!));
    for (const coa of coasFx) await svc.store.put(coa as unknown as Record<string, unknown>);
    for (const c of commitmentsFx) await svc.store.put(c as unknown as Record<string, unknown>);
    const planRefs: Ref[] = [];
    for (const p of plansFx) planRefs.push(await svc.store.put(p as unknown as Record<string, unknown>));

    const compiler = new CompileService({ knowledge: svc });
    const worlds: Record<string, Ref> = {};
    for (const sid of [undefined, 'R1', 'R2', 'R3'] as const) {
      const r = await compiler.compile({
        knowledge: [...BASE_K, 'K12a'].map(refOf),
        config,
        engine_version: ENGINE,
        ...(sid ? { scenario: sid } : {}),
      });
      if (isRefusal(r)) throw new Error(`compile refused: ${r.reason}`);
      worlds[sid ?? 'BASE'] = r.world;
    }

    const scorer = new ScoreService({ store: svc.store, trace: svc.trace, config, commitments: commitmentsFx });
    const robustness = new RobustnessService({ store: svc.store, scorer, commitments: commitmentsFx });
    const rr = await robustness.robustness({ plans: planRefs, worlds, engine_version: ENGINE });
    if (isRefusal(rr)) throw new Error(`robustness refused: ${rr.reason}`);

    const discrimination = new DiscriminationService({ store: svc.store });
    const result = ok(await discrimination.analyse({
      questions: [svc.store.versions('K11').at(-1)!, svc.store.versions('K13').at(-1)!],
      coas: ['R1', 'R2', 'R3'],
      tensor: rr.tensor,
      engine_version: ENGINE,
    }));

    expect(result.mode).toBe('operative');
    const r1r2 = result.operative!.pairs.find((p) => p.a === 'R1' && p.b === 'R2');
    expect(r1r2).toBeDefined();
    const p1Witnesses = r1r2!.evidence.filter((e) => e.plan === 'P1').map((e) => e.commitment);
    expect(p1Witnesses).toContain('C1');
    expect(p1Witnesses).toContain('C2');

    // The thesis-D exit, conditioned: K11 above K13 on the operative ranking.
    expect(result.ranking[0]!.question.logical_id).toBe('K11');
    expect(result.ranking[0]!.operative_best!.lo).toBeGreaterThan(0);
    expect(result.ranking[1]!.question.logical_id).toBe('K13');
  });
});
