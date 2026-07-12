/**
 * SPEC-02 — trace-graph store with forward/backward walks.
 *
 * Edges are written at compute time by the service performing the
 * computation, never reconstructed (constitution III). A chain that
 * dead-ends where a known object was expected is a defect surfaced as
 * `complete: false`, never hidden (G3; seam contract §9).
 */
import type { TraceEdge } from './generated/types.js';

export interface TraceChain {
  nodes: string[]; // content hashes, walk order
  edges: TraceEdge[];
  complete: boolean;
}

export type Direction = 'forward' | 'backward';

export class TraceStore {
  #edges: TraceEdge[] = [];
  #byFrom = new Map<string, TraceEdge[]>();
  #byTo = new Map<string, TraceEdge[]>();

  add(edge: TraceEdge): void {
    this.#edges.push(edge);
    const from = this.#byFrom.get(edge.from_hash) ?? [];
    from.push(edge);
    this.#byFrom.set(edge.from_hash, from);
    const to = this.#byTo.get(edge.to_hash) ?? [];
    to.push(edge);
    this.#byTo.set(edge.to_hash, to);
  }

  get edges(): readonly TraceEdge[] {
    return this.#edges;
  }

  /**
   * Walk transitively from `start`. `forward` follows from→to; `backward`
   * follows to→from. Returns one chain per simple path to a terminal node.
   * `isKnown` (usually store.exists) marks whether the terminal is a real
   * stored object: a terminal the store does not know is a dead end and
   * the chain reports `complete: false`.
   */
  walk(start: string, direction: Direction, isKnown?: (hash: string) => boolean): TraceChain[] {
    const chains: TraceChain[] = [];
    const visit = (node: string, nodes: string[], edges: TraceEdge[], seen: Set<string>) => {
      const outgoing =
        direction === 'forward' ? this.#byFrom.get(node) ?? [] : this.#byTo.get(node) ?? [];
      const next = outgoing.filter((e) => {
        const target = direction === 'forward' ? e.to_hash : e.from_hash;
        return !seen.has(target); // cycle guard
      });
      if (next.length === 0) {
        chains.push({
          nodes: [...nodes],
          edges: [...edges],
          complete: isKnown ? isKnown(node) : true,
        });
        return;
      }
      for (const e of next) {
        const target = direction === 'forward' ? e.to_hash : e.from_hash;
        seen.add(target);
        visit(target, [...nodes, target], [...edges, e], seen);
        seen.delete(target);
      }
    };
    visit(start, [start], [], new Set([start]));
    return chains;
  }

  forward(hash: string, isKnown?: (hash: string) => boolean): TraceChain[] {
    return this.walk(hash, 'forward', isKnown);
  }

  backward(hash: string, isKnown?: (hash: string) => boolean): TraceChain[] {
    return this.walk(hash, 'backward', isKnown);
  }
}
