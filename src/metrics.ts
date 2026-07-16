/**
 * SPEC-07 — the metric registry (research note `03-score-plan.md` §2).
 *
 * A metric turns a plan + compiled world into a banded quantity, by evaluating
 * the plan's STATED routes (DEC-20) over the sparse world by `(cell, time)`
 * resolution — never by searching, never by building a time-expanded graph. The
 * families are exactly what the Meridian commitments C1–C6 need:
 *
 *   - reach-step  (strait_open_step / port_open_step / extraction_step)
 *       = start + Σ leg durations, a leg's duration = nominal steps ÷ its banded
 *         mobility factor. A zero-mobility leg (R3's demolished causeway) severs
 *         the route — surfaced as a `violated` reach, never an Infinity.
 *   - exposure    (threat_exposure)
 *       = Σ over the element's legs of channel band × dwell, scoped to the element.
 *   - fires       (civil_harm_exposure)
 *       = count of the fires element's legs inside the scoped district (bands stay
 *         bands, but a route decision is a count).
 *   - state       (causeway_intact)
 *       = a banded read of a channel/region at the horizon.
 *
 * Every propagation is interval arithmetic on pure bands (`src/interval.ts`); no
 * mean/mid/most-likely operation appears (DEC-15). The abstract oracle metric
 * (O-1) is pure `src/interval.ts` and lives in the oracle test, not here.
 */
import type { Band, ChannelKind, CompiledWorld, Plan, VignetteConfig } from './generated/types.js';
import { channelAt } from './materialise.js';
import * as I from './interval.js';

/** A metric is either a band or a severed route (an unreachable objective). */
export type MetricResult = { band: Band } | { severed: true };

export function isSevered(r: MetricResult): r is { severed: true } {
  return (r as { severed?: true }).severed === true;
}

interface MetricSpec {
  kind: 'reach' | 'exposure' | 'fires' | 'state';
  /** Fixed responsible element; when absent the commitment `scope` names it. */
  element?: string;
  channel?: ChannelKind;
  /** Fixed region; when absent the commitment `scope` names it. */
  region?: string;
}

const METRICS: Record<string, MetricSpec> = {
  strait_open_step: { kind: 'reach', element: 'FE-BROOM' },
  port_open_step: { kind: 'reach', element: 'FE-PACKHORSE' },
  extraction_step: { kind: 'reach', element: 'FE-KINGFISHER' },
  threat_exposure: { kind: 'exposure', channel: 'threat' }, // element from scope (FE-ANVIL)
  civil_harm_exposure: { kind: 'fires', element: 'FE-FALCON' }, // region from scope (port_district)
  causeway_intact: { kind: 'state', channel: 'mobility', region: 'causeway' },
};

interface Commitmentish {
  metric: string;
  unit: string;
  scope?: string;
}

/**
 * SPEC-24 — the registry projected for the DSM's commit-step derivation
 * (research note 12 §3). Names the responsible element whose stated route the
 * commit step is read from, and the channel the metric reads along it (reach ⇒
 * mobility — the factor in the duration arithmetic; exposure ⇒ its channel).
 * `fires` reads only the plan's own geometry (no channel — it cannot
 * scenario-diverge); `state` has no route (world-decided).
 */
export interface MetricProfile {
  kind: 'reach' | 'exposure' | 'fires' | 'state';
  element?: string;
  channel?: ChannelKind;
}

export function metricProfile(commitment: Pick<Commitmentish, 'metric' | 'scope'>): MetricProfile {
  const spec = METRICS[commitment.metric];
  if (!spec) {
    throw new Error(`metrics: no evaluator for metric '${commitment.metric}' (fixture/spec defect)`);
  }
  switch (spec.kind) {
    case 'reach':
      return { kind: 'reach', element: spec.element!, channel: 'mobility' };
    case 'exposure':
      return { kind: 'exposure', element: commitment.scope ?? spec.element!, channel: spec.channel! };
    case 'fires':
      return { kind: 'fires', element: spec.element! };
    case 'state':
      return { kind: 'state' };
  }
}

/** Evaluate a commitment's metric over a plan and world. Unit = the commitment's. */
export function evaluateMetric(
  commitment: Commitmentish,
  plan: Plan,
  world: CompiledWorld,
  config: VignetteConfig,
): MetricResult {
  const spec = METRICS[commitment.metric];
  if (!spec) {
    throw new Error(`metrics: no evaluator for metric '${commitment.metric}' (fixture/spec defect)`);
  }
  const unit = commitment.unit;
  switch (spec.kind) {
    case 'reach':
      return reach(plan, world, config, spec.element!, unit);
    case 'exposure':
      return { band: exposure(plan, world, config, commitment.scope ?? spec.element!, spec.channel!, unit) };
    case 'fires':
      return { band: fires(plan, spec.element!, commitment.scope ?? spec.region!, config, unit) };
    case 'state':
      return { band: state(world, config, spec.channel!, spec.region!, unit) };
  }
}

/** start + Σ leg durations; a zero-mobility leg severs the route. */
function reach(plan: Plan, world: CompiledWorld, config: VignetteConfig, element: string, unit: string): MetricResult {
  const ep = plan.elements.find((e) => e.force_element === element);
  const legs = ep?.route ?? [];
  if (legs.length === 0) {
    throw new Error(`metrics: reach metric needs a route for ${element} (fixture defect)`);
  }
  const durations: Band[] = [];
  for (const leg of legs) {
    const nominal = leg.exit_step - leg.enter_step; // plan's intended steps (fact-of-intent)
    const factor = channelAt(world, config, 'mobility', leg.x, leg.y, leg.enter_step);
    if (factor.lo <= 0) return { severed: true }; // 1/0 — the route is cut
    // duration = nominal ÷ factor; factor [flo,fhi] (flo>0) ⇒ inverse [1/fhi, 1/flo]
    durations.push({ lo: nominal / factor.hi, hi: nominal / factor.lo, unit });
  }
  const start = I.scalar(legs[0]!.enter_step, unit);
  return { band: I.add(start, I.sum(durations, unit)) };
}

/** Σ over the element's legs of channel band × dwell-hours. */
function exposure(plan: Plan, world: CompiledWorld, config: VignetteConfig, element: string, channel: ChannelKind, unit: string): Band {
  const ep = plan.elements.find((e) => e.force_element === element);
  const legs = ep?.route ?? [];
  const dwellHours = config.grid.timestep_hours;
  let acc: Band = { lo: 0, hi: 0, unit };
  for (const leg of legs) {
    const dwell = (leg.exit_step - leg.enter_step) * dwellHours;
    const val = channelAt(world, config, channel, leg.x, leg.y, leg.enter_step);
    acc = { lo: acc.lo + val.lo * dwell, hi: acc.hi + val.hi * dwell, unit };
  }
  return acc;
}

/** Count of the fires element's legs inside the scoped region (a route decision). */
function fires(plan: Plan, element: string, region: string, config: VignetteConfig, unit: string): Band {
  const ep = plan.elements.find((e) => e.force_element === element);
  const legs = ep?.route ?? [];
  const g = config.regions.find((r) => r.name === region);
  if (!g) throw new Error(`metrics: fires region '${region}' has no geometry (fixture defect)`);
  let count = 0;
  for (const leg of legs) {
    if (leg.x >= g.x0 && leg.x <= g.x1 && leg.y >= g.y0 && leg.y <= g.y1) count += 1;
  }
  return { lo: count, hi: count, unit };
}

/** Banded boolean read of a channel/region at the horizon (intact ⟺ value > 0). */
function state(world: CompiledWorld, config: VignetteConfig, channel: ChannelKind, region: string, unit: string): Band {
  const g = config.regions.find((r) => r.name === region);
  if (!g) throw new Error(`metrics: state region '${region}' has no geometry (fixture defect)`);
  const cx = Math.floor((g.x0 + g.x1) / 2);
  const cy = Math.floor((g.y0 + g.y1) / 2);
  const val = channelAt(world, config, channel, cx, cy, config.grid.horizon_steps);
  return { lo: val.lo > 0 ? 1 : 0, hi: val.hi > 0 ? 1 : 0, unit };
}
