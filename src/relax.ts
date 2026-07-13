/**
 * SPEC-09 — the relaxation service (seam contract §7; delivery plan §ε, Stage 4).
 *
 *   POST /relax  {world, commitments, seed}
 *      → {report: RelaxationReport, stamp, feasible?}
 *
 * Least-worst, never silence (G4). On an infeasible world (Meridian R3m), it turns
 * unsatisfiability into an ARGUMENT the commander weighs, in five honest steps:
 *
 *   1. GENERATE — the R3m-responsive candidate set (`src/relaxCandidates.ts`):
 *      authored plans that ENTER the mined water (the SPEC-08 BASE generator cannot
 *      — research note §3). Geometry authored; sacrifices computed.
 *   2. SCORE — each candidate through the SPEC-07 scorer (`ScoreService`, REUSED,
 *      never re-implemented). A commitment is `sacrificed` iff its verdict is
 *      `violated` — the strongest claim; `tight`/`marginal` are risks, not sacrifices.
 *   3. MINIMALITY — keep the inclusion-minimal correction sets (`src/tiers.ts`): a
 *      strict-superset sacrifice is silent waste and is dropped; different singletons
 *      both survive; the report is never empty (G4).
 *   4. RANK — least-worst first by ordinal tier cost (musts, then shoulds, then
 *      prefers), NO weights (DEC-19); the must-sacrifice ranks last, never dropped.
 *      Same-tier ties ordered by a stated, content-neutral convention (`tie_break`).
 *   5. TRACE — `cited_in` from each candidate's verdicts/scores to the report and
 *      `sacrificed_in` from each sacrificed commitment, so every card opens a
 *      complete backward chain to named knowledge (G3).
 *
 * Deterministic over `(world stamp, sorted commitment ids, seed, engine)` (G1);
 * scenario-blind over the compile-time excursion (DEC-10); refuses first-class.
 */
import type {
  Commitment,
  CommitmentVerdict,
  CompiledWorld,
  PlanScore,
  RelaxationCandidate,
  RelaxationReport,
  TraceEdge,
} from './generated/types.js';
import { ObjectStore, type Ref } from './store.js';
import { TraceStore } from './trace.js';
import { contentHash } from './canonical.js';
import { validateInstance } from './validate.js';
import { ScoreService } from './score.js';
import { isRefusal, type RelaxRequest, type RelaxResult, type Refusal } from './seam.js';
import { relaxCandidates, narrativeFor } from './relaxCandidates.js';
import {
  canonicalSet,
  compareTierCost,
  inclusionMinimal,
  tierCost,
  tieBreakText,
  type SacrificeSet,
  type TierOf,
} from './tiers.js';

const DEFAULT_SCENARIO = 'BASE';

/** A scored candidate before organisation. */
interface Scored {
  planRef: Ref;
  sacrificed: SacrificeSet; // canonical (sorted, de-duped) `violated` commitment ids
  verdicts: CommitmentVerdict[];
  scores: PlanScore[];
}

export class RelaxService {
  #store: ObjectStore;
  #trace: TraceStore;
  #scorer: ScoreService;
  #tierOf: TierOf;
  #commitmentsById: Map<string, Commitment>;
  #writtenBy: string;

  constructor(opts: {
    store: ObjectStore;
    trace: TraceStore;
    scorer: ScoreService;
    /** The commander's commitments (C1–C6) — tiers drive the ranking (DEC-19). */
    commitments: Commitment[];
    writtenBy?: string;
  }) {
    this.#store = opts.store;
    this.#trace = opts.trace;
    this.#scorer = opts.scorer;
    this.#commitmentsById = new Map(opts.commitments.map((c) => [c.logical_id, c]));
    this.#tierOf = (id) => {
      const c = this.#commitmentsById.get(id);
      if (!c) throw new Error(`relax: no tier for commitment '${id}' (commitment set mismatch)`);
      return c.tier;
    };
    this.#writtenBy = opts.writtenBy ?? 'relax-service';
  }

  /** POST /relax — pure over its stamped inputs; refuses first-class, persists nothing on refusal. */
  async relax(req: RelaxRequest): Promise<RelaxResult> {
    const world = this.#resolveWorld(req.world);
    if (!world) {
      return refusal('unknown_ref', [req.world], `${req.world.logical_id}: no such world to relax against.`);
    }
    const scenario = world.scenario ?? DEFAULT_SCENARIO;

    // 1–2. Generate the R3m-responsive candidates, then score each. The scorer —
    //       not this author — decides the sacrifices (the `violated` set).
    const scored: Scored[] = [];
    let feasible: { plan: Ref } | undefined;
    for (const candidate of relaxCandidates(req.seed)) {
      const planRef = await this.#store.put(candidate as unknown as Record<string, unknown>);
      const result = await this.#scorer.score({
        plan: planRef,
        world: req.world,
        scenario,
        engine_version: req.engine_version,
      });
      if (isRefusal(result)) return result; // a candidate that refuses scoring refuses the relax
      const sacrificed = canonicalSet(
        result.verdicts.filter((v) => v.verdict === 'violated').map((v) => v.commitment),
      );
      if (sacrificed.length === 0) {
        // A fully-feasible plan: report feasibility first-class, never as a
        // RelaxationCandidate with empty `sacrificed` (G4 — FR-013). It is excluded
        // from the candidate frontier below (there is nothing to give up).
        feasible ??= { plan: planRef };
        continue;
      }
      scored.push({ planRef, sacrificed, verdicts: result.verdicts, scores: result.scores });
    }

    // 3. Inclusion-minimal correction sets, then map each surviving set back to a
    //    representative scored candidate (first candidate carrying that exact set).
    const minimalSets = inclusionMinimal(scored.map((s) => s.sacrificed));
    const survivors = minimalSets.map((set) => {
      const rep = scored.find((s) => sameSet(s.sacrificed, set));
      if (!rep) throw new Error(`relax: minimal set ${set.join('+')} lost its candidate (internal)`);
      return rep;
    });
    if (survivors.length === 0) {
      // Only reachable if every candidate was feasible — impossible for the authored
      // set (each posture sacrifices ≥1). Fail loud rather than emit an empty report.
      throw new Error('relax: no non-empty sacrifice sets — candidate set produced no relaxation (fixture defect).');
    }

    // 4. Rank least-worst first by tier cost, then the stated content-neutral id
    //    tie-break for same-tier groups (DEC-19). A total, reproducible order.
    const ranked = [...survivors].sort(
      (a, b) =>
        compareTierCost(tierCost(a.sacrificed, this.#tierOf), tierCost(b.sacrificed, this.#tierOf)) ||
        cmp(a.sacrificed.join('+'), b.sacrificed.join('+')),
    );
    const tie_break = tieBreakText(ranked.map((s) => s.sacrificed), this.#tierOf);

    // 5. Assemble, validate, store the report, then write the trace edges (G3).
    const candidates: RelaxationCandidate[] = ranked.map((s) => ({
      plan: s.planRef.logical_id,
      sacrificed: s.sacrificed,
      narrative: narrativeFor(s.planRef.logical_id),
    }));
    const report: RelaxationReport = {
      logical_id: `RR-${scenario}`,
      version: 1,
      world_stamp: world.stamp,
      scenario,
      candidates,
      ...(tie_break ? { tie_break } : {}),
    };
    const errors = validateInstance('RelaxationReport', report);
    if (errors.length > 0) throw new Error(`relax produced an invalid RelaxationReport: ${errors.join('; ')}`);

    const stamp = await contentHash({
      world: world.stamp,
      commitments: [...this.#commitmentsById.keys()].sort(cmp),
      seed: req.seed,
      engine_version: req.engine_version,
    });
    const reportRef = await this.#store.put(report as unknown as Record<string, unknown>);

    // cited_in: each surviving candidate's verdicts + scores → the report.
    // sacrificed_in: each sacrificed Commitment → the report (the candidate lives in it).
    for (const s of ranked) {
      for (const v of s.verdicts) {
        const vhash = (await this.#store.put(v as unknown as Record<string, unknown>)).content_hash;
        this.#trace.add(this.#edge(vhash, reportRef.content_hash, 'cited_in', stamp));
      }
      for (const sc of s.scores) {
        const shash = (await this.#store.put(sc as unknown as Record<string, unknown>)).content_hash;
        this.#trace.add(this.#edge(shash, reportRef.content_hash, 'cited_in', stamp));
      }
      for (const cid of s.sacrificed) {
        const chash = this.#commitmentHash(cid);
        if (chash) this.#trace.add(this.#edge(chash, reportRef.content_hash, 'sacrificed_in', stamp));
      }
    }

    return { report, stamp, ...(feasible ? { feasible } : {}) };
  }

  #resolveWorld(ref: Ref): CompiledWorld | undefined {
    if (ref.content_hash) return this.#store.get(ref.content_hash) as CompiledWorld | undefined;
    const versions = this.#store.versions(ref.logical_id);
    const hash = versions.length > 0 ? versions[versions.length - 1]!.content_hash : undefined;
    return hash ? (this.#store.get(hash) as CompiledWorld) : undefined;
  }

  /** The stored content hash of a commitment id, if it is in the store (for sacrificed_in). */
  #commitmentHash(id: string): string | undefined {
    const versions = this.#store.versions(id);
    return versions.length > 0 ? versions[versions.length - 1]!.content_hash : undefined;
  }

  #edge(from: string, to: string, type: TraceEdge['edge_type'], stamp: string): TraceEdge {
    return { from_hash: from, to_hash: to, edge_type: type, stamp, written_by: this.#writtenBy };
  }
}

// ————— helpers —————

const cmp = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);
const sameSet = (a: SacrificeSet, b: SacrificeSet): boolean =>
  a.length === b.length && a.every((x, i) => x === b[i]);

const refusal = (reason: Refusal['reason'], offending: Ref[], explanation: string): Refusal => ({
  refused: true,
  reason,
  offending,
  explanation,
});
