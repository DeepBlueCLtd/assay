/**
 * Issue #24 — horizontal dependency-graph river (the composite A layout).
 *
 * Renders the depth-layered DepGraph as a horizontal left-to-right river:
 * upstream layers → focus node → downstream layers. Pure HTML string renderer,
 * no DOM, no state (constitution I). The river is the spatial overview; the
 * sidebar (depGraphSidebar.ts) provides the detail on click.
 */
import type { DepGraph, DepGraphNode, DepGraphLayer } from '../depGraph.js';

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const NODE_STYLE: Record<DepGraphNode['type'], { bg: string; fg: string }> = {
  knowledge: { bg: '#2E5C8A', fg: '#FFFFFF' },
  world: { bg: '#3B7A57', fg: '#FFFFFF' },
  verdict: { bg: '#7A6A12', fg: '#FFFFFF' },
  plan: { bg: '#6B3A6B', fg: '#FFFFFF' },
  report: { bg: '#9A5212', fg: '#FFFFFF' },
  unknown: { bg: '#8091A0', fg: '#FFFFFF' },
};

function nodeChip(node: DepGraphNode, opts: { focus?: boolean } = {}): string {
  const style = NODE_STYLE[node.type];
  const border = opts.focus ? 'border:2px solid #1B2732;' : 'border:1px solid transparent;';
  const opacity = node.known ? '' : 'opacity:0.6;';
  const deadEnd = node.known ? '' : ' (dead end — G3)';
  return `<div class="assay-dep-node" data-dep-hash="${esc(node.hash)}" style="display:inline-block;padding:4px 9px;border-radius:10px;font-family:ui-monospace,monospace;font-size:10.5px;font-weight:600;background:${style.bg};color:${style.fg};${border}${opacity}margin:3px 2px;cursor:pointer;white-space:nowrap" title="${esc(node.hash)}${esc(deadEnd)}">${esc(node.label)}</div>`;
}

const MAX_VISIBLE_PER_LAYER = 5;

function typeSummary(nodes: DepGraphNode[]): string {
  const counts = new Map<DepGraphNode['type'], number>();
  for (const n of nodes) counts.set(n.type, (counts.get(n.type) ?? 0) + 1);
  return [...counts.entries()].map(([t, c]) => `${c} ${t}`).join(', ');
}

function layerColumn(layer: DepGraphLayer): string {
  if (layer.nodes.length > MAX_VISIBLE_PER_LAYER) {
    const visible = layer.nodes.slice(0, MAX_VISIBLE_PER_LAYER);
    const overflow = layer.nodes.length - visible.length;
    const nodes = visible.map((n) => nodeChip(n)).join('');
    return `<div class="assay-dep-layer" style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:80px;gap:2px">
      <div style="font-size:9px;color:#8091A0;text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px">depth ${layer.depth} · ${typeSummary(layer.nodes)}</div>
      ${nodes}
      <div style="font-size:10px;color:#5B6B77;margin-top:2px;font-style:italic">+ ${overflow} more</div>
    </div>`;
  }
  const nodes = layer.nodes.map((n) => nodeChip(n)).join('');
  return `<div class="assay-dep-layer" style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:80px;gap:2px">
    <div style="font-size:9px;color:#8091A0;text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px">depth ${layer.depth}</div>
    ${nodes}
  </div>`;
}

function arrow(): string {
  return '<div style="display:flex;align-items:center;padding:0 4px;color:#C8D2DA;font-size:16px">→</div>';
}

export function depGraphRiver(graph: DepGraph): string {
  const upLayers = [...graph.upstream].reverse();
  const parts: string[] = [];

  for (const layer of upLayers) {
    parts.push(layerColumn(layer));
    parts.push(arrow());
  }

  parts.push(`<div class="assay-dep-layer assay-dep-focus" style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:80px">
    <div style="font-size:9px;color:#8091A0;text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px">focus</div>
    ${nodeChip(graph.focus, { focus: true })}
  </div>`);

  for (const layer of graph.downstream) {
    parts.push(arrow());
    parts.push(layerColumn(layer));
  }

  const totalNodes = graph.upstream.reduce((s, l) => s + l.nodes.length, 0) +
    1 +
    graph.downstream.reduce((s, l) => s + l.nodes.length, 0);
  const totalEdges = graph.upstream.reduce((s, l) => s + l.edges.length, 0) +
    graph.downstream.reduce((s, l) => s + l.edges.length, 0);

  return `<div class="assay-dep-river" style="overflow-x:auto">
  <div style="display:flex;align-items:stretch;min-width:max-content;padding:8px 0">${parts.join('')}</div>
  <div style="font-size:10px;color:#8091A0;margin-top:6px">${totalNodes} node${totalNodes !== 1 ? 's' : ''}, ${totalEdges} edge${totalEdges !== 1 ? 's' : ''} — click a node for detail</div>
</div>`;
}
