/**
 * SPEC-26 US1 (the P1 exit, SC-001) — the state-at-seq reconstruction contract.
 *
 * For every cursor position over the canonical heartbeat, `reconstructAt(n)`
 * must be BYTE-EQUAL to a fresh store fed deltas 1…n (the fold, not merely the
 * filter) — asserted against an actual fresh replay via `seedCanonicalTo(n)`,
 * not against the filter that produces it (note 15 §2, G1). The heartbeat
 * refusals/stamps replay as themselves, and a cursor move glows exactly the
 * moved-value units (DEC-34, G6).
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Commitment, KnowledgeObject, Plan, ScenarioCOA, VignetteConfig } from '../src/generated/types.js';
import { AppState, type Fixtures, type Snapshot } from '../src/app/state.js';
import { changedGlowUnits, type SignatureMap } from '../src/app/glow.js';

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

/** A byte-comparable projection of a snapshot: exactly what the reader sees plus
 *  the per-panel dependency set (Set → sorted array) and the run's stamps. */
const serialise = (snap: Snapshot): string =>
  JSON.stringify({
    panels: snap.panels.map((p) => ({ id: p.id, tab: p.tab, title: p.title, html: p.html, deps: [...p.deps].sort() })),
    resolved: snap.resolved,
    scenario: snap.scenario,
    stamps: snap.stamps,
    deltaCount: snap.deltaCount,
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

// The heartbeat landmarks in the canonical seed (pinned; see AppState.#canonicalActs).
const CONTEST_SEQ = 18;
const REFUSED_SEQ = 19;
const RESOLVE_SEQ = 20;
const EDIT_K8_SEQ = 21;

describe('SPEC-26 — reconstruction is byte-equal to a fresh fold (FR-001, SC-001)', () => {
  it('the canonical heartbeat records 21 deltas including a refused attempt', async () => {
    const app = await canonical();
    expect(app.historyMaxSeq).toBe(21);
    expect(app.deltas.find((d) => d.seq === REFUSED_SEQ)?.op).toBe('refused');
    expect(app.deltas.find((d) => d.seq === CONTEST_SEQ)?.op).toBe('contest');
    expect(app.deltas.find((d) => d.seq === RESOLVE_SEQ)?.op).toBe('resolve');
  });

  it('reconstructAt(n) equals a fresh replay of deltas 1…n, for every n (the fold)', async () => {
    const app = await canonical();
    for (let n = 0; n <= app.historyMaxSeq; n++) {
      const reconstructed = await app.reconstructAt(n);
      const fresh = new AppState(fx());
      await fresh.seedCanonicalTo(n);
      const freshSnap = await fresh.snapshot();
      expect(serialise(reconstructed), `state(${n}) must byte-equal the fresh fold`).toBe(
        serialise(freshSnap),
      );
    }
  }, 30000);

  it('n = 0 is the honest empty store — no compile, no error', async () => {
    const app = await canonical();
    const snap = await app.reconstructAt(0);
    expect(snap.deltaCount).toBe(0);
    expect(snap.stamps.world).toBeUndefined(); // nothing to compile — no world stamp
    // The knowledge table has no rows at seq 0 (BASE not yet created).
    const s1 = snap.panels.find((p) => p.id === 's1')!;
    expect(s1.html).not.toContain('data-glow-id="k:K1"');
  });

  it('seq 18 reconstructs the contested-compile refusal; seq 20 the recompiled stamp', async () => {
    const app = await canonical();
    const atContest = await app.reconstructAt(CONTEST_SEQ);
    const channels = atContest.panels.find((p) => p.id === 'channels')!;
    expect(channels.html).toContain('contested_knowledge'); // the refusal, re-derived (G5)
    expect(atContest.stamps.world).toBeUndefined();

    const atResolve = await app.reconstructAt(RESOLVE_SEQ);
    expect(atResolve.stamps.world).toBeTruthy(); // compile unblocks — a real stamp
    expect(atResolve.resolved).toBe(true);
  });

  it('the seq-21 edit re-stamps the world (a new belief, a new stamp)', async () => {
    const app = await canonical();
    const before = await app.reconstructAt(RESOLVE_SEQ);
    const after = await app.reconstructAt(EDIT_K8_SEQ);
    expect(after.stamps.world).toBeTruthy();
    expect(after.stamps.world).not.toBe(before.stamps.world); // K8 is a hard constraint — it moves the world
  });

  it('a refused attempt is a cursor position with unchanged belief-state (§3 edge case)', async () => {
    const app = await canonical();
    const priorState = await app.reconstructAt(REFUSED_SEQ - 1);
    const atRefused = await app.reconstructAt(REFUSED_SEQ);
    // The KNOWLEDGE/compile state is unchanged — stamps, verdicts, resolved identical…
    expect(atRefused.stamps).toEqual(priorState.stamps);
    expect(atRefused.resolved).toBe(priorState.resolved);
    expect(atRefused.panels.find((p) => p.id === 'channels')!.html).toBe(
      priorState.panels.find((p) => p.id === 'channels')!.html,
    );
    // …but the ATTEMPT is recorded — the delta feed grew by exactly the refused row.
    expect(atRefused.deltaCount).toBe(priorState.deltaCount + 1);
    const observer = atRefused.panels.find((p) => p.id === 'observer')!;
    expect(observer.html).toContain('refused');
  });

  it('a cursor move re-fires the value-keyed glow — moved units only (FR-003, G6)', async () => {
    const app = await canonical();
    // 18 (contested, refusal) → 20 (resolved, compiled): the K12a row moves, the
    // world appears; unrelated BASE rows do not glow.
    const before = sigMap(await app.reconstructAt(CONTEST_SEQ));
    const after = sigMap(await app.reconstructAt(RESOLVE_SEQ));
    const changed = changedGlowUnits(before, after);
    expect(changed.has('k:K12a')).toBe(true); // contested → resolved
    for (const id of ['k:K1', 'k:K2', 'k:K4', 'k:K6', 'k:K7']) {
      expect(changed.has(id), `${id} must not glow (no over-report)`).toBe(false);
    }
    // the planner world came into existence — its channel units glow
    expect([...changed].some((id) => id.startsWith('ch:') || id.startsWith('v:'))).toBe(true);
  });

  it('replay reconstruction never mutates the live head (read-only, FR-004)', async () => {
    const app = await canonical();
    const headBefore = app.historyMaxSeq;
    const storeBefore = app.store.size;
    await app.reconstructAt(CONTEST_SEQ);
    await app.reconstructAt(0);
    await app.reconstructAt(EDIT_K8_SEQ);
    expect(app.historyMaxSeq).toBe(headBefore); // no delta published by a scrub
    expect(app.store.size).toBe(storeBefore); // no object written by a scrub
  });
});
