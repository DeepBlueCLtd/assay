/**
 * SPEC-26 US3 (DEC-38) — the recursive-trace tooltip renderer.
 *
 * The SPEC-16 one-hop "informs / influenced-by" menu made recursively
 * expandable in place, to the stated depth cap of 3. It is the *shallow end* of
 * the DEC-47 full-screen dependency-graph view (issue #24): the same transitive
 * walk under the EDGE_ORIENTATION map (`traceView.recursiveNeighbours`, which
 * reuses `neighbours()` hop by hop — one traversal semantics, no parallel
 * walker), rendered for in-reading-flow disclosure rather than a full-screen
 * overlay. At the cap an honest counted remainder hands off to that overlay.
 *
 * Pure HTML string renderer, no DOM, no state, no store (SPEC-14
 * extractability). Labels are resolved by the caller (`state.recursiveTrace`)
 * exactly as the one-hop menu resolves them, so this file depends only on its
 * inputs — the labelled tree — and the fixed gloss table below.
 */
import type { TraceEdgeType } from '../generated/types.js';

/** A labelled hop — `traceView.TraceHop` with its hash resolved to a readable label. */
export interface LabelledHop {
  /** Readable label for the neighbour (resolved via `describeHash`). */
  label: string;
  /** The neighbour's content hash — carried so the remainder can open the graph here. */
  hash: string;
  /** The edge type connecting it to its parent (the trace graph's own vocabulary). */
  edge_type: TraceEdgeType;
  /** A dead end iff false — rendered as a dead end at every depth (G3). */
  known: boolean;
  depth: number;
  children: LabelledHop[];
  /** Onward neighbours not expanded at the DEPTH cap (`> 0` ⇒ counted remainder, G4). */
  remainder: number;
  /** This hop's children trimmed by the BREADTH cap (`> 0` ⇒ counted "+N more", G4). */
  childrenRemainder: number;
}

/** A labelled recursive trace ready to render. */
export interface LabelledTrace {
  originLabel: string;
  originHash: string;
  relation: 'informs' | 'influences';
  depthCap: number;
  children: LabelledHop[];
  /** Depth-1 neighbours trimmed by the breadth cap (`> 0` ⇒ counted "+N more" at the origin). */
  childrenRemainder: number;
}

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * The FIXED operation gloss for the two computation edges — the metric
 * registry's stated names, never an invented "why" (DEC-38, research note 15
 * §5). Every other edge type shows its `edge_type` alone; a computation edge
 * adds the operation it records. Any edge type absent here renders with no gloss.
 */
const OPERATION_GLOSS: Partial<Record<TraceEdgeType, string>> = {
  scored_from: 'interval evaluation over channel reads',
  compiled_into: 'band materialisation',
};

/** The relationship line for one hop: the real `edge_type`, plus the fixed gloss where the edge carries a computation. */
function hopRelation(edge_type: TraceEdgeType): string {
  const gloss = OPERATION_GLOSS[edge_type];
  return gloss
    ? `<span class="assay-rt-edge">${esc(edge_type)}</span> <span class="assay-rt-gloss">· ${esc(gloss)}</span>`
    : `<span class="assay-rt-edge">${esc(edge_type)}</span>`;
}

/** A counted "open full trace" handoff — visible, bounded, and escapable (G4). */
function handoffRow(count: number, hash: string, kind: 'depth' | 'breadth'): string {
  if (count <= 0) return '';
  const label =
    kind === 'depth'
      ? `${count} more ${count === 1 ? 'hop' : 'hops'} — open full trace →`
      : `+${count} more — open full trace →`;
  return `<div class="assay-rt-remainder"><a href="#" class="assay-rt-open" data-rt-hash="${esc(hash)}">${label}</a></div>`;
}

function renderHop(hop: LabelledHop): string {
  const deadEnd = !hop.known;
  const relation = hopRelation(hop.edge_type);
  const labelHtml = deadEnd
    ? `<span class="assay-rt-label assay-rt-deadend">${esc(hop.label)}</span> <span class="assay-rt-deadend-tag">dead end — G3</span>`
    : `<span class="assay-rt-label">${esc(hop.label)}</span>`;
  const head = `${labelHtml} <span class="assay-rt-rel">${relation}</span>`;

  // A leaf (dead end, or genuinely no further neighbours) renders as a flat row;
  // an expandable hop renders as a native <details> so disclosure is progressive.
  if (deadEnd || (hop.children.length === 0 && hop.remainder === 0)) {
    return `<li class="assay-rt-hop">${head}</li>`;
  }
  if (hop.children.length === 0) {
    // At the depth cap with an onward remainder: a flat row plus the counted handoff.
    return `<li class="assay-rt-hop">${head}${handoffRow(hop.remainder, hop.hash, 'depth')}</li>`;
  }
  // Collapsed by default: the summary (this hop + its edge) is always visible;
  // children reveal on demand. Progressive disclosure keeps a high-fan-out node
  // (a knowledge object that influences every verdict) legible rather than
  // dumping its whole subtree at once (research note 15 §5, Nielsen). Children
  // are breadth-capped; the trimmed count hands off to the full graph (G4).
  return `<li class="assay-rt-hop"><details><summary>${head}</summary><ul class="assay-rt-list">${hop.children
    .map(renderHop)
    .join('')}${handoffRow(hop.childrenRemainder, hop.hash, 'breadth')}</ul></details></li>`;
}

const RELATION_TITLE: Record<LabelledTrace['relation'], string> = {
  informs: 'Informs (upstream — what feeds this)',
  influences: 'Influences (downstream — what this drives)',
};

/**
 * Render one recursive trace (one relation) as a nested, depth-capped hop list.
 * `originLabel`/`originHash` head the tree; the depth cap is stated in the
 * chrome so the reader knows the tree is bounded by design, not exhausted.
 */
export function recursiveTrace(tree: LabelledTrace): string {
  const body =
    tree.children.length === 0
      ? `<div class="assay-rt-empty">— none yet —</div>`
      : `<ul class="assay-rt-list assay-rt-root">${tree.children
          .map(renderHop)
          .join('')}${handoffRow(tree.childrenRemainder, tree.originHash, 'breadth')}</ul>`;
  return `<div class="assay-rt" data-rt-relation="${tree.relation}">
    <div class="assay-rt-title">${esc(RELATION_TITLE[tree.relation])}</div>
    ${body}
    <div class="assay-rt-cap">depth cap ${tree.depthCap} — deeper chains open the full trace</div>
  </div>`;
}
