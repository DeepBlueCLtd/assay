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
    { name: 'causeway', x0: 11, y0: 15, x1: 17, y1: 21 },
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
    { force_element: 'FE-PACKHORSE', route: [leg(10, 35, 0, 4), leg(11, 13, 4, 9), leg(14, 18, 9, 13), leg(26, 25, 13, 18)] },
    { force_element: 'FE-ANVIL', route: [leg(10, 35, 0, 6), leg(28, 12, 6, 10), leg(26, 20, 10, 12)] },
    { force_element: 'FE-FALCON', route: [leg(10, 35, 0, 4), leg(30, 10, 4, 8)] },
    { force_element: 'FE-KINGFISHER', route: [leg(33, 5, 0, 4), leg(10, 35, 4, 36)] },
  ],
};

const planSouth: Plan = {
  logical_id: 'P-SOUTH', version: 1, name: 'South-channel sweep', seed: 1, generator: 'hand-drawn',
  elements: [
    { force_element: 'FE-BROOM', route: [leg(10, 35, 0, 4), leg(11, 25, 4, 8), leg(22, 16, 8, 12)] },
    { force_element: 'FE-PACKHORSE', route: [leg(10, 35, 0, 4), leg(11, 25, 4, 10), leg(14, 18, 10, 14), leg(26, 25, 14, 19)] },
    { force_element: 'FE-ANVIL', route: [leg(10, 35, 0, 6), leg(26, 20, 6, 8), leg(12, 25, 8, 10)] }, // fac waters, then south channel
    { force_element: 'FE-FALCON', route: [leg(10, 35, 0, 4), leg(22, 27, 4, 8)] }, // through the town
    { force_element: 'FE-KINGFISHER', route: [leg(33, 5, 0, 4), leg(10, 35, 4, 36)] },
  ],
};

const planCenter: Plan = {
  logical_id: 'P-CENTER', version: 1, name: 'Centre strait cut', seed: 1, generator: 'hand-drawn',
  elements: [
    { force_element: 'FE-BROOM', route: [leg(10, 35, 0, 5), leg(22, 16, 5, 9)] },
    { force_element: 'FE-PACKHORSE', route: [leg(10, 35, 0, 5), leg(22, 16, 5, 9), leg(14, 18, 9, 12), leg(26, 25, 12, 17)] },
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
  'P-SOUTH': ['S3', 'S4', 'S5'],
  'P-CENTER': ['S3', 'S4', 'S5'],
};

// ───────────────────────────────────────────────────────────────────────────
// 4b. ADVERSARY COURSES OF ACTION — hypotheticals that re-shape the world.
//     Each is a ScenarioCOA whose `excursion` overlays the base world (and, by
//     SPEC-20 layered precedence, BEATS our base assessment where it speaks).
//     Authored to describe what the ENEMY might do — still blind to our COAs.
// ───────────────────────────────────────────────────────────────────────────

interface Scenario { logical_id: string; version: number; name: string; narrative: string; excursion: { channel: ChannelKind; region: string; override: Band }[] }

const SCENARIOS: Scenario[] = [
  {
    logical_id: 'R-SEA', version: 1, name: 'Littoral fight',
    narrative: 'The enemy surges fast-attack craft into the southern approaches.',
    excursion: [{ channel: 'threat', region: 'south_channel', override: { lo: 4, hi: 6, unit: 'threat index' } }],
  },
  {
    logical_id: 'R-STRAITMINE', version: 1, name: 'Strait denial',
    narrative: 'The enemy heavily mines Cobalt Strait to deny the direct cut.',
    excursion: [{ channel: 'mobility', region: 'cobalt_strait', override: { lo: 0.1, hi: 0.3, unit: 'transit factor' } }],
  },
];
const SCENARIO_KEYS = ['BASE', ...SCENARIOS.map((s) => s.logical_id)];

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
  // Plans and adversary scenarios live in the same store (compile resolves the
  // scenario by logical id; the scorer resolves plans by ref).
  for (const p of PLANS) await ks.store.put(p as unknown as Record<string, unknown>);
  for (const s of SCENARIOS) await ks.store.put(s as unknown as Record<string, unknown>);
  return ks;
}

/** scenarioKey === 'BASE' compiles the un-excursioned world. */
async function compileWorld(ks: KnowledgeService, ids: string[], scenarioKey: string): Promise<{ ref: Ref; world: CompiledWorld; stamp: string }> {
  const compile = new CompileService({ knowledge: ks });
  const req: Parameters<CompileService['compile']>[0] = {
    knowledge: ids.map((id) => ({ logical_id: id, content_hash: '' })),
    config,
    engine_version: ENGINE_VERSION,
  };
  if (scenarioKey !== 'BASE') req.scenario = scenarioKey;
  const res = await compile.compile(req);
  if (isRefusal(res)) throw new Error(`compile refused (${scenarioKey}): ${res.explanation}`);
  const world = ks.store.get(res.world.content_hash) as CompiledWorld;
  return { ref: res.world, world, stamp: res.stamp };
}

async function scoreAll(ks: KnowledgeService, worldRef: Ref, scenarioKey: string): Promise<Record<string, Record<string, string>>> {
  const scorer = new ScoreService({ store: ks.store, trace: ks.trace, config, commitments });
  const out: Record<string, Record<string, string>> = {};
  for (const p of PLANS) {
    const planRef = ks.store.versions(p.logical_id).at(-1)!;
    const res = await scorer.score({ plan: planRef, world: worldRef, scenario: scenarioKey, engine_version: ENGINE_VERSION });
    if (isRefusal(res)) throw new Error(`score refused for ${p.logical_id} (${scenarioKey}): ${res.explanation}`);
    out[p.logical_id] = Object.fromEntries(res.verdicts.map((v: CommitmentVerdict) => [v.commitment, v.verdict]));
  }
  return out;
}

/** One full run: build store from `ids`, compile under `scenarioKey`, score all. */
async function run(ids: string[], scenarioKey: string): Promise<{ world: CompiledWorld; verdicts: Record<string, Record<string, string>>; stamp: string }> {
  const ks = await buildStore(ids);
  const w = await compileWorld(ks, ids, scenarioKey);
  const verdicts = await scoreAll(ks, w.ref, scenarioKey);
  return { world: w.world, verdicts, stamp: w.stamp };
}

// ── The read-set projection: which source the scorer actually reads at each
//    metric read-point. Mirrors channelAt EXACTLY (incl. SPEC-20 excursion
//    precedence) and cross-checks the winning value against channelAt.

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
  // SPEC-20: an excursion-layer override (source names the world's scenario) wins.
  const excursion = active.filter((o) => world.scenario !== undefined && o.source === world.scenario);
  const candidates = excursion.length > 0 ? excursion : active;
  const area = (name: string) => { const g = config.regions.find((r) => r.name === name)!; return (g.x1 - g.x0 + 1) * (g.y1 - g.y0 + 1); };
  candidates.sort((a, b) => (b.from_step ?? 0) - (a.from_step ?? 0) || area(a.region) - area(b.region));
  const winner = candidates[0]!;
  const viaEngine = channelAt(world, config, kind, x, y, t);
  if (viaEngine.lo !== winner.value.lo || viaEngine.hi !== winner.value.hi) {
    throw new Error(`read-set/channelAt disagree at ${kind}(${x},${y},${t})`);
  }
  return winner.source;
}

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

const isOurIntel = (source: string) => source.startsWith('S');
const READ_CHANNELS: ChannelKind[] = ['mobility', 'threat'];
const ORDER: Record<string, number> = { violated: 0, tight: 1, marginal: 2, robust: 3 };
export type Relevance = 'decisive' | 'read' | 'masked' | 'inert';

// ───────────────────────────────────────────────────────────────────────────
// The model — every number here is produced by the real engine. computeModel
// runs the whole pipeline (per scenario, and once per single-K removal) and
// returns both the raw structures (for the console proofs) and a
// JSON-serialisable `viz` model (for the visual, scratch/build-viz.ts).
// ───────────────────────────────────────────────────────────────────────────

export interface VizModel {
  engine: string;
  grid: { cols: number; rows: number };
  scenarioKeys: string[];
  scenarios: { key: string; name: string; narrative: string; excursion: { channel: string; region: string; band: [number, number]; unit: string }[] }[];
  regions: { name: string; x0: number; y0: number; x1: number; y1: number; channel: string | null; source: string | null; read: boolean }[];
  intel: { id: string; question: string; channel: string; region: string; band: [number, number]; unit: string; read: boolean; source_class: string; confidence: string }[];
  plans: { id: string; name: string; routes: { element: string; legs: { x: number; y: number; enter: number; exit: number }[] }[] }[];
  commitments: { id: string; statement: string; tier: string; metric: string }[];
  verdicts: Record<string, Record<string, Record<string, string>>>;   // sk → plan → C → verdict
  worst: Record<string, Record<string, string>>;                       // plan → C → worst-case verdict
  relevance: Record<string, Record<string, Record<string, Relevance>>>; // sk → plan → S → label
  shifts: { intel: string; plan: string; decisiveUnder: string[]; inertUnder: string[] }[];
  masks: { intel: string; plan: string; scenario: string }[];
}

export async function computeModel(): Promise<{
  baseline: Record<string, Awaited<ReturnType<typeof run>>>;
  fp: Record<string, Record<string, Set<string>>>;
  decisive: Record<string, Record<string, Set<string>>>;
  viz: VizModel;
}> {
  const baseline: Record<string, Awaited<ReturnType<typeof run>>> = {};
  for (const sk of SCENARIO_KEYS) baseline[sk] = await run(ALL_IDS, sk);

  // Structural footprint (our intel only) and behavioural decisiveness, per scenario.
  const fp: Record<string, Record<string, Set<string>>> = {};
  const decisive: Record<string, Record<string, Set<string>>> = {};
  for (const sk of SCENARIO_KEYS) {
    fp[sk] = {};
    for (const p of PLANS) fp[sk][p.logical_id] = new Set([...footprint(p, baseline[sk]!.world)].filter(isOurIntel));
    decisive[sk] = {};
    for (const id of ALL_IDS) {
      const sub = await run(ALL_IDS.filter((x) => x !== id), sk);
      const moves = new Set<string>();
      for (const p of PLANS) for (const c of commitments) {
        if (baseline[sk]!.verdicts[p.logical_id]![c.logical_id] !== sub.verdicts[p.logical_id]![c.logical_id]) moves.add(p.logical_id);
      }
      decisive[sk][id] = moves;
    }
  }

  // Per-region channel/source (from the BASE compiled world).
  const regionInfo: Record<string, { channel: string; source?: string }> = {};
  for (const ch of baseline['BASE']!.world.channels) for (const o of ch.regions ?? []) {
    regionInfo[o.region] = { channel: ch.kind, ...(o.source ? { source: o.source } : {}) };
  }
  const subjectRoute = (subject: string) => config.subject_map.find((e) => e.subject === subject)!;

  // Relevance label per (scenario, plan, intel).
  const relevance: VizModel['relevance'] = {};
  for (const sk of SCENARIO_KEYS) {
    relevance[sk] = {};
    for (const p of PLANS) {
      relevance[sk][p.logical_id] = {};
      for (const id of ALL_IDS) {
        let label: Relevance;
        if (decisive[sk][id]!.has(p.logical_id)) label = 'decisive';
        else if (fp[sk][p.logical_id]!.has(id)) label = 'read';
        else if (sk !== 'BASE' && fp['BASE']![p.logical_id]!.has(id)) label = 'masked';
        else label = 'inert';
        relevance[sk][p.logical_id]![id] = label;
      }
    }
  }

  const shifts: VizModel['shifts'] = [];
  for (const id of ALL_IDS) for (const p of PLANS) {
    const where = SCENARIO_KEYS.filter((sk) => decisive[sk][id]!.has(p.logical_id));
    if (where.length > 0 && where.length < SCENARIO_KEYS.length) {
      shifts.push({ intel: id, plan: p.logical_id, decisiveUnder: where, inertUnder: SCENARIO_KEYS.filter((sk) => !where.includes(sk)) });
    }
  }
  const masks: VizModel['masks'] = [];
  for (const sk of SCENARIO_KEYS) for (const p of PLANS) for (const id of ALL_IDS) {
    if (relevance[sk][p.logical_id]![id] === 'masked') masks.push({ intel: id, plan: p.logical_id, scenario: sk });
  }

  const worst: VizModel['worst'] = {};
  for (const p of PLANS) {
    worst[p.logical_id] = {};
    for (const c of commitments) {
      worst[p.logical_id]![c.logical_id] = SCENARIO_KEYS
        .map((sk) => baseline[sk]!.verdicts[p.logical_id]![c.logical_id]!)
        .reduce((a, b) => (ORDER[a]! <= ORDER[b]! ? a : b));
    }
  }

  const viz: VizModel = {
    engine: ENGINE_VERSION,
    grid: { cols: config.grid.cols, rows: config.grid.rows },
    scenarioKeys: SCENARIO_KEYS,
    scenarios: [
      { key: 'BASE', name: 'Baseline', narrative: 'Our current assessment of the world — no adversary hypothesis applied.', excursion: [] },
      ...SCENARIOS.map((s) => ({ key: s.logical_id, name: s.name, narrative: s.narrative, excursion: s.excursion.map((e) => ({ channel: e.channel, region: e.region, band: [e.override.lo, e.override.hi] as [number, number], unit: e.override.unit })) })),
    ],
    regions: config.regions.map((g) => {
      const info = regionInfo[g.name];
      return { name: g.name, x0: g.x0, y0: g.y0, x1: g.x1, y1: g.y1, channel: info?.channel ?? null, source: info?.source ?? null, read: info ? READ_CHANNELS.includes(info.channel as ChannelKind) : false };
    }),
    intel: knowledge.map((k) => {
      const r = subjectRoute(k.subject);
      return { id: k.logical_id, question: k.question, channel: r.channel, region: r.region, band: [k.answer!.lo, k.answer!.hi] as [number, number], unit: k.answer!.unit, read: READ_CHANNELS.includes(r.channel), source_class: k.provenance!.source_class, confidence: k.provenance!.confidence };
    }),
    plans: PLANS.map((p) => ({ id: p.logical_id, name: p.name, routes: p.elements.map((e) => ({ element: e.force_element, legs: (e.route ?? []).map((l) => ({ x: l.x, y: l.y, enter: l.enter_step, exit: l.exit_step })) })) })),
    commitments: commitments.map((c) => ({ id: c.logical_id, statement: c.statement, tier: c.tier, metric: c.metric })),
    verdicts: Object.fromEntries(SCENARIO_KEYS.map((sk) => [sk, baseline[sk]!.verdicts])),
    worst,
    relevance,
    shifts,
    masks,
  };

  return { baseline, fp, decisive, viz };
}

// ───────────────────────────────────────────────────────────────────────────
// Console report (the proofs). Runs only when executed directly.
// ───────────────────────────────────────────────────────────────────────────

const pad = (s: string, n: number) => (s + ' '.repeat(n)).slice(0, n);
const line = (n = 82) => console.log('─'.repeat(n));

async function main() {
  console.log('\nOPERATION SANDPIPER — reproducible, scenario-dependent intelligence→COA relevance\n');
  console.log(`engine ${ENGINE_VERSION}; grid ${config.grid.cols}×${config.grid.rows}, horizon ${config.grid.horizon_steps} steps`);
  console.log(`scenarios: ${SCENARIO_KEYS.join(', ')}`);

  const { baseline, fp, decisive, viz } = await computeModel();

  line();
  console.log('COMPILED WORLD (BASE) — every K describes a place; only mobility & threat are read\n');
  for (const ch of baseline['BASE']!.world.channels) {
    if (!(ch.regions && ch.regions.length)) continue;
    for (const o of ch.regions) {
      console.log(`  ${pad(o.source ?? '?', 5)} ${pad(ch.kind, 14)} ${pad(o.region, 15)} ${pad(`[${o.value.lo}, ${o.value.hi}] ${o.value.unit}`, 26)} ${READ_CHANNELS.includes(ch.kind) ? 'READ' : 'UNREAD → cannot touch a COA'}`);
    }
  }

  line();
  console.log('VERDICTS PER SCENARIO + worst-case (COA × commitment)\n');
  console.log('  ' + pad('', 20) + commitments.map((c) => pad(c.logical_id, 9)).join(''));
  for (const p of PLANS) {
    for (const sk of SCENARIO_KEYS) {
      console.log('  ' + pad(`${p.logical_id} @ ${sk}`, 20) + commitments.map((c) => pad(viz.verdicts[sk]![p.logical_id]![c.logical_id]!, 9)).join(''));
    }
    console.log('  ' + pad(`${p.logical_id} worst-case`, 20) + commitments.map((c) => pad(viz.worst[p.logical_id]![c.logical_id]!, 9)).join(''));
    console.log();
  }

  line();
  console.log('RELEVANCE SHIFTS WITH THE ENEMY COA — same intel, different decisiveness\n');
  for (const s of viz.shifts) {
    console.log(`  ${pad(s.intel, 4)} is DECISIVE for ${pad(s.plan, 9)} under {${s.decisiveUnder.join(', ')}} but INERT under {${s.inertUnder.join(', ')}}`);
  }
  for (const m of viz.masks) {
    console.log(`  ${pad(m.intel, 4)} is READ for ${pad(m.plan, 9)} under {BASE} but MASKED by the enemy's own action under {${m.scenario}}`);
  }

  // ── Proofs ──
  line();
  console.log('PREDICTABLE == REPRODUCIBLE — proofs\n');
  const checks: [string, boolean][] = [];

  // P1: same inputs → identical stamp + verdicts, per scenario, on re-run.
  let reruns = true;
  for (const sk of SCENARIO_KEYS) {
    const again = await run(ALL_IDS, sk);
    if (again.stamp !== baseline[sk]!.stamp || JSON.stringify(again.verdicts) !== JSON.stringify(baseline[sk]!.verdicts)) reruns = false;
  }
  checks.push(['same inputs → identical stamp + verdicts, every scenario', reruns]);

  // P2: shuffled knowledge input order → identical stamp, per scenario.
  let shuffleOk = true;
  for (const sk of SCENARIO_KEYS) {
    const rev = await run([...ALL_IDS].reverse(), sk);
    if (rev.stamp !== baseline[sk]!.stamp) shuffleOk = false;
  }
  checks.push(['shuffled input order → identical stamp, every scenario', shuffleOk]);

  // P3: read-set INERT ⇒ removal-invariant, per scenario (the two methods agree).
  let agree = true; const viol: string[] = [];
  for (const sk of SCENARIO_KEYS) for (const id of ALL_IDS) for (const p of PLANS) {
    const isRead = fp[sk][p.logical_id]!.has(id);
    if (!isRead && decisive[sk][id]!.has(p.logical_id)) { agree = false; viol.push(`${id}/${p.logical_id}@${sk}`); }
  }
  if (viol.length) console.log('    violations:', viol.join(', '));
  checks.push(['read-set INERT ⇒ removal-invariant, every scenario', agree]);

  // P4: BASE footprint == hand-derived oracle.
  let oracleOk = true;
  for (const p of PLANS) {
    const got = [...fp['BASE']![p.logical_id]!].sort().join(',');
    const want = [...ORACLE_FOOTPRINT[p.logical_id]!].sort().join(',');
    if (got !== want) { oracleOk = false; console.log(`    oracle mismatch ${p.logical_id}: got {${got}} want {${want}}`); }
  }
  checks.push(['BASE footprint == hand-derived relevance oracle', oracleOk]);

  // P5: relevance genuinely SHIFTED — at least one (K, plan) decisive under some
  //     scenario and inert under another (the whole point of the tune).
  let shifted = false;
  for (const id of ALL_IDS) for (const p of PLANS) {
    const d = SCENARIO_KEYS.filter((sk) => decisive[sk][id]!.has(p.logical_id)).length;
    if (d > 0 && d < SCENARIO_KEYS.length) shifted = true;
  }
  checks.push(['at least one piece of intel changes decisiveness across scenarios', shifted]);

  console.log();
  for (const [name, ok] of checks) console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${name}`);
  line();
  const allOk = checks.every(([, ok]) => ok);
  console.log(allOk ? '\nAll proofs pass — relevance is a reproducible function of (world, COA, enemy COA).\n' : '\nSOME PROOFS FAILED — see above.\n');
  process.exitCode = allOk ? 0 : 1;
}

// Run the proofs only when invoked directly (build-viz.ts imports computeModel).
import { fileURLToPath } from 'node:url';
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((e) => { console.error(e); process.exitCode = 1; });
}
