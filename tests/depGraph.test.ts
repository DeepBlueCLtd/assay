import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import type {
  Commitment,
  KnowledgeObject,
  Plan,
  VignetteConfig,
} from '../src/generated/types.js';
import { KnowledgeService } from '../src/knowledge.js';
import { CompileService } from '../src/compile.js';
import { ScoreService } from '../src/score.js';
import { isRefusal } from '../src/seam.js';
import type { Ref } from '../src/store.js';
import { buildDepGraph, nodeDetail } from '../src/depGraph.js';
import { depGraphRiver } from '../src/components/depGraphRiver.js';
import { depGraphSidebar } from '../src/components/depGraphSidebar.js';

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
const ENGINE = '0.1.0';

interface Rig {
  svc: KnowledgeService;
  k5Hash: string;
  worldHash: string;
}

async function setup(): Promise<Rig> {
  const svc = new KnowledgeService();
  for (const id of BASE_K) await svc.create(answered(id));
  for (const c of commitments) await svc.store.put(c as unknown as Record<string, unknown>);
  for (const p of plans) await svc.store.put(p as unknown as Record<string, unknown>);

  const compiler = new CompileService({ knowledge: svc });
  const compileResult = await compiler.compile({
    knowledge: BASE_K.map(ref),
    config,
    engine_version: ENGINE,
  });
  if (isRefusal(compileResult)) throw new Error(`compile refused: ${compileResult.reason}`);

  const scorer = new ScoreService({ store: svc.store, trace: svc.trace, config, commitments });
  for (const p of plans) {
    const planRef = svc.store.versions(p.logical_id).at(-1)!;
    await scorer.score({
      plan: planRef,
      world: compileResult.world,
      scenario: 'BASE',
      engine_version: ENGINE,
    });
  }

  const k5Hash = svc.store.versions('K5').at(-1)!.content_hash;
  const worldHash = compileResult.world.content_hash;
  return { svc, k5Hash, worldHash };
}

describe('depGraph — buildDepGraph', () => {
  let rig: Rig;
  beforeEach(async () => {
    rig = await setup();
  });

  it('returns a focused graph with upstream and downstream layers', () => {
    const graph = buildDepGraph(rig.k5Hash, rig.svc.trace, rig.svc.store);
    expect(graph.focus.hash).toBe(rig.k5Hash);
    expect(graph.focus.depth).toBe(0);
    expect(graph.downstream.length).toBeGreaterThan(0);
  });

  it('focus node is classified correctly', () => {
    const graph = buildDepGraph(rig.k5Hash, rig.svc.trace, rig.svc.store);
    expect(graph.focus.type).toBe('knowledge');
    expect(graph.focus.known).toBe(true);
  });

  it('downstream of K5 includes compiled worlds', () => {
    const graph = buildDepGraph(rig.k5Hash, rig.svc.trace, rig.svc.store);
    const allDownstreamNodes = graph.downstream.flatMap((l) => l.nodes);
    const worldNodes = allDownstreamNodes.filter((n) => n.type === 'world');
    expect(worldNodes.length).toBeGreaterThan(0);
  });

  it('layers are depth-ordered', () => {
    const graph = buildDepGraph(rig.k5Hash, rig.svc.trace, rig.svc.store);
    for (let i = 0; i < graph.downstream.length; i++) {
      expect(graph.downstream[i]!.depth).toBe(i + 1);
    }
    for (let i = 0; i < graph.upstream.length; i++) {
      expect(graph.upstream[i]!.depth).toBe(i + 1);
    }
  });

  it('respects maxDepth', () => {
    const shallow = buildDepGraph(rig.k5Hash, rig.svc.trace, rig.svc.store, 1);
    const deep = buildDepGraph(rig.k5Hash, rig.svc.trace, rig.svc.store, 4);
    expect(shallow.downstream.length).toBeLessThanOrEqual(1);
    expect(deep.downstream.length).toBeGreaterThanOrEqual(shallow.downstream.length);
  });

  it('world node has upstream knowledge', () => {
    const graph = buildDepGraph(rig.worldHash, rig.svc.trace, rig.svc.store);
    expect(graph.focus.type).toBe('world');
    const allUpstreamNodes = graph.upstream.flatMap((l) => l.nodes);
    const knowledgeNodes = allUpstreamNodes.filter((n) => n.type === 'knowledge');
    expect(knowledgeNodes.length).toBeGreaterThan(0);
  });

  it('does not include the focus node in any layer', () => {
    const graph = buildDepGraph(rig.k5Hash, rig.svc.trace, rig.svc.store);
    const allLayerNodes = [
      ...graph.upstream.flatMap((l) => l.nodes),
      ...graph.downstream.flatMap((l) => l.nodes),
    ];
    expect(allLayerNodes.some((n) => n.hash === rig.k5Hash)).toBe(false);
  });

  it('no node appears in more than one layer (BFS property)', () => {
    const graph = buildDepGraph(rig.k5Hash, rig.svc.trace, rig.svc.store);
    const allNodes = [
      ...graph.upstream.flatMap((l) => l.nodes),
      ...graph.downstream.flatMap((l) => l.nodes),
    ];
    const hashes = allNodes.map((n) => n.hash);
    expect(new Set(hashes).size).toBe(hashes.length);
  });
});

describe('depGraph — nodeDetail', () => {
  let rig: Rig;
  beforeEach(async () => {
    rig = await setup();
  });

  it('returns detail with metadata', () => {
    const detail = nodeDetail(rig.k5Hash, rig.svc.trace, rig.svc.store);
    expect(detail.node.hash).toBe(rig.k5Hash);
    expect(detail.metadata).toBeTruthy();
  });

  it('groups neighbours by edge type', () => {
    const detail = nodeDetail(rig.k5Hash, rig.svc.trace, rig.svc.store);
    for (const group of detail.downstream) {
      expect(group.edgeType).toBeTruthy();
      expect(group.nodes.length).toBeGreaterThan(0);
    }
  });
});

describe('depGraph — component renderers', () => {
  let rig: Rig;
  beforeEach(async () => {
    rig = await setup();
  });

  it('depGraphRiver renders valid HTML with node chips', () => {
    const graph = buildDepGraph(rig.k5Hash, rig.svc.trace, rig.svc.store);
    const html = depGraphRiver(graph);
    expect(html).toContain('assay-dep-river');
    expect(html).toContain('assay-dep-node');
    expect(html).toContain('assay-dep-focus');
    expect(html).toContain('data-dep-hash');
  });

  it('depGraphRiver shows node and edge counts', () => {
    const graph = buildDepGraph(rig.k5Hash, rig.svc.trace, rig.svc.store);
    const html = depGraphRiver(graph);
    expect(html).toMatch(/\d+ node/);
    expect(html).toMatch(/\d+ edge/);
  });

  it('depGraphSidebar renders detail for a node', () => {
    const detail = nodeDetail(rig.k5Hash, rig.svc.trace, rig.svc.store);
    const html = depGraphSidebar(detail);
    expect(html).toContain('assay-dep-sidebar');
    expect(html).toContain('Upstream');
    expect(html).toContain('Downstream');
  });

  it('depGraphSidebar renders metadata', () => {
    const detail = nodeDetail(rig.k5Hash, rig.svc.trace, rig.svc.store);
    const html = depGraphSidebar(detail);
    expect(html).toContain('K5');
  });
});
