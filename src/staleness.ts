/**
 * SPEC-13 — staleness analysis (seam §8, thesis F).
 *
 * Transitive forward trace walk from a superseded/changed knowledge object.
 * Returns exactly the dependent artefacts (verdicts, scores, worlds) and
 * nothing else. Does NOT recompute — flags, then humans decide (constitution).
 * Uses the EDGE_ORIENTATION map from traceView.ts to follow downstream
 * coherently across mixed-orientation edges (research note 08-analysis.md §4).
 */
import type { TraceEdgeType } from './generated/types.js';
import { ObjectStore, type Ref } from './store.js';
import { TraceStore, type TraceChain } from './trace.js';
import { contentHash } from './canonical.js';
import { EDGE_ORIENTATION } from './traceView.js';
import type { Refusal, StalenessRequest, StalenessResult } from './seam.js';

export class StalenessService {
  #store: ObjectStore;
  #trace: TraceStore;

  constructor(opts: { store: ObjectStore; trace: TraceStore }) {
    this.#store = opts.store;
    this.#trace = opts.trace;
  }

  async analyse(req: StalenessRequest): Promise<StalenessResult> {
    const startHash = this.#resolveHash(req.changed);
    if (!startHash) {
      return refusal('unknown_ref', [req.changed], `${req.changed.logical_id}: no such knowledge object.`);
    }

    const chains = this.#walkDownstream(startHash);

    const verdicts: Ref[] = [];
    const scores: Ref[] = [];
    const worlds: Ref[] = [];
    const seen = new Set<string>();

    for (const chain of chains) {
      for (const hash of chain.nodes) {
        if (hash === startHash) continue;
        if (seen.has(hash)) continue;
        seen.add(hash);

        const obj = this.#store.get(hash) as Record<string, unknown> | undefined;
        if (!obj) continue;

        const ref: Ref = {
          logical_id: (obj.logical_id as string) ?? '',
          content_hash: hash,
        };

        if (typeof obj.verdict === 'string' && typeof obj.commitment === 'string') {
          verdicts.push(ref);
        } else if (typeof obj.criterion === 'string' && typeof obj.score === 'object') {
          scores.push(ref);
        } else if (Array.isArray(obj.channels) || Array.isArray(obj.consumed)) {
          worlds.push(ref);
        }
      }
    }

    const stamp = await contentHash({
      changed: req.changed.logical_id,
      engine_version: req.engine_version,
      analysis: 'staleness',
    });

    return {
      invalidated: { verdicts, scores, worlds },
      chains,
      stamp,
    };
  }

  #walkDownstream(startHash: string): TraceChain[] {
    const chains: TraceChain[] = [];
    const isKnown = (h: string): boolean => this.#store.exists(h);

    const visit = (node: string, nodes: string[], edges: import('./generated/types.js').TraceEdge[], visited: Set<string>): void => {
      const outgoing: { target: string; edge: import('./generated/types.js').TraceEdge }[] = [];

      for (const edge of this.#trace.edges) {
        const orient = EDGE_ORIENTATION[edge.edge_type];

        if (orient === 'forward' || orient === 'either') {
          if (edge.from_hash === node && !visited.has(edge.to_hash)) {
            outgoing.push({ target: edge.to_hash, edge });
          }
        }
        if (orient === 'backward' || orient === 'either') {
          if (edge.to_hash === node && !visited.has(edge.from_hash)) {
            outgoing.push({ target: edge.from_hash, edge });
          }
        }
      }

      if (outgoing.length === 0) {
        chains.push({
          nodes: [...nodes],
          edges: [...edges],
          complete: isKnown(node),
        });
        return;
      }

      for (const { target, edge } of outgoing) {
        visited.add(target);
        visit(target, [...nodes, target], [...edges, edge], visited);
        visited.delete(target);
      }
    };

    visit(startHash, [startHash], [], new Set([startHash]));
    return chains;
  }

  #resolveHash(ref: Ref): string | undefined {
    if (ref.content_hash) {
      return this.#store.exists(ref.content_hash) ? ref.content_hash : undefined;
    }
    const versions = this.#store.versions(ref.logical_id);
    return versions.length > 0 ? versions[versions.length - 1]!.content_hash : undefined;
  }
}

const refusal = (reason: Refusal['reason'], offending: Ref[], explanation: string): Refusal => ({
  refused: true,
  reason,
  offending,
  explanation,
});
