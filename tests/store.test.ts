import { describe, expect, it } from 'vitest';
import { ObjectStore } from '../src/store.js';

describe('content-addressed object store (SPEC-01; Stage-0 exit)', () => {
  it('round-trips a KnowledgeObject with a stable content hash', async () => {
    const store = new ObjectStore();
    const k = {
      logical_id: 'K2',
      version: 1,
      question: 'What load will the Ledger–Anchor causeway bear?',
      subject: 'mobility.causeway',
      encoding_class: 'banded_soft_cost',
      answer: { lo: 20, hi: 40, unit: 'tonnes' },
      criticality: 'important',
      status: 'answered',
    };
    const ref1 = await store.put(k);
    const ref2 = await store.put({ ...k }); // same content, different object identity
    expect(ref1.content_hash).toBe(ref2.content_hash); // idempotent PUT
    expect(store.exists(ref1.content_hash)).toBe(true);
    expect(store.get(ref1.content_hash)).toEqual(k);
    expect(store.size).toBe(1);
  });

  it('hash is independent of authoring key order', async () => {
    const store = new ObjectStore();
    const a = await store.put({ logical_id: 'X', version: 1, b: 2, a: 1 });
    const b = await store.put({ a: 1, b: 2, version: 1, logical_id: 'X' });
    expect(a.content_hash).toBe(b.content_hash);
  });

  it('returned objects are copies — the store cannot be mutated from outside', async () => {
    const store = new ObjectStore();
    const ref = await store.put({ logical_id: 'K9', version: 1, answer: { lo: 1.1, hi: 1.8, unit: 'm' } });
    const got = store.get(ref.content_hash) as { answer: { lo: number } };
    got.answer.lo = 999;
    expect((store.get(ref.content_hash) as { answer: { lo: number } }).answer.lo).toBe(1.1);
  });

  it('versions() returns the lineage oldest-first', async () => {
    const store = new ObjectStore();
    const v1 = await store.put({ logical_id: 'K5', version: 1, note: 'first' });
    const v2 = await store.put({ logical_id: 'K5', version: 2, note: 'revised' });
    const lineage = store.versions('K5');
    expect(lineage.map((r) => r.content_hash)).toEqual([v1.content_hash, v2.content_hash]);
    expect(store.versions('K99')).toEqual([]);
  });

  it('there is no update and no delete', () => {
    const store = new ObjectStore() as unknown as Record<string, unknown>;
    expect(store.update).toBeUndefined();
    expect(store.delete).toBeUndefined();
  });
});
