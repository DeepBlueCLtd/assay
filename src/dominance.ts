/**
 * SPEC-08 — banded ε-non-domination, the handful's organiser (research note
 * `03-score-plan.md` §5).
 *
 * Two plans are DISTINCT in banded space when neither ε-dominates the other
 * across the criteria vector of banded scores. The criteria are the scorer's
 * per-commitment MARGIN bands (satisfied ⟺ margin ≥ 0 — SPEC-07's signed margin
 * gives one uniform "higher is better" order across every comparator), so the
 * organiser needs no per-criterion orientation table.
 *
 * The order is the CONSERVATIVE interval order (note §5): `A ⪯ B` iff
 * `A.hi ≤ B.lo` (A entirely at/below B). For maximisation this reads:
 *   - A is NO WORSE than B on a criterion  ⟺  B is not entirely above A  ⟺  B.lo ≤ A.hi
 *   - A is STRICTLY BETTER than B by ε      ⟺  A is separated above B      ⟺  A.lo > B.hi + ε
 * and `A ε-dominates B` iff A is no worse on EVERY criterion and strictly better
 * on AT LEAST ONE. Bands that overlap are honestly incomparable and BOTH survive
 * — that is DEC-15 in the organiser: overlap means indistinguishable, so keep both.
 * No scalar total, no weighted sum, no midpoint ever decides membership (DEC-19).
 *
 * ε is the organiser's distinctness knob and defaults to 0 (scale-free — the
 * criteria carry incommensurate units, so no absolute ε is honest). Increasing ε
 * only ever KEEPS MORE plans (fewer dominations), never fewer.
 */
import type { Band } from './generated/types.js';

/** One criterion of a plan's vector: a margin band, or `null` for a `violated`
 *  verdict (an unreachable objective — conservatively the worst possible here). */
export type Criterion = Band | null;
export type CriteriaVector = Criterion[];

/**
 * A is NO WORSE than B on this criterion (maximisation): B is not conservatively
 * above A. `null` (violated) is the worst value: any finite margin is above it.
 */
export function noWorse(a: Criterion, b: Criterion): boolean {
  if (a === null) return b === null; // worst is no-worse only than the worst
  if (b === null) return true; // a finite margin is at least as good as unreachable
  return b.lo <= a.hi; // B does not sit entirely above A
}

/**
 * A is STRICTLY BETTER than B on this criterion, by more than ε: A is separated
 * conservatively above B. A finite margin strictly beats `violated`; equal or
 * overlapping bands are NOT strictly better (no honest interior point — DEC-15).
 */
export function strictlyBetter(a: Criterion, b: Criterion, eps = 0): boolean {
  if (a === null) return false; // the worst is never strictly better
  if (b === null) return true; // reachable strictly beats unreachable
  return a.lo > b.hi + eps; // A entirely above B by more than ε
}

/**
 * A ε-dominates B: no worse on every criterion, strictly better on at least one.
 * Irreflexive (a vector never dominates itself — no criterion is strictly above
 * itself) and asymmetric (the strict criterion that lets A beat B forbids B beating A).
 * Vectors must be the same length and aligned to the same criterion order.
 */
export function dominates(a: CriteriaVector, b: CriteriaVector, eps = 0): boolean {
  if (a.length !== b.length) {
    throw new Error(`dominance: criteria vectors of differing length (${a.length} vs ${b.length}) — misaligned commitment order`);
  }
  let strictSomewhere = false;
  for (let i = 0; i < a.length; i++) {
    if (!noWorse(a[i]!, b[i]!)) return false; // worse on some criterion ⇒ no domination
    if (strictlyBetter(a[i]!, b[i]!, eps)) strictSomewhere = true;
  }
  return strictSomewhere;
}

/** Two plans are DISTINCT iff neither ε-dominates the other (research note §5). */
export function distinct(a: CriteriaVector, b: CriteriaVector, eps = 0): boolean {
  return !dominates(a, b, eps) && !dominates(b, a, eps);
}

/**
 * Indices of the ε-non-dominated vectors — those no other vector ε-dominates.
 * This is the honest frontier; it is never padded and never trimmed by a scalar.
 * Monotone in ε: a larger ε yields a superset (fewer dominations).
 */
export function nonDominated(vectors: CriteriaVector[], eps = 0): number[] {
  const keep: number[] = [];
  for (let i = 0; i < vectors.length; i++) {
    const dominated = vectors.some((other, j) => j !== i && dominates(other, vectors[i]!, eps));
    if (!dominated) keep.push(i);
  }
  return keep;
}
