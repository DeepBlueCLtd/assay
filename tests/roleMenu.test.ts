/**
 * SPEC-25 US5 — per-role action menus (research note 14 §6).
 *
 * Each tab's menu equals its documented legal write set; observer exposes no
 * write; deferred/automatic verbs are labelled, never faked; nothing silently
 * removed. The menu re-presents what the seam already permits (DEC-33).
 */
import { describe, expect, it } from 'vitest';
import { ROLE_VERBS, type VerbStatus } from '../src/roleMenus.js';
import { roleMenu } from '../src/components/roleMenu.js';

describe('SPEC-25 US5 — per-role action menus', () => {
  it('each role menu equals its documented legal verb set', () => {
    const set = (tab: keyof typeof ROLE_VERBS): string[] =>
      ROLE_VERBS[tab].verbs.map((v) => v.verb).sort();
    expect(set('j2')).toEqual(['collect-mark', 'contest', 'create', 'resolve', 'supersede']);
    expect(set('planner')).toEqual(['compile', 'generate-handful', 'relax', 'score']);
    expect(set('commander')).toEqual(['select', 'waive']);
    expect(set('coa')).toEqual(['move-waypoint', 'scrub', 'shift-window']);
  });

  it('the observer exposes NO write verb — read & trace only (the load-bearing assertion)', () => {
    expect(ROLE_VERBS.observer.verbs).toHaveLength(0);
    const html = roleMenu(ROLE_VERBS.observer);
    expect(html).toMatch(/no write verb/i);
    expect(html).toMatch(/read (&amp;|&) trace only/i);
  });

  it('every verb carries an honest exercise status; deferred verbs are labelled, never faked (DEC-4)', () => {
    const valid: VerbStatus[] = ['live', 'auto', 'deferred'];
    for (const menu of Object.values(ROLE_VERBS)) {
      for (const v of menu.verbs) expect(valid).toContain(v.status);
    }
    // `select` (POST /select) is named-but-unbuilt — deferred, not a dead button.
    const select = ROLE_VERBS.commander.verbs.find((v) => v.verb === 'select');
    expect(select?.status).toBe('deferred');
    // The J-2 knowledge write verbs are live-actionable (the wired controls).
    for (const verb of ['contest', 'resolve', 'supersede']) {
      expect(ROLE_VERBS.j2.verbs.find((v) => v.verb === verb)?.status).toBe('live');
    }
  });

  it('the Spatial surface is marked a surface, not a role (DEC-32 four tabs stand)', () => {
    expect(ROLE_VERBS.coa.surface).toBe(true);
    expect(roleMenu(ROLE_VERBS.coa)).toMatch(/a surface, not a role/i);
  });

  it('renders no urgency/score scalar in any menu (DEC-19)', () => {
    for (const menu of Object.values(ROLE_VERBS)) {
      const html = roleMenu(menu).replace(/style="[^"]*"/g, ''); // drop CSS (font-weight etc.)
      expect(html).not.toMatch(/\burgency\b|priority score|risk score/i);
      expect(html).not.toMatch(/\d+\s*%/);
    }
  });
});
