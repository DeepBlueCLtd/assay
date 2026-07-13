/**
 * SPEC-14 (flow-view sub-slice) — acceptance intent AS-1..AS-11 as real tests.
 *
 * Each asserts one honesty constraint or interaction from the flow-infographic
 * spec §9, over the REAL seam outputs `src/flow.ts` captures (nothing mocked) and
 * the self-contained page `src/flowPage.ts` emits.
 */
import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import type {
  Commitment,
  KnowledgeObject,
  ScenarioCOA,
  VignetteConfig,
} from '../src/generated/types.js';
import {
  buildFlowModel,
  computeState,
  stateId,
  DEFAULT_KEY,
  type FlowFixtures,
  type FlowModel,
  type StateKey,
} from '../src/flow.js';
import { renderFlowPage } from '../src/flowPage.js';
import { RelaxService } from '../src/relax.js';
import { KnowledgeService } from '../src/knowledge.js';
import { CompileService } from '../src/compile.js';
import { ScoreService } from '../src/score.js';
import { isRefusal } from '../src/seam.js';
import type { CompiledWorld } from '../src/generated/types.js';

const read = (p: string): string => readFileSync(new URL(`../fixtures/${p}`, import.meta.url), 'utf8');
const fx: FlowFixtures = {
  knowledge: JSON.parse(read('knowledge.json')) as KnowledgeObject[],
  coas: JSON.parse(read('coas.json')) as ScenarioCOA[],
  commitments: JSON.parse(read('commitments.json')) as Commitment[],
  config: JSON.parse(read('vignette-config.json')) as VignetteConfig,
};
const SEED = 42;

let model: FlowModel;
beforeAll(async () => {
  model = await buildFlowModel(fx, SEED);
}, 60_000);

const compiledDefault = () => model.states[stateId(DEFAULT_KEY)]!;
const key = (k: Partial<StateKey>): StateKey => ({
  coa: 'R1',
  contest: 'resolved',
  superseded: true,
  waiver: 'granted',
  ...k,
});

describe('AS-1 · banded honesty (G2) — no bare assessed scalar', () => {
  it('renders every channel value through a band pill welded to its provenance', () => {
    const st = compiledDefault();
    expect(st.outcome).toBe('compiled');
    // every J-2-lane and channel-trace assessed value goes through the shipped
    // components, so the mandatory "assessment, not fact" marking rides along.
    expect(st.channelHtml).toContain('assay-band');
    expect(st.channelHtml).toContain('assessment, not fact');
    expect(st.writeNodes).toContain('assay-provenance');
    // the verdict matrix face is the four-stop word only — no decimal in the cell
    // (the margin band rides on the hover title). No standalone decimals leak.
    const cellFaces = (st.matrixHtml ?? '').replace(/title="[^"]*"/g, '');
    expect(cellFaces).not.toMatch(/>\s*-?\d+\.\d+\s*</);
  });
});

describe('AS-2 · recompute attribution — never silent', () => {
  it('a recompute triggered by a knowledge write lands a delta AND flips the stamp', async () => {
    const before = await computeState(fx, key({ superseded: false }), SEED);
    const after = await computeState(fx, key({ superseded: true }), SEED);
    expect(before.outcome).toBe('compiled');
    expect(after.outcome).toBe('compiled');
    // the supersede write published a real, attributable delta …
    expect(after.deltas.some((d) => d.op === 'supersede')).toBe(true);
    expect(before.deltas.some((d) => d.op === 'supersede')).toBe(false);
    // … and the world it recompiled carries a different stamp (K9 not K5).
    expect(after.stampShort).not.toBe(before.stampShort);
  });
});

describe('AS-3 · contest gate (G5)', () => {
  it('a contested pair refuses compile, names the pair, and mints no world stamp', () => {
    const st = model.states[stateId(key({ contest: 'contested' }))]!;
    expect(st.outcome).toBe('refused');
    expect(st.refusalHtml).toContain('contested_knowledge');
    expect(st.refusalHtml).toMatch(/K12a/);
    expect(st.stampShort).toBeUndefined();
  });
});

describe('AS-4 · staleness fan-out (F) — scripted, labelled, exact', () => {
  it('flags exactly {P1·C2, P2·C1, P2·C2} and marks the result not-yet-computed', () => {
    const st = model.states[stateId(key({ superseded: true }))]!;
    expect(st.staleScripted).toBeDefined();
    expect(st.staleScripted!.flagged).toEqual(['P1·C2', 'P2·C1', 'P2·C2']);
    expect(st.staleScripted!.note.toLowerCase()).toContain('/analyse/staleness');
    // and the emitted page marks the fan-out visibly "scripted — not yet computed"
    expect(renderFlowPage(model)).toContain('scripted — not yet computed');
    // a state with no supersession must NOT carry a fan-out
    expect(model.states[stateId(key({ superseded: false }))]!.staleScripted).toBeUndefined();
  });
});

describe('AS-5 · waiver travel (DEC-9)', () => {
  it('withholding W-1 refuses waiver_required; granting travels the waives edge', () => {
    const withheld = model.states[stateId(key({ waiver: 'withheld' }))]!;
    expect(withheld.outcome).toBe('refused');
    expect(withheld.refusalHtml).toContain('waiver_required');

    const granted = compiledDefault();
    expect(granted.waiverActive).toBe(true); // a `waives` edge is live
  });
});

describe('AS-6 · least-worst (G4)', () => {
  it('R3m returns three inclusion-minimal candidates, each sacrificing something, tie-break stated', async () => {
    const st = model.states[stateId(key({ coa: 'R3m' }))]!;
    expect(st.outcome).toBe('compiled');
    expect(st.relaxHtml).toContain('least-worst #1');
    expect(st.relaxHtml).toContain('least-worst #3');
    expect(st.tieBreak).toBeTruthy();

    // assert the underlying report directly (not via HTML): 3 candidates, each
    // `sacrificed` non-empty — the invariant, computed by the reused scorer.
    const report = await relaxR3m();
    expect(report.candidates).toHaveLength(3);
    for (const c of report.candidates) expect(c.sacrificed.length).toBeGreaterThan(0);
    expect(report.candidates.flatMap((c) => c.sacrificed).sort()).toEqual(['C2', 'C3', 'C4']);
  });
});

describe('AS-7 · comparability (G1)', () => {
  it('a cross-stamp score refuses stamp_mismatch rather than render a value', () => {
    expect(model.comparability.reason).toBe('stamp_mismatch');
  });
});

describe('AS-8 · zoom register', () => {
  it('L2 detail terminates every channel value in a named owner (backward chain, G3)', () => {
    expect(compiledDefault().channelHtml).toContain('owner:');
  });
  it('the L0 orientation claim carries no doctrinal identifier', () => {
    // L0 is the non-specialist entry: one sentence, no K*/C*/R* nodes. The page's
    // renderL0 string (in the client) must not embed a doctrinal id.
    const page = renderFlowPage(model);
    const client = page.split('window.__FLOW__')[1] ?? '';
    const l0 = client.slice(client.indexOf('function renderL0'), client.indexOf('function renderL1'));
    expect(l0).not.toMatch(/\bK\d|\bC\d\b|\bR3m\b/);
  });
});

describe('AS-9 · determinism (G1)', () => {
  it('same seed + same tableau ⇒ byte-identical model', async () => {
    const again = await buildFlowModel(fx, SEED);
    expect(JSON.stringify(again)).toBe(JSON.stringify(model));
  }, 60_000);
});

describe('AS-10 · undo — re-seeding returns the frozen tableau exactly', () => {
  it('recomputing the default state reproduces it byte-for-byte', async () => {
    const a = await computeState(fx, DEFAULT_KEY, SEED);
    const b = await computeState(fx, DEFAULT_KEY, SEED);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(a.stampShort).toBe(compiledDefault().stampShort);
  });
});

describe('AS-11 · self-containment (embed constraint §4.6)', () => {
  it('the emitted page makes zero external network references', () => {
    const page = renderFlowPage(model);
    expect(page).not.toMatch(/https?:\/\/fonts\./);
    expect(page).not.toMatch(/<link[^>]+rel=["']?stylesheet/i);
    expect(page).not.toMatch(/<script[^>]+src=/i);
    expect(page).not.toMatch(/https?:\/\/[^"')\s]+\.(?:css|js|woff2?|ttf|png|jpg|svg)/i);
  });
});

// ————— helper: the real R3m relaxation report (for AS-6's invariant) —————

async function relaxR3m() {
  const kById = new Map(fx.knowledge.map((k) => [k.logical_id, k]));
  const svc = new KnowledgeService();
  const put = (id: string, status = 'answered') =>
    svc.store.put({ ...structuredClone(kById.get(id)!), status } as unknown as Record<string, unknown>);
  for (const id of ['K1', 'K2', 'K3', 'K4', 'K6', 'K7', 'K8', 'K9']) await put(id);
  await put('K5');
  await put('K12a', 'contested');
  await put('K12b', 'contested');
  for (const coa of fx.coas) await svc.store.put(coa as unknown as Record<string, unknown>);
  for (const c of fx.commitments) await svc.store.put(c as unknown as Record<string, unknown>);
  await svc.supersede({ ...structuredClone(kById.get('K9')!), status: 'answered' }, 'K5');
  svc.contest('K12a', 'K12b');
  svc.resolve('K12a', 'note');
  const ref = (id: string) => ({ logical_id: id, content_hash: '' });
  const compiler = new CompileService({ knowledge: svc });
  const r = await compiler.compile({
    knowledge: ['K1', 'K2', 'K3', 'K4', 'K6', 'K7', 'K8', 'K9', 'K12a'].map(ref),
    config: fx.config,
    scenario: 'R3m',
    engine_version: '0.1.0',
    seed: SEED,
  });
  if (isRefusal(r)) throw new Error('R3m compile refused');
  const scorer = new ScoreService({ store: svc.store, trace: svc.trace, config: fx.config, commitments: fx.commitments });
  const relax = new RelaxService({ store: svc.store, trace: svc.trace, scorer, commitments: fx.commitments });
  const rr = await relax.relax({
    world: r.world,
    commitments: fx.commitments.map((c) => ref(c.logical_id)),
    seed: SEED,
    engine_version: '0.1.0',
  });
  if (isRefusal(rr)) throw new Error('relax refused');
  void (svc.store.get(r.world.content_hash) as CompiledWorld);
  return rr.report;
}
