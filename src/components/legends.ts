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
  verdict: {
    term: 'four-stop verdict (robust / marginal / tight / violated)',
    gloss:
      'One colour language for how a plan meets a commitment, read off the signed margin band’s sign only. No decimals — the banded margin rides on hover, never as a headline (G2).',
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
  s1Table: ['band', 'provenance', 'waiver', 'blocks', 'refusal'],
  channelTrace: ['band', 'provenance'],
  s2Matrix: ['verdict'],
  handfulStrip: ['distinct'],
  s3Cards: ['sacrifice', 'tier'],
  refusalBanner: ['refusal'],
};

/** Convenience: the legend for a named component. */
export function componentLegend(component: string, title?: string): string {
  const pills = COMPONENT_PILLS[component] ?? [];
  return pills.length > 0 ? legend(pills, title ? { title } : {}) : '';
}
