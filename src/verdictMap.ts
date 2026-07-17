/**
 * SPEC-07 mapping, extracted pure (SPEC-25 / note 14 §3).
 *
 * The signed-margin-band reduction and the four-stop verdict rule live here as
 * pure functions over generated types alone — no store, no service, no I/O — so
 * both the scorer (`src/score.ts`, which re-exports them for back-compat) and the
 * pure verdict legend component (`src/components/verdictLegend.ts`, SPEC-14
 * extractable) read the SAME mapping. There is exactly one four-stop rule; the
 * legend renders it rather than a drifting copy.
 *
 * The verdict mapping is signs-only — no interior cut, no invented ε — which is
 * the unique four-stop rule satisfying oracle O-3 (the verdict changes only at
 * band edges). It is pinned independently by `tests/oracle.test.ts`; a change to
 * it is a register/oracle matter, never a data event.
 */
import type { Band, Comparator, VerdictBand } from './generated/types.js';

/**
 * Reduce a commitment to a signed margin band `M`, oriented so satisfied ⟺
 * margin ≥ 0 (research note `03-score-plan.md` §3). `M.lo` is always the
 * worst-case margin.
 */
export function marginBand(comparator: Comparator, threshold: number, value: Band): Band {
  switch (comparator) {
    case 'at_most':
    case 'by_step':
      return { lo: threshold - value.hi, hi: threshold - value.lo, unit: value.unit };
    case 'at_least':
      return { lo: value.lo - threshold, hi: value.hi - threshold, unit: value.unit };
    case 'never':
      return { lo: -value.hi, hi: -value.lo, unit: value.unit };
  }
}

/**
 * The four-stop verdict, by the SIGNS of the margin-band endpoints only — the
 * unique O-3-satisfying rule (research note §3). No interior cut exists, because
 * the band gives no honest interior point to cut at (DEC-15: no midpoint).
 */
export function verdictFor(margin: Band): VerdictBand {
  if (margin.hi < 0) return 'violated'; // best realisation already fails
  if (margin.lo > 0) return 'robust'; // worst realisation satisfies with room
  if (margin.lo === 0) return 'marginal'; // worst realisation exactly on the line
  return 'tight'; // m_lo < 0 ≤ m_hi — the band straddles the line
}

/**
 * The frozen oracle O-3 constants (vignette §9, `tests/oracle.test.ts`) — the
 * legend's illustration derives from THESE, never from live data (SPEC-25
 * US1 AS-2 / FR-001). `strait_open_step = [9,13]` swept against `at_most T`
 * over `T ∈ {8…14}`: the verdict changes only at the band edges 9 and 13, never
 * strictly inside the band.
 */
export const ORACLE_O3 = {
  value: { lo: 9, hi: 13, unit: 'step' } as Band,
  comparator: 'at_most' as Comparator,
  sweep: [8, 9, 10, 11, 12, 13, 14],
} as const;

/** The four-stop verdict for each swept threshold, computed through the pinned mapping. */
export function oracleO3Sweep(): { threshold: number; margin: Band; verdict: VerdictBand }[] {
  return ORACLE_O3.sweep.map((threshold) => {
    const margin = marginBand(ORACLE_O3.comparator, threshold, ORACLE_O3.value);
    return { threshold, margin, verdict: verdictFor(margin) };
  });
}
