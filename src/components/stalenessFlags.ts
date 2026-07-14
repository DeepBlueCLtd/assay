/**
 * SPEC-13 — staleness invalidation flags (thesis F; ui-design §S6-stale).
 *
 * Renders the staleness walk result: three groups of invalidated artefact refs
 * (worlds, verdicts, scores) as coloured chips, plus a chain summary. Nothing
 * recomputes — flags only, then humans decide (constitution). Pure component:
 * HTML string from data, no DOM, no state (constitution I). Glow ids follow
 * the SPEC-16 pattern.
 */
import type { Ref } from '../store.js';
import type { TraceChain } from '../trace.js';

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

interface InvalidatedRefs {
  verdicts: Ref[];
  scores: Ref[];
  worlds: Ref[];
}

type GroupKey = 'worlds' | 'verdicts' | 'scores';

const GROUP_STYLE: Record<GroupKey, { bg: string; fg: string; label: string }> = {
  worlds: { bg: '#2E5C8A', fg: '#FFFFFF', label: 'Worlds' },
  verdicts: { bg: '#7A6A12', fg: '#FFFFFF', label: 'Verdicts' },
  scores: { bg: '#6B3A6B', fg: '#FFFFFF', label: 'Scores' },
};

function refChip(ref: Ref, bg: string, fg: string): string {
  return `<span data-logical-id="${esc(ref.logical_id)}" data-glow-id="stale:${esc(ref.logical_id)}" style="display:inline-block;padding:2px 7px;border-radius:8px;font-family:ui-monospace,monospace;font-size:10px;font-weight:600;background:${bg};color:${fg};margin:2px 3px;cursor:pointer">${esc(ref.logical_id)}</span>`;
}

function groupSection(groupKey: 'worlds' | 'verdicts' | 'scores', refs: Ref[]): string {
  if (refs.length === 0) return '';
  const style = GROUP_STYLE[groupKey];
  const chips = refs.map((r) => refChip(r, style.bg, style.fg)).join('');
  return `<div style="margin:6px 0">
    <div style="font-family:ui-monospace,monospace;font-size:10px;font-weight:700;color:#5B6B77;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px">${esc(style.label)} (${refs.length})</div>
    <div style="display:flex;flex-wrap:wrap;gap:2px">${chips}</div>
  </div>`;
}

export function stalenessFlags(invalidated: InvalidatedRefs, chains: TraceChain[]): string {
  const totalInvalidated =
    invalidated.worlds.length + invalidated.verdicts.length + invalidated.scores.length;

  if (totalInvalidated === 0) {
    return '<div style="font-family:ui-monospace,monospace;font-size:11px;color:#5B6B77;padding:8px">No staleness invalidations.</div>';
  }

  const completeCount = chains.filter((c) => c.complete).length;
  const chainSummary = `<div style="font-family:ui-monospace,monospace;font-size:10.5px;color:#5B6B77;margin-bottom:8px;padding:4px 8px;background:#F7F9FA;border-radius:4px;border:1px solid #E0E8ED">${chains.length} trace chain${chains.length !== 1 ? 's' : ''} walked, ${completeCount} complete</div>`;

  const groups = [
    groupSection('worlds', invalidated.worlds),
    groupSection('verdicts', invalidated.verdicts),
    groupSection('scores', invalidated.scores),
  ].join('');

  return `<div class="assay-staleness-flags">
  ${chainSummary}
  ${groups}
</div>`;
}
