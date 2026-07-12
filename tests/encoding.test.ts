import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { KnowledgeObject } from '../src/generated/types.js';
import { checkEncoding, mayCompileAsConstraintOrCost } from '../src/encoding.js';

const knowledge = JSON.parse(
  readFileSync(new URL('../fixtures/knowledge.json', import.meta.url), 'utf8'),
) as KnowledgeObject[];
const byId = new Map(knowledge.map((k) => [k.logical_id, k]));
const K = (id: string): KnowledgeObject => structuredClone(byId.get(id)!);

describe('encoding-discipline firewall (knowledge model §9; SPEC-05)', () => {
  it('K10: an assumption claiming hard_constraint is refused encoding_violation', () => {
    const refusal = checkEncoding(K('K10'));
    expect(refusal?.reason).toBe('encoding_violation');
    expect(refusal?.offending[0]?.logical_id).toBe('K10');
  });

  it('K10: no waiver can license an assumption as a hard constraint', () => {
    const k10 = K('K10');
    k10.waiver = { granted_by: 'J-3', justification: 'try to waive it', granted_at: 2 };
    expect(checkEncoding(k10)?.reason).toBe('encoding_violation');
  });

  it('K8: an assessed hard_constraint WITH a waiver compiles (no refusal)', () => {
    expect(checkEncoding(K('K8'))).toBeNull();
  });

  it('K8: the same assessed hard_constraint WITHOUT a waiver is refused waiver_required', () => {
    const k8 = K('K8');
    delete k8.waiver;
    const refusal = checkEncoding(k8);
    expect(refusal?.reason).toBe('waiver_required');
    expect(refusal?.offending[0]?.logical_id).toBe('K8');
  });

  it('K1: an observed hard_constraint compiles unbanded (no refusal)', () => {
    expect(checkEncoding(K('K1'))).toBeNull();
  });

  it('banded_soft_cost is never subject to the hard_constraint firewall', () => {
    expect(checkEncoding(K('K2'))).toBeNull(); // assessed banded_soft_cost
    expect(checkEncoding(K('K6'))).toBeNull(); // low-confidence assessed banded_soft_cost
  });

  it('K14a: a scenario_weight is storable but never compiles as constraint or cost', () => {
    expect(checkEncoding(K('K14a'))).toBeNull(); // storable
    expect(mayCompileAsConstraintOrCost(K('K14a'))).toBe(false); // firewalled from compile
    expect(mayCompileAsConstraintOrCost(K('K2'))).toBe(true); // an ordinary cost still compiles
  });
});
