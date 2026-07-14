/**
 * Issue #24 — dependency-graph detail sidebar (the composite C layout).
 *
 * Renders a DepGraphNodeDetail as a vertical sidebar panel: the selected node's
 * metadata, then upstream and downstream neighbours grouped by depth and edge
 * type. Pure HTML string renderer, no DOM, no state (constitution I).
 */
import type { DepGraphNodeDetail, DepGraphNode } from '../depGraph.js';

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const TYPE_COLOUR: Record<DepGraphNode['type'], string> = {
  knowledge: '#2E5C8A',
  world: '#3B7A57',
  verdict: '#7A6A12',
  plan: '#6B3A6B',
  report: '#9A5212',
  unknown: '#8091A0',
};

function nodeChip(node: DepGraphNode): string {
  const colour = TYPE_COLOUR[node.type];
  const opacity = node.known ? '' : 'opacity:0.6;';
  return `<span class="assay-dep-node" data-dep-hash="${esc(node.hash)}" style="display:inline-block;padding:2px 7px;border-radius:8px;font-family:ui-monospace,monospace;font-size:10px;font-weight:600;background:${colour};color:#fff;${opacity}margin:2px 2px;cursor:pointer" title="${esc(node.hash)}">${esc(node.label)}</span>`;
}

function directionSection(
  title: string,
  groups: DepGraphNodeDetail['upstream'],
): string {
  if (groups.length === 0) {
    return `<div style="margin:8px 0">
      <div style="font-size:10.5px;font-weight:700;color:#3A4A56;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px">${esc(title)}</div>
      <div style="font-size:11px;color:#5B6B77">— none —</div>
    </div>`;
  }

  const rows = groups
    .map(
      (g) =>
        `<div style="margin:4px 0;padding:4px 8px;background:#F7F9FA;border-radius:4px;border:1px solid #E0E8ED">
          <div style="font-size:9.5px;color:#5B6B77;margin-bottom:2px">depth ${g.depth} · ${esc(g.edgeType)}</div>
          <div style="display:flex;flex-wrap:wrap;gap:2px">${g.nodes.map((n) => nodeChip(n)).join('')}</div>
        </div>`,
    )
    .join('');

  return `<div style="margin:8px 0">
    <div style="font-size:10.5px;font-weight:700;color:#3A4A56;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px">${esc(title)}</div>
    ${rows}
  </div>`;
}

export function depGraphSidebar(detail: DepGraphNodeDetail): string {
  const typeColour = TYPE_COLOUR[detail.node.type];

  return `<div class="assay-dep-sidebar">
  <div style="margin-bottom:8px">
    <span style="display:inline-block;padding:3px 9px;border-radius:10px;font-family:ui-monospace,monospace;font-size:11px;font-weight:700;background:${typeColour};color:#fff">${esc(detail.node.label)}</span>
    <span style="font-size:10px;color:#5B6B77;margin-left:6px">${esc(detail.node.type)}</span>
  </div>
  <div style="font-family:ui-monospace,monospace;font-size:10.5px;color:#1B2732;padding:4px 8px;background:#F7F9FA;border-radius:4px;border:1px solid #E0E8ED;margin-bottom:8px">${esc(detail.metadata)}</div>
  ${directionSection('Upstream (depends on)', detail.upstream)}
  ${directionSection('Downstream (feeds into)', detail.downstream)}
</div>`;
}
