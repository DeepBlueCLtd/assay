/**
 * SPEC-12 — discrimination analysis (seam §8, thesis D).
 *
 * COA-pair separation over open questions' expected-answer bands (DEC-18).
 * For each open question with `expected_answers`, measures how well the
 * answer bands separate each pair of COAs. Collection cost is shown
 * alongside, never collapsed with value (DEC-19). No Shannon entropy, no
 * VOI, no scenario weights (research note 08-analysis.md §3).
 *
 * SPEC-23 (v2, note 08 §7): the ranking is conditioned on the OPERATIVE
 * pairs — the scenario pairs the current plan-set's verdicts actually turn
 * on, derived from the SPEC-10 tensor (verdict divergence only: no curation,
 * no likelihood — K14 never enters, FR-007). Each pair carries a three-way
 * classification (disjoint / partial / nested), additive over the v1
 * numbers: `computeSeparation` is untouched and every v1 separation is
 * byte-identical. Degenerate states return stated fallbacks, never a
 * fabricated pair (FR-006).
 */
import type { Band, KnowledgeObject } from './generated/types.js';
import { ObjectStore, type Ref } from './store.js';
import { contentHash } from './canonical.js';
import type {
  CoaPairSeparation,
  DiscriminationEntry,
  DiscriminationRequest,
  DiscriminationResult,
  DiscriminationSuccess,
  OperativePair,
  OperativePairEvidence,
  OperativePairs,
  Refusal,
  ScenarioVerdictTensor,
  SeparationClass,
} from './seam.js';

export class DiscriminationService {
  #store: ObjectStore;

  constructor(opts: { store: ObjectStore }) {
    this.#store = opts.store;
  }

  async analyse(req: DiscriminationRequest): Promise<DiscriminationResult> {
    const questions = this.#resolveQuestions(req.questions);
    if (questions.length === 0) {
      return refusal('unknown_ref', req.questions ?? [], 'No open questions with expected_answers found.');
    }

    if (req.coas.length < 2) {
      return refusal('unknown_ref', [], 'Discrimination requires at least two COAs.');
    }

    // ---- SPEC-23: condition on the operative pairs (note 08 §7.1) ----
    // The comparability guard runs BEFORE derivation: an incomparable tensor
    // greys, it never silently conditions the ranking.
    let mode: DiscriminationSuccess['mode'] = 'all_pairs';
    let statement: string | undefined;
    let operative: OperativePairs | undefined;

    if (!req.tensor) {
      statement = 'no live decision — showing all-pairs separation.';
    } else if (!req.tensor.stamps_compatible) {
      statement =
        'scenario worlds have mixed stamp lineages — the tensor cannot condition the ranking; showing all-pairs separation.';
    } else {
      const live = req.tensor.scenarios.filter((s) => req.coas.includes(s));
      if (live.length < 2) {
        // Nothing to discriminate at all — say so instead of ranking noise.
        const stamp = await this.#stamp(req, 'degenerate', undefined, []);
        return {
          ranking: [],
          mode: 'degenerate',
          statement: 'one scenario live — nothing to discriminate.',
          stamp,
        };
      }
      operative = await deriveOperativePairs(req.tensor, req.coas);
      if (operative.pairs.length === 0) {
        operative = undefined;
        statement =
          "no live decision turns on scenario identity — the current plans' verdicts do not diverge across any scenario pair; showing all-pairs separation.";
      } else {
        mode = 'operative';
        const allLivePairs = (live.length * (live.length - 1)) / 2;
        if (operative.pairs.length === allLivePairs) {
          statement = 'every pair operative — the operative ranking coincides with all-pairs separation.';
        }
      }
    }

    const operativeKeys = new Set(operative?.pairs.map((p) => pairKey(p.a, p.b)) ?? []);

    const ranking: DiscriminationEntry[] = [];

    for (const { ref, ko } of questions) {
      if (!ko.expected_answers || ko.expected_answers.length === 0) continue;

      const answerByCoa = new Map<string, Band>();
      for (const ea of ko.expected_answers) {
        answerByCoa.set(ea.coa, ea.band);
      }

      const pairs: CoaPairSeparation[] = [];
      let bestSep: Band | undefined;
      let operativeBest: Band | undefined;

      for (let i = 0; i < req.coas.length; i++) {
        for (let j = i + 1; j < req.coas.length; j++) {
          const coaA = req.coas[i]!;
          const coaB = req.coas[j]!;
          const bandA = answerByCoa.get(coaA);
          const bandB = answerByCoa.get(coaB);
          if (!bandA || !bandB) continue;

          const separation = computeSeparation(bandA, bandB);
          const classification = classifySeparation(bandA, bandB);
          const isOperative = operativeKeys.has(pairKey(coaA, coaB));
          pairs.push({
            coa_a: coaA,
            coa_b: coaB,
            separation,
            classification,
            ...(mode === 'operative' ? { operative: isOperative } : {}),
          });

          if (!bestSep || separation.lo > bestSep.lo) {
            bestSep = separation;
          }
          // Nested pairs are excluded from could-discriminate emphasis even
          // when operative: no observation can settle them in the inner
          // COA's favour (note 08 §7.2).
          if (isOperative && classification !== 'nested') {
            if (!operativeBest || separation.lo > operativeBest.lo) {
              operativeBest = separation;
            }
          }
        }
      }

      if (pairs.length === 0) continue;

      const cost = ko.collection && ko.collection.length > 0
        ? ko.collection[0]!.cost
        : { lo: 0, hi: 0, unit: 'unknown' };

      ranking.push({
        question: ref,
        pairs,
        best_separation: bestSep!,
        ...(operativeBest ? { operative_best: operativeBest } : {}),
        cost,
        expected_answers: ko.expected_answers,
      });
    }

    if (mode === 'operative') {
      // Operative-led sort (note 08 §7.1): could-discriminate operative
      // separation first; entries without one sort after, by all-pairs best;
      // residual ties by could-discriminate operative-pair count, then
      // logical_id — stated, content-neutral, deterministic (G1).
      const couldCount = (e: DiscriminationEntry): number =>
        e.pairs.filter((p) => p.operative && p.classification !== 'nested').length;
      ranking.sort((a, b) => {
        if (a.operative_best && b.operative_best) {
          if (b.operative_best.lo !== a.operative_best.lo) return b.operative_best.lo - a.operative_best.lo;
          if (b.operative_best.hi !== a.operative_best.hi) return b.operative_best.hi - a.operative_best.hi;
        } else if (a.operative_best) {
          return -1;
        } else if (b.operative_best) {
          return 1;
        }
        if (b.best_separation.lo !== a.best_separation.lo) return b.best_separation.lo - a.best_separation.lo;
        if (b.best_separation.hi !== a.best_separation.hi) return b.best_separation.hi - a.best_separation.hi;
        if (couldCount(b) !== couldCount(a)) return couldCount(b) - couldCount(a);
        return a.question.logical_id < b.question.logical_id ? -1 : a.question.logical_id > b.question.logical_id ? 1 : 0;
      });
    } else {
      // v1 sort, unchanged (SPEC-12).
      ranking.sort((a, b) => {
        if (b.best_separation.lo !== a.best_separation.lo) return b.best_separation.lo - a.best_separation.lo;
        return b.best_separation.hi - a.best_separation.hi;
      });
    }

    const stamp = await this.#stamp(req, mode, operative, ranking);

    return {
      ranking,
      mode,
      ...(operative ? { operative } : {}),
      ...(statement ? { statement } : {}),
      stamp,
    };
  }

  async #stamp(
    req: DiscriminationRequest,
    mode: DiscriminationSuccess['mode'],
    operative: OperativePairs | undefined,
    ranking: DiscriminationEntry[],
  ): Promise<string> {
    return contentHash({
      questions: ranking.map((e) => e.question.logical_id).sort(),
      coas: [...req.coas].sort(),
      engine_version: req.engine_version,
      analysis: 'discrimination',
      mode,
      // Absent slots are omitted, never null (knowledge model §2).
      ...(operative ? { operative_stamp: operative.stamp } : {}),
    });
  }

  #resolveQuestions(refs?: Ref[]): { ref: Ref; ko: KnowledgeObject }[] {
    const results: { ref: Ref; ko: KnowledgeObject }[] = [];
    if (refs && refs.length > 0) {
      for (const ref of refs) {
        const ko = this.#resolve<KnowledgeObject>(ref);
        if (ko && ko.status === 'open' && ko.expected_answers && ko.expected_answers.length > 0) {
          results.push({ ref, ko });
        }
      }
    } else {
      // The store is hash-addressed and does not support class-level
      // iteration. Callers should provide refs.
    }
    return results;
  }

  #resolve<T = unknown>(ref: Ref): T | undefined {
    if (ref.content_hash) return this.#store.get(ref.content_hash) as T | undefined;
    const versions = this.#store.versions(ref.logical_id);
    const hash = versions.length > 0 ? versions[versions.length - 1]!.content_hash : undefined;
    return hash ? (this.#store.get(hash) as T) : undefined;
  }
}

/**
 * SPEC-23 — the operative-pair derivation (note 08 §7.1). A scenario pair is
 * operative iff some plan×commitment in the tensor has differing verdicts
 * across it. A pure function of the tensor restricted to the requested COA
 * vocabulary (a divergence against a non-COA world such as BASE is real
 * evidence about the plan, but no expected_answers row exists for it by
 * construction, so it can never rank a question). Verdicts only: no
 * curation, no likelihood input.
 */
export async function deriveOperativePairs(
  tensor: ScenarioVerdictTensor,
  coas: string[],
): Promise<OperativePairs> {
  const live = tensor.scenarios.filter((s) => coas.includes(s));
  const pairs: OperativePair[] = [];
  for (let i = 0; i < live.length; i++) {
    for (let j = i + 1; j < live.length; j++) {
      const a = live[i]!;
      const b = live[j]!;
      const evidence: OperativePairEvidence[] = [];
      for (const plan of tensor.plans) {
        for (const commitment of tensor.commitments) {
          const va = tensor.verdicts.get(`${plan}-${commitment}-${a}`);
          const vb = tensor.verdicts.get(`${plan}-${commitment}-${b}`);
          if (va && vb && va.verdict !== vb.verdict) {
            evidence.push({ plan, commitment, verdict_a: va.verdict, verdict_b: vb.verdict });
          }
        }
      }
      if (evidence.length > 0) pairs.push({ a, b, evidence });
    }
  }
  const stamp = await contentHash({
    analysis: 'operative-pairs',
    pairs: pairs.map((p) => ({
      a: p.a,
      b: p.b,
      evidence: p.evidence.map((e) => `${e.plan}-${e.commitment}:${e.verdict_a}/${e.verdict_b}`),
    })),
  });
  return { pairs, stamp };
}

/**
 * SPEC-23 — the three-way classification (note 08 §7.2). A geometric
 * predicate over closed bands (DEC-15 — no interior, no distribution):
 * disjoint = any observation in either band settles the pair; partial =
 * each COA keeps an exclusive region, a lucky observation settles it either
 * way (bands touching at exactly one endpoint classify here — the shared
 * region is the single touching value); nested = the inner COA has no
 * exclusive region, so no observation can ever single it out (containment
 * sharing an endpoint, and identical bands, classify here). Additive over
 * the v1 numbers — never a rescore.
 */
export function classifySeparation(a: Band, b: Band): SeparationClass {
  if (a.hi < b.lo || b.hi < a.lo) return 'disjoint';
  const aInB = b.lo <= a.lo && a.hi <= b.hi;
  const bInA = a.lo <= b.lo && b.hi <= a.hi;
  if (aInB || bInA) return 'nested';
  return 'partial';
}

const pairKey = (a: string, b: string): string => (a < b ? `${a}|${b}` : `${b}|${a}`);

/** Exported for SPEC-24's per-row discriminator attachment (note 12 §5) — semantics untouched. */
export function computeSeparation(a: Band, b: Band): Band {
  if (a.hi < b.lo) {
    return { lo: b.lo - a.hi, hi: b.lo - a.hi, unit: a.unit };
  }
  if (b.hi < a.lo) {
    return { lo: a.lo - b.hi, hi: a.lo - b.hi, unit: a.unit };
  }
  const overlapLo = Math.max(a.lo, b.lo);
  const overlapHi = Math.min(a.hi, b.hi);
  const overlapWidth = overlapHi - overlapLo;
  return { lo: -overlapWidth, hi: -overlapWidth, unit: a.unit };
}

const refusal = (reason: Refusal['reason'], offending: Ref[], explanation: string): Refusal => ({
  refused: true,
  reason,
  offending,
  explanation,
});
