/**
 * SPEC-07 — score-time channel materialisation (research note `03-score-plan.md` §2).
 *
 * The compile stores channels SPARSE — a default plus named, optionally
 * time-boxed region overrides (research note `02-compile.md`). When the scorer
 * needs `channel(x, y, t)` it resolves, for that cell and timestep, the active
 * overrides in LAYERED precedence (note 02 §6, SPEC-20): an excursion-layer
 * override — one the compile applied from the ScenarioCOA's `excursion`
 * (DEC-8), recognisable because its `source` names the world's `scenario` —
 * beats any base-knowledge-derived override; within a layer the documented tie
 * order holds (later `from_step` wins, then the innermost region — note 02 §3);
 * absent any active override, the channel default. This is a pure function of
 * `(sparse channels, config geometry)`: it produces no stored object, writes no
 * edge, and participates in no content addressing. Nothing dense is ever
 * persisted or hashed — the 60×60×56 world note 02 retired is never built.
 */
import type { Band, ChannelKind, CompiledWorld, RegionOverride, VignetteConfig } from './generated/types.js';

const area = (config: VignetteConfig, region: string): number => {
  const g = config.regions.find((r) => r.name === region);
  if (!g) throw new Error(`materialise: region '${region}' has no geometry in the config (fixture defect)`);
  return (g.x1 - g.x0 + 1) * (g.y1 - g.y0 + 1);
};

const containsCell = (config: VignetteConfig, region: string, x: number, y: number): boolean => {
  const g = config.regions.find((r) => r.name === region);
  if (!g) throw new Error(`materialise: region '${region}' has no geometry in the config (fixture defect)`);
  return x >= g.x0 && x <= g.x1 && y >= g.y0 && y <= g.y1;
};

const activeAt = (o: RegionOverride, t: number): boolean =>
  (o.from_step === undefined || t >= o.from_step) && (o.until_step === undefined || t <= o.until_step);

/**
 * An override belongs to the excursion layer iff its `source` names the world's
 * scenario — the compile writes excursion overrides with `source = scenario`
 * (DEC-8) and base overrides with `source = <knowledge id>` (G3), so the layer
 * is derived from data the world already carries, never stored (note 02 §6).
 */
const isExcursion = (world: CompiledWorld, o: RegionOverride): boolean =>
  world.scenario !== undefined && o.source === world.scenario;

/**
 * The banded value of `kind` at cell (x,y) and timestep t. Overlap resolves in
 * layered precedence (note 02 §6): excursion-layer overrides beat base-layer
 * ones; within a layer, later `from_step` first, then the geometrically smaller
 * (innermost) region. Absent any active override, the channel's quiet default
 * (itself banded — the source is assessed).
 */
export function channelAt(
  world: CompiledWorld,
  config: VignetteConfig,
  kind: ChannelKind,
  x: number,
  y: number,
  t: number,
): Band {
  const channel = world.channels.find((c) => c.kind === kind);
  if (!channel) throw new Error(`materialise: world has no '${kind}' channel`);
  const active = (channel.regions ?? []).filter(
    (o) => activeAt(o, t) && containsCell(config, o.region, x, y),
  );
  if (active.length === 0) return channel.default;
  const excursion = active.filter((o) => isExcursion(world, o));
  const candidates = excursion.length > 0 ? excursion : active;
  candidates.sort(
    (a, b) => (b.from_step ?? 0) - (a.from_step ?? 0) || area(config, a.region) - area(config, b.region),
  );
  return candidates[0]!.value;
}
