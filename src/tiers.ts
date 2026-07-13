/**
 * SPEC-09 — the tier / minimality algebra (research note `04-relaxation.md` §2, §4).
 *
 * Relaxation ranks candidates by the commander's ORDINAL tiers (`must / should /
 * prefer`, DEC-19) — never by a numeric weight. Two adaptations of preemptive
 * lexicographic goal programming, both forced by the invariants:
 *
 *   - **Inclusion-minimal frontier, not one optimum** (G4). A candidate's sacrifice
 *     set is dropped only when another's is a strict SUBSET (that candidate gives up
 *     strictly less) — a strict-superset sacrifice is silent waste, forbidden.
 *     Incomparable sets (different singletons) both survive; the commander weighs.
 *   - **Least-worst-first tier order.** Order by (musts, shoulds, prefers) sacrificed,
 *     ascending: giving up only `should`s beats giving up a `must`. The must-sacrifice
 *     is ranked LAST, never dropped (G4 — never silence).
 *
 * Where lexicography runs out — two same-tier sacrifices — the order is a STATED,
 * content-neutral tie-break (commitment id), never a hidden numeric nudge (DEC-19).
 * No numeric commitment weight, scalar total, or midpoint appears anywhere here.
 */
import type { CommitmentTier } from './generated/types.js';

/** A candidate's sacrificed commitments, as sorted logical ids (`violated` set). */
export type SacrificeSet = string[];

/** The lexicographic key: how many of each tier a set sacrifices. Lower is better. */
export type TierCost = { must: number; should: number; prefer: number };

/** Map from commitment logical_id → its ordinal tier. */
export type TierOf = (commitmentId: string) => CommitmentTier;

const cmp = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

/** Canonicalise a sacrifice set: de-duplicated, id-sorted (the stable representation). */
export function canonicalSet(ids: Iterable<string>): SacrificeSet {
  return [...new Set(ids)].sort(cmp);
}

/** Count the tiers a sacrifice set gives up. No weights — counts only (DEC-19). */
export function tierCost(set: SacrificeSet, tierOf: TierOf): TierCost {
  const cost: TierCost = { must: 0, should: 0, prefer: 0 };
  for (const id of set) cost[tierOf(id)] += 1;
  return cost;
}

/**
 * Least-worst-first order over tier costs: fewer musts wins, then fewer shoulds,
 * then fewer prefers. Returns <0 if `a` is less-bad than `b`. Purely ordinal —
 * the tiers are compared in priority order, never summed into a scalar.
 */
export function compareTierCost(a: TierCost, b: TierCost): number {
  return a.must - b.must || a.should - b.should || a.prefer - b.prefer;
}

const isStrictSubset = (a: SacrificeSet, b: SacrificeSet): boolean => {
  if (a.length >= b.length) return false;
  const bs = new Set(b);
  return a.every((x) => bs.has(x));
};

const equalSet = (a: SacrificeSet, b: SacrificeSet): boolean =>
  a.length === b.length && a.every((x, i) => x === b[i]);

/**
 * The inclusion-minimal correction-set frontier (research note §2, G4). Keep a set
 * unless another is a strict SUBSET of it (that one wastes less); collapse
 * duplicates to one representative (first occurrence). Incomparable sets — different
 * singletons, overlapping-but-neither-subset — all survive: the trade is the
 * commander's, not the machine's. Never returns fewer than the truly minimal sets.
 */
export function inclusionMinimal(sets: SacrificeSet[]): SacrificeSet[] {
  const canon = sets.map((s) => canonicalSet(s));
  const kept: SacrificeSet[] = [];
  for (let i = 0; i < canon.length; i++) {
    const s = canon[i]!;
    // dropped if some OTHER set is a strict subset of s (gives up strictly less)…
    const dominated = canon.some((o, j) => j !== i && isStrictSubset(o, s));
    // …or if an earlier identical set already represents this trade (de-dup).
    const duplicateEarlier = canon.slice(0, i).some((o) => equalSet(o, s));
    if (!dominated && !duplicateEarlier) kept.push(s);
  }
  return kept;
}

/**
 * The stated tie-break prose (DEC-19). When same-tier sacrifices were ordered, say
 * so — content-neutrally, by commitment id, explicitly a placeholder for
 * commander-issued within-tier priority. It NEVER claims one same-tier commitment
 * outranks another (that value judgement is the commander's — research note §4).
 * Returns undefined when no same-tier ordering occurred (nothing to state).
 */
export function tieBreakText(sets: SacrificeSet[], tierOf: TierOf): string | undefined {
  // Group the surviving sets by tier cost; any group with >1 member was id-ordered.
  const seen = new Map<string, SacrificeSet[]>();
  for (const s of sets) {
    const c = tierCost(s, tierOf);
    const key = `${c.must},${c.should},${c.prefer}`;
    (seen.get(key) ?? seen.set(key, []).get(key)!).push(s);
  }
  const tiedGroups = [...seen.values()].filter((g) => g.length > 1);
  if (tiedGroups.length === 0) return undefined;
  const pairs = tiedGroups
    .map((g) => g.map((s) => s.join('+')).join(' vs '))
    .join('; ');
  return (
    `Same-tier sacrifices were ordered by commitment id (${pairs}) — a stated, ` +
    `commander-owned placeholder for within-tier priority, not a claim that one ` +
    `sacrifice outranks the other (ASSAY-DEC-19: no numeric weight; ties stated, never silent).`
  );
}
