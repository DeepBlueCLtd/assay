import { describe, expect, it } from 'vitest';
import type { Band } from '../src/generated/types.js';
import {
  type CriteriaVector,
  distinct,
  dominates,
  nonDominated,
  noWorse,
  strictlyBetter,
} from '../src/dominance.js';

// Margin bands are a maximisation criterion (satisfied ⟺ margin ≥ 0), so higher
// is better. Unit is irrelevant to the order (same criterion index ⇒ same unit).
const b = (lo: number, hi: number): Band => ({ lo, hi, unit: 'step' });

describe('SPEC-08 — banded ε-non-domination (research note 03 §5)', () => {
  describe('the conservative interval order', () => {
    it('noWorse: A is no worse than B unless B sits entirely above A', () => {
      expect(noWorse(b(5, 6), b(1, 2))).toBe(true); // A above B
      expect(noWorse(b(1, 2), b(5, 6))).toBe(false); // B entirely above A
      expect(noWorse(b(1, 4), b(3, 6))).toBe(true); // overlap ⇒ no worse (incomparable)
      expect(noWorse(b(2, 2), b(2, 2))).toBe(true); // equal ⇒ no worse
    });

    it('strictlyBetter: A must be separated conservatively above B (by more than ε)', () => {
      expect(strictlyBetter(b(5, 6), b(1, 2))).toBe(true); // A entirely above B
      expect(strictlyBetter(b(2, 2), b(2, 2))).toBe(false); // equal is NOT strictly better
      expect(strictlyBetter(b(1, 4), b(3, 6))).toBe(false); // overlap is NOT strictly better
      expect(strictlyBetter(b(5, 6), b(1, 2), 10)).toBe(false); // ε too large to clear
    });

    it('violated (null) is the worst possible value on a criterion', () => {
      expect(noWorse(b(-9, -9), null)).toBe(true); // any finite margin ≥ unreachable
      expect(noWorse(null, b(-9, -9))).toBe(false); // unreachable < any finite margin
      expect(strictlyBetter(b(-9, -9), null)).toBe(true); // reachable strictly beats unreachable
      expect(strictlyBetter(null, b(1, 1))).toBe(false); // the worst never strictly better
      expect(noWorse(null, null)).toBe(true); // worst is no-worse only than the worst
      expect(strictlyBetter(null, null)).toBe(false);
    });
  });

  describe('domination', () => {
    it('drops a plan strictly worse on every criterion (US3-1)', () => {
      const a: CriteriaVector = [b(5, 6), b(5, 6), b(5, 6)];
      const worse: CriteriaVector = [b(1, 2), b(1, 2), b(1, 2)];
      expect(dominates(a, worse)).toBe(true);
      expect(dominates(worse, a)).toBe(false); // asymmetric
      expect(nonDominated([a, worse])).toEqual([0]); // only A survives
    });

    it('keeps both plans of a genuine trade-off (US3-2)', () => {
      const a: CriteriaVector = [b(5, 6), b(1, 2)]; // wins criterion 0
      const c: CriteriaVector = [b(1, 2), b(5, 6)]; // wins criterion 1
      expect(dominates(a, c)).toBe(false);
      expect(dominates(c, a)).toBe(false);
      expect(distinct(a, c)).toBe(true);
      expect(nonDominated([a, c]).sort()).toEqual([0, 1]);
    });

    it('is irreflexive — no plan dominates itself (US3-4)', () => {
      expect(dominates([b(2, 2), b(3, 3)], [b(2, 2), b(3, 3)])).toBe(false);
      expect(dominates([b(1, 4)], [b(1, 4)])).toBe(false);
    });

    it('a no-worse-everywhere-and-strictly-better-once plan dominates', () => {
      const a: CriteriaVector = [b(5, 6), b(3, 4)]; // equal-ish on 1, strictly better on 0
      const c: CriteriaVector = [b(1, 2), b(3, 4)];
      expect(dominates(a, c)).toBe(true);
      expect(dominates(c, a)).toBe(false);
    });

    it('throws on misaligned criteria vectors', () => {
      expect(() => dominates([b(1, 1)], [b(1, 1), b(2, 2)])).toThrow(/differing length/);
    });
  });

  describe('ε is the distinctness knob — increasing it never shrinks the set', () => {
    it('is monotone in ε (US3-3)', () => {
      // A dominates B at ε=0 (separated by 1); raising ε past the gap frees B.
      const vectors: CriteriaVector[] = [
        [b(5, 6), b(1, 2)],
        [b(3, 4), b(1, 2)],
      ];
      const at0 = nonDominated(vectors, 0);
      const at1 = nonDominated(vectors, 1); // gap is 5-4 = 1, not > 1 ⇒ no domination
      const at5 = nonDominated(vectors, 5);
      expect(at0).toEqual([0]); // B dominated at ε=0
      expect(at1.length).toBeGreaterThanOrEqual(at0.length); // never shrinks
      expect(at5.sort()).toEqual([0, 1]); // both distinct at a large ε
    });
  });
});
