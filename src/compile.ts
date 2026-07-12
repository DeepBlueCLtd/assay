/**
 * SPEC-06 — the compile service (seam contract §4).
 *
 * Knowledge subset + vignette config → CompiledWorld, over the content-addressed
 * store (SPEC-01), trace store (SPEC-02), and knowledge service (SPEC-05). The
 * compile is a firewall as much as a transform (knowledge model §9): it refuses
 * `contested_knowledge` (G5, completing what SPEC-05 marked), `stale_input`, and
 * — as defence in depth — `encoding_violation`/`waiver_required`; it firewalls
 * `scenario_weight` from every channel by any path; and it declines first-class,
 * persisting nothing on refusal.
 *
 * Channels are stored SPARSE — a per-channel `default` band plus named,
 * optionally time-boxed `RegionOverride`s (research note `02-compile.md`). No
 * dense per-cell channel is ever stored or hashed; region→cell materialisation
 * is a lazy, unstored, score-time function (Stage 3). The stamp is a hash over
 * inputs (consumed refs + config + engine version + seed?), not over any dense
 * surface, so determinism (G1) is independent of representation.
 *
 * On success the compile writes one `compiled_into` edge per consumed object
 * and a `waives` edge per waiver-carrying object, and every RegionOverride names
 * its `source`, so every channel value is backward-traceable to named knowledge
 * with a named owner (G3). Compile publishes no delta (seam §4): it is a
 * read-of-knowledge that produces a world, not a knowledge write.
 */
import type {
  Band,
  Channel,
  ChannelKind,
  CompiledWorld,
  ConsumedRef,
  KnowledgeObject,
  RegionOverride,
  ScenarioCOA,
  TraceEdge,
  VignetteConfig,
} from './generated/types.js';
import { ObjectStore, type Ref } from './store.js';
import { TraceStore } from './trace.js';
import { KnowledgeService } from './knowledge.js';
import { checkEncoding, mayCompileAsConstraintOrCost } from './encoding.js';
import { contentHash } from './canonical.js';
import { validateInstance } from './validate.js';
import type { Refusal } from './seam.js';

export interface CompileRequest {
  /** Knowledge to consume; the latest live version of each named lineage is read. */
  knowledge: Ref[];
  /** A ScenarioCOA logical id (R1/R2/R3/R3m); its excursion is applied as an overlay. */
  scenario?: string;
  config: VignetteConfig;
  engine_version: string;
  seed?: number;
}

export interface CompileSuccess {
  world: Ref;
  stamp: string;
  compiled_from: Ref[];
}

export type CompileResult = CompileSuccess | Refusal;

const CHANNEL_KINDS: ChannelKind[] = [
  'mobility',
  'tide',
  'storm',
  'civil_density',
  'sensor',
  'threat',
];

interface Resolved {
  logical_id: string;
  hash: string;
  ko: KnowledgeObject;
}

export class CompileService {
  #store: ObjectStore;
  #trace: TraceStore;
  #knowledge: KnowledgeService;
  #writtenBy: string;

  constructor(opts: {
    knowledge: KnowledgeService;
    store?: ObjectStore;
    trace?: TraceStore;
    writtenBy?: string;
  }) {
    // Compile shares the knowledge service's store and trace graph — it consumes
    // exactly what the knowledge service persisted and writes edges into the same
    // graph. Falling back to the service's own store/trace keeps them one graph.
    this.#knowledge = opts.knowledge;
    this.#store = opts.store ?? opts.knowledge.store;
    this.#trace = opts.trace ?? opts.knowledge.trace;
    this.#writtenBy = opts.writtenBy ?? 'compile-service';
  }

  /** POST /compile — refuses before it builds; persists nothing on refusal. */
  async compile(req: CompileRequest): Promise<CompileResult> {
    // 1. Resolve each requested lineage to its latest live version.
    const resolved: Resolved[] = [];
    for (const ref of req.knowledge) {
      const hash = this.#latestHash(ref.logical_id);
      if (!hash) {
        return refusal('unknown_ref', [{ logical_id: ref.logical_id, content_hash: '' }],
          `${ref.logical_id}: no live version to compile.`);
      }
      const ko = this.#store.get(hash) as KnowledgeObject | undefined;
      if (!ko) {
        return refusal('unknown_ref', [{ logical_id: ref.logical_id, content_hash: hash }],
          `${ref.logical_id}: version ${hash.slice(0, 8)} is not in the store.`);
      }
      resolved.push({ logical_id: ref.logical_id, hash, ko });
    }

    // 2. Refusal gates, in order (contested → stale → encoding). Compute the whole
    //    refusal before building or storing anything (a refusal persists nothing).
    const contested = resolved.filter((r) => this.#knowledge.effectiveStatus(r.logical_id) === 'contested');
    if (contested.length > 0) {
      return refusal('contested_knowledge', contested.map((r) => refOf(r)),
        `${contested.map((r) => r.logical_id).join(', ')}: contested knowledge never compiles — resolve the dispute first.`);
    }

    const stale = resolved.filter((r) => {
      const s = this.#knowledge.effectiveStatus(r.logical_id);
      return s === 'stale' || s === 'superseded';
    });
    if (stale.length > 0) {
      return refusal('stale_input', stale.map((r) => refOf(r)),
        `${stale.map((r) => r.logical_id).join(', ')}: input is stale — recompiling requires an explicit re-validation or supersession.`);
    }

    for (const r of resolved) {
      const enc = checkEncoding(r.ko);
      if (enc) return { ...enc, offending: [refOf(r)] }; // enrich with the resolved hash
    }

    // 3. Partition: firewall scenario_weight (never a channel/edge); skip answer-absent
    //    open questions (nothing to compile); the rest are consumed into channels.
    const consumable = resolved.filter(
      (r) => mayCompileAsConstraintOrCost(r.ko) && r.ko.answer !== undefined,
    );

    // 4. Build the six sparse channels: per-channel default from config, then one
    //    RegionOverride per consumed object routed by the config subject map.
    const channels = new Map<ChannelKind, Channel>();
    for (const kind of CHANNEL_KINDS) {
      channels.set(kind, { name: kind, kind, default: this.#defaultFor(req.config, kind), regions: [] });
    }
    for (const r of consumable) {
      const { channel, region } = this.#route(req.config, r.ko.subject);
      const override: RegionOverride = { region, value: r.ko.answer as Band, source: r.logical_id };
      if (r.ko.validity) {
        override.from_step = r.ko.validity.valid_from;
        override.until_step = r.ko.validity.valid_until;
      }
      channels.get(channel)!.regions!.push(override);
    }

    // 5. Apply the scenario excursion as an overlay of RegionOverrides (folded into
    //    the stamp), keeping the scorer scenario-blind (DEC-10).
    let excursionOverrides: { channel: ChannelKind; region: string; override: Band }[] = [];
    if (req.scenario) {
      const coa = this.#loadCoa(req.scenario);
      if (!coa) {
        return refusal('unknown_ref', [{ logical_id: req.scenario, content_hash: '' }],
          `${req.scenario}: no such scenario to apply.`);
      }
      for (const ov of coa.excursion ?? []) {
        const region = ov.region;
        if (region === undefined) {
          throw new Error(`compile: excursion on ${req.scenario} for channel ${ov.channel} names no region (config defect).`);
        }
        if (!req.config.regions.some((g) => g.name === region)) {
          throw new Error(`compile: excursion region '${region}' (${req.scenario}) has no geometry in the config (fixture defect).`);
        }
        channels.get(ov.channel)!.regions!.push({ region, value: ov.override, source: req.scenario });
        excursionOverrides.push({ channel: ov.channel, region, override: ov.override });
      }
      excursionOverrides.sort(cmpExcursion);
    }

    // Sort each channel's region overrides deterministically so the stored world
    // is byte-identical regardless of input order (resolution of overlapping
    // windows stays a score-time concern — storage order is for determinism only).
    for (const kind of CHANNEL_KINDS) {
      channels.get(kind)!.regions!.sort(cmpRegion);
    }

    // 6. Consumed set + deterministic stamp (over inputs, sorted; not over cells).
    const consumed: ConsumedRef[] = consumable
      .map((r) => ({ logical_id: r.logical_id, content_hash: r.hash }))
      .sort((a, b) => cmpStr(a.logical_id, b.logical_id));

    const stampPayload: Record<string, unknown> = {
      consumed,
      config: req.config,
      engine_version: req.engine_version,
    };
    if (req.scenario) {
      stampPayload.scenario = req.scenario;
      stampPayload.excursion = excursionOverrides;
    }
    if (req.seed !== undefined) stampPayload.seed = req.seed;
    const stamp = await contentHash(stampPayload);

    // 7. Assemble and store the CompiledWorld (immutable, content-addressed).
    const world: CompiledWorld = {
      logical_id: `W-${req.scenario ?? 'BASE'}`,
      version: 1,
      grid: req.config.grid,
      channels: CHANNEL_KINDS.map((k) => channels.get(k)!),
      consumed,
      engine_version: req.engine_version,
      stamp,
    };
    if (req.scenario) world.scenario = req.scenario;

    const errors = validateInstance('CompiledWorld', world);
    if (errors.length > 0) {
      throw new Error(`compile produced an invalid CompiledWorld: ${errors.join('; ')}`);
    }

    const worldHash = await contentHash(world as unknown as Record<string, unknown>);
    const isNew = !this.#store.exists(worldHash);
    const worldRef = await this.#store.put(world as unknown as Record<string, unknown>);

    // 8. Edges: one compiled_into per consumed object; a waives per waiver. Written
    //    only when the world is newly built (recompiling an identical world is
    //    idempotent and duplicates no edges).
    if (isNew) {
      for (const r of consumable) {
        this.#trace.add(this.#edge(r.hash, worldHash, 'compiled_into'));
        if (r.ko.waiver) this.#trace.add(this.#edge(r.hash, worldHash, 'waives'));
      }
    }

    // 9. No delta (seam §4): a compile is a read-of-knowledge, not a knowledge write.
    return {
      world: worldRef,
      stamp,
      compiled_from: consumable.map((r) => ({ logical_id: r.logical_id, content_hash: r.hash })),
    };
  }

  #route(config: VignetteConfig, subject: string): { channel: ChannelKind; region: string } {
    const entry = config.subject_map.find((e) => e.subject === subject);
    if (!entry) {
      // A compilable subject the config maps to nothing is a fixture/config defect,
      // surfaced — never a silently dropped input (research note 02-compile.md).
      throw new Error(`compile: subject '${subject}' has no channel route in the config (config defect).`);
    }
    if (!config.regions.some((g) => g.name === entry.region)) {
      throw new Error(`compile: region '${entry.region}' (subject '${subject}') has no geometry in the config (config defect).`);
    }
    return { channel: entry.channel, region: entry.region };
  }

  #defaultFor(config: VignetteConfig, kind: ChannelKind): Band {
    const def = config.channels.find((c) => c.kind === kind);
    if (!def) throw new Error(`compile: config has no default for channel '${kind}'.`);
    return def.default;
  }

  #loadCoa(id: string): ScenarioCOA | undefined {
    const hash = this.#latestHash(id);
    if (!hash) return undefined;
    return this.#store.get(hash) as ScenarioCOA | undefined;
  }

  #latestHash(id: string): string | undefined {
    const versions = this.#store.versions(id);
    return versions.length > 0 ? versions[versions.length - 1]!.content_hash : undefined;
  }

  #edge(from: string, to: string, edge_type: TraceEdge['edge_type']): TraceEdge {
    return { from_hash: from, to_hash: to, edge_type, written_by: this.#writtenBy };
  }
}

const refOf = (r: Resolved): Ref => ({ logical_id: r.logical_id, content_hash: r.hash });

const refusal = (reason: Refusal['reason'], offending: Ref[], explanation: string): Refusal => ({
  refused: true,
  reason,
  offending,
  explanation,
});

const cmpStr = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

const cmpExcursion = (
  a: { channel: string; region: string },
  b: { channel: string; region: string },
): number => cmpStr(a.channel, b.channel) || cmpStr(a.region, b.region);

const cmpRegion = (a: RegionOverride, b: RegionOverride): number =>
  cmpStr(a.region, b.region) ||
  (a.from_step ?? 0) - (b.from_step ?? 0) ||
  cmpStr(a.source ?? '', b.source ?? '');
