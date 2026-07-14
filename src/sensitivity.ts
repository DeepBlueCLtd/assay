/**
 * SPEC-11 — sensitivity analysis (seam §8, thesis E).
 *
 * Band-edge perturbation loop over the SPEC-07 scorer (DEC-10: scorer in a
 * loop). For each answered K consumed by the world, re-score with the answer
 * pushed to each band edge; rank by the number of commitment verdicts that
 * change. The `single_source` flag is carried through from provenance, never
 * used in the ranking arithmetic (research note 08-analysis.md §1).
 */
import type {
  Band,
  CompiledWorld,
  KnowledgeObject,
  VerdictBand,
  VignetteConfig,
  Commitment,
} from './generated/types.js';
import { ObjectStore, type Ref } from './store.js';
import { TraceStore } from './trace.js';
import { ScoreService } from './score.js';
import { contentHash } from './canonical.js';
import {
  isRefusal,
  type KnowledgeOverride,
  type Refusal,
  type SensitivityRequest,
  type SensitivityRanking,
  type SensitivityResult,
} from './seam.js';

export class SensitivityService {
  #store: ObjectStore;
  #trace: TraceStore;
  #config: VignetteConfig;
  #commitments: Commitment[];

  constructor(opts: {
    store: ObjectStore;
    trace: TraceStore;
    config: VignetteConfig;
    commitments: Commitment[];
  }) {
    this.#store = opts.store;
    this.#trace = opts.trace;
    this.#config = opts.config;
    this.#commitments = opts.commitments;
  }

  async analyse(req: SensitivityRequest): Promise<SensitivityResult> {
    const world = this.#resolve<CompiledWorld>(req.world);
    if (!world) return refusal('unknown_ref', [req.world], `${req.world.logical_id}: no such world.`);

    const plan = this.#resolve(req.plan);
    if (!plan) return refusal('unknown_ref', [req.plan], `${req.plan.logical_id}: no such plan.`);

    const scorer = new ScoreService({
      store: this.#store,
      trace: this.#trace,
      config: this.#config,
      commitments: this.#commitments,
      writtenBy: 'sensitivity-service',
    });

    const baseResult = await scorer.score({
      plan: req.plan,
      world: req.world,
      scenario: req.scenario,
      engine_version: req.engine_version,
    });
    if (isRefusal(baseResult)) return baseResult;
    const baseVerdicts = baseResult.verdicts.map((v) => v.verdict);

    const consumed = world.consumed ?? [];
    const ranking: SensitivityRanking[] = [];

    for (const c of consumed) {
      const ko = this.#resolve<KnowledgeObject>({ logical_id: c.logical_id, content_hash: c.content_hash });
      if (!ko) continue;
      if (!ko.answer) continue;

      const loBand: Band = { lo: ko.answer.lo, hi: ko.answer.lo, unit: ko.answer.unit };
      const hiBand: Band = { lo: ko.answer.hi, hi: ko.answer.hi, unit: ko.answer.unit };

      const koRef: Ref = { logical_id: c.logical_id, content_hash: c.content_hash };
      const perturbations: Band[] = [loBand, hiBand];

      let worstChanged = 0;
      let worstVerdicts = baseVerdicts;
      let worstMarginProx = Infinity;

      for (const band of perturbations) {
        if (band.lo === ko.answer.lo && band.hi === ko.answer.hi) continue;

        const override: KnowledgeOverride = { ref: koRef, answer: band };
        const pertResult = await scorer.score({
          plan: req.plan,
          world: req.world,
          scenario: req.scenario,
          knowledge_overrides: [override],
          engine_version: req.engine_version,
        });
        if (isRefusal(pertResult)) continue;

        const pertVerdicts = pertResult.verdicts.map((v) => v.verdict);
        let changed = 0;
        for (let i = 0; i < baseVerdicts.length; i++) {
          if (baseVerdicts[i] !== pertVerdicts[i]) changed++;
        }

        let marginProx = Infinity;
        for (const v of pertResult.verdicts) {
          if (v.margin) {
            const absMin = Math.min(Math.abs(v.margin.lo), Math.abs(v.margin.hi));
            if (absMin < marginProx) marginProx = absMin;
          }
        }

        if (changed > worstChanged || (changed === worstChanged && marginProx < worstMarginProx)) {
          worstChanged = changed;
          worstVerdicts = pertVerdicts;
          worstMarginProx = marginProx;
        }
      }

      ranking.push({
        knowledge: koRef,
        baseline_verdicts: baseVerdicts,
        perturbed_verdicts: worstVerdicts,
        changed_count: worstChanged,
        single_source: ko.provenance?.single_source ?? false,
      });
    }

    ranking.sort((a, b) => {
      if (b.changed_count !== a.changed_count) return b.changed_count - a.changed_count;
      return 0;
    });

    const stamp = await contentHash({
      plan: req.plan.logical_id,
      world: req.world.logical_id,
      scenario: req.scenario,
      engine_version: req.engine_version,
      analysis: 'sensitivity',
    });

    return { ranking, stamp };
  }

  #resolve<T = unknown>(ref: Ref): T | undefined {
    if (ref.content_hash) return this.#store.get(ref.content_hash) as T | undefined;
    const versions = this.#store.versions(ref.logical_id);
    const hash = versions.length > 0 ? versions[versions.length - 1]!.content_hash : undefined;
    return hash ? (this.#store.get(hash) as T) : undefined;
  }
}

const refusal = (reason: Refusal['reason'], offending: Ref[], explanation: string): Refusal => ({
  refused: true,
  reason,
  offending,
  explanation,
});
