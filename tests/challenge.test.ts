/**
 * SPEC-25 US4 — the challenge affordance (research note 13 §5).
 *
 * Challenge re-renders the SPEC-11 sensitivity ranking scoped to a verdict:
 * the knowledge that, pushed to its band edge, flips it. No new compute (the
 * stamp matches an equivalent sensitivity call); an insensitive verdict renders
 * the honest "nothing flips it" — itself assurance.
 *
 * On Meridian under BASE the honest C4 flipper is K6 (the documented
 * band-propagation, SPEC-18): the plans route clear of the threatened water, so
 * K8 (the fire-control threshold) is genuinely insensitive there — surfacing it
 * would be false. K8's single-source flag is demonstrated on the ranking and the
 * component (below); it becomes load-bearing under the threat scenarios, not BASE.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { AppState, type Fixtures } from '../src/app/state.js';
import { challengePanel, type ChallengeResult } from '../src/components/challengePanel.js';
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

describe('SPEC-25 US4 — the challenge affordance', () => {
  it('challenging C4 surfaces the computed sensitivity contributor (K6 flips it, tight → marginal)', async () => {
    const app = new AppState(fixtures());
    await app.seed();
    app.resolveK12();
    const result = await app.challenge('P1', 'C4');
    expect(result).toBeDefined();
    expect(result!.commitment).toBe('C4');
    expect(result!.verdict).toBe('tight');
    const ids = result!.contributors.map((c) => c.knowledge);
    expect(ids).toContain('K6');
    const k6 = result!.contributors.find((c) => c.knowledge === 'K6')!;
    expect(k6.from).toBe('tight');
    expect(k6.to).toBe('marginal');
  });

  it('an insensitive verdict renders the honest "nothing flips it" — assurance, not a blank (AS-2)', async () => {
    const app = new AppState(fixtures());
    await app.seed();
    app.resolveK12();
    // C6 (extraction) is robust and no single band-edge movement flips it.
    const result = await app.challenge('P1', 'C6');
    expect(result).toBeDefined();
    expect(result!.contributors).toHaveLength(0);
    const html = challengePanel(result!);
    expect(html).toMatch(/No single band-edge movement flips this verdict/i);
    expect(html).toMatch(/assurance/i);
  });

  it('no new compute — the challenge stamp matches an equivalent sensitivity call (Independent Test)', async () => {
    const app = new AppState(fixtures());
    await app.seed();
    app.resolveK12();
    const a = await app.challenge('P1', 'C4');
    const b = await app.challenge('P1', 'C2'); // same plan/world ⇒ same sensitivity stamp
    expect(a!.stamp).toBe(b!.stamp);
  });

  it('the affordance is absent (undefined), not erroring, when the world refuses (contested)', async () => {
    const app = new AppState(fixtures());
    await app.seed(); // K12 unresolved ⇒ compile refuses ⇒ nothing to challenge
    const result = await app.challenge('P1', 'C4');
    expect(result).toBeUndefined();
  });

  it('the panel co-displays a single-source flag for a single-source contributor (K8 semantics)', () => {
    // K8 carries single_source: true (SPEC-11); when a challenge surfaces it, the
    // flag renders alongside — never collapsed into the ranking (DEC-19).
    const result: ChallengeResult = {
      plan: 'RX-exposed',
      commitment: 'C4',
      verdict: 'tight',
      contributors: [{ knowledge: 'K8', single_source: true, from: 'tight', to: 'violated' }],
      stamp: 'x',
    };
    const html = challengePanel(result);
    expect(html).toMatch(/single-source/i);
    expect(html).toContain('K8');
    // deep-link hook to the S1 row (the trace menu wires on data-logical-id).
    expect(html).toContain('data-logical-id="K8"');
  });
});
