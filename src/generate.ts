/**
 * SPEC-08 — the seeded, strategy-biased plan generator (research note
 * `03-score-plan.md` §5.2).
 *
 * Candidates are a deterministic fan-out over the vignette's OWN four axes —
 * REMIT's time/exposure/robustness/completeness axes "do not transfer
 * unexamined" (concept §6.2), so these are read off Meridian's C1–C6 and force
 * elements:
 *
 *   1. approach       — strait-early vs sweep-first  (trades C2 strait ↔ C1 port)
 *   2. suppression    — fires-forward vs stand-off   (trades C4 threat ↔ C3 civil)
 *   3. causeway       — contest intact vs bypass by sea
 *   4. extraction     — KINGFISHER pull-out early vs mission-tail
 *
 * Each axis is binary, so the fan-out is 2⁴ = 16 candidate `Plan`s (DEC-20:
 * timed routes for the five force elements, nothing richer). The generator is a
 * PURE function of `(config, seed)` — no PRNG, no wall clock — so the same seed
 * yields the same candidates; the seed only orders the enumeration and breaks
 * ties in the organiser's diversity cap (`src/handful.ts`). It scores nothing and
 * organises nothing: it hands honest candidates to the scorer, and the organiser
 * decides which survive. Route geometry is fixture-authoring latitude within the
 * vignette's constraints (§8); the axis→route mapping is documented cell-by-cell
 * below so a reviewer can walk any leg back to the axis that set it.
 */
import type { ElementPlan, Plan, RouteLeg, VignetteConfig } from './generated/types.js';

export type Approach = 'strait_early' | 'sweep_first';
export type Suppression = 'fires_forward' | 'stand_off';
export type Causeway = 'contest' | 'bypass';
export type Extraction = 'pull_early' | 'mission_tail';

export interface AxisSignature {
  approach: Approach;
  suppression: Suppression;
  causeway: Causeway;
  extraction: Extraction;
}

/** The four binary axes, in canonical enumeration order. */
export const AXES = {
  approach: ['strait_early', 'sweep_first'] as Approach[],
  suppression: ['fires_forward', 'stand_off'] as Suppression[],
  causeway: ['contest', 'bypass'] as Causeway[],
  extraction: ['pull_early', 'mission_tail'] as Extraction[],
};

/** Two-letter axis codes → the `P*` logical id (vignette §8 frozen family). */
const CODE = {
  strait_early: 'Se', sweep_first: 'Sw',
  fires_forward: 'Ff', stand_off: 'So',
  contest: 'Cc', bypass: 'Cb',
  pull_early: 'Xe', mission_tail: 'Xt',
} as const;

const PHRASE = {
  strait_early: 'strait-early', sweep_first: 'sweep-first',
  fires_forward: 'fires-forward', stand_off: 'stand-off',
  contest: 'contest', bypass: 'bypass',
  pull_early: 'pull-early', mission_tail: 'mission-tail',
} as const;

export const signatureId = (s: AxisSignature): string =>
  `P-${CODE[s.approach]}${CODE[s.suppression]}${CODE[s.causeway]}${CODE[s.extraction]}`;

export const signatureName = (s: AxisSignature): string =>
  `${PHRASE[s.approach]} · ${PHRASE[s.suppression]} · ${PHRASE[s.causeway]} · ${PHRASE[s.extraction]}`;

const leg = (x: number, y: number, enter: number, exit: number): RouteLeg => ({
  x, y, enter_step: enter, exit_step: exit,
});

/**
 * FE-BROOM sweeps the strait — the C2 clock. `strait_early` rushes a direct pass
 * (fast C2); `sweep_first` does a thorough approach pass then the strait (C2 later
 * but clean, the thesis-C robustness posture). All cells avoid the banded-mobility
 * approach/causeway regions, so C2 is a clean point band.
 */
function broom(a: Approach): ElementPlan {
  const route = a === 'strait_early'
    ? [leg(30, 50, 0, 3), leg(26, 25, 3, 20)] // strait_open = 0 + 3 + 17 = 20
    : [leg(30, 50, 0, 2), leg(24, 26, 2, 9), leg(26, 25, 9, 26)]; // = 0 + 2 + 7 + 17 = 26
  return { force_element: 'FE-BROOM', route };
}

/**
 * FE-PACKHORSE is the relief payload — the C1 clock. `approach` trades it against
 * C2: rushing the strait (strait_early) sends PACKHORSE in behind an unfinished
 * sweep, so it berths later (higher C1); sweep-first lets it run clean and berth
 * earlier. `causeway` sets the route: `contest` takes the direct Ledger crossing,
 * `bypass` the longer sea route (12 steps slower), so contest strictly beats
 * bypass on C1, all else equal. Cells avoid the banded-mobility regions, so the
 * reach is a clean point band (the banded channels are exercised on C4 below).
 */
function packhorse(a: Approach, c: Causeway): ElementPlan {
  const berth = a === 'strait_early' ? 36 : 24; // strait_early berths later (higher C1)
  const route = c === 'contest'
    ? [leg(30, 50, 0, 4), leg(26, 32, 4, berth)] // direct crossing: port_open = berth
    : [leg(30, 50, 0, 4), leg(44, 44, 4, 16), leg(26, 32, 16, berth + 12)]; // by sea, +12
  return { force_element: 'FE-PACKHORSE', route };
}

/**
 * FE-ANVIL's threat exposure is C4 — the INVERSE of the suppression choice:
 * `fires_forward` means FALCON has suppressed the threat, so ANVIL transits a
 * clean cell (26,32) (zero threat ⇒ C4 robust); `stand_off` leaves the threat up,
 * so ANVIL must cross the FAC waters cell (32,22) (threat [2,6] ⇒ C4 exposed/tight).
 */
function anvil(s: Suppression): ElementPlan {
  const route = s === 'fires_forward'
    ? [leg(30, 50, 0, 8), leg(26, 32, 8, 10)] // clean cell — exposure [0,0]
    : [leg(30, 50, 0, 7), leg(32, 22, 7, 8)]; // FAC waters — one step in threat [2,6]
  return { force_element: 'FE-ANVIL', route };
}

/**
 * FE-FALCON's fires decide C3: `fires_forward` puts a leg into the populated port
 * district cell (26,32) (a fire in the district ⇒ C3 violated — civil harm);
 * `stand_off` keeps FALCON at the Carrick battery standoff (48,15) outside the
 * district (no fires ⇒ C3 marginal). This is the C3↔C4 trade the suppression axis
 * carries: fires forward buys ANVIL safety at a civil-harm cost, and vice versa.
 */
function falcon(s: Suppression): ElementPlan {
  const route = s === 'fires_forward'
    ? [leg(30, 50, 0, 4), leg(26, 32, 4, 8)] // inside port_district ⇒ C3 fire
    : [leg(30, 50, 0, 4), leg(48, 15, 4, 10)]; // battery standoff, outside district
  return { force_element: 'FE-FALCON', route };
}

/**
 * DET KINGFISHER's extraction is C6: `pull_early` extracts by step 38 (C6 robust
 * with room); `mission_tail` keeps it in until step 46 (C6 robust but tight). Pull
 * early is strictly better on C6, all else equal — mission-tail's collection value
 * (K11) is not a scored criterion here, so on the honest matrix it is dominated.
 */
function kingfisher(x: Extraction): ElementPlan {
  const route = x === 'pull_early'
    ? [leg(48, 15, 0, 4), leg(30, 50, 4, 38)] // extraction_step = 0 + 4 + 34 = 38
    : [leg(48, 15, 0, 8), leg(30, 50, 8, 46)]; // = 0 + 8 + 38 = 46
  return { force_element: 'FE-KINGFISHER', route };
}

/** Build one candidate `Plan` from an axis signature (DEC-20 shape). */
export function planFor(sig: AxisSignature, seed: number): Plan {
  return {
    logical_id: signatureId(sig),
    version: 1,
    name: signatureName(sig),
    seed,
    generator: 'spec-08 axis fan-out (approach × suppression × causeway × extraction)',
    elements: [
      broom(sig.approach),
      packhorse(sig.approach, sig.causeway),
      anvil(sig.suppression),
      falcon(sig.suppression),
      kingfisher(sig.extraction),
    ],
  };
}

/** All 16 axis signatures, in canonical enumeration order. */
export function allSignatures(): AxisSignature[] {
  const out: AxisSignature[] = [];
  for (const approach of AXES.approach)
    for (const suppression of AXES.suppression)
      for (const causeway of AXES.causeway)
        for (const extraction of AXES.extraction)
          out.push({ approach, suppression, causeway, extraction });
  return out;
}

/**
 * The strategy-biased fan-out: one candidate `Plan` per axis signature. The seed
 * is stamped onto each plan and (in the organiser) orders the diversity cap; the
 * candidate SET is seed-independent — the organiser, not the generator, decides
 * the handful, so generation stays honest fan-out rather than cherry-picking.
 */
export function generateCandidates(_config: VignetteConfig, seed: number): Plan[] {
  return allSignatures().map((sig) => planFor(sig, seed));
}
