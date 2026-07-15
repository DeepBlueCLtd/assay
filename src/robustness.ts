/**
 * SPEC-10 — scenario robustness (thesis C; seam §8, DEC-10).
 *
 * A thin orchestration over the SPEC-07 scorer: score each plan against each
 * scenario's compiled world, assemble the plan × commitment × scenario verdict
 * tensor, and compute the worst-case (minimax) verdict per plan×commitment.
 * No new scoring engine — DEC-10 says analysis is the scorer in a loop.
 *
 * The minimax posture is decided by research note `docs/research/06-robustness.md`
 * §1: scenario-weighted rejected (DEC-15/19, scenario_weight firewall); minimax
 * regret rejected (launders absolute failure). The worst-case verdict is a real
 * verdict on a real scenario — no information destroyed.
 */
import type { Commitment, CompiledWorld, VerdictBand } from './generated/types.js';
import { ObjectStore, type Ref } from './store.js';
import { ScoreService } from './score.js';
import { contentHash } from './canonical.js';
import {
  isRefusal,
  type RobustnessRequest,
  type RobustnessResult,
  type Refusal,
  type ScenarioVerdictTensor,
} from './seam.js';

const VERDICT_ORDER: Record<VerdictBand, number> = {
  violated: 0,
  tight: 1,
  marginal: 2,
  robust: 3,
};

const VERDICT_NAMES: VerdictBand[] = ['violated', 'tight', 'marginal', 'robust'];

export class RobustnessService {
  #store: ObjectStore;
  #scorer: ScoreService;
  #commitmentIds: string[];

  constructor(opts: {
    store: ObjectStore;
    scorer: ScoreService;
    commitments: Commitment[];
  }) {
    this.#store = opts.store;
    this.#scorer = opts.scorer;
    this.#commitmentIds = [...opts.commitments].map((c) => c.logical_id).sort(cmp);
  }

  async robustness(req: RobustnessRequest): Promise<RobustnessResult> {
    const scenarioIds = Object.keys(req.worlds).sort(cmp);
    if (scenarioIds.length === 0) {
      return refusal('unknown_ref', [], 'no scenario worlds provided.');
    }

    const worlds = new Map<string, CompiledWorld>();
    for (const sid of scenarioIds) {
      const ref = req.worlds[sid]!;
      const w = this.#resolve<CompiledWorld>(ref);
      if (!w) return refusal('unknown_ref', [ref], `${ref.logical_id}: no such world for scenario ${sid}.`);
      worlds.set(sid, w);
    }

    const planIds: string[] = [];
    for (const pRef of req.plans) {
      const p = this.#resolve(pRef);
      if (!p) return refusal('unknown_ref', [pRef], `${pRef.logical_id}: no such plan to score.`);
      planIds.push(pRef.logical_id);
    }

    const verdicts = new Map<string, import('./generated/types.js').CommitmentVerdict>();

    for (const pRef of req.plans) {
      for (const sid of scenarioIds) {
        const wRef = req.worlds[sid]!;
        const scored = await this.#scorer.score({
          plan: pRef,
          world: wRef,
          scenario: sid,
          engine_version: req.engine_version,
        });
        if (isRefusal(scored)) return scored;
        for (const v of scored.verdicts) {
          verdicts.set(`${pRef.logical_id}-${v.commitment}-${sid}`, v);
        }
      }
    }

    const worst_case = new Map<string, VerdictBand>();
    for (const pid of planIds) {
      for (const cid of this.#commitmentIds) {
        let worstOrd = 3; // start at robust
        for (const sid of scenarioIds) {
          const v = verdicts.get(`${pid}-${cid}-${sid}`);
          if (v) {
            const ord = VERDICT_ORDER[v.verdict];
            if (ord < worstOrd) worstOrd = ord;
          }
        }
        worst_case.set(`${pid}-${cid}`, VERDICT_NAMES[worstOrd]!);
      }
    }

    const stamps_compatible = this.#stampsCompatible(worlds);

    const stamp = await contentHash({
      plans: req.plans.map((p) => ({ logical_id: p.logical_id, content_hash: p.content_hash })),
      worlds: scenarioIds.map((sid) => ({ scenario: sid, stamp: worlds.get(sid)!.stamp })),
      engine_version: req.engine_version,
    });

    const tensor: ScenarioVerdictTensor = {
      scenarios: scenarioIds,
      plans: planIds,
      commitments: [...this.#commitmentIds],
      verdicts,
      worst_case,
      stamps_compatible,
    };

    return { tensor, stamp };
  }

  #resolve<T>(ref: Ref): T | undefined {
    if (ref.content_hash) return this.#store.get(ref.content_hash) as T | undefined;
    const versions = this.#store.versions(ref.logical_id);
    const hash = versions.length > 0 ? versions[versions.length - 1]!.content_hash : undefined;
    return hash ? (this.#store.get(hash) as T) : undefined;
  }

  #stampsCompatible(worlds: Map<string, CompiledWorld>): boolean {
    // Lineage = consumed knowledge set + engine version (note 02 §6, SPEC-20):
    // worlds computed by different engines are no more comparable than worlds
    // computed from different knowledge — mixed lineage greys, never blends.
    const lineages: string[] = [];
    for (const w of worlds.values()) {
      const key = w.consumed
        .map((c) => `${c.logical_id}:${c.content_hash}`)
        .sort()
        .join('|');
      lineages.push(`${w.engine_version}#${key}`);
    }
    return lineages.every((s) => s === lineages[0]);
  }
}

const cmp = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

const refusal = (reason: Refusal['reason'], offending: Ref[], explanation: string): Refusal => ({
  refused: true,
  reason,
  offending,
  explanation,
});
