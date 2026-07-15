import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { validateInstance } from '../src/validate.js';
import type { Commitment, KnowledgeObject, Plan, ScenarioCOA, VignetteConfig } from '../src/generated/types.js';

const load = <T>(name: string): T[] =>
  JSON.parse(readFileSync(new URL(`../fixtures/${name}.json`, import.meta.url), 'utf8')) as T[];

const knowledge = load<KnowledgeObject>('knowledge');
const commitments = load<Commitment>('commitments');
const coas = load<ScenarioCOA>('coas');
const forceElements = load<Record<string, unknown>>('force-elements');
const plans = load<Plan>('plans');
const vignetteConfig = JSON.parse(
  readFileSync(new URL('../fixtures/vignette-config.json', import.meta.url), 'utf8'),
) as VignetteConfig;

describe('Meridian fixtures validate against generated types (SPEC-04; Stage-0 exit)', () => {
  it.each(knowledge.map((k) => [k.logical_id, k] as const))('%s validates', (_id, k) => {
    expect(validateInstance('KnowledgeObject', k)).toEqual([]);
  });
  it.each(commitments.map((c) => [c.logical_id, c] as const))('%s validates', (_id, c) => {
    expect(validateInstance('Commitment', c)).toEqual([]);
  });
  it.each(coas.map((r) => [r.logical_id, r] as const))('%s validates', (_id, r) => {
    expect(validateInstance('ScenarioCOA', r)).toEqual([]);
  });
  it.each(forceElements.map((f) => [f.logical_id, f] as const))('%s validates', (_id, f) => {
    expect(validateInstance('ForceElement', f)).toEqual([]);
  });
  it.each(plans.map((p) => [p.logical_id, p] as const))('%s validates (SPEC-07 canned handful)', (_id, p) => {
    expect(validateInstance('Plan', p)).toEqual([]);
  });
});

describe('SPEC-07 canned handful (delivery plan §3 fallback)', () => {
  const feIds = new Set(forceElements.map((f) => f.logical_id as string));
  const regions = JSON.parse(
    readFileSync(new URL('../fixtures/vignette-config.json', import.meta.url), 'utf8'),
  ).regions as { name: string; x0: number; y0: number; x1: number; y1: number }[];
  const horizon = vignetteConfig.grid.horizon_steps;

  it('is P1/P2 (thesis-C pair), every leg in-grid, every element a known FE-*', () => {
    expect(plans.map((p) => p.logical_id)).toEqual(['P1', 'P2']);
    for (const p of plans) {
      for (const ep of p.elements) {
        expect(feIds.has(ep.force_element), `${p.logical_id} ${ep.force_element}`).toBe(true);
        for (const leg of ep.route ?? []) {
          expect(leg.x).toBeGreaterThanOrEqual(0);
          expect(leg.x).toBeLessThan(vignetteConfig.grid.cols);
          expect(leg.y).toBeLessThan(vignetteConfig.grid.rows);
          expect(leg.enter_step).toBeLessThanOrEqual(leg.exit_step);
          expect(leg.exit_step).toBeLessThanOrEqual(horizon);
        }
      }
    }
  });

  it('routes reach the regions their metrics read (BROOM/PACKHORSE through the strait)', () => {
    const inRegion = (name: string, x: number, y: number): boolean => {
      const g = regions.find((r) => r.name === name)!;
      return x >= g.x0 && x <= g.x1 && y >= g.y0 && y <= g.y1;
    };
    for (const p of plans) {
      const broom = p.elements.find((e) => e.force_element === 'FE-BROOM')!;
      expect(broom.route!.some((l) => inRegion('halcyon_strait', l.x, l.y)), `${p.logical_id} BROOM sweeps the strait`).toBe(true);
      const packhorse = p.elements.find((e) => e.force_element === 'FE-PACKHORSE')!;
      expect(packhorse.route!.some((l) => inRegion('port_district', l.x, l.y)), `${p.logical_id} PACKHORSE reaches port`).toBe(true);
    }
  });
});

describe('fixture set is complete against vignette identifiers (§5, §6, §3)', () => {
  it('carries K1–K14 (with a/b/c variants), C1–C6, R1–R3(+R3m), FE-*', () => {
    const kIds = knowledge.map((k) => k.logical_id);
    expect(kIds).toEqual([
      'K1', 'K2', 'K3', 'K4', 'K5', 'K6', 'K7', 'K8', 'K9', 'K10',
      'K11', 'K12a', 'K12b', 'K13', 'K14a', 'K14b', 'K14c',
    ]);
    expect(commitments.map((c) => c.logical_id)).toEqual(['C1', 'C2', 'C3', 'C4', 'C5', 'C6']);
    expect(coas.map((r) => r.logical_id)).toEqual(['R1', 'R2', 'R3', 'R3m']);
    expect(forceElements.map((f) => f.logical_id)).toEqual([
      'FE-ANVIL', 'FE-BROOM', 'FE-FALCON', 'FE-PACKHORSE', 'FE-KINGFISHER',
    ]);
  });

  it('the vignette config (SPEC-06) validates and routes every compilable subject to a known region', () => {
    expect(validateInstance('VignetteConfig', vignetteConfig)).toEqual([]);
    const regionNames = new Set(vignetteConfig.regions.map((g) => g.name));
    // every subject_map entry names a region the config gives geometry for
    for (const entry of vignetteConfig.subject_map) {
      expect(regionNames.has(entry.region), `subject_map ${entry.subject} → ${entry.region}`).toBe(true);
    }
    // every answered, spatial (non scenario_weight) knowledge subject has a route
    const routed = new Set(vignetteConfig.subject_map.map((e) => e.subject));
    for (const k of knowledge) {
      if (k.encoding_class === 'scenario_weight') continue; // firewalled — never routed
      if (k.subject === 'threat.will_to_fight') continue; // K10 — refused/retired, never compiled
      expect(routed.has(k.subject), `${k.logical_id} subject ${k.subject} is routable`).toBe(true);
    }
    // every COA excursion region has geometry
    for (const coa of coas) {
      for (const ov of coa.excursion ?? []) {
        expect(regionNames.has(ov.region!), `${coa.logical_id} excursion → ${ov.region}`).toBe(true);
      }
    }
    // scenario.likelihood is firewalled by omission from the subject map
    expect(routed.has('scenario.likelihood')).toBe(false);
  });

  it('expected_answers reference existing COAs', () => {
    const coaIds = new Set(coas.map((r) => r.logical_id));
    for (const k of knowledge) {
      for (const ea of k.expected_answers ?? []) {
        expect(coaIds.has(ea.coa), `${k.logical_id} → ${ea.coa}`).toBe(true);
      }
    }
  });

  it('COA likelihoods reference scenario_weight knowledge objects', () => {
    const byId = new Map(knowledge.map((k) => [k.logical_id, k]));
    for (const r of coas) {
      const weight = byId.get(r.likelihood!);
      expect(weight?.encoding_class, `${r.logical_id} likelihood`).toBe('scenario_weight');
    }
  });
});

describe('SPEC-21: every K names its originating JIPOE step (research note 01, amendment §A.2)', () => {
  // Oracle-style pin of the note-01 §3 audit, machine-carried. A change to any
  // row is a register/coverage matter, not a casual edit.
  const PINNED_ASSIGNMENTS: Record<string, string> = {
    K1: 'step1_define_oe',
    K2: 'step2_describe_effects',
    K3: 'step1_define_oe',
    K4: 'step3_evaluate_adversary',
    K5: 'step2_describe_effects',
    K6: 'step3_evaluate_adversary',
    K7: 'step2_describe_effects',
    K8: 'step3_evaluate_adversary',
    K9: 'step2_describe_effects',
    K10: 'step3_evaluate_adversary',
    K11: 'step4_determine_adversary_coas',
    K12a: 'step3_evaluate_adversary',
    K12b: 'step3_evaluate_adversary',
    K13: 'step4_determine_adversary_coas',
    K14a: 'step4_determine_adversary_coas',
    K14b: 'step4_determine_adversary_coas',
    K14c: 'step4_determine_adversary_coas',
  };

  it('every vignette KnowledgeObject carries exactly its pinned step — no drift, no omission', () => {
    const actual = Object.fromEntries(knowledge.map((k) => [k.logical_id, k.jipoe_step]));
    expect(actual).toEqual(PINNED_ASSIGNMENTS);
  });

  it('K14a–c carry step 4 — likelihood judgements about adversary COAs are step-4 products', () => {
    for (const id of ['K14a', 'K14b', 'K14c']) {
      expect(knowledge.find((k) => k.logical_id === id)?.jipoe_step).toBe(
        'step4_determine_adversary_coas',
      );
    }
  });

  it('retired K10 carries its step — retirement does not erase origin', () => {
    const k10 = knowledge.find((k) => k.logical_id === 'K10')!;
    expect(k10.status).toBe('retired');
    expect(k10.jipoe_step).toBe('step3_evaluate_adversary');
  });
});

describe('fixtures protect the coverage-matrix rows they exist for (vignette §7)', () => {
  const byId = new Map(knowledge.map((k) => [k.logical_id, k]));
  const bandsOf = (id: string): Map<string, { lo: number; hi: number }> =>
    new Map((byId.get(id)!.expected_answers ?? []).map((ea) => [ea.coa, ea.band]));

  it('thesis D: K11 discriminates R1 vs R2 (disjoint bands); K13 does not (all bands overlap)', () => {
    const k11 = bandsOf('K11');
    expect(k11.get('R1')!.hi).toBeLessThan(k11.get('R2')!.lo); // disjoint — one look answers it

    const k13 = [...bandsOf('K13').values()];
    for (const a of k13) {
      for (const b of k13) {
        expect(a.lo <= b.hi && b.lo <= a.hi).toBe(true); // every pair overlaps — nearly uninformative
      }
    }
  });

  it('thesis E: K8 is single-source, waiver-carrying, hard_constraint', () => {
    const k8 = byId.get('K8')!;
    expect(k8.provenance?.single_source).toBe(true);
    expect(k8.waiver?.granted_by).toBe('J-3');
    expect(k8.encoding_class).toBe('hard_constraint');
  });

  it('thesis F: K5 and K9 validity windows abut at step 8 on the scenario clock', () => {
    expect(byId.get('K5')!.validity).toEqual({ valid_from: 0, valid_until: 16 });
    expect(byId.get('K9')!.validity).toEqual({ valid_from: 8, valid_until: 36 });
  });

  it('G5: the contested pair answers the same question with irreconcilable bands', () => {
    const a = byId.get('K12a')!;
    const b = byId.get('K12b')!;
    expect(a.question).toBe(b.question);
    expect(a.status).toBe('contested');
    expect(b.status).toBe('contested');
    expect(a.answer!.hi).toBeLessThan(b.answer!.lo);
  });

  it('DEC-14: observed values are degenerate bands; every non-observed answer is a real interval or flagged', () => {
    for (const k of knowledge) {
      if (!k.answer || !k.provenance) continue;
      if (k.provenance.source_class === 'observed') {
        expect(k.answer.lo, k.logical_id).toBe(k.answer.hi);
      }
    }
  });

  it('DEC-19: no numeric weight appears anywhere on a commitment', () => {
    for (const c of commitments) {
      expect('weight' in (c as unknown as Record<string, unknown>)).toBe(false);
      expect(['must', 'should', 'prefer']).toContain(c.tier);
    }
  });
});
