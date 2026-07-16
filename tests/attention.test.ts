/**
 * SPEC-22 — attention ordering: the interval-order layering and the queue
 * tie-break (research note docs/research/11-attention.md §2–§3).
 *
 * The Meridian exhibit is pinned exactly: R1 (45–70 %) strictly above the
 * level pair {R2 (20–40 %), R3 (10–25 %)} — the system refuses to rank what
 * the bands don't rank. No scalar sort key exists anywhere (DEC-15/19).
 */
import { describe, expect, it } from 'vitest';
import type { Band } from '../src/generated/types.js';
import {
  attentionLayers,
  pairRanksAbove,
  strictlyAbove,
  weightTieBreak,
  TIE_BREAK_STATEMENT,
  type AttentionItem,
  type TieBreakEntry,
} from '../src/attention.js';

const pct = (lo: number, hi: number): Band => ({ lo, hi, unit: '%' });

// The frozen K14a–c bands (fixtures/knowledge.json; vignette §4).
const K14 = { R1: pct(45, 70), R2: pct(20, 40), R3: pct(10, 25) };
const meridian: AttentionItem[] = [
  { scenario: 'R1', band: K14.R1 },
  { scenario: 'R2', band: K14.R2 },
  { scenario: 'R3', band: K14.R3 },
];
const bands = new Map<string, Band | undefined>(Object.entries(K14));

describe('strictlyAbove — the interval order, nothing else', () => {
  it('ranks only when the whole band sits above: lo(a) > hi(b)', () => {
    expect(strictlyAbove(K14.R1, K14.R2)).toBe(true); // 45 > 40
    expect(strictlyAbove(K14.R1, K14.R3)).toBe(true); // 45 > 25
    expect(strictlyAbove(K14.R2, K14.R3)).toBe(false); // 20 ≤ 25 — overlap
    expect(strictlyAbove(K14.R3, K14.R2)).toBe(false);
  });

  it('nesting is overlap: a band spanning another entirely ranks neither way', () => {
    const outer = pct(10, 60);
    const inner = pct(20, 40);
    expect(strictlyAbove(outer, inner)).toBe(false);
    expect(strictlyAbove(inner, outer)).toBe(false);
  });

  it('refuses a unit mismatch — likelihoods compare only in like units', () => {
    expect(() => strictlyAbove(pct(45, 70), { lo: 20, hi: 40, unit: 'msgs/day' })).toThrow(/unit mismatch/);
  });
});

describe('attentionLayers — the Meridian exhibit and its edge cases', () => {
  it('R1 strictly above the level pair {R2, R3} (the firewall exhibit)', () => {
    const { layers, unranked } = attentionLayers(meridian);
    expect(layers).toEqual([['R1'], ['R2', 'R3']]);
    expect(unranked).toEqual([]);
  });

  it('all bands overlapping → one layer, all level ("we cannot rank these" is the exhibit)', () => {
    const { layers } = attentionLayers([
      { scenario: 'R1', band: pct(30, 60) },
      { scenario: 'R2', band: pct(20, 40) },
      { scenario: 'R3', band: pct(10, 35) },
    ]);
    expect(layers).toEqual([['R1', 'R2', 'R3']]);
  });

  it('a scenario with no likelihood object is unranked — never defaulted to a uniform weight', () => {
    const { layers, unranked } = attentionLayers([
      { scenario: 'R1', band: K14.R1 },
      { scenario: 'R2' },
    ]);
    expect(layers).toEqual([['R1']]);
    expect(unranked).toEqual(['R2']);
  });

  it('a contested weight is unranked until resolved — a disputed assessment orders nothing', () => {
    const { layers, unranked } = attentionLayers([
      { scenario: 'R1', band: K14.R1, contested: true },
      { scenario: 'R2', band: K14.R2 },
      { scenario: 'R3', band: K14.R3 },
    ]);
    expect(layers).toEqual([['R2', 'R3']]); // R1 gone from the ranking, R2/R3 still level
    expect(unranked).toEqual(['R1']);
  });

  it('a three-deep chain stratifies by longest chain above', () => {
    const { layers } = attentionLayers([
      { scenario: 'A', band: pct(80, 90) },
      { scenario: 'B', band: pct(50, 70) },
      { scenario: 'C', band: pct(10, 40) },
    ]);
    expect(layers).toEqual([['A'], ['B'], ['C']]);
  });
});

describe('pairRanksAbove — the conservative pair lift', () => {
  it('{R1,R2} ranks above {R2,R3}: the shared R2 cancels, R1 is strictly above R3', () => {
    expect(pairRanksAbove(['R1', 'R2'], ['R2', 'R3'], bands)).toBe(true);
  });

  it('{R1,R2} vs {R1,R3} is unranked: the symmetric difference R2/R3 overlaps', () => {
    expect(pairRanksAbove(['R1', 'R2'], ['R1', 'R3'], bands)).toBe(false);
    expect(pairRanksAbove(['R1', 'R3'], ['R1', 'R2'], bands)).toBe(false);
  });

  it('the same pair never ranks, and a missing band ranks nothing', () => {
    expect(pairRanksAbove(['R1', 'R2'], ['R1', 'R2'], bands)).toBe(false);
    const partial = new Map<string, Band | undefined>([['R1', K14.R1]]);
    expect(pairRanksAbove(['R1', 'R2'], ['R2', 'R3'], partial)).toBe(false);
  });
});

describe('weightTieBreak — weight breaks ties only, and says so', () => {
  const sep = (lo: number, hi: number): Band => ({ lo, hi, unit: 't' });
  const entry = (question: string, s: Band, ...pairs: [string, string][]): TieBreakEntry => ({
    question,
    best_separation: s,
    bestPairs: pairs,
  });

  it('two equal-discrimination questions on strictly-ordered pairs: the higher pair goes first, stated', () => {
    // Qb bears on {R2,R3}; Qa bears on {R1,R2} — same standing, weight prefers Qa.
    const result = weightTieBreak(
      [entry('Qb', sep(3, 3), ['R2', 'R3']), entry('Qa', sep(3, 3), ['R1', 'R2'])],
      bands,
    );
    expect(result.order).toEqual(['Qa', 'Qb']);
    expect(result.statements.get('Qa')).toBe(TIE_BREAK_STATEMENT);
    expect(result.statements.get('Qb')).toBe(TIE_BREAK_STATEMENT);
  });

  it('overlapping likelihoods on the pairs: no tie-break, the stated fallback (incoming) order holds', () => {
    const result = weightTieBreak(
      [entry('Qb', sep(3, 3), ['R1', 'R3']), entry('Qa', sep(3, 3), ['R1', 'R2'])],
      bands, // R2/R3 overlap ⇒ the lift ranks nothing here
    );
    expect(result.order).toEqual(['Qb', 'Qa']); // never manufactures a ranking
    expect(result.statements.size).toBe(0); // nothing to state — no tie was broken
  });

  it('never overrides the primary ranking: unequal separations never move (DEC-18)', () => {
    // Qlow bears on the more-likely pair but has strictly worse discrimination.
    const result = weightTieBreak(
      [entry('Qhigh', sep(5, 5), ['R2', 'R3']), entry('Qlow', sep(3, 3), ['R1', 'R2'])],
      bands,
    );
    expect(result.order).toEqual(['Qhigh', 'Qlow']);
    expect(result.statements.size).toBe(0);
  });

  it('equal standing means band equality — lo AND hi — not overlap', () => {
    // Same lo, different hi: NOT equal standing, no tie-break group forms.
    const result = weightTieBreak(
      [entry('Qb', sep(3, 4), ['R2', 'R3']), entry('Qa', sep(3, 3), ['R1', 'R2'])],
      bands,
    );
    expect(result.order).toEqual(['Qb', 'Qa']);
    expect(result.statements.size).toBe(0);
  });

  it('a contested/missing weight (absent from bands) breaks no tie', () => {
    const withoutR1 = new Map<string, Band | undefined>([
      ['R2', K14.R2],
      ['R3', K14.R3],
    ]);
    const result = weightTieBreak(
      [entry('Qb', sep(3, 3), ['R2', 'R3']), entry('Qa', sep(3, 3), ['R1', 'R2'])],
      withoutR1,
    );
    expect(result.order).toEqual(['Qb', 'Qa']);
    expect(result.statements.size).toBe(0);
  });

  it('a question with several best pairs tie-breaks only when every pair ranks (universal, conservative)', () => {
    // Qa's best pairs are {R1,R2} and {R2,R3}; Qb's is {R1,R3}. Neither
    // question's pairs universally rank above the other's ({R1,R2} vs {R1,R3}
    // turns on the overlapping R2/R3 difference), so no tie-break applies.
    const result = weightTieBreak(
      [entry('Qb', sep(3, 3), ['R1', 'R3']), entry('Qa', sep(3, 3), ['R1', 'R2'], ['R2', 'R3'])],
      bands,
    );
    expect(result.order).toEqual(['Qb', 'Qa']); // not universally above ⇒ fallback
    expect(result.statements.size).toBe(0);
  });
});
