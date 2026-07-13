import { describe, expect, it } from 'vitest';
import { changedPanels, changedTabs, type DependencyMap } from '../src/app/glow.js';

const dep = (entries: Record<string, string[]>): DependencyMap =>
  new Map(Object.entries(entries).map(([k, v]) => [k, new Set(v)]));

describe('glow — changed-content-hash set-diff = propagation made visible (SPEC-16, G6)', () => {
  it('a panel whose dependency hash changed glows; an unchanged one does not', () => {
    const prev = dep({ channels: ['h1', 'h2'], matrix: ['v1', 'v2'], strip: ['p1'] });
    const next = dep({ channels: ['h1', 'h2'], matrix: ['v1', 'v9'], strip: ['p1'] });
    const changed = changedPanels(prev, next);
    expect(changed.has('matrix')).toBe(true); // v2 → v9
    expect(changed.has('channels')).toBe(false); // no over-report
    expect(changed.has('strip')).toBe(false);
  });

  it('an idempotent edit (identical hashes) glows nothing — honest', () => {
    const same = dep({ channels: ['h1'], matrix: ['v1'] });
    expect(changedPanels(same, dep({ channels: ['h1'], matrix: ['v1'] })).size).toBe(0);
  });

  it('a panel that appears or disappears counts as changed', () => {
    const prev = dep({ channels: ['h1'] });
    const next = dep({ channels: ['h1'], relax: ['r1'] });
    expect(changedPanels(prev, next).has('relax')).toBe(true);
    expect(changedPanels(next, prev).has('relax')).toBe(true);
  });

  it('every changed panel is reported (no under-report — G6)', () => {
    const prev = dep({ a: ['1'], b: ['2'], c: ['3'] });
    const next = dep({ a: ['9'], b: ['8'], c: ['7'] });
    expect(changedPanels(prev, next)).toEqual(new Set(['a', 'b', 'c']));
  });

  it('tabs roll up from changed panels, suppressing the source tab of the edit', () => {
    const changed = new Set(['matrix', 'cards']);
    const tabOf = (p: string): string | undefined =>
      ({ matrix: 'planner', cards: 'commander', table: 'j2' })[p];
    const tabs = changedTabs(changed, tabOf, 'j2');
    expect(tabs).toEqual(new Set(['planner', 'commander']));
  });

  it('the source tab does not glow from its own edit', () => {
    const changed = new Set(['table', 'matrix']);
    const tabOf = (p: string): string | undefined =>
      ({ table: 'j2', matrix: 'planner' })[p];
    const tabs = changedTabs(changed, tabOf, 'j2');
    expect(tabs.has('j2')).toBe(false);
    expect(tabs.has('planner')).toBe(true);
  });
});
