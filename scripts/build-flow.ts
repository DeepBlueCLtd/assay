/**
 * SPEC-14 (flow-view sub-slice) — build the interactive system-flow infographic.
 *
 * Seeds the real seam with the Meridian fixtures (SPEC-04), drives it to every
 * reachable tour beat and bounded sandbox state (`src/flow.ts` — real
 * compile/score/handful/relax, no compute faked), and emits one self-contained,
 * offline-clean HTML document (`src/flowPage.ts`).
 *
 * Output: docs/assets/flow/index.html (committed like the gallery so the comms
 * site can embed it; regenerate with `npm run flow`). Copied verbatim into the
 * published site as `flow.html` and linked from a Home-page card by
 * `scripts/build-site.ts` (comms plan §1.6 — reachable from the preview by
 * clicking, never by typing a URL).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildFlowModel, type FlowFixtures } from '../src/flow.js';
import { renderFlowPage } from '../src/flowPage.js';
import type {
  Commitment,
  KnowledgeObject,
  ScenarioCOA,
  VignetteConfig,
} from '../src/generated/types.js';

const root = new URL('../', import.meta.url);
const read = (p: string): string => readFileSync(fileURLToPath(new URL(p, root)), 'utf8');

const fixtures: FlowFixtures = {
  knowledge: JSON.parse(read('fixtures/knowledge.json')) as KnowledgeObject[],
  coas: JSON.parse(read('fixtures/coas.json')) as ScenarioCOA[],
  commitments: JSON.parse(read('fixtures/commitments.json')) as Commitment[],
  config: JSON.parse(read('fixtures/vignette-config.json')) as VignetteConfig,
};

// Seed 42 — the walkthrough/wireframe canonical seed (deterministic, G1).
const model = await buildFlowModel(fixtures, 42);
const page = renderFlowPage(model);

const outDir = new URL('docs/assets/flow/', root);
mkdirSync(fileURLToPath(outDir), { recursive: true });
writeFileSync(fileURLToPath(new URL('index.html', outDir)), page);
console.log(
  `wrote docs/assets/flow/index.html (${Object.keys(model.states).length} states, ${model.tour.length} tour beats)`,
);
