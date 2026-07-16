/**
 * SPEC-07 — the scorer (seam contract §5; DEC-10, the unit everything orbits).
 *
 * plan × world × scenario → CommitmentVerdict[] + PlanScore[]. It propagates
 * banded metrics by interval arithmetic (`src/metrics.ts` over `src/interval.ts`
 * and the score-time materialiser), maps each commitment to a four-stop verdict
 * against a SIGNED MARGIN BAND (research note `03-score-plan.md` §3), and writes
 * one `scored_from` edge per verdict/score so every verdict opens a complete
 * backward trace to named knowledge (G3).
 *
 * The verdict mapping is signs-only — no interior cut, no invented ε — which is
 * the unique four-stop rule satisfying oracle O-3 (the verdict changes only at
 * band edges). Verdicts cross the seam as the four-stop scale only; `margin` is
 * a Band shown on demand (G2). Scoring is deterministic over its inputs (the
 * stamp is a hash over inputs, never over materialised cells — G1), scenario-
 * blind (the world is already excursioned — DEC-10), and honestly real even in
 * the mock (DEC-4). `knowledge_overrides` re-scores for the call only, storing
 * nothing; a scenario/stamp disagreement refuses `stamp_mismatch` (comparability
 * guard). A plan that fails a `must` is a SUCCESS carrying a `violated` verdict —
 * a failing plan is honest output, not a refusal.
 */
import type {
  Band,
  Commitment,
  CommitmentVerdict,
  CompiledWorld,
  KnowledgeObject,
  Plan,
  PlanScore,
  RegionOverride,
  TraceEdge,
  VerdictBand,
  VignetteConfig,
} from './generated/types.js';
import { ObjectStore, type Ref } from './store.js';
import { TraceStore } from './trace.js';
import { contentHash } from './canonical.js';
import { validateInstance } from './validate.js';
import { evaluateMetric, isSevered } from './metrics.js';
import { marginBand, verdictFor } from './verdictMap.js';
import type { KnowledgeOverride, Refusal, ScoreRequest, ScoreResult } from './seam.js';

// Re-exported for back-compat: the pure mapping now lives in verdictMap.ts so the
// verdict legend (SPEC-25) reads the SAME rule (note 13 §3). Tests and callers
// that import from './score.js' are unaffected.
export { marginBand, verdictFor } from './verdictMap.js';

export class ScoreService {
  #store: ObjectStore;
  #trace: TraceStore;
  #config: VignetteConfig;
  #commitmentSet: Commitment[];
  #writtenBy: string;

  constructor(opts: {
    store: ObjectStore;
    trace: TraceStore;
    config: VignetteConfig;
    /** The commander's commitments (C1–C6) — the intent the plan is scored against. */
    commitments: Commitment[];
    writtenBy?: string;
  }) {
    this.#store = opts.store;
    this.#trace = opts.trace;
    this.#config = opts.config;
    // Canonically ordered by logical_id so the returned verdict list is
    // order-independent of how the caller presents the set (determinism, G1).
    this.#commitmentSet = [...opts.commitments].sort((a, b) => cmp(a.logical_id, b.logical_id));
    this.#writtenBy = opts.writtenBy ?? 'score-service';
  }

  /** POST /score — pure over its stamped inputs; refuses first-class, persists nothing on refusal. */
  async score(req: ScoreRequest): Promise<ScoreResult> {
    // 1. Resolve plan and world.
    const plan = this.#resolve<Plan>(req.plan);
    if (!plan) return refusal('unknown_ref', [req.plan], `${req.plan.logical_id}: no such plan to score.`);
    const world = this.#resolve<CompiledWorld>(req.world);
    if (!world) return refusal('unknown_ref', [req.world], `${req.world.logical_id}: no such world to score against.`);

    // 2. Comparability guard: a world compiled for a specific COA is incomparable
    //    under a different scenario label (the scenario is folded into the world's
    //    stamp — SPEC-06). A base world (no excursion) is scenario-agnostic.
    if (world.scenario !== undefined && world.scenario !== req.scenario) {
      return refusal('stamp_mismatch', [req.world],
        `world ${req.world.logical_id} was compiled for ${world.scenario}, not ${req.scenario} — incomparable stamps (comparability guard).`);
    }

    // 3. Apply knowledge_overrides as a TRANSIENT channel layer over a cloned world
    //    — for this call only; nothing is stored, no edge written (seam §5).
    const scored = this.#applyOverrides(world, req.knowledge_overrides ?? []);

    // 4. Score each commitment (the commander's set), canonically ordered.
    const commitments = this.#commitmentSet;
    const verdicts: CommitmentVerdict[] = [];
    const scores: PlanScore[] = [];
    for (const c of commitments) {
      const result = evaluateMetric(c, plan, scored, this.#config);
      let verdict: VerdictBand;
      let margin: Band | undefined;
      if (isSevered(result)) {
        verdict = 'violated'; // the objective is unreachable — an honest worst verdict
      } else {
        margin = marginBand(c.comparator, c.threshold, result.band);
        verdict = verdictFor(margin);
        scores.push({
          logical_id: `PS-${plan.logical_id}-${c.logical_id}-${req.scenario}`,
          version: 1,
          plan: plan.logical_id,
          scenario: req.scenario,
          world_stamp: world.stamp,
          criterion: c.metric,
          score: result.band,
          engine_version: req.engine_version,
        });
      }
      const v: CommitmentVerdict = {
        logical_id: `V-${plan.logical_id}-${c.logical_id}-${req.scenario}`,
        version: 1,
        plan: plan.logical_id,
        commitment: c.logical_id,
        scenario: req.scenario,
        world_stamp: world.stamp,
        verdict,
        engine_version: req.engine_version,
      };
      if (margin) v.margin = margin;
      verdicts.push(v);
    }

    // 5. Deterministic stamp over inputs (never over materialised cells — G1).
    const overridesForStamp = (req.knowledge_overrides ?? [])
      .map((o) => ({ ref: o.ref.logical_id, answer: o.answer }))
      .sort((a, b) => cmp(a.ref, b.ref));
    const stamp = await contentHash({
      plan: { logical_id: plan.logical_id, content_hash: req.plan.content_hash },
      world: world.stamp,
      scenario: req.scenario,
      overrides: overridesForStamp,
      engine_version: req.engine_version,
    });

    // 6. Store verdicts/scores and write one scored_from edge each → the world (G3).
    const worldHash = req.world.content_hash || (await contentHash(world as unknown as Record<string, unknown>));
    for (const v of verdicts) {
      const errors = validateInstance('CommitmentVerdict', v);
      if (errors.length > 0) throw new Error(`score produced an invalid CommitmentVerdict: ${errors.join('; ')}`);
      const ref = await this.#store.put(v as unknown as Record<string, unknown>);
      this.#trace.add(this.#edge(ref.content_hash, worldHash, stamp));
    }
    for (const s of scores) {
      const errors = validateInstance('PlanScore', s);
      if (errors.length > 0) throw new Error(`score produced an invalid PlanScore: ${errors.join('; ')}`);
      const ref = await this.#store.put(s as unknown as Record<string, unknown>);
      this.#trace.add(this.#edge(ref.content_hash, worldHash, stamp));
    }

    // 7. No delta (contract §9): scoring is a read-of-world, not a knowledge write.
    return { verdicts, scores, stamp };
  }

  #resolve<T>(ref: Ref): T | undefined {
    if (ref.content_hash) return this.#store.get(ref.content_hash) as T | undefined;
    const versions = this.#store.versions(ref.logical_id);
    const hash = versions.length > 0 ? versions[versions.length - 1]!.content_hash : undefined;
    return hash ? (this.#store.get(hash) as T) : undefined;
  }

  /**
   * Clone the world and SUBSTITUTE override answers into their channel region —
   * for this call only; nothing is stored, no edge written (seam §5). An override
   * replaces any existing overrides on that region (it is the substituted answer
   * the compile would have laid down), so it is unambiguously what the scorer reads.
   */
  #applyOverrides(world: CompiledWorld, overrides: KnowledgeOverride[]): CompiledWorld {
    if (overrides.length === 0) return world;
    const clone = structuredClone(world);
    for (const o of overrides) {
      const ko = this.#resolve<KnowledgeObject>(o.ref);
      if (!ko) continue; // an override for a ref we cannot see is a no-op, not a store write
      const entry = this.#config.subject_map.find((e) => e.subject === ko.subject);
      if (!entry) continue;
      const channel = clone.channels.find((c) => c.kind === entry.channel);
      if (!channel) continue;
      const kept = (channel.regions ?? []).filter((r) => r.region !== entry.region);
      const layer: RegionOverride = { region: entry.region, value: o.answer, source: o.ref.logical_id };
      channel.regions = [...kept, layer];
    }
    return clone;
  }

  #edge(from: string, to: string, stamp: string): TraceEdge {
    return { from_hash: from, to_hash: to, edge_type: 'scored_from', stamp, written_by: this.#writtenBy };
  }
}

const cmp = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

const refusal = (reason: Refusal['reason'], offending: Ref[], explanation: string): Refusal => ({
  refused: true,
  reason,
  offending,
  explanation,
});
