import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import type {
  Commitment,
  KnowledgeObject,
  Plan,
  ScenarioCOA,
  VignetteConfig,
} from '../src/generated/types.js';
import { KnowledgeService } from '../src/knowledge.js';
import { CompileService } from '../src/compile.js';
import { ScoreService } from '../src/score.js';
import { RelaxService } from '../src/relax.js';
import { relaxCandidates } from '../src/relaxCandidates.js';
import { validateInstance } from '../src/validate.js';
import { isRefusal, type RelaxResult } from '../src/seam.js';
import type { Ref } from '../src/store.js';
import { ENGINE_VERSION } from '../src/engine.js';

const load = <T>(name: string): T[] =>
  JSON.parse(readFileSync(new URL(`../fixtures/${name}.json`, import.meta.url), 'utf8')) as T[];

const knowledge = load<KnowledgeObject>('knowledge');
const coas = load<ScenarioCOA>('coas');
const commitments = load<Commitment>('commitments');
const config = JSON.parse(
  readFileSync(new URL('../fixtures/vignette-config.json', import.meta.url), 'utf8'),
) as VignetteConfig;

const byId = new Map(knowledge.map((k) => [k.logical_id, k]));
const K = (id: string): KnowledgeObject => structuredClone(byId.get(id)!);
const answered = (id: string): KnowledgeObject => ({ ...K(id), status: 'answered' });
const ref = (id: string): Ref => ({ logical_id: id, content_hash: '' });
const BASE = ['K1', 'K2', 'K3', 'K4', 'K6', 'K7', 'K8', 'K9'];
const ENGINE = ENGINE_VERSION;
const cRefs = commitments.map((c) => ref(c.logical_id));

interface Rig {
  svc: KnowledgeService;
  scorer: ScoreService;
  relax: RelaxService;
  worldRef: Ref;
}

async function setup(): Promise<Rig> {
  const svc = new KnowledgeService();
  for (const id of BASE) await svc.create(answered(id));
  await svc.create(K('K12a'));
  await svc.create(K('K12b'));
  svc.contest('K12a', 'K12b');
  svc.resolve('K12a', 'defector debrief corroborated');
  for (const coa of coas) await svc.store.put(coa as unknown as Record<string, unknown>);
  for (const c of commitments) await svc.store.put(c as unknown as Record<string, unknown>);

  const compiler = new CompileService({ knowledge: svc });
  const compiled = await compiler.compile({
    knowledge: [...BASE, 'K12a'].map(ref),
    config,
    scenario: 'R3m',
    engine_version: ENGINE,
  });
  if (isRefusal(compiled)) throw new Error(`R3m compile refused: ${compiled.reason}`);

  const scorer = new ScoreService({ store: svc.store, trace: svc.trace, config, commitments });
  const relax = new RelaxService({ store: svc.store, trace: svc.trace, scorer, commitments });
  return { svc, scorer, relax, worldRef: compiled.world };
}

const ok = (r: RelaxResult) => {
  if (isRefusal(r)) throw new Error(`expected success, got refusal ${r.reason}`);
  return r;
};

const setOf = (c: { sacrificed: string[] }): string => [...c.sacrificed].sort().join('+');

describe('SPEC-09 — the candidate set (US1)', () => {
  it('produces valid Plans with the five force elements, deterministic in seed', () => {
    const a = relaxCandidates(1);
    const b = relaxCandidates(1);
    expect(a).toEqual(b); // deterministic
    const FES = ['FE-BROOM', 'FE-PACKHORSE', 'FE-ANVIL', 'FE-FALCON', 'FE-KINGFISHER'].sort();
    for (const p of a) {
      expect(validateInstance('Plan', p)).toEqual([]);
      expect(p.logical_id).toMatch(/^RX-/);
      expect(p.elements.map((e) => e.force_element).sort()).toEqual(FES);
    }
  });
});

describe('SPEC-09 — /relax over the Meridian R3m world', () => {
  let rig: Rig;
  beforeEach(async () => {
    rig = await setup();
  });

  it('returns a non-empty report (G4, SC-001)', async () => {
    const r = ok(await rig.relax.relax({ world: rig.worldRef, commitments: cRefs, seed: 1, engine_version: ENGINE }));
    expect(r.report.candidates.length).toBeGreaterThan(0);
    expect(r.report.world_stamp).toBeTruthy();
    expect(r.report.scenario).toBe('R3m');
  });

  // C5 joins every set (SPEC-20, note 02-compile.md §6): the R3m excursion drops
  // the causeway, the excursion layer beats K2's base estimate, `causeway_intact`
  // scores `violated` for every candidate — a computed sacrifice, common to all
  // three sets, so relative inclusion-minimality between candidates is unchanged.
  it('yields three candidates sacrificing {C4,C5}, {C3,C5}, {C2,C5} (US1-2, SC-001) 🎯 exit', async () => {
    const r = ok(await rig.relax.relax({ world: rig.worldRef, commitments: cRefs, seed: 1, engine_version: ENGINE }));
    expect(r.report.candidates).toHaveLength(3);
    const sets = r.report.candidates.map(setOf).sort();
    expect(sets).toEqual(['C2+C5', 'C3+C5', 'C4+C5']);
  });

  it('each candidate has non-empty sacrificed, computed by the scorer (US1-3, SC-004)', async () => {
    const r = ok(await rig.relax.relax({ world: rig.worldRef, commitments: cRefs, seed: 1, engine_version: ENGINE }));
    for (const cand of r.report.candidates) {
      expect(cand.sacrificed.length).toBeGreaterThan(0); // G4
      // Re-score the plan: exactly its sacrificed commitments are `violated`.
      const planRef = rig.svc.store.versions(cand.plan).at(-1)!;
      const scored = await rig.scorer.score({ plan: planRef, world: rig.worldRef, scenario: 'R3m', engine_version: ENGINE });
      if (isRefusal(scored)) throw new Error('re-score refused');
      const violated = scored.verdicts.filter((v) => v.verdict === 'violated').map((v) => v.commitment).sort();
      expect(violated).toEqual([...cand.sacrificed].sort());
    }
  });

  it('excludes strict-superset sacrifices — {C2,C4,C5} and {C3,C4,C5} never appear (US2, SC-002)', async () => {
    const r = ok(await rig.relax.relax({ world: rig.worldRef, commitments: cRefs, seed: 1, engine_version: ENGINE }));
    const sets = r.report.candidates.map(setOf);
    expect(sets).not.toContain('C2+C4+C5');
    expect(sets).not.toContain('C3+C4+C5');
  });

  it('ranks least-worst first: the C2 must-sacrifice is last, but present (US3, SC-003)', async () => {
    const r = ok(await rig.relax.relax({ world: rig.worldRef, commitments: cRefs, seed: 1, engine_version: ENGINE }));
    const order = r.report.candidates.map(setOf);
    expect(order).toContain('C2+C5'); // the must-sacrifice is returned (never dropped)
    expect(order.indexOf('C2+C5')).toBe(order.length - 1); // …ranked last (least-worst first)
    // The two should-sacrifices (C3, C4) precede it.
    expect(order.indexOf('C3+C5')).toBeLessThan(order.indexOf('C2+C5'));
    expect(order.indexOf('C4+C5')).toBeLessThan(order.indexOf('C2+C5'));
  });

  it('every candidate narrative states the causeway state in command language (SPEC-20 US3)', async () => {
    const r = ok(await rig.relax.relax({ world: rig.worldRef, commitments: cRefs, seed: 1, engine_version: ENGINE }));
    for (const cand of r.report.candidates) {
      expect(cand.sacrificed).toContain('C5'); // computed, never authored
      expect(cand.narrative.toLowerCase()).toContain('causeway');
    }
  });

  it('states the same-tier tie-break (C3/C4), never silently (US3, SC-003)', async () => {
    const r = ok(await rig.relax.relax({ world: rig.worldRef, commitments: cRefs, seed: 1, engine_version: ENGINE }));
    expect(r.report.tie_break).toBeTruthy();
    expect(r.report.tie_break).toMatch(/commitment id/i);
    expect(r.report.tie_break).toMatch(/DEC-19/);
  });

  it('every candidate narrative is command language — no decimal, no verdict token (US4, G2)', async () => {
    const r = ok(await rig.relax.relax({ world: rig.worldRef, commitments: cRefs, seed: 1, engine_version: ENGINE }));
    for (const cand of r.report.candidates) {
      expect(cand.narrative.length).toBeGreaterThan(0);
      expect(cand.narrative).not.toMatch(/\d+\.\d+/); // no decimals
      expect(cand.narrative).not.toMatch(/margin|m_lo|m_hi/i); // no verdict-internal tokens
    }
  });

  it('writes cited_in and sacrificed_in edges to the report (US4, G3, SC-005)', async () => {
    const before = rig.svc.trace.edges.length;
    const r = ok(await rig.relax.relax({ world: rig.worldRef, commitments: cRefs, seed: 1, engine_version: ENGINE }));
    const reportHash = (await rig.svc.store.put(r.report as unknown as Record<string, unknown>)).content_hash;
    const cited = rig.svc.trace.edges.filter((e) => e.edge_type === 'cited_in' && e.to_hash === reportHash);
    const sacrificedIn = rig.svc.trace.edges.filter((e) => e.edge_type === 'sacrificed_in' && e.to_hash === reportHash);
    expect(cited.length).toBeGreaterThan(0);
    expect(sacrificedIn.length).toBeGreaterThan(0);
    expect(rig.svc.trace.edges.length).toBeGreaterThan(before);
  });

  it('is deterministic: same (world, commitments, seed) ⇒ identical stamp & report (US5, SC-006)', async () => {
    const a = ok(await rig.relax.relax({ world: rig.worldRef, commitments: cRefs, seed: 1, engine_version: ENGINE }));
    const b = ok(await rig.relax.relax({ world: rig.worldRef, commitments: cRefs, seed: 1, engine_version: ENGINE }));
    expect(a.stamp).toBe(b.stamp);
    expect(a.report.candidates).toEqual(b.report.candidates);
    expect(a.report.tie_break).toEqual(b.report.tie_break);
  });

  it('refuses unknown_ref for an unresolvable world, persisting nothing (FR-012)', async () => {
    const before = rig.svc.store.size;
    const r = await rig.relax.relax({
      world: { logical_id: 'NO-SUCH-WORLD', content_hash: '' },
      commitments: cRefs,
      seed: 1,
      engine_version: ENGINE,
    });
    expect(isRefusal(r)).toBe(true);
    if (isRefusal(r)) expect(r.reason).toBe('unknown_ref');
    expect(rig.svc.store.size).toBe(before);
  });
});
