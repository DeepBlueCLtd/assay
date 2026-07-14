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
import type { ScenarioVerdictTensor } from '../seam.js';
import { checkEncoding } from '../encoding.js';
import { confidenceLint } from '../lint.js';
import { informs, influences, type Neighbour } from '../traceView.js';

import { s1Table, type S1Row } from '../components/s1Table.js';
import { channelTrace } from '../components/channelTrace.js';
import { refusalBanner } from '../components/refusalBanner.js';
import { s2Matrix, type S2Cell } from '../components/s2Matrix.js';
import { handfulStrip, type HandfulStripRow } from '../components/handfulStrip.js';
import { s3Cards, type S3Card } from '../components/s3Cards.js';
import { scenarioStrip } from '../components/scenarioStrip.js';
import { componentLegend } from '../components/legends.js';

export type TabId = 'j2' | 'planner' | 'commander' | 'observer';

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
  stamps: { world?: string; r3m?: string; handful?: string; relax?: string; robustness?: string };
  deltaCount: number;
  /** Last edit outcome, surfaced to the operator (refusal or lint caution). */
  notice?: { kind: 'refusal' | 'warning'; html: string };
}

export interface Fixtures {
  knowledge: KnowledgeObject[];
  coas: ScenarioCOA[];
  commitments: Commitment[];
  config: VignetteConfig;
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
  #resolved = false;
  #notice?: Snapshot['notice'];

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

  // ---- the snapshot (drives the real pipeline) ------------------------------

  async snapshot(scenario = 'BASE'): Promise<Snapshot> {
    const panels: Panel[] = [];
    const stamps: Snapshot['stamps'] = {};

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
      engine_version: '0.1.0',
    });
    if (isRefusal(compiled)) {
      panels.push({
        id: 'channels',
        tab: 'planner',
        title: 'Planner · compiled world',
        html: `<div data-glow-id="panel:channels" data-glow-sig="refusal:${compiled.reason}">${refusalBanner(compiled)}</div>`,
        deps: new Set([`refusal:${compiled.reason}`]),
      });
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

      // handful + matrix
      const h = await this.#handfulSvc.handful({
        world: compiled.world,
        seed: 1,
        engine_version: '0.1.0',
      });
      if (!isRefusal(h)) {
        stamps.handful = h.stamp;
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
            engine_version: '0.1.0',
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
            engine_version: '0.1.0',
          });
          if (!isRefusal(sw)) scenarioWorlds[sid] = sw.world;
        }
        if (Object.keys(scenarioWorlds).length > 1) {
          const rr = await this.#robustnessSvc.robustness({
            plans: h.plans,
            worlds: scenarioWorlds,
            engine_version: '0.1.0',
          });
          if (!isRefusal(rr)) {
            stamps.robustness = rr.stamp;
            const planNames: Record<string, string> = {};
            for (const planRef of h.plans) {
              const plan = this.#svc.store.get(planRef.content_hash) as Plan;
              planNames[planRef.logical_id] = `${plan.logical_id} · ${plan.name}`;
            }
            panels.push({
              id: 'scenarios',
              tab: 'commander',
              title: 'Commander · scenario robustness (thesis C)',
              html: componentLegend('scenarioStrip') + scenarioStrip(rr.tensor, { planNames }),
              deps: new Set([`robustness:${rr.stamp}`, ...Object.values(scenarioWorlds).map((w) => w.content_hash)]),
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
      engine_version: '0.1.0',
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
        engine_version: '0.1.0',
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
