/**
 * The engine version folded into every stamp (seam contract §1, G1).
 *
 * Bump this whenever engine BEHAVIOUR changes over identical inputs, so
 * recompiled artefacts carry new stamps and old stamps stay honest about what
 * computed them. History:
 *
 *   0.1.0  Stages 0–7 (SPEC-01…19).
 *   0.2.0  SPEC-20 — compile-overlay precedence: channel materialisation
 *          resolves overlapping RegionOverrides by LAYER before geometry
 *          (excursion beats base) — research note 02-compile.md §6.
 */
export const ENGINE_VERSION = '0.2.0';
