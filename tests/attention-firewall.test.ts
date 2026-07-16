/**
 * SPEC-22 — the firewall's negative half stays pinned while the positive half
 * ships (spec US3; research note docs/research/11-attention.md §4).
 *
 * Two machine-checkable properties give "orders attention and reporting,
 * never compiles" its teeth:
 *
 * 1. ZERO COMPUTATIONAL MOVEMENT — editing a K14 likelihood band (a legal
 *    knowledge write) changes no world stamp, verdict, score, handful
 *    membership, relaxation output, or analysis stamp. Only strip emphasis
 *    and queue tie-breaks may move (FR-004, SC-002).
 * 2. IMPORT ISOLATION — the attention/strip modules import no scoring
 *    machinery, and compile/score/dominance/relax import nothing from them
 *    (FR-005). Structural, not conventional.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { AppState, type Fixtures } from '../src/app/state.js';
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

describe('SPEC-22 — a weight edit moves attention, and nothing else (FR-004)', () => {
  it('editing K14a changes zero stamps and zero verdict panels; the attention block moves', async () => {
    const app = new AppState(fixtures());
    await app.seed();
    app.resolveK12(); // open the full pipeline so every stamp exists
    const before = await app.snapshot();

    // A legal knowledge write: the K14a band narrows (still ICD 203-shaped).
    await app.editBand('K14a', { lo: 55, hi: 70, unit: '%' });
    const after = await app.snapshot();

    // Every computational stamp is identical — the weight reached nothing (G1).
    expect(before.stamps.world).toBeTruthy();
    expect(after.stamps).toEqual(before.stamps);

    // Verdict-bearing panels are byte-identical: matrix, cards, spatial verdicts.
    // (Staleness is compared by stamp above, not bytes — every snapshot
    // re-drives the pipeline and grows the trace store's chains-walked count,
    // an artefact of re-driving, not of the K14 edit.)
    const html = (snap: typeof before, id: string) => snap.panels.find((p) => p.id === id)?.html;
    for (const id of ['matrix', 'cards', 'channels', 'coaverdicts', 'sensitivity']) {
      expect(html(after, id)).toBe(html(before, id));
    }

    // The strip's attention block DID move — the edit is visible where it may be.
    const stripBefore = html(before, 'scenarios')!;
    const stripAfter = html(after, 'scenarios')!;
    expect(stripBefore).toContain('45–70 %');
    expect(stripAfter).toContain('55–70 %');
    expect(stripAfter).not.toBe(stripBefore);
    // …but the verdict grid inside the strip is untouched: strip both
    // attention blocks and the remainders match (US1 AS-2).
    const gridOf = (s: string) => s.slice(s.indexOf('<div style="overflow-x:auto">'));
    expect(gridOf(stripAfter)).toBe(gridOf(stripBefore));
  });

  it('the strip renders the Meridian attention exhibit from the live store', async () => {
    const app = new AppState(fixtures());
    await app.seed();
    app.resolveK12();
    const snap = await app.snapshot();
    const strip = snap.panels.find((p) => p.id === 'scenarios')!.html;
    expect(strip).toContain('orders attention — never compiles');
    expect(strip).toContain('data-logical-id="K14a"');
    // R1 alone in the top layer; R2/R3 level beneath (interval order).
    expect(strip).toMatch(/data-attention-layer="0"[\s\S]*?R1 · Fortress Halcyon/);
    expect(strip).toMatch(/data-attention-layer="1"[\s\S]*?R2 · Strait Denial[\s\S]*?R3 · Spoiling Withdrawal/);
  });

  it('a contested K14 drops out of ordering and tie-breaking; the pipeline is untouched (G5 lifecycle)', async () => {
    const app = new AppState(fixtures());
    await app.seed();
    app.resolveK12();
    const before = await app.snapshot();

    // Contest the R1 weight with a rival assessment (a legal dispute).
    const k14a = fixtures().knowledge.find((k) => k.logical_id === 'K14a')!;
    const rival: KnowledgeObject = {
      ...structuredClone(k14a),
      logical_id: 'K14a-rival',
      answer: { lo: 5, hi: 20, unit: '%' },
    };
    await app.knowledge.create(rival);
    app.knowledge.contest('K14a', 'K14a-rival');
    const after = await app.snapshot();

    // The world still compiles — a contested WEIGHT blocks nothing (it never
    // enters the compile), unlike contested channel knowledge (K12).
    expect(after.stamps.world).toBe(before.stamps.world);
    expect(after.stamps).toEqual(before.stamps);

    // The strip shows the contest mark and R1 leaves the ranked layers.
    const strip = after.panels.find((p) => p.id === 'scenarios')!.html;
    expect(strip).toContain('contested — orders nothing until resolved');
    expect(strip).toMatch(/data-attention-layer="0"[\s\S]*?R2 · Strait Denial/);
    expect(strip).not.toMatch(/data-attention-layer="1"/);
  });
});

describe('SPEC-22 — import isolation (FR-005): structural, not conventional', () => {
  const src = (p: string): string => readFileSync(new URL(`../src/${p}`, import.meta.url), 'utf8');
  const importsOf = (code: string): string[] =>
    [...code.matchAll(/from '([^']+)'/g)].map((m) => m[1]!);

  it('attention.ts and scenarioStrip.ts import no scoring machinery', () => {
    const forbidden = /(compile|score|materialise|metrics|relax|handful|robustness|sensitivity|discrimination|staleness)\.js$/;
    for (const file of ['attention.ts', 'components/scenarioStrip.ts']) {
      for (const imp of importsOf(src(file))) {
        expect(imp, `${file} imports ${imp}`).not.toMatch(forbidden);
      }
    }
  });

  it('compile/score/dominance/relax/materialise/metrics import nothing from attention or the strip', () => {
    const forbidden = /(attention|scenarioStrip)\.js$/;
    for (const file of ['compile.ts', 'score.ts', 'dominance.ts', 'relax.ts', 'materialise.ts', 'metrics.ts', 'discrimination.ts', 'robustness.ts']) {
      for (const imp of importsOf(src(file))) {
        expect(imp, `${file} imports ${imp}`).not.toMatch(forbidden);
      }
    }
  });

  it('the existing negative-half guarantee stands in source: scenario_weight is filtered at the compile partition', () => {
    expect(src('encoding.ts')).toContain(`ko.encoding_class !== 'scenario_weight'`);
    expect(src('compile.ts')).toContain('mayCompileAsConstraintOrCost');
  });
});
