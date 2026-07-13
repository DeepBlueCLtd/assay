/**
 * SPEC-07 — score-time channel materialisation (research note `03-score-plan.md` §2).
 *
 * The compile stores channels SPARSE — a default plus named, optionally
 * time-boxed region overrides (research note `02-compile.md`). When the scorer
 * needs `channel(x, y, t)` it resolves, for that cell and timestep, the innermost
 * active `RegionOverride` (later `from_step` wins on overlap — note 02 §3's
 * documented tie order), else the channel default. This is a pure function of
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
 * The banded value of `kind` at cell (x,y) and timestep t. Overlap resolves
 * innermost-wins with a documented tie order: later `from_step` first, then the
 * geometrically smaller (innermost) region. Absent any active override, the
 * channel's quiet default (itself banded — the source is assessed).
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
  const candidates = (channel.regions ?? []).filter(
    (o) => activeAt(o, t) && containsCell(config, o.region, x, y),
  );
  if (candidates.length === 0) return channel.default;
  candidates.sort(
    (a, b) => (b.from_step ?? 0) - (a.from_step ?? 0) || area(config, a.region) - area(config, b.region),
  );
  return candidates[0]!.value;
}
