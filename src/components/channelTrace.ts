/**
 * SPEC-06 — channel-trace surface (ui-design; build plan §Stage 2 user-observable).
 *
 * Renders a CompiledWorld's sparse channels: each channel's default band and its
 * region overrides, every one carrying its band pill, the backing KnowledgeObject
 * (its `source`), and that object's provenance chip — so opening a channel value
 * walks it back to named knowledge with a named owner (G3). Framework-free HTML
 * string; depends only on generated types and the shared components; calls no
 * service and holds no state (constitution I — it arranges projections only).
 */
import type { CompiledWorld, KnowledgeObject } from '../generated/types.js';
import { bandPill } from './bandPill.js';
import { provenanceChip } from './provenanceChip.js';

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const cell = (html: string, extra = ''): string =>
  `<td style="padding:6px 10px;border-bottom:1px solid #EDF0F2;vertical-align:top;${extra}">${html}</td>`;

export function channelTrace(
  world: CompiledWorld,
  knowledgeById: Record<string, KnowledgeObject> = {},
): string {
  const rows: string[] = [];
  for (const ch of world.channels) {
    const regions = ch.regions ?? [];
    rows.push(
      `<tr style="background:#F1F3F5"><td colspan="4" style="padding:6px 10px;font-weight:700;color:#1B2732;font-family:ui-monospace,monospace;font-size:11px">${esc(ch.kind)} <span style="color:#5B6B77;font-weight:400">· default ${bandPill(ch.default)}</span>${regions.length === 0 ? ' <span style="color:#5B6B77;font-weight:400">— no overrides (channel at default)</span>' : ''}</td></tr>`,
    );
    for (const region of regions) {
      const src = region.source;
      const ko = src ? knowledgeById[src] : undefined;
      const window =
        region.from_step !== undefined || region.until_step !== undefined
          ? `<span style="color:#5B6B77;font-family:ui-monospace,monospace;font-size:10.5px">steps ${region.from_step ?? 0}–${region.until_step ?? '∞'}</span>`
          : '';
      const backing = src
        ? `<span style="font-family:ui-monospace,monospace;font-size:11px;font-weight:600;color:#1B2732">${esc(src)}</span>`
        : `<span style="color:#A33131;font-family:ui-monospace,monospace;font-size:11px">unsourced — trace dead end (G3)</span>`;
      const prov = ko?.provenance ? provenanceChip(ko.provenance) : '';
      rows.push(
        `<tr>${cell(`<span style="font-family:ui-monospace,monospace;font-size:11px;color:#5B6B77">${esc(region.region)}</span>`)}${cell(bandPill(region.value))}${cell(`${backing} ${window}`)}${cell(prov)}</tr>`,
      );
    }
  }
  return `<table class="assay-channel-trace" style="border-collapse:collapse;width:100%;font-family:ui-monospace,monospace">
  <thead><tr style="text-align:left;color:#5B6B77;font-size:10.5px;text-transform:uppercase;letter-spacing:.04em">
    <th style="padding:6px 10px">region</th><th style="padding:6px 10px">value</th><th style="padding:6px 10px">from knowledge</th><th style="padding:6px 10px">provenance</th>
  </tr></thead>
  <tbody>${rows.join('')}</tbody>
</table>`;
}
