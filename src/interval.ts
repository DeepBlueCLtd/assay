/**
 * SPEC-07 — interval arithmetic (research note `03-score-plan.md` §1).
 *
 * Metric propagation is classical interval arithmetic on pure closed bands
 * (Moore, *Interval Analysis*, 1966), and nothing more. Each operator is the
 * textbook closed-interval rule, is inclusion-monotone (a wider input yields a
 * superset output) and sound (contains every real combination) — which is
 * exactly the propagation-honesty property G6/oracle O-4 by construction.
 *
 * The honesty content of DEC-15 lives here: a Band is a pure interval with NO
 * midpoint, so this module offers no mean/mid/most-likely operation. A scorer
 * that collapsed [4,6] to 5 to "simplify" would pass no oracle. Units are
 * checked on every combining operator; a non-finite result (a severed route's
 * 1/0) is rejected here rather than leaked into a band or a canonical-JSON throw.
 */
import type { Band } from './generated/types.js';

const finite = (n: number, where: string): number => {
  if (!Number.isFinite(n)) {
    throw new Error(`interval: non-finite value from ${where} — a severed route or bad fixture, surface it (research note §2)`);
  }
  return n;
};

const sameUnit = (a: Band, b: Band, op: string): string => {
  if (a.unit !== b.unit) {
    throw new Error(`interval.${op}: unit mismatch '${a.unit}' vs '${b.unit}' — config/fixture defect, never coerced`);
  }
  return a.unit;
};

/** A degenerate point interval — a scalar as a band (a plan/threshold fact). */
export function scalar(n: number, unit: string): Band {
  return { lo: finite(n, 'scalar'), hi: finite(n, 'scalar'), unit };
}

/** [a.lo+b.lo, a.hi+b.hi]. */
export function add(a: Band, b: Band): Band {
  const unit = sameUnit(a, b, 'add');
  return { lo: finite(a.lo + b.lo, 'add'), hi: finite(a.hi + b.hi, 'add'), unit };
}

/** [a.lo-b.hi, a.hi-b.lo] — the worst case subtracts the largest of b. */
export function sub(a: Band, b: Band): Band {
  const unit = sameUnit(a, b, 'sub');
  return { lo: finite(a.lo - b.hi, 'sub'), hi: finite(a.hi - b.lo, 'sub'), unit };
}

/** Multiply by a dimensionless scalar; unit unchanged. Negative k flips the ends. */
export function scaleBy(a: Band, k: number): Band {
  finite(k, 'scaleBy');
  const p = a.lo * k;
  const q = a.hi * k;
  return { lo: finite(Math.min(p, q), 'scaleBy'), hi: finite(Math.max(p, q), 'scaleBy'), unit: a.unit };
}

/** Elementwise interval max: [max(lo), max(hi)]. */
export function max(a: Band, b: Band): Band {
  const unit = sameUnit(a, b, 'max');
  return { lo: Math.max(a.lo, b.lo), hi: Math.max(a.hi, b.hi), unit };
}

/** Elementwise interval min: [min(lo), min(hi)]. */
export function min(a: Band, b: Band): Band {
  const unit = sameUnit(a, b, 'min');
  return { lo: Math.min(a.lo, b.lo), hi: Math.min(a.hi, b.hi), unit };
}

/** Sum of a list; the empty sum is the zero band in `unit`. */
export function sum(bands: Band[], unit: string): Band {
  return bands.reduce((acc, b) => add(acc, b), scalar(0, unit));
}

/** Does `outer` contain `inner`? (O-4 containment.) Units must match. */
export function contains(outer: Band, inner: Band): boolean {
  sameUnit(outer, inner, 'contains');
  return outer.lo <= inner.lo && inner.hi <= outer.hi;
}

/** Interval width hi-lo (≥ 0 for a well-formed band). */
export function width(a: Band): number {
  return a.hi - a.lo;
}

/** Is a scalar point inside the band? (O-4 point-realisation soundness.) */
export function member(a: Band, point: number): boolean {
  return a.lo <= point && point <= a.hi;
}
