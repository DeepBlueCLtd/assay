/**
 * SPEC-24 — decision support (seam §8; review §4.2/M1/B1, slice S-D — the keystone).
 *
 * Derives the doctrinal decision support matrix — decision points tied to the
 * intelligence that discriminates them, with a latest time the information is
 * of value (LTIOV) — as a thin orchestration over existing machinery (DEC-10,
 * DEC-5: a projection plus one derivation rule, no new engine):
 *
 *   - the verdict tensor (SPEC-10 `RobustnessService`) supplies the evidence;
 *   - `classifySeparation`/`computeSeparation` (SPEC-12/23) attach discriminators;
 *   - `channelAt` at exactly the points `metrics.ts` reads derives the commit step;
 *   - `CompiledWorld.consumed` × validity windows derive the tripwires.
 *
 * Every rule is decided by research note `docs/research/12-decision-support.md`
 * (DEC-11 gate) and implemented with no additional heuristics (FR-001):
 *   §2 the two-class DP predicate — scenario-divergent (adversary vocabulary
 *      only; K14 never enters) or margin-class (`tight`/`marginal` under the
 *      selected world); uniform `robust` and uniform `violated` are non-DPs;
 *   §3 the commit step — first divergent-read leg's `enter_step` for
 *      route-reading metrics; the horizon step, worded world-decided, for
 *      `state` metrics; a stated absence for margin-class-only rows;
 *   §4 LTIOV = commit_step − lead (lead 0 in v1, stated on the result), on the
 *      scenario clock only (DEC-17); in-time / red-with-arithmetic / unstated —
 *      three states, never collapsed, no row dropped for being red (FR-005);
 *   §5 tripwires at the trace graph's honest world-level granularity.
 *
 * The DSM ranks and derives, never tasks and never decides (FR-007): rows are
 * ordered by commitment logical_id — a stated presentation order carrying no
 * priority claim — and no urgency/priority/risk scalar exists anywhere
 * (DEC-19). Results are deterministic and stamped over inputs (G1); the result
 * envelope is stored and `cited_in`-edged to its evidence verdicts,
 * discriminator questions, and tripwire knowledge (G3).
 */
import type {
  Band,
  Commitment,
  CompiledWorld,
  KnowledgeObject,
  Plan,
  TraceEdge,
  VignetteConfig,
} from './generated/types.js';
import { ObjectStore, type Ref } from './store.js';
import { TraceStore } from './trace.js';
import { contentHash } from './canonical.js';
import { channelAt } from './materialise.js';
import { metricProfile } from './metrics.js';
import { classifySeparation, computeSeparation } from './discrimination.js';
import { RobustnessService } from './robustness.js';
import {
  isRefusal,
  type DecisionPointRow,
  type DecisionSupportRequest,
  type DecisionSupportResult,
  type DpEvidence,
  type DsmCollection,
  type DsmDiscriminator,
  type DsmTripwire,
  type Refusal,
} from './seam.js';

/** Decision-cycle lead (note 12 §4): 0 in v1, stated — a non-zero lead is an
 *  authored, banded assessment, not a constant the engine invents. */
const LEAD = 0;

export class DecisionSupportService {
  #store: ObjectStore;
  #trace: TraceStore;
  #config: VignetteConfig;
  #robustness: RobustnessService;
  #writtenBy: string;

  constructor(opts: {
    store: ObjectStore;
    trace: TraceStore;
    config: VignetteConfig;
    /** The SPEC-10 orchestration the tensor comes from — scorer-in-a-loop, no new engine (DEC-10). */
    robustness: RobustnessService;
    writtenBy?: string;
  }) {
    this.#store = opts.store;
    this.#trace = opts.trace;
    this.#config = opts.config;
    this.#robustness = opts.robustness;
    this.#writtenBy = opts.writtenBy ?? 'decision-support-service';
  }

  /** POST /analyse/decision-support — derived, never authored; refuses first-class. */
  async analyse(req: DecisionSupportRequest): Promise<DecisionSupportResult> {
    const plan = this.#resolve<Plan>(req.plan);
    if (!plan) return refusal('unknown_ref', [req.plan], `${req.plan.logical_id}: no such plan.`);

    // The selected world must be one of the scenario worlds — margin-class
    // evidence is read from the same tensor divergence is (note 12 §2).
    const selected = Object.entries(req.worlds).find(
      ([, ref]) =>
        (req.world.content_hash && ref.content_hash === req.world.content_hash) ||
        (!req.world.content_hash && ref.logical_id === req.world.logical_id),
    )?.[0];
    if (!selected) {
      return refusal(
        'stamp_mismatch',
        [req.world],
        'the selected world is not among the scenario worlds — margin-class evidence would read a different tableau than divergence evidence.',
      );
    }

    const commitments: Commitment[] = [];
    for (const cRef of req.commitments) {
      const c = this.#resolve<Commitment>(cRef);
      if (!c) return refusal('unknown_ref', [cRef], `${cRef.logical_id}: no such commitment.`);
      commitments.push(c);
    }
    commitments.sort((a, b) => cmp(a.logical_id, b.logical_id)); // stated presentation order — no priority claim (DEC-19)

    // ---- the tensor: SPEC-10 reused verbatim (refusals pass through first-class) ----
    const rr = await this.#robustness.robustness({
      plans: [req.plan],
      worlds: req.worlds,
      engine_version: req.engine_version,
    });
    if (isRefusal(rr)) return rr;
    const tensor = rr.tensor;

    const worldOf = new Map<string, CompiledWorld>();
    for (const [sid, wRef] of Object.entries(req.worlds)) {
      const w = this.#resolve<CompiledWorld>(wRef);
      if (!w) return refusal('unknown_ref', [wRef], `${wRef.logical_id}: no such world for scenario ${sid}.`);
      worldOf.set(sid, w);
    }
    const selectedWorld = worldOf.get(selected)!;

    // Comparability guard BEFORE derivation: an incomparable tensor cannot
    // honestly derive divergence — margin-class rows only, stated (note 12 §8).
    const coas = [...req.coas].filter((c) => tensor.scenarios.includes(c)).sort(cmp);
    const divergenceDerivable = tensor.stamps_compatible && coas.length >= 2;

    const questions = this.#resolveQuestions(req.questions);

    const rows: DecisionPointRow[] = [];
    const pid = req.plan.logical_id;

    for (const c of commitments) {
      const evidence: DpEvidence[] = [];

      // (i) scenario divergence — the row's own operative pairs (note 12 §2).
      if (divergenceDerivable) {
        for (let i = 0; i < coas.length; i++) {
          for (let j = i + 1; j < coas.length; j++) {
            const a = coas[i]!;
            const b = coas[j]!;
            const va = tensor.verdicts.get(`${pid}-${c.logical_id}-${a}`);
            const vb = tensor.verdicts.get(`${pid}-${c.logical_id}-${b}`);
            if (va && vb && va.verdict !== vb.verdict) {
              evidence.push({ kind: 'scenario_divergence', a, b, verdict_a: va.verdict, verdict_b: vb.verdict });
            }
          }
        }
      }
      const divergent = evidence.length > 0;

      // (ii) margin-class under the selected world.
      const vSel = tensor.verdicts.get(`${pid}-${c.logical_id}-${selected}`);
      if (vSel && (vSel.verdict === 'tight' || vSel.verdict === 'marginal')) {
        const m: DpEvidence = { kind: 'margin', scenario: selected, verdict: vSel.verdict };
        if (vSel.margin) m.margin = vSel.margin;
        evidence.push(m);
      }

      if (evidence.length === 0) continue; // not a decision point — nothing turns on open information

      const row = this.#deriveRow(c, plan, evidence, divergent, coas, worldOf, questions, selectedWorld);
      rows.push(row);
    }

    let statement: string | undefined;
    if (!divergenceDerivable && tensor.stamps_compatible === false) {
      statement =
        'scenario worlds have mixed stamp lineages — divergence evidence cannot be derived; margin-class rows only.';
    } else if (rows.length === 0) {
      statement = 'no verdict turns on open information — every commitment is scenario-stable and clear of the line.';
    }

    const stamp = await contentHash({
      analysis: 'decision-support',
      plan: { logical_id: pid, content_hash: req.plan.content_hash },
      worlds: Object.keys(req.worlds)
        .sort(cmp)
        .map((sid) => ({ scenario: sid, stamp: worldOf.get(sid)!.stamp })),
      selected,
      coas,
      commitments: commitments.map((c) => c.logical_id),
      questions: questions.map((q) => q.ref.logical_id).sort(cmp),
      lead: LEAD,
      engine_version: req.engine_version,
    });

    // ---- store the envelope and write cited_in edges to the evidence (G3) ----
    const envelope = {
      analysis: 'decision-support',
      plan: pid,
      selected,
      coas,
      lead: LEAD,
      stamp,
      rows: rows as unknown,
    };
    const envRef = await this.#store.put(envelope as Record<string, unknown>);
    const edged = new Set<string>();
    const edge = (fromHash: string): void => {
      if (!fromHash || edged.has(fromHash)) return;
      edged.add(fromHash);
      this.#trace.add(this.#edge(fromHash, envRef.content_hash, stamp));
    };
    for (const row of rows) {
      for (const ev of row.evidence) {
        if (ev.kind === 'scenario_divergence') {
          for (const sid of [ev.a, ev.b]) {
            const v = tensor.verdicts.get(`${pid}-${row.commitment}-${sid}`);
            if (v) edge((await this.#store.put(v as unknown as Record<string, unknown>)).content_hash);
          }
        } else {
          const v = tensor.verdicts.get(`${pid}-${row.commitment}-${ev.scenario}`);
          if (v) edge((await this.#store.put(v as unknown as Record<string, unknown>)).content_hash);
        }
      }
      for (const d of row.discriminators) edge(d.question.content_hash);
      for (const t of row.tripwires) edge(t.knowledge.content_hash);
    }

    return {
      rows,
      plan: pid,
      selected,
      coas,
      lead: LEAD,
      stamps_compatible: tensor.stamps_compatible,
      ...(statement ? { statement } : {}),
      stamp,
    };
  }

  /** One row: commit step (note 12 §3), LTIOV + in-time (§4), discriminators + tripwires (§5). */
  #deriveRow(
    c: Commitment,
    plan: Plan,
    evidence: DpEvidence[],
    divergent: boolean,
    coas: string[],
    worldOf: Map<string, CompiledWorld>,
    questions: { ref: Ref; ko: KnowledgeObject }[],
    selectedWorld: CompiledWorld,
  ): DecisionPointRow {
    const profile = metricProfile(c);

    let commit_kind: DecisionPointRow['commit_kind'] = 'none';
    let commit_detail = '';
    let commit_step: number | undefined;

    if (!divergent) {
      commit_detail =
        'margin-class — turns on the width of answered knowledge, not on scenario identity; see the sensitivity ranking (thesis E).';
    } else if (profile.kind === 'state') {
      commit_kind = 'world_decided';
      commit_step = this.#config.grid.horizon_steps;
      commit_detail = `world-decided — the plan takes no branch; the ${c.metric} read happens at the horizon (step ${commit_step}). Information is of value until then.`;
    } else if (profile.kind === 'reach' || profile.kind === 'exposure') {
      const ep = plan.elements.find((e) => e.force_element === profile.element);
      const legs = ep?.route ?? [];
      for (const leg of legs) {
        const reads = coas.map((sid) => channelAt(worldOf.get(sid)!, this.#config, profile.channel!, leg.x, leg.y, leg.enter_step));
        const keys = new Set(reads.map((b) => `${b.lo}|${b.hi}`));
        if (keys.size > 1) {
          commit_kind = 'route_leg';
          commit_step = leg.enter_step;
          commit_detail = `${profile.element} enters the leg at (${leg.x}, ${leg.y}) at step ${leg.enter_step} — the ${profile.channel} read differs across ${coas.join('/')} from there; the branch is taken.`;
          break;
        }
      }
      if (commit_kind === 'none') {
        // Defensive branch (note 12 §3): stated, never an invented step.
        commit_detail = 'commit step underivable — divergent verdicts with no divergent route read; stated, not improvised.';
      }
    } else {
      // fires: reads only the plan's own geometry — cannot scenario-diverge (note 12 §3).
      commit_detail = 'commit step underivable — a fires metric reads only the plan’s own geometry; stated, not improvised.';
    }

    const ltiov = commit_step === undefined ? undefined : commit_step - LEAD;

    // ---- discriminators (note 12 §5): the DP's own evidence pairs, classified ----
    const divergencePairs = evidence
      .filter((e): e is Extract<DpEvidence, { kind: 'scenario_divergence' }> => e.kind === 'scenario_divergence')
      .map((e) => ({ a: e.a, b: e.b }));

    const discriminators: DsmDiscriminator[] = [];
    for (const { ref, ko } of questions) {
      if (divergencePairs.length === 0) break; // margin-class only — no COA pair to separate
      const answerByCoa = new Map<string, Band>();
      for (const ea of ko.expected_answers ?? []) answerByCoa.set(ea.coa, ea.band);
      const pairs: DsmDiscriminator['pairs'] = [];
      for (const { a, b } of divergencePairs) {
        const bandA = answerByCoa.get(a);
        const bandB = answerByCoa.get(b);
        if (!bandA || !bandB) continue;
        pairs.push({ a, b, classification: classifySeparation(bandA, bandB), separation: computeSeparation(bandA, bandB) });
      }
      // Attach iff at least one evidence pair could be settled (non-nested — note 08 §7.2).
      if (pairs.some((p) => p.classification !== 'nested')) {
        const collection: DsmCollection[] = (ko.collection ?? []).map((co) => {
          const entry: DsmCollection = { method: co.method, cost: co.cost };
          if (co.earliest_result !== undefined) {
            entry.earliest_result = co.earliest_result;
            if (ltiov !== undefined) {
              // in_time / red — both with the arithmetic carried (note 12 §4).
              entry.in_time = co.earliest_result <= ltiov;
              if (entry.in_time) entry.slack = ltiov - co.earliest_result;
            }
            // ltiov undefined ⇒ in_time stays absent: nothing to evaluate against.
          }
          // earliest_result unstated ⇒ in_time absent: never assumed answerable.
          return entry;
        });
        discriminators.push({ question: ref, pairs, collection });
      }
    }
    // Order by best separation over could-discriminate pairs (v1 comparator), ties by logical_id.
    const best = (d: DsmDiscriminator): Band | undefined => {
      let b: Band | undefined;
      for (const p of d.pairs) {
        if (p.classification === 'nested') continue;
        if (!b || p.separation.lo > b.lo || (p.separation.lo === b.lo && p.separation.hi > b.hi)) b = p.separation;
      }
      return b;
    };
    discriminators.sort((x, y) => {
      const bx = best(x)!;
      const by = best(y)!;
      if (by.lo !== bx.lo) return by.lo - bx.lo;
      if (by.hi !== bx.hi) return by.hi - bx.hi;
      return cmp(x.question.logical_id, y.question.logical_id);
    });

    // The named intelligence gap (note 12 §5): divergent, and nothing can settle it.
    const gap =
      divergent && discriminators.length === 0
        ? `intelligence gap — no knowledge in the KB separates ${divergencePairs.map((p) => `${p.a}↔${p.b}`).join(', ')}; a collection requirement, not an empty cell.`
        : undefined;

    // ---- tripwires (note 12 §5): world-level scope, lapse before the commit step ----
    const tripwires: DsmTripwire[] = [];
    if (commit_step !== undefined) {
      for (const kRef of selectedWorld.consumed) {
        const ko = this.#store.get(kRef.content_hash) as KnowledgeObject | undefined;
        if (ko?.validity && ko.validity.valid_until < commit_step) {
          tripwires.push({ knowledge: { logical_id: kRef.logical_id, content_hash: kRef.content_hash }, valid_until: ko.validity.valid_until, commit_step });
        }
      }
      tripwires.sort((a, b) => cmp(a.knowledge.logical_id, b.knowledge.logical_id));
    }

    const row: DecisionPointRow = {
      commitment: c.logical_id,
      tier: c.tier,
      statement: c.statement,
      evidence,
      commit_kind,
      commit_detail,
      discriminators,
      tripwires,
    };
    if (commit_step !== undefined) row.commit_step = commit_step;
    if (ltiov !== undefined) row.ltiov = ltiov;
    if (gap) row.gap = gap;
    return row;
  }

  #resolveQuestions(refs?: Ref[]): { ref: Ref; ko: KnowledgeObject }[] {
    const results: { ref: Ref; ko: KnowledgeObject }[] = [];
    for (const ref of refs ?? []) {
      const resolved = this.#latestRef(ref);
      if (!resolved) continue;
      const ko = this.#store.get(resolved.content_hash) as KnowledgeObject | undefined;
      if (ko && ko.status === 'open' && ko.expected_answers && ko.expected_answers.length > 0) {
        results.push({ ref: resolved, ko });
      }
    }
    results.sort((a, b) => cmp(a.ref.logical_id, b.ref.logical_id));
    return results;
  }

  #latestRef(ref: Ref): Ref | undefined {
    if (ref.content_hash) return this.#store.exists(ref.content_hash) ? ref : undefined;
    const versions = this.#store.versions(ref.logical_id);
    return versions.length > 0 ? versions[versions.length - 1] : undefined;
  }

  #resolve<T>(ref: Ref): T | undefined {
    if (ref.content_hash) return this.#store.get(ref.content_hash) as T | undefined;
    const versions = this.#store.versions(ref.logical_id);
    const hash = versions.length > 0 ? versions[versions.length - 1]!.content_hash : undefined;
    return hash ? (this.#store.get(hash) as T) : undefined;
  }

  #edge(from: string, to: string, stamp: string): TraceEdge {
    return { from_hash: from, to_hash: to, edge_type: 'cited_in', stamp, written_by: this.#writtenBy };
  }
}

const cmp = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

const refusal = (reason: Refusal['reason'], offending: Ref[], explanation: string): Refusal => ({
  refused: true,
  reason,
  offending,
  explanation,
});
