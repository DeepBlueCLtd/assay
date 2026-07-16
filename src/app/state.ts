/**
 * SPEC-16 — the client world model (DOM-free, testable).
 *
 * Holds ONE ObjectStore + TraceStore + one instance of each real service,
 * seeded from the Meridian fixtures exactly as scripts/build-gallery.ts seeds
 * its build-time run. Operator edits are service calls (create/supersede/
 * contest/resolve; scenario; recompute) — never mutations (objects are
 * immutable, DEC-21) — so the honesty gates (encoding firewall, confidence
 * lint, contested-never-compiles) apply to every edit, and a dishonest edit
 * returns a first-class Refusal that persists nothing.
 *
 * `snapshot()` re-drives the real pipeline and returns per-panel view models
 * with the set of content_hashes each panel renders — the substrate the glow
 * diffs (src/app/glow.ts) and the trace menu walks (src/traceView.ts). No DOM
 * here; the shell renders. crypto.subtle is the one hash path for Node ≥19 and
 * the browser, so this runs unchanged under vitest.
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
} from '../generated/types.js';
import type { Delta, Refusal } from '../seam.js';
import { isRefusal } from '../seam.js';
import { ObjectStore, type Ref } from '../store.js';
import { KnowledgeService } from '../knowledge.js';
import { CompileService } from '../compile.js';
import { ScoreService } from '../score.js';
import { HandfulService } from '../handful.js';
import { RelaxService } from '../relax.js';
import { RobustnessService } from '../robustness.js';
import { SensitivityService } from '../sensitivity.js';
import { DiscriminationService } from '../discrimination.js';
import { StalenessService } from '../staleness.js';
import type { ScenarioVerdictTensor } from '../seam.js';
import { checkEncoding } from '../encoding.js';
import { confidenceLint } from '../lint.js';
import { informs, influences, type Neighbour } from '../traceView.js';
import { buildDepGraph, nodeDetail, type DepGraph, type DepGraphNodeDetail } from '../depGraph.js';

import { dayWindowToSteps, exposureProfile } from '../mapProject.js';
import { coaMap } from '../components/coaMap.js';
import { coaTimeline, type CoaTimelineOptions } from '../components/coaTimeline.js';
import { bandPill } from '../components/bandPill.js';
import { s1Table, type S1Row } from '../components/s1Table.js';
import { channelTrace } from '../components/channelTrace.js';
import { refusalBanner } from '../components/refusalBanner.js';
import { s2Matrix, type S2Cell } from '../components/s2Matrix.js';
import { handfulStrip, type HandfulStripRow } from '../components/handfulStrip.js';
import { s3Cards, type S3Card } from '../components/s3Cards.js';
import { scenarioStrip, type ScenarioLikelihood } from '../components/scenarioStrip.js';
import { sensitivityTable } from '../components/sensitivityTable.js';
import { discriminationTable } from '../components/discriminationTable.js';
import { weightTieBreak, type TieBreakEntry } from '../attention.js';
import { stalenessFlags } from '../components/stalenessFlags.js';
import { componentLegend } from '../components/legends.js';
import { ENGINE_VERSION } from '../engine.js';

export type TabId = 'j2' | 'planner' | 'commander' | 'observer' | 'coa';

export interface Panel {
  id: string;
  tab: TabId;
  title: string;
  html: string;
  /** The content hashes this panel renders — the glow dependency set. */
  deps: Set<string>;
}

export interface Snapshot {
  panels: Panel[];
  resolved: boolean;
  scenario: string;
  stamps: { world?: string; r3m?: string; handful?: string; relax?: string; robustness?: string; sensitivity?: string; discrimination?: string; staleness?: string };
  deltaCount: number;
  /** Last edit outcome, surfaced to the operator (refusal or lint caution). */
  notice?: { kind: 'refusal' | 'warning'; html: string };
}

export interface Fixtures {
  knowledge: KnowledgeObject[];
  coas: ScenarioCOA[];
  commitments: Commitment[];
  config: VignetteConfig;
  /** The canned P1/P2 (SPEC-07 suite). Present ⇒ the Spatial · COA tab renders (DEC-36). */
  plans?: Plan[];
}

export interface MenuNeighbour {
  label: string;
  edge: string;
  known: boolean;
}

const BASE = ['K1', 'K2', 'K3', 'K4', 'K6', 'K7', 'K8', 'K9'];
const COMMITMENT_IDS = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'];
const refFor = (id: string): Ref => ({ logical_id: id, content_hash: '' });

export class AppState {
  #fx: Fixtures;
  #kById: Map<string, KnowledgeObject>;
  #commitmentById: Map<string, Commitment>;
  #svc!: KnowledgeService;
  #compiler!: CompileService;
  #scorer!: ScoreService;
  #handfulSvc!: HandfulService;
  #relaxSvc!: RelaxService;
  #robustnessSvc!: RobustnessService;
  #sensitivitySvc!: SensitivityService;
  #discriminationSvc!: DiscriminationService;
  #stalenessSvc!: StalenessService;
  #resolved = false;
  #notice?: Snapshot['notice'];
  /** The Spatial tab's clock — pure selection over the compiled world (DEC-36c). */
  #step = 8;

  constructor(fx: Fixtures) {
    this.#fx = fx;
    this.#kById = new Map(fx.knowledge.map((k) => [k.logical_id, k]));
    this.#commitmentById = new Map(fx.commitments.map((c) => [c.logical_id, c]));
  }

  /** Seed the store to the opening position: BASE answered, K12 contested (the
   *  anchor the operator resolves), COAs + commitments loaded. */
  async seed(): Promise<void> {
    const svc = new KnowledgeService();
    for (const id of BASE) {
      await svc.create({ ...structuredClone(this.#kById.get(id)!), status: 'answered' });
    }
    await svc.create(structuredClone(this.#kById.get('K12a')!));
    await svc.create(structuredClone(this.#kById.get('K12b')!));
    svc.contest('K12a', 'K12b'); // open the dispute — compile refuses until resolved (G5)
    // The canned P1/P2 plans back the Spatial · COA tab (DEC-36d); drags author
    // new versions of these lineages, so they live in the same single store.
    for (const p of this.#fx.plans ?? []) await svc.store.put(p as unknown as Record<string, unknown>);
    // K11 and K13 are open questions with expected_answers — needed for discrimination (thesis D)
    const k11 = this.#kById.get('K11');
    if (k11) await svc.create(structuredClone(k11));
    const k13 = this.#kById.get('K13');
    if (k13) await svc.create(structuredClone(k13));
    // K14a–c — the scenario weights (SPEC-22). Legal knowledge writes; they are
    // NEVER passed to compile (a contested weight must not block a world it
    // never enters — research note 11-attention.md §2), and they reach no
    // channel by any path (knowledge model §9). They feed the attention block
    // and the queue tie-break only.
    for (const id of ['K14a', 'K14b', 'K14c']) {
      const k14 = this.#kById.get(id);
      if (k14) await svc.create(structuredClone(k14));
    }
    for (const coa of this.#fx.coas) await svc.store.put(coa as unknown as Record<string, unknown>);
    for (const c of this.#fx.commitments)
      await svc.store.put(c as unknown as Record<string, unknown>);

    this.#svc = svc;
    this.#compiler = new CompileService({ knowledge: svc });
    this.#scorer = new ScoreService({
      store: svc.store,
      trace: svc.trace,
      config: this.#fx.config,
      commitments: this.#fx.commitments,
    });
    this.#handfulSvc = new HandfulService({
      store: svc.store,
      scorer: this.#scorer,
      config: this.#fx.config,
      commitments: this.#fx.commitments,
    });
    this.#relaxSvc = new RelaxService({
      store: svc.store,
      trace: svc.trace,
      scorer: this.#scorer,
      commitments: this.#fx.commitments,
    });
    this.#robustnessSvc = new RobustnessService({
      store: svc.store,
      scorer: this.#scorer,
      commitments: this.#fx.commitments,
    });
    this.#sensitivitySvc = new SensitivityService({
      store: svc.store,
      trace: svc.trace,
      config: this.#fx.config,
      commitments: this.#fx.commitments,
    });
    this.#discriminationSvc = new DiscriminationService({
      store: svc.store,
    });
    this.#stalenessSvc = new StalenessService({
      store: svc.store,
      trace: svc.trace,
    });
  }

  get store(): ObjectStore {
    return this.#svc.store;
  }
  get knowledge(): KnowledgeService {
    return this.#svc;
  }
  get resolved(): boolean {
    return this.#resolved;
  }
  get step(): number {
    return this.#step;
  }
  get grid(): VignetteConfig['grid'] {
    return this.#fx.config.grid;
  }

  /** Scrub the Spatial tab's clock — selection over the compiled world; no recompute. */
  setStep(n: number): void {
    const max = this.#fx.config.grid.horizon_steps;
    this.#step = Math.max(0, Math.min(max, Math.round(n)));
  }

  /** The latest live version of a canned-plan lineage (drags stack v2, v3, …). */
  latestPlan(planId: string): { plan: Plan; ref: Ref } {
    const versions = this.#svc.store.versions(planId);
    if (versions.length === 0) throw new Error(`app: unknown plan ${planId}`);
    const ref = versions[versions.length - 1]!;
    return { plan: this.#svc.store.get(ref.content_hash) as Plan, ref };
  }

  // ---- edits (the interventions) --------------------------------------------

  /** Resolve the K12 contest — the anchor cascade. */
  resolveK12(): void {
    this.#notice = undefined;
    const r = this.#svc.resolve('K12a', 'defector debrief corroborated; manifests predate the drawdown');
    if (isRefusal(r)) {
      this.#notice = { kind: 'refusal', html: refusalBanner(r) };
      return;
    }
    this.#resolved = true;
  }

  /** Re-open the dispute (undo resolve) — contested knowledge blocks compile again. */
  contestK12(): void {
    this.#notice = undefined;
    this.#svc.contest('K12a', 'K12b');
    this.#resolved = false;
  }

  /** Edit an assessed answer band — a supersede, gated by the encoding firewall
   *  and confidence lint. Returns nothing; the outcome shows as a notice. */
  async editBand(id: string, band: { lo: number; hi: number; unit: string }): Promise<void> {
    this.#notice = undefined;
    const latest = this.#latest(id);
    if (!latest) {
      this.#notice = { kind: 'refusal', html: `<div>unknown knowledge ${id}</div>` };
      return;
    }
    const next: KnowledgeObject = {
      ...structuredClone(latest),
      version: latest.version + 1,
      answer: { lo: band.lo, hi: band.hi, unit: band.unit },
    };
    // Pre-flight the honesty gates so we can surface the outcome even though
    // supersede also enforces them.
    const enc = checkEncoding(next);
    if (enc) {
      this.#notice = { kind: 'refusal', html: refusalBanner(enc) };
      return;
    }
    const res = await this.#svc.supersede(next, id);
    if (isRefusal(res)) {
      this.#notice = { kind: 'refusal', html: refusalBanner(res) };
      return;
    }
    const warnings = confidenceLint(next);
    if (warnings.length > 0) {
      this.#notice = {
        kind: 'warning',
        html: `<div class="assay-lint" style="font-family:ui-monospace,monospace;font-size:11px;color:#9A6A14">⚠ ${warnings
          .map((w) => w.message)
          .join('; ')}</div>`,
      };
    }
  }

  /**
   * Input (Spatial tab): drag a waypoint — authors a NEW Plan version
   * (immutable, DEC-20/21); the next snapshot re-scores it through the real
   * pipeline. Geometry only — never a verdict, cost, or cell value (DEC-36c).
   */
  async moveWaypoint(planId: string, element: string, legIndex: number, x: number, y: number): Promise<void> {
    this.#notice = undefined;
    const grid = this.#fx.config.grid;
    if (x < 0 || x >= grid.cols || y < 0 || y >= grid.rows || !Number.isInteger(x) || !Number.isInteger(y)) {
      this.#notice = {
        kind: 'refusal',
        html: refusalBanner({
          refused: true,
          reason: 'encoding_violation',
          offending: [refFor(planId)],
          explanation: `waypoint (${x}, ${y}) is off the ${grid.cols}×${grid.rows} grid — no geometry exists there to route through.`,
        }),
      };
      return;
    }
    const { plan } = this.latestPlan(planId);
    const next: Plan = structuredClone(plan);
    next.version = plan.version + 1;
    const leg = next.elements.find((e) => e.force_element === element)?.route?.[legIndex];
    if (!leg) {
      this.#notice = {
        kind: 'refusal',
        html: refusalBanner({
          refused: true,
          reason: 'unknown_ref',
          offending: [refFor(planId)],
          explanation: `${planId} has no ${element} leg ${legIndex} to move.`,
        }),
      };
      return;
    }
    leg.x = x;
    leg.y = y;
    await this.#svc.store.put(next as unknown as Record<string, unknown>);
  }

  /** Input (Spatial tab): shift a leg's task window by `delta` steps, duration preserved. */
  async shiftWindow(planId: string, element: string, legIndex: number, delta: number): Promise<void> {
    this.#notice = undefined;
    const { plan } = this.latestPlan(planId);
    const next: Plan = structuredClone(plan);
    next.version = plan.version + 1;
    const leg = next.elements.find((e) => e.force_element === element)?.route?.[legIndex];
    if (!leg) {
      this.#notice = {
        kind: 'refusal',
        html: refusalBanner({
          refused: true,
          reason: 'unknown_ref',
          offending: [refFor(planId)],
          explanation: `${planId} has no ${element} leg ${legIndex} to shift.`,
        }),
      };
      return;
    }
    const horizon = this.#fx.config.grid.horizon_steps;
    const duration = leg.exit_step - leg.enter_step;
    const enter = Math.max(0, Math.min(horizon - duration, leg.enter_step + delta));
    leg.enter_step = enter;
    leg.exit_step = enter + duration;
    await this.#svc.store.put(next as unknown as Record<string, unknown>);
  }

  // ---- the snapshot (drives the real pipeline) ------------------------------

  async snapshot(scenario = 'BASE'): Promise<Snapshot> {
    const panels: Panel[] = [];
    const stamps: Snapshot['stamps'] = {};
    let firstPlanRef: Ref | undefined;

    // Live knowledge id set: the survivor K12a once resolved, else the whole
    // contested pair (so the compile honestly refuses).
    const liveIds = this.#resolved ? [...BASE, 'K12a'] : [...BASE, 'K12a', 'K12b'];

    // ---- J-2 · knowledge table ----
    const s1Rows: S1Row[] = liveIds.map((id) => {
      const ko = this.#latest(id)!;
      const eff = this.#svc.effectiveStatus(id);
      const row: S1Row = { object: ko, blocked: eff === 'contested', warnings: confidenceLint(ko) };
      if (eff) row.effectiveStatus = eff;
      return row;
    });
    panels.push({
      id: 's1',
      tab: 'j2',
      title: 'J-2 · knowledge base',
      html:
        componentLegend('s1Table') +
        s1Table(s1Rows, this.#notice?.kind === 'refusal' ? { caption: 'Last edit refused.' } : {}),
      deps: new Set(liveIds.map((id) => this.#latestHash(id)!).filter(Boolean)),
    });

    // ---- Planner · compile → handful → matrix ----
    const compiled = await this.#compiler.compile({
      knowledge: liveIds.map(refFor),
      config: this.#fx.config,
      engine_version: ENGINE_VERSION,
    });
    if (isRefusal(compiled)) {
      panels.push({
        id: 'channels',
        tab: 'planner',
        title: 'Planner · compiled world',
        html: `<div data-glow-id="panel:channels" data-glow-sig="refusal:${compiled.reason}">${refusalBanner(compiled)}</div>`,
        deps: new Set([`refusal:${compiled.reason}`]),
      });
      if ((this.#fx.plans ?? []).length > 0) {
        // The map refuses with the compile — no blank, no guessed surface (G5).
        panels.push({
          id: 'coamap',
          tab: 'coa',
          title: 'Spatial · the map refuses with the compile',
          html: `<div data-glow-id="panel:coamap" data-glow-sig="refusal:${compiled.reason}">${refusalBanner(compiled)}</div>`,
          deps: new Set([`refusal:${compiled.reason}`]),
        });
      }
    } else {
      stamps.world = compiled.stamp;
      const world = this.#svc.store.get(compiled.world.content_hash) as CompiledWorld;
      const knowledgeById = Object.fromEntries(
        liveIds.map((id) => [id, this.#latest(id)!]),
      ) as Record<string, KnowledgeObject>;
      const worldDeps = new Set<string>([compiled.world.content_hash, ...world.consumed.map((c) => c.content_hash)]);
      panels.push({
        id: 'channels',
        tab: 'planner',
        title: 'Planner · compiled world (sparse channels)',
        html: componentLegend('channelTrace') + channelTrace(world, knowledgeById),
        deps: worldDeps,
      });

      // ---- Spatial · COA tab (SPEC-19 promoted, DEC-36d): the same store,
      // rendered as geometry. Scoring the LATEST version of each canned-plan
      // lineage means a drag (a new version) re-scores through the real
      // pipeline on the next snapshot — same recompute, moved onto the map.
      if ((this.#fx.plans ?? []).length > 0) {
        const c4 = this.#commitmentById.get('C4')!;
        const coaPlans: Plan[] = [];
        const coaMatrix: S2Cell[] = [];
        const c4Details: string[] = [];
        const profiles: NonNullable<CoaTimelineOptions['profiles']> = [];
        const coaDeps = new Set<string>([compiled.world.content_hash]);
        for (const p of this.#fx.plans!) {
          const { plan, ref } = this.latestPlan(p.logical_id);
          coaPlans.push(plan);
          coaDeps.add(ref.content_hash);
          const scored = await this.#scorer.score({
            plan: ref,
            world: compiled.world,
            scenario: 'BASE',
            engine_version: ENGINE_VERSION,
          });
          if (isRefusal(scored)) {
            coaMatrix.push({ plan: `${plan.logical_id} · ${plan.name}`, verdicts: [] });
            c4Details.push(refusalBanner(scored));
            continue;
          }
          coaMatrix.push({ plan: `${plan.logical_id} · ${plan.name}`, verdicts: scored.verdicts });
          for (const v of scored.verdicts) coaDeps.add(this.#verdictKey(v));
          const v4 = scored.verdicts.find((v) => v.commitment === 'C4');
          if (v4) {
            const m = v4.margin;
            const mText = m === undefined ? 'no margin' : m.lo === m.hi ? `${m.lo} ${m.unit}` : `${m.lo}–${m.hi} ${m.unit}`;
            c4Details.push(
              `<div data-glow-id="coaviz:c4:${plan.logical_id}" data-glow-sig="${v4.verdict}|${mText}|v${plan.version}" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding:4px 0"><span style="font-family:ui-monospace,monospace;font-size:11px;font-weight:600">${plan.logical_id} v${plan.version} · C4 ${v4.verdict}</span>${m ? bandPill(m, { label: 'margin' }) : ''}</div>`,
            );
          }
          profiles.push({
            plan: plan.logical_id,
            element: 'FE-ANVIL',
            points: exposureProfile(plan, 'FE-ANVIL', world, this.#fx.config, 'threat', c4.unit),
            unit: c4.unit,
            threshold: { commitment: 'C4', value: c4.threshold },
          });
        }
        const peak = dayWindowToSteps(5, 7, this.#fx.config.grid.timestep_hours);
        panels.push(
          {
            id: 'coamap',
            tab: 'coa',
            title: `Spatial · banded surfaces, stated routes (step ${this.#step} — drag a waypoint to author a new plan version)`,
            html: coaMap(world, this.#fx.config, coaPlans, { step: this.#step, knowledgeById, width: 640 }),
            deps: coaDeps,
          },
          {
            id: 'coatimeline',
            tab: 'coa',
            title: 'Spatial · validity, task windows, the exposure staircase',
            html: coaTimeline(world, this.#fx.config, coaPlans, {
              step: this.#step,
              knowledge: [this.#kById.get('K5')!, this.#latest('K9') ?? this.#kById.get('K9')!],
              supersessions: [{ from: 'K5', to: 'K9' }],
              annotations: [
                {
                  label: '“surge peaking D+5–D+7” — stated by METOC (K9)',
                  from_step: peak.from_step,
                  until_step: peak.until_step,
                  source: 'K9',
                },
              ],
              profiles,
              width: 860,
            }),
            deps: coaDeps,
          },
          {
            id: 'coaverdicts',
            tab: 'coa',
            title: 'Spatial · the canned P1/P2, re-scored live (the planner matrix scores the generated handful)',
            html: `${s2Matrix(COMMITMENT_IDS, coaMatrix)}<div style="margin-top:8px">${c4Details.join('')}</div>`,
            deps: coaDeps,
          },
        );
      }

      // handful + matrix
      const h = await this.#handfulSvc.handful({
        world: compiled.world,
        seed: 1,
        engine_version: ENGINE_VERSION,
      });
      if (!isRefusal(h)) {
        stamps.handful = h.stamp;
        firstPlanRef = h.plans[0];
        const stripRows: HandfulStripRow[] = h.plans.map((planRef, i) => {
          const plan = this.#svc.store.get(planRef.content_hash) as Plan;
          return { plan: planRef, name: plan.name, distinct_because: h.organisation.distinct_because[i]! };
        });
        const matrixRows: S2Cell[] = [];
        const matrixDeps = new Set<string>([compiled.world.content_hash]);
        for (const planRef of h.plans) {
          matrixDeps.add(planRef.content_hash);
          const scored = await this.#scorer.score({
            plan: planRef,
            world: compiled.world,
            scenario: 'BASE',
            engine_version: ENGINE_VERSION,
          });
          const plan = this.#svc.store.get(planRef.content_hash) as Plan;
          if (!isRefusal(scored)) {
            matrixRows.push({ plan: `${plan.logical_id} · ${plan.name}`, verdicts: scored.verdicts });
            for (const v of scored.verdicts) matrixDeps.add(this.#verdictKey(v));
          }
        }
        panels.push({
          id: 'strip',
          tab: 'planner',
          title: 'Planner · the generated handful',
          html: componentLegend('handfulStrip') + handfulStrip(stripRows),
          deps: new Set([...h.plans.map((p) => p.content_hash), `handful:${h.stamp}`]),
        });
        panels.push({
          id: 'matrix',
          tab: 'planner',
          title: 'Planner · the honest matrix',
          html: componentLegend('s2Matrix') + s2Matrix(COMMITMENT_IDS, matrixRows),
          deps: matrixDeps,
        });

        // SPEC-10 — scenario strip: score the handful across R1/R2/R3
        const scenarioWorlds: Record<string, Ref> = { BASE: compiled.world };
        for (const sid of ['R1', 'R2', 'R3']) {
          const sw = await this.#compiler.compile({
            knowledge: liveIds.map(refFor),
            config: this.#fx.config,
            scenario: sid,
            engine_version: ENGINE_VERSION,
          });
          if (!isRefusal(sw)) scenarioWorlds[sid] = sw.world;
        }
        if (Object.keys(scenarioWorlds).length > 1) {
          const rr = await this.#robustnessSvc.robustness({
            plans: h.plans,
            worlds: scenarioWorlds,
            engine_version: ENGINE_VERSION,
          });
          if (!isRefusal(rr)) {
            stamps.robustness = rr.stamp;
            const planNames: Record<string, string> = {};
            for (const planRef of h.plans) {
              const plan = this.#svc.store.get(planRef.content_hash) as Plan;
              planNames[planRef.logical_id] = `${plan.logical_id} · ${plan.name}`;
            }
            // SPEC-22 — the attention block: each scenario's likelihood band
            // (K14a–c via ScenarioCOA.likelihood), rendered under the interval
            // order above the verdict grid. Attention only: the grid's content
            // and order never move with it (research note 11-attention.md §5).
            const stripDeps = new Set([`robustness:${rr.stamp}`, ...Object.values(scenarioWorlds).map((w) => w.content_hash)]);
            const likelihoods: ScenarioLikelihood[] = [];
            for (const sid of rr.tensor.scenarios) {
              const coa = this.#fx.coas.find((c) => c.logical_id === sid);
              if (!coa) continue; // BASE is not an adversary COA — no weight exists to render
              const item: ScenarioLikelihood = { scenario: sid, name: coa.name };
              if (coa.likelihood) {
                item.logical_id = coa.likelihood;
                const ko = this.#latest(coa.likelihood);
                if (ko?.answer) item.band = ko.answer;
                if (ko?.provenance) item.provenance = ko.provenance;
                if (ko?.jipoe_step) item.jipoe_step = ko.jipoe_step;
                if ((this.#svc.effectiveStatus(coa.likelihood) ?? ko?.status) === 'contested') item.contested = true;
                const h14 = this.#latestHash(coa.likelihood);
                if (h14) stripDeps.add(h14);
              }
              likelihoods.push(item);
            }
            panels.push({
              id: 'scenarios',
              tab: 'commander',
              title: 'Commander · scenario robustness (thesis C)',
              html: componentLegend('scenarioStrip') + scenarioStrip(rr.tensor, { planNames, likelihoods }),
              deps: stripDeps,
            });
          }
        }
      }
    }

    // ---- Commander · relax over R3m ----
    const r3m = await this.#compiler.compile({
      knowledge: liveIds.map(refFor),
      config: this.#fx.config,
      scenario: 'R3m',
      engine_version: ENGINE_VERSION,
    });
    if (isRefusal(r3m)) {
      panels.push({
        id: 'cards',
        tab: 'commander',
        title: 'Commander · least-worst (R3m)',
        html: `<div data-glow-id="panel:cards" data-glow-sig="refusal:${r3m.reason}">${refusalBanner(r3m)}</div>`,
        deps: new Set([`refusal:${r3m.reason}`]),
      });
    } else {
      stamps.r3m = r3m.stamp;
      const rr = await this.#relaxSvc.relax({
        world: r3m.world,
        commitments: this.#fx.commitments.map((c) => refFor(c.logical_id)),
        seed: 1,
        engine_version: ENGINE_VERSION,
      });
      if (!isRefusal(rr)) {
        stamps.relax = rr.stamp;
        const cards: S3Card[] = rr.report.candidates.map((candidate) => ({
          candidate,
          sacrificed: candidate.sacrificed.map((id) => {
            const c = this.#commitmentById.get(id)!;
            return { logical_id: id, tier: c.tier, statement: c.statement };
          }),
        }));
        panels.push({
          id: 'cards',
          tab: 'commander',
          title: 'Commander · least-worst, never silence (R3m)',
          html: componentLegend('s3Cards') + s3Cards(cards, rr.report.tie_break),
          deps: new Set([
            r3m.world.content_hash,
            `relax:${rr.stamp}`,
            ...rr.report.candidates.map((c) => `plan:${c.plan}`),
          ]),
        });
      }
    }

    // ---- J-2 · sensitivity analysis (thesis E) ----
    if (!isRefusal(compiled) && firstPlanRef) {
      const sensResult = await this.#sensitivitySvc.analyse({
        plan: firstPlanRef,
        world: compiled.world,
        scenario: 'BASE',
        engine_version: ENGINE_VERSION,
      });
      if (!isRefusal(sensResult)) {
        stamps.sensitivity = sensResult.stamp;
        panels.push({
          id: 'sensitivity',
          tab: 'j2',
          title: 'J-2 · sensitivity ranking (thesis E)',
          html: componentLegend('sensitivityTable') + sensitivityTable(sensResult.ranking),
          deps: new Set([`sensitivity:${sensResult.stamp}`]),
        });
      }
    }

    // ---- J-2 · discrimination analysis (thesis D) ----
    {
      const k11Ref = this.#latestRef('K11');
      const k13Ref = this.#latestRef('K13');
      if (k11Ref && k13Ref) {
        const discResult = await this.#discriminationSvc.analyse({
          questions: [k11Ref, k13Ref],
          coas: ['R1', 'R2', 'R3'],
          engine_version: ENGINE_VERSION,
        });
        if (!isRefusal(discResult)) {
          stamps.discrimination = discResult.stamp;
          // SPEC-22 — the queue MAY tie-break exactly-equal discrimination
          // standings by scenario weight, stated in the rendering. Composed
          // HERE, around the untouched service — its ranking and stamp never
          // see a weight (research note 11-attention.md §3). Contested weights
          // order nothing until resolved.
          const likelihoodBands = new Map<string, Band | undefined>();
          for (const coa of this.#fx.coas) {
            if (!coa.likelihood) continue;
            const ko = this.#latest(coa.likelihood);
            if ((this.#svc.effectiveStatus(coa.likelihood) ?? ko?.status) === 'contested') continue;
            likelihoodBands.set(coa.logical_id, ko?.answer);
          }
          const tieEntries: TieBreakEntry[] = discResult.ranking.map((e) => ({
            question: e.question.logical_id,
            best_separation: e.best_separation,
            bestPairs: e.pairs
              .filter((p) => p.separation.lo === e.best_separation.lo && p.separation.hi === e.best_separation.hi)
              .map((p) => [p.coa_a, p.coa_b] as const),
          }));
          const tb = weightTieBreak(tieEntries, likelihoodBands);
          const entryById = new Map(discResult.ranking.map((e) => [e.question.logical_id, e]));
          const queue = tb.order.map((q) => entryById.get(q)!);
          panels.push({
            id: 'discrimination',
            tab: 'j2',
            title: 'J-2 · discrimination ranking (thesis D)',
            html: componentLegend('discriminationTable') + discriminationTable(queue, { tieBreaks: tb.statements }),
            deps: new Set([
              `discrimination:${discResult.stamp}`,
              `queue:${tb.order.join(',')}|${[...tb.statements.keys()].sort().join(',')}`,
            ]),
          });
        }
      }
    }

    // ---- Observer · staleness analysis (thesis F) ----
    if (!isRefusal(compiled)) {
      const k9Ref = this.#latestRef('K9');
      if (k9Ref) {
        const staleResult = await this.#stalenessSvc.analyse({
          changed: k9Ref,
          engine_version: ENGINE_VERSION,
        });
        if (!isRefusal(staleResult)) {
          stamps.staleness = staleResult.stamp;
          panels.push({
            id: 'staleness',
            tab: 'observer',
            title: 'Observer · staleness flags (thesis F)',
            html: componentLegend('stalenessFlags') + stalenessFlags(staleResult.invalidated, staleResult.chains),
            deps: new Set([`staleness:${staleResult.stamp}`]),
          });
        }
      }
    }

    // ---- Observer · the delta feed ----
    const deltas = this.#svc.deltas.all;
    panels.push({
      id: 'observer',
      tab: 'observer',
      title: 'Observer · the seam, watched',
      html: this.#deltaFeed(deltas),
      deps: new Set([`deltas:${deltas.length}`]),
    });

    const snap: Snapshot = {
      panels,
      resolved: this.#resolved,
      scenario,
      stamps,
      deltaCount: deltas.length,
    };
    if (this.#notice) snap.notice = this.#notice;
    return snap;
  }

  // ---- helpers --------------------------------------------------------------

  /** One-hop "informs / influenced by" for an item, resolved to readable labels
   *  — the before/after context menu (SPEC-16, over the orientation map). */
  traceMenu(logicalId: string): { informs: MenuNeighbour[]; influences: MenuNeighbour[] } | undefined {
    const hash = this.#latestHash(logicalId);
    if (!hash) return undefined;
    const known = (h: string): boolean => this.#svc.store.exists(h);
    const label = (ns: Neighbour[]): MenuNeighbour[] =>
      ns.map((n) => ({ label: this.describeHash(n.hash), edge: n.edge_type, known: n.known }));
    return {
      informs: label(informs(this.#svc.trace, hash, known)),
      influences: label(influences(this.#svc.trace, hash, known)),
    };
  }

  /** Full transitive dependency graph around an item (issue #24). */
  depGraph(logicalId: string, maxDepth = 4): DepGraph | undefined {
    const hash = this.#latestHash(logicalId);
    if (!hash) return undefined;
    return buildDepGraph(hash, this.#svc.trace, this.#svc.store, maxDepth);
  }

  /** Dependency graph by content hash (for re-focusing on a clicked node). */
  depGraphByHash(hash: string, maxDepth = 4): DepGraph {
    return buildDepGraph(hash, this.#svc.trace, this.#svc.store, maxDepth);
  }

  /** Detail for a single node in the dependency graph (sidebar). */
  depNodeDetail(hash: string, maxDepth = 4): DepGraphNodeDetail {
    return nodeDetail(hash, this.#svc.trace, this.#svc.store, maxDepth);
  }

  /** A short, readable label for a content hash (for the trace menu). */
  describeHash(hash: string): string {
    const o = this.#svc.store.get(hash) as Record<string, unknown> | undefined;
    if (!o) return `${hash.slice(0, 8)}… (dead end — G3)`;
    if (typeof o.logical_id === 'string' && o.logical_id) {
      return typeof o.name === 'string' ? `${o.logical_id} · ${o.name}` : o.logical_id;
    }
    if (typeof o.stamp === 'string') return `world ${o.stamp.slice(0, 8)}…`;
    return `${hash.slice(0, 8)}…`;
  }

  #latest(id: string): KnowledgeObject | undefined {
    const h = this.#latestHash(id);
    return h ? (this.#svc.store.get(h) as KnowledgeObject) : undefined;
  }

  #latestHash(id: string): string | undefined {
    const versions = this.#svc.store.versions(id);
    return versions.length > 0 ? versions[versions.length - 1]!.content_hash : undefined;
  }

  #latestRef(id: string): Ref | undefined {
    const versions = this.#svc.store.versions(id);
    return versions.length > 0 ? versions[versions.length - 1] : undefined;
  }

  /** A stable per-verdict change key (verdict is not stored content-addressed
   *  here; its (plan, commitment, verdict) triple is its identity for glow). */
  #verdictKey(v: CommitmentVerdict): string {
    return `verdict:${v.plan}:${v.commitment}:${v.verdict}`;
  }

  #deltaFeed(deltas: readonly Delta[]): string {
    const rows = deltas
      .slice()
      .reverse()
      .map(
        (d) =>
          `<tr data-glow-id="delta:${d.seq}" data-glow-sig="${d.op}:${d.refs.map((r) => r.logical_id).join(',')}" style="border-top:1px solid #E4E9ED"><td style="padding:5px 8px;font-family:ui-monospace,monospace;font-size:11px;color:#5B6B77">#${d.seq}</td><td style="padding:5px 8px;font-size:12px">${d.op}</td><td style="padding:5px 8px;font-size:11px;color:#3E5D8A">${d.role} · ${d.actor}</td><td style="padding:5px 8px;font-family:ui-monospace,monospace;font-size:11px;color:#5B6B77">${d.refs.map((r) => r.logical_id).join(', ')}</td></tr>`,
      )
      .join('');
    return `<p style="font-size:12px;color:#5B6B77">Every knowledge write publishes exactly one stamped delta (seam §10). Newest first.</p>
    <table style="border-collapse:collapse;width:100%"><thead><tr style="text-align:left;color:#5B6B77;font-size:10.5px;text-transform:uppercase"><th style="padding:0 8px 5px">Seq</th><th style="padding:0 8px 5px">Op</th><th style="padding:0 8px 5px">By</th><th style="padding:0 8px 5px">Refs</th></tr></thead><tbody>${rows}</tbody></table>`;
  }
}
