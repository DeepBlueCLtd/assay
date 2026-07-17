/**
 * SPEC-16 — browser entry. Imports the Meridian fixtures as JSON modules (the
 * bundler inlines them, so the published artifact is self-contained — comms
 * §6.2 rule 4: no external services, no CDNs), seeds the real services, and
 * mounts the shell. The whole pipeline runs client-side because the hash path
 * is `globalThis.crypto.subtle` — one code path for Node and the browser
 * (canonical.ts), so nothing here is Node-specific.
 */
import knowledge from '../../fixtures/knowledge.json' with { type: 'json' };
import coas from '../../fixtures/coas.json' with { type: 'json' };
import commitments from '../../fixtures/commitments.json' with { type: 'json' };
import config from '../../fixtures/vignette-config.json' with { type: 'json' };
import plans from '../../fixtures/plans.json' with { type: 'json' };
import { AppState, type Fixtures } from './state.js';
import { mountShell } from './shell.js';

async function main(): Promise<void> {
  const fx = { knowledge, coas, commitments, config, plans } as unknown as Fixtures;
  const app = new AppState(fx);
  // The canonical heartbeat (SPEC-26) — the ONE recorded history the scrubber
  // replays and the five narratives scrub through (DEC-39). The live head lands
  // at the end of the heartbeat; the decision-history slider reaches any past.
  await app.seedCanonical();
  const root = (document.getElementById('app') ?? document.body) as HTMLElement;
  mountShell(root, app);
}

void main();
