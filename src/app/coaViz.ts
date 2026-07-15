/**
 * SPEC-19 — the COA-visualisation client state (DOM-free, testable).
 *
 * The interactive mockup's world model, in the SPEC-16 mould (src/app/state.ts):
 * one ObjectStore + real services, seeded from the Meridian fixtures; every
 * input is a SERVICE CALL, never a mutation. Understanding is pure selection
 * (the step scrubs the already-compiled world — no recompute); input authors a
 * new immutable version — a waypoint drag writes a new `Plan` version
 * (DEC-20/21) and re-scores it through the real `ScoreService`; a band edit is
 * a knowledge supersede gated by the encoding firewall and confidence lint. A
 * dishonest input returns a first-class Refusal that persists nothing (G2/G5),
 * and the recompute over an edited plan is byte-identical to a from-scratch
 * run over the same inputs (G1) because it IS the same run.
 *
 * `snapshot()` re-renders the pure components (coaMap/coaTimeline/s2Matrix)
 * over the current store; every value-bearing element carries data-glow-id/
 * data-glow-sig so the shell's value-keyed glow (src/app/glow.ts, reused)
 * marks exactly what moved (G6).
 */
import type {
  Band,
  Commitment,
  CommitmentVerdict,
  CompiledWorld,
  KnowledgeObject,
  Plan,
  VignetteConfig,
} from '../generated/types.js';
import { isRefusal, type Refusal } from '../seam.js';
import { ObjectStore, type Ref } from '../store.js';
import { KnowledgeService } from '../knowledge.js';
import { CompileService } from '../compile.js';
import { ScoreService } from '../score.js';
import { checkEncoding } from '../encoding.js';
import { confidenceLint } from '../lint.js';
import { validateInstance } from '../validate.js';
import { dayWindowToSteps, exposureProfile } from '../mapProject.js';
import { coaMap } from '../components/coaMap.js';
import { coaTimeline, type CoaTimelineOptions } from '../components/coaTimeline.js';
import { s2Matrix, type S2Cell } from '../components/s2Matrix.js';
import { bandPill } from '../components/bandPill.js';
import { refusalBanner } from '../components/refusalBanner.js';

export interface CoaVizFixtures {
  knowledge: KnowledgeObject[];
  commitments: Commitment[];
  config: VignetteConfig;
  plans: Plan[];
}

export interface CoaVizSection {
  id: string;
  title: string;
  html: string;
}

export interface CoaVizSnapshot {
  step: number;
  sections: CoaVizSection[];
  stamps: { world?: string; scores: Record<string, string> };
  planVersions: Record<string, number>;
  notice?: { kind: 'refusal' | 'warning'; html: string };
}

const BASE = ['K1', 'K2', 'K3', 'K4', 'K6', 'K7', 'K8', 'K9'];
const COMMITMENT_IDS = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'];
const ENGINE = '0.1.0';
const refFor = (id: string): Ref => ({ logical_id: id, content_hash: '' });

const marginText = (m?: Band): string =>
  m === undefined ? 'no margin (objective unreachable)' : m.lo === m.hi ? `${m.lo} ${m.unit}` : `${m.lo}–${m.hi} ${m.unit}`;

export class CoaVizState {
  #fx: CoaVizFixtures;
  #kById: Map<string, KnowledgeObject>;
  #svc!: KnowledgeService;
  #compiler!: CompileService;
  #scorer!: ScoreService;
  #step = 8; // opening beat: ANVIL's fac_waters dwell (steps 8–9)
  #notice?: CoaVizSnapshot['notice'];

  constructor(fx: CoaVizFixtures) {
    this.#fx = fx;
    this.#kById = new Map(fx.knowledge.map((k) => [k.logical_id, k]));
  }

  /** Seed the store: BASE answered, commitments + the canned P1/P2 loaded. */
  async seed(): Promise<void> {
    const svc = new KnowledgeService();
    for (const id of BASE) {
      await svc.create({ ...structuredClone(this.#kById.get(id)!), status: 'answered' });
    }
    for (const c of this.#fx.commitments) await svc.store.put(c as unknown as Record<string, unknown>);
    for (const p of this.#fx.plans) await svc.store.put(p as unknown as Record<string, unknown>);
    this.#svc = svc;
    this.#compiler = new CompileService({ knowledge: svc });
    this.#scorer = new ScoreService({
      store: svc.store,
      trace: svc.trace,
      config: this.#fx.config,
      commitments: this.#fx.commitments,
    });
  }

  get store(): ObjectStore {
    return this.#svc.store;
  }
  get step(): number {
    return this.#step;
  }

  /** Scrub — pure selection over the compiled world; no recompute (note 10 §5). */
  setStep(n: number): void {
    const max = this.#fx.config.grid.horizon_steps;
    this.#step = Math.max(0, Math.min(max, Math.round(n)));
  }

  /** The latest live version of a plan lineage (drags stack v2, v3, …). */
  latestPlan(planId: string): { plan: Plan; ref: Ref } {
    const versions = this.#svc.store.versions(planId);
    if (versions.length === 0) throw new Error(`coaViz: unknown plan ${planId}`);
    const ref = versions[versions.length - 1]!;
    return { plan: this.#svc.store.get(ref.content_hash) as Plan, ref };
  }

  /**
   * Input: drag a waypoint — authors a NEW Plan version (immutable, DEC-20/21)
   * and lets the next snapshot re-score it through the real pipeline. The edit
   * touches geometry only; no verdict, cost, or cell value is written.
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
    const ep = next.elements.find((e) => e.force_element === element);
    const leg = ep?.route?.[legIndex];
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

  /**
   * Input: shift a task window — the same authoring act as a drag, on the
   * temporal axis. Moves a leg's [enter_step, exit_step] by `delta`, clamped
   * to the horizon; duration is preserved (the plan's stated intent, DEC-20).
   */
  async shiftWindow(planId: string, element: string, legIndex: number, delta: number): Promise<void> {
    this.#notice = undefined;
    const { plan } = this.latestPlan(planId);
    const next: Plan = structuredClone(plan);
    next.version = plan.version + 1;
    const ep = next.elements.find((e) => e.force_element === element);
    const leg = ep?.route?.[legIndex];
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

  /**
   * Input: edit a band endpoint on source knowledge — a supersede, gated by
   * the closed-interval rule (DEC-15), the encoding firewall and confidence
   * lint. A dishonest edit refuses in place and persists nothing (G2/G5).
   */
  async editBand(id: string, band: { lo: number; hi: number; unit: string }): Promise<void> {
    this.#notice = undefined;
    const latest = this.#latest(id);
    if (!latest) {
      this.#notice = {
        kind: 'refusal',
        html: refusalBanner({
          refused: true,
          reason: 'unknown_ref',
          offending: [refFor(id)],
          explanation: `${id}: no live version to edit.`,
        }),
      };
      return;
    }
    const next: KnowledgeObject = {
      ...structuredClone(latest),
      version: latest.version + 1,
      answer: { lo: band.lo, hi: band.hi, unit: band.unit },
    };
    // Pre-flight DEC-15 (validateInstance would throw — invalid shape is a
    // dishonest input here, so it surfaces as an in-place refusal instead).
    const shapeErrors = validateInstance('KnowledgeObject', next);
    if (shapeErrors.length > 0) {
      this.#notice = {
        kind: 'refusal',
        html: refusalBanner({
          refused: true,
          reason: 'encoding_violation',
          offending: [refFor(id)],
          explanation: shapeErrors.join('; '),
        }),
      };
      return;
    }
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
        html: `<div class="assay-lint" style="font-family:ui-monospace,monospace;font-size:11px;color:#9A6A14">⚠ ${warnings.map((w) => w.message).join('; ')}</div>`,
      };
    }
  }

  /**
   * The scripted dishonest input: assert K8's assessed repair window as a hard
   * fact by superseding it WITHOUT its waiver. The encoding firewall refuses
   * (`waiver_required`) and nothing persists — the refusal IS the demo (G2/G5).
   */
  async assertWithoutWaiver(id = 'K8'): Promise<void> {
    this.#notice = undefined;
    const latest = this.#latest(id);
    if (!latest) return;
    const next: KnowledgeObject = { ...structuredClone(latest), version: latest.version + 1 };
    delete next.waiver;
    const enc = checkEncoding(next);
    if (enc) {
      this.#notice = { kind: 'refusal', html: refusalBanner(enc) };
      return;
    }
    const res = await this.#svc.supersede(next, id);
    if (isRefusal(res)) this.#notice = { kind: 'refusal', html: refusalBanner(res) };
  }

  /** Compile + score the latest plan versions — the real pipeline, every call. */
  async snapshot(): Promise<CoaVizSnapshot> {
    const sections: CoaVizSection[] = [];
    const stamps: CoaVizSnapshot['stamps'] = { scores: {} };
    const planVersions: Record<string, number> = {};

    const compiled = await this.#compiler.compile({
      knowledge: BASE.map(refFor),
      config: this.#fx.config,
      engine_version: ENGINE,
    });

    if (isRefusal(compiled)) {
      sections.push({
        id: 'map',
        title: 'The map — refused',
        html: `<div data-glow-id="coaviz:refusal" data-glow-sig="refusal:${compiled.reason}">${refusalBanner(compiled)}</div>`,
      });
      const snap: CoaVizSnapshot = { step: this.#step, sections, stamps, planVersions };
      if (this.#notice) snap.notice = this.#notice;
      return snap;
    }

    stamps.world = compiled.stamp;
    const world = this.#svc.store.get(compiled.world.content_hash) as CompiledWorld;
    const knowledgeById = Object.fromEntries(
      BASE.map((id) => [id, this.#latest(id)!]),
    ) as Record<string, KnowledgeObject>;

    // Score the LATEST version of each plan lineage through the real scorer.
    const planIds = this.#fx.plans.map((p) => p.logical_id);
    const plans: Plan[] = [];
    const matrixRows: S2Cell[] = [];
    const c4Details: string[] = [];
    const profiles: NonNullable<CoaTimelineOptions['profiles']> = [];
    const c4 = this.#fx.commitments.find((c) => c.logical_id === 'C4')!;
    for (const planId of planIds) {
      const { plan, ref } = this.latestPlan(planId);
      plans.push(plan);
      planVersions[planId] = plan.version;
      const scored = await this.#scorer.score({
        plan: ref,
        world: compiled.world,
        scenario: 'BASE',
        engine_version: ENGINE,
      });
      if (isRefusal(scored)) {
        matrixRows.push({ plan: `${plan.logical_id} · ${plan.name}`, verdicts: [] });
        c4Details.push(refusalBanner(scored));
        continue;
      }
      stamps.scores[planId] = scored.stamp;
      matrixRows.push({ plan: `${plan.logical_id} · ${plan.name}`, verdicts: scored.verdicts });
      const v4 = scored.verdicts.find((v: CommitmentVerdict) => v.commitment === 'C4');
      if (v4) {
        const sig = `${v4.verdict}|${marginText(v4.margin)}|v${plan.version}`;
        c4Details.push(
          `<div data-glow-id="coaviz:c4:${plan.logical_id}" data-glow-sig="${sig}" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding:4px 0"><span style="font-family:ui-monospace,monospace;font-size:11px;font-weight:600">${plan.logical_id} v${plan.version} · C4 ${v4.verdict}</span>${v4.margin ? bandPill(v4.margin, { label: 'margin' }) : ''}</div>`,
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
    sections.push(
      {
        id: 'map',
        title: 'The map — banded surfaces, stated routes',
        html: coaMap(world, this.#fx.config, plans, { step: this.#step, knowledgeById, width: 640 }),
      },
      {
        id: 'timeline',
        title: 'The temporal companion — validity, task windows, the exposure staircase',
        html: coaTimeline(world, this.#fx.config, plans, {
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
      },
      {
        id: 'verdicts',
        title: 'The honest matrix — recomputed live over the edited plans',
        html: `${s2Matrix(COMMITMENT_IDS, matrixRows)}<div style="margin-top:8px">${c4Details.join('')}</div><p style="font-family:ui-monospace,monospace;font-size:10.5px;color:#5B6B77;margin:8px 0 0">stamp ${compiled.stamp.slice(0, 8)}… · scored from scratch on every edit (G1) — nothing is tweened.</p>`,
      },
    );

    const snap: CoaVizSnapshot = { step: this.#step, sections, stamps, planVersions };
    if (this.#notice) snap.notice = this.#notice;
    return snap;
  }

  #latest(id: string): KnowledgeObject | undefined {
    const versions = this.#svc.store.versions(id);
    if (versions.length === 0) return undefined;
    return this.#svc.store.get(versions[versions.length - 1]!.content_hash) as KnowledgeObject;
  }
}
