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

// ---------------------------------------------------------------------------
// SPEC-26 US3 — the recursive-trace tooltip's traversal (DEC-38).
//
// The recursive tooltip is the *shallow end* of issue #24's full dependency-
// graph view (DEC-47): the same transitive walk under the EDGE_ORIENTATION map,
// depth-capped for in-reading-flow disclosure. It reuses `neighbours()` hop by
// hop — the identical one-hop reading `depGraph.walkDirection` consumes — so
// there is ONE traversal semantics and NO parallel walker (FR-007). The cycle
// guard is path-based, matching `TraceStore.walk` (the same origin reaches the
// same nodes). At the cap, onward neighbours are counted (never silently
// dropped, G4) and the render hands off to the full-screen graph surface.
// ---------------------------------------------------------------------------

/**
 * The depth cap, a STATED CONSTANT — not adaptive (DEC-38). Fixed at 3 so the
 * same object decomposes to the same depth everywhere; an adaptive cap would
 * make identical provenance read differently in different places, which a reader
 * would (correctly) take to mean something (research note 15 §5).
 */
export const RECURSIVE_TRACE_DEPTH_CAP = 3;

/**
 * The breadth cap — a STATED CONSTANT, per hop. A high-fan-out node (a knowledge
 * object compiled into a world that is `scored_from` by every verdict) has too
 * many one-hop neighbours to read in a tooltip; the depth cap alone does not
 * bound width. This mirrors the DEC-47 full-graph view's own per-layer "+ K
 * more" breadth truncation — the tooltip shows a handful per hop and defers the
 * rest to that graph (integrate, don't re-figure). The overflow is COUNTED, so
 * width truncation is as honest as depth truncation (G4). A rescope refinement
 * of DEC-38's rendering — flagged as a register candidate, not asserted.
 */
export const RECURSIVE_TRACE_BREADTH_CAP = 6;

/** One node in the recursive-trace tree: a neighbour reached at `depth`. */
export interface TraceHop {
  /** The neighbour's content hash. */
  hash: string;
  /** The edge type connecting it to its parent (the trace graph's own vocabulary). */
  edge_type: TraceEdgeType;
  /** A dead end iff false — surfaced at every depth, never hidden (G3). */
  known: boolean;
  /** 1…depthCap. */
  depth: number;
  /** The next hop (breadth-capped), empty at a dead end, a leaf, or the depth cap. */
  children: TraceHop[];
  /**
   * At the depth cap, the count of onward neighbours NOT expanded (in the same
   * relation, excluding the current path). `> 0` renders the honest counted
   * remainder ("N more — open full trace") that hands off to the DEC-47 graph
   * surface. Always 0 above the cap, at a dead end, or at a genuine leaf.
   */
  remainder: number;
  /**
   * The count of this hop's own children trimmed by the breadth cap (`> 0` ⇒ a
   * counted "+N more" that hands off to the full graph focused HERE). Distinct
   * from `remainder`, which is the depth-cap overflow of a leaf.
   */
  childrenRemainder: number;
}

/** A recursive trace rooted at one origin, walked in one relation to the cap. */
export interface RecursiveTrace {
  /** The origin item's content hash (the focus of the tooltip). */
  origin: string;
  /** `informs` (upstream — what feeds this) or `influences` (downstream). */
  relation: Relation;
  /** The stated depth cap this tree was walked to (RECURSIVE_TRACE_DEPTH_CAP). */
  depthCap: number;
  /** The depth-1 neighbours (breadth-capped; each with its own recursive children). */
  children: TraceHop[];
  /** Depth-1 neighbours trimmed by the breadth cap (`> 0` ⇒ counted "+N more" at the origin). */
  childrenRemainder: number;
}

/**
 * Build the depth- and breadth-capped recursive-trace tree from `origin`,
 * walking `relation` hop by hop through `neighbours()`. Path-based cycle guard
 * (a chain never loops, matching `TraceStore.walk`); dead ends become leaves
 * (G3); both onward-at-the-depth-cap and trimmed-by-the-breadth-cap neighbours
 * are counted, never dropped (G4).
 */
export function recursiveNeighbours(
  store: TraceStore,
  origin: string,
  relation: Relation,
  isKnown: (h: string) => boolean,
  depthCap: number = RECURSIVE_TRACE_DEPTH_CAP,
  breadthCap: number = RECURSIVE_TRACE_BREADTH_CAP,
): RecursiveTrace {
  // Build every hop for a node, then trim to the breadth cap; the caller records
  // the trimmed count so width truncation is counted (G4).
  const buildAll = (hash: string, depth: number, path: Set<string>): TraceHop[] =>
    neighbours(store, hash, relation, isKnown)
      .filter((n) => !path.has(n.hash)) // cycle guard — never revisit the path
      .map((n) => {
        // A dead end is a leaf at any depth (G3): no onward reading to offer.
        if (!n.known) {
          return { hash: n.hash, edge_type: n.edge_type, known: false, depth, children: [], remainder: 0, childrenRemainder: 0 };
        }
        const nextPath = new Set(path).add(n.hash);
        if (depth >= depthCap) {
          // At the depth cap: count the onward chain we are not expanding (G4).
          const onward = neighbours(store, n.hash, relation, isKnown).filter((m) => !nextPath.has(m.hash));
          return { hash: n.hash, edge_type: n.edge_type, known: true, depth, children: [], remainder: onward.length, childrenRemainder: 0 };
        }
        const all = buildAll(n.hash, depth + 1, nextPath);
        return {
          hash: n.hash,
          edge_type: n.edge_type,
          known: true,
          depth,
          children: all.slice(0, breadthCap),
          remainder: 0,
          childrenRemainder: Math.max(0, all.length - breadthCap),
        };
      });

  const all = buildAll(origin, 1, new Set([origin]));
  return {
    origin,
    relation,
    depthCap,
    children: all.slice(0, breadthCap),
    childrenRemainder: Math.max(0, all.length - breadthCap),
  };
}
