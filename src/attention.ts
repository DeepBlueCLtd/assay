/**
 * SPEC-22 — attention ordering: the scenario-weight firewall's positive half
 * (research note `docs/research/11-attention.md`; register candidate concept
 * §6.24, flagged not asserted).
 *
 * Scenario weights "order attention and reporting, and never compile into a
 * constraint or cost" (knowledge model §9). This module is the WHOLE of the
 * positive half: (a) the interval-order layering the scenario strip renders,
 * (b) the pair-lift tie-break the S1 collection queue may apply at exactly
 * equal discrimination standing. Any third weight-consuming behaviour is a new
 * register candidate, not an extension (note §4).
 *
 * The ordering is the INTERVAL ORDER already blessed for dominance (note 03
 * §5): `a` ranks strictly above `b` iff `lo(a) > hi(b)`. Overlapping bands
 * (nesting included) are honestly incomparable and render LEVEL. No scalar
 * sort key — no `lo`/`hi`/midpoint standing alone — exists here or anywhere
 * downstream (DEC-15/19); comparison is pairwise, reusing `dominance.ts`.
 *
 * Import discipline (note §4): this module reads the dominance comparison and
 * nothing from compile/score/materialise/metrics/relax/handful — and none of
 * those may import from here. "Attention only" is structural, not conventional.
 */
import type { Band } from './generated/types.js';
import { strictlyBetter } from './dominance.js';

/** One scenario's likelihood standing, as the strip/queue sees it. */
export interface AttentionItem {
  /** ScenarioCOA logical id (R1, R2, …). */
  scenario: string;
  /** The likelihood band (a `scenario_weight` answer). Absent → unranked. */
  band?: Band;
  /** A contested weight orders nothing until resolved (note §2). */
  contested?: boolean;
}

export interface AttentionOrdering {
  /** Strictly-ranked strata, most-likely layer first; level (honestly
   *  incomparable) scenarios share a layer, in logical-id order (stated). */
  layers: string[][];
  /** No assessment, or contested — rendered as such, never defaulted to a
   *  uniform weight: absence of judgement is not a judgement. */
  unranked: string[];
}

/**
 * The interval order: `a` strictly above `b` iff `lo(a) > hi(b)` — the whole
 * of one band above the whole of the other. Delegates to the dominance
 * machinery (no new comparison machinery — spec FR-002). Unit-guarded:
 * likelihoods compare only in like units.
 */
export function strictlyAbove(a: Band, b: Band): boolean {
  if (a.unit !== b.unit) {
    throw new Error(`attention: unit mismatch '${a.unit}' vs '${b.unit}' — likelihood bands compare only in like units`);
  }
  return strictlyBetter(a, b, 0);
}

/**
 * Stratify scenarios into attention layers under the interval order: a
 * scenario's layer index is the length of the longest chain of strictly-above
 * relations above it (note §2) — so a scenario renders below another IFF the
 * order actually says so. Incomparables land level; contested or band-less
 * scenarios are unranked.
 */
export function attentionLayers(items: AttentionItem[]): AttentionOrdering {
  const ranked = items.filter((i) => i.band !== undefined && !i.contested);
  const unranked = items.filter((i) => i.band === undefined || i.contested).map((i) => i.scenario);

  const depth = new Map<string, number>();
  const depthOf = (item: AttentionItem): number => {
    const cached = depth.get(item.scenario);
    if (cached !== undefined) return cached;
    let d = 0;
    for (const other of ranked) {
      if (other.scenario !== item.scenario && strictlyAbove(other.band!, item.band!)) {
        d = Math.max(d, depthOf(other) + 1);
      }
    }
    depth.set(item.scenario, d);
    return d;
  };

  const layers: string[][] = [];
  for (const item of ranked) {
    const d = depthOf(item);
    (layers[d] ??= []).push(item.scenario);
  }
  for (const layer of layers) layer.sort(); // logical-id order within a layer — stated presentation order, no likelihood claim
  return { layers, unranked };
}

/** An unordered COA pair, as discrimination separations name them. */
export type CoaPair = readonly [string, string];

/**
 * The conservative pair lift of the interval order (note §3): pair `a` ranks
 * above pair `b` iff every scenario in `a \ b` is strictly above every
 * scenario in `b \ a`. Shared scenarios cancel; the same pair never ranks;
 * a scenario without a usable band ranks nothing.
 */
export function pairRanksAbove(a: CoaPair, b: CoaPair, bands: ReadonlyMap<string, Band | undefined>): boolean {
  const aOnly = a.filter((s) => !b.includes(s));
  const bOnly = b.filter((s) => !a.includes(s));
  if (aOnly.length === 0 || bOnly.length === 0) return false;
  return aOnly.every((sa) => {
    const ba = bands.get(sa);
    if (!ba) return false;
    return bOnly.every((sb) => {
      const bb = bands.get(sb);
      return bb !== undefined && strictlyAbove(ba, bb);
    });
  });
}

/** One queue entry, as the tie-break sees it (a projection of DiscriminationEntry). */
export interface TieBreakEntry {
  /** Open-question logical id. */
  question: string;
  /** The primary standing (DEC-18) — never overridden, only tied on. */
  best_separation: Band;
  /** The COA pair(s) achieving `best_separation` — what the question bears on. */
  bestPairs: CoaPair[];
}

/** The stated tie-break line, rendered wherever the tie-break applied (DEC-19). */
export const TIE_BREAK_STATEMENT = 'tie broken by scenario weight (attention only)';

export interface TieBreakResult {
  /** Question ids in final queue order. */
  order: string[];
  /** question id → stated tie-break line, for every entry the weight ordered. */
  statements: Map<string, string>;
}

const sameBand = (a: Band, b: Band): boolean => a.lo === b.lo && a.hi === b.hi && a.unit === b.unit;

/** `a` bears on strictly-more-likely pairs than `b`: EVERY best pair of `a`
 *  ranks above EVERY best pair of `b` — universal, conservative (note §3). */
const bearsAbove = (a: TieBreakEntry, b: TieBreakEntry, bands: ReadonlyMap<string, Band | undefined>): boolean =>
  a.bestPairs.length > 0 &&
  b.bestPairs.length > 0 &&
  a.bestPairs.every((pa) => b.bestPairs.every((pb) => pairRanksAbove(pa, pb, bands)));

/**
 * The S1 queue's weight tie-break (note §3): within each group of CONSECUTIVE
 * entries whose `best_separation` bands are exactly equal (lo AND hi — band
 * equality, no tolerance scalar), order by the pair lift where it ranks, and
 * state it. Unequal entries never move (the DEC-18 primary ranking is never
 * overridden); unranked comparisons fall back to the existing stated order
 * (the incoming order, which is stable). Contested/missing weights must be
 * absent from `bands` — they order nothing.
 */
export function weightTieBreak(
  entries: readonly TieBreakEntry[],
  bands: ReadonlyMap<string, Band | undefined>,
): TieBreakResult {
  const order: string[] = [];
  const statements = new Map<string, string>();

  let i = 0;
  while (i < entries.length) {
    let j = i + 1;
    while (j < entries.length && sameBand(entries[j]!.best_separation, entries[i]!.best_separation)) j++;
    const group = entries.slice(i, j);

    if (group.length === 1) {
      order.push(group[0]!.question);
    } else {
      // Stable topological order under the (acyclic) pair-lift relation: pick,
      // among the not-yet-placed, the earliest incoming entry nothing else
      // ranks above — ranked comparisons reorder, unranked ones fall back to
      // the incoming order.
      const remaining = [...group];
      while (remaining.length > 0) {
        const pickIdx = Math.max(
          0,
          remaining.findIndex((cand) => !remaining.some((other) => other !== cand && bearsAbove(other, cand, bands))),
        );
        const picked = remaining.splice(pickIdx, 1)[0]!;
        order.push(picked.question);
        for (const other of remaining) {
          if (bearsAbove(picked, other, bands) || bearsAbove(other, picked, bands)) {
            // The weight ordered this pair — say so on both rows (stated, never silent).
            statements.set(picked.question, TIE_BREAK_STATEMENT);
            statements.set(other.question, TIE_BREAK_STATEMENT);
          }
        }
      }
    }
    i = j;
  }

  return { order, statements };
}
