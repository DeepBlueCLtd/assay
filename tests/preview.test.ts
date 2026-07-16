/**
 * SPEC-25 US2 — consequence preview: the ghost diff (research note 13 §2).
 *
 * The core exhibit: a preview runs the REAL pipeline over a byte-faithful shadow,
 * so the previewed diff equals the post-commit glow set element-for-element (rule
 * 3), the committed state is never touched (rule 2), and a dishonest armed act
 * previews its refusal (rule 1). These are the properties that make the ghost
 * "what will happen", not "a picture of what might".
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { AppState, type Fixtures } from '../src/app/state.js';
import { previewAct, applyArmedAct, sigMapOf } from '../src/preview.js';
import { changedGlowUnits } from '../src/app/glow.js';
import type {
  Commitment,
  KnowledgeObject,
  Plan,
  ScenarioCOA,
  VignetteConfig,
} from '../src/generated/types.js';

function fixtures(): Fixtures {
  const load = <T>(name: string): T =>
    JSON.parse(readFileSync(new URL(`../fixtures/${name}`, import.meta.url), 'utf8')) as T;
  return {
    knowledge: load<KnowledgeObject[]>('knowledge.json'),
    coas: load<ScenarioCOA[]>('coas.json'),
    commitments: load<Commitment[]>('commitments.json'),
    config: load<VignetteConfig>('vignette-config.json'),
    plans: load<Plan[]>('plans.json'),
  };
}

const setEqual = (a: Set<string>, b: Set<string>): boolean =>
  a.size === b.size && [...a].every((x) => b.has(x));

describe('SPEC-25 US2 — the consequence preview', () => {
  it('previewed diff ≡ post-commit glow set, byte-for-byte (resolve K12) — FR-002/rule 3', async () => {
    // Preview on one app instance, commit on an identically-seeded twin, so the
    // commit glow is computed against a pristine baseline.
    const app = new AppState(fixtures());
    await app.seed();
    const preview = await previewAct(app, { kind: 'resolve' });
    expect(preview.changed.size).toBeGreaterThan(0);

    const twin = new AppState(fixtures());
    await twin.seed();
    const before = sigMapOf(await twin.snapshot());
    twin.resolveK12();
    const after = sigMapOf(await twin.snapshot());
    const commitGlow = changedGlowUnits(before, after);

    expect(setEqual(preview.changed, commitGlow)).toBe(true);
  });

  it('the preview persists nothing on the committed app — no store growth, no delta, no resolve (rule 2)', async () => {
    const app = new AppState(fixtures());
    await app.seed();
    await app.snapshot(); // warm up (verdicts stored idempotently)
    const size0 = app.store.size;
    const deltas0 = (await app.snapshot()).deltaCount;

    await previewAct(app, { kind: 'resolve' });

    expect(app.resolved).toBe(false); // the resolve happened on the fork, not here
    expect(app.store.size).toBe(size0);
    expect((await app.snapshot()).deltaCount).toBe(deltas0);
  });

  it('arm → cancel leaves store size, delta count, and every stamp byte-identical (SC-002 cancel path)', async () => {
    const app = new AppState(fixtures());
    await app.seed();
    app.resolveK12();
    await app.snapshot(); // warm up
    const size0 = app.store.size;
    const snap0 = await app.snapshot();

    // Arm a band edit but never commit (cancel = discard the fork).
    await previewAct(app, { kind: 'band-edit', id: 'K3', band: { lo: 10000, hi: 20000, unit: 'persons' } });

    const snap1 = await app.snapshot();
    expect(app.store.size).toBe(size0);
    expect(snap1.deltaCount).toBe(snap0.deltaCount);
    expect(snap1.stamps).toEqual(snap0.stamps);
  });

  it('a committed previewed supersede reproduces the previewed diff exactly (rule 3, supersede act)', async () => {
    const app = new AppState(fixtures());
    await app.seed();
    app.resolveK12();
    await app.snapshot();
    const preview = await previewAct(app, {
      kind: 'band-edit',
      id: 'K3',
      band: { lo: 10000, hi: 20000, unit: 'persons' },
    });

    const twin = new AppState(fixtures());
    await twin.seed();
    twin.resolveK12();
    const before = sigMapOf(await twin.snapshot());
    await twin.editBand('K3', { lo: 10000, hi: 20000, unit: 'persons' });
    const after = sigMapOf(await twin.snapshot());
    const commitGlow = changedGlowUnits(before, after);

    expect(setEqual(preview.changed, commitGlow)).toBe(true);
  });

  it('a dishonest armed act previews its refusal and commits nothing (rule 1)', async () => {
    const app = new AppState(fixtures());
    await app.seed();
    app.resolveK12();
    await app.snapshot();
    const size0 = app.store.size;

    // An off-grid waypoint move — a plan edit that the geometry gate refuses.
    const preview = await previewAct(app, {
      kind: 'waypoint-move',
      plan: 'P1',
      element: 'FE-ANVIL',
      legIndex: 0,
      x: 999,
      y: 999,
    });

    expect(preview.refusal).toBeTruthy();
    expect(preview.refusal).toMatch(/refus/i);
    // Arming a refusing act persists nothing (the refusal IS the preview).
    expect(app.store.size).toBe(size0);
  });

  it('the ghost cells are four-stop verdict words, never decimals (G2, rule 4)', async () => {
    const app = new AppState(fixtures());
    await app.seed();
    const preview = await previewAct(app, { kind: 'resolve' });
    const verdictCells = preview.cells.filter((c) => c.verdict);
    expect(verdictCells.length).toBeGreaterThan(0);
    const words = new Set(['robust', 'marginal', 'tight', 'violated']);
    for (const c of verdictCells) {
      // The signature of a verdict cell is exactly the four-stop word.
      expect(words.has(c.to)).toBe(true);
    }
  });
});
