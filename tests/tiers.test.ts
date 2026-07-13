import { describe, expect, it } from 'vitest';
import type { CommitmentTier } from '../src/generated/types.js';
import {
  canonicalSet,
  compareTierCost,
  inclusionMinimal,
  tierCost,
  tieBreakText,
} from '../src/tiers.js';

// Meridian tiers (DEC-19): C1/C2 must, C3/C4 should, C5/C6 prefer.
const TIER: Record<string, CommitmentTier> = {
  C1: 'must', C2: 'must', C3: 'should', C4: 'should', C5: 'prefer', C6: 'prefer',
};
const tierOf = (id: string): CommitmentTier => TIER[id]!;

describe('SPEC-09 — tier / minimality algebra (US2, US3)', () => {
  describe('canonicalSet', () => {
    it('sorts and de-duplicates', () => {
      expect(canonicalSet(['C4', 'C2', 'C4'])).toEqual(['C2', 'C4']);
    });
  });

  describe('tierCost + compareTierCost — least-worst first, no weights', () => {
    it('counts tiers without summing them into a scalar', () => {
      expect(tierCost(['C2', 'C3'], tierOf)).toEqual({ must: 1, should: 1, prefer: 0 });
    });

    it('a should-sacrifice is less-bad than a must-sacrifice', () => {
      const should = tierCost(['C4'], tierOf); // 0 must, 1 should
      const must = tierCost(['C2'], tierOf); // 1 must, 0 should
      expect(compareTierCost(should, must)).toBeLessThan(0); // should ranks first (least-worst)
    });

    it('fewer musts always wins, regardless of how many lower-tier sacrifices', () => {
      const oneMust = tierCost(['C2'], tierOf); // 1 must
      const manyShoulds = tierCost(['C3', 'C4'], tierOf); // 0 must, 2 should
      // Lexicographic: 0 musts beats 1 must even with more shoulds — no weighted sum.
      expect(compareTierCost(manyShoulds, oneMust)).toBeLessThan(0);
    });

    it('same tier profile compares equal (a genuine tie)', () => {
      expect(compareTierCost(tierCost(['C3'], tierOf), tierCost(['C4'], tierOf))).toBe(0);
    });
  });

  describe('inclusionMinimal — drop strict supersets, keep incomparable, collapse dupes', () => {
    it('drops a strict superset, keeps the singletons', () => {
      const kept = inclusionMinimal([['C4'], ['C3'], ['C2'], ['C2', 'C4'], ['C3', 'C4']]);
      const asKeys = kept.map((s) => s.join('+')).sort();
      expect(asKeys).toEqual(['C2', 'C3', 'C4']); // the two supersets dropped
    });

    it('keeps incomparable sets (different singletons) both', () => {
      const kept = inclusionMinimal([['C3'], ['C4']]);
      expect(kept).toHaveLength(2);
    });

    it('collapses duplicate sacrifice sets to one representative', () => {
      const kept = inclusionMinimal([['C4'], ['C4'], ['C2']]);
      expect(kept.map((s) => s.join('+')).sort()).toEqual(['C2', 'C4']);
    });

    it('keeps two overlapping sets when neither is a subset of the other', () => {
      const kept = inclusionMinimal([['C2', 'C3'], ['C3', 'C4']]);
      expect(kept).toHaveLength(2); // share C3 but neither contains the other
    });

    it('never empties a non-empty input (G4 — never silence)', () => {
      expect(inclusionMinimal([['C2']]).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('tieBreakText — stated, content-neutral, only when a same-tier tie occurred', () => {
    it('is present when two same-tier sacrifices are ordered', () => {
      const text = tieBreakText([['C3'], ['C4'], ['C2']], tierOf);
      expect(text).toBeTruthy();
      expect(text).toMatch(/commitment id/i);
      expect(text).toMatch(/DEC-19/);
    });

    it('names no value ranking between the same-tier commitments', () => {
      const text = tieBreakText([['C3'], ['C4']], tierOf)!;
      expect(text).toMatch(/not a claim that one/i); // explicitly declines to rank them
    });

    it('is absent when no same-tier ordering occurred', () => {
      // Distinct tier profiles → no tie to break.
      expect(tieBreakText([['C4'], ['C2']], tierOf)).toBeUndefined();
    });
  });
});
