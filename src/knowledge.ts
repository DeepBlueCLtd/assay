/**
 * SPEC-05 — the knowledge service (seam contract §3).
 *
 * create · supersede · contest · resolve · exposure, over the content-addressed
 * store (SPEC-01) and trace store (SPEC-02). Encoding discipline is enforced at
 * write time (knowledge model §9); declines are first-class Refusals, never
 * thrown errors and never degraded saves. Every act publishes exactly one delta.
 *
 * Objects are immutable (DEC-21): nothing is ever mutated to a new status.
 * Lifecycle status is *derived from trace edges* — a `supersedes` edge staled
 * the prior version, a `contests` edge made both parties contested, a
 * `resolves` edge lifted a survivor. `effectiveStatus` is that trace walk;
 * `isCompilable` is the single source of truth for "contested never compiles"
 * (G5), consumed by the S1 blocking flag now and the SPEC-06 compile later.
 */
import type { KnowledgeObject, LifecycleStatus, TraceEdge } from './generated/types.js';
import { ObjectStore, type Ref } from './store.js';
import { TraceStore, type TraceChain } from './trace.js';
import { DeltaLog } from './deltas.js';
import { validateInstance } from './validate.js';
import { checkEncoding } from './encoding.js';
import { confidenceLint, jipoeStepLint } from './lint.js';
import { contentHash } from './canonical.js';
import type { LintWarning, Refusal, WriteResult } from './seam.js';

export interface SupersedeResult {
  ref: Ref;
  stale: Ref[]; // exactly the versions the supersedes edge staled (seam §3)
  warnings?: LintWarning[];
}

export interface ContestResult {
  refs: [Ref, Ref];
}

const unknownRef = (id: string, explanation: string): Refusal => ({
  refused: true,
  reason: 'unknown_ref',
  offending: [{ logical_id: id, content_hash: '' }],
  explanation,
});

export class KnowledgeService {
  #store: ObjectStore;
  #trace: TraceStore;
  #deltas: DeltaLog;
  #actor: string;
  #role: string;

  constructor(opts?: {
    store?: ObjectStore;
    trace?: TraceStore;
    deltas?: DeltaLog;
    actor?: string;
    role?: string;
  }) {
    this.#store = opts?.store ?? new ObjectStore();
    this.#trace = opts?.trace ?? new TraceStore();
    this.#deltas = opts?.deltas ?? new DeltaLog();
    this.#actor = opts?.actor ?? 'J-2';
    this.#role = opts?.role ?? 'analyst';
  }

  get store(): ObjectStore {
    return this.#store;
  }
  get trace(): TraceStore {
    return this.#trace;
  }
  get deltas(): DeltaLog {
    return this.#deltas;
  }

  /** POST /knowledge — encoding discipline enforced here; nothing persists on refusal. */
  async create(ko: KnowledgeObject): Promise<WriteResult> {
    this.#assertValid(ko);

    const refusal = checkEncoding(ko);
    if (refusal) return refusal; // persist nothing (FR-002)

    const hash = await contentHash(ko as unknown as Record<string, unknown>);
    const isNew = !this.#store.exists(hash);
    const ref = await this.#store.put(ko as unknown as Record<string, unknown>);

    const warnings = this.#lints(ko);
    if (isNew) {
      // Exactly one delta per act; a byte-identical re-create publishes none (FR-010).
      // The delta records the warnings the write drew (SPEC-21).
      this.#deltas.publish({
        op: 'create',
        refs: [ref],
        actor: this.#actor,
        role: this.#role,
        ...(warnings.length > 0 ? { warnings } : {}),
      });
    }

    return warnings.length > 0 ? { ref, warnings } : { ref };
  }

  /** POST /knowledge/{id}/supersede — writes a supersedes edge; returns what it staled. */
  async supersede(next: KnowledgeObject, priorId: string): Promise<SupersedeResult | Refusal> {
    this.#assertValid(next);

    const refusal = checkEncoding(next);
    if (refusal) return refusal;

    const priorHash = this.#latestHash(priorId);
    if (!priorHash) {
      return unknownRef(priorId, `${priorId}: no live version to supersede.`);
    }

    const ref = await this.#store.put(next as unknown as Record<string, unknown>);
    const priorRef: Ref = { logical_id: priorId, content_hash: priorHash };

    const warnings = this.#lints(next);
    // Supersession is an edge, cross-lineage where needed (K9 supersedes K5) — DEC-21.
    this.#trace.add(this.#edge(ref.content_hash, priorHash, 'supersedes'));
    this.#deltas.publish({
      op: 'supersede',
      refs: [ref, priorRef],
      actor: this.#actor,
      role: this.#role,
      ...(warnings.length > 0 ? { warnings } : {}),
    });

    return warnings.length > 0 ? { ref, stale: [priorRef], warnings } : { ref, stale: [priorRef] };
  }

  /** POST /knowledge/{id}/contest — marks both contested; blocks compile (G5). */
  contest(aId: string, bId: string): ContestResult | Refusal {
    const aHash = this.#latestHash(aId);
    const bHash = this.#latestHash(bId);
    if (!aHash) return unknownRef(aId, `${aId}: no live version to contest.`);
    if (!bHash) return unknownRef(bId, `${bId}: no live version to contest.`);

    this.#trace.add(this.#edge(aHash, bHash, 'contests'));
    const aRef: Ref = { logical_id: aId, content_hash: aHash };
    const bRef: Ref = { logical_id: bId, content_hash: bHash };
    this.#deltas.publish({ op: 'contest', refs: [aRef, bRef], actor: this.#actor, role: this.#role });

    return { refs: [aRef, bRef] };
  }

  /** POST /knowledge/{id}/resolve — writes a resolves edge; survivor leaves contested. */
  resolve(survivorId: string, _note: string): { ref: Ref } | Refusal {
    const survivorHash = this.#latestHash(survivorId);
    if (!survivorHash) return unknownRef(survivorId, `${survivorId}: no live version to resolve.`);

    const contest = this.#trace.edges.find(
      (e) =>
        e.edge_type === 'contests' &&
        (e.from_hash === survivorHash || e.to_hash === survivorHash),
    );
    if (!contest) {
      return unknownRef(
        survivorId,
        `${survivorId}: a resolution must name a version that is party to an open contest.`,
      );
    }
    const loserHash = contest.from_hash === survivorHash ? contest.to_hash : contest.from_hash;

    this.#trace.add(this.#edge(survivorHash, loserHash, 'resolves'));
    const ref: Ref = { logical_id: survivorId, content_hash: survivorHash };
    this.#deltas.publish({ op: 'resolve', refs: [ref], actor: this.#actor, role: this.#role });

    return { ref };
  }

  /** GET /knowledge/{id}/exposure — forward walk: what does this drive? */
  exposure(id: string): { chains: TraceChain[] } {
    const hash = this.#latestHash(id);
    if (!hash) return { chains: [] };
    return { chains: this.#trace.forward(hash, (h) => this.#store.exists(h)) };
  }

  /**
   * Effective lifecycle status, derived from trace edges over the latest live
   * version (never mutated onto the object). Edge-driven overrides win over the
   * authored status; otherwise the stored status stands.
   */
  effectiveStatus(id: string): LifecycleStatus | undefined {
    const hash = this.#latestHash(id);
    if (!hash) return undefined;
    const edges = this.#trace.edges;

    if (edges.some((e) => e.edge_type === 'supersedes' && e.to_hash === hash)) return 'superseded';
    if (edges.some((e) => e.edge_type === 'resolves' && e.from_hash === hash)) return 'resolved';

    const contested = edges.some(
      (e) => e.edge_type === 'contests' && (e.from_hash === hash || e.to_hash === hash),
    );
    const resolved = edges.some(
      (e) => e.edge_type === 'resolves' && (e.from_hash === hash || e.to_hash === hash),
    );
    if (contested && !resolved) return 'contested';

    const stored = this.#store.get(hash) as KnowledgeObject | undefined;
    return stored?.status;
  }

  /** The single G5 truth: contested knowledge reaches no compiled world. */
  isCompilable(id: string): boolean {
    return this.effectiveStatus(id) !== 'contested';
  }

  /** Every knowledge write runs every lint; warnings never refuse (research note 01 + amendment). */
  #lints(ko: KnowledgeObject): LintWarning[] {
    return [...confidenceLint(ko), ...jipoeStepLint(ko)];
  }

  #latestHash(id: string): string | undefined {
    const versions = this.#store.versions(id);
    return versions.length > 0 ? versions[versions.length - 1]!.content_hash : undefined;
  }

  #edge(from: string, to: string, edge_type: TraceEdge['edge_type']): TraceEdge {
    return { from_hash: from, to_hash: to, edge_type, written_by: this.#actor };
  }

  #assertValid(ko: KnowledgeObject): void {
    const errors = validateInstance('KnowledgeObject', ko);
    if (errors.length > 0) {
      // Invalid input is a programmer/fixture bug, not an honest domain decline.
      throw new Error(`invalid KnowledgeObject ${ko.logical_id}: ${errors.join('; ')}`);
    }
  }
}
