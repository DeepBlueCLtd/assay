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
import type { AppState, TabId } from './state.js';
import { changedGlowUnits, changedTabs, type SignatureMap } from './glow.js';
import { depGraphRiver } from '../components/depGraphRiver.js';
import { depGraphSidebar } from '../components/depGraphSidebar.js';
import { NARRATIVES, SCRIPTING_PRINCIPLES, type Narrative, type NarrativeBeat } from '../narratives.js';

const TABS: { id: TabId; label: string; role: string }[] = [
  { id: 'j2', label: 'J-2 workbench', role: 'ROLE: J-2' },
  { id: 'planner', label: 'Planner', role: 'ROLE: J-3/5' },
  { id: 'commander', label: 'Commander', role: 'ROLE: COMD' },
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
    <p style="font-size:12.5px;color:var(--muted);margin:4px 0 0">Four roles, one in-browser pipeline. Every edit re-runs the <b>real</b> compile → score → relax; a change in one role <b>glows</b> the roles and components it touches (the propagation graph, not an animation — G6). Meridian is engineered fiction (DEC-8); every assessed value is banded (G2).</p>
    <div class="assay-narrative-bar" id="assay-narrative-bar"></div>
    <div id="assay-narrator"></div>
    <div class="assay-controls" id="assay-controls"></div>
    <div class="assay-notice" id="assay-notice"></div>
    <div class="assay-tabbar" id="assay-tabbar"></div>
    <div id="assay-panels"></div>
  </div>`;

  const tabbar = root.querySelector('#assay-tabbar') as HTMLElement;
  const panelsRoot = root.querySelector('#assay-panels') as HTMLElement;
  const controls = root.querySelector('#assay-controls') as HTMLElement;
  const noticeEl = root.querySelector('#assay-notice') as HTMLElement;
  const narrativeBar = root.querySelector('#assay-narrative-bar') as HTMLElement;
  const narratorEl = root.querySelector('#assay-narrator') as HTMLElement;

  let activeTab: TabId = 'j2';
  let prevSig: SignatureMap = new Map();
  let firstRender = true;
  const pending = new Set<string>();

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
      renderNarrator();
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
    syncTabs();
    renderNarrator();
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
      ${beat.action ? `<div style="margin-top:8px;font-size:11px;color:#F4C430">⚡ Scripted action: ${esc(beat.action === 'resolve' ? 'Resolve K12 contest' : 'Edit K8 band')}</div>` : ''}
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
    </form>`;

  (root.querySelector('#assay-resolve') as HTMLElement).addEventListener('click', () => {
    app.resolveK12();
    void rerender('j2');
  });
  (root.querySelector('#assay-reopen') as HTMLElement).addEventListener('click', () => {
    app.contestK12();
    void rerender('j2');
  });
  (root.querySelector('#assay-edit') as HTMLFormElement).addEventListener('submit', (e) => {
    e.preventDefault();
    const id = (root.querySelector('#assay-edit-id') as HTMLSelectElement).value;
    const lo = Number((root.querySelector('#assay-edit-lo') as HTMLInputElement).value);
    const hi = Number((root.querySelector('#assay-edit-hi') as HTMLInputElement).value);
    const unit = (root.querySelector('#assay-edit-unit') as HTMLInputElement).value || 'tonnes';
    if (Number.isFinite(lo) && Number.isFinite(hi)) {
      void app.editBand(id, { lo, hi, unit }).then(() => rerender('j2'));
    }
  });

  function syncTabs(): void {
    for (const btn of Array.from(tabbar.querySelectorAll('.assay-tab'))) {
      const el = btn as HTMLElement;
      el.setAttribute('aria-selected', String(el.dataset.tab === activeTab));
    }
    for (const p of Array.from(panelsRoot.querySelectorAll('.assay-panel'))) {
      const el = p as HTMLElement;
      el.style.display = el.dataset.tab === activeTab ? '' : 'none';
    }
  }

  async function rerender(sourceTab?: TabId): Promise<void> {
    const snap = await app.snapshot();

    // notice (last edit outcome)
    noticeEl.innerHTML = snap.notice ? snap.notice.html : '';

    // render panels
    panelsRoot.innerHTML = '';
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

    if (!firstRender) {
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
    const m = app.traceMenu(logicalId);
    if (!m) return;
    const section = (title: string, items: { label: string; edge: string; known: boolean }[]): string => {
      if (items.length === 0)
        return `<h4>${title}</h4><div class="row" style="color:var(--muted)">— none yet —</div>`;
      return (
        `<h4>${title}</h4>` +
        items
          .map(
            (n) =>
              `<div class="row"${n.known ? '' : ' style="color:#A33131"'}>${n.label} <span class="edge">· ${n.edge}</span></div>`,
          )
          .join('')
      );
    };
    menuEl = doc.createElement('div');
    menuEl.className = 'assay-menu';
    menuEl.innerHTML =
      `<div style="font-weight:600;margin-bottom:4px">${logicalId} — relationships</div>` +
      section('Informs (upstream)', m.informs) +
      section('Influences (downstream)', m.influences) +
      `<div style="margin-top:8px;border-top:1px solid var(--line);padding-top:6px"><a href="#" class="assay-dep-open" style="font-size:11px;color:#3E5D8A;font-weight:600;text-decoration:none" data-dep-logical-id="${logicalId}">View full graph →</a></div>` +
      `<div style="margin-top:4px;font-size:10px;color:var(--muted)">one hop — click a chip again to walk further</div>`;
    const depLink = menuEl.querySelector('.assay-dep-open') as HTMLElement;
    depLink.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeMenu();
      openDepOverlay(logicalId);
    });
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

  void rerender();
}
