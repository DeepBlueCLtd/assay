/**
 * SPEC-16 — one-hop "informs / influenced by" over the trace graph.
 *
 * The dependency graph already exists as the TraceEdge set written at compute
 * time; TraceStore.walk traverses it. But the walker follows raw hash direction
 * and does not know "upstream vs downstream", and the edges are written in MIXED
 * orientations (research note 05 §4): `compiled_into` points K→World (upstream→
 * downstream) while `scored_from`/`cited_in`/`sacrificed_in` point Verdict→World
 * (downstream→upstream). A naive forward walk from a K therefore reaches the
 * world and stops. This module holds the per-edge_type orientation map that makes
 * a coherent "influences (downstream) / informs (upstream)" reading, and returns
 * ONE HOP of neighbours (the menu expands further on demand).
 *
 * Pure and testable — depends only on generated types + the TraceStore. No DOM,
 * no services, no app state.
 */
import type { TraceEdgeType } from './generated/types.js';
import type { TraceStore } from './trace.js';

/**
 * For the DOWNSTREAM ("influences") reading, which raw walk direction each edge
 * type contributes. `forward` = follow from→to; `backward` = follow to→from;
 * `either` = symmetric peer relation (shown on both sides). Upstream ("informs")
 * is the mirror: forward↔backward, either unchanged.
 */
export const EDGE_ORIENTATION: Record<TraceEdgeType, 'forward' | 'backward' | 'either'> = {
  compiled_into: 'forward', // K → World: the world is downstream of the knowledge
  waives: 'forward', // K → World
  scored_from: 'backward', // Verdict → World: the verdict is downstream of the world
  cited_in: 'backward', // Verdict/Score → Report: the report is downstream
  sacrificed_in: 'backward', // Commitment → Report: the report is downstream
  supersedes: 'backward', // K_new → K_prior: the prior is upstream of the new
  resolves: 'forward', // K_survivor → K_loser: the resolution flows to the loser
  contests: 'either', // K_a ↔ K_b: a peer relation, "contested with"
};

export type Relation = 'informs' | 'influences';

export interface Neighbour {
  /** The neighbour object's content hash. */
  hash: string;
  /** The edge type that connects it. */
  edge_type: TraceEdgeType;
  /**
   * Whether the store knows this hash as a real stored object. A neighbour the
   * store does not know is a trace dead end — surfaced, never hidden (G3).
   */
  known: boolean;
}

/**
 * One hop of neighbours in the given relation. `direction === 'influences'`
 * reads downstream (what this drives); `'informs'` reads upstream (what feeds
 * this). `isKnown` (usually store.exists) marks dead ends.
 */
export function neighbours(
  store: TraceStore,
  hash: string,
  relation: Relation,
  isKnown: (h: string) => boolean,
): Neighbour[] {
  const out: Neighbour[] = [];
  const seen = new Set<string>();
  const push = (h: string, edge_type: TraceEdgeType): void => {
    if (h === hash) return; // never list self
    const key = `${h}|${edge_type}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ hash: h, edge_type, known: isKnown(h) });
  };

  for (const edge of store.edges) {
    // Resolve this edge's orientation for the DOWNSTREAM reading, then mirror
    // for the upstream reading.
    let downstream = EDGE_ORIENTATION[edge.edge_type];
    if (relation === 'informs' && downstream !== 'either') {
      downstream = downstream === 'forward' ? 'backward' : 'forward';
    }
    if (downstream === 'forward' || downstream === 'either') {
      if (edge.from_hash === hash) push(edge.to_hash, edge.edge_type);
    }
    if (downstream === 'backward' || downstream === 'either') {
      if (edge.to_hash === hash) push(edge.from_hash, edge.edge_type);
    }
  }
  return out;
}

/** What this item drives (downstream), one hop. */
export function influences(
  store: TraceStore,
  hash: string,
  isKnown: (h: string) => boolean,
): Neighbour[] {
  return neighbours(store, hash, 'influences', isKnown);
}

/** What feeds this item (upstream), one hop. */
export function informs(
  store: TraceStore,
  hash: string,
  isKnown: (h: string) => boolean,
): Neighbour[] {
  return neighbours(store, hash, 'informs', isKnown);
}
