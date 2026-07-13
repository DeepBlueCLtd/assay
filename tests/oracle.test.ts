/**
 * SPEC-07 — the oracle cases (vignette §9), the independent correctness leg.
 * Expected values are HAND-COMPUTED constants, typed from the vignette, and are
 * NEVER regenerated from the scorer (an oracle regenerated from the code under
 * test is not an oracle — vignette §9 rule).
 */
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { Band, Comparator, VerdictBand } from '../src/generated/types.js';
import * as I from '../src/interval.js';
import { marginBand, verdictFor } from '../src/score.js';

const B = (lo: number, hi: number, unit = 'step'): Band => ({ lo, hi, unit });

// The shared oracle metric: strait_open_step = start + duration(A) + duration(B).
const straitOpenStep = (start: number, a: Band, b: Band): Band =>
  I.add(I.scalar(start, 'step'), I.add(a, b));

describe('Oracle O-1 — interval sum', () => {
  it('start 2 · A[4,6] · B[3,5] ⇒ [9,13] exactly', () => {
    expect(straitOpenStep(2, B(4, 6), B(3, 5))).toEqual(B(9, 13));
  });
});

describe('Oracle O-2 — verdict at a clear margin', () => {
  it('[9,13] vs at_most 28 ⇒ robust, margin [15,19]', () => {
    const value = B(9, 13);
    const margin = marginBand('at_most', 28, value);
    expect(margin).toEqual(B(15, 19));
    expect(verdictFor(margin)).toBe<VerdictBand>('robust');
  });
});

describe('Oracle O-3 — band-straddling threshold and the four-stop scale', () => {
  it('[9,13] vs at_most 12 ⇒ neither robust nor violated (tight)', () => {
    const v = verdictFor(marginBand('at_most', 12, B(9, 13)));
    expect(v).toBe<VerdictBand>('tight');
    expect(v).not.toBe('robust');
    expect(v).not.toBe('violated');
  });

  it('sweeping at_most T over 8→14, the verdict changes only at the band edges 9 and 13', () => {
    const value = B(9, 13); // band edges are lo=9 and hi=13
    const verdict = (t: number) => verdictFor(marginBand('at_most', t, value));
    const seq = [8, 9, 10, 11, 12, 13, 14].map(verdict);
    expect(seq).toEqual<VerdictBand[]>([
      'violated', // T=8   — below the band: best case fails
      'tight', //    T=9   — lower band edge (m_hi crosses 0)
      'tight', //    T=10  ┐
      'tight', //    T=11  ├ strictly inside the band: constant
      'tight', //    T=12  ┘
      'marginal', // T=13  — upper band edge (m_lo crosses 0): the boundary verdict
      'robust', //   T=14  — above the band: worst case satisfies with room
    ]);
    // The continuous breakpoints are the band edges 9 and 13, and NOTHING changes
    // strictly inside the band — the honesty O-3 pins (marginal is the boundary
    // value AT the upper edge, not an interior transition).
    expect(verdict(10)).toBe(verdict(11));
    expect(verdict(11)).toBe(verdict(12));
    for (let t = 9; t <= 13; t++) {
      const v = verdict(t);
      expect(v).not.toBe('robust'); // the band spans the threshold: never "definitely fine"
      expect(v).not.toBe('violated'); // and never "definitely failed"
    }
    expect(verdict(8)).toBe<VerdictBand>('violated'); // decisive only strictly below the band
    expect(verdict(14)).toBe<VerdictBand>('robust'); // decisive only strictly above it
  });
});

describe('Oracle O-4 — containment under widening (candidate G6)', () => {
  it('re-running O-1 with A widened [4,6]→[3,7] ⇒ [8,14] ⊇ [9,13]', () => {
    const wide = straitOpenStep(2, B(3, 7), B(3, 5));
    expect(wide).toEqual(B(8, 14));
    expect(I.contains(wide, straitOpenStep(2, B(4, 6), B(3, 5)))).toBe(true);
  });

  const anyBand = (unit: string) =>
    fc
      .tuple(fc.integer({ min: -50, max: 50 }), fc.integer({ min: 0, max: 40 }))
      .map(([lo, span]) => B(lo, lo + span, unit));

  it('property: widening any input never narrows the output, and every point-realisation is contained', () => {
    fc.assert(
      fc.property(anyBand('step'), anyBand('step'), fc.integer({ min: 0, max: 20 }), fc.integer({ min: 0, max: 20 }), (a, b, growLo, growHi) => {
        const start = 2;
        const base = straitOpenStep(start, a, b);
        const aWide = B(a.lo - growLo, a.hi + growHi);
        const wide = straitOpenStep(start, aWide, b);
        // (1) inclusion monotonicity
        expect(I.contains(wide, base)).toBe(true);
        // (2) soundness: any point in the inputs scores inside the output band
        for (const pa of [a.lo, a.hi, Math.floor((a.lo + a.hi) / 2)]) {
          for (const pb of [b.lo, b.hi]) {
            expect(I.member(base, start + pa + pb)).toBe(true);
          }
        }
      }),
      { numRuns: 300 },
    );
  });

  it('property: widening moves a verdict TOWARD uncertainty (tight), never away from it', () => {
    // Honest direction: more input uncertainty never buys a more DECISIVE verdict.
    // `tight` is maximal uncertainty; robust and violated are equally decisive (of
    // opposite outcomes), marginal is one step in. Widening moves m_lo down and m_hi
    // up, so the verdict can only slide toward tight from either end — decisiveness
    // (distance from tight) is non-increasing, and robust never flips to violated.
    const decisiveness: Record<VerdictBand, number> = { tight: 0, marginal: 1, robust: 2, violated: 2 };
    const comparators: Comparator[] = ['at_most', 'at_least', 'by_step', 'never'];
    fc.assert(
      fc.property(anyBand('step'), fc.integer({ min: -60, max: 60 }), fc.constantFrom(...comparators), fc.integer({ min: 0, max: 15 }), fc.integer({ min: 0, max: 15 }), (v, threshold, comparator, growLo, growHi) => {
        const base = verdictFor(marginBand(comparator, threshold, v));
        const wide = verdictFor(marginBand(comparator, threshold, B(v.lo - growLo, v.hi + growHi)));
        expect(decisiveness[wide]).toBeLessThanOrEqual(decisiveness[base]);
        // widening can never flip a satisfied verdict into a violated one, or vice versa
        if (base === 'robust') expect(wide).not.toBe('violated');
        if (base === 'violated') expect(wide).not.toBe('robust');
      }),
      { numRuns: 300 },
    );
  });
});
