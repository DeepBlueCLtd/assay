/**
 * SPEC-26 US1 — replay-mode behaviour (AS-1…AS-3, the refused-attempt edge
 * case, and the "M new" head-growth indicator), at the AppState + cursor level
 * (the shell wires these pure pieces; the reconstruction contract itself is in
 * tests/history.test.ts).
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Commitment, KnowledgeObject, Plan, ScenarioCOA, VignetteConfig } from '../src/generated/types.js';
import { AppState, type Fixtures, type Snapshot } from '../src/app/state.js';
import { changedGlowUnits, type SignatureMap } from '../src/app/glow.js';
import { writesEnabled, newDeltaCount, type HistoryCursor } from '../src/app/history.js';

const load = <T>(name: string): T[] =>
  JSON.parse(readFileSync(new URL(`../fixtures/${name}.json`, import.meta.url), 'utf8')) as T[];
const fx = (): Fixtures => ({
  knowledge: load<KnowledgeObject>('knowledge'),
  coas: load<ScenarioCOA>('coas'),
  commitments: load<Commitment>('commitments'),
  plans: load<Plan>('plans'),
  config: JSON.parse(
    readFileSync(new URL('../fixtures/vignette-config.json', import.meta.url), 'utf8'),
  ) as VignetteConfig,
});
const sigMap = (snap: Snapshot): SignatureMap => {
  const m: SignatureMap = new Map();
  const re = /data-glow-id="([^"]*)" data-glow-sig="([^"]*)"/g;
  for (const p of snap.panels) {
    let match: RegExpExecArray | null;
    while ((match = re.exec(p.html)) !== null) m.set(match[1]!, match[2]!);
  }
  return m;
};
async function canonical(): Promise<AppState> {
  const app = new AppState(fx());
  await app.seedCanonical();
  return app;
}

describe('SPEC-26 US1 — replay mode', () => {
  it('AS-1: seq 18 renders the contested-compile refusal; seq 20 the recompiled stamp', async () => {
    const app = await canonical();
    const contested = await app.reconstructAt(18);
    expect(contested.panels.find((p) => p.id === 'channels')!.html).toContain('contested_knowledge');
    const resolved = await app.reconstructAt(20);
    expect(resolved.stamps.world).toBeTruthy();
    expect(resolved.panels.find((p) => p.id === 'matrix')).toBeDefined();
  });

  it('AS-2: a cursor move glows exactly the moved-value units, nowhere else', async () => {
    const app = await canonical();
    const before = sigMap(await app.reconstructAt(18)); // contested, refusal
    const after = sigMap(await app.reconstructAt(20)); // resolved, compiled
    const changed = changedGlowUnits(before, after);
    expect(changed.has('k:K12a')).toBe(true); // the resolved row moved
    // unrelated BASE rows did not move — no over-report (G6)
    for (const id of ['k:K1', 'k:K4', 'k:K7']) expect(changed.has(id)).toBe(false);
  });

  it('AS-3: replay disables writes structurally; live enables them', () => {
    expect(writesEnabled({ seq: 10, mode: 'replay' })).toBe(false);
    expect(writesEnabled({ seq: 21, mode: 'live' })).toBe(true);
  });

  it('a refused-delta seq is a cursor position with state(n) == state(n-1)', async () => {
    const app = await canonical();
    const refusedDelta = app.deltas.find((d) => d.op === 'refused');
    expect(refusedDelta).toBeDefined();
    const seq = refusedDelta!.seq; // 19
    const prior = await app.reconstructAt(seq - 1);
    const at = await app.reconstructAt(seq);
    // belief-state unchanged (stamps, verdict-bearing panels identical)…
    expect(at.stamps).toEqual(prior.stamps);
    expect(at.panels.find((p) => p.id === 's1')!.html).toBe(prior.panels.find((p) => p.id === 's1')!.html);
    // …but the attempt is recorded — the feed grew by one and shows it
    expect(at.deltaCount).toBe(prior.deltaCount + 1);
    expect(at.panels.find((p) => p.id === 'observer')!.html).toContain('refused');
  });

  it("'M new' bumps as the head grows while the cursor stays put (FR-004)", async () => {
    const app = await canonical();
    const headAtEntry = app.historyMaxSeq; // 21
    const cursor: HistoryCursor = { seq: 10, mode: 'replay' };
    expect(newDeltaCount(cursor, app.historyMaxSeq, headAtEntry)).toBe(0);

    // A new live delta lands at the head (reopen the contest) — the cursor is unmoved.
    const parked = await app.reconstructAt(cursor.seq);
    app.contestK12();
    await app.snapshot(); // publishes the contest delta at the head
    expect(app.historyMaxSeq).toBe(headAtEntry + 1);
    expect(newDeltaCount(cursor, app.historyMaxSeq, headAtEntry)).toBe(1);
    // the parked reconstruction is byte-identical — the cursor never silently jumped
    const stillParked = await app.reconstructAt(cursor.seq);
    expect(stillParked.stamps).toEqual(parked.stamps);
    expect(stillParked.deltaCount).toBe(parked.deltaCount);
  });

  it('live mode reports no new-delta count', () => {
    expect(newDeltaCount({ seq: 21, mode: 'live' }, 25, 21)).toBe(0);
  });
});
