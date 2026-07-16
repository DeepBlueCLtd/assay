/**
 * SPEC-24 — the DSM in the live app: an S2-adjacent commander panel over the
 * one store (note 12 §8). It refuses with the compile while K12 is contested
 * (a row cannot silently rest on refused knowledge — G5), derives on resolve,
 * re-derives on recompile, and its rows carry value-keyed glow sigs (G6).
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Commitment, KnowledgeObject, Plan, ScenarioCOA, VignetteConfig } from '../src/generated/types.js';
import { AppState, type Fixtures, type Snapshot } from '../src/app/state.js';
import { changedGlowUnits, type SignatureMap } from '../src/app/glow.js';

const load = <T>(name: string): T[] =>
  JSON.parse(readFileSync(new URL(`../fixtures/${name}.json`, import.meta.url), 'utf8')) as T[];
const fx: Fixtures = {
  knowledge: load<KnowledgeObject>('knowledge'),
  coas: load<ScenarioCOA>('coas'),
  commitments: load<Commitment>('commitments'),
  plans: load<Plan>('plans'),
  config: JSON.parse(
    readFileSync(new URL('../fixtures/vignette-config.json', import.meta.url), 'utf8'),
  ) as VignetteConfig,
};

const dsmPanel = (snap: Snapshot) => snap.panels.find((p) => p.id === 'dsm');
const sigMap = (snap: Snapshot): SignatureMap => {
  const map: SignatureMap = new Map();
  const html = snap.panels.map((p) => p.html).join('\n');
  for (const m of html.matchAll(/data-glow-id="([^"]+)" data-glow-sig="([^"]*)"/g)) {
    map.set(m[1]!, m[2]!);
  }
  return map;
};

async function seeded(): Promise<AppState> {
  const app = new AppState(structuredClone(fx));
  await app.seed();
  return app;
}

describe('SPEC-24 — the commander "decisions in time" panel', () => {
  it('refuses with the compile while K12 is contested; derives the pinned exhibit on resolve', async () => {
    const app = await seeded();
    const before = await app.snapshot();
    const refused = dsmPanel(before)!;
    expect(refused.tab).toBe('commander');
    expect(refused.html).toContain('contested_knowledge'); // G5 — the DSM refuses with the compile
    expect(before.stamps.dsm).toBeUndefined();

    app.resolveK12();
    const after = await app.snapshot();
    const panel = dsmPanel(after)!;
    expect(after.stamps.dsm).toBeDefined();
    expect(panel.title).toContain('decisions in time');
    // The pinned P2 exhibit, live: three DP rows with value-keyed sigs.
    expect(panel.html).toContain('data-glow-id="dsm:P2:C1"');
    expect(panel.html).toContain('data-glow-id="dsm:P2:C2"');
    expect(panel.html).toContain('data-glow-id="dsm:P2:C5"');
    expect(panel.html).toContain('in time — earliest result 8 ≤ LTIOV 10 (slack 2 steps)');
    expect(panel.html).toContain('cannot answer in time — earliest result 8 &gt; LTIOV 2');
    expect(panel.html).toContain('lapses at 36 — before the commit step (56)');
    // The absence of a /select selection is stated, never papered over.
    expect(panel.html).toContain('no /select selection exists');
    // No tasking affordance (FR-007).
    expect(panel.html).not.toMatch(/<button|<input|<form/i);
    // The refusal → table transition is glow-visible; the rows appeared.
    const changed = changedGlowUnits(sigMap(before), sigMap(after));
    expect(changed.has('dsm:P2:C1')).toBe(true);
  });

  it('rows re-derive on recompile and glow only where displayed values moved (G6)', async () => {
    const app = await seeded();
    app.resolveK12();
    const before = await app.snapshot();
    const beforeSigs = sigMap(before);

    // Widen K6 (FAC sortie rate) — a legal supersede; the world recompiles and
    // the DSM re-derives. No DSM row displays a K6-derived value on the frozen
    // tableau, so no DSM row may glow (no over-report).
    await app.editBand('K6', { lo: 2, hi: 7, unit: 'sorties/day' });
    const after = await app.snapshot();
    expect(after.stamps.dsm).toBeDefined();
    expect(after.stamps.dsm).not.toBe(before.stamps.dsm); // re-derived over the new world
    const changed = changedGlowUnits(beforeSigs, sigMap(after));
    for (const id of ['dsm:P2:C1', 'dsm:P2:C2', 'dsm:P2:C5']) {
      expect(changed.has(id)).toBe(false); // same displayed values — dark, honestly
    }
    // The panel's dependency set still moved (new world hashes) — the tab-level
    // change is real; only the value-keyed row glow stays dark.
    expect(dsmPanel(after)!.deps).not.toEqual(dsmPanel(before)!.deps);
  });
});
