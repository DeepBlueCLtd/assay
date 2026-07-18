/**
 * SPEC-16 + Stage 7 — the interactive shell (the ONLY stateful, DOM-bearing layer).
 *
 * Renders the four role tabs by calling the PURE components (via AppState's
 * snapshot) — the shell/pure-component split that keeps SPEC-14 extractability
 * intact (research note 05 §2). It wires the interventions (resolve/reopen the
 * K12 contest, edit an assessed band), applies the glow to exactly the rows and
 * cells whose displayed VALUE changed (row/cell-level, value-keyed — G6 made
 * legible), and mounts the one-hop "informs / influenced by" trace menu.
 *
 * Stage 7 additions (research note 09):
 * - Five demonstration narratives as tab-order + presenter notes (DEC-23)
 * - Wall-projection mode: CSS-only `data-projection="wall"` toggle (note 09 §5)
 *
 * The glow is value-keyed: each pure component stamps every glow unit with a
 * stable `data-glow-id` and a `data-glow-sig` (the value it shows). The shell
 * diffs signatures by id, so a unit glows only when what the reader sees moved —
 * never merely because an unrelated upstream re-stamp re-derived it.
 *
 * Vanilla TS + DOM — no framework (note 05 §1). The 10s glow window is
 * display-only (DEC-17): it never touches content addressing.
 */
import type { AppState, TabId, Snapshot } from './state.js';
import { changedGlowUnits, changedTabs, type SignatureMap } from './glow.js';
import { writesEnabled, newDeltaCount, type HistoryCursor } from './history.js';
import { legend } from '../components/legends.js';
import { cellAtPixel, makeProjection } from '../mapProject.js';
import { depGraphRiver } from '../components/depGraphRiver.js';
import { depGraphSidebar } from '../components/depGraphSidebar.js';
import { NARRATIVES, SCRIPTING_PRINCIPLES, type Narrative, type NarrativeBeat } from '../narratives.js';
import { previewAct, applyArmedAct, ghostSummary, type ArmedAct } from '../preview.js';
import { ROLE_VERBS } from '../roleMenus.js';
import { roleMenu } from '../components/roleMenu.js';
import { challengePanel } from '../components/challengePanel.js';

const TABS: { id: TabId; label: string; role: string }[] = [
  { id: 'j2', label: 'J-2 workbench', role: 'ROLE: J-2' },
  { id: 'planner', label: 'Planner', role: 'ROLE: J-3/5' },
  { id: 'commander', label: 'Commander', role: 'ROLE: COMD' },
  { id: 'coa', label: 'Spatial · COA', role: 'SURFACE: ALL ROLES' },
  { id: 'observer', label: 'Observer / bridge', role: 'ROLE: OBSERVER' },
];

const GLOW_MS = 10_000;

const STYLES = `
:root{--ink:#1B2732;--muted:#5B6B77;--line:#D8DFE4;--glow:#F4C430;}
*{box-sizing:border-box}
.assay-app{max-width:1600px;margin:0 auto;padding:20px 28px 64px;font-family:system-ui,sans-serif;color:var(--ink);font-size:14px;line-height:1.5}
.assay-tabbar{display:flex;gap:6px;flex-wrap:wrap;border-bottom:2px solid var(--ink);margin:14px 0 0}
.assay-tab{appearance:none;border:1px solid var(--line);border-bottom:none;background:#F1F3F5;color:var(--muted);padding:8px 14px;border-radius:8px 8px 0 0;cursor:pointer;font-size:13px;font-weight:600;position:relative}
.assay-tab[aria-selected="true"]{background:#fff;color:var(--ink);box-shadow:0 -2px 0 var(--ink) inset}
.assay-tab .role{display:block;font-size:9px;letter-spacing:.06em;color:#8091A0;font-weight:600}
.assay-panel{background:#FCFDFD;border:1px solid var(--line);border-radius:8px;padding:14px;margin:14px 0;overflow-x:auto}
.assay-panel h3{margin:0 0 8px;font-size:14px}
.assay-controls{background:#EEF2F6;border:1px solid var(--line);border-radius:8px;padding:12px 14px;margin:14px 0;display:flex;gap:14px;flex-wrap:wrap;align-items:flex-end}
.assay-controls label{display:block;font-size:11px;color:var(--muted);margin-bottom:3px}
.assay-controls input,.assay-controls select{font-size:12px;padding:4px 6px;border:1px solid var(--line);border-radius:4px}
.assay-btn{appearance:none;border:1px solid #2C4A6E;background:#3E5D8A;color:#fff;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600}
.assay-btn.secondary{background:#fff;color:#3E5D8A}
.assay-chip-clickable{cursor:pointer;text-decoration:underline dotted;border-radius:4px;padding:1px 3px;transition:background .15s,outline .15s}
.assay-chip-clickable:hover{background:rgba(62,93,138,.1);outline:1.5px solid rgba(62,93,138,.35);outline-offset:1px}
@keyframes assayGlow{0%{background:rgba(244,196,48,.55);box-shadow:0 0 0 3px rgba(244,196,48,.55)}100%{background:transparent;box-shadow:0 0 0 3px transparent}}
.assay-glow{animation:assayGlow ${GLOW_MS}ms ease-out}
.assay-tab.assay-glow{animation:assayGlow ${GLOW_MS}ms ease-out}
.assay-menu{position:absolute;z-index:50;background:#fff;border:1px solid var(--ink);border-radius:8px;box-shadow:0 6px 24px rgba(0,0,0,.18);padding:10px 12px;max-width:340px;font-size:12px}
.assay-menu h4{margin:6px 0 3px;font-size:10.5px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted)}
.assay-menu .row{padding:2px 0;font-family:ui-monospace,monospace;font-size:11px}
.assay-menu .edge{color:#8091A0}
.assay-notice{margin:10px 0}
.assay-dep-overlay{position:fixed;inset:0;z-index:100;background:rgba(27,39,50,.6);display:flex;align-items:stretch;justify-content:center}
.assay-dep-overlay-inner{background:#fff;margin:24px;border-radius:12px;display:flex;flex-direction:column;width:100%;max-width:1400px;overflow:hidden;box-shadow:0 12px 48px rgba(0,0,0,.25)}
.assay-dep-header{display:flex;justify-content:space-between;align-items:center;padding:12px 18px;border-bottom:1px solid var(--line)}
.assay-dep-body{display:flex;flex:1;overflow:hidden}
.assay-dep-river-pane{flex:1;overflow:auto;padding:14px 18px}
.assay-dep-sidebar-pane{width:320px;border-left:1px solid var(--line);overflow-y:auto;padding:14px;background:#FCFDFD}
.assay-dep-node:hover{filter:brightness(1.15)}

/* ---- narrative runner (Stage 7, note 09 §4) ---- */
.assay-narrative-bar{background:#EEF2F6;border:1px solid var(--line);border-radius:8px;padding:10px 14px;margin:10px 0;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.assay-narrative-bar select{font-size:12px;padding:4px 6px;border:1px solid var(--line);border-radius:4px}
.assay-narrative-bar .label{font-size:11px;color:var(--muted);font-weight:600}
.assay-narrator{background:#1B2732;color:#E8EEF2;border:1px solid #3E5D8A;border-radius:8px;padding:14px 18px;margin:10px 0;font-size:13px;line-height:1.6}
.assay-narrator .beat-title{font-weight:700;font-size:14px;margin-bottom:6px;color:#F4C430}
.assay-narrator .beat-count{font-size:11px;color:#8091A0;margin-bottom:8px}
.assay-narrator .presenter-note{font-size:12.5px;line-height:1.6}
.assay-narrator .doctrine{margin-top:10px;padding:8px 12px;border-left:3px solid #F4C430;background:rgba(244,196,48,.08);font-size:11.5px;font-style:italic;color:#C8D2DA}
.assay-narrator .centrepiece{margin-top:8px;font-size:11px;color:#F4C430;font-weight:600}
.assay-narrator .nav{display:flex;gap:8px;margin-top:12px}
.assay-narrator .nav button{appearance:none;border:1px solid #3E5D8A;background:#2C4A6E;color:#E8EEF2;padding:5px 12px;border-radius:5px;cursor:pointer;font-size:11px;font-weight:600}
.assay-narrator .nav button:disabled{opacity:.4;cursor:default}
.assay-narrator .principles{margin-top:10px;padding:8px 12px;background:rgba(255,255,255,.05);border-radius:4px;font-size:10.5px;color:#8091A0}
.assay-narrator .principles div{margin:2px 0}

/* ---- decision-history scrubber (SPEC-26 US1) ---- */
.assay-history-bar{background:#F3EFF9;border:1px solid #D8CBEE;border-radius:8px;padding:10px 14px;margin:10px 0;display:flex;gap:12px;align-items:center;flex-wrap:wrap}
.assay-history-bar .hlabel{font-size:11px;color:#5B3B8C;font-weight:700}
.assay-history-bar input[type=range]{flex:1;min-width:220px}
.assay-history-bar .seqpos{font-family:ui-monospace,monospace;font-size:11px;color:#5B3B8C;min-width:110px}
.assay-history-bar .assay-replay-banner{background:#5B3B8C;color:#fff;border-radius:6px;padding:3px 10px;font-size:11px;font-weight:600}
.assay-history-bar .assay-mnew{background:#F4C430;color:#1B2732;border-radius:10px;padding:2px 8px;font-size:10.5px;font-weight:700}
.assay-history-bar button{appearance:none;border:1px solid #5B3B8C;background:#fff;color:#5B3B8C;padding:4px 10px;border-radius:6px;cursor:pointer;font-size:11px;font-weight:600}
[data-replay="on"] .assay-controls{opacity:.5;pointer-events:none;filter:grayscale(.4)}
.assay-rtrace .row{padding:2px 0;font-family:ui-monospace,monospace;font-size:11px}

/* ---- wall-projection mode (note 09 §5) ---- */
[data-projection="wall"] .assay-app{font-size:24px;line-height:1.4;max-width:100%;padding:24px 32px 48px}
[data-projection="wall"] .assay-tabbar{display:none}
[data-projection="wall"] .assay-panel{font-size:20px;padding:20px}
[data-projection="wall"] .assay-panel h3{font-size:22px}
[data-projection="wall"] .assay-controls{display:none}
[data-projection="wall"] .assay-legend{display:none}
[data-projection="wall"] .assay-narrative-bar{font-size:18px}
[data-projection="wall"] .assay-narrator{font-size:22px;padding:20px 24px}
[data-projection="wall"] .assay-narrator .beat-title{font-size:26px}
[data-projection="wall"] .assay-narrator .presenter-note{font-size:22px}
[data-projection="wall"] .assay-narrator .doctrine{font-size:20px}
[data-projection="wall"] td,[data-projection="wall"] th{font-size:18px !important;padding:8px 12px !important}
[data-projection="wall"]{background:#111820;color:#E8EEF2}
[data-projection="wall"] .assay-app{color:#E8EEF2}
[data-projection="wall"] .assay-panel{background:#1B2732;border-color:#2C4A6E;color:#E8EEF2}
[data-projection="wall"] .assay-narrative-bar{background:#1B2732;border-color:#2C4A6E;color:#E8EEF2}
`;

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function mountShell(root: HTMLElement, app: AppState): void {
  const doc = root.ownerDocument;
  const style = doc.createElement('style');
  style.textContent = STYLES;
  doc.head.appendChild(style);

  root.innerHTML = `
  <div class="assay-app">
    <h1 style="font-size:22px;margin:0">ASSAY — the seam, live</h1>
    <p style="font-size:12.5px;color:var(--muted);margin:4px 0 0">Four roles plus a shared <b>Spatial · COA</b> surface (DEC-36), one in-browser pipeline. Every edit re-runs the <b>real</b> compile → score → relax; a change in one role <b>glows</b> the roles and components it touches (the propagation graph, not an animation — G6). Meridian is engineered fiction (DEC-8); every assessed value is banded (G2).</p>
    <div class="assay-narrative-bar" id="assay-narrative-bar"></div>
    <div id="assay-narrator"></div>
    <div class="assay-history-bar" id="assay-history"></div>
    <div class="assay-controls" id="assay-controls"></div>
    <div class="assay-notice" id="assay-notice"></div>
    <div class="assay-ghost-mount" id="assay-ghost"></div>
    <div class="assay-tabbar" id="assay-tabbar"></div>
    <div id="assay-panels"></div>
  </div>`;

  const tabbar = root.querySelector('#assay-tabbar') as HTMLElement;
  const panelsRoot = root.querySelector('#assay-panels') as HTMLElement;
  const controls = root.querySelector('#assay-controls') as HTMLElement;
  const noticeEl = root.querySelector('#assay-notice') as HTMLElement;
  const ghostEl = root.querySelector('#assay-ghost') as HTMLElement;
  const narrativeBar = root.querySelector('#assay-narrative-bar') as HTMLElement;
  const narratorEl = root.querySelector('#assay-narrator') as HTMLElement;

  let activeTab: TabId = 'j2';
  let prevSig: SignatureMap = new Map();
  let firstRender = true;
  const pending = new Set<string>();

  // ---- decision-history cursor (SPEC-26 US1) ----
  const historyEl = root.querySelector('#assay-history') as HTMLElement;
  let cursor: HistoryCursor = { seq: app.historyMaxSeq, mode: 'live' };
  let headAtReplayEntry = app.historyMaxSeq;

  /** The snapshot the surfaces render: the live head, or a reconstructed past
   *  cursor in replay — the same pure pipeline either way (note 15 §2). */
  async function view(): Promise<Snapshot> {
    return cursor.mode === 'replay' ? app.reconstructAt(cursor.seq) : app.snapshot();
  }

  /** Build the history bar ONCE — the slider element must be stable across
   *  rerenders, or rebuilding its innerHTML mid-drag destroys the element under
   *  the pointer and the drag dies after one step. Wired here; only its value and
   *  the surrounding labels update on rerender (renderHistoryBar). */
  function initHistoryBar(): void {
    historyEl.innerHTML = `
      <span class="hlabel">Decision history</span>
      <input type="range" id="assay-hist-range" min="0" max="${app.historyMaxSeq}" step="1" value="${cursor.seq}">
      <span class="seqpos" id="assay-hist-seqpos"></span>
      <span id="assay-hist-status" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"></span>
      <div style="flex-basis:100%">${legend(['replay', 'recursive_trace'], { title: 'replay & recursive trace' })}</div>`;
    const range = root.querySelector('#assay-hist-range') as HTMLInputElement;
    range.addEventListener('input', () => {
      const seq = Number(range.value);
      if (cursor.mode === 'live') headAtReplayEntry = app.historyMaxSeq;
      cursor = { seq, mode: seq >= app.historyMaxSeq ? 'live' : 'replay' };
      void rerender();
    });
    // The "return to live" button is re-rendered into #assay-hist-status; delegate
    // its click so it survives every status refresh.
    historyEl.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).id === 'assay-hist-live') {
        cursor = { seq: app.historyMaxSeq, mode: 'live' };
        void rerender();
      }
    });
  }

  function renderHistoryBar(): void {
    const max = app.historyMaxSeq;
    const mNew = newDeltaCount(cursor, max, headAtReplayEntry);
    const range = root.querySelector('#assay-hist-range') as HTMLInputElement;
    range.max = String(max);
    // Never fight an active drag: only sync the thumb when the user isn't holding it.
    if (doc.activeElement !== range) range.value = String(cursor.seq);
    (root.querySelector('#assay-hist-seqpos') as HTMLElement).textContent = `seq ${cursor.seq} of ${max}`;
    (root.querySelector('#assay-hist-status') as HTMLElement).innerHTML =
      cursor.mode === 'replay'
        ? `<span class="assay-replay-banner">▶ replaying seq ${cursor.seq} of ${max} — record, not present</span>
           ${mNew > 0 ? `<span class="assay-mnew">${mNew} new at head</span>` : ''}
           <button id="assay-hist-live">Return to live head ▸</button>`
        : `<span style="font-size:10.5px;color:#5B6B77">the recorded heartbeat — scrub to replay any past belief-state (writes disabled in the past)</span>`;
    doc.documentElement.setAttribute('data-replay', cursor.mode === 'replay' ? 'on' : 'off');
  }

  /** Guard every write affordance behind the live head — a scrub is read-only
   *  (FR-004, US1 AS-3). A blocked write is a no-op, never a silent past edit. */
  function canWrite(): boolean {
    return writesEnabled(cursor);
  }

  // ---- narrative state ----
  let activeNarrative: Narrative | null = null;
  let beatIndex = 0;

  // ---- narrative bar ----
  narrativeBar.innerHTML = `
    <span class="label">Narrative:</span>
    <select id="assay-narrative-select">
      <option value="">— free exploration —</option>
      ${NARRATIVES.map((n) => `<option value="${n.id}">${esc(n.name)} (${esc(n.audience)})</option>`).join('')}
    </select>
    <label style="font-size:11px;color:var(--muted);display:flex;align-items:center;gap:4px;margin-left:auto">
      <input type="checkbox" id="assay-wall-toggle"> Wall projection
    </label>`;

  const narrativeSelect = root.querySelector('#assay-narrative-select') as HTMLSelectElement;
  const wallToggle = root.querySelector('#assay-wall-toggle') as HTMLInputElement;

  narrativeSelect.addEventListener('change', () => {
    const id = narrativeSelect.value;
    if (!id) {
      activeNarrative = null;
      beatIndex = 0;
      // Leaving a narrative returns to the live head (exit replay).
      cursor = { seq: app.historyMaxSeq, mode: 'live' };
      renderNarrator();
      void rerender();
      return;
    }
    const n = NARRATIVES.find((x) => x.id === id);
    if (n) {
      activeNarrative = n;
      beatIndex = 0;
      applyBeat();
    }
  });

  wallToggle.addEventListener('change', () => {
    if (wallToggle.checked) {
      doc.documentElement.setAttribute('data-projection', 'wall');
    } else {
      doc.documentElement.removeAttribute('data-projection');
    }
  });

  function applyBeat(): void {
    if (!activeNarrative) return;
    const beat = activeNarrative.beats[beatIndex];
    if (!beat) return;
    activeTab = beat.tab;
    // SPEC-26 (DEC-39) — a beat is a waypoint: drive the decision-history cursor
    // to its seq (replay if it is behind the head) and let the surfaces
    // reconstruct that belief-state. No bespoke beat mutation; the runner drives
    // the scrubber (note 15 §4). The SPEC-17 presenter view is unchanged.
    headAtReplayEntry = app.historyMaxSeq;
    cursor = { seq: beat.seq, mode: beat.seq >= app.historyMaxSeq ? 'live' : 'replay' };
    renderNarrator();
    void rerender();
  }

  function renderNarrator(): void {
    if (!activeNarrative) {
      narratorEl.innerHTML = '';
      return;
    }
    const n = activeNarrative;
    const beat = n.beats[beatIndex];
    if (!beat) {
      narratorEl.innerHTML = '';
      return;
    }
    const isCentrepiece = beatIndex === n.beats.length - 1;
    narratorEl.innerHTML = `<div class="assay-narrator">
      <div class="beat-title">${esc(beat.title)}</div>
      <div class="beat-count">${esc(n.name)} — beat ${beatIndex + 1} of ${n.beats.length} · ${esc(n.audience)}${n.leadTheses.length ? ` · theses ${n.leadTheses.join(', ')}` : ''}</div>
      <div class="presenter-note">${esc(beat.presenterNote)}</div>
      ${beat.doctrinalQuote ? `<div class="doctrine">${esc(beat.doctrinalQuote)}</div>` : ''}
      ${isCentrepiece ? `<div class="centrepiece">★ Centrepiece: ${esc(n.centrepiece)}</div>` : ''}
      <div style="margin-top:8px;font-size:10.5px;color:#8091A0">▶ scrubbed to seq ${beat.seq} of the record — reconstruction, not a scripted state</div>
      <div class="nav">
        <button id="assay-beat-prev" ${beatIndex === 0 ? 'disabled' : ''}>◀ Previous</button>
        <button id="assay-beat-next" ${beatIndex >= n.beats.length - 1 ? 'disabled' : ''}>Next ▶</button>
      </div>
      <details class="principles" style="cursor:pointer">
        <summary>Scripting principles (note 09 §4)</summary>
        ${SCRIPTING_PRINCIPLES.map((p, i) => `<div>${i + 1}. ${esc(p)}</div>`).join('')}
      </details>
    </div>`;

    const prevBtn = root.querySelector('#assay-beat-prev') as HTMLButtonElement;
    const nextBtn = root.querySelector('#assay-beat-next') as HTMLButtonElement;
    prevBtn?.addEventListener('click', () => {
      if (beatIndex > 0) { beatIndex--; applyBeat(); }
    });
    nextBtn?.addEventListener('click', () => {
      if (activeNarrative && beatIndex < activeNarrative.beats.length - 1) { beatIndex++; applyBeat(); }
    });
  }

  // ---- tab bar ----
  for (const t of TABS) {
    const btn = doc.createElement('button');
    btn.className = 'assay-tab';
    btn.dataset.tab = t.id;
    btn.setAttribute('aria-selected', String(t.id === activeTab));
    btn.innerHTML = `<span class="role">${t.role}</span>${t.label}`;
    btn.addEventListener('click', () => {
      activeTab = t.id;
      syncTabs();
      btn.classList.remove('assay-glow');
      flushPending();
    });
    tabbar.appendChild(btn);
  }

  // ---- controls (the interventions) ----
  const assessedIds = ['K1', 'K2', 'K3', 'K4', 'K6', 'K7', 'K8', 'K9'];
  controls.innerHTML = `
    <div>
      <button class="assay-btn" id="assay-resolve">Resolve K12 contest</button>
      <button class="assay-btn secondary" id="assay-reopen">Re-open contest</button>
    </div>
    <form id="assay-edit" style="display:flex;gap:8px;align-items:flex-end">
      <div><label>Edit assessed band</label><select id="assay-edit-id">${assessedIds
        .map((id) => `<option>${id}</option>`)
        .join('')}</select></div>
      <div><label>lo</label><input id="assay-edit-lo" type="number" step="any" style="width:70px"></div>
      <div><label>hi</label><input id="assay-edit-hi" type="number" step="any" style="width:70px"></div>
      <div><label>unit</label><input id="assay-edit-unit" style="width:70px" value="tonnes"></div>
      <button class="assay-btn secondary" type="submit">Supersede &amp; recompute</button>
    </form>
    <div style="flex:1;min-width:220px">
      <label for="assay-step">Spatial clock — step <b id="assay-step-label">${app.step}</b> (selection, no recompute)</label>
      <input type="range" id="assay-step" min="0" max="${app.grid.horizon_steps}" step="1" value="${app.step}" style="width:100%">
    </div>
    <div style="flex-basis:100%;border-top:1px dashed var(--line);padding-top:8px">
      <label style="font-size:11px;color:#5B3B8C;display:inline-flex;align-items:center;gap:5px;font-weight:600">
        <input type="checkbox" id="assay-preview-toggle"> Consequence preview — arm a write and see the ghost diff <b>before</b> committing (SPEC-25)
      </label>
    </div>`;

  // ---- consequence preview (US2): arm → ghost diff → commit / cancel ----
  const previewToggle = root.querySelector('#assay-preview-toggle') as HTMLInputElement;
  let armed: ArmedAct | null = null;
  const previewArmed = (): boolean => previewToggle.checked;

  /** Arm an act: run the real pipeline over a shadow, show the ghost, offer commit/cancel. */
  async function arm(act: ArmedAct): Promise<void> {
    armed = act;
    const result = await previewAct(app, act);
    ghostEl.innerHTML = `${ghostSummary(result)}
      <div style="display:flex;gap:8px;margin-top:8px">
        <button class="assay-btn" id="assay-ghost-commit">Commit this write</button>
        <button class="assay-btn secondary" id="assay-ghost-cancel">Cancel — leave nothing</button>
      </div>`;
    (root.querySelector('#assay-ghost-commit') as HTMLElement).addEventListener('click', () => {
      void commitArmed();
    });
    (root.querySelector('#assay-ghost-cancel') as HTMLElement).addEventListener('click', () => {
      cancelArmed();
    });
  }

  async function commitArmed(): Promise<void> {
    if (!armed) return;
    const act = armed;
    armed = null;
    ghostEl.innerHTML = '';
    await applyArmedAct(app, act); // exactly the previewed act — the ghost becomes the glow
    void rerender('j2');
  }

  function cancelArmed(): void {
    // Cancel leaves committed state byte-identical (the fork carried the act, discarded here).
    armed = null;
    ghostEl.innerHTML = '';
  }

  (root.querySelector('#assay-resolve') as HTMLElement).addEventListener('click', () => {
    if (!canWrite()) return; // read-only in replay (FR-004)
    if (previewArmed()) void arm({ kind: 'resolve' });
    else {
      app.resolveK12();
      void rerender('j2');
    }
  });
  (root.querySelector('#assay-reopen') as HTMLElement).addEventListener('click', () => {
    if (!canWrite()) return;
    if (previewArmed()) void arm({ kind: 'reopen' });
    else {
      app.contestK12();
      void rerender('j2');
    }
  });
  const stepInput = root.querySelector('#assay-step') as HTMLInputElement;
  stepInput.addEventListener('input', () => {
    if (!canWrite()) return;
    app.setStep(Number(stepInput.value));
    (root.querySelector('#assay-step-label') as HTMLElement).textContent = String(app.step);
    // A scrub is pure selection over the compiled world — nothing upstream
    // changed, so glow silence is the honest report (note 10 §5 / DEC-36c).
    void rerender(undefined, { silent: true });
  });
  (root.querySelector('#assay-edit') as HTMLFormElement).addEventListener('submit', (e) => {
    e.preventDefault();
    if (!canWrite()) return; // read-only in replay (FR-004)
    const id = (root.querySelector('#assay-edit-id') as HTMLSelectElement).value;
    const lo = Number((root.querySelector('#assay-edit-lo') as HTMLInputElement).value);
    const hi = Number((root.querySelector('#assay-edit-hi') as HTMLInputElement).value);
    const unit = (root.querySelector('#assay-edit-unit') as HTMLInputElement).value || 'tonnes';
    if (Number.isFinite(lo) && Number.isFinite(hi)) {
      if (previewArmed()) void arm({ kind: 'band-edit', id, band: { lo, hi, unit } });
      else void app.editBand(id, { lo, hi, unit }).then(() => rerender('j2'));
    }
  });

  function syncTabs(): void {
    for (const btn of Array.from(tabbar.querySelectorAll('.assay-tab'))) {
      const el = btn as HTMLElement;
      el.setAttribute('aria-selected', String(el.dataset.tab === activeTab));
    }
    for (const p of Array.from(panelsRoot.querySelectorAll('.assay-panel, .assay-role-menu-wrap'))) {
      const el = p as HTMLElement;
      el.style.display = el.dataset.tab === activeTab ? '' : 'none';
    }
  }

  async function rerender(sourceTab?: TabId, opts: { silent?: boolean } = {}): Promise<void> {
    // In live mode the cursor tracks the head, so a fresh write moves the slider
    // with it; in replay the cursor is parked and the surfaces reconstruct it.
    if (cursor.mode === 'live') cursor = { seq: app.historyMaxSeq, mode: 'live' };
    const snap = await view();
    renderHistoryBar();

    // notice (last edit outcome) — suppressed in replay (the past has no "last edit")
    noticeEl.innerHTML = cursor.mode === 'live' && snap.notice ? snap.notice.html : '';

    // render panels
    panelsRoot.innerHTML = '';
    // Per-tab role-action menu (US5): the legal write verbs for the role, at the
    // top of its tab. A surface, not a service call — pure re-arrangement (DEC-33).
    for (const t of TABS) {
      const rm = doc.createElement('div');
      rm.className = 'assay-role-menu-wrap';
      rm.dataset.tab = t.id;
      rm.innerHTML = roleMenu(ROLE_VERBS[t.id]);
      panelsRoot.appendChild(rm);
    }
    for (const panel of snap.panels) {
      const el = doc.createElement('div');
      el.className = 'assay-panel';
      el.dataset.panel = panel.id;
      el.dataset.tab = panel.tab;
      el.innerHTML = `<h3>${panel.title}</h3>${panel.html}`;
      panelsRoot.appendChild(el);
    }

    // ---- value-keyed, row/cell-level glow ----
    const nextSig: SignatureMap = new Map();
    const unitTab = new Map<string, string>();
    const units = Array.from(panelsRoot.querySelectorAll('[data-glow-id]')) as HTMLElement[];
    for (const el of units) {
      const id = el.dataset.glowId as string;
      nextSig.set(id, el.dataset.glowSig ?? '');
      const tab = (el.closest('.assay-panel') as HTMLElement | null)?.dataset.tab;
      if (tab) unitTab.set(id, tab);
    }
    for (const id of [...pending]) if (!nextSig.has(id)) pending.delete(id);

    if (!firstRender && !opts.silent) {
      const changed = changedGlowUnits(prevSig, nextSig);
      for (const el of units) {
        const id = el.dataset.glowId as string;
        if (!changed.has(id)) continue;
        if (unitTab.get(id) === activeTab) glow(el);
        else pending.add(id);
      }
      const tabs = changedTabs(changed, (id) => unitTab.get(id), sourceTab);
      for (const tid of tabs) {
        const btn = tabbar.querySelector(`[data-tab="${tid}"]`) as HTMLElement | null;
        if (btn) glow(btn);
      }
    }
    prevSig = nextSig;
    firstRender = false;

    wireTraceChips();
    wireChallenge();
    wireCoaDrag();
    syncTabs();

    // wall-projection auto-follow: scroll delta feed to top (newest first)
    if (doc.documentElement.getAttribute('data-projection') === 'wall') {
      const observerPanel = panelsRoot.querySelector('[data-panel="observer"]') as HTMLElement | null;
      observerPanel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function flushPending(): void {
    if (pending.size === 0) return;
    for (const el of Array.from(panelsRoot.querySelectorAll('[data-glow-id]')) as HTMLElement[]) {
      const id = el.dataset.glowId as string;
      if (!pending.has(id)) continue;
      if ((el.closest('.assay-panel') as HTMLElement | null)?.dataset.tab === activeTab) {
        glow(el);
        pending.delete(id);
      }
    }
  }

  function glow(el: HTMLElement): void {
    el.classList.remove('assay-glow');
    void el.offsetWidth;
    el.classList.add('assay-glow');
    doc.defaultView?.setTimeout(() => el.classList.remove('assay-glow'), GLOW_MS);
  }

  // ---- Spatial tab: drag a waypoint → new Plan version → real re-score ----
  // (DEC-36c/d; the projection params must match state.ts's coaMap options.)
  const coaProjection = makeProjection(app.grid, { width: 640, pad: 10 });
  function wireCoaDrag(): void {
    const svg = panelsRoot.querySelector('[data-panel="coamap"] svg[role="img"]') as SVGSVGElement | null;
    if (!svg) return;
    let drag: { el: SVGCircleElement; plan: string; element: string; leg: number } | null = null;
    const toViewBox = (ev: PointerEvent): { x: number; y: number } => {
      const ctm = svg.getScreenCTM();
      if (!ctm) return { x: 0, y: 0 };
      const pt = new DOMPoint(ev.clientX, ev.clientY).matrixTransform(ctm.inverse());
      return { x: pt.x, y: pt.y };
    };
    for (const c of Array.from(svg.querySelectorAll('.coa-wp')) as SVGCircleElement[]) {
      c.style.cursor = 'grab';
      c.addEventListener('pointerdown', (ev) => {
        if (!canWrite()) return; // a drag authors a plan version — disabled in replay
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
        const cell = cellAtPixel(app.grid, coaProjection, p.x, p.y);
        const d = drag;
        drag = null;
        void app.moveWaypoint(d.plan, d.element, d.leg, cell.x, cell.y).then(() => rerender('coa'));
      });
    }
  }

  // ---- the challenge affordance on verdict cells (US4) ----
  let challengeEl: HTMLElement | null = null;
  function closeChallenge(): void {
    if (challengeEl) {
      challengeEl.remove();
      challengeEl = null;
    }
  }
  doc.addEventListener('click', closeChallenge);

  function wireChallenge(): void {
    for (const cell of Array.from(panelsRoot.querySelectorAll('td[data-glow-id^="v:"]')) as HTMLElement[]) {
      const glowId = cell.dataset.glowId as string;
      const parts = glowId.split(':'); // v:PLAN:COMMITMENT
      if (parts.length < 3) continue;
      const plan = parts[1] as string;
      const commitment = parts[2] as string;
      cell.style.cursor = 'help';
      cell.title = 'Click to challenge — surface the assumptions this verdict leans on';
      cell.addEventListener('click', (ev) => {
        ev.stopPropagation();
        void openChallenge(plan, commitment, ev as MouseEvent);
      });
    }
  }

  async function openChallenge(plan: string, commitment: string, ev: MouseEvent): Promise<void> {
    closeChallenge();
    const result = await app.challenge(plan, commitment);
    if (!result) return; // nothing to challenge — the affordance is absent, not erroring
    challengeEl = doc.createElement('div');
    challengeEl.className = 'assay-menu';
    challengeEl.style.maxWidth = '420px';
    challengeEl.innerHTML = challengePanel(result);
    // Deep-link: clicking a contributor row jumps to J-2 where its S1 row lives.
    for (const row of Array.from(challengeEl.querySelectorAll('[data-logical-id]')) as HTMLElement[]) {
      row.style.cursor = 'pointer';
      row.addEventListener('click', (e) => {
        e.stopPropagation();
        closeChallenge();
        activeTab = 'j2';
        syncTabs();
        flushPending();
      });
    }
    challengeEl.style.left = `${ev.pageX + 6}px`;
    challengeEl.style.top = `${ev.pageY + 6}px`;
    challengeEl.addEventListener('click', (e) => e.stopPropagation());
    doc.body.appendChild(challengeEl);
  }

  // ---- the one-hop trace menu on item chips ----
  function wireTraceChips(): void {
    for (const cell of Array.from(panelsRoot.querySelectorAll('[data-logical-id]'))) {
      const el = cell as HTMLElement;
      // For <tr> rows, make the first <td> the click target; for everything
      // else (<th>, <li>, <span>, <div>) the element itself is the target.
      const target = (el.tagName === 'TR' ? el.querySelector('td') : null) ?? el;
      (target as HTMLElement).classList.add('assay-chip-clickable');
      (target as HTMLElement).style.cursor = 'pointer';
      target.addEventListener('click', (ev) => {
        ev.stopPropagation();
        openMenu(el.dataset.logicalId as string, ev as MouseEvent);
      });
    }
  }

  let menuEl: HTMLElement | null = null;
  function closeMenu(): void {
    if (menuEl) {
      menuEl.remove();
      menuEl = null;
    }
  }
  doc.addEventListener('click', closeMenu);

  function openMenu(logicalId: string, ev: MouseEvent): void {
    closeMenu();
    // SPEC-26 US3 — the recursive trace tooltip: one-hop menu expanded to the
    // stated depth cap of 3 over the same trace graph (FR-006/FR-007). The
    // remainder affordances route to the full dependency-graph overlay (#24).
    const html = app.recursiveTraceMenu(logicalId);
    if (!html) return;
    menuEl = doc.createElement('div');
    menuEl.className = 'assay-menu';
    menuEl.style.maxWidth = '420px';
    menuEl.innerHTML =
      html +
      `<div style="margin-top:8px;border-top:1px solid var(--line);padding-top:6px"><a href="#" class="assay-dep-open" style="font-size:11px;color:#3E5D8A;font-weight:600;text-decoration:none" data-dep-logical-id="${logicalId}">View full graph →</a></div>`;
    const depLink = menuEl.querySelector('.assay-dep-open') as HTMLElement;
    depLink.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeMenu();
      openDepOverlay(logicalId);
    });
    // The depth-cap remainder ("N more — open full trace") hands off to the graph
    // overlay focused on that hash — truncation visible, bounded, escapable (G4).
    for (const more of Array.from(menuEl.querySelectorAll('.assay-rtrace-more')) as HTMLElement[]) {
      more.addEventListener('click', (e) => {
        e.stopPropagation();
        const hash = more.dataset.remainderHash;
        closeMenu();
        if (hash) openDepOverlayByHash(hash);
      });
    }
    menuEl.style.left = `${ev.pageX + 6}px`;
    menuEl.style.top = `${ev.pageY + 6}px`;
    menuEl.addEventListener('click', (e) => e.stopPropagation());
    doc.body.appendChild(menuEl);
  }

  // ---- full-screen dependency-graph overlay (issue #24) ----
  let depOverlay: HTMLElement | null = null;

  function closeDepOverlay(): void {
    if (depOverlay) {
      depOverlay.remove();
      depOverlay = null;
    }
  }

  function openDepOverlay(logicalId: string): void {
    closeDepOverlay();
    const graph = app.depGraph(logicalId);
    if (!graph) return;

    depOverlay = doc.createElement('div');
    depOverlay.className = 'assay-dep-overlay';
    renderDepOverlayContent(depOverlay, graph, logicalId);

    depOverlay.querySelector('.assay-dep-close')!.addEventListener('click', closeDepOverlay);
    depOverlay.addEventListener('click', (e) => {
      if (e.target === depOverlay) closeDepOverlay();
    });

    wireDepNodes(depOverlay);
    doc.body.appendChild(depOverlay);
  }

  /** Open the dependency overlay focused on a content hash — where the recursive
   *  tooltip's depth-cap remainder hands off (SPEC-26 US3 → #24). */
  function openDepOverlayByHash(hash: string): void {
    closeDepOverlay();
    const graph = app.depGraphByHash(hash);
    depOverlay = doc.createElement('div');
    depOverlay.className = 'assay-dep-overlay';
    renderDepOverlayContent(depOverlay, graph, graph.focus.label);
    depOverlay.addEventListener('click', (e) => {
      if (e.target === depOverlay) closeDepOverlay();
    });
    wireDepNodes(depOverlay);
    doc.body.appendChild(depOverlay);
  }

  function renderDepOverlayContent(overlay: HTMLElement, graph: ReturnType<typeof app.depGraph> & {}, label: string): void {
    const detail = app.depNodeDetail(graph.focus.hash);
    overlay.innerHTML = `<div class="assay-dep-overlay-inner">
      <div class="assay-dep-header">
        <div style="font-weight:600;font-size:14px">${label} — dependency graph</div>
        <button class="assay-btn secondary assay-dep-close" style="padding:4px 10px;font-size:11px">Close ✕</button>
      </div>
      <div class="assay-dep-body">
        <div class="assay-dep-river-pane">${depGraphRiver(graph)}</div>
        <div class="assay-dep-sidebar-pane">${depGraphSidebar(detail)}</div>
      </div>
    </div>`;
    overlay.querySelector('.assay-dep-close')!.addEventListener('click', closeDepOverlay);
  }

  function refocusDepGraph(hash: string): void {
    if (!depOverlay) return;
    const graph = app.depGraphByHash(hash);
    if (!graph) return;
    renderDepOverlayContent(depOverlay, graph, graph.focus.label);
    wireDepNodes(depOverlay);
  }

  function wireDepNodes(overlay: HTMLElement): void {
    for (const el of Array.from(overlay.querySelectorAll('.assay-dep-node')) as HTMLElement[]) {
      el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const hash = el.dataset.depHash;
        if (!hash) return;
        refocusDepGraph(hash);
      });
    }
  }

  initHistoryBar();
  void rerender();
}
