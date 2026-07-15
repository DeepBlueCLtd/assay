/**
 * SPEC-14 (flow-view sub-slice) — the system-flow infographic, assembled.
 *
 * S4 Bridge grown into a stakeholder explainer of the object → connector → gate
 * flow (`docs/assay-flow-infographic-spec.md`; research note `07-flow-view.md`).
 * One artefact, three zoom layers (L0/L1/L2 — Shneiderman's mantra), two modes
 * (guided tour · bounded sandbox), embedded twice from one component (in-app S4
 * "systems-map" mode + a public Pages explainer).
 *
 * HONESTY — the load-bearing bit (mirrors `scripts/build-embeds.ts`). This module
 * does not re-implement the seam in browser JS; that would be theatre over a fake
 * scorer (DEC-4). It drives the REAL in-browser seam — `KnowledgeService`,
 * `CompileService`, `ScoreService`, `HandfulService`, `RelaxService`, `DeltaLog`,
 * `TraceStore` — over the frozen Meridian tableau, and pre-renders every state the
 * BOUNDED sandbox palette can reach (spec §4.3) plus the tour's six beats. The
 * browser's controls swap between outputs the shipped services and components
 * actually produced; the interaction is real, the pixels are the components' own,
 * and there is no runtime crypto, no bundler, and no second copy of any rule to
 * drift (self-contained embed constraint, spec §4.6 — offline-clean, zero network).
 *
 * What is NOT yet computed is LABELLED, never faked (spec §10, research note §5):
 * the staleness fan-out (`/analyse/staleness`, thesis F, Stage 6) and selection
 * (`/select`, not built) are scripted from the walkthrough's oracle-consistent
 * result and carry an explicit "scripted — not yet computed" marker. A scripted
 * result never masquerades as a computed one.
 *
 * Banded honesty (G2) is inherited, not re-litigated: every assessed value renders
 * through the shipped `bandPill` / `provenanceChip` / verdict chips — no bare
 * scalar anywhere. Identifiers are the vignette-frozen families only (§8); stamps
 * are the real content hashes the services compute (the vignette freezes no stamp).
 */
import type {
  Band,
  Commitment,
  CommitmentVerdict,
  CompiledWorld,
  KnowledgeObject,
  Plan,
  ScenarioCOA,
  VignetteConfig,
} from './generated/types.js';
import { KnowledgeService } from './knowledge.js';
import { CompileService } from './compile.js';
import { ScoreService } from './score.js';
import { HandfulService } from './handful.js';
import { RelaxService } from './relax.js';
import { isRefusal } from './seam.js';
import type { Ref } from './store.js';
import { bandPill } from './components/bandPill.js';
import { provenanceChip } from './components/provenanceChip.js';
import { refusalBanner } from './components/refusalBanner.js';
import { channelTrace } from './components/channelTrace.js';
import { s2Matrix, type S2Cell } from './components/s2Matrix.js';
import { s3Cards, type S3Card } from './components/s3Cards.js';
import { handfulStrip, type HandfulStripRow } from './components/handfulStrip.js';
import { ENGINE_VERSION } from './engine.js';

// ————— inputs —————

export interface FlowFixtures {
  knowledge: KnowledgeObject[];
  coas: ScenarioCOA[];
  commitments: Commitment[];
  config: VignetteConfig;
}

/** The excursion axis: `BASE` = no excursion (the tour's opening world). */
export type Coa = 'BASE' | 'R1' | 'R2' | 'R3' | 'R3m';
/** K12's lifecycle phase: never contested · contested (blocks compile) · resolved. */
export type Contest = 'none' | 'contested' | 'resolved';
export type Waiver = 'granted' | 'withheld';

export interface StateKey {
  coa: Coa;
  contest: Contest;
  superseded: boolean; // K9 has superseded K5 (the frozen tableau) vs the pre-storm world
  waiver: Waiver;
}

// ————— outputs (all JSON-safe: the browser receives this verbatim) —————

export interface DeltaRow {
  seq: number;
  actor: string;
  role: string;
  op: string;
  text: string;
}

export interface StateData {
  id: string; // canonical key string, the browser's lookup key
  key: StateKey;
  outcome: 'compiled' | 'refused';
  /** J-2 lane: the three narrative knowledge nodes (band pills + provenance + gates). */
  writeNodes: string;
  /** S4 Bridge lane: the real delta feed for the writes that produced this state. */
  deltas: DeltaRow[];
  refusalHtml?: string; // compiled === 'refused'
  gate?: string; // which gate fired (chip label), if any
  // compiled === 'compiled':
  stampShort?: string; // world stamp (real content hash, short)
  handfulStampShort?: string;
  matrixHtml?: string; // S2 four-stop verdict matrix
  stripHtml?: string; // handful organisation strip
  channelHtml?: string; // L2 detail — every channel value → named knowledge → owner (G3)
  relaxHtml?: string; // commander lane — least-worst cards (R3m only)
  tieBreak?: string;
  waiverActive: boolean; // a `waives` edge exists → the waiver chip travels
  /** scripted, LABELLED fan-out (thesis F / Stage 6 not built) — never faked. */
  staleScripted?: { flagged: string[]; note: string };
  /** live channel overlays for the Meridian map (threat/mobility region overrides). */
  overlay: MapOverlay[];
}

export interface TourBeat {
  step: number;
  title: string;
  beat: string; // walkthrough reference
  narrative: string;
  stateId: string; // which sandbox-shaped state this beat renders
  gatePulse?: string; // the gate this beat pauses on
  scripted?: string; // set iff the beat shows a not-yet-computed result (labelled)
  stage: PipelineStage; // which pipeline stage this beat lives at (the flow rail)
}

/** The five pipeline stages the flow rail renders (spec §3.1). */
export type PipelineStage = 'knowledge' | 'compile' | 'score' | 'relax' | 'decide';

/** A named region of the Meridian grid — real config geometry (materialise.ts). */
export interface MapRegion {
  name: string;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** A live channel overlay on the map — a real region override in the current world. */
export interface MapOverlay {
  region: string;
  kind: string; // 'threat' | 'mobility' (the map-legible channels)
  lo: number;
  hi: number;
  unit: string;
  fromScenario: boolean; // true iff the excursion (not knowledge) laid it down
}

export interface FlowModel {
  seed: number;
  engine: string;
  legend: { connectors: [string, string][]; gates: [string, string][] };
  baseStampShort: string; // the frozen-tableau world stamp
  comparability: { reason: string; note: string }; // AS-7 — the G1 guard, from the seam
  grid: { cols: number; rows: number }; // the Meridian grid extent
  map: MapRegion[]; // the named regions, real config geometry
  defaultStateId: string; // sandbox default + undo target (re-seed to the frozen tableau)
  states: Record<string, StateData>;
  tour: TourBeat[];
  sandboxOptions: {
    coa: Coa[];
    contest: Contest[];
    superseded: boolean[];
    waiver: Waiver[];
  };
}

// ————— frozen vocabulary (spec §3.2/§3.3) —————

const CONNECTORS: [string, string][] = [
  ['supersedes', 'a newer answer overtakes an older one (K9→K5)'],
  ['contests', 'two answers irreconcilable (K12a↔K12b)'],
  ['resolves', 'an adjudication closes a contest'],
  ['compiled_into', 'knowledge → world channel'],
  ['scored_from', 'channel → verdict / score'],
  ['cited_in', 'verdict → relaxation report / rationale'],
  ['waives', 'a J-3 waiver licenses a constraint use (W-1)'],
];

const GATES: [string, string][] = [
  ['encoding lint', 'bad answer refused at write — K10'],
  ['waiver gate', 'hard constraint needs a licence — K8/W-1'],
  ['contest · G5', 'contested never compiles — K12'],
  ['comparability · G1', 'cross-stamp greys, never lies'],
  ['staleness · F', 'flags, no silent recompute'],
  ['least-worst · G4', 'infeasible → report, never empty'],
];

// The narrative subset the J-2 lane renders as typed objects with their gates.
const WEATHER_LIVE = 'K9';
const WEATHER_PRIOR = 'K5';
const BASE_STATIC = ['K1', 'K2', 'K3', 'K4', 'K6', 'K7'];
const ENGINE = ENGINE_VERSION;

// ————— helpers —————

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const shortStamp = (s: string): string => `${s.slice(0, 8)}…${s.slice(-3)}`;
const refFor = (id: string): Ref => ({ logical_id: id, content_hash: '' });
const clone = <T>(o: T): T => structuredClone(o);

/**
 * A clean, integer track for the band pill so its scale endpoints never render as
 * float-precision noise (a decimal band like 0.4–0.9 must not print `0.15000…02`).
 * Non-negative quantities (surge, threat, mines, days) floor the track at 0.
 */
function niceTrack(b: Band): { trackLo: number; trackHi: number } {
  const span = b.hi - b.lo || Math.max(Math.abs(b.hi), 1);
  const rawLo = b.lo - span;
  const trackLo = b.lo >= 0 ? Math.max(0, Math.floor(rawLo)) : Math.floor(rawLo);
  return { trackLo, trackHi: Math.ceil(b.hi + span) };
}

export const stateId = (k: StateKey): string =>
  `${k.coa}|${k.contest}|${k.superseded ? 'K9' : 'K5'}|${k.waiver}`;

const gateChip = (label: string, tone: 'warn' | 'waiv' | 'stale' = 'warn'): string => {
  const c =
    tone === 'warn'
      ? 'background:#F8E2E2;color:#A33131;border-color:#EFC6C6'
      : tone === 'waiv'
        ? 'background:#EEE7F6;color:#6B4C9A;border-color:#D3C6E8'
        : 'background:#F7EDD8;color:#9A6A14;border-color:#E7D3A6';
  return `<span style="font-family:ui-monospace,monospace;font-size:10px;padding:1px 6px;border-radius:3px;border:1px solid;white-space:nowrap;${c}">${esc(label)}</span>`;
};

/** A J-2-lane knowledge node: id + band pill + provenance chip + any gate chips. */
function knowledgeNode(
  ko: KnowledgeObject,
  headline: string,
  gates: string[],
): string {
  const band = ko.answer ? bandPill(ko.answer, niceTrack(ko.answer)) : '';
  const prov = ko.provenance ? provenanceChip(ko.provenance, ko.jipoe_step) : '';
  const chips = gates.length
    ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px">${gates.join('')}</div>`
    : '';
  return `<div style="border:1px solid #D8DFE4;border-left:3px solid #14655F;border-radius:5px;padding:8px 10px;background:#FCFDFD;min-width:210px">
  <div style="font-family:ui-monospace,monospace;font-size:10px;color:#5B6B77">${esc(ko.logical_id)} · ${esc(headline)}</div>
  <div style="margin-top:4px">${band}</div>
  <div style="margin-top:5px">${prov}</div>
  ${chips}
</div>`;
}

function toDeltaRow(d: {
  seq: number;
  actor: string;
  role: string;
  op: string;
  refs: Ref[];
}): DeltaRow {
  const ids = d.refs.map((r) => r.logical_id).filter(Boolean);
  let text: string;
  switch (d.op) {
    case 'supersede':
      text = `${ids[0]} supersedes ${ids[1]} · staleness fan-out (scripted — Stage 6)`;
      break;
    case 'contest':
      text = `${ids[0]} ⇄ ${ids[1]} · compile blocked (G5)`;
      break;
    case 'resolve':
      text = `${ids[0]} survives · contest closed`;
      break;
    default:
      text = `${d.op} ${ids.join(', ')}`;
  }
  return { seq: d.seq, actor: d.actor, role: d.role, op: d.op, text };
}

// ————— the core: one bounded state, computed by the real seam —————

/**
 * Drive the real seam to the given state and capture every projection the view
 * needs. Nothing here is authored: compile/score/handful/relax decide the
 * outcomes; the delta feed is the real `DeltaLog`; refusals are first-class.
 */
export async function computeState(
  fx: FlowFixtures,
  key: StateKey,
  seed: number,
): Promise<StateData> {
  const kById = new Map(fx.knowledge.map((k) => [k.logical_id, k]));
  const svc = new KnowledgeService(); // actor J-2 (all knowledge writes are the J-2's)

  // Seed the answered base via the store (no delta noise); the narrative writes
  // below go through the service so they publish real, attributable deltas.
  for (const id of BASE_STATIC) {
    await svc.store.put({ ...clone(kById.get(id)!), status: 'answered' } as unknown as Record<string, unknown>);
  }
  const k8 = { ...clone(kById.get('K8')!), status: 'answered' } as Record<string, unknown>;
  if (key.waiver === 'withheld') delete k8.waiver; // withhold W-1 → the waiver gate bites
  await svc.store.put(k8);
  await svc.store.put({ ...clone(kById.get(WEATHER_PRIOR)!), status: 'answered' } as unknown as Record<string, unknown>);
  for (const coa of fx.coas) await svc.store.put(coa as unknown as Record<string, unknown>);
  for (const c of fx.commitments) await svc.store.put(c as unknown as Record<string, unknown>);

  // Narrative write 1 — the storm forecast supersedes the tide forecast (DEC-21).
  if (key.superseded) {
    await svc.supersede({ ...clone(kById.get(WEATHER_LIVE)!), status: 'answered' }, WEATHER_PRIOR);
  }

  // Narrative writes 2/3 — contest the mine-stock pair, and (unless the sandbox
  // holds it contested) adjudicate it. K12 enters the compile only to be tested.
  if (key.contest !== 'none') {
    await svc.store.put(clone(kById.get('K12a')!) as unknown as Record<string, unknown>);
    await svc.store.put(clone(kById.get('K12b')!) as unknown as Record<string, unknown>);
    svc.contest('K12a', 'K12b');
    if (key.contest === 'resolved') {
      svc.resolve('K12a', 'defector debrief corroborated; manifests predate the drawdown');
    }
  }

  const deltas = svc.deltas.all.map(toDeltaRow);

  // The J-2 lane: the narrative knowledge nodes with their live gates.
  const weatherKo = key.superseded ? kById.get(WEATHER_LIVE)! : kById.get(WEATHER_PRIOR)!;
  const weatherGates = key.superseded ? [gateChip('supersedes K5', 'stale')] : [];
  const k8Ko = { ...clone(kById.get('K8')!) } as KnowledgeObject;
  if (key.waiver === 'withheld') delete (k8Ko as { waiver?: unknown }).waiver;
  const k8Gates =
    key.waiver === 'granted' ? [gateChip('waiver W-1', 'waiv')] : [gateChip('waiver withheld', 'warn')];
  const mineNode =
    key.contest === 'contested'
      ? knowledgeNode(kById.get('K12a')!, 'mine stock', [gateChip('contested · G5')])
      : key.contest === 'resolved'
        ? knowledgeNode(kById.get('K12a')!, 'mine stock', [gateChip('resolved', 'waiv')])
        : '';
  const writeNodes = [
    knowledgeNode(weatherKo, key.superseded ? 'storm surge' : 'tide/surge', weatherGates),
    mineNode,
    knowledgeNode(k8Ko, 'battery state', k8Gates),
  ]
    .filter(Boolean)
    .join('\n');

  const staleScripted = key.superseded
    ? {
        flagged: ['P1·C2', 'P2·C1', 'P2·C2'],
        note: 'Stage 6 · /analyse/staleness (thesis F). The supersession flags exactly the K5-dependent verdicts; the fan-out is a read, computed once the analysis loop lands.',
      }
    : undefined;

  // Compile — the firewall. On refusal, persist the honest outcome and stop.
  const compileSet = [...BASE_STATIC, 'K8', key.superseded ? WEATHER_LIVE : WEATHER_PRIOR].map(refFor);
  if (key.contest === 'contested') compileSet.push(refFor('K12a'), refFor('K12b'));
  else if (key.contest === 'resolved') compileSet.push(refFor('K12a'));

  const compiler = new CompileService({ knowledge: svc });
  const compiled = await compiler.compile({
    knowledge: compileSet,
    config: fx.config,
    engine_version: ENGINE,
    seed,
    ...(key.coa === 'BASE' ? {} : { scenario: key.coa }),
  });

  const base: StateData = {
    id: stateId(key),
    key,
    outcome: 'refused',
    writeNodes,
    deltas,
    waiverActive: false,
    overlay: [],
    ...(staleScripted ? { staleScripted } : {}),
  };

  if (isRefusal(compiled)) {
    return {
      ...base,
      refusalHtml: refusalBanner(compiled),
      gate:
        compiled.reason === 'contested_knowledge'
          ? 'contest · G5'
          : compiled.reason === 'waiver_required'
            ? 'waiver gate'
            : compiled.reason,
    };
  }

  // Success — score the handful, render the honest matrix, trace, and (R3m) relax.
  const world = svc.store.get(compiled.world.content_hash) as CompiledWorld;
  const consumedIds = world.consumed.map((c) => c.logical_id);
  const knowledgeById = Object.fromEntries(consumedIds.map((id) => [id, kById.get(id)!])) as Record<
    string,
    KnowledgeObject
  >;
  const channelHtml = channelTrace(world, knowledgeById);
  const waiverActive = svc.trace.edges.some((e) => e.edge_type === 'waives');

  // Live map overlays: the threat/mobility region overrides in this world — the
  // real compiled channels (excursion-sourced ones flagged), never hand-drawn.
  const overlay: MapOverlay[] = world.channels
    .filter((c) => c.kind === 'threat' || c.kind === 'mobility')
    .flatMap((c) =>
      (c.regions ?? []).map((r) => ({
        region: r.region,
        kind: c.kind,
        lo: r.value.lo,
        hi: r.value.hi,
        unit: r.value.unit,
        fromScenario: r.source === key.coa,
      })),
    );

  const scorer = new ScoreService({
    store: svc.store,
    trace: svc.trace,
    config: fx.config,
    commitments: fx.commitments,
  });
  const handfulSvc = new HandfulService({
    store: svc.store,
    scorer,
    config: fx.config,
    commitments: fx.commitments,
  });

  let matrixHtml = '';
  let stripHtml = '';
  let handfulStampShort: string | undefined;
  const h = await handfulSvc.handful({ world: compiled.world, seed, engine_version: ENGINE });
  if (!isRefusal(h)) {
    handfulStampShort = shortStamp(h.stamp);
    const scenario = world.scenario ?? 'BASE';
    const stripRows: HandfulStripRow[] = h.plans.map((planRef, i) => {
      const plan = svc.store.get(planRef.content_hash) as Plan;
      // Trim the organiser's repeated non-domination boilerplate for the strip;
      // the full reason stays in the model/trace (this is a display summary).
      const reason = (h.organisation.distinct_because[i] ?? '').replace(
        /;\s*non-dominated \(no plan beats it on every commitment\)\.?/,
        '.',
      );
      return { plan: planRef, name: plan.name, distinct_because: reason };
    });
    stripHtml = handfulStrip(stripRows);
    const matrixRows: S2Cell[] = [];
    for (const planRef of h.plans) {
      const scored = await scorer.score({
        plan: planRef,
        world: compiled.world,
        scenario,
        engine_version: ENGINE,
      });
      const plan = svc.store.get(planRef.content_hash) as Plan;
      // P-id only — the axis meaning lives in the L2 handful strip; keeps the
      // matrix rows to one line (the matrix is about verdicts, not plan identity).
      if (!isRefusal(scored)) matrixRows.push({ plan: plan.logical_id, verdicts: scored.verdicts });
    }
    matrixHtml = s2Matrix(['C1', 'C2', 'C3', 'C4', 'C5', 'C6'], matrixRows);
  }

  let relaxHtml: string | undefined;
  let tieBreak: string | undefined;
  if (key.coa === 'R3m') {
    const relaxSvc = new RelaxService({
      store: svc.store,
      trace: svc.trace,
      scorer,
      commitments: fx.commitments,
    });
    const rr = await relaxSvc.relax({
      world: compiled.world,
      commitments: fx.commitments.map((c) => refFor(c.logical_id)),
      seed,
      engine_version: ENGINE,
    });
    if (!isRefusal(rr)) {
      const byId = new Map(fx.commitments.map((c) => [c.logical_id, c]));
      const cards: S3Card[] = rr.report.candidates.map((candidate) => ({
        candidate,
        sacrificed: candidate.sacrificed.map((id) => {
          const c = byId.get(id)!;
          return { logical_id: id, tier: c.tier, statement: c.statement };
        }),
      }));
      relaxHtml = s3Cards(cards, rr.report.tie_break);
      tieBreak = rr.report.tie_break;
    }
  }

  return {
    ...base,
    outcome: 'compiled',
    stampShort: shortStamp(compiled.stamp),
    ...(handfulStampShort ? { handfulStampShort } : {}),
    matrixHtml,
    stripHtml,
    channelHtml,
    waiverActive,
    overlay,
    ...(relaxHtml ? { relaxHtml } : {}),
    ...(tieBreak ? { tieBreak } : {}),
  };
}

// ————— assembling the whole model —————

const SANDBOX_COA: Coa[] = ['R1', 'R2', 'R3', 'R3m'];
const SANDBOX_CONTEST: Contest[] = ['contested', 'resolved'];

/** The frozen tableau: R1 excursion, K9 live, K12 resolved, W-1 granted. */
export const DEFAULT_KEY: StateKey = {
  coa: 'R1',
  contest: 'resolved',
  superseded: true,
  waiver: 'granted',
};

/** The tour's six beats, each a state key + narration (walkthrough §1–§7). */
const TOUR: { step: number; title: string; beat: string; narrative: string; key: StateKey; stage: PipelineStage; gatePulse?: string; scripted?: string }[] = [
  {
    step: 0,
    title: 'Opening state',
    beat: 'walkthrough §1',
    stage: 'knowledge',
    narrative:
      'D+2, scenario step 8. The base world is compiled from the answered set; the handful P-… is scored and green. K12a/K12b are about to be contested; the storm forecast has not yet arrived.',
    key: { coa: 'BASE', contest: 'none', superseded: false, waiver: 'granted' },
  },
  {
    step: 1,
    title: 'The J-2 revises knowledge',
    beat: 'walkthrough §2 · beat 1',
    stage: 'knowledge',
    narrative:
      'The met service issues an updated forecast: K9 (storm surge 1.1–1.8 m) supersedes K5. The supersedes edge is written; the fan-out flags the K5-dependent verdicts — instantly, and as a read (nothing recomputes silently).',
    key: { coa: 'BASE', contest: 'none', superseded: true, waiver: 'granted' },
    gatePulse: 'staleness · F',
    scripted: 'The fan-out flag set is scripted from the walkthrough (Stage 6 · /analyse/staleness not built).',
  },
  {
    step: 2,
    title: 'Contest — compile blocked',
    beat: 'walkthrough §3 · beat 2',
    stage: 'compile',
    narrative:
      'The allied LNO estimate (K12b: 140–220 mines) cannot be reconciled with the red cell debrief (K12a: 30–60). Contested. The planner asks for the K9-fresh world and the compile refuses: contested knowledge never compiles (G5).',
    key: { coa: 'BASE', contest: 'contested', superseded: true, waiver: 'granted' },
    gatePulse: 'contest · G5',
  },
  {
    step: 3,
    title: 'Resolve',
    beat: 'walkthrough §3 · beat 2',
    stage: 'compile',
    narrative:
      'After adjudication the J-2 resolves the contest — a resolves edge is written, the surviving answer stands, and the banner clears. The whole exchange travelled S1→S2→S1 as typed objects.',
    key: { coa: 'BASE', contest: 'resolved', superseded: true, waiver: 'granted' },
  },
  {
    step: 4,
    title: 'Recompile & regenerate',
    beat: 'walkthrough §4 · beat 3',
    stage: 'score',
    narrative:
      'The planner recompiles: the world consumes K9 (not the stale K5) and lands a new stamp. The handful is re-scored against it, stamped and delta-attributed — automatic, but never silent.',
    key: { coa: 'BASE', contest: 'resolved', superseded: true, waiver: 'granted' },
  },
  {
    step: 5,
    title: 'Least-worst under R3m',
    beat: 'walkthrough §5 · beat 4',
    stage: 'relax',
    narrative:
      'Against R3m (both approaches mined, causeway dropped) no plan satisfies C2–C4 together, and the dropped causeway forecloses C5 for every plan. /relax returns three inclusion-minimal least-worst candidates — sacrificing {C4,C5}, {C3,C5}, {C2,C5} — each in command language, the must-sacrifice ranked last but present. Never empty, never a silent drop (G4).',
    key: { coa: 'R3m', contest: 'resolved', superseded: true, waiver: 'granted' },
    gatePulse: 'least-worst · G4',
  },
  {
    step: 6,
    title: 'The commander selects; the loop closes',
    beat: 'walkthrough §6–§7 · beats 5–6',
    stage: 'decide',
    narrative:
      'The commander selects a least-worst card; a SelectionRationale is recorded with cited_in edges, and the exposure view raises K8 (single-source, waiver-carrying) to the top of the J-2 collection queue. The heartbeat repeats.',
    key: { coa: 'R3m', contest: 'resolved', superseded: true, waiver: 'granted' },
    scripted: 'Selection (/select) and exposure re-prioritisation are scripted from the walkthrough (the selection service is a later slice).',
  },
];

export async function buildFlowModel(fx: FlowFixtures, seed: number): Promise<FlowModel> {
  const states: Record<string, StateData> = {};

  // Enumerate the whole bounded sandbox (spec §4.3) — every reachable state is a
  // real seam output. 4 × 2 × 2 × 2 = 32 combinations.
  for (const coa of SANDBOX_COA) {
    for (const contest of SANDBOX_CONTEST) {
      for (const superseded of [true, false]) {
        for (const waiver of ['granted', 'withheld'] as Waiver[]) {
          const key: StateKey = { coa, contest, superseded, waiver };
          states[stateId(key)] = await computeState(fx, key, seed);
        }
      }
    }
  }

  // Add any tour-only states (the BASE-world and contest:'none' beats).
  const tour: TourBeat[] = [];
  for (const b of TOUR) {
    const id = stateId(b.key);
    if (!states[id]) states[id] = await computeState(fx, b.key, seed);
    tour.push({
      step: b.step,
      title: b.title,
      beat: b.beat,
      narrative: b.narrative,
      stateId: id,
      stage: b.stage,
      ...(b.gatePulse ? { gatePulse: b.gatePulse } : {}),
      ...(b.scripted ? { scripted: b.scripted } : {}),
    });
  }

  // The frozen-tableau world stamp (the tour's beat-4 recompiled world).
  const baseState = states[stateId(DEFAULT_KEY)]!;
  const baseStampShort = baseState.stampShort ?? '—';

  // AS-7 — the comparability guard, computed by the real seam: an R1-compiled
  // world is incomparable under an R2 scenario label; the scorer refuses
  // stamp_mismatch rather than render a value across stamps (G1).
  const comparability = await computeComparability(fx, seed);

  const map: MapRegion[] = fx.config.regions.map((r) => ({
    name: r.name,
    x0: r.x0,
    y0: r.y0,
    x1: r.x1,
    y1: r.y1,
  }));

  return {
    seed,
    engine: ENGINE,
    legend: { connectors: CONNECTORS, gates: GATES },
    baseStampShort,
    comparability,
    grid: { cols: fx.config.grid.cols, rows: fx.config.grid.rows },
    map,
    defaultStateId: stateId(DEFAULT_KEY),
    states,
    tour,
    sandboxOptions: {
      coa: SANDBOX_COA,
      contest: SANDBOX_CONTEST,
      superseded: [true, false],
      waiver: ['granted', 'withheld'],
    },
  };
}

/** The G1 comparability guard as a live seam result (AS-7). */
export async function computeComparability(
  fx: FlowFixtures,
  seed: number,
): Promise<{ reason: string; note: string }> {
  const kById = new Map(fx.knowledge.map((k) => [k.logical_id, k]));
  const svc = new KnowledgeService();
  for (const id of [...BASE_STATIC, 'K8']) {
    await svc.store.put({ ...clone(kById.get(id)!), status: 'answered' } as unknown as Record<string, unknown>);
  }
  await svc.store.put({ ...clone(kById.get(WEATHER_LIVE)!), status: 'answered' } as unknown as Record<string, unknown>);
  for (const coa of fx.coas) await svc.store.put(coa as unknown as Record<string, unknown>);
  for (const c of fx.commitments) await svc.store.put(c as unknown as Record<string, unknown>);
  const compiler = new CompileService({ knowledge: svc });
  const r1 = await compiler.compile({
    knowledge: [...BASE_STATIC, 'K8', WEATHER_LIVE].map(refFor),
    config: fx.config,
    scenario: 'R1',
    engine_version: ENGINE,
    seed,
  });
  if (isRefusal(r1)) return { reason: 'unknown_ref', note: 'comparability probe could not compile' };
  const scorer = new ScoreService({ store: svc.store, trace: svc.trace, config: fx.config, commitments: fx.commitments });
  const handfulSvc = new HandfulService({ store: svc.store, scorer, config: fx.config, commitments: fx.commitments });
  const h = await handfulSvc.handful({ world: r1.world, seed, engine_version: ENGINE });
  const plan = isRefusal(h) ? refFor('P-none') : h.plans[0]!;
  // Score the R1 world under the WRONG scenario label — the guard must refuse.
  const crossed = await scorer.score({ plan, world: r1.world, scenario: 'R2', engine_version: ENGINE });
  return {
    reason: isRefusal(crossed) ? crossed.reason : 'no_mismatch',
    note: 'An R1-compiled world scored under an R2 label refuses stamp_mismatch — cross-stamp artefacts grey out rather than render a value (G1).',
  };
}
