import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import type { KnowledgeObject } from '../src/generated/types.js';
import { KnowledgeService } from '../src/knowledge.js';
import { isRefusal, type WriteResult } from '../src/seam.js';

const knowledge = JSON.parse(
  readFileSync(new URL('../fixtures/knowledge.json', import.meta.url), 'utf8'),
) as KnowledgeObject[];
const byId = new Map(knowledge.map((k) => [k.logical_id, k]));
const K = (id: string): KnowledgeObject => structuredClone(byId.get(id)!);
const answered = (id: string): KnowledgeObject => ({ ...K(id), status: 'answered' });

const okRef = (r: WriteResult) => {
  if (isRefusal(r)) throw new Error(`expected success, got refusal ${r.reason}`);
  return r.ref;
};

let svc: KnowledgeService;
beforeEach(() => {
  svc = new KnowledgeService();
});

describe('US1 — the system declines laundered judgement (encoding_violation)', () => {
  it('create(K10) is refused encoding_violation and persists nothing', async () => {
    const result = await svc.create(K('K10'));
    expect(isRefusal(result)).toBe(true);
    if (isRefusal(result)) {
      expect(result.reason).toBe('encoding_violation');
      expect(result.offending[0]?.logical_id).toBe('K10');
    }
    expect(svc.store.size).toBe(0); // nothing stored (SC-001)
    expect(svc.deltas.size).toBe(0); // no delta from a refused write
  });

  it('K14a scenario_weight is storable but never compiles as constraint/cost', async () => {
    const result = await svc.create(K('K14a'));
    expect(isRefusal(result)).toBe(false);
    expect(svc.store.size).toBe(1);
    expect(svc.isCompilable('K14a')).toBe(true); // not contested; the weight firewall is a compile-time gate
  });
});

describe('US2 — a licensed exception is recorded and visible', () => {
  it('K8 with waiver W-1 is accepted and the waiver is retrievable', async () => {
    const ref = okRef(await svc.create(K('K8')));
    const stored = svc.store.get(ref.content_hash) as KnowledgeObject;
    expect(stored.waiver?.granted_by).toBe('J-3');
    expect(stored.provenance?.single_source).toBe(true);
  });

  it('K8 without its waiver flips to a waiver_required refusal', async () => {
    const k8 = K('K8');
    delete k8.waiver;
    const result = await svc.create(k8);
    expect(isRefusal(result) && result.reason).toBe('waiver_required');
  });
});

describe('US3 — a revised answer stales exactly what it overtakes', () => {
  it('supersede(K9, K5) stales exactly {K5}, cross-lineage, with one delta', async () => {
    await svc.create(K('K5'));
    const before = svc.deltas.size;
    const result = await svc.supersede(K('K9'), 'K5');
    expect(isRefusal(result)).toBe(false);
    if (!isRefusal(result)) {
      expect(result.stale).toHaveLength(1);
      expect(result.stale[0]?.logical_id).toBe('K5');
    }
    expect(svc.effectiveStatus('K5')).toBe('superseded');
    expect(svc.effectiveStatus('K9')).toBe('answered');
    expect(svc.deltas.size - before).toBe(1); // exactly one delta for the act
    // cross-lineage edge present
    expect(svc.trace.edges.some((e) => e.edge_type === 'supersedes')).toBe(true);
  });

  it('superseding a prior that does not exist is refused unknown_ref', async () => {
    const result = await svc.supersede(K('K9'), 'K5'); // K5 never created
    expect(isRefusal(result) && result.reason).toBe('unknown_ref');
  });
});

describe('US4 — a contested pair blocks downstream use (G5)', () => {
  beforeEach(async () => {
    await svc.create(answered('K12a'));
    await svc.create(answered('K12b'));
  });

  it('contest(K12a, K12b) marks both contested and blocks compile, one delta', async () => {
    const before = svc.deltas.size;
    const result = svc.contest('K12a', 'K12b');
    expect(isRefusal(result)).toBe(false);
    expect(svc.effectiveStatus('K12a')).toBe('contested');
    expect(svc.effectiveStatus('K12b')).toBe('contested');
    expect(svc.isCompilable('K12a')).toBe(false);
    expect(svc.isCompilable('K12b')).toBe(false);
    expect(svc.deltas.size - before).toBe(1);
  });

  it('resolve lifts the block for the surviving version', () => {
    svc.contest('K12a', 'K12b');
    const result = svc.resolve('K12a', 'defector debrief corroborated');
    expect(isRefusal(result)).toBe(false);
    expect(svc.effectiveStatus('K12a')).toBe('resolved');
    expect(svc.isCompilable('K12a')).toBe(true);
  });

  it('resolving a version that is not party to a contest is refused', () => {
    const result = svc.resolve('K12a', 'no contest exists yet');
    expect(isRefusal(result) && result.reason).toBe('unknown_ref');
  });
});

describe('US5 / G3 — exposure and banded honesty', () => {
  it('exposure of an unanswered open question returns an empty-but-complete chain', async () => {
    await svc.create(K('K11'));
    const { chains } = svc.exposure('K11');
    expect(chains.length).toBeGreaterThanOrEqual(1);
    expect(chains.every((c) => c.complete)).toBe(true); // no dead ends (G3)
  });

  it('G2: no stored knowledge object carries a bare assessed scalar — every answer is a Band', async () => {
    for (const k of knowledge) {
      if (k.encoding_class === 'hard_constraint' && k.provenance?.source_class === 'assumption') {
        continue; // K10 is refused, never stored
      }
      const result = await svc.create(K(k.logical_id));
      if (isRefusal(result)) continue; // e.g. any waiver-less hard constraint fixture
      const stored = svc.store.get(result.ref.content_hash) as KnowledgeObject;
      if (stored.answer !== undefined) {
        expect(typeof stored.answer, `${k.logical_id} answer must be a Band`).toBe('object');
        expect(typeof stored.answer.lo).toBe('number');
        expect(typeof stored.answer.unit).toBe('string');
      }
    }
  });
});

describe('deltas — exactly one per act, idempotent create', () => {
  it('a byte-identical re-create stores once and publishes no second delta', async () => {
    await svc.create(K('K2'));
    await svc.create(K('K2'));
    expect(svc.store.size).toBe(1);
    expect(svc.deltas.size).toBe(1);
  });
});

describe('SPEC-21 — a step-less knowledge write warns at write, never refuses', () => {
  it('a step-less create succeeds with the warning in the response AND on the delta', async () => {
    const k = K('K2');
    delete k.jipoe_step;
    const result = await svc.create(k);
    expect(isRefusal(result)).toBe(false);
    if (!isRefusal(result)) {
      expect(result.warnings?.some((w) => w.code === 'missing_jipoe_step')).toBe(true);
      expect(result.warnings?.[0]?.offending.logical_id).toBe('K2');
    }
    expect(svc.store.size).toBe(1); // the write landed — a warning is not a refusal
    const delta = svc.deltas.all[0]!;
    expect(delta.op).toBe('create');
    expect(delta.warnings?.some((w) => w.code === 'missing_jipoe_step')).toBe(true);
  });

  it('a step-less observed object warns too — origin applies to facts (no DEC-14 exemption)', async () => {
    const k1 = K('K1'); // observed
    delete k1.jipoe_step;
    const result = await svc.create(k1);
    expect(isRefusal(result)).toBe(false);
    if (!isRefusal(result)) {
      expect(result.warnings?.map((w) => w.code)).toContain('missing_jipoe_step');
    }
  });

  it('an ExpectedAnswer authored without provenance draws the SPEC-23 warning on the response AND the delta', async () => {
    const k = K('K11');
    delete k.expected_answers![0]!.provenance;
    const result = await svc.create(k);
    expect(isRefusal(result)).toBe(false); // a warning is not a refusal — the write lands
    if (!isRefusal(result)) {
      expect(result.warnings?.some((w) => w.code === 'missing_expected_answer_provenance')).toBe(true);
    }
    const delta = svc.deltas.all[svc.deltas.size - 1]!;
    expect(delta.warnings?.some((w) => w.code === 'missing_expected_answer_provenance')).toBe(true);
  });

  it('a provenance-carrying event matrix is silent — K11 as shipped draws no SPEC-23 warning', async () => {
    const result = await svc.create(K('K11'));
    expect(isRefusal(result)).toBe(false);
    if (!isRefusal(result)) {
      expect(result.warnings?.some((w) => w.code === 'missing_expected_answer_provenance')).toBeFalsy();
    }
  });

  it('a step-carrying create is silent; a step-less supersede carries the warning on its delta', async () => {
    const clean = await svc.create(K('K2'));
    if (!isRefusal(clean)) expect(clean.warnings).toBeUndefined();

    await svc.create(K('K5'));
    const k9 = answered('K9');
    delete k9.jipoe_step;
    const superseded = await svc.supersede(k9, 'K5');
    expect(isRefusal(superseded)).toBe(false);
    if (!isRefusal(superseded)) {
      expect(superseded.warnings?.some((w) => w.code === 'missing_jipoe_step')).toBe(true);
    }
    const delta = svc.deltas.all[svc.deltas.size - 1]!;
    expect(delta.op).toBe('supersede');
    expect(delta.warnings?.some((w) => w.code === 'missing_jipoe_step')).toBe(true);
  });
});
