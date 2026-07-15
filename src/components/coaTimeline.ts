/**
 * SPEC-19 — the temporal companion (research note `10-spatial-temporal.md` §3/§4b–c).
 *
 * One shared step axis carrying: knowledge validity windows (with the
 * supersession edge and superseded-not-compiled marking), the compiled channel
 * windows including the lapsed tail (thesis F — a lapsed band is marked, never
 * silently carried forward), the storm ridge as a FLAT banded rectangle (the
 * compiled surface has no per-step variation, so none is drawn; a stated peak
 * renders only as a quoted, attributed annotation — never a synthesised
 * curve), each plan's task windows (route legs as discrete extents), and the
 * exposure profile — the C4 staircase of cumulative [lo, hi] extents that
 * steps ONLY at leg boundaries (mapProject.exposureProfile replays the real
 * metric). No path in this SVG uses a curve command; there is nothing honest a
 * curve could draw here.
 *
 * Framework-free HTML/SVG string; generated types + pure mapProject types
 * only; no service, no state (SPEC-14 extractability).
 */
import type { Band, CompiledWorld, KnowledgeObject, Plan, VignetteConfig } from '../generated/types.js';
import type { ProfilePoint } from '../mapProject.js';

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const MONO = 'ui-monospace,monospace';

export interface TimelineAnnotation {
  /** Quoted, attributed text (note 10 §3.3) — e.g. “surge peaking D+5–D+7” — METOC (K9). */
  label: string;
  from_step: number;
  until_step: number;
  source: string;
}

export interface TimelineSupersession {
  from: string; // superseded lineage (K5)
  to: string; // superseding lineage (K9)
}

export interface ExposureProfileInput {
  plan: string;
  element: string;
  points: ProfilePoint[];
  unit: string;
  /** Commitment context for the threshold rule (e.g. C4 at_most 12). */
  threshold?: { commitment: string; value: number };
}

export interface CoaTimelineOptions {
  step?: number;
  width?: number;
  /** Knowledge objects whose validity windows render (compiled or superseded). */
  knowledge?: KnowledgeObject[];
  supersessions?: TimelineSupersession[];
  annotations?: TimelineAnnotation[];
  profiles?: ExposureProfileInput[];
  idPrefix?: string;
}

const bandText = (b: Band): string => (b.lo === b.hi ? `${b.lo} ${b.unit}` : `${b.lo}–${b.hi} ${b.unit}`);

export function coaTimeline(
  world: CompiledWorld,
  config: VignetteConfig,
  plans: Plan[],
  opts: CoaTimelineOptions = {},
): string {
  const prefix = opts.idPrefix ?? 'coatl';
  const width = opts.width ?? 720;
  const horizon = config.grid.horizon_steps;
  const labelW = 170;
  const pad = 10;
  const plotW = width - labelW - 2 * pad;
  const sx = (t: number): number => labelW + pad + (t / horizon) * plotW;

  const rows: string[] = [];
  let y = 26;
  const rowLabel = (text: string, yy: number, colour = '#5B6B77'): string =>
    `<text x="${labelW - 4}" y="${yy}" text-anchor="end" font-family="${MONO}" font-size="9.5" fill="${colour}">${esc(text)}</text>`;

  // ---- knowledge validity windows + supersession edges ------------------------
  const compiledSources = new Set(
    world.channels.flatMap((c) => (c.regions ?? []).map((o) => o.source).filter(Boolean) as string[]),
  );
  const koY = new Map<string, number>();
  for (const ko of opts.knowledge ?? []) {
    if (!ko.validity || !ko.answer) continue;
    const from = ko.validity.valid_from;
    const until = ko.validity.valid_until;
    const compiled = compiledSources.has(ko.logical_id);
    const colour = compiled ? '#2F5D8A' : '#8B959C';
    const label = `${ko.logical_id} · ${bandText(ko.answer)}`;
    const title = `${ko.logical_id}: ${bandText(ko.answer)}, valid steps ${from}–${until}${compiled ? ' (compiled)' : ' (superseded — not compiled)'} — ${ko.provenance?.owner ?? 'unowned'} (assessment, not fact)`;
    koY.set(ko.logical_id, y);
    rows.push(
      rowLabel(label, y + 9, compiled ? '#1B2732' : '#8B959C'),
      `<g data-glow-id="coa:win:${esc(ko.logical_id)}" data-glow-sig="${from}-${until}|${ko.answer.lo}-${ko.answer.hi}"><rect x="${sx(from).toFixed(1)}" y="${y}" width="${(sx(until) - sx(from)).toFixed(1)}" height="12" fill="${colour}" fill-opacity="${compiled ? 0.5 : 0.25}" stroke="${colour}" stroke-width="1"${compiled ? '' : ' stroke-dasharray="3 2"'} rx="2"/><title>${esc(title)}</title></g>`,
    );
    if (!compiled) {
      rows.push(
        `<text x="${sx(until) + 6}" y="${y + 9}" font-family="${MONO}" font-size="8.5" fill="#8B959C">superseded — not compiled</text>`,
      );
    }
    y += 20;
  }
  for (const s of opts.supersessions ?? []) {
    const toKo = (opts.knowledge ?? []).find((k) => k.logical_id === s.to);
    const yFrom = koY.get(s.from);
    const yTo = koY.get(s.to);
    if (!toKo?.validity || yFrom === undefined || yTo === undefined) continue;
    const xEdge = sx(toKo.validity.valid_from);
    const y0 = Math.min(yFrom, yTo) + 6;
    const y1 = Math.max(yFrom, yTo) + 6;
    rows.push(
      `<g class="coa-supersession"><line x1="${xEdge.toFixed(1)}" y1="${y0}" x2="${xEdge.toFixed(1)}" y2="${y1}" stroke="#A33131" stroke-width="1.5"/><text x="${xEdge + 4}" y="${y0 + (y1 - y0) / 2 + 3}" font-family="${MONO}" font-size="8.5" fill="#A33131">${esc(s.to)} supersedes ${esc(s.from)}</text><title>${esc(`${s.to} supersedes ${s.from} (cross-lineage, DEC-21): the ${s.from} window is overtaken from step ${toKo.validity.valid_from}`)}</title></g>`,
    );
  }
  y += 6;

  // ---- compiled channel windows, with the lapsed tail marked ------------------
  for (const ch of world.channels) {
    const windowed = (ch.regions ?? []).filter((o) => o.from_step !== undefined || o.until_step !== undefined);
    if (windowed.length === 0) continue;
    for (const o of windowed) {
      const from = o.from_step ?? 0;
      const until = o.until_step ?? horizon;
      const label = `${ch.kind}.${o.region}`;
      const title = `compiled ${ch.kind} over ${o.region}: [${o.value.lo}, ${o.value.hi}] ${o.value.unit}, active steps ${from}–${until} — ${o.source ?? 'unsourced'}`;
      rows.push(
        rowLabel(label, y + 9, '#1B2732'),
        `<g data-glow-id="coa:chwin:${esc(ch.kind)}:${esc(o.region)}" data-glow-sig="${from}-${until}|${o.value.lo}-${o.value.hi}"><rect x="${sx(from).toFixed(1)}" y="${y}" width="${(sx(until) - sx(from)).toFixed(1)}" height="12" fill="#2F5D8A" fill-opacity="0.5" rx="2"/><title>${esc(title)}</title></g>`,
      );
      if (until < horizon) {
        // The lapsed tail: beyond the window the channel falls back to its
        // default band — marked, never silently carried forward (thesis F).
        rows.push(
          `<g class="coa-lapsed"><rect x="${sx(until).toFixed(1)}" y="${y}" width="${(sx(horizon) - sx(until)).toFixed(1)}" height="12" fill="none" stroke="#8B959C" stroke-dasharray="2 3" rx="2"/><text x="${(sx(until) + 5).toFixed(1)}" y="${y + 9}" font-family="${MONO}" font-size="8.5" fill="#8B959C">lapsed → default ${esc(bandText(ch.default))}</text></g>`,
        );
      }
      y += 20;
    }
  }
  y += 6;

  // ---- the storm ridge: a flat banded rectangle + quoted annotations ----------
  const storm = world.channels.find((c) => c.kind === 'storm');
  const stormOv = (storm?.regions ?? []).filter((o) => o.value.hi > 0);
  if (stormOv.length > 0) {
    const ridgeH = 44;
    const vmax = Math.max(...stormOv.map((o) => o.value.hi)) * 1.15;
    const vy = (v: number): number => y + ridgeH - (v / vmax) * ridgeH;
    rows.push(rowLabel('storm surge (banded)', y + ridgeH / 2, '#1B2732'));
    for (const o of stormOv) {
      const from = o.from_step ?? 0;
      const until = o.until_step ?? horizon;
      const top = vy(o.value.hi);
      const bot = vy(o.value.lo);
      const title = `storm surge over ${o.region}: [${o.value.lo}, ${o.value.hi}] ${o.value.unit}, steps ${from}–${until} — ${o.source ?? 'unsourced'} (flat: the compiled band has no per-step variation)`;
      rows.push(
        `<g data-glow-id="coa:ridge:${esc(o.region)}" data-glow-sig="${o.value.lo}-${o.value.hi}|${from}-${until}"><rect x="${sx(from).toFixed(1)}" y="${top.toFixed(1)}" width="${(sx(until) - sx(from)).toFixed(1)}" height="${(bot - top).toFixed(1)}" fill="#2F5D8A" fill-opacity="0.35" stroke="#2F5D8A" stroke-width="1"/><title>${esc(title)}</title></g>`,
        `<text x="${sx(from) + 4}" y="${(top + 10).toFixed(1)}" font-family="${MONO}" font-size="8.5" fill="#2F5D8A">${esc(bandText(o.value))}</text>`,
      );
    }
    for (const a of opts.annotations ?? []) {
      const x0 = sx(a.from_step);
      const x1 = sx(a.until_step);
      const yy = y - 2;
      rows.push(
        `<g class="coa-annotation"><line x1="${x0.toFixed(1)}" y1="${yy}" x2="${x1.toFixed(1)}" y2="${yy}" stroke="#9A6A14" stroke-width="1.5"/><line x1="${x0.toFixed(1)}" y1="${yy - 3}" x2="${x0.toFixed(1)}" y2="${yy + 3}" stroke="#9A6A14" stroke-width="1.5"/><line x1="${x1.toFixed(1)}" y1="${yy - 3}" x2="${x1.toFixed(1)}" y2="${yy + 3}" stroke="#9A6A14" stroke-width="1.5"/><text x="${((x0 + x1) / 2).toFixed(1)}" y="${yy - 5}" text-anchor="middle" font-family="${MONO}" font-size="8.5" fill="#9A6A14">${esc(a.label)}</text><title>${esc(`Quoted statement, steps ${a.from_step}–${a.until_step} — attributed to ${a.source}; rendered as an annotation, never a curve (note 10 §3.3)`)}</title></g>`,
      );
    }
    y += ridgeH + 14;
  }

  // ---- task windows: each plan's route legs as discrete extents ---------------
  plans.forEach((plan, pi) => {
    const dash = pi === 0 ? '' : ' stroke-dasharray="5 3"';
    for (const ep of plan.elements) {
      const legs = ep.route ?? [];
      if (legs.length === 0) continue;
      rows.push(rowLabel(`${plan.logical_id} · ${ep.force_element}`, y + 8, '#1B2732'));
      legs.forEach((l, i) => {
        const title = `${plan.logical_id} · ${ep.force_element} leg ${i}: waypoint (${l.x},${l.y}), steps ${l.enter_step}–${l.exit_step}`;
        rows.push(
          `<g data-glow-id="coa:task:${esc(plan.logical_id)}:${esc(ep.force_element)}:${i}" data-glow-sig="${l.x},${l.y}@${l.enter_step}-${l.exit_step}"><rect x="${sx(l.enter_step).toFixed(1)}" y="${y}" width="${Math.max(sx(l.exit_step) - sx(l.enter_step), 2).toFixed(1)}" height="10" fill="#3E5D8A" fill-opacity="${0.35 + 0.25 * (i % 2)}" stroke="#3E5D8A" stroke-width="1"${dash} rx="2"/><title>${esc(title)}</title></g>`,
        );
      });
      y += 18;
    }
    y += 4;
  });
  y += 4;

  // ---- exposure profiles: the staircase of cumulative bands -------------------
  for (const prof of opts.profiles ?? []) {
    const profH = 56;
    const finalCum = prof.points.length > 0 ? prof.points[prof.points.length - 1]!.cum : { lo: 0, hi: 0, unit: prof.unit };
    const vmax = Math.max(finalCum.hi, prof.threshold?.value ?? 0, 1) * 1.15;
    const vy = (v: number): number => y + profH - (v / vmax) * profH;
    rows.push(rowLabel(`${prof.plan} · ${prof.element} exposure`, y + profH / 2, '#1B2732'));

    // Staircase path: horizontal runs + vertical risers at leg boundaries only.
    // Built for lo and hi cumulative bounds; the region between them is the band.
    const stairs = (pick: (b: Band) => number): string => {
      let d = `M ${sx(0).toFixed(1)} ${vy(0).toFixed(1)}`;
      let cur = 0;
      for (const pt of prof.points) {
        d += ` L ${sx(pt.exit_step).toFixed(1)} ${vy(cur).toFixed(1)}`; // flat run to the leg boundary
        cur = pick(pt.cum);
        d += ` L ${sx(pt.exit_step).toFixed(1)} ${vy(cur).toFixed(1)}`; // vertical riser (never a slope)
      }
      d += ` L ${sx(horizon).toFixed(1)} ${vy(cur).toFixed(1)}`;
      return d;
    };
    // Two staircases — the cumulative lo bound and hi bound. The space between
    // them IS the band; no single accumulation line exists to draw (DEC-15).
    const loPath = stairs((b) => b.lo);
    const hiPath = stairs((b) => b.hi);
    const sig = `${finalCum.lo}-${finalCum.hi} ${prof.unit}`;
    rows.push(
      `<g data-glow-id="coa:profile:${esc(prof.plan)}:${esc(prof.element)}" data-glow-sig="${esc(sig)}">`,
      `<path d="${hiPath}" fill="none" stroke="#9A6A14" stroke-width="1.5"/>`,
      `<path d="${loPath}" fill="none" stroke="#9A6A14" stroke-width="1.5" stroke-dasharray="4 3"/>`,
      `<title>${esc(`${prof.plan} · ${prof.element}: cumulative banded exposure, stepping only at leg boundaries; final [${finalCum.lo}, ${finalCum.hi}] ${prof.unit}`)}</title>`,
      `</g>`,
    );
    for (const pt of prof.points) {
      if (pt.leg.hi === 0) continue;
      const where = pt.regions.length ? pt.regions.join(', ') : 'open water';
      rows.push(
        `<g class="coa-riser"><circle cx="${sx(pt.exit_step).toFixed(1)}" cy="${vy(pt.cum.hi).toFixed(1)}" r="3" fill="#9A6A14"/><text x="${(sx(pt.exit_step) + 5).toFixed(1)}" y="${(vy(pt.cum.hi) - 4).toFixed(1)}" font-family="${MONO}" font-size="8.5" fill="#9A6A14">+[${pt.leg.lo}, ${pt.leg.hi}] in ${esc(where)}</text><title>${esc(`leg ${pt.legIndex} at (${pt.x},${pt.y}), steps ${pt.enter_step}–${pt.exit_step}: banks [${pt.leg.lo}, ${pt.leg.hi}] ${prof.unit} — waypoint in ${where}`)}</title></g>`,
      );
    }
    if (prof.threshold) {
      const ty = vy(prof.threshold.value);
      rows.push(
        `<line x1="${sx(0).toFixed(1)}" y1="${ty.toFixed(1)}" x2="${sx(horizon).toFixed(1)}" y2="${ty.toFixed(1)}" stroke="#A33131" stroke-width="1" stroke-dasharray="6 3"/><text x="${sx(horizon) - 4}" y="${(ty - 3).toFixed(1)}" text-anchor="end" font-family="${MONO}" font-size="8.5" fill="#A33131">${esc(`${prof.threshold.commitment} threshold ${prof.threshold.value} ${prof.unit}`)}</text>`,
      );
    }
    const endLabel = `[${finalCum.lo}, ${finalCum.hi}] ${prof.unit}`;
    rows.push(
      `<text x="${sx(horizon) - 4}" y="${(vy(finalCum.hi) - 12).toFixed(1)}" text-anchor="end" font-family="${MONO}" font-size="9" font-weight="700" fill="#9A6A14">${esc(endLabel)}</text>`,
    );
    y += profH + 18;
  }

  // ---- axis + scrub cursor -----------------------------------------------------
  const height = y + 26;
  const stepsPerDay = 24 / config.grid.timestep_hours;
  const axis: string[] = [
    `<line x1="${sx(0)}" y1="${y}" x2="${sx(horizon)}" y2="${y}" stroke="#5B6B77" stroke-width="1"/>`,
  ];
  for (let t = 0; t <= horizon; t += stepsPerDay) {
    axis.push(
      `<line x1="${sx(t).toFixed(1)}" y1="${y}" x2="${sx(t).toFixed(1)}" y2="${y + 4}" stroke="#5B6B77" stroke-width="1"/>`,
      t % (stepsPerDay * 2) === 0
        ? `<text x="${sx(t).toFixed(1)}" y="${y + 15}" text-anchor="middle" font-family="${MONO}" font-size="8.5" fill="#5B6B77">D+${t / stepsPerDay}</text>`
        : '',
    );
  }
  const cursor =
    opts.step !== undefined
      ? `<g class="coa-cursor"><line x1="${sx(opts.step).toFixed(1)}" y1="18" x2="${sx(opts.step).toFixed(1)}" y2="${y}" stroke="#1B2732" stroke-width="1" stroke-opacity="0.6"/><text x="${(sx(opts.step) + 3).toFixed(1)}" y="16" font-family="${MONO}" font-size="9" fill="#1B2732">step ${opts.step}</text></g>`
      : '';

  return `<div class="assay-coa-timeline">
<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="Meridian temporal companion: validity windows, task windows, storm ridge, exposure profile" style="background:#F6F8F9;border:1px solid #D8DFE4;border-radius:6px;max-width:100%;height:auto">
${rows.join('\n')}
${axis.join('')}
${cursor}
</svg>
<div class="coa-timeline-legend" style="font-family:${MONO};font-size:10.5px;color:#5B6B77;margin-top:6px;line-height:1.8">Windows are discrete extents — between and beyond them the state is unknown or lapsed, never interpolated. The storm ridge is flat because the compiled band is flat; the bracketed peak is a quoted statement, not a computed curve. The exposure staircase steps only at leg boundaries; solid = hi bound, dashed = lo bound.</div>
</div>`;
}
