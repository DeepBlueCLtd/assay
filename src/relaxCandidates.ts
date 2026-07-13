/**
 * SPEC-09 — the R3m-responsive relaxation candidate set (research note
 * `04-relaxation.md` §3–4).
 *
 * `/relax` needs candidates that actually ENTER the mined water — otherwise the
 * mining conflict never surfaces. The SPEC-08 BASE generator (`src/generate.ts`)
 * deliberately routes clear of the banded regions so BASE reaches stay clean, so
 * scored against R3m it barely moves. So SPEC-09 authors a small set of plans
 * whose routes DO engage the R3m excursion (mined `halcyon_strait`) and time the
 * sweep against C2. This is route-geometry latitude within the vignette's
 * constraints (§8) — the candidate *geometry* is authored, but the *sacrifices are
 * computed* by the reused SPEC-07 scorer, never by this author (DEC-10).
 *
 * The postures are read off the vignette §6 conflict (C2/C3/C4 unsatisfiable under
 * R3m). Each axis is mapped cell-by-cell so a reviewer can walk any leg to the
 * posture that set it, exactly as `generate.ts` documents its own:
 *
 *   - BROOM (C2, strait_open_step) — FAST parallel pass (reach 22 ≤ 28, C2 met) vs
 *     SLOW sequential sweep (reach 34 > 28, C2 late). Mobility is 1 on both routes,
 *     so C2 is the plan's own timing, not the channel — the honest reading of
 *     "sweeping sequentially and safely opens the strait at D+9" (vignette §6).
 *   - ANVIL (C4, threat_exposure) — CLEAN cell (threat 0 ⇒ exposure [0,0]) vs
 *     five steps in the mined `halcyon_strait` (R3m threat [0.5,0.9], dwell 30 h ⇒
 *     exposure [15,27] > the 12 band-hour ceiling ⇒ C4 violated).
 *   - FALCON (C3, civil_harm_exposure) — STAND-OFF at the Carrick battery (no fires
 *     in the district ⇒ C3 marginal) vs FIRES into the populated port district
 *     (one leg inside ⇒ count 1 > 0 ⇒ C3 violated).
 *   - PACKHORSE (C1) and KINGFISHER (C6) are CONSTANT across candidates and kept
 *     comfortably satisfied — they are not the R3m trade, so they never distinguish.
 *
 * The five candidates are the three minimal postures (parallel/fires/sequential)
 * plus two that give up MORE (parallel+fires, sequential+exposed) so the service's
 * inclusion-minimality is exercised on real, scored supersets — not just asserted.
 */
import type { ElementPlan, Plan, RouteLeg } from './generated/types.js';

const leg = (x: number, y: number, enter: number, exit: number): RouteLeg => ({
  x, y, enter_step: enter, exit_step: exit,
});
const el = (fe: string, route: RouteLeg[]): ElementPlan => ({ force_element: fe, route });

// FE-BROOM — the C2 clock (strait_open_step). Mobility 1 on both, so reach = timing.
const broomFast = el('FE-BROOM', [leg(30, 50, 0, 3), leg(26, 25, 3, 22)]); // strait_open = 22 ≤ 28
const broomSlow = el('FE-BROOM', [leg(30, 50, 0, 4), leg(24, 26, 4, 16), leg(30, 25, 16, 34)]); // = 34 > 28

// FE-ANVIL — C4 (threat_exposure). Clean cell vs five steps in the mined strait.
const anvilClean = el('FE-ANVIL', [leg(30, 50, 0, 8), leg(26, 32, 8, 10)]); // threat 0 ⇒ exposure [0,0]
const anvilExposed = el('FE-ANVIL', [leg(30, 50, 0, 8), leg(26, 25, 8, 13)]); // mined strait, dwell 30h ⇒ [15,27]

// FE-FALCON — C3 (civil_harm_exposure). Battery stand-off vs a fire in the district.
const falconStandoff = el('FE-FALCON', [leg(30, 50, 0, 4), leg(48, 15, 4, 10)]); // no district leg ⇒ C3 marginal
const falconFires = el('FE-FALCON', [leg(30, 50, 0, 4), leg(26, 32, 4, 8)]); // inside port_district ⇒ C3 violated

// FE-PACKHORSE (C1) / FE-KINGFISHER (C6) — constant, comfortably satisfied.
const packFast = el('FE-PACKHORSE', [leg(30, 50, 0, 4), leg(26, 32, 4, 24)]); // port_open = 24 ≤ 40
const kingPull = el('FE-KINGFISHER', [leg(48, 15, 0, 4), leg(30, 50, 4, 38)]); // extraction = 38 ≤ 48

/** One posture: an id, its command-language narrative, and its five element plans. */
interface Posture {
  id: string;
  name: string;
  narrative: string;
  elements: ElementPlan[];
}

/**
 * The postures, in a fixed authored order. The `narrative` is command language
 * (the argument the commander reads); the *sacrifice* each implies is computed by
 * the scorer, not stated here. Narratives name the operational consequence in the
 * vignette §6 idiom, never a margin or a decimal (G2).
 */
const POSTURES: Posture[] = [
  {
    id: 'RX-parallel',
    name: 'parallel sweep',
    narrative:
      'Parallel sweep — both approaches cleared at once, fastest to open the strait, ' +
      'but the amphibious group crosses the mined strait before the battery and FACs are suppressed.',
    elements: [broomFast, anvilExposed, falconStandoff, packFast, kingPull],
  },
  {
    id: 'RX-fires',
    name: 'fires forward',
    narrative:
      'Fires forward — suppress the FAC berths so the group crosses clean and on time, ' +
      'but the fires fall into the populated harbourfront where the craft berth among the fishing fleet.',
    elements: [broomFast, anvilClean, falconFires, packFast, kingPull],
  },
  {
    id: 'RX-sequential',
    name: 'sequential sweep',
    narrative:
      'Sequential sweep — clear one approach then the other, keeping the group clear and the ' +
      'harbourfront quiet, but the strait opens at D+9, two days late.',
    elements: [broomSlow, anvilClean, falconStandoff, packFast, kingPull],
  },
  {
    id: 'RX-parallel-fires',
    name: 'parallel sweep with fires forward',
    narrative:
      'Parallel sweep with fires forward — fast and clean-crossing, but it both fires into the ' +
      'district and, on the parallel pass, still exposes the group.',
    elements: [broomFast, anvilExposed, falconFires, packFast, kingPull],
  },
  {
    id: 'RX-sequential-exposed',
    name: 'sequential sweep, group exposed',
    narrative:
      'Sequential sweep with the group pressed forward — the strait still opens two days late ' +
      'and the amphibious group is exposed in the mined water.',
    elements: [broomSlow, anvilExposed, falconStandoff, packFast, kingPull],
  },
];

const plan = (p: Posture, seed: number): Plan => ({
  logical_id: p.id,
  version: 1,
  name: p.name,
  seed,
  generator: 'spec-09 relaxation candidate set (R3m-responsive postures)',
  elements: p.elements,
});

/** The authored candidate plans for the R3m conflict, in fixed enumeration order. */
export function relaxCandidates(seed: number): Plan[] {
  return POSTURES.map((p) => plan(p, seed));
}

/** The command-language narrative for a candidate plan (by logical_id). */
export function narrativeFor(planId: string): string {
  return POSTURES.find((p) => p.id === planId)?.narrative ?? '';
}
