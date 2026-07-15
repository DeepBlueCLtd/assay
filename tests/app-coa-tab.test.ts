/**
 * SPEC-19 T15 (DEC-36d) — the Spatial · COA tab in the live app: same single
 * store, so the map refuses with the compile while K12 is contested, appears
 * (and glows) on resolve, and a drag re-scores the canned P1 through the real
 * pipeline exactly as the standalone mockup does.
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

const coaPanels = (snap: Snapshot) => snap.panels.filter((p) => p.tab === 'coa');
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

describe('Spatial · COA tab — the promoted surface over the one store (DEC-36)', () => {
  it('refuses with the compile while K12 is contested; appears and glows on resolve', async () => {
    const app = await seeded();
    const before = await app.snapshot();
    const refusalPanel = coaPanels(before).find((p) => p.id === 'coamap')!;
    expect(refusalPanel.html).toContain('contested_knowledge'); // G5 — no blank, no guessed surface
    expect(coaPanels(before).some((p) => p.id === 'coatimeline')).toBe(false);

    app.resolveK12();
    const after = await app.snapshot();
    const ids = coaPanels(after).map((p) => p.id);
    expect(ids).toEqual(['coamap', 'coatimeline', 'coaverdicts']);
    // the resolved K12a now backs a threat override over mine_stock, on the map
    expect(coaPanels(after).find((p) => p.id === 'coamap')!.html).toContain('coa:cell:threat:mine_stock');
    // and the change is glow-visible (the panel went refusal → rendered map)
    const changed = changedGlowUnits(sigMap(before), sigMap(after));
    expect(changed.has('coa:cell:threat:mine_stock')).toBe(true);
  });

  it('a drag re-scores the canned P1 live: C4 tight → robust, glow keyed to what moved', async () => {
    const app = await seeded();
    app.resolveK12();
    const before = await app.snapshot();
    expect(sigMap(before).get('v:P1:C4')).toBe('tight');
    expect(sigMap(before).get('coa:profile:P1:FE-ANVIL')).toBe('12-36 band-hours');

    await app.moveWaypoint('P1', 'FE-ANVIL', 1, 26, 25);
    const after = await app.snapshot();
    expect(sigMap(after).get('v:P1:C4')).toBe('robust');
    expect(sigMap(after).get('coaviz:c4:P1')).toBe('robust|12 band-hours|v2');

    const changed = changedGlowUnits(sigMap(before), sigMap(after));
    expect(changed.has('v:P1:C4')).toBe(true);
    expect(changed.has('coa:wp:P1:FE-ANVIL:1')).toBe(true);
    expect(changed.has('v:P2:C4')).toBe(false); // no over-report (G6)
  });

  it('scrubbing the spatial clock is selection: stamps unchanged, no plan versions', async () => {
    const app = await seeded();
    app.resolveK12();
    app.setStep(24);
    const at24 = await app.snapshot();
    app.setStep(40);
    const at40 = await app.snapshot();
    expect(at24.stamps).toEqual(at40.stamps);
    expect(coaPanels(at24).find((p) => p.id === 'coamap')!.html).toContain('coa:cell:storm:open_water');
    expect(coaPanels(at40).find((p) => p.id === 'coamap')!.html).not.toContain('coa:cell:storm:open_water');
  });

  it('without the plans fixture the app renders exactly as before (no coa panels)', async () => {
    const { plans: _omit, ...rest } = structuredClone(fx);
    const app = new AppState(rest as Fixtures);
    await app.seed();
    const snap = await app.snapshot();
    expect(coaPanels(snap)).toHaveLength(0);
  });
});
