/**
 * SPEC-19 T14 — the drag-to-recompute smoke (Node, crypto.subtle ≥19), in the
 * app-bootstrap mould: drive the DOM-free CoaVizState exactly as the shell
 * does, assert the C4 exhibit, the value-keyed glow set, the refusal path,
 * and that the edited-plan re-score is byte-identical to a from-scratch run
 * over the same inputs (G1).
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Commitment, KnowledgeObject, Plan, VignetteConfig } from '../src/generated/types.js';
import { KnowledgeService } from '../src/knowledge.js';
import { CompileService } from '../src/compile.js';
import { ScoreService } from '../src/score.js';
import { isRefusal } from '../src/seam.js';
import type { Ref } from '../src/store.js';
import { CoaVizState, type CoaVizSnapshot } from '../src/app/coaViz.js';
import { changedGlowUnits, type SignatureMap } from '../src/app/glow.js';
import { ENGINE_VERSION } from '../src/engine.js';

const load = <T>(name: string): T[] =>
  JSON.parse(readFileSync(new URL(`../fixtures/${name}.json`, import.meta.url), 'utf8')) as T[];
const fx = {
  knowledge: load<KnowledgeObject>('knowledge'),
  commitments: load<Commitment>('commitments'),
  plans: load<Plan>('plans'),
  config: JSON.parse(
    readFileSync(new URL('../fixtures/vignette-config.json', import.meta.url), 'utf8'),
  ) as VignetteConfig,
};
const BASE = ['K1', 'K2', 'K3', 'K4', 'K6', 'K7', 'K8', 'K9'];
const ref = (id: string): Ref => ({ logical_id: id, content_hash: '' });

/** Harvest data-glow-id/sig pairs from rendered section html (no DOM in Node). */
const sigMap = (snap: CoaVizSnapshot): SignatureMap => {
  const map: SignatureMap = new Map();
  const html = snap.sections.map((s) => s.html).join('\n');
  for (const m of html.matchAll(/data-glow-id="([^"]+)" data-glow-sig="([^"]*)"/g)) {
    map.set(m[1]!, m[2]!);
  }
  return map;
};

async function seeded(): Promise<CoaVizState> {
  const state = new CoaVizState(structuredClone(fx));
  await state.seed();
  return state;
}

describe('CoaVizState — input recomputes through the real pipeline (US4)', () => {
  it('opens on the honest baseline: P1 C4 tight with margin [-24, 0], banked in fac_waters', async () => {
    const state = await seeded();
    const snap = await state.snapshot();
    const sig = sigMap(snap);
    expect(sig.get('v:P1:C4')).toBe('tight');
    expect(sig.get('coaviz:c4:P1')).toBe('tight|-24–0 band-hours|v1');
    expect(sig.get('coa:profile:P1:FE-ANVIL')).toBe('12-36 band-hours');
    expect(snap.planVersions).toEqual({ P1: 1, P2: 1 });
    expect(snap.stamps.world).toBeTruthy();
  });

  it('scrubbing is selection, not recompute: stamps identical across steps', async () => {
    const state = await seeded();
    state.setStep(24);
    const at24 = await state.snapshot();
    state.setStep(40);
    const at40 = await state.snapshot();
    expect(at24.stamps).toEqual(at40.stamps); // nothing recomputed
    expect(at24.sections.find((s) => s.id === 'map')!.html).toContain('coa:cell:storm:open_water');
    expect(at40.sections.find((s) => s.id === 'map')!.html).not.toContain('coa:cell:storm:open_water');
    state.setStep(999);
    expect(state.step).toBe(fx.config.grid.horizon_steps); // clamped, never off the clock
  });

  it('dragging FE-ANVIL clear of fac_waters re-scores P1×C4 live and glows exactly what moved (G6)', async () => {
    const state = await seeded();
    const before = sigMap(await state.snapshot());
    await state.moveWaypoint('P1', 'FE-ANVIL', 1, 26, 25); // out of fac_waters, into no threat region
    const snap = await state.snapshot();
    const after = sigMap(snap);

    expect(snap.notice).toBeUndefined();
    expect(snap.planVersions.P1).toBe(2); // a NEW plan version — never a mutation (DEC-20/21)
    expect(after.get('v:P1:C4')).toBe('robust'); // the verdict moved through the real scorer
    expect(after.get('coaviz:c4:P1')).toBe('robust|12 band-hours|v2');
    expect(after.get('coa:profile:P1:FE-ANVIL')).toBe('0-0 band-hours');

    const changed = changedGlowUnits(before, after);
    expect(changed.has('v:P1:C4')).toBe(true);
    expect(changed.has('coaviz:c4:P1')).toBe(true);
    expect(changed.has('coa:wp:P1:FE-ANVIL:1')).toBe(true);
    expect(changed.has('coa:profile:P1:FE-ANVIL')).toBe(true);
    // no over-report: P2 and the world's surfaces did not move
    expect(changed.has('v:P2:C4')).toBe(false);
    expect(changed.has('coa:cell:threat:fac_waters')).toBe(false);
    expect(changed.has('coa:win:K9')).toBe(false);
  });

  it('the edited-plan re-score is byte-identical to a from-scratch run over the same inputs (G1)', async () => {
    const state = await seeded();
    await state.moveWaypoint('P1', 'FE-ANVIL', 1, 26, 25);
    const snap = await state.snapshot();
    const { plan: edited } = state.latestPlan('P1');

    // From scratch: fresh store, fresh services, same fixtures, same edited plan.
    const svc = new KnowledgeService();
    for (const id of BASE) {
      const ko = structuredClone(fx.knowledge.find((k) => k.logical_id === id)!);
      await svc.create({ ...ko, status: 'answered' });
    }
    const compiler = new CompileService({ knowledge: svc });
    const compiled = await compiler.compile({ knowledge: BASE.map(ref), config: fx.config, engine_version: ENGINE_VERSION });
    if (isRefusal(compiled)) throw new Error('from-scratch compile refused');
    const planRef = await svc.store.put(structuredClone(edited) as unknown as Record<string, unknown>);
    const scorer = new ScoreService({
      store: svc.store,
      trace: svc.trace,
      config: fx.config,
      commitments: fx.commitments,
    });
    const scored = await scorer.score({
      plan: planRef,
      world: compiled.world,
      scenario: 'BASE',
      engine_version: ENGINE_VERSION,
    });
    if (isRefusal(scored)) throw new Error('from-scratch score refused');

    expect(compiled.stamp).toBe(snap.stamps.world); // same world, byte-identical stamp
    expect(scored.stamp).toBe(snap.stamps.scores.P1); // same score run, byte-identical stamp
    const c4 = scored.verdicts.find((v) => v.commitment === 'C4')!;
    expect(c4.verdict).toBe('robust');
    expect(c4.margin).toEqual({ lo: 12, hi: 12, unit: 'band-hours' });
  });

  it('shifting a task window authors a new version and the window sig moves', async () => {
    const state = await seeded();
    await state.shiftWindow('P1', 'FE-ANVIL', 1, 4);
    const snap = await state.snapshot();
    expect(snap.planVersions.P1).toBe(2);
    expect(sigMap(snap).get('coa:task:P1:FE-ANVIL:1')).toBe('32,22@12-13');
  });

  it('a dishonest input is refused in place and persists nothing (G2/G5)', async () => {
    const state = await seeded();

    // Assert an assessed hard constraint without its waiver → waiver_required.
    await state.assertWithoutWaiver('K8');
    let snap = await state.snapshot();
    expect(snap.notice?.kind).toBe('refusal');
    expect(snap.notice?.html).toContain('waiver');
    expect(state.store.versions('K8')).toHaveLength(1); // nothing persisted

    // An inverted band violates the closed interval (DEC-15) → refused pre-flight.
    await state.editBand('K6', { lo: 6, hi: 2, unit: 'sorties/day' });
    snap = await state.snapshot();
    expect(snap.notice?.kind).toBe('refusal');
    expect(snap.notice?.html).toContain('lo &gt; hi');
    expect(state.store.versions('K6')).toHaveLength(1);

    // An honest widen goes through and the world re-stamps.
    const before = await (async () => {
      const s = await seeded();
      return (await s.snapshot()).stamps.world;
    })();
    await state.editBand('K6', { lo: 2, hi: 8, unit: 'sorties/day' });
    snap = await state.snapshot();
    expect(snap.notice).toBeUndefined();
    expect(state.store.versions('K6')).toHaveLength(2);
    expect(snap.stamps.world).not.toBe(before); // the compile consumed the new K6
    expect(sigMap(snap).get('v:P1:C4')).toBe('tight'); // wider band, C4 still straddles
  });
});
