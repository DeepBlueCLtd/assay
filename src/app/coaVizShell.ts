/**
 * SPEC-19 — the COA-visualisation shell (DOM wiring; all state in CoaVizState).
 *
 * Two interaction classes, both honest by construction (note 10 §5):
 *  - UNDERSTANDING — the step slider is pure selection over the compiled world
 *    (no recompute, and no glow: nothing upstream changed); hovering a surface
 *    or waypoint shows its exact banded payload through bandPill.
 *  - INPUT — dragging a waypoint or shifting a task window authors a new Plan
 *    version and re-scores through the real pipeline; editing a band endpoint
 *    is a gated knowledge supersede. After an input the value-keyed glow
 *    (src/app/glow.ts, reused verbatim) marks exactly the units whose
 *    displayed value moved (G6). A dishonest input renders its Refusal in
 *    place and persists nothing (G2/G5). Nothing here optimises on the
 *    operator's behalf (DEC-31(d)).
 */
import type { CoaVizState } from './coaViz.js';
import { changedGlowUnits, type SignatureMap } from './glow.js';
import { cellAtPixel, makeProjection } from '../mapProject.js';
import { bandPill } from '../components/bandPill.js';
import type { GridSpec } from '../generated/types.js';

const GLOW_MS = 10_000;
const MAP_WIDTH = 640;
const MAP_PAD = 10;

const STYLES = `
:root{--ink:#1B2732;--muted:#5B6B77;--line:#D8DFE4;--paper:#FCFDFD;--wash:#EDF0F2}
*{box-sizing:border-box}
.coaviz{max-width:1200px;margin:0 auto;padding:20px 24px 64px;font-family:system-ui,sans-serif;color:var(--ink);font-size:14px;line-height:1.5}
.coaviz-panel{background:var(--paper);border:1px solid var(--line);border-radius:8px;padding:14px;margin:14px 0;overflow-x:auto}
.coaviz-panel h3{margin:0 0 8px;font-size:14px}
.coaviz-controls{background:#EEF2F6;border:1px solid var(--line);border-radius:8px;padding:12px 14px;margin:14px 0;display:flex;gap:16px;flex-wrap:wrap;align-items:flex-end}
.coaviz-controls label{display:block;font-size:11px;color:var(--muted);margin-bottom:3px}
.coaviz-controls input{font-size:12px;padding:4px 6px;border:1px solid var(--line);border-radius:4px}
.coaviz-btn{appearance:none;border:1px solid #2C4A6E;background:#3E5D8A;color:#fff;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600}
.coaviz-btn.danger{background:#8A2020;border-color:#6E1A1A}
.coaviz-btn.secondary{background:#fff;color:#3E5D8A}
@keyframes assayGlow{0%{background:rgba(244,196,48,.55);box-shadow:0 0 0 3px rgba(244,196,48,.55)}100%{background:transparent;box-shadow:0 0 0 3px transparent}}
.assay-glow{animation:assayGlow ${GLOW_MS}ms ease-out}
svg .assay-glow{animation:none;outline:3px solid rgba(244,196,48,.8);outline-offset:2px}
.coa-wp{cursor:grab}
.coa-wp:active{cursor:grabbing}
.coaviz-inspector{min-height:64px;background:var(--wash);border:1px dashed var(--line);border-radius:8px;padding:10px 14px;font-size:12px;color:var(--muted)}
.coaviz-notice{margin:10px 0}
`;

export function mountCoaViz(root: HTMLElement, state: CoaVizState, grid: GridSpec): void {
  const doc = root.ownerDocument;
  const style = doc.createElement('style');
  style.textContent = STYLES;
  doc.head.appendChild(style);

  root.innerHTML = `
  <div class="coaviz">
    <div class="coaviz-controls" id="coaviz-controls">
      <div style="flex:1;min-width:260px">
        <label for="coaviz-step">Scrub the clock — step <b id="coaviz-step-label">${state.step}</b> (selection over the compiled world; no recompute)</label>
        <input type="range" id="coaviz-step" min="0" max="${grid.horizon_steps}" step="1" value="${state.step}" style="width:100%">
      </div>
      <div>
        <label>Shift FE-ANVIL's dwell (P1 leg 1) — a task-window edit, re-scored live</label>
        <button class="coaviz-btn secondary" id="coaviz-shift-back">−4 steps</button>
        <button class="coaviz-btn secondary" id="coaviz-shift-fwd">+4 steps</button>
      </div>
      <div>
        <label for="coaviz-k6-lo">Edit K6's band (FAC sortie rate) — a gated supersede</label>
        <input type="number" id="coaviz-k6-lo" value="2" step="0.5" style="width:64px"> –
        <input type="number" id="coaviz-k6-hi" value="6" step="0.5" style="width:64px"> sorties/day
        <button class="coaviz-btn" id="coaviz-k6-apply">Supersede</button>
      </div>
      <div>
        <label>A dishonest input (refused in place, persists nothing — G2/G5)</label>
        <button class="coaviz-btn danger" id="coaviz-dishonest">Assert K8 as hard fact (drop its waiver)</button>
      </div>
    </div>
    <div class="coaviz-notice" id="coaviz-notice"></div>
    <div class="coaviz-inspector" id="coaviz-inspector">Hover any banded surface, waypoint or window for its exact [lo, hi] and named source. Drag a waypoint to author a new plan version — the verdicts re-score through the real pipeline and what changed glows (G6).</div>
    <div id="coaviz-sections"></div>
  </div>`;

  const sectionsRoot = root.querySelector('#coaviz-sections') as HTMLElement;
  const noticeEl = root.querySelector('#coaviz-notice') as HTMLElement;
  const inspector = root.querySelector('#coaviz-inspector') as HTMLElement;
  const stepInput = root.querySelector('#coaviz-step') as HTMLInputElement;
  const stepLabel = root.querySelector('#coaviz-step-label') as HTMLElement;

  let prevSig: SignatureMap = new Map();
  let firstRender = true;

  const harvest = (): SignatureMap => {
    const map: SignatureMap = new Map();
    for (const el of Array.from(sectionsRoot.querySelectorAll('[data-glow-id]')) as HTMLElement[]) {
      map.set(el.dataset.glowId as string, el.dataset.glowSig ?? '');
    }
    return map;
  };

  function glow(el: HTMLElement | SVGElement): void {
    el.classList.remove('assay-glow');
    void (el as HTMLElement).getBoundingClientRect();
    el.classList.add('assay-glow');
    doc.defaultView?.setTimeout(() => el.classList.remove('assay-glow'), GLOW_MS);
  }

  /**
   * Re-render. `glowDiff` is true after an INPUT (something upstream may have
   * changed — diff and glow it, G6) and false after a scrub (pure selection —
   * glow silence is the honest report: nothing changed).
   */
  async function rerender(glowDiff: boolean): Promise<void> {
    const snap = await state.snapshot();
    noticeEl.innerHTML = snap.notice ? snap.notice.html : '';
    sectionsRoot.innerHTML = '';
    for (const s of snap.sections) {
      const el = doc.createElement('div');
      el.className = 'coaviz-panel';
      el.dataset.section = s.id;
      el.innerHTML = `<h3>${s.title}</h3>${s.html}`;
      sectionsRoot.appendChild(el);
    }
    const nextSig = harvest();
    if (!firstRender && glowDiff) {
      const changed = changedGlowUnits(prevSig, nextSig);
      for (const el of Array.from(sectionsRoot.querySelectorAll('[data-glow-id]')) as HTMLElement[]) {
        if (changed.has(el.dataset.glowId as string)) glow(el);
      }
    }
    prevSig = nextSig;
    firstRender = false;
    wireMap();
    wireHover();
  }

  // ---- understanding: scrub (selection, never a recompute, never a glow) ----
  stepInput.addEventListener('input', () => {
    state.setStep(Number(stepInput.value));
    stepLabel.textContent = String(state.step);
    void rerender(false);
  });

  // ---- understanding: hover payloads (band pill + named source) -------------
  function wireHover(): void {
    for (const el of Array.from(sectionsRoot.querySelectorAll('[data-band-lo]')) as HTMLElement[]) {
      el.addEventListener('mouseenter', () => {
        const lo = Number(el.dataset.bandLo);
        const hi = Number(el.dataset.bandHi);
        const unit = el.dataset.bandUnit ?? '';
        const source = el.dataset.source ?? 'unsourced';
        const where = `${el.dataset.kind ?? ''} over ${el.dataset.region ?? ''}`;
        inspector.innerHTML = `<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><span style="font-family:ui-monospace,monospace;font-size:11px;font-weight:600;color:var(--ink)">${where}</span>${bandPill({ lo, hi, unit })}<span style="font-family:ui-monospace,monospace;font-size:11px">from <b>${source}</b> — assessment, not fact</span></div>`;
      });
    }
  }

  // ---- input: drag a waypoint (author a new Plan version, re-score) ---------
  const projection = makeProjection(grid, { width: MAP_WIDTH, pad: MAP_PAD });
  function wireMap(): void {
    const svg = sectionsRoot.querySelector('[data-section="map"] svg') as SVGSVGElement | null;
    if (!svg) return;
    let drag: { el: SVGCircleElement; plan: string; element: string; leg: number } | null = null;

    const toViewBox = (ev: PointerEvent): { x: number; y: number } => {
      const ctm = svg.getScreenCTM();
      if (!ctm) return { x: 0, y: 0 };
      const pt = new DOMPoint(ev.clientX, ev.clientY).matrixTransform(ctm.inverse());
      return { x: pt.x, y: pt.y };
    };

    for (const c of Array.from(svg.querySelectorAll('.coa-wp')) as SVGCircleElement[]) {
      c.addEventListener('pointerdown', (ev) => {
        ev.preventDefault();
        drag = {
          el: c,
          plan: c.dataset.plan as string,
          element: c.dataset.element as string,
          leg: Number(c.dataset.leg),
        };
        c.setPointerCapture(ev.pointerId);
      });
      c.addEventListener('pointermove', (ev) => {
        if (!drag || drag.el !== c) return;
        const p = toViewBox(ev);
        c.setAttribute('cx', String(p.x));
        c.setAttribute('cy', String(p.y));
      });
      c.addEventListener('pointerup', (ev) => {
        if (!drag || drag.el !== c) return;
        const p = toViewBox(ev);
        const cell = cellAtPixel(grid, projection, p.x, p.y);
        const d = drag;
        drag = null;
        void state.moveWaypoint(d.plan, d.element, d.leg, cell.x, cell.y).then(() => rerender(true));
      });
    }
  }

  // ---- input: shift a task window / edit a band / the dishonest input -------
  (root.querySelector('#coaviz-shift-back') as HTMLElement).addEventListener('click', () => {
    void state.shiftWindow('P1', 'FE-ANVIL', 1, -4).then(() => rerender(true));
  });
  (root.querySelector('#coaviz-shift-fwd') as HTMLElement).addEventListener('click', () => {
    void state.shiftWindow('P1', 'FE-ANVIL', 1, 4).then(() => rerender(true));
  });
  (root.querySelector('#coaviz-k6-apply') as HTMLElement).addEventListener('click', () => {
    const lo = Number((root.querySelector('#coaviz-k6-lo') as HTMLInputElement).value);
    const hi = Number((root.querySelector('#coaviz-k6-hi') as HTMLInputElement).value);
    void state.editBand('K6', { lo, hi, unit: 'sorties/day' }).then(() => rerender(true));
  });
  (root.querySelector('#coaviz-dishonest') as HTMLElement).addEventListener('click', () => {
    void state.assertWithoutWaiver('K8').then(() => rerender(true));
  });

  void rerender(false);
}
