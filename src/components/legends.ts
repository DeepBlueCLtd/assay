/**
 * SPEC-16 (SPEC-14 delta) — per-component legends: the key a first-time reader
 * needs when a new pill type appears (the reported "data pills aren't
 * self-explanatory" gap, closed at the point of use).
 *
 * A pure, self-contained string renderer — like every other component it depends
 * on nothing but its inputs (here, nothing at all): no app state, no services,
 * no store (the SPEC-14 extractability constraint). Legend copy is the canonical
 * key text of research note 05 §5. Rendered as a collapsible <details> so the
 * surface stays clean until the reader asks.
 */

import { verdictLegend } from './verdictLegend.js';

export interface LegendEntry {
  /** The pill/marker name as it reads on the surface. */
  term: string;
  /** What it means, and — for assessed values — why it is banded. */
  gloss: string;
}

/** The canonical pill dictionary (note 05 §5). Keyed by a short id. */
export const PILL_LEGEND: Record<string, LegendEntry> = {
  band: {
    term: 'band pill (lo–hi unit)',
    gloss:
      'A range, not a number: an assessed value shown as the interval it honestly occupies. No midpoint is drawn (DEC-15) — there is no "average" to read. Teal = a single observed value; amber = a genuine assessed band.',
  },
  provenance: {
    term: 'provenance chip (source · confidence)',
    gloss:
      'Where the value came from and how strongly it is held, welded on and never optional (DEC-9). "assessment, not fact" is forced on anything not directly observed; a red "single-source" marks an uncorroborated value; the owner is named.',
  },
  jipoe: {
    term: 'JIPOE step chip (JIPOE n · step name)',
    gloss:
      'The JIPOE step this question originated from — define the OE / describe OE effects / evaluate the adversary / determine adversary COAs (JP 2-01.3). Singular by design: it names the origin; downstream usage lives in the trace graph. Makes "doctrinally shaped, not invented" auditable rather than asserted (SPEC-21).',
  },
  verdict: {
    term: 'four-stop verdict (robust / marginal / tight / violated)',
    gloss:
      'One colour language for how a plan meets a commitment, read off the signed margin band’s sign only. No decimals — the banded margin rides on hover, never as a headline (G2). Open the verdict legend for the full mapping (SPEC-25).',
  },
  verdict_legend: {
    term: 'verdict legend (the mapping, laid open)',
    gloss:
      'The four-stop mapping made public, CRT-style: each verdict is a REGION of the signed-margin sign rule (robust m_lo>0 / marginal m_lo=0 / tight m_lo<0≤m_hi / violated m_hi<0), illustrated by the frozen oracle O-3 sweep — the verdict changes only at the band edges, never inside. A mapping, never a score (DEC-19); oracle-derived, never live (SPEC-25).',
  },
  tier: {
    term: 'tier chip (must / should / prefer)',
    gloss:
      'The commander’s ordinal priority on a commitment. Ordinal, never a numeric weight — the machine enumerates trades, the commander weighs them (DEC-19).',
  },
  waiver: {
    term: 'waiver W-1',
    gloss:
      'The value was admitted only under an explicit, recorded waiver — the exception is visible, not laundered.',
  },
  blocks: {
    term: 'blocks compile',
    gloss:
      'Contested knowledge: two irreconcilable answers. It reaches no compiled world until resolved — the system will not average a dispute into a channel (G5).',
  },
  refusal: {
    term: 'refusal banner',
    gloss:
      'The system declined to compute rather than launder a dishonest input; it names exactly what offended and why (seam §1). A refusal is first-class, never a degraded save.',
  },
  distinct: {
    term: 'distinct because …',
    gloss:
      'The organiser’s DERIVED reason this plan is in the handful — computed from banded non-domination, never a hand-authored caption.',
  },
  sacrifice: {
    term: 'sacrificed commitment',
    gloss:
      'A commitment this least-worst option gives up — computed (the scorer returned "violated"), not authored. Never empty and never a silent drop (G4).',
  },
  scenario_collapse: {
    term: 'collapse marker (▼)',
    gloss:
      "The verdict under this scenario is worse than under BASE — the plan's performance drops. No robustness score — the four-stop verdict IS the data.",
  },
  worst_case: {
    term: 'worst-case verdict',
    gloss:
      "The plan's worst verdict for this commitment across all toggled scenarios (minimax). A real verdict on a real scenario, not a weighted blend.",
  },
  sensitivity: {
    term: 'changed verdicts (count)',
    gloss:
      'How many commitment verdicts changed when this knowledge item was perturbed to its band edge. Higher count = the assessment is more load-bearing; zero = verdicts are insensitive to this item.',
  },
  single_source_flag: {
    term: 'single-source',
    gloss:
      'An uncorroborated value flagged per ICD 203 — only one collection source supports this assessment. Shown alongside sensitivity, never collapsed with it (DEC-19).',
  },
  separation: {
    term: 'COA-pair separation (band)',
    gloss:
      'The gap between two COAs\' expected-answer bands for a question. Positive (green) = disjoint, the question discriminates; negative (amber/red) = overlapping, the question does not distinguish.',
  },
  collection_cost: {
    term: 'collection cost (band)',
    gloss:
      'The cost of collecting on this question, shown alongside discrimination value, never collapsed with it (DEC-19).',
  },
  separation_class: {
    term: 'separation class (✓ discriminates / ~ could discriminate / ✕ cannot discriminate)',
    gloss:
      'What an observation could settle for this COA pair. Disjoint (✓): any observation in either expected band settles it. Partial overlap (~): a lucky observation outside the shared region settles it either way. Nested (✕): the inner COA has no exclusive region — no observation can ever single it out, at best a fluke outside the inner band points to the outer; tasking to confirm the inner COA is impossible (SPEC-23).',
  },
  operative_pair: {
    term: 'operative pair (A↔B)',
    gloss:
      'A scenario pair the live decision actually turns on: some plan and commitment in the current set have differing verdicts across it. Derived from the verdict tensor — computed from verdict divergence only, never hand-picked and never likelihood-weighted (K14 does not enter; SPEC-23). The ranking leads with these pairs; all-pairs separation stays as context.',
  },
  attention: {
    term: 'likelihood layers (orders attention — never compiles)',
    gloss:
      'Adversary-COA likelihood bands (scenario weights) ordered by the interval order: one ranks above another only when the whole band sits above it. Overlapping bands render level — honestly unranked; a missing assessment renders unranked, never defaulted. The ordering directs attention and collection only (knowledge model §9): no verdict, score, or membership owes it anything.',
  },
  weight_tiebreak: {
    term: 'tie broken by scenario weight (attention only)',
    gloss:
      'Two questions had exactly equal discrimination standing; the queue placed the one bearing on the more-likely scenario pair (interval order) first, and says so. Weight breaks ties only — it never overrides the primary discrimination ranking (DEC-18) and never touches a verdict.',
  },
  decision_point: {
    term: 'decision point (derived)',
    gloss:
      'A commitment whose verdict turns on open information: scenario-divergent (some adversary-COA pair flips it — the evidence chips name the pair and both verdicts) or margin-class (tight/marginal under the selected world — the margin band is the evidence). Derived from the verdict tensor, never authored; uniformly robust or uniformly violated commitments are not decision points (SPEC-24). Rows sit in commitment-id order — a stated presentation order, not an urgency ranking (DEC-19).',
  },
  ltiov_state: {
    term: 'LTIOV state (in time / cannot answer in time / no earliest result stated)',
    gloss:
      'Latest time information is of value = the commit step minus a stated lead (0 in v1), on the scenario clock. A collection answers in time iff its earliest result lands at or before it — slack shown as a step count; the red state renders with its arithmetic and is never dropped; a collection with no stated earliest result is never assumed answerable. The system ranks and derives — tasking the collection is a human act with its own commitment consequences (the KINGFISHER/C6 discipline).',
  },
  tripwire: {
    term: 'tripwire (⏱ lapses before the commit step)',
    gloss:
      'A knowledge object the selected world consumed whose validity window ends before this decision must be taken: at commit time the world underneath the verdict will contain lapsed knowledge — re-validate first. World-level scope, stated as such (the trace graph’s honest granularity); lapse is marked, never carried (SPEC-24, thesis F at the decision layer).',
  },
  invalidated: {
    term: 'invalidated artefact',
    gloss:
      'A downstream artefact (world, verdict, or score) flagged stale by a transitive trace walk from a changed knowledge object. Nothing recomputes — flags only, then humans decide (constitution).',
  },
  puts_at_risk: {
    term: 'puts at risk (verdict → verdict)',
    gloss:
      'A commitment this least-worst option DEGRADES short of violation, relative to the incumbent plan under the same world (e.g. robust → tight). Derived from verdict deltas by the reused scorer, never authored — the risk residue the sacrifice set (violated-only) would hide (SPEC-25). Distinct from "sacrificed": that is the violated set; this is worse-but-not-failed.',
  },
  challenge: {
    term: 'challenge — key assumptions (leans on …)',
    gloss:
      'The computed sensitivity contributors for THIS verdict: the knowledge that, pushed to its band edge, flips it — single-source flags co-shown. A re-render of the sensitivity ranking (SPEC-11) scoped to one verdict; it ROUTES challenge to the knowledge row, it does not adjudicate it. "No single band-edge movement flips this" is itself assurance, never a blank (SPEC-25).',
  },
  role_menu: {
    term: 'role actions (the legal verbs for this role)',
    gloss:
      'The write verbs C2 permits this role — J-2 collect/contest/resolve/supersede, planner compile/generate/relax/score, commander select/waive, observer none. Each is marked live-actionable, pipeline-automatic, or deferred (never a dead button faking a write, DEC-4). Menus reorganise what the seam already permits (DEC-33), never restrict; the observer tab exposes no write (SPEC-25).',
  },
  recursive_trace: {
    term: 'recursive trace (▸ expand · depth cap 3)',
    gloss:
      'The one-hop informs/influenced-by menu expanded in place, hop by hop, to a stated depth cap of 3 (DEC-38). Each hop shows its real edge type — plus a fixed operation gloss on the computation edges (scored_from = the interval evaluation over channel reads; compiled_into = the band materialisation), never an invented "why". Dead ends read as dead ends at every depth (G3). The same transitive walk as the full graph, capped for reading flow; at the cap an honest "N more — open full trace" opens that graph (G4 — never a silent stop).',
  },
};

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** A collapsible legend listing the given pill ids for one component. */
export function legend(pillIds: string[], opts: { title?: string } = {}): string {
  const title = opts.title ?? 'What the pills mean';
  const rows = pillIds
    .map((id) => PILL_LEGEND[id])
    .filter((e): e is LegendEntry => e !== undefined)
    .map(
      (e) =>
        `<div style="margin:6px 0"><span style="font-family:ui-monospace,monospace;font-size:10.5px;font-weight:600;color:#1B2732">${esc(
          e.term,
        )}</span><div style="font-size:11.5px;color:#5B6B77;margin-top:2px">${esc(e.gloss)}</div></div>`,
    )
    .join('');
  return `<details class="assay-legend" style="margin:8px 0;border:1px dashed #C8D2DA;border-radius:6px;padding:4px 10px;background:#F7F9FA">
  <summary style="cursor:pointer;font-size:11px;color:#3E5D8A;font-weight:600">Key — ${esc(
    title,
  )}</summary>
  <div style="margin-top:6px">${rows}</div>
</details>`;
}

/** The pill sets each named component renders — the source for its legend. */
export const COMPONENT_PILLS: Record<string, string[]> = {
  s1Table: ['band', 'provenance', 'jipoe', 'waiver', 'blocks', 'refusal'],
  channelTrace: ['band', 'provenance', 'jipoe'],
  s2Matrix: ['verdict', 'verdict_legend'],
  handfulStrip: ['distinct'],
  s3Cards: ['sacrifice', 'puts_at_risk', 'tier', 'verdict_legend'],
  scenarioStrip: ['verdict', 'verdict_legend', 'scenario_collapse', 'worst_case', 'attention', 'band', 'provenance'],
  refusalBanner: ['refusal'],
  sensitivityTable: ['sensitivity', 'single_source_flag', 'verdict', 'verdict_legend'],
  discriminationTable: ['separation', 'separation_class', 'operative_pair', 'collection_cost', 'band', 'provenance', 'weight_tiebreak'],
  stalenessFlags: ['invalidated'],
  recursiveTrace: ['recursive_trace'],
  dsmTable: ['decision_point', 'ltiov_state', 'tripwire', 'separation_class', 'collection_cost', 'band', 'provenance', 'tier', 'verdict_legend'],
};

/** Components whose surfaces render a four-stop verdict — the verdict legend is
 *  reachable from each (SPEC-25 US1: "reachable from every surface that renders a
 *  verdict"). */
export const VERDICT_SURFACES = new Set([
  's2Matrix',
  's3Cards',
  'scenarioStrip',
  'sensitivityTable',
  'dsmTable',
  'challengePanel',
]);

/** Convenience: the legend for a named component. */
export function componentLegend(component: string, title?: string): string {
  const pills = COMPONENT_PILLS[component] ?? [];
  return pills.length > 0 ? legend(pills, title ? { title } : {}) : '';
}

/** The verdict legend for a verdict-bearing component, else empty — the one act
 *  that answers "why this word?" wherever a four-stop verdict renders (US1). */
export function verdictLegendFor(component: string): string {
  return VERDICT_SURFACES.has(component) ? verdictLegend() : '';
}
