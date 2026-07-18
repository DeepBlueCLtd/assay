import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import type {
  Commitment,
  KnowledgeObject,
  Plan,
  TraceEdge,
  VignetteConfig,
} from '../src/generated/types.js';
import { ObjectStore } from '../src/store.js';
import { TraceStore } from '../src/trace.js';
import {
  influences,
  informs,
  recursiveNeighbours,
  RECURSIVE_TRACE_DEPTH_CAP,
  RECURSIVE_TRACE_BREADTH_CAP,
  type TraceHop,
} from '../src/traceView.js';
import { buildDepGraph } from '../src/depGraph.js';
import { KnowledgeService } from '../src/knowledge.js';
import { CompileService } from '../src/compile.js';
import { ScoreService } from '../src/score.js';
import { isRefusal } from '../src/seam.js';
import type { Ref } from '../src/store.js';
import { ENGINE_VERSION } from '../src/engine.js';
import { recursiveTrace, type LabelledHop, type LabelledTrace } from '../src/components/recursiveTrace.js';

const edge = (from: string, to: string, type: TraceEdge['edge_type']): TraceEdge => ({
  from_hash: from,
  to_hash: to,
  edge_type: type,
  written_by: 'test-harness',
});

/** Flatten every hop in a recursive tree (any depth). */
function allHops(children: TraceHop[]): TraceHop[] {
  return children.flatMap((h) => [h, ...allHops(h.children)]);
}

// ---------------------------------------------------------------------------
// Pure model — recursiveNeighbours (traceView), synthetic deterministic edges.
// ---------------------------------------------------------------------------
describe('recursiveNeighbours — the depth-capped tree (SPEC-26 US3 / DEC-38)', () => {
  it('the depth cap is the stated constant 3, not adaptive', () => {
    expect(RECURSIVE_TRACE_DEPTH_CAP).toBe(3);
  });

  it('depth-1 children equal neighbours() exactly — one traversal semantics, no parallel walker (FR-007)', () => {
    // Verdict → World → K, plus a second K, all one hop apart around the world.
    const trace = new TraceStore();
    trace.add(edge('K', 'W', 'compiled_into')); // K → World (informs the world upstream)
    trace.add(edge('K2', 'W', 'compiled_into'));
    trace.add(edge('V', 'W', 'scored_from')); // Verdict → World
    const known = () => true;

    const up = recursiveNeighbours(trace, 'W', 'informs', known);
    expect(up.children.map((h) => `${h.hash}|${h.edge_type}`).sort()).toEqual(
      informs(trace, 'W', known).map((n) => `${n.hash}|${n.edge_type}`).sort(),
    );

    const down = recursiveNeighbours(trace, 'W', 'influences', known);
    expect(down.children.map((h) => `${h.hash}|${h.edge_type}`).sort()).toEqual(
      influences(trace, 'W', known).map((n) => `${n.hash}|${n.edge_type}`).sort(),
    );
  });

  it('a verdict reads down its provenance chain: verdict → world (depth 1) → knowledge (depth 2)', () => {
    const trace = new TraceStore();
    trace.add(edge('K', 'W', 'compiled_into')); // K → World
    trace.add(edge('V', 'W', 'scored_from')); // Verdict → World
    const t = recursiveNeighbours(trace, 'V', 'informs', () => true);

    // depth 1: the world, via scored_from (the interval evaluation edge)
    expect(t.children).toHaveLength(1);
    const world = t.children[0]!;
    expect(world.hash).toBe('W');
    expect(world.edge_type).toBe('scored_from');
    expect(world.depth).toBe(1);
    // depth 2: the knowledge, via compiled_into
    expect(world.children).toHaveLength(1);
    const k = world.children[0]!;
    expect(k.hash).toBe('K');
    expect(k.edge_type).toBe('compiled_into');
    expect(k.depth).toBe(2);
  });

  it('caps at depth 3 and counts the onward remainder — never a silent stop (G4)', () => {
    // A straight informs chain 5 hops long: origin → a → b → c → d → e.
    const trace = new TraceStore();
    // Use compiled_into (forward = downstream); informs walks it backward, so
    // build the chain so that informs(origin) = a, informs(a) = b, ...
    trace.add(edge('a', 'origin', 'compiled_into'));
    trace.add(edge('b', 'a', 'compiled_into'));
    trace.add(edge('c', 'b', 'compiled_into'));
    trace.add(edge('d', 'c', 'compiled_into'));
    trace.add(edge('e', 'd', 'compiled_into'));
    const t = recursiveNeighbours(trace, 'origin', 'informs', () => true);

    const hops = allHops(t.children);
    // No hop is deeper than the cap.
    expect(Math.max(...hops.map((h) => h.depth))).toBe(3);
    // The depth-3 hop (c) has an onward remainder (d) that was not expanded.
    const capHop = hops.find((h) => h.depth === 3)!;
    expect(capHop.hash).toBe('c');
    expect(capHop.children).toHaveLength(0);
    expect(capHop.remainder).toBe(1); // d — counted, not dropped
  });

  it('a fully-exhausted chain shorter than the cap has no remainder', () => {
    const trace = new TraceStore();
    trace.add(edge('a', 'origin', 'compiled_into'));
    trace.add(edge('b', 'a', 'compiled_into'));
    const t = recursiveNeighbours(trace, 'origin', 'informs', () => true);
    const hops = allHops(t.children);
    expect(hops.every((h) => h.remainder === 0)).toBe(true);
    expect(Math.max(...hops.map((h) => h.depth))).toBe(2);
  });

  it('dead ends render as dead ends at every depth (G3)', () => {
    const store = new ObjectStore();
    // Only 'a' exists; 'phantom' is referenced but never stored.
    // origin ← a ← phantom (informs chain)
    const trace = new TraceStore();
    trace.add(edge('a', 'origin', 'compiled_into'));
    trace.add(edge('phantom', 'a', 'compiled_into'));
    const known = (h: string): boolean => h === 'a' || h === 'origin';
    const t = recursiveNeighbours(trace, 'origin', 'informs', known);
    const phantom = allHops(t.children).find((h) => h.hash === 'phantom')!;
    expect(phantom.depth).toBe(2);
    expect(phantom.known).toBe(false);
    expect(phantom.children).toHaveLength(0);
    expect(phantom.remainder).toBe(0); // a dead end offers no onward reading
    void store;
  });

  it('symmetric contests render on both flanks at every depth', () => {
    const trace = new TraceStore();
    trace.add(edge('K12a', 'K12b', 'contests'));
    const up = recursiveNeighbours(trace, 'K12a', 'informs', () => true);
    const down = recursiveNeighbours(trace, 'K12a', 'influences', () => true);
    expect(up.children.map((h) => h.hash)).toContain('K12b');
    expect(down.children.map((h) => h.hash)).toContain('K12b');
    expect(up.children[0]!.edge_type).toBe('contests');
  });

  it('never loops on a cycle — the path-based guard matches TraceStore.walk', () => {
    const trace = new TraceStore();
    trace.add(edge('a', 'b', 'contests'));
    trace.add(edge('b', 'a', 'contests'));
    const t = recursiveNeighbours(trace, 'a', 'influences', () => true);
    // a → b (depth 1); b's only contest neighbour is a, which is on the path, so
    // the chain stops. No hop revisits 'a', and depth stays bounded.
    const hops = allHops(t.children);
    expect(hops.every((h) => h.hash !== 'a')).toBe(true);
    expect(hops.map((h) => h.hash)).toEqual(['b']);
  });

  it('reads to seq 0 / empty graph honestly — no children, not an error', () => {
    const trace = new TraceStore();
    const t = recursiveNeighbours(trace, 'origin', 'informs', () => true);
    expect(t.children).toHaveLength(0);
    expect(t.childrenRemainder).toBe(0);
  });

  it('caps breadth per hop and counts the trimmed overflow — width truncation is honest too (G4)', () => {
    // The origin has BREADTH_CAP + 3 downstream neighbours, one hop each.
    const trace = new TraceStore();
    const fanout = RECURSIVE_TRACE_BREADTH_CAP + 3;
    for (let i = 0; i < fanout; i++) trace.add(edge('origin', `n${i}`, 'compiled_into'));
    const t = recursiveNeighbours(trace, 'origin', 'influences', () => true);
    expect(t.children).toHaveLength(RECURSIVE_TRACE_BREADTH_CAP); // shown: a handful
    expect(t.childrenRemainder).toBe(3); // overflow: counted, not dropped
  });

  it('a hop below the breadth cap keeps every child and reports no overflow', () => {
    const trace = new TraceStore();
    trace.add(edge('origin', 'a', 'compiled_into'));
    trace.add(edge('origin', 'b', 'compiled_into'));
    const t = recursiveNeighbours(trace, 'origin', 'influences', () => true);
    expect(t.children).toHaveLength(2);
    expect(t.childrenRemainder).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Component — the pure renderer.
// ---------------------------------------------------------------------------
describe('recursiveTrace component — the render (DEC-38)', () => {
  const hop = (over: Partial<LabelledHop>): LabelledHop => ({
    label: 'K5 · storm channel',
    hash: 'h-k5',
    edge_type: 'compiled_into',
    known: true,
    depth: 1,
    children: [],
    remainder: 0,
    childrenRemainder: 0,
    ...over,
  });
  const tree = (children: LabelledHop[], childrenRemainder = 0): LabelledTrace => ({
    originLabel: 'tight P2·C2',
    originHash: 'h-v',
    relation: 'informs',
    depthCap: 3,
    children,
    childrenRemainder,
  });

  it('renders the real edge type and the fixed gloss on a computation edge, never an invented "why"', () => {
    const html = recursiveTrace(tree([hop({ edge_type: 'compiled_into' })]));
    expect(html).toContain('compiled_into');
    expect(html).toContain('band materialisation'); // the fixed gloss
  });

  it('scored_from renders its interval-evaluation gloss', () => {
    const html = recursiveTrace(tree([hop({ edge_type: 'scored_from', label: 'BASE world' })]));
    expect(html).toContain('scored_from');
    expect(html).toContain('interval evaluation over channel reads');
  });

  it('a non-computation edge shows the edge type alone, with no gloss', () => {
    const html = recursiveTrace(tree([hop({ edge_type: 'supersedes', label: 'K9 storm channel' })]));
    expect(html).toContain('supersedes');
    expect(html).not.toContain('assay-rt-gloss'); // no gloss span on a bare edge
  });

  it('the counted remainder renders as an escapable handoff carrying the hop hash (G4)', () => {
    const html = recursiveTrace(tree([hop({ remainder: 2, hash: 'h-cap' })]));
    expect(html).toContain('2 more');
    expect(html).toContain('open full trace');
    expect(html).toContain('assay-rt-open');
    expect(html).toContain('data-rt-hash="h-cap"');
  });

  it('a dead end renders as a dead end (G3)', () => {
    const html = recursiveTrace(tree([hop({ known: false, label: 'abcd… (dead end)' })]));
    expect(html).toContain('dead end — G3');
  });

  it('the breadth overflow renders a counted "+N more" handoff at the origin (G4)', () => {
    const html = recursiveTrace(tree([hop({})], 4));
    expect(html).toContain('+4 more');
    expect(html).toContain('open full trace');
    expect(html).toContain('data-rt-hash="h-v"'); // hands off focused on the origin
  });

  it('states the depth cap in the chrome so the tree reads as bounded by design', () => {
    const html = recursiveTrace(tree([hop({})]));
    expect(html).toContain('depth cap 3');
  });

  it('an empty relation renders "none yet", not an error', () => {
    expect(recursiveTrace(tree([]))).toContain('none yet');
  });
});

// ---------------------------------------------------------------------------
// Integration — agrees with the shipped depGraph traversal over real fixtures.
// ---------------------------------------------------------------------------
const load = <T>(name: string): T[] =>
  JSON.parse(readFileSync(new URL(`../fixtures/${name}.json`, import.meta.url), 'utf8')) as T[];
const knowledge = load<KnowledgeObject>('knowledge');
const commitments = load<Commitment>('commitments');
const plans = load<Plan>('plans');
const config = JSON.parse(
  readFileSync(new URL('../fixtures/vignette-config.json', import.meta.url), 'utf8'),
) as VignetteConfig;
const byId = new Map(knowledge.map((k) => [k.logical_id, k]));
const K = (id: string): KnowledgeObject => structuredClone(byId.get(id)!);
const answered = (id: string): KnowledgeObject => ({ ...K(id), status: 'answered' });
const ref = (id: string): Ref => ({ logical_id: id, content_hash: '' });
const BASE_K = ['K1', 'K2', 'K3', 'K4', 'K5', 'K6', 'K7', 'K8'];

interface Rig {
  svc: KnowledgeService;
  k5Hash: string;
}
async function setup(): Promise<Rig> {
  const svc = new KnowledgeService();
  for (const id of BASE_K) await svc.create(answered(id));
  for (const c of commitments) await svc.store.put(c as unknown as Record<string, unknown>);
  for (const p of plans) await svc.store.put(p as unknown as Record<string, unknown>);
  const compiler = new CompileService({ knowledge: svc });
  const compiled = await compiler.compile({
    knowledge: BASE_K.map(ref),
    config,
    engine_version: ENGINE_VERSION,
  });
  if (isRefusal(compiled)) throw new Error(`compile refused: ${compiled.reason}`);
  const scorer = new ScoreService({ store: svc.store, trace: svc.trace, config, commitments });
  for (const p of plans) {
    const planRef = svc.store.versions(p.logical_id).at(-1)!;
    await scorer.score({ plan: planRef, world: compiled.world, scenario: 'BASE', engine_version: ENGINE_VERSION });
  }
  const k5Hash = svc.store.versions('K5').at(-1)!.content_hash;
  return { svc, k5Hash };
}

describe('recursiveNeighbours — agrees with the shipped depGraph over real fixtures', () => {
  let rig: Rig;
  beforeEach(async () => {
    rig = await setup();
  });

  it('depth-1 children equal the depGraph depth-1 layer (same one-hop reading)', () => {
    const known = (h: string): boolean => rig.svc.store.exists(h);
    const t = recursiveNeighbours(rig.svc.trace, rig.k5Hash, 'influences', known);
    const g1 = buildDepGraph(rig.k5Hash, rig.svc.trace, rig.svc.store, 1);
    const treeSet = new Set(t.children.map((h) => h.hash));
    const graphSet = new Set((g1.downstream[0]?.nodes ?? []).map((n) => n.hash));
    expect(treeSet).toEqual(graphSet);
  });

  it('every node the capped tree reaches is a node the full depGraph reaches (same graph, one semantics)', () => {
    const known = (h: string): boolean => rig.svc.store.exists(h);
    const t = recursiveNeighbours(rig.svc.trace, rig.k5Hash, 'influences', known);
    const deep = buildDepGraph(rig.k5Hash, rig.svc.trace, rig.svc.store, 12);
    const graphSet = new Set(deep.downstream.flatMap((l) => l.nodes.map((n) => n.hash)));
    for (const h of allHops(t.children)) {
      expect(graphSet.has(h.hash)).toBe(true);
    }
  });

  it('K5 downstream reaches its compiled world via compiled_into at depth 1', () => {
    const known = (h: string): boolean => rig.svc.store.exists(h);
    const t = recursiveNeighbours(rig.svc.trace, rig.k5Hash, 'influences', known);
    const world = t.children.find((h) => h.edge_type === 'compiled_into');
    expect(world).toBeDefined();
  });
});
