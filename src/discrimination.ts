/**
 * SPEC-12 — discrimination analysis (seam §8, thesis D).
 *
 * COA-pair separation over open questions' expected-answer bands (DEC-18).
 * For each open question with `expected_answers`, measures how well the
 * answer bands separate each pair of COAs. Ranks by best-pair separation
 * descending. Collection cost is shown alongside, never collapsed with
 * value (DEC-19). No Shannon entropy, no VOI, no scenario weights
 * (research note 08-analysis.md §3).
 */
import type { Band, KnowledgeObject } from './generated/types.js';
import { ObjectStore, type Ref } from './store.js';
import { contentHash } from './canonical.js';
import type {
  CoaPairSeparation,
  DiscriminationEntry,
  DiscriminationRequest,
  DiscriminationResult,
  Refusal,
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

    const ranking: DiscriminationEntry[] = [];

    for (const { ref, ko } of questions) {
      if (!ko.expected_answers || ko.expected_answers.length === 0) continue;

      const answerByCoa = new Map<string, Band>();
      for (const ea of ko.expected_answers) {
        answerByCoa.set(ea.coa, ea.band);
      }

      const pairs: CoaPairSeparation[] = [];
      let bestSep: Band | undefined;

      for (let i = 0; i < req.coas.length; i++) {
        for (let j = i + 1; j < req.coas.length; j++) {
          const coaA = req.coas[i]!;
          const coaB = req.coas[j]!;
          const bandA = answerByCoa.get(coaA);
          const bandB = answerByCoa.get(coaB);
          if (!bandA || !bandB) continue;

          const separation = computeSeparation(bandA, bandB);
          pairs.push({ coa_a: coaA, coa_b: coaB, separation });

          if (!bestSep || separation.lo > bestSep.lo) {
            bestSep = separation;
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
        cost,
      });
    }

    ranking.sort((a, b) => {
      if (b.best_separation.lo !== a.best_separation.lo) return b.best_separation.lo - a.best_separation.lo;
      return b.best_separation.hi - a.best_separation.hi;
    });

    const stamp = await contentHash({
      questions: ranking.map((e) => e.question.logical_id).sort(),
      coas: [...req.coas].sort(),
      engine_version: req.engine_version,
      analysis: 'discrimination',
    });

    return { ranking, stamp };
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
      const seen = new Set<string>();
      for (let i = 0; i < this.#store.size; i++) {
        // Walk all lineages to find open questions
      }
      // Fallback: use explicit refs only — the store is hash-addressed and
      // does not support class-level iteration. Callers should provide refs.
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

function computeSeparation(a: Band, b: Band): Band {
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
