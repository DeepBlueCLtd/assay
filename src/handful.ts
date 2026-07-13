/**
 * SPEC-08 — the handful service (seam contract §6; delivery plan §δ, the last
 * unit of the spine).
 *
 *   POST /plan/handful  {world, seed, count?}
 *      → {plans: Ref[], scores: PlanScore[], organisation: {distinct_because}, stamp}
 *
 * Three honest steps and nothing more:
 *   1. GENERATE — a seeded, strategy-biased fan-out over the vignette's four axes
 *      (`src/generate.ts`), 16 candidate `Plan`s. The generator cherry-picks
 *      nothing; it hands every candidate forward.
 *   2. SCORE — each candidate through the SPEC-07 scorer (`ScoreService`, REUSED,
 *      never re-implemented). The criteria vector is the per-commitment MARGIN
 *      band (satisfied ⟺ margin ≥ 0 — one uniform "higher is better" order).
 *   3. ORGANISE — banded ε-non-domination (`src/dominance.ts`) keeps the plans no
 *      other conservatively beats on every commitment; a diversity cap trims to
 *      `count` by axis spread, NEVER by a scalar score (that would smuggle a
 *      weighting past DEC-19). `distinct_because` is derived from the survivors.
 *
 * Deterministic over `(world stamp, seed, count, engine)`: same inputs ⇒
 * byte-identical stamp and identical ordered plans/scores/organisation (G1). It
 * runs no `knowledge_overrides` perturbation (that stays scorer-only, seam §6)
 * and calls no `/relax` (the commitment set stays whole — relaxation is SPEC-09).
 */
import type { Commitment, CompiledWorld, PlanScore } from './generated/types.js';
import { ObjectStore, type Ref } from './store.js';
import { contentHash } from './canonical.js';
import { ScoreService } from './score.js';
import { isRefusal, type HandfulRequest, type HandfulResult, type Refusal } from './seam.js';
import { allSignatures, planFor, type AxisSignature } from './generate.js';
import { type Criterion, type CriteriaVector, nonDominated, noWorse, strictlyBetter } from './dominance.js';
import type { VignetteConfig } from './generated/types.js';

const COUNT_MIN = 3;
const COUNT_MAX = 5;
const DEFAULT_SCENARIO = 'BASE';

/** One axis word per axis, for `distinct_because` (matches generate.ts phrasing). */
const AXIS_PHRASE: Record<string, string> = {
  strait_early: 'strait-early', sweep_first: 'sweep-first',
  fires_forward: 'fires-forward', stand_off: 'stand-off',
  contest: 'contest', bypass: 'bypass',
  pull_early: 'pull-early', mission_tail: 'mission-tail',
};

interface Candidate {
  sig: AxisSignature;
  planRef: Ref;
  vector: CriteriaVector; // per-commitment margin band (or null = violated)
  scores: PlanScore[];
}

export class HandfulService {
  #store: ObjectStore;
  #scorer: ScoreService;
  #config: VignetteConfig;
  #commitmentIds: string[]; // canonical criterion order (by logical_id)

  constructor(opts: {
    store: ObjectStore;
    scorer: ScoreService;
    config: VignetteConfig;
    commitments: Commitment[];
  }) {
    this.#store = opts.store;
    this.#scorer = opts.scorer;
    this.#config = opts.config;
    this.#commitmentIds = [...opts.commitments].map((c) => c.logical_id).sort(cmp);
  }

  /** POST /plan/handful — pure over its stamped inputs; refuses first-class. */
  async handful(req: HandfulRequest): Promise<HandfulResult> {
    const world = this.#resolveWorld(req.world);
    if (!world) {
      return refusal('unknown_ref', [req.world], `${req.world.logical_id}: no such world to plan against.`);
    }
    const count = clamp(req.count ?? COUNT_MAX, COUNT_MIN, COUNT_MAX);
    const scenario = world.scenario ?? DEFAULT_SCENARIO;

    // 1–2. Generate the fan-out, then score every candidate (store first so the
    //      scorer can resolve each plan ref; storage is content-addressed/idempotent).
    //      The signature travels WITH each plan — no id round-trip.
    const candidates: Candidate[] = [];
    for (const sig of allSignatures()) {
      const plan = planFor(sig, req.seed);
      const planRef = await this.#store.put(plan as unknown as Record<string, unknown>);
      const scored = await this.#scorer.score({
        plan: planRef,
        world: req.world,
        scenario,
        engine_version: req.engine_version,
      });
      if (isRefusal(scored)) return scored; // a world that refuses scoring refuses the handful
      const byCommitment = new Map(scored.verdicts.map((v) => [v.commitment, v]));
      const vector: CriteriaVector = this.#commitmentIds.map(
        (id) => (byCommitment.get(id)?.margin ?? null) as Criterion,
      );
      candidates.push({ sig, planRef, vector, scores: scored.scores });
    }

    // 3. Organise: the ε-non-dominated frontier (ε = 0, scale-free), then a
    //    deterministic diversity cap to `count`.
    const frontier = nonDominated(candidates.map((c) => c.vector)).map((i) => candidates[i]!);
    const selected = this.#cap(frontier, count, req.seed);

    // Derive `distinct_because` from the survivors: the commitments each leads on
    // (strictly better than every OTHER survivor) plus its axis signature.
    const distinct_because = selected.map((c) => this.#reason(c, selected));

    // Deterministic stamp over inputs only (never over materialised cells — G1).
    const stamp = await contentHash({
      world: world.stamp,
      seed: req.seed,
      count,
      engine_version: req.engine_version,
    });

    return {
      plans: selected.map((c) => c.planRef),
      scores: selected.flatMap((c) => c.scores),
      organisation: { distinct_because },
      stamp,
    };
  }

  #resolveWorld(ref: Ref): CompiledWorld | undefined {
    if (ref.content_hash) return this.#store.get(ref.content_hash) as CompiledWorld | undefined;
    const versions = this.#store.versions(ref.logical_id);
    const hash = versions.length > 0 ? versions[versions.length - 1]!.content_hash : undefined;
    return hash ? (this.#store.get(hash) as CompiledWorld) : undefined;
  }

  /**
   * Cap the frontier to `count` by axis DIVERSITY (never a scalar). Greedy: seed
   * the pick order deterministically, take the first, then repeatedly add the
   * candidate whose signature is farthest (max Hamming distance over the four
   * axes) from those already chosen; ties break on the seed key. When the frontier
   * already fits, return it in the deterministic seed order (no padding).
   */
  #cap(frontier: Candidate[], count: number, seed: number): Candidate[] {
    const ordered = [...frontier].sort(
      (a, b) => seedKey(seed, a.planRef.logical_id) - seedKey(seed, b.planRef.logical_id)
        || cmp(a.planRef.logical_id, b.planRef.logical_id),
    );
    if (ordered.length <= count) return ordered;
    const chosen: Candidate[] = [ordered[0]!];
    while (chosen.length < count) {
      let best: Candidate | undefined;
      let bestDist = -1;
      for (const cand of ordered) {
        if (chosen.includes(cand)) continue;
        const dist = Math.min(...chosen.map((c) => hamming(c.sig, cand.sig)));
        if (dist > bestDist) {
          bestDist = dist;
          best = cand;
        }
      }
      chosen.push(best!);
    }
    // Present the chosen set in the same deterministic seed order.
    return ordered.filter((c) => chosen.includes(c));
  }

  /**
   * Why the organiser kept this plan: the commitments it LEADS on (at least as
   * good as every other survivor and strictly better than at least one) plus its
   * axis signature. Derived from the frontier — never a hand-authored caption.
   */
  #reason(c: Candidate, handful: Candidate[]): string {
    const others = handful.filter((o) => o !== c);
    const leads = this.#commitmentIds.filter((_, i) => {
      const a = c.vector[i]!;
      const noOneBeatsMe = others.every((o) => noWorse(a, o.vector[i]!));
      const iBeatSomeone = others.some((o) => strictlyBetter(a, o.vector[i]!));
      return noOneBeatsMe && iBeatSomeone;
    });
    const axes = signatureWords(c.sig).join(' · ');
    if (leads.length > 0) {
      return `${axes} — leads the handful on ${leads.join(', ')}; non-dominated (no plan beats it on every commitment).`;
    }
    return `${axes} — a distinct trade-off; non-dominated (no plan beats it on every commitment).`;
  }
}

// ————— helpers —————

const cmp = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);
const clamp = (n: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, Math.round(n)));

const signatureWords = (s: AxisSignature): string[] => [
  AXIS_PHRASE[s.approach]!, AXIS_PHRASE[s.suppression]!, AXIS_PHRASE[s.causeway]!, AXIS_PHRASE[s.extraction]!,
];

/** Axis Hamming distance: how many of the four axes two signatures differ on. */
function hamming(a: AxisSignature, b: AxisSignature): number {
  return (a.approach !== b.approach ? 1 : 0)
    + (a.suppression !== b.suppression ? 1 : 0)
    + (a.causeway !== b.causeway ? 1 : 0)
    + (a.extraction !== b.extraction ? 1 : 0);
}

/** Deterministic seed-keyed order (FNV-1a over `${seed}:${id}`) — no PRNG, no clock. */
function seedKey(seed: number, id: string): number {
  let h = 0x811c9dc5;
  const s = `${seed}:${id}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

const refusal = (reason: Refusal['reason'], offending: Ref[], explanation: string): Refusal => ({
  refused: true,
  reason,
  offending,
  explanation,
});
