/**
 * SPEC-16 — the interactive shell (the ONLY stateful, DOM-bearing layer).
 *
 * Renders the four role tabs by calling the PURE components (via AppState's
 * snapshot) — the shell/pure-component split that keeps SPEC-14 extractability
 * intact (research note 05 §2). It wires the interventions (resolve/reopen the
 * K12 contest, edit an assessed band), applies the glow to exactly the rows and
 * cells whose displayed VALUE changed (row/cell-level, value-keyed — G6 made
 * legible), and mounts the one-hop "informs / influenced by" trace menu.
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
.assay-chip-clickable{cursor:pointer;text-decoration:underline dotted}
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
`;

export function mountShell(root: HTMLElement, app: AppState): void {
  const doc = root.ownerDocument;
  const style = doc.createElement('style');
  style.textContent = STYLES;
  doc.head.appendChild(style);

  root.innerHTML = `
  <div class="assay-app">
    <h1 style="font-size:22px;margin:0">ASSAY — the seam, live</h1>
    <p style="font-size:12.5px;color:var(--muted);margin:4px 0 0">Four roles, one in-browser pipeline. Every edit re-runs the <b>real</b> compile → score → relax; a change in one role <b>glows</b> the roles and components it touches (the propagation graph, not an animation — G6). Meridian is engineered fiction (DEC-8); every assessed value is banded (G2).</p>
    <div class="assay-controls" id="assay-controls"></div>
    <div class="assay-notice" id="assay-notice"></div>
    <div class="assay-tabbar" id="assay-tabbar"></div>
    <div id="assay-panels"></div>
  </div>`;

  const tabbar = root.querySelector('#assay-tabbar') as HTMLElement;
  const panelsRoot = root.querySelector('#assay-panels') as HTMLElement;
  const controls = root.querySelector('#assay-controls') as HTMLElement;
  const noticeEl = root.querySelector('#assay-notice') as HTMLElement;

  let activeTab: TabId = 'j2';
  let prevSig: SignatureMap = new Map();
  let firstRender = true;
  // glow units that changed on a recompute while their tab was hidden — glowed
  // when that tab is next opened, so a cross-tab change is still seen.
  const pending = new Set<string>();

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
      btn.classList.remove('assay-glow'); // opening the tab acknowledges its signal
      flushPending(); // reveal any deferred cross-tab glows now this tab is visible
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
    // Each glow unit carries data-glow-id (stable identity) + data-glow-sig
    // (the value it shows). A unit glows only when its signature moved (or it
    // is new) — never on an unrelated re-stamp. Units whose tab is hidden are
    // deferred to `pending` and glowed when that tab opens.
    const nextSig: SignatureMap = new Map();
    const unitTab = new Map<string, string>();
    const units = Array.from(panelsRoot.querySelectorAll('[data-glow-id]')) as HTMLElement[];
    for (const el of units) {
      const id = el.dataset.glowId as string;
      nextSig.set(id, el.dataset.glowSig ?? '');
      const tab = (el.closest('.assay-panel') as HTMLElement | null)?.dataset.tab;
      if (tab) unitTab.set(id, tab);
    }
    // drop pending ids that no longer exist
    for (const id of [...pending]) if (!nextSig.has(id)) pending.delete(id);

    if (!firstRender) {
      const changed = changedGlowUnits(prevSig, nextSig);
      for (const el of units) {
        const id = el.dataset.glowId as string;
        if (!changed.has(id)) continue;
        if (unitTab.get(id) === activeTab) glow(el);
        else pending.add(id); // deferred until its tab is opened
      }
      // tab-button glow: any tab (≠ the edit's source) carrying a changed unit
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
  }

  /** Glow any deferred units that live on the now-active tab (cross-tab reveal). */
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
    void el.offsetWidth; // restart the animation
    el.classList.add('assay-glow');
    doc.defaultView?.setTimeout(() => el.classList.remove('assay-glow'), GLOW_MS);
  }

  // ---- the one-hop trace menu on item chips ----
  function wireTraceChips(): void {
    for (const cell of Array.from(panelsRoot.querySelectorAll('[data-logical-id]'))) {
      const el = cell as HTMLElement;
      // Mark the id cell as clickable (first cell of an s1 row carries the id).
      const idCell = el.querySelector('td') ?? el;
      (idCell as HTMLElement).classList.add('assay-chip-clickable');
      idCell.addEventListener('click', (ev) => {
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
    depOverlay.innerHTML = `<div class="assay-dep-overlay-inner">
      <div class="assay-dep-header">
        <div style="font-weight:600;font-size:14px">${logicalId} — dependency graph</div>
        <button class="assay-btn secondary assay-dep-close" style="padding:4px 10px;font-size:11px">Close ✕</button>
      </div>
      <div class="assay-dep-body">
        <div class="assay-dep-river-pane">${depGraphRiver(graph)}</div>
        <div class="assay-dep-sidebar-pane" style="font-size:12px;color:var(--muted)">Click a node to see its detail.</div>
      </div>
    </div>`;

    depOverlay.querySelector('.assay-dep-close')!.addEventListener('click', closeDepOverlay);
    depOverlay.addEventListener('click', (e) => {
      if (e.target === depOverlay) closeDepOverlay();
    });

    wireDepNodes(depOverlay, logicalId);
    doc.body.appendChild(depOverlay);
  }

  function wireDepNodes(overlay: HTMLElement, currentFocusId: string): void {
    for (const el of Array.from(overlay.querySelectorAll('.assay-dep-node')) as HTMLElement[]) {
      el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const hash = el.dataset.depHash;
        if (!hash) return;
        const detail = app.depNodeDetail(hash);
        const sidebar = overlay.querySelector('.assay-dep-sidebar-pane') as HTMLElement;
        sidebar.innerHTML = depGraphSidebar(detail);
        wireDepNodes(sidebar, currentFocusId);
      });
    }
  }

  void rerender();
}
