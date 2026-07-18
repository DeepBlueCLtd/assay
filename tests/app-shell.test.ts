// @vitest-environment happy-dom
/**
 * SPEC-26 — the shell mounts and DRIVES end-to-end (the verify step, SC-001/002):
 * the heartbeat scrubber replays a past belief-state, writes are disabled in
 * replay, a narrative runs on its scrub path, and the recursive trace tooltip
 * opens. A DOM smoke test over the real mountShell — the one stateful layer the
 * unit tests otherwise cannot reach.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Commitment, KnowledgeObject, Plan, ScenarioCOA, VignetteConfig } from '../src/generated/types.js';
import { AppState, type Fixtures } from '../src/app/state.js';
import { mountShell } from '../src/app/shell.js';

// happy-dom rewrites import.meta.url, so resolve fixtures from the repo root.
const load = <T>(name: string): T =>
  JSON.parse(readFileSync(resolve(process.cwd(), 'fixtures', `${name}.json`), 'utf8')) as T;
const fx = (): Fixtures => ({
  knowledge: load<KnowledgeObject[]>('knowledge'),
  coas: load<ScenarioCOA[]>('coas'),
  commitments: load<Commitment[]>('commitments'),
  plans: load<Plan[]>('plans'),
  config: load<VignetteConfig>('vignette-config'),
});

const tick = (ms = 30): Promise<void> => new Promise((r) => setTimeout(r, ms));

/** Poll until `pred` holds (the async rerender chain — compile/score/relax — is
 *  CPU-bound and can outrun a fixed wait under happy-dom). */
async function until(pred: () => boolean, timeout = 5000): Promise<void> {
  const start = Date.now();
  while (!pred()) {
    if (Date.now() - start > timeout) throw new Error('timed out waiting for the shell to settle');
    await tick();
  }
}

/** Mount the canonical-heartbeat app and wait for the first render to settle. */
async function mounted(): Promise<{ root: HTMLElement; app: AppState }> {
  const app = new AppState(fx());
  await app.seedCanonical();
  const root = document.createElement('div');
  document.body.appendChild(root);
  mountShell(root, app);
  await until(() => root.querySelector('#assay-hist-range') !== null);
  return { root, app };
}

describe('SPEC-26 — the shell drives end-to-end (verify)', () => {
  it('mounts with the decision-history scrubber at the live head', async () => {
    const { root, app } = await mounted();
    const range = root.querySelector('#assay-hist-range') as HTMLInputElement;
    expect(range).toBeTruthy();
    expect(Number(range.max)).toBe(app.historyMaxSeq);
    expect(Number(range.value)).toBe(app.historyMaxSeq); // opens at the head
    expect(root.querySelector('#assay-history')!.textContent).toContain('Decision history');
  });

  it('scrubbing back to the contested seq enters replay and shows the refusal', async () => {
    const { root } = await mounted();
    const range = root.querySelector('#assay-hist-range') as HTMLInputElement;
    range.value = '18'; // the contest
    range.dispatchEvent(new Event('input'));
    await until(() => document.documentElement.getAttribute('data-replay') === 'on');
    await until(() => root.querySelector('#assay-history')!.textContent!.includes('replaying seq 18'));
    const panels = root.querySelector('#assay-panels') as HTMLElement;
    expect(panels.textContent).toContain('contested'); // the refusal replays (G5)
  });

  it('the slider element is stable across rerenders — a continuous drag scrubs many steps', async () => {
    const { root } = await mounted();
    const range = root.querySelector('#assay-hist-range') as HTMLInputElement;
    // Simulate a continuous drag: several input events on the SAME element.
    for (const seq of [17, 15, 12, 9]) {
      range.value = String(seq);
      range.dispatchEvent(new Event('input'));
      await until(() => root.querySelector('#assay-hist-seqpos')!.textContent!.includes(`seq ${seq} `));
      // The element must NOT have been replaced (that is the bug — a rebuilt
      // innerHTML kills the drag after one step).
      expect(root.querySelector('#assay-hist-range')).toBe(range);
    }
    expect(root.querySelector('#assay-hist-seqpos')!.textContent).toContain('seq 9 ');
  });

  it('writes are disabled in replay — a resolve click is a no-op', async () => {
    const { root, app } = await mounted();
    const range = root.querySelector('#assay-hist-range') as HTMLInputElement;
    range.value = '18';
    range.dispatchEvent(new Event('input'));
    await until(() => document.documentElement.getAttribute('data-replay') === 'on');
    const headBefore = app.historyMaxSeq;
    (root.querySelector('#assay-resolve') as HTMLElement).click();
    await tick(150);
    expect(app.historyMaxSeq).toBe(headBefore); // no write happened in the past (FR-004)

    // returning to the live head re-enables writes
    (root.querySelector('#assay-hist-live') as HTMLButtonElement).click();
    await until(() => document.documentElement.getAttribute('data-replay') === 'off');
    expect(document.documentElement.getAttribute('data-replay')).toBe('off');
  });

  it('selecting a narrative runs it on its scrub path (beat 2 → seq waypoint)', async () => {
    const { root } = await mounted();
    const select = root.querySelector('#assay-narrative-select') as HTMLSelectElement;
    select.value = 'remit';
    select.dispatchEvent(new Event('change'));
    const narrator = root.querySelector('#assay-narrator') as HTMLElement;
    await until(() => narrator.textContent!.includes('beat 1 of'));
    expect(narrator.textContent).toContain('scrubbed to seq'); // driven by the cursor, not an action

    // advance to beat 2 (the refused-attempt waypoint, seq 19)
    (root.querySelector('#assay-beat-next') as HTMLButtonElement).click();
    await until(() => narrator.textContent!.includes('beat 2 of'));
    await until(() => root.querySelector('#assay-history')!.textContent!.includes('seq 19'));
  });

  it('a recursive trace tooltip opens from a knowledge chip with depth and remainder', async () => {
    const { root } = await mounted();
    // wait for the J-2 knowledge rows to render, then open a chip's menu
    await until(() => root.querySelector('[data-logical-id="K8"]') !== null);
    const chip = root.querySelector('[data-logical-id="K8"]') as HTMLElement;
    const target = (chip.tagName === 'TR' ? chip.querySelector('td') : chip) as HTMLElement;
    target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await until(() => document.querySelector('.assay-menu') !== null);
    const menu = document.querySelector('.assay-menu') as HTMLElement;
    expect(menu.textContent).toContain('relationships');
    expect(menu.textContent).toMatch(/Informs|Influences/);
    expect(menu.textContent).toContain('View full graph');
  });
});
