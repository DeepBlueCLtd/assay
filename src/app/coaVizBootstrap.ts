/**
 * SPEC-19 — browser entry for the COA-visualisation mockup. esbuild inlines the
 * fixtures (JSON modules) and every src module, so the emitted page is fully
 * self-contained and offline-clean (comms §6 rule 4) while running the REAL
 * in-browser pipeline — compile and score are the shipped services, not a
 * precomputed lookup (DEC-4).
 */
import knowledge from '../../fixtures/knowledge.json' with { type: 'json' };
import commitments from '../../fixtures/commitments.json' with { type: 'json' };
import plans from '../../fixtures/plans.json' with { type: 'json' };
import config from '../../fixtures/vignette-config.json' with { type: 'json' };
import type { Commitment, KnowledgeObject, Plan, VignetteConfig } from '../generated/types.js';
import { CoaVizState } from './coaViz.js';
import { mountCoaViz } from './coaVizShell.js';

const fx = {
  knowledge: knowledge as unknown as KnowledgeObject[],
  commitments: commitments as unknown as Commitment[],
  plans: plans as unknown as Plan[],
  config: config as unknown as VignetteConfig,
};

async function main(): Promise<void> {
  const root = document.getElementById('coaviz-root');
  if (!root) throw new Error('coaViz bootstrap: no #coaviz-root element');
  const state = new CoaVizState(fx);
  await state.seed();
  mountCoaViz(root, state, fx.config.grid);
}

void main();
