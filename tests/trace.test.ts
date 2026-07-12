import { describe, expect, it } from 'vitest';
import { ObjectStore } from '../src/store.js';
import { TraceStore } from '../src/trace.js';
import type { TraceEdge } from '../src/generated/types.js';

const edge = (from: string, to: string, type: TraceEdge['edge_type']): TraceEdge => ({
  from_hash: from,
  to_hash: to,
  edge_type: type,
  written_by: 'test-harness',
});

describe('trace-graph store (SPEC-02; Stage-0 exit: a hand-written chain walks both ways)', () => {
  it('walks the K9→K5→world→verdict chain forward and backward', async () => {
    const store = new ObjectStore();
    const k9 = await store.put({ logical_id: 'K9', version: 1, note: 'fresh forecast' });
    const k5 = await store.put({ logical_id: 'K5', version: 1, note: 'expiring forecast' });
    const world = await store.put({ logical_id: 'W1', version: 1, stamp: '7f3a' });
    const verdict = await store.put({ logical_id: 'V1', version: 1, verdict: 'tight' });

    const trace = new TraceStore();
    trace.add(edge(k9.content_hash, k5.content_hash, 'supersedes')); // cross-lineage (DEC-21)
    trace.add(edge(k5.content_hash, world.content_hash, 'compiled_into'));
    trace.add(edge(world.content_hash, verdict.content_hash, 'scored_from'));

    const forward = trace.forward(k9.content_hash, (h) => store.exists(h));
    expect(forward).toHaveLength(1);
    expect(forward[0]!.nodes).toEqual([
      k9.content_hash,
      k5.content_hash,
      world.content_hash,
      verdict.content_hash,
    ]);
    expect(forward[0]!.complete).toBe(true);

    const backward = trace.backward(verdict.content_hash, (h) => store.exists(h));
    expect(backward).toHaveLength(1);
    expect(backward[0]!.nodes).toEqual([
      verdict.content_hash,
      world.content_hash,
      k5.content_hash,
      k9.content_hash,
    ]);
    expect(backward[0]!.complete).toBe(true);
  });

  it('a chain terminating in an unknown hash is complete: false — a dead end surfaced, not hidden (G3)', async () => {
    const store = new ObjectStore();
    const verdict = await store.put({ logical_id: 'V1', version: 1, verdict: 'robust' });
    const trace = new TraceStore();
    trace.add(edge('deadbeef-not-in-store', verdict.content_hash, 'scored_from'));
    const backward = trace.backward(verdict.content_hash, (h) => store.exists(h));
    expect(backward[0]!.complete).toBe(false);
  });

  it('branches produce one chain per path', () => {
    const trace = new TraceStore();
    trace.add(edge('k', 'w1', 'compiled_into'));
    trace.add(edge('k', 'w2', 'compiled_into'));
    const chains = trace.forward('k');
    expect(chains).toHaveLength(2);
  });

  it('cycles are guarded, not fatal', () => {
    const trace = new TraceStore();
    trace.add(edge('a', 'b', 'contests'));
    trace.add(edge('b', 'a', 'contests'));
    const chains = trace.forward('a');
    expect(chains.length).toBeGreaterThan(0); // terminates
  });
});
