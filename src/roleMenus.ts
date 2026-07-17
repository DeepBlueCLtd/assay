/**
 * SPEC-25 US5 — per-role action menus: C2 role separation made legible
 * (research note `14-legibility.md` §6).
 *
 * The single source of truth for "who may do what": each tab's LEGAL write verbs,
 * from the walkthrough's role assignments. The shell arranges what the seam
 * already permits (DEC-33) — the menu adds no write surface, it re-presents
 * existing gated affordances and documents the legal set. Menus reorganise, never
 * restrict; the observer exposes NO write (the load-bearing assertion).
 *
 * Each verb is annotated by HOW it is exercised in this demonstrator, never faked
 * (DEC-4): `live` — a wired control on the surface; `auto` — run by the live
 * pipeline on every recompute (not a button); `deferred` — a legal verb not yet
 * built (labelled, never a dead button pretending to work). Register-neutral iff
 * pure re-arrangement (concept §6.31, flagged not asserted, DEC-2).
 */
import type { TabId } from './app/state.js';

export type VerbStatus = 'live' | 'auto' | 'deferred';

export interface RoleVerb {
  verb: string;
  /** One line: what the verb does, in role terms. */
  gloss: string;
  status: VerbStatus;
}

export interface RoleMenu {
  role: string;
  /** True for the cross-role Spatial surface — a surface, not a role (DEC-32). */
  surface?: boolean;
  /** Empty ⇒ read-only (observer); rendered as an explicit "no writes" statement. */
  verbs: RoleVerb[];
}

/**
 * The legal write set per tab (note §6). J-2 authors and disputes knowledge; the
 * planner runs the pipeline; the commander selects and waives; the observer only
 * watches. The Spatial surface is cross-role — its authoring inputs are
 * planner-class writes (they author new Plan versions), marked as such.
 */
export const ROLE_VERBS: Record<TabId, RoleMenu> = {
  j2: {
    role: 'J-2 (intelligence)',
    verbs: [
      { verb: 'create', gloss: 'author a new knowledge object (gated by the encoding firewall)', status: 'auto' },
      { verb: 'contest', gloss: 'dispute two irreconcilable answers — blocks compile until resolved (G5)', status: 'live' },
      { verb: 'resolve', gloss: 'lift a survivor from an open contest', status: 'live' },
      { verb: 'supersede', gloss: 'replace an assessed answer with a new immutable version (DEC-21)', status: 'live' },
      { verb: 'collect-mark', gloss: 'task collection against an open question — a human act with its own C6 consequences (KINGFISHER discipline)', status: 'deferred' },
    ],
  },
  planner: {
    role: 'J-3/5 (plans)',
    verbs: [
      { verb: 'compile', gloss: 'materialise the world from knowledge (refuses on contested — G5)', status: 'auto' },
      { verb: 'generate-handful', gloss: 'fan out a strategy-biased handful of distinct plans', status: 'auto' },
      { verb: 'score', gloss: 'run each plan through the scorer against the world', status: 'auto' },
      { verb: 'relax', gloss: 'turn an infeasible set into a least-worst frontier (G4)', status: 'auto' },
    ],
  },
  commander: {
    role: 'COMD',
    verbs: [
      { verb: 'select', gloss: 'commit to a plan (POST /select) — a human decision the system never makes for you', status: 'deferred' },
      { verb: 'waive', gloss: 'admit a value under an explicit, recorded waiver — the exception made visible, never laundered', status: 'deferred' },
    ],
  },
  observer: {
    role: 'OBSERVER / bridge',
    verbs: [], // read and trace only — the bridge watches the seam, it never touches it
  },
  coa: {
    role: 'ALL ROLES (surface)',
    surface: true,
    verbs: [
      { verb: 'move-waypoint', gloss: 'drag a route waypoint — authors a new Plan version (planner-class write), re-scored live (DEC-20/21)', status: 'live' },
      { verb: 'shift-window', gloss: 'shift a task window — authors a new Plan version; a planner-class write on the seam', status: 'deferred' },
      { verb: 'scrub', gloss: 'move the spatial clock — pure selection over the compiled world, no recompute (DEC-36c)', status: 'live' },
    ],
  },
};
