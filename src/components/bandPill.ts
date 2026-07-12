/**
 * SPEC-14 — band pill: the demonstrator's signature component.
 *
 * Renders a Band as lo–hi within a track. Framework-free (HTML string),
 * self-contained styling, and dependent ONLY on generated LinkML types —
 * the extractability constraint (delivery plan SPEC-14): no app state,
 * no service calls, no store.
 *
 * There is deliberately no midpoint anywhere in this component (DEC-15):
 * no marker, no centre tick, no title-attribute average.
 */
import type { Band } from '../generated/types.js';

export interface BandPillOptions {
  /** Track extent for proportional width; defaults pad the band by 50%. */
  trackLo?: number;
  trackHi?: number;
  label?: string;
}

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function bandPill(band: Band, opts: BandPillOptions = {}): string {
  const span = band.hi - band.lo;
  const pad = span > 0 ? span / 2 : Math.max(Math.abs(band.hi) / 2, 1);
  const trackLo = opts.trackLo ?? band.lo - pad;
  const trackHi = opts.trackHi ?? band.hi + pad;
  const extent = trackHi - trackLo || 1;
  const leftPct = ((band.lo - trackLo) / extent) * 100;
  const widthPct = Math.max(((band.hi - band.lo) / extent) * 100, 1.5); // degenerate bands stay visible
  const isDegenerate = band.lo === band.hi;
  const text = isDegenerate ? `${band.lo} ${band.unit}` : `${band.lo}–${band.hi} ${band.unit}`;

  return `<span class="assay-band" style="display:inline-block;min-width:180px;font-family:ui-monospace,monospace;font-size:11px">
  <span style="display:flex;justify-content:space-between;color:#5B6B77">
    <span>${trackLo}</span><span style="color:#1B2732;font-weight:600">${esc(opts.label ?? '')}${opts.label ? ' · ' : ''}${esc(text)}</span><span>${trackHi}</span>
  </span>
  <span style="position:relative;display:block;height:8px;background:#EDF0F2;border:1px solid #D8DFE4;border-radius:4px;margin-top:2px">
    <span style="position:absolute;top:1px;bottom:1px;border-radius:3px;background:${isDegenerate ? '#14655F' : '#9A6A14'};opacity:.55;left:${leftPct.toFixed(2)}%;width:${widthPct.toFixed(2)}%"></span>
  </span>
</span>`;
}
