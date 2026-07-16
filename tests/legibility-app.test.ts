/**
 * SPEC-25 — app-level legibility exhibits (research note 13 §8).
 *
 * US1: the verdict legend is reachable from every surface that renders a verdict.
 * US3: the R3m cards carry the derived at-risk basis and numbered, trace-linked
 * reasons; `sacrificed` still means exactly the violated set (SPEC-09 unchanged);
 * on Meridian the candidates are Pareto-clean vs the incumbent, so the at-risk
 * residue is honestly empty (a true, reassuring finding — never fabricated).
 * Structural: no urgency/score scalar is introduced anywhere (FR-007).
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { AppState, type Fixtures, type Snapshot } from '../src/app/state.js';
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

const resolvedSnapshot = async (): Promise<Snapshot> => {
  const app = new AppState(fixtures());
  await app.seed();
  app.resolveK12();
  return app.snapshot();
};

describe('SPEC-25 US1 — the verdict legend is reachable from every verdict surface', () => {
  it('every panel that renders a four-stop verdict chip carries the verdict legend', async () => {
    const snap = await resolvedSnapshot();
    const verdictPanels = snap.panels.filter((p) => /assay-verdict-chip/.test(p.html));
    expect(verdictPanels.length).toBeGreaterThan(0);
    for (const p of verdictPanels) {
      expect(p.html, `panel ${p.id} renders verdicts but no legend`).toContain('assay-verdict-legend');
    }
  });

  it('the legend illustration is the frozen O-3 sweep, not live data', async () => {
    const snap = await resolvedSnapshot();
    const matrix = snap.panels.find((p) => p.id === 'matrix')!;
    expect(matrix.html).toContain('[9,13]');
    expect(matrix.html).toMatch(/measure-zero/i);
  });
});

describe('SPEC-25 US3 — relaxation cards v2', () => {
  it('the cards state the at-risk basis (incumbent P1 under R3m) and keep sacrificed = violated set', async () => {
    const snap = await resolvedSnapshot();
    const cards = snap.panels.find((p) => p.id === 'cards')!;
    expect(cards.html).toMatch(/Puts at risk.*basis/i);
    expect(cards.html).toMatch(/incumbent P1/i);
    expect(cards.html).toMatch(/sacrificed.*means exactly the violated set/i);
    // The known R3m sacrifice sets (SPEC-20): {C4,C5}, {C3,C5}, {C2,C5}.
    for (const cid of ['C2', 'C3', 'C4', 'C5']) {
      expect(cards.html).toContain(`>${cid}<`);
    }
  });

  it('numbered reasons are individually trace-walkable (G3) and carry no decimal (G2)', async () => {
    const snap = await resolvedSnapshot();
    const cards = snap.panels.find((p) => p.id === 'cards')!;
    // Reasons render as an ordered list; each reason chip carries a logical id.
    expect(cards.html).toContain('<ol');
    // Each sacrificed reason carries its commitment id for the trace menu.
    expect(cards.html).toMatch(/<li data-logical-id="C\d"/);
    // No decimal margin on the card face (CSS px sizes stripped — the banded
    // margin stays in the trace drawer, never a decimal on the face).
    const cardFaces = cards.html
      .split('<li data-logical-id="RX')
      .slice(1)
      .join('')
      .replace(/style="[^"]*"/g, '');
    expect(cardFaces).not.toMatch(/\d+\.\d+/);
  });
});

describe('SPEC-25 — no new scalar introduced (FR-007)', () => {
  it('no verdict/relax/legend surface carries an urgency, score, or percentage scalar', async () => {
    const snap = await resolvedSnapshot();
    for (const id of ['matrix', 'cards', 'scenarios']) {
      const panel = snap.panels.find((p) => p.id === id);
      if (!panel) continue;
      expect(panel.html, `${id} has urgency scalar`).not.toMatch(/urgency|risk score|priority score/i);
    }
  });
});
