/**
 * EXPLORATORY PROTOTYPE — not a spec, not register-blessed, not on the DEC-11
 * research-first path. Committed only so the exploration survives the session;
 * promotion to a proper second vignette (research note → register candidate →
 * spec-kit) is a separate, deliberate decision.
 *
 * Purpose: prove one demonstration shape against the REAL ASSAY engine —
 *
 *   (1) a fresh military world ("Operation SANDPIPER") whose intelligence is
 *       authored to describe the world, BLIND to any course of action;
 *   (2) three hand-drawn COAs laid over that world afterwards;
 *   (3) the machine deciding, PREDICTABLY (== reproducibly), which piece of
 *       intelligence each COA actually depends on — computed two ways that must
 *       agree, and checked against a hand-derived relevance oracle.
 *
 * It drives the shipped services unchanged (compile/score/materialise/metrics);
 * the only thing added is a thin read-set projection over the same sparse
 * channels the scorer reads — no new engine (DEC-10 in spirit).
 *
 * Run:  npx tsx scratch/relevance.ts
 */
import { KnowledgeService } from '../src/knowledge.js';
import { CompileService } from '../src/compile.js';
import { ScoreService } from '../src/score.js';
import { ENGINE_VERSION } from '../src/engine.js';
import { channelAt } from '../src/materialise.js';
import { isRefusal } from '../src/seam.js';
import type { Ref } from '../src/store.js';
import type {
  Band,
  ChannelKind,
  Commitment,
  CommitmentVerdict,
  CompiledWorld,
  KnowledgeObject,
  Plan,
  RegionOverride,
  VignetteConfig,
} from '../src/generated/types.js';

// ───────────────────────────────────────────────────────────────────────────
// 1. THE WORLD — grid, channels, region geometry, subject routing.
//    (A fresh namespace: VC-SANDPIPER. Nothing here references a COA.)
// ───────────────────────────────────────────────────────────────────────────

const config: VignetteConfig = {
  logical_id: 'VC-SANDPIPER',
  version: 1,
  grid: { cols: 40, rows: 40, cell_km: 2, timestep_hours: 6, horizon_steps: 48 },
  channels: [
    { kind: 'mobility', default: { lo: 1, hi: 1, unit: 'transit factor' } },
    { kind: 'threat', default: { lo: 0, hi: 0, unit: 'threat index' } },
    { kind: 'storm', default: { lo: 0, hi: 0, unit: 'm surge' } },
    { kind: 'tide', default: { lo: 0, hi: 0, unit: 'm surge' } },
    { kind: 'civil_density', default: { lo: 0, hi: 0, unit: 'persons' } },
    { kind: 'sensor', default: { lo: 0, hi: 0, unit: 'coverage index' } },
  ],
  regions: [
    { name: 'open_water', x0: 0, y0: 30, x1: 39, y1: 39 },
    { name: 'north_channel', x0: 6, y0: 10, x1: 16, y1: 16 },
    { name: 'south_channel', x0: 6, y0: 22, x1: 16, y1: 28 },
    { name: 'cobalt_strait', x0: 18, y0: 12, x1: 26, y1: 20 },
    { name: 'raptor_arc', x0: 26, y0: 6, x1: 34, y1: 16 },
    { name: 'fac_waters', x0: 22, y0: 18, x1: 30, y1: 24 },
    { name: 'civil_town', x0: 18, y0: 24, x1: 26, y1: 30 },
    { name: 'causeway', x0: 16, y0: 16, x1: 20, y1: 20 },
    { name: 'objective', x0: 22, y0: 22, x1: 30, y1: 30 },
    { name: 'battery_sensor', x0: 30, y0: 2, x1: 36, y1: 8 },
    { name: 'north_shoal', x0: 2, y0: 2, x1: 8, y1: 8 },
  ],
  subject_map: [
    { subject: 'mobility.north_channel', channel: 'mobility', region: 'north_channel' },
    { subject: 'mobility.cobalt_strait', channel: 'mobility', region: 'cobalt_strait' },
    { subject: 'mobility.causeway', channel: 'mobility', region: 'causeway' },
    { subject: 'mobility.north_shoal', channel: 'mobility', region: 'north_shoal' },
    { subject: 'threat.raptor_arc', channel: 'threat', region: 'raptor_arc' },
    { subject: 'threat.fac_waters', channel: 'threat', region: 'fac_waters' },
    { subject: 'weather.south_channel', channel: 'storm', region: 'south_channel' },
    { subject: 'civil_density.town', channel: 'civil_density', region: 'civil_town' },
    { subject: 'sensor.battery', channel: 'sensor', region: 'battery_sensor' },
    { subject: 'tide.open_water', channel: 'tide', region: 'open_water' },
  ],
};

// ───────────────────────────────────────────────────────────────────────────
// 2. THE INTELLIGENCE — authored to describe the world, blind to any COA.
//    Each entry says something true about a place. Some places routes will
//    cross; some they never will. The author does not know which.
// ───────────────────────────────────────────────────────────────────────────

const prov = (
  source_class: 'observed' | 'reported' | 'assessed' | 'assumption',
  confidence: 'low' | 'moderate' | 'high',
  owner: string,
  single_source = false,
) => ({ source_class, confidence, owner, single_source, collected_at: 0 });

const knowledge: KnowledgeObject[] = [
  // ---- READ channels (mobility, threat): CAN be load-bearing ----
  {
    logical_id: 'S1', version: 1, jipoe_step: 'step2_describe_effects',
    question: 'What transit factor does the mined North Channel impose?',
    subject: 'mobility.north_channel', encoding_class: 'banded_soft_cost',
    answer: { lo: 0.3, hi: 0.6, unit: 'transit factor' },
    provenance: prov('assessed', 'moderate', 'J-2 MIW cell'),
    criticality: 'critical', status: 'answered',
  },
  {
    logical_id: 'S2', version: 1, jipoe_step: 'step3_evaluate_adversary',
    question: 'What is the SAM threat index over the Raptor arc?',
    subject: 'threat.raptor_arc', encoding_class: 'banded_soft_cost',
    answer: { lo: 1, hi: 2, unit: 'threat index' },
    provenance: prov('assessed', 'moderate', 'J-2 air'),
    criticality: 'important', status: 'answered',
  },
  {
    logical_id: 'S3', version: 1, jipoe_step: 'step3_evaluate_adversary',
    question: 'What is the fast-attack-craft threat index in the FAC waters?',
    subject: 'threat.fac_waters', encoding_class: 'banded_soft_cost',
    answer: { lo: 2, hi: 4, unit: 'threat index' },
    provenance: prov('assessed', 'low', 'J-2 maritime'),
    criticality: 'important', status: 'answered',
  },
  {
    logical_id: 'S4', version: 1, jipoe_step: 'step1_define_oe',
    question: 'What residual transit factor do obstacles leave in Cobalt Strait?',
    subject: 'mobility.cobalt_strait', encoding_class: 'banded_soft_cost',
    answer: { lo: 0.6, hi: 0.9, unit: 'transit factor' },
    provenance: prov('assessed', 'moderate', 'J-2 MIW cell'),
    criticality: 'important', status: 'answered',
  },
  {
    logical_id: 'S5', version: 1, jipoe_step: 'step2_describe_effects',
    question: 'Is the Saddle causeway trafficable (transit factor)?',
    subject: 'mobility.causeway', encoding_class: 'banded_soft_cost',
    answer: { lo: 0.8, hi: 1.0, unit: 'transit factor' },
    provenance: prov('assessed', 'moderate', 'J-2 imagery'),
    criticality: 'important', status: 'answered',
  },
  {
    logical_id: 'S6', version: 1, jipoe_step: 'step2_describe_effects',
    question: 'What transit factor do uncharted mines leave on the North Shoal?',
    subject: 'mobility.north_shoal', encoding_class: 'banded_soft_cost',
    answer: { lo: 0.2, hi: 0.5, unit: 'transit factor' },
    provenance: prov('assessed', 'low', 'J-2 MIW cell'),
    criticality: 'routine', status: 'answered',
  },
  // ---- UNREAD channels (storm/tide/civil/sensor): describe the world,
  //      cannot touch any of these commitments (structurally inert) ----
  {
    logical_id: 'S7', version: 1, jipoe_step: 'step2_describe_effects',
    question: 'What storm surge is forecast in the South Channel D+0..D+4?',
    subject: 'weather.south_channel', encoding_class: 'banded_soft_cost',
    answer: { lo: 1.0, hi: 1.6, unit: 'm surge' },
    provenance: prov('reported', 'high', 'METOC'),
    criticality: 'important', validity: { valid_from: 0, valid_until: 24 }, status: 'answered',
  },
  {
    logical_id: 'S8', version: 1, jipoe_step: 'step1_define_oe',
    question: 'What is the civil population of Cobalt Town?',
    subject: 'civil_density.town', encoding_class: 'banded_soft_cost',
    answer: { lo: 18000, hi: 32000, unit: 'persons' },
    provenance: prov('reported', 'moderate', 'J-2 civil affairs'),
    criticality: 'important', status: 'answered',
  },
  {
    logical_id: 'S9', version: 1, jipoe_step: 'step3_evaluate_adversary',
    question: 'What coverage does the coastal battery radar provide?',
    subject: 'sensor.battery', encoding_class: 'banded_soft_cost',
    answer: { lo: 0.4, hi: 0.8, unit: 'coverage index' },
    provenance: prov('assessed', 'moderate', 'J-2 ELINT'),
    criticality: 'routine', status: 'answered',
  },
  {
    logical_id: 'S10', version: 1, jipoe_step: 'step1_define_oe',
    question: 'What is the tidal range across the open water staging box?',
    subject: 'tide.open_water', encoding_class: 'banded_soft_cost',
    answer: { lo: 0.2, hi: 0.5, unit: 'm surge' },
    provenance: prov('observed', 'high', 'CTF hydrographic'),
    criticality: 'routine', status: 'answered',
  },
];

const ALL_IDS = knowledge.map((k) => k.logical_id);

// ───────────────────────────────────────────────────────────────────────────
// 3. THE COMMANDER'S INTENT — commitments (metric names fixed by the shipped
//    registry; force-element ids are the registry's fixed responsibles).
// ───────────────────────────────────────────────────────────────────────────

const commitments: Commitment[] = [
  { logical_id: 'C1', version: 1, statement: 'Relief column reaches the objective by D+6 (step 24).', tier: 'must', metric: 'port_open_step', comparator: 'at_most', threshold: 24, unit: 'step', owner: 'J-3' },
  { logical_id: 'C2', version: 1, statement: 'Cobalt Strait swept open by step 20.', tier: 'must', metric: 'strait_open_step', comparator: 'at_most', threshold: 20, unit: 'step', owner: 'J-3' },
  { logical_id: 'C3', version: 1, statement: 'Assault group not over-exposed to threat.', tier: 'should', metric: 'threat_exposure', comparator: 'at_most', threshold: 60, unit: 'threat index-hours', owner: 'J-3', scope: 'FE-ANVIL' },
  { logical_id: 'C4', version: 1, statement: 'No fires into the Cobalt Town district.', tier: 'should', metric: 'civil_harm_exposure', comparator: 'at_most', threshold: 0, unit: 'legs', owner: 'J-3', scope: 'civil_town' },
  { logical_id: 'C5', version: 1, statement: 'Saddle causeway taken intact.', tier: 'prefer', metric: 'causeway_intact', comparator: 'at_least', threshold: 1, unit: 'intact', owner: 'J-3' },
  { logical_id: 'C6', version: 1, statement: 'Recon detachment extracted by step 40.', tier: 'prefer', metric: 'extraction_step', comparator: 'at_most', threshold: 40, unit: 'step', owner: 'J-3' },
];

// ───────────────────────────────────────────────────────────────────────────
// 4. THREE COAs — hand-drawn over the world AFTER the intel was authored.
//    NORTH runs the mined channel; SOUTH avoids it; CENTER cuts the strait.
// ───────────────────────────────────────────────────────────────────────────

type Leg = { x: number; y: number; enter_step: number; exit_step: number };
const leg = (x: number, y: number, enter_step: number, exit_step: number): Leg => ({ x, y, enter_step, exit_step });

const planNorth: Plan = {
  logical_id: 'P-NORTH', version: 1, name: 'North-channel push', seed: 1, generator: 'hand-drawn',
  elements: [
    { force_element: 'FE-BROOM', route: [leg(10, 35, 0, 4), leg(11, 13, 4, 8), leg(22, 16, 8, 12)] },
    { force_element: 'FE-PACKHORSE', route: [leg(10, 35, 0, 4), leg(11, 13, 4, 9), leg(18, 18, 9, 13), leg(26, 25, 13, 18)] },
    { force_element: 'FE-ANVIL', route: [leg(10, 35, 0, 6), leg(28, 12, 6, 10), leg(26, 20, 10, 12)] },
    { force_element: 'FE-FALCON', route: [leg(10, 35, 0, 4), leg(30, 10, 4, 8)] },
    { force_element: 'FE-KINGFISHER', route: [leg(33, 5, 0, 4), leg(10, 35, 4, 36)] },
  ],
};

const planSouth: Plan = {
  logical_id: 'P-SOUTH', version: 1, name: 'South-channel sweep', seed: 1, generator: 'hand-drawn',
  elements: [
    { force_element: 'FE-BROOM', route: [leg(10, 35, 0, 4), leg(11, 25, 4, 8), leg(22, 16, 8, 12)] },
    { force_element: 'FE-PACKHORSE', route: [leg(10, 35, 0, 4), leg(11, 25, 4, 10), leg(18, 18, 10, 14), leg(26, 25, 14, 19)] },
    { force_element: 'FE-ANVIL', route: [leg(10, 35, 0, 6), leg(14, 26, 6, 10)] },
    { force_element: 'FE-FALCON', route: [leg(10, 35, 0, 4), leg(22, 27, 4, 8)] }, // through the town
    { force_element: 'FE-KINGFISHER', route: [leg(33, 5, 0, 4), leg(10, 35, 4, 36)] },
  ],
};

const planCenter: Plan = {
  logical_id: 'P-CENTER', version: 1, name: 'Centre strait cut', seed: 1, generator: 'hand-drawn',
  elements: [
    { force_element: 'FE-BROOM', route: [leg(10, 35, 0, 5), leg(22, 16, 5, 9)] },
    { force_element: 'FE-PACKHORSE', route: [leg(10, 35, 0, 5), leg(22, 16, 5, 9), leg(18, 18, 9, 12), leg(26, 25, 12, 17)] },
    { force_element: 'FE-ANVIL', route: [leg(10, 35, 0, 6), leg(26, 20, 6, 10)] },
    { force_element: 'FE-FALCON', route: [leg(10, 35, 0, 4), leg(30, 10, 4, 8)] },
    { force_element: 'FE-KINGFISHER', route: [leg(33, 5, 0, 4), leg(10, 35, 4, 36)] },
  ],
};

const PLANS = [planNorth, planSouth, planCenter];

// Hand-derived relevance oracle — which intel each COA reads, reasoned from
// geometry alone (independent of the implementation). Checked below.
const ORACLE_FOOTPRINT: Record<string, string[]> = {
  'P-NORTH': ['S1', 'S2', 'S3', 'S4', 'S5'],
  'P-SOUTH': ['S4', 'S5'],
  'P-CENTER': ['S3', 'S4', 'S5'],
};

// ───────────────────────────────────────────────────────────────────────────
// Engine wiring helpers (all real services).
// ───────────────────────────────────────────────────────────────────────────

async function buildStore(ids: string[]): Promise<KnowledgeService> {
  const ks = new KnowledgeService({ actor: 'J-2', role: 'analyst' });
  for (const id of ids) {
    const ko = knowledge.find((k) => k.logical_id === id)!;
    const r = await ks.create(ko);
    if (isRefusal(r)) throw new Error(`unexpected refusal creating ${id}: ${r.explanation}`);
  }
  // Plans live in the same store (the scorer resolves them by ref).
  for (const p of PLANS) await ks.store.put(p as unknown as Record<string, unknown>);
  return ks;
}

async function compileWorld(ks: KnowledgeService, ids: string[]): Promise<{ ref: Ref; world: CompiledWorld; stamp: string }> {
  const compile = new CompileService({ knowledge: ks });
  const res = await compile.compile({
    knowledge: ids.map((id) => ({ logical_id: id, content_hash: '' })),
    config,
    engine_version: ENGINE_VERSION,
  });
  if (isRefusal(res)) throw new Error(`compile refused: ${res.explanation}`);
  const world = ks.store.get(res.world.content_hash) as CompiledWorld;
  return { ref: res.world, world, stamp: res.stamp };
}

async function scoreAll(ks: KnowledgeService, worldRef: Ref): Promise<Record<string, Record<string, string>>> {
  const scorer = new ScoreService({ store: ks.store, trace: ks.trace, config, commitments });
  const out: Record<string, Record<string, string>> = {};
  for (const p of PLANS) {
    const planRef = ks.store.versions(p.logical_id).at(-1)!;
    const res = await scorer.score({ plan: planRef, world: worldRef, scenario: 'BASE', engine_version: ENGINE_VERSION });
    if (isRefusal(res)) throw new Error(`score refused for ${p.logical_id}: ${res.explanation}`);
    out[p.logical_id] = Object.fromEntries(res.verdicts.map((v: CommitmentVerdict) => [v.commitment, v.verdict]));
  }
  return out;
}

// ── The read-set projection: which knowledge source the scorer actually reads
//    at each metric read-point. Mirrors channelAt's resolution but returns the
//    winning override's `source` (and cross-checks its value against channelAt).

type MetricRead = { kind: 'reach' | 'exposure' | 'fires' | 'state'; element?: string; channel?: ChannelKind; region?: string };
const METRIC_READS: Record<string, MetricRead> = {
  strait_open_step: { kind: 'reach', element: 'FE-BROOM', channel: 'mobility' },
  port_open_step: { kind: 'reach', element: 'FE-PACKHORSE', channel: 'mobility' },
  extraction_step: { kind: 'reach', element: 'FE-KINGFISHER', channel: 'mobility' },
  threat_exposure: { kind: 'exposure', element: 'FE-ANVIL', channel: 'threat' },
  civil_harm_exposure: { kind: 'fires', element: 'FE-FALCON' },
  causeway_intact: { kind: 'state', channel: 'mobility', region: 'causeway' },
};

function winnerAt(world: CompiledWorld, kind: ChannelKind, x: number, y: number, t: number): string | undefined {
  const channel = world.channels.find((c) => c.kind === kind)!;
  const contains = (o: RegionOverride) => {
    const g = config.regions.find((r) => r.name === o.region)!;
    return x >= g.x0 && x <= g.x1 && y >= g.y0 && y <= g.y1;
  };
  const activeAt = (o: RegionOverride) => (o.from_step === undefined || t >= o.from_step) && (o.until_step === undefined || t <= o.until_step);
  const active = (channel.regions ?? []).filter((o) => activeAt(o) && contains(o));
  if (active.length === 0) return undefined; // default → no knowledge read here
  const area = (name: string) => { const g = config.regions.find((r) => r.name === name)!; return (g.x1 - g.x0 + 1) * (g.y1 - g.y0 + 1); };
  active.sort((a, b) => (b.from_step ?? 0) - (a.from_step ?? 0) || area(a.region) - area(b.region));
  const winner = active[0]!;
  // sanity: the winner's value must equal channelAt's answer.
  const viaEngine = channelAt(world, config, kind, x, y, t);
  if (viaEngine.lo !== winner.value.lo || viaEngine.hi !== winner.value.hi) {
    throw new Error(`read-set/channelAt disagree at ${kind}(${x},${y},${t})`);
  }
  return winner.source;
}

/** Which knowledge sources a commitment reads for a given plan (determining set). */
function readsFor(plan: Plan, commitment: Commitment, world: CompiledWorld): Set<string> {
  const m = METRIC_READS[commitment.metric]!;
  const sources = new Set<string>();
  if (m.kind === 'fires') return sources; // reads no assessed channel — pure route geometry
  if (m.kind === 'state') {
    const g = config.regions.find((r) => r.name === m.region)!;
    const cx = Math.floor((g.x0 + g.x1) / 2), cy = Math.floor((g.y0 + g.y1) / 2);
    const s = winnerAt(world, m.channel!, cx, cy, config.grid.horizon_steps);
    if (s) sources.add(s);
    return sources;
  }
  const ep = plan.elements.find((e) => e.force_element === m.element);
  for (const l of ep?.route ?? []) {
    const s = winnerAt(world, m.channel!, l.x, l.y, l.enter_step);
    if (s) sources.add(s);
  }
  return sources;
}

function footprint(plan: Plan, world: CompiledWorld): Set<string> {
  const all = new Set<string>();
  for (const c of commitments) for (const s of readsFor(plan, c, world)) all.add(s);
  return all;
}

// ───────────────────────────────────────────────────────────────────────────
// Report
// ───────────────────────────────────────────────────────────────────────────

const pad = (s: string, n: number) => (s + ' '.repeat(n)).slice(0, n);
const line = (n = 78) => console.log('─'.repeat(n));

async function main() {
  console.log('\nOPERATION SANDPIPER — reproducible intelligence→COA relevance\n');
  console.log(`engine ${ENGINE_VERSION}; grid ${config.grid.cols}×${config.grid.rows}, horizon ${config.grid.horizon_steps} steps`);

  const ks = await buildStore(ALL_IDS);
  const base = await compileWorld(ks, ALL_IDS);

  // Which intel compiled, and into which (read vs unread) channel.
  const READ_CHANNELS: ChannelKind[] = ['mobility', 'threat'];
  line();
  console.log('COMPILED WORLD — every K describes a place; only mobility & threat are read by the metrics\n');
  for (const ch of base.world.channels) {
    if (!(ch.regions && ch.regions.length)) continue;
    const readable = READ_CHANNELS.includes(ch.kind);
    for (const o of ch.regions) {
      console.log(`  ${pad(o.source ?? '?', 4)} ${pad(ch.kind, 14)} ${pad(o.region, 15)} ${pad(`[${o.value.lo}, ${o.value.hi}] ${o.value.unit}`, 26)} ${readable ? 'READ channel' : 'UNREAD → cannot touch a COA'}`);
    }
  }

  // Baseline verdicts.
  const baseVerdicts = await scoreAll(ks, base.ref);
  line();
  console.log('BASELINE VERDICTS  (COA × commitment)\n');
  console.log('  ' + pad('', 10) + commitments.map((c) => pad(c.logical_id, 9)).join(''));
  for (const p of PLANS) {
    console.log('  ' + pad(p.logical_id, 10) + commitments.map((c) => pad(baseVerdicts[p.logical_id]![c.logical_id]!, 9)).join(''));
  }

  // Structural relevance: the read-set footprint per COA.
  line();
  console.log('STRUCTURAL RELEVANCE — which intel each COA actually READS (computed from geometry+time)\n');
  const computedFootprint: Record<string, Set<string>> = {};
  for (const p of PLANS) {
    const fp = footprint(p, base.world);
    computedFootprint[p.logical_id] = fp;
    const reads = [...fp].sort();
    const inert = ALL_IDS.filter((id) => !fp.has(id));
    console.log(`  ${pad(p.logical_id, 10)} reads {${reads.join(', ')}}`);
    console.log(`  ${pad('', 10)} inert {${inert.join(', ')}}   ← describe the world, do not touch this COA`);
  }

  // Behavioural relevance: remove each K, recompile, re-score, diff verdicts.
  line();
  console.log('BEHAVIOURAL RELEVANCE — remove each K, recompile+rescore, report verdicts that MOVE\n');
  const moved: Record<string, string[]> = {};
  for (const id of ALL_IDS) {
    const subset = ALL_IDS.filter((x) => x !== id);
    const ks2 = await buildStore(subset);
    const w2 = await compileWorld(ks2, subset);
    const v2 = await scoreAll(ks2, w2.ref);
    const diffs: string[] = [];
    for (const p of PLANS) for (const c of commitments) {
      const a = baseVerdicts[p.logical_id]![c.logical_id]!, b = v2[p.logical_id]![c.logical_id]!;
      if (a !== b) diffs.push(`${p.logical_id}/${c.logical_id}: ${a}→${b}`);
    }
    moved[id] = diffs;
    console.log(`  remove ${pad(id, 4)} → ${diffs.length ? diffs.join('  ') : 'no verdict moves (inert)'}`);
  }

  // ── Reproducibility & agreement proofs ──
  line();
  console.log('PREDICTABLE == REPRODUCIBLE — proofs\n');
  const checks: [string, boolean][] = [];

  // P1: same inputs → identical world stamp and identical verdicts, twice.
  const ksA = await buildStore(ALL_IDS); const a = await compileWorld(ksA, ALL_IDS); const va = await scoreAll(ksA, a.ref);
  const ksB = await buildStore(ALL_IDS); const b = await compileWorld(ksB, ALL_IDS); const vb = await scoreAll(ksB, b.ref);
  checks.push(['same inputs → identical world stamp', a.stamp === b.stamp && a.stamp === base.stamp]);
  checks.push(['same inputs → identical verdicts', JSON.stringify(va) === JSON.stringify(vb)]);

  // P2: shuffled knowledge input order → identical world stamp (order-independence).
  const shuffled = [...ALL_IDS].reverse();
  const ksC = await buildStore(shuffled); const c = await compileWorld(ksC, shuffled);
  checks.push(['shuffled input order → identical world stamp', c.stamp === base.stamp]);

  // P3: the two relevance notions AGREE — anything the read-set marks inert for a
  //     COA provably leaves that COA's verdicts byte-identical on removal.
  let agree = true; const violations: string[] = [];
  for (const id of ALL_IDS) {
    for (const p of PLANS) {
      const isRead = computedFootprint[p.logical_id]!.has(id);
      const movesThisPlan = moved[id]!.some((d) => d.startsWith(p.logical_id + '/'));
      if (!isRead && movesThisPlan) { agree = false; violations.push(`${id}/${p.logical_id}`); }
    }
  }
  checks.push(['read-set INERT ⇒ removal leaves that COA unchanged', agree]);
  if (violations.length) console.log('    violations:', violations.join(', '));

  // P4: the computed footprint matches the hand-derived oracle.
  let oracleOk = true;
  for (const p of PLANS) {
    const got = [...computedFootprint[p.logical_id]!].sort().join(',');
    const want = [...ORACLE_FOOTPRINT[p.logical_id]!].sort().join(',');
    if (got !== want) { oracleOk = false; console.log(`    oracle mismatch ${p.logical_id}: got {${got}} want {${want}}`); }
  }
  checks.push(['computed footprint == hand-derived relevance oracle', oracleOk]);

  console.log();
  for (const [name, ok] of checks) console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${name}`);
  line();
  const allOk = checks.every(([, ok]) => ok);
  console.log(allOk ? '\nAll proofs pass — the relevance decision is reproducible and geometry-predictable.\n' : '\nSOME PROOFS FAILED — see above.\n');
  process.exitCode = allOk ? 0 : 1;
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
