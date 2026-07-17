/**
 * SPEC-26 — decision-history reconstruction (the state-at-seq fold).
 *
 * The delta log (SPEC-05) and the immutable, content-addressed store (DEC-21)
 * make ASSAY event-sourced by construction: current state is the left-fold of
 * an append-only log, and any past state is that fold truncated at a seq
 * (Fowler 2005; Kleppmann 2017 ch. 11). This module holds the reconstruction
 * rule research note 15 decided:
 *
 *   state(n) = fold(∅, deltas[1..n])
 *
 * implemented — because objects and edges are immutable and append-only in seq
 * order — as a **filter over the live head**, not a rollback. Each object's
 * creation seq and each edge's boundary are DERIVED from the log itself (a
 * delta's refs name the object; edge-adding ops append exactly one edge in seq
 * order), never captured in an authoritative side channel (note §2, FR-008).
 * A filtered head fed to the same pure `snapshot()` is byte-equal to a fresh
 * fold (G1); `tests/history.test.ts` asserts exactly that.
 *
 * Pure and app-layer — no DOM, no services, no schema. Depends only on the
 * seam `Delta`, the `ObjectStore`, and the `TraceStore`.
 */
import type { Delta } from '../seam.js';
import type { ObjectStore } from '../store.js';
import type { TraceStore } from '../trace.js';

/** The observer's position in the decision history. Not stored — the record is
 *  the existing deltas (note §7). `live` = the writable head; `replay` = a
 *  read-only cursor into the past (writes disabled, mode marked). */
export interface HistoryCursor {
  seq: number;
  mode: 'live' | 'replay';
}

/** Replay is read-only: every write affordance is disabled while the cursor is
 *  in the past (FR-004). The shell gates its write handlers on this — a
 *  structural "no write path reachable while mode='replay'" (US1 AS-3). */
export function writesEnabled(cursor: HistoryCursor): boolean {
  return cursor.mode === 'live';
}

/** The count of live deltas that landed at the head since the cursor entered
 *  replay (`headAtEntry`) — surfaced as an "M new" chip, never a silent cursor
 *  jump (FR-004). Zero in `live` mode. */
export function newDeltaCount(cursor: HistoryCursor, currentMaxSeq: number, headAtEntry: number): number {
  return cursor.mode === 'replay' ? Math.max(0, currentMaxSeq - headAtEntry) : 0;
}

/** The edge-appending ops: each publishes exactly one delta AND one trace edge,
 *  in seq order, so the k-th such delta corresponds to the k-th edge. `create`
 *  and `refused` append no edge (note §2/§3). */
const EDGE_OPS: ReadonlySet<Delta['op']> = new Set(['supersede', 'contest', 'resolve']);

/**
 * A derived, non-authoritative index over the delta log (note §2). Built from
 * `deltas` alone: `objectSeq(hash)` is the seq of the first delta whose refs
 * name the hash; edge boundaries fall out of counting edge-adding ops in seq
 * order. The log remains the sole authority — this is a reading of it, freely
 * rebuildable and never a source of truth (FR-008).
 */
export class HistoryIndex {
  #objectSeq = new Map<string, number>();
  #maxSeq = 0;
  /** For each seq, how many trace edges are present after it (running count). */
  #edgeCountBySeq = new Map<number, number>();
  /** Resolved-state after each seq — mirrors AppState's #resolved transitions
   *  (a `contest` clears it, a `resolve` sets it; note §2). */
  #resolvedBySeq = new Map<number, boolean>();

  constructor(deltas: readonly Delta[]) {
    let edges = 0;
    let resolved = false;
    for (const d of deltas) {
      for (const r of d.refs) {
        if (r.content_hash && !this.#objectSeq.has(r.content_hash)) {
          this.#objectSeq.set(r.content_hash, d.seq);
        }
      }
      if (EDGE_OPS.has(d.op)) edges += 1;
      if (d.op === 'contest') resolved = false;
      else if (d.op === 'resolve') resolved = true;
      this.#edgeCountBySeq.set(d.seq, edges);
      this.#resolvedBySeq.set(d.seq, resolved);
      if (d.seq > this.#maxSeq) this.#maxSeq = d.seq;
    }
  }

  get maxSeq(): number {
    return this.#maxSeq;
  }

  /** Clamp an arbitrary cursor into `[0, maxSeq]`. */
  clamp(n: number): number {
    return Math.max(0, Math.min(Math.round(n), this.#maxSeq));
  }

  /** Whether an object hash is present at cursor n. A delta-published object
   *  (knowledge) appears iff its creation seq ≤ n; an object never named by any
   *  delta (a directly-put fixture — plans, COAs, commitments) is seed
   *  infrastructure, present at every position. */
  hasObjectAt(hash: string, n: number): boolean {
    const s = this.#objectSeq.get(hash);
    return s === undefined ? true : s <= n;
  }

  /** Trace-edge count present after delta n (0 at n ≤ 0). */
  edgeCountAt(n: number): number {
    const c = this.clamp(n);
    if (c <= 0) return 0;
    // Carry forward from the nearest recorded seq ≤ c (deltas are contiguous, so
    // this is just #edgeCountBySeq.get(c); the loop guards non-contiguous logs).
    for (let s = c; s >= 1; s--) {
      const v = this.#edgeCountBySeq.get(s);
      if (v !== undefined) return v;
    }
    return 0;
  }

  /** The resolved-state at cursor n (false at n ≤ 0). */
  resolvedAt(n: number): boolean {
    const c = this.clamp(n);
    if (c <= 0) return false;
    for (let s = c; s >= 1; s--) {
      const v = this.#resolvedBySeq.get(s);
      if (v !== undefined) return v;
    }
    return false;
  }
}

/**
 * The store as it was at cursor n: a byte-faithful copy of the live head keeping
 * only objects whose creation seq ≤ n (predicate over the immutable store, no
 * copy of anything absent). At n = 0 this is the honest empty store — every
 * knowledge object has a creation seq ≥ 1 (the fixtures remain, being seed
 * infrastructure, but no compile input is present, so the surfaces render the
 * opening emptiness, never an error).
 */
export function storeViewAt(store: ObjectStore, index: HistoryIndex, n: number): ObjectStore {
  const c = index.clamp(n);
  return store.cloneWhere((h) => index.hasObjectAt(h, c));
}

/** The trace graph as it was at cursor n: the first `edgeCountAt(n)` edges. */
export function traceViewAt(trace: TraceStore, index: HistoryIndex, n: number): TraceStore {
  return trace.sliceClone(index.edgeCountAt(n));
}
