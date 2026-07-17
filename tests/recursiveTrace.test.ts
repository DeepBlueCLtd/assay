/**
 * SPEC-26 US3 (SC-003) — the recursive trace tooltip matches the one traversal,
 * caps honestly, and renders dead ends at every depth (G3/G4).
 */
import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Commitment, KnowledgeObject, Plan, VignetteConfig } from '../src/generated/types.js';
import { KnowledgeService } from '../src/knowledge.js';
import { CompileService } from '../src/compile.js';
import { ScoreService } from '../src/score.js';
import { isRefusal } from '../src/seam.js';
import type { Ref } from '../src/store.js';
import { ObjectStore } from '../src/store.js';
import { TraceStore } from '../src/trace.js';
import { neighbours } from '../src/traceView.js';
import { buildDepGraph } from '../src/depGraph.js';
import {
  buildRecursiveTrace,
  recursiveTrace,
  TRACE_DEPTH_CAP,
  OPERATION_GLOSS,
  type RecursiveHop,
} from '../src/components/recursiveTrace.js';

const load = <T>(name: string): T[] =>
  JSON.parse(readFileSync(new URL(`../fixtures/${name}.json`, import.meta.url), 'utf8')) as T[];
const knowledge = load<KnowledgeObject>('knowledge');
const commitments = load<Commitment>('commitments');
const plans = load<Plan>('plans');
const config = JSON.parse(
  readFileSync(new URL('../fixtures/vignette-config.json', import.meta.url), 'utf8'),
) as VignetteConfig;
const byId = new Map(knowledge.map((k) => [k.logical_id, k]));
const answered = (id: string): KnowledgeObject => ({ ...structuredClone(byId.get(id)!), status: 'answered' });
const ref = (id: string): Ref => ({ logical_id: id, content_hash: '' });
const BASE_K = ['K1', 'K2', 'K3', 'K4', 'K5', 'K6', 'K7', 'K8'];

interface Rig {
  svc: KnowledgeService;
  p2c2: string;
}

async function setup(): Promise<Rig> {
  const svc = new KnowledgeService();
  for (const id of BASE_K) await svc.create(answered(id));
  for (const c of commitments) await svc.store.put(c as unknown as Record<string, unknown>);
  for (const p of plans) await svc.store.put(p as unknown as Record<string, unknown>);
  const compiler = new CompileService({ knowledge: svc });
  const compiled = await compiler.compile({ knowledge: BASE_K.map(ref), config, engine_version: '0.2.0' });
  if (isRefusal(compiled)) throw new Error('compile refused');
  const scorer = new ScoreService({ store: svc.store, trace: svc.trace, config, commitments });
  for (const p of plans) {
    const planRef = svc.store.versions(p.logical_id).at(-1)!;
    await scorer.score({ plan: planRef, world: compiled.world, scenario: 'BASE', engine_version: '0.2.0' });
  }
  // The P2·C2 verdict is the from_hash of one scored_from edge.
  const p2c2 = svc.trace.edges
    .filter((e) => e.edge_type === 'scored_from')
    .map((e) => e.from_hash)
    .find((h) => {
      const o = svc.store.get(h) as Record<string, unknown> | undefined;
      return o?.plan === 'P2' && o?.commitment === 'C2';
    });
  if (!p2c2) throw new Error('no P2·C2 verdict');
  return { svc, p2c2 };
}

const allHops = (hops: RecursiveHop[]): RecursiveHop[] =>
  hops.flatMap((h) => [h, ...allHops(h.children)]);

describe('recursiveTrace — one traversal, cap 3 (FR-006/FR-007, SC-003)', () => {
  let rig: Rig;
  beforeEach(async () => {
    rig = await setup();
  });

  it('the depth cap is the stated constant 3', () => {
    expect(TRACE_DEPTH_CAP).toBe(3);
  });

  it('roots ARE the one-hop neighbours — no paraphrase layer (FR-006)', () => {
    const roots = buildRecursiveTrace(rig.svc.trace, rig.svc.store, rig.p2c2, 'informs');
    const oneHop = neighbours(rig.svc.trace, rig.p2c2, 'informs', (h) => rig.svc.store.exists(h));
    expect(roots.map((r) => `${r.hash}|${r.edge_type}`).sort()).toEqual(
      oneHop.map((n) => `${n.hash}|${n.edge_type}`).sort(),
    );
  });

  it('every hop edge is a real edge in the trace graph (labelled from the graph itself)', () => {
    const hops = allHops(buildRecursiveTrace(rig.svc.trace, rig.svc.store, rig.p2c2, 'informs'));
    const edgeTypes = new Set(rig.svc.trace.edges.map((e) => e.edge_type));
    for (const h of hops) expect(edgeTypes.has(h.edge_type)).toBe(true);
  });

  it('the reachable set matches the dependency-graph walk (one walker, FR-007)', () => {
    const down = buildRecursiveTrace(rig.svc.trace, rig.svc.store, rig.p2c2, 'influences', TRACE_DEPTH_CAP);
    const recursiveHashes = new Set(allHops(down).map((h) => h.hash));
    const graph = buildDepGraph(rig.p2c2, rig.svc.trace, rig.svc.store, TRACE_DEPTH_CAP);
    const graphHashes = new Set(graph.downstream.flatMap((l) => l.nodes).map((n) => n.hash));
    expect(recursiveHashes).toEqual(graphHashes);
  });

  it('never recurses past the cap — no hop deeper than 3', () => {
    const hops = allHops(buildRecursiveTrace(rig.svc.trace, rig.svc.store, rig.p2c2, 'informs', 3));
    expect(Math.max(...hops.map((h) => h.depth))).toBeLessThanOrEqual(3);
  });

  it('at the cap the remainder is counted, never silent (G4)', () => {
    // A cap of 1 forces the onward chain into a counted remainder on the roots.
    const shallow = buildRecursiveTrace(rig.svc.trace, rig.svc.store, rig.p2c2, 'informs', 1);
    expect(shallow.some((h) => (h.remainder ?? 0) > 0)).toBe(true);
    const html = recursiveTrace(rig.svc.trace, rig.svc.store, rig.p2c2, { depthCap: 1 });
    expect(html).toContain('open full trace');
    expect(html).toContain('data-remainder-hash');
  });

  it('computation edges carry a fixed operation gloss, others the edge type alone', () => {
    const hops = allHops(buildRecursiveTrace(rig.svc.trace, rig.svc.store, rig.p2c2, 'informs'));
    const scored = hops.find((h) => h.edge_type === 'scored_from');
    expect(scored?.operationGloss).toBe(OPERATION_GLOSS.scored_from);
  });
});

describe('recursiveTrace — dead ends and cycles (G3, note §5)', () => {
  it('a dead end renders as a dead end at any depth (known:false)', () => {
    const store = new ObjectStore();
    const trace = new TraceStore();
    // A known knowledge object whose influence points at a hash never stored.
    // (contrive: a compiled_into edge K→<phantom world>.)
    const kHash = 'known-k-hash';
    // Seed a fake stored object under a real hash via put, then wire an edge to a
    // phantom hash the store does not know.
    return (async () => {
      const kRef = await store.put({ logical_id: 'KX', name: 'x', status: 'answered' });
      trace.add({ from_hash: kRef.content_hash, to_hash: 'phantom-world', edge_type: 'compiled_into', written_by: 'test' });
      const hops = buildRecursiveTrace(trace, store, kRef.content_hash, 'influences');
      const phantom = hops.find((h) => h.hash === 'phantom-world');
      expect(phantom).toBeDefined();
      expect(phantom!.known).toBe(false);
      expect(phantom!.children).toEqual([]); // no onward walk from a dead end
      expect(recursiveTrace(trace, store, kRef.content_hash, {})).toContain('dead end');
    })();
  });

  it('a contested pair renders `contests` on both flanks, cycle-guarded (never loops)', async () => {
    const store = new ObjectStore();
    const trace = new TraceStore();
    const aRef = await store.put({ logical_id: 'K12a', name: 'mines low', status: 'contested' });
    const bRef = await store.put({ logical_id: 'K12b', name: 'mines high', status: 'contested' });
    trace.add({ from_hash: aRef.content_hash, to_hash: bRef.content_hash, edge_type: 'contests', written_by: 'test' });

    const up = buildRecursiveTrace(trace, store, aRef.content_hash, 'informs');
    const down = buildRecursiveTrace(trace, store, aRef.content_hash, 'influences');
    // `contests` is symmetric — it shows on both flanks…
    expect(up.some((h) => h.hash === bRef.content_hash && h.edge_type === 'contests')).toBe(true);
    expect(down.some((h) => h.hash === bRef.content_hash && h.edge_type === 'contests')).toBe(true);
    // …and the walk from K12b back does not loop onto K12a (cycle guard): the
    // K12b hop has no K12a child.
    const bHop = up.find((h) => h.hash === bRef.content_hash)!;
    expect(bHop.children.some((c) => c.hash === aRef.content_hash)).toBe(false);
  });
});
