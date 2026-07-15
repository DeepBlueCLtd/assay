/**
 * SPEC-19 — grid→viewport projection and route/region hit-geometry (research
 * note `10-spatial-temporal.md`).
 *
 * Pure functions, no DOM, no state, no services: the spatial substrate the
 * coaMap/coaTimeline renderers project. Every predicate here mirrors the
 * shipped scoring semantics exactly — `cellInRegion` is `materialise.ts`'s
 * inclusive containment, `legRegions` tests the leg's WAYPOINT cell (the cell
 * `metrics.ts` reads `channelAt` at), and `exposureProfile` replays the
 * exposure metric leg by leg so the rendered staircase is the C4 number, not a
 * lookalike. Nothing here invents geometry (DEC-4): regions come from the
 * `VignetteConfig` boxes, routes from the plan's stated legs (DEC-20).
 */
import type {
  Band,
  ChannelKind,
  CompiledWorld,
  GridSpec,
  Plan,
  RegionGeometry,
  RegionOverride,
  RouteLeg,
  VignetteConfig,
} from './generated/types.js';
import { channelAt } from './materialise.js';

// ---- projection -------------------------------------------------------------

export interface Viewport {
  /** Pixel width of the drawable map area (height derives from the grid aspect). */
  width: number;
  /** Padding in pixels around the grid on every side. */
  pad?: number;
}

export interface Projection {
  /** Pixels per grid cell. */
  cell: number;
  pad: number;
  width: number;
  height: number;
  /** Left pixel edge of grid column x. */
  px: (x: number) => number;
  /** Top pixel edge of grid row y (row 0 renders at the top). */
  py: (y: number) => number;
  /** Pixel centre of cell (x, y). */
  cx: (x: number) => number;
  cy: (y: number) => number;
}

/** A uniform grid→viewport projection: cells stay square, row 0 at the top. */
export function makeProjection(grid: GridSpec, vp: Viewport): Projection {
  const pad = vp.pad ?? 0;
  const cell = (vp.width - 2 * pad) / grid.cols;
  return {
    cell,
    pad,
    width: vp.width,
    height: grid.rows * cell + 2 * pad,
    px: (x) => pad + x * cell,
    py: (y) => pad + y * cell,
    cx: (x) => pad + (x + 0.5) * cell,
    cy: (y) => pad + (y + 0.5) * cell,
  };
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** A region's pixel rectangle. Boxes are inclusive cell ranges (x0..x1, y0..y1). */
export function regionRect(g: RegionGeometry, p: Projection): Rect {
  return {
    x: p.px(g.x0),
    y: p.py(g.y0),
    w: (g.x1 - g.x0 + 1) * p.cell,
    h: (g.y1 - g.y0 + 1) * p.cell,
  };
}

/** Invert the projection: pixel → grid cell (clamped to the grid). */
export function cellAtPixel(grid: GridSpec, p: Projection, pixelX: number, pixelY: number): { x: number; y: number } {
  const clamp = (v: number, max: number): number => Math.max(0, Math.min(max, Math.floor(v)));
  return {
    x: clamp((pixelX - p.pad) / p.cell, grid.cols - 1),
    y: clamp((pixelY - p.pad) / p.cell, grid.rows - 1),
  };
}

// ---- hit-geometry (mirrors materialise.ts / metrics.ts semantics) -----------

/** Inclusive containment — the same predicate `materialise.ts` resolves overrides with. */
export function cellInRegion(g: RegionGeometry, x: number, y: number): boolean {
  return x >= g.x0 && x <= g.x1 && y >= g.y0 && y <= g.y1;
}

export function regionByName(config: VignetteConfig, name: string): RegionGeometry {
  const g = config.regions.find((r) => r.name === name);
  if (!g) throw new Error(`mapProject: region '${name}' has no geometry in the config (fixture defect)`);
  return g;
}

/** Every named region containing cell (x, y). */
export function regionsContaining(config: VignetteConfig, x: number, y: number): RegionGeometry[] {
  return config.regions.filter((g) => cellInRegion(g, x, y));
}

/** The regions a leg's WAYPOINT cell sits in — the cell the exposure metric reads. */
export function legRegions(config: VignetteConfig, leg: RouteLeg): string[] {
  return regionsContaining(config, leg.x, leg.y).map((g) => g.name);
}

/** Does any leg of this route put its waypoint cell inside the named region? */
export function routeEnters(config: VignetteConfig, route: RouteLeg[], region: string): boolean {
  const g = regionByName(config, region);
  return route.some((leg) => cellInRegion(g, leg.x, leg.y));
}

/** A leg occupies [enter_step, exit_step): active while the element dwells at its waypoint. */
export function legActiveAt(leg: RouteLeg, t: number): boolean {
  return t >= leg.enter_step && t < leg.exit_step;
}

/** A time-boxed override is active at t — `materialise.ts`'s window predicate verbatim. */
export function overrideActiveAt(o: Pick<RegionOverride, 'from_step' | 'until_step'>, t: number): boolean {
  return (o.from_step === undefined || t >= o.from_step) && (o.until_step === undefined || t <= o.until_step);
}

/**
 * A stated day window → the grid's step window (e.g. K9's "peaking D+5–D+7"
 * at 6 h/step ⇒ steps 20–28). The conversion is arithmetic on the grid spec;
 * WHAT is converted must be a quoted, attributed statement (note 10 §3.3).
 */
export function dayWindowToSteps(fromDay: number, toDay: number, timestepHours: number): { from_step: number; until_step: number } {
  const perDay = 24 / timestepHours;
  return { from_step: fromDay * perDay, until_step: toDay * perDay };
}

// ---- the exposure profile (the metric replayed leg by leg) -------------------

export interface ProfilePoint {
  legIndex: number;
  x: number;
  y: number;
  enter_step: number;
  exit_step: number;
  /** Regions the waypoint cell sits in (the geometric reason the band was/wasn't read). */
  regions: string[];
  /** This leg's banked exposure — channel band at the waypoint × dwell hours. */
  leg: Band;
  /** Cumulative exposure band after this leg — the staircase riser's top. */
  cum: Band;
}

/**
 * The banded exposure a plan element accumulates leg by leg — exactly
 * `metrics.ts`'s exposure sum (band at `(x, y, enter_step)` × dwell hours),
 * kept per-leg so a verdict becomes legible as WHERE and WHEN the dwell was
 * banked. The final `cum` equals `evaluateMetric`'s exposure band; a quiet leg
 * carries the honest `[0, 0]`, never a gap.
 */
export function exposureProfile(
  plan: Plan,
  element: string,
  world: CompiledWorld,
  config: VignetteConfig,
  channel: ChannelKind,
  unit: string,
): ProfilePoint[] {
  const ep = plan.elements.find((e) => e.force_element === element);
  const legs = ep?.route ?? [];
  const dwellHours = config.grid.timestep_hours;
  const points: ProfilePoint[] = [];
  let acc: Band = { lo: 0, hi: 0, unit };
  legs.forEach((leg, i) => {
    const dwell = (leg.exit_step - leg.enter_step) * dwellHours;
    const val = channelAt(world, config, channel, leg.x, leg.y, leg.enter_step);
    const banked: Band = { lo: val.lo * dwell, hi: val.hi * dwell, unit };
    acc = { lo: acc.lo + banked.lo, hi: acc.hi + banked.hi, unit };
    points.push({
      legIndex: i,
      x: leg.x,
      y: leg.y,
      enter_step: leg.enter_step,
      exit_step: leg.exit_step,
      regions: legRegions(config, leg),
      leg: banked,
      cum: { ...acc },
    });
  });
  return points;
}
