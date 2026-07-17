/**
 * SPEC-25 US5 — the per-role action menu (pure renderer; research note
 * `14-legibility.md` §6).
 *
 * Renders one tab's legal write verbs from the `ROLE_VERBS` source of truth, each
 * marked live / pipeline-automatic / deferred so C2 role separation reads off the
 * shell. The observer tab renders an explicit "read & trace only — no writes"
 * statement. It arranges projections only (constitution I): no service call, no
 * state, no scalar — depends only on its `RoleMenu` input.
 */
import type { RoleMenu, VerbStatus } from '../roleMenus.js';

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const STATUS: Record<VerbStatus, { label: string; fg: string; bg: string; border: string }> = {
  live: { label: 'live', fg: '#1E6B3A', bg: '#E6F2EA', border: '#B7DCC4' },
  auto: { label: 'runs on recompute', fg: '#3E5D8A', bg: '#E8EEF6', border: '#C3D3E8' },
  deferred: { label: 'not yet built', fg: '#8A6A12', bg: '#F6EFDD', border: '#E4D3A6' },
};

function verbRow(v: { verb: string; gloss: string; status: VerbStatus }): string {
  const s = STATUS[v.status];
  return `<div style="display:flex;gap:8px;align-items:baseline;padding:3px 0">
    <span style="font-family:ui-monospace,monospace;font-size:11px;font-weight:700;color:#1B2732;min-width:118px">${esc(v.verb)}</span>
    <span style="font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.03em;padding:1px 6px;border-radius:8px;color:${s.fg};background:${s.bg};border:1px solid ${s.border};white-space:nowrap">${esc(s.label)}</span>
    <span style="font-size:11px;color:#5B6B77">${esc(v.gloss)}</span>
  </div>`;
}

/** Render a role's legal-verb menu as a collapsible <details>. */
export function roleMenu(menu: RoleMenu): string {
  const title = `Role actions — ${esc(menu.role)}${menu.surface ? ' · a surface, not a role' : ''}`;
  const body =
    menu.verbs.length === 0
      ? `<div style="font-size:11.5px;color:#5B6B77;margin-top:6px"><b>Read &amp; trace only.</b> This role exposes <b>no write verb</b> — the bridge watches the seam, it never touches it. That an observer may do nothing is the C2 point made legible (SPEC-25).</div>`
      : `<div style="margin-top:6px">${menu.verbs.map(verbRow).join('')}</div>
         <div style="margin-top:6px;font-size:10px;color:#8091A0">Menus reorganise what the seam already permits (DEC-33) — never restrict. Every wired verb routes through the same honesty gates as before; deferred verbs are named, never faked (DEC-4).</div>`;
  return `<details class="assay-role-menu" style="margin:8px 0;border:1px solid #C8D2DA;border-radius:6px;padding:6px 12px;background:#FBFCFD">
  <summary style="cursor:pointer;font-size:11.5px;color:#1B2732;font-weight:700">${title}</summary>
  ${body}
</details>`;
}
