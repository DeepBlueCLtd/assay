import { describe, expect, it } from 'vitest';
import { ObjectStore } from '../src/store.js';
import { TraceStore } from '../src/trace.js';
import { EDGE_ORIENTATION, influences, informs } from '../src/traceView.js';
import type { TraceEdge } from '../src/generated/types.js';

const edge = (from: string, to: string, type: TraceEdge['edge_type']): TraceEdge => ({
  from_hash: from,
  to_hash: to,
  edge_type: type,
  written_by: 'test-harness',
});

/**
 * The point of these tests: the edges are written in MIXED orientations, so a
 * one-direction walk is WRONG. `compiled_into` is K→World (forward is
 * downstream); `scored_from` is Verdict→World (backward is downstream). A K's
 * true downstream reach must issue forward on one and backward on the other.
 */
describe('traceView — one-hop informs/influences under the orientation map (SPEC-16)', () => {
  it('every edge type has an orientation (no silent gap)', () => {
    for (const t of [
      'compiled_into',
      'scored_from',
      'cited_in',
      'sacrificed_in',
      'supersedes',
      'contests',
      'resolves',
      'waives',
    ] as const) {
      expect(EDGE_ORIENTATION[t]).toBeDefined();
    }
  });

  it('K downstream reaches the world (compiled_into forward) AND the verdict (scored_from backward)', async () => {
    const store = new ObjectStore();
    const k = await store.put({ logical_id: 'K12', version: 1, note: 'stock' });
    const world = await store.put({ logical_id: 'W1', version: 1, stamp: 'abcd' });
    const verdict = await store.put({ logical_id: 'V1', version: 1, verdict: 'tight' });

    const trace = new TraceStore();
    trace.add(edge(k.content_hash, world.content_hash, 'compiled_into')); // K → World
    trace.add(edge(verdict.content_hash, world.content_hash, 'scored_from')); // Verdict → World

    // From the world, "influences" (downstream) must reach the verdict —
    // scored_from points INTO the world, so a naive forward walk would miss it.
    const worldDown = influences(trace, world.content_hash, (h) => store.exists(h));
    expect(worldDown.map((n) => n.hash)).toContain(verdict.content_hash);

    // From K, one hop downstream reaches the world (not the verdict — that is two hops).
    const kDown = influences(trace, k.content_hash, (h) => store.exists(h));
    expect(kDown.map((n) => n.hash)).toEqual([world.content_hash]);

    // The world's upstream ("informs") reaches K (compiled_into) — the mirror.
    const worldUp = informs(trace, world.content_hash, (h) => store.exists(h));
    expect(worldUp.map((n) => n.hash)).toContain(k.content_hash);
  });

  it('a neighbour the store does not know is a dead end (known: false) — surfaced, not hidden (G3)', async () => {
    const store = new ObjectStore();
    const world = await store.put({ logical_id: 'W1', version: 1, stamp: 'ee' });
    const trace = new TraceStore();
    trace.add(edge('phantom-hash', world.content_hash, 'compiled_into'));
    const up = informs(trace, world.content_hash, (h) => store.exists(h));
    const phantom = up.find((n) => n.hash === 'phantom-hash');
    expect(phantom).toBeDefined();
    expect(phantom!.known).toBe(false);
  });

  it('contests is symmetric — shown on both informs and influences', async () => {
    const store = new ObjectStore();
    const a = await store.put({ logical_id: 'K12a', version: 1 });
    const b = await store.put({ logical_id: 'K12b', version: 1 });
    const trace = new TraceStore();
    trace.add(edge(a.content_hash, b.content_hash, 'contests'));
    expect(influences(trace, a.content_hash, () => true).map((n) => n.hash)).toContain(
      b.content_hash,
    );
    expect(informs(trace, a.content_hash, () => true).map((n) => n.hash)).toContain(b.content_hash);
  });

  it('never lists self, even under a cycle', () => {
    const trace = new TraceStore();
    trace.add(edge('a', 'b', 'contests'));
    trace.add(edge('b', 'a', 'contests'));
    const n = influences(trace, 'a', () => true);
    expect(n.every((x) => x.hash !== 'a')).toBe(true);
  });
});
