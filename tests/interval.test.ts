import { describe, expect, it } from 'vitest';
import type { Band } from '../src/generated/types.js';
import * as I from '../src/interval.js';

const B = (lo: number, hi: number, unit = 'step'): Band => ({ lo, hi, unit });

describe('interval arithmetic (research note 03 §1)', () => {
  it('adds closed intervals endpoint-wise', () => {
    expect(I.add(B(4, 6), B(3, 5))).toEqual(B(7, 11));
  });

  it('subtracts with the worst-case orientation [a.lo-b.hi, a.hi-b.lo]', () => {
    expect(I.sub(B(9, 13), B(3, 5))).toEqual(B(4, 10));
  });

  it('scales by a dimensionless scalar, flipping ends on a negative factor', () => {
    expect(I.scaleBy(B(2, 6), 3)).toEqual(B(6, 18));
    expect(I.scaleBy(B(2, 6), -1)).toEqual(B(-6, -2));
  });

  it('takes elementwise max/min', () => {
    expect(I.max(B(2, 6), B(3, 4))).toEqual(B(3, 6));
    expect(I.min(B(2, 6), B(3, 4))).toEqual(B(2, 4));
  });

  it('reproduces oracle O-1 exactly — start 2 + A[4,6] + B[3,5] = [9,13]', () => {
    const strait_open_step = I.add(I.scalar(2, 'step'), I.add(B(4, 6), B(3, 5)));
    expect(strait_open_step).toEqual(B(9, 13));
  });

  it('reproduces oracle O-4 widening — A[4,6]→[3,7] gives [8,14] ⊇ [9,13]', () => {
    const widened = I.add(I.scalar(2, 'step'), I.add(B(3, 7), B(3, 5)));
    expect(widened).toEqual(B(8, 14));
    expect(I.contains(widened, B(9, 13))).toBe(true);
  });

  it('rejects unit mismatch rather than coercing', () => {
    expect(() => I.add(B(1, 2, 'step'), B(1, 2, 'band-hours'))).toThrow(/unit mismatch/);
  });

  it('rejects a non-finite result (a severed route) rather than leaking Infinity', () => {
    expect(() => I.scalar(1 / 0, 'step')).toThrow(/non-finite/);
  });

  it('has no mean/mid/most-likely operation (DEC-15)', () => {
    const ops = Object.keys(I);
    for (const forbidden of ['mean', 'mid', 'midpoint', 'average', 'mostLikely', 'centre', 'center']) {
      expect(ops).not.toContain(forbidden);
    }
  });
});
