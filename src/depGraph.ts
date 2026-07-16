/**
 * Issue #24 — focused transitive dependency-graph model.
 *
 * Walks the trace graph in both directions from a focus item using the
 * EDGE_ORIENTATION map, producing a depth-layered graph structure for the
 * river + sidebar composite view. Reuses the same orientation-aware pattern
 * as staleness.ts but walks BOTH upstream and downstream, and organises
 * results by depth rather than as raw chains.
 *
 * Pure and testable — depends only on generated types, TraceStore, and
 * ObjectStore. No DOM, no services, no app state.
 */
import type { TraceEdge, TraceEdgeType } from './generated/types.js';
import type { TraceStore } from './trace.js';
import type { ObjectStore } from './store.js';
import { EDGE_ORIENTATION } from './traceView.js';

export interface DepGraphNode {
  hash: string;
  label: string;
  type: 'knowledge' | 'world' | 'verdict' | 'plan' | 'report' | 'unknown';
  known: boolean;
  depth: number;
}

export interface DepGraphEdge {
  from: string;
  to: string;
  edge_type: TraceEdgeType;
  depth: number;
}

export interface DepGraphLayer {
  depth: number;
  nodes: DepGraphNode[];
  edges: DepGraphEdge[];
}

export interface DepGraph {
  focus: DepGraphNode;
  upstream: DepGraphLayer[];
  downstream: DepGraphLayer[];
  /**
   * True when the upstream/downstream walk stopped at `maxDepth` with a
   * non-empty frontier still to explore — i.e. there are deeper nodes not
   * shown. Surfaced, never hidden: a depth cap that silently dropped the
   * remainder would be exactly the silent truncation G3/G4 forbid.
   */
  upstreamTruncated: boolean;
  downstreamTruncated: boolean;
}

export interface DepGraphNodeDetail {
  node: DepGraphNode;
  metadata: string;
  upstream: { depth: number; edgeType: TraceEdgeType; nodes: DepGraphNode[] }[];
  downstream: { depth: number; edgeType: TraceEdgeType; nodes: DepGraphNode[] }[];
}

function classifyObject(obj: Record<string, unknown> | undefined): DepGraphNode['type'] {
  if (!obj) return 'unknown';
  if (typeof obj.verdict === 'string' && typeof obj.commitment === 'string') return 'verdict';
  if (typeof obj.criterion === 'string' && typeof obj.score === 'object') return 'report';
  if (Array.isArray(obj.channels) || Array.isArray(obj.consumed)) return 'world';
  if (Array.isArray(obj.waypoints) || typeof obj.approach === 'string') return 'plan';
  if (typeof obj.status === 'string' && typeof obj.logical_id === 'string') {
    const id = obj.logical_id as string;
    if (id.startsWith('K')) return 'knowledge';
    if (id.startsWith('C')) return 'report';
  }
  if (typeof obj.logical_id === 'string') {
    const id = obj.logical_id as string;
    if (id.startsWith('K')) return 'knowledge';
    if (id.startsWith('C')) return 'report';
    if (id.startsWith('P')) return 'plan';
  }
  if (typeof obj.sacrificed !== 'undefined' || typeof obj.tie_break === 'string') return 'report';
  return 'unknown';
}

function labelObject(hash: string, obj: Record<string, unknown> | undefined): string {
  if (!obj) return `${hash.slice(0, 8)}… (dead end — G3)`;
  if (typeof obj.verdict === 'string' && typeof obj.plan === 'string' && typeof obj.commitment === 'string') {
    const scenario = typeof obj.scenario === 'string' && obj.scenario !== 'BASE' ? ` (${obj.scenario})` : '';
    return `${obj.verdict} ${obj.plan}·${obj.commitment}${scenario}`;
  }
  if (typeof obj.criterion === 'string' && typeof obj.plan === 'string' && typeof obj.commitment === 'string') {
    return `score ${obj.plan}·${obj.commitment}`;
  }
  if (typeof obj.logical_id === 'string' && obj.logical_id) {
    return typeof obj.name === 'string' ? `${obj.logical_id} · ${obj.name}` : obj.logical_id;
  }
  if (typeof obj.stamp === 'string') {
    const scenario = typeof obj.scenario === 'string' ? obj.scenario : '';
    return scenario ? `${scenario} world` : `world ${(obj.stamp as string).slice(0, 8)}…`;
  }
  return `${hash.slice(0, 8)}…`;
}

function metadataString(obj: Record<string, unknown> | undefined): string {
  if (!obj) return 'trace dead end — no object in store (G3)';
  const parts: string[] = [];
  if (typeof obj.logical_id === 'string') parts.push(obj.logical_id as string);
  if (typeof obj.name === 'string') parts.push(obj.name as string);
  if (typeof obj.status === 'string') parts.push(`status: ${obj.status}`);
  if (typeof obj.scenario === 'string') parts.push(`scenario: ${obj.scenario}`);
  if (typeof obj.verdict === 'string') parts.push(`verdict: ${obj.verdict}`);
  if (typeof obj.plan === 'string') parts.push(`plan: ${obj.plan}`);
  if (typeof obj.commitment === 'string') parts.push(`commitment: ${obj.commitment}`);
  if (obj.value && typeof obj.value === 'object') {
    const v = obj.value as { lo?: number; hi?: number; unit?: string };
    if (typeof v.lo === 'number') parts.push(`band: ${v.lo}–${v.hi} ${v.unit ?? ''}`);
  }
  if (obj.single_source === true) parts.push('single_source');
  if (typeof obj.stamp === 'string') parts.push(`stamp: ${(obj.stamp as string).slice(0, 8)}…`);
  return parts.join(' · ');
}

/**
 * Walk one direction (upstream or downstream) from a starting hash, building
 * depth-layered results. Uses BFS for natural depth ordering.
 */
function walkDirection(
  startHash: string,
  direction: 'upstream' | 'downstream',
  trace: TraceStore,
  store: ObjectStore,
  maxDepth: number,
): { layers: DepGraphLayer[]; truncated: boolean } {
  const layers: DepGraphLayer[] = [];
  const visited = new Set<string>([startHash]);
  let frontier = [startHash];

  for (let depth = 1; depth <= maxDepth && frontier.length > 0; depth++) {
    const layerNodes: DepGraphNode[] = [];
    const layerEdges: DepGraphEdge[] = [];
    const nextFrontier: string[] = [];

    for (const node of frontier) {
      for (const edge of trace.edges) {
        const orient = EDGE_ORIENTATION[edge.edge_type];
        let target: string | undefined;

        if (direction === 'downstream') {
          if ((orient === 'forward' || orient === 'either') && edge.from_hash === node) {
            target = edge.to_hash;
          }
          if ((orient === 'backward' || orient === 'either') && edge.to_hash === node) {
            target = edge.from_hash;
          }
        } else {
          if ((orient === 'forward' || orient === 'either') && edge.to_hash === node) {
            target = edge.from_hash;
          }
          if ((orient === 'backward' || orient === 'either') && edge.from_hash === node) {
            target = edge.to_hash;
          }
        }

        if (target === undefined || target === node) continue;

        const edgeRecord: DepGraphEdge = {
          from: direction === 'downstream' ? node : target,
          to: direction === 'downstream' ? target : node,
          edge_type: edge.edge_type,
          depth,
        };

        if (!visited.has(target)) {
          visited.add(target);
          const obj = store.get(target) as Record<string, unknown> | undefined;
          layerNodes.push({
            hash: target,
            label: labelObject(target, obj),
            type: classifyObject(obj),
            known: store.exists(target),
            depth,
          });
          nextFrontier.push(target);
        }

        const edgeKey = `${edgeRecord.from}|${edgeRecord.to}|${edgeRecord.edge_type}`;
        if (!layerEdges.some(e => `${e.from}|${e.to}|${e.edge_type}` === edgeKey)) {
          layerEdges.push(edgeRecord);
        }
      }
    }

    if (layerNodes.length > 0) {
      layers.push({ depth, nodes: layerNodes, edges: layerEdges });
    }
    frontier = nextFrontier;
  }

  // A non-empty frontier here means the depth cap stopped the walk with more
  // to explore — the walk is truncated by depth, not exhausted.
  return { layers, truncated: frontier.length > 0 };
}

/**
 * Build a focused dependency graph around an item, walking both upstream and
 * downstream to the given depth. Returns a depth-layered structure suitable
 * for rendering as a horizontal river.
 */
export function buildDepGraph(
  focusHash: string,
  trace: TraceStore,
  store: ObjectStore,
  maxDepth = 4,
): DepGraph {
  const focusObj = store.get(focusHash) as Record<string, unknown> | undefined;
  const focus: DepGraphNode = {
    hash: focusHash,
    label: labelObject(focusHash, focusObj),
    type: classifyObject(focusObj),
    known: store.exists(focusHash),
    depth: 0,
  };

  const up = walkDirection(focusHash, 'upstream', trace, store, maxDepth);
  const down = walkDirection(focusHash, 'downstream', trace, store, maxDepth);

  return {
    focus,
    upstream: up.layers,
    downstream: down.layers,
    upstreamTruncated: up.truncated,
    downstreamTruncated: down.truncated,
  };
}

/**
 * Build detail data for a single node — its upstream and downstream neighbours
 * grouped by depth and edge type (for the sidebar).
 */
export function nodeDetail(
  hash: string,
  trace: TraceStore,
  store: ObjectStore,
  maxDepth = 4,
): DepGraphNodeDetail {
  const obj = store.get(hash) as Record<string, unknown> | undefined;
  const node: DepGraphNode = {
    hash,
    label: labelObject(hash, obj),
    type: classifyObject(obj),
    known: store.exists(hash),
    depth: 0,
  };

  const upLayers = walkDirection(hash, 'upstream', trace, store, maxDepth).layers;
  const downLayers = walkDirection(hash, 'downstream', trace, store, maxDepth).layers;

  const groupByEdgeType = (layers: DepGraphLayer[]): DepGraphNodeDetail['upstream'] => {
    const result: DepGraphNodeDetail['upstream'] = [];
    for (const layer of layers) {
      const byType = new Map<TraceEdgeType, DepGraphNode[]>();
      for (const e of layer.edges) {
        const targetHash = layer.nodes.find(n => n.hash === e.from || n.hash === e.to)?.hash;
        if (!targetHash) continue;
        const targetNode = layer.nodes.find(n => n.hash === targetHash);
        if (!targetNode) continue;
        if (!byType.has(e.edge_type)) byType.set(e.edge_type, []);
        const arr = byType.get(e.edge_type)!;
        if (!arr.some(n => n.hash === targetNode.hash)) arr.push(targetNode);
      }
      for (const [edgeType, nodes] of byType) {
        result.push({ depth: layer.depth, edgeType, nodes });
      }
    }
    return result;
  };

  return {
    node,
    metadata: metadataString(obj),
    upstream: groupByEdgeType(upLayers),
    downstream: groupByEdgeType(downLayers),
  };
}
