/**
 * SPEC-19 — the plan-view COA map (research note `10-spatial-temporal.md` §2/§4a).
 *
 * Regions render from their actual `VignetteConfig` boxes, routes from the
 * plan's stated legs, channel values from the compiled world at the requested
 * step — a projection of fixtures, never a drawing (DEC-4). The banded-surface
 * rule (note 10 §2) is enforced by construction: an assessed channel override
 * fills with a TWO-STOP SPLIT (its lo stop and its hi stop as hard halves — no
 * interpolated mid-stop, because no midpoint exists, DEC-15), plus a hatch
 * overlay whose density grows with the band's relative width; the exact
 * `[lo, hi] unit` rides every surface's tooltip with its named source
 * (assessment, not fact). Only a degenerate band (lo = hi, an observed fact —
 * DEC-14) may render as a single stop.
 *
 * Framework-free HTML/SVG string; depends only on generated types, the pure
 * `mapProject` geometry, and sibling components; calls no service and holds no
 * state (SPEC-14 extractability — constitution I, projections only).
 */
import type {
  Band,
  ChannelKind,
  CompiledWorld,
  KnowledgeObject,
  Plan,
  VignetteConfig,
} from '../generated/types.js';
import {
  legActiveAt,
  legRegions,
  makeProjection,
  overrideActiveAt,
  regionByName,
  regionRect,
  type Projection,
} from '../mapProject.js';

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Per-channel hue families (presentation only — the legend keys them). */
const CHANNEL_COLOUR: Record<ChannelKind, string> = {
  threat: '#A33131',
  storm: '#2F5D8A',
  tide: '#14655F',
  civil_density: '#7A4E8A',
  mobility: '#3E7C46',
  sensor: '#6B6B6B',
};

/** Force-element stroke palette (deterministic, keyed by frozen identifiers). */
const ELEMENT_COLOUR: Record<string, string> = {
  'FE-ANVIL': '#9A6A14',
  'FE-BROOM': '#14655F',
  'FE-PACKHORSE': '#3E5D8A',
  'FE-FALCON': '#A33131',
  'FE-KINGFISHER': '#7A4E8A',
};
const elementColour = (id: string): string => ELEMENT_COLOUR[id] ?? '#1B2732';

/** Relative band width r = (hi − lo) / max(|lo|, |hi|) — no midpoint (DEC-15). */
const relWidth = (b: Band): number => {
  const denom = Math.max(Math.abs(b.lo), Math.abs(b.hi));
  return denom === 0 ? 0 : (b.hi - b.lo) / denom;
};

export interface CoaMapOptions {
  /** Render the world at this step (scrub = selection over the compiled world). */
  step?: number;
  /** Pixel width of the map (height follows the grid aspect). */
  width?: number;
  /** Channel surfaces to draw; defaults to every channel carrying an override. */
  channels?: ChannelKind[];
  /** Resolve override sources to provenance for tooltips. */
  knowledgeById?: Record<string, KnowledgeObject>;
  /** Namespace for SVG defs ids (needed when two maps share a page). */
  idPrefix?: string;
}

export function coaMap(
  world: CompiledWorld,
  config: VignetteConfig,
  plans: Plan[],
  opts: CoaMapOptions = {},
): string {
  const step = opts.step ?? 0;
  const prefix = opts.idPrefix ?? 'coamap';
  const p = makeProjection(config.grid, { width: opts.width ?? 640, pad: 10 });

  const wanted =
    opts.channels ?? world.channels.filter((c) => (c.regions ?? []).length > 0).map((c) => c.kind);

  // ---- defs: one split-fill gradient per active override + hatch patterns ----
  const defs: string[] = [];
  const surfaces: string[] = [];
  for (const kind of wanted) {
    const ch = world.channels.find((c) => c.kind === kind);
    if (!ch) continue;
    const colour = CHANNEL_COLOUR[kind];
    // Presentation scale: each channel's fills are normalised over its own
    // compiled extremes so lo/hi stops stay distinguishable; the legend says so.
    const max = Math.max(ch.default.hi, ...(ch.regions ?? []).map((o) => o.value.hi), 1);
    const alpha = (v: number): number => 0.1 + 0.45 * (v / max);
    (ch.regions ?? []).forEach((o, i) => {
      if (!overrideActiveAt(o, step)) return; // the step selects the world — nothing lapsed renders as live
      const g = regionByName(config, o.region);
      const r = regionRect(g, p);
      const gid = `${prefix}-g-${kind}-${o.region}-${i}`;
      const degenerate = o.value.lo === o.value.hi;
      if (degenerate) {
        // An observed fact (lo = hi) is the one case a single stop is honest (DEC-14).
        defs.push(
          `<linearGradient id="${gid}"><stop offset="0" stop-color="${colour}" stop-opacity="${alpha(o.value.hi).toFixed(3)}"/></linearGradient>`,
        );
      } else {
        // Hard two-stop split: left half = lo, right half = hi. No interpolation.
        const aLo = alpha(o.value.lo).toFixed(3);
        const aHi = alpha(o.value.hi).toFixed(3);
        defs.push(
          `<linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${colour}" stop-opacity="${aLo}"/><stop offset="0.5" stop-color="${colour}" stop-opacity="${aLo}"/><stop offset="0.5" stop-color="${colour}" stop-opacity="${aHi}"/><stop offset="1" stop-color="${colour}" stop-opacity="${aHi}"/></linearGradient>`,
        );
      }
      const rw = relWidth(o.value);
      const hatch = rw === 0 ? '' : rw < 0.5 ? `${prefix}-hatch-light` : `${prefix}-hatch-dense`;
      const src = o.source ?? 'unsourced';
      const ko = o.source ? opts.knowledgeById?.[o.source] : undefined;
      const owner = ko?.provenance?.owner;
      const window =
        o.from_step !== undefined || o.until_step !== undefined
          ? ` · steps ${o.from_step ?? 0}–${o.until_step ?? '∞'}`
          : '';
      const title = `${kind} over ${o.region}: [${o.value.lo}, ${o.value.hi}] ${o.value.unit} — ${src}${owner ? ` · ${owner}` : ''}${window} (assessment, not fact)`;
      const sig = `${o.value.lo}-${o.value.hi} ${o.value.unit}|${src}|${o.from_step ?? ''}-${o.until_step ?? ''}`;
      surfaces.push(
        `<g class="coa-surface" data-glow-id="coa:cell:${esc(kind)}:${esc(o.region)}" data-glow-sig="${esc(sig)}" data-kind="${esc(kind)}" data-region="${esc(o.region)}" data-band-lo="${o.value.lo}" data-band-hi="${o.value.hi}" data-band-unit="${esc(o.value.unit)}" data-source="${esc(src)}"><rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="url(#${gid})"/>${hatch ? `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="url(#${hatch})"/>` : ''}<title>${esc(title)}</title></g>`,
      );
    });
  }
  // Hatch patterns: density encodes the band's relative width (never its value).
  defs.push(
    `<pattern id="${prefix}-hatch-light" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" stroke="#1B2732" stroke-opacity="0.12" stroke-width="1"/></pattern>`,
    `<pattern id="${prefix}-hatch-dense" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="4" stroke="#1B2732" stroke-opacity="0.18" stroke-width="1"/></pattern>`,
  );

  // ---- regions: every config box outlined and named --------------------------
  const regions = config.regions
    .map((g) => {
      const r = regionRect(g, p);
      return `<g class="coa-region" data-region="${esc(g.name)}"><rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="none" stroke="#5B6B77" stroke-opacity="0.5" stroke-width="1" stroke-dasharray="3 2"/><text x="${r.x + 3}" y="${r.y + 11}" font-family="ui-monospace,monospace" font-size="8.5" fill="#5B6B77">${esc(g.name)}</text><title>${esc(g.name)}: cells (${g.x0},${g.y0})–(${g.x1},${g.y1})</title></g>`;
    })
    .join('');

  // ---- routes: stated legs only (DEC-20), waypoints draggable by the shell ---
  const routes: string[] = [];
  plans.forEach((plan, pi) => {
    const dash = pi === 0 ? '' : ' stroke-dasharray="6 4"';
    for (const ep of plan.elements) {
      const legs = ep.route ?? [];
      if (legs.length === 0) continue;
      const colour = elementColour(ep.force_element);
      const pts = legs.map((l) => `${p.cx(l.x).toFixed(1)},${p.cy(l.y).toFixed(1)}`).join(' ');
      const wps = legs
        .map((l, i) => {
          const active = legActiveAt(l, step);
          const inRegions = legRegions(config, l);
          const title = `${plan.logical_id} · ${ep.force_element} leg ${i}: (${l.x},${l.y}) steps ${l.enter_step}–${l.exit_step}${inRegions.length ? ` · in: ${inRegions.join(', ')}` : ' · open water (no named region)'}`;
          return `<circle class="coa-wp" data-plan="${esc(plan.logical_id)}" data-element="${esc(ep.force_element)}" data-leg="${i}" data-glow-id="coa:wp:${esc(plan.logical_id)}:${esc(ep.force_element)}:${i}" data-glow-sig="${l.x},${l.y}@${l.enter_step}-${l.exit_step}" cx="${p.cx(l.x).toFixed(1)}" cy="${p.cy(l.y).toFixed(1)}" r="${active ? 6 : 4}" fill="${colour}" fill-opacity="${active ? 1 : 0.75}" stroke="#FFFFFF" stroke-width="1.2"><title>${esc(title)}</title></circle>`;
        })
        .join('');
      routes.push(
        `<g class="coa-route" data-plan="${esc(plan.logical_id)}" data-element="${esc(ep.force_element)}"><polyline points="${pts}" fill="none" stroke="${colour}" stroke-width="2" stroke-opacity="0.85"${dash}/>${wps}</g>`,
      );
    }
  });

  // ---- legend ---------------------------------------------------------------
  const chanKeys = wanted
    .map((kind) => {
      const colour = CHANNEL_COLOUR[kind];
      return `<span style="display:inline-flex;align-items:center;gap:4px;margin-right:12px"><svg width="26" height="12" aria-hidden="true"><rect x="0" y="0" width="13" height="12" fill="${colour}" fill-opacity="0.18"/><rect x="13" y="0" width="13" height="12" fill="${colour}" fill-opacity="0.5"/></svg><span>${esc(kind)}</span></span>`;
    })
    .join('');
  const elemKeys = Object.entries(ELEMENT_COLOUR)
    .filter(([id]) => plans.some((pl) => pl.elements.some((e) => e.force_element === id)))
    .map(
      ([id, colour]) =>
        `<span style="display:inline-flex;align-items:center;gap:4px;margin-right:12px"><span style="width:14px;height:2px;background:${colour};display:inline-block"></span><span>${esc(id)}</span></span>`,
    )
    .join('');
  const planKeys = plans
    .map(
      (pl, pi) =>
        `<span style="display:inline-flex;align-items:center;gap:4px;margin-right:12px"><svg width="22" height="6" aria-hidden="true"><line x1="0" y1="3" x2="22" y2="3" stroke="#1B2732" stroke-width="2"${pi === 0 ? '' : ' stroke-dasharray="6 4"'}/></svg><span>${esc(pl.logical_id)} · ${esc(pl.name)}</span></span>`,
    )
    .join('');
  const legend = `<div class="coa-map-legend" style="font-family:ui-monospace,monospace;font-size:10.5px;color:#5B6B77;margin-top:6px;line-height:1.9">
  <div>${chanKeys}<span style="display:inline-flex;align-items:center;gap:4px;margin-right:12px"><svg width="26" height="12" aria-hidden="true"><rect width="26" height="12" fill="#EDF0F2"/><line x1="0" y1="12" x2="12" y2="0" stroke="#1B2732" stroke-opacity="0.3"/><line x1="8" y1="12" x2="20" y2="0" stroke="#1B2732" stroke-opacity="0.3"/><line x1="16" y1="12" x2="26" y2="2" stroke="#1B2732" stroke-opacity="0.3"/></svg><span>hatch density = band width</span></span></div>
  <div>${elemKeys}</div>
  <div>${planKeys}</div>
  <div>A split fill is the band's two bounds — there is no single value; hover any surface for its exact [lo, hi] unit and named source. Fill intensity is normalised per channel (presentation scale, not data).</div>
</div>`;

  return `<div class="assay-coa-map" data-step="${step}">
<svg viewBox="0 0 ${p.width} ${p.height}" width="${p.width}" height="${p.height}" role="img" aria-label="Meridian grid ${config.grid.cols}×${config.grid.rows}, step ${step}" style="background:#F6F8F9;border:1px solid #D8DFE4;border-radius:6px;max-width:100%;height:auto">
<defs>${defs.join('')}</defs>
<g class="coa-surfaces">${surfaces.join('')}</g>
<g class="coa-regions">${regions}</g>
<g class="coa-routes">${routes.join('')}</g>
</svg>
${legend}
</div>`;
}
