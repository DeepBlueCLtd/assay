/**
 * Stage 7 — the five demonstration narratives (concept §1, research note 09).
 *
 * Each narrative is a tab order + presenter notes over the same running app
 * (DEC-7: narratives are demo configurations, not builds; DEC-23: each
 * assembles the per-stage demo moments banked at Stages 1–6).
 *
 * Scripting principles (note 09 §4):
 *  1. Never narrate a midpoint.
 *  2. Never narrate a weighted sum.
 *  3. Use the verdict as a category, not a score.
 *  4. State the tie-break.
 *  5. Quote the doctrine at the moment it bites.
 */
import type { TabId } from './app/state.js';

export interface NarrativeBeat {
  tab: TabId;
  title: string;
  presenterNote: string;
  /** Doctrinal quotation to read at this moment (principle 5). */
  doctrinalQuote?: string;
  /** A scripted action the presenter performs on this beat. */
  action?: 'resolve' | 'edit-k8';
}

export interface Narrative {
  id: string;
  name: string;
  audience: string;
  leadTheses: string[];
  centrepiece: string;
  beats: NarrativeBeat[];
}

export const SCRIPTING_PRINCIPLES = [
  'Never narrate a midpoint — say "9 to 13 steps", not "about 11."',
  'Never narrate a weighted sum — describe the pattern of verdicts, not "plan X is better overall."',
  'Use the verdict as a category — "this commitment is tight", never "scores 2 out of 4."',
  'State the tie-break — same-tier sacrifices are ordered by a stated reason, not by arithmetic.',
  'Quote the doctrine at the moment it bites — the finding the surface is showing.',
] as const;

export const NARRATIVES: readonly Narrative[] = [
  // ---- J-2 narrative ----
  {
    id: 'j2',
    name: 'J-2 narrative',
    audience: 'Intelligence staff',
    leadTheses: ['D', 'E', 'F'],
    centrepiece: 'K8 is single-source and load-bearing — verify it next',
    beats: [
      {
        tab: 'j2',
        title: 'The knowledge base — what we hold and how strongly',
        presenterNote:
          'This is the "J-2 · knowledge base" panel — the table lists every assessed belief by its ID, question, and answer band. Every value is a range, not a number: K8 "Is the battery fire-control radar operational?" has a band of 30 to 60, never a single midpoint. The provenance chips alongside each entry show source class and confidence — they are welded on, never optional. Notice K8: it is single-source, held under waiver W-1.',
      },
      {
        tab: 'j2',
        title: 'Sensitivity ranking — which beliefs are load-bearing',
        presenterNote:
          'The "J-2 · sensitivity ranking" panel ranks which beliefs are load-bearing. K8 tops the ranking: perturbing its band edge changes commitment verdicts on C3 "no fires into the port district" and C4 "amphibious group not exposed" — more than any other knowledge object. It is also single-source (ICD 203 flag). The system identifies that K8 is load-bearing; the J-2 decides what to do about it.',
        doctrinalQuote:
          'JP 2-01.3 ch. IV: source diversification — an assessment resting on a single source is flagged, never silently relied upon.',
      },
      {
        tab: 'j2',
        title: 'Discrimination ranking — which questions to answer next',
        presenterNote:
          'The "J-2 · discrimination ranking" panel ranks unanswered questions by how much they would tell us. K11 ranks above K13 despite higher collection cost — the R1 "Fortress Halcyon" / R2 "Strait Denial" expected-answer bands are disjoint for K11 (the question discriminates between scenarios), while K13\'s bands overlap. Value and cost sit side by side, never collapsed into one number. The system ranks; the J-2 tasks.',
      },
      {
        tab: 'observer',
        title: 'Staleness — a changed answer flags exactly what it invalidates',
        presenterNote:
          'On the Observer / bridge tab, the "Observer · staleness flags" panel shows the effect of supersession: a new answer K9 superseding the old K5 "storm-season likelihood" flags exactly the K5-dependent verdicts — specific plan-commitment cells across the matrix — and nothing else. These flags come from a transitive trace walk, not a recompute. The planner decides when to recompile; the system flags, it does not act.',
      },
      {
        tab: 'j2',
        title: 'Centrepiece — K8 is single-source and load-bearing',
        presenterNote:
          'Back on the J-2 workbench, the sensitivity ranking, the single-source flag, and the waiver W-1 converge: K8 is the assessment the J-2 should verify next. This is not a system recommendation — it is the J-2\'s own data, prioritised by its own load on the decision. "Verify K8 next" is the J-2\'s conclusion from the evidence the system shows, not an instruction the system gives.',
        doctrinalQuote:
          'ICD 203: single-source assessments carry an explicit flag; the analyst decides, the system does not suppress.',
      },
    ],
  },

  // ---- Planner narrative ----
  {
    id: 'planner',
    name: 'Planner narrative',
    audience: 'J-3/5 planners',
    leadTheses: ['C', 'B'],
    centrepiece: 'Toggle R2 and watch the favourite die',
    beats: [
      {
        tab: 'planner',
        title: 'The honest matrix — plans vs commitments',
        presenterNote:
          'This is the "Planner · the honest matrix" — plans as rows (each named by its four axis choices, e.g. "strait-early · fires-forward · contest · pull-early"), commitments as columns (C1 "relief ships alongside by D+10", C2 "strait swept by D+7", and so on), each cell a four-stop verdict chip: robust, marginal, tight, violated. There is no total row and no weighted sum — the pattern of verdicts IS the comparison, and the commander weighs it, not the machine. Under the BASE scenario (the unmodified world), the strait-early plans hold C1 and C2 robust.',
      },
      {
        tab: 'commander',
        title: 'Scenario robustness — the favourite under stress (thesis C)',
        presenterNote:
          'The "Commander · scenario robustness" panel lets you toggle between enemy courses of action. Select R2 "Strait Denial" — the strait-early plans\' C1 and C2 drop from robust to violated; strait-early dies under mines. The sweep-first plans hold. A plan robust under BASE is violated under R2; the verdict is a category, not a rank. The collapse markers (▼) show exactly which cells degraded.',
        doctrinalQuote:
          'JP 2-01.3: "Don\'t plan on most-likely." The most-likely scenario is an anchor (Tversky & Kahneman 1974); the strip makes the most-dangerous visible.',
      },
      {
        tab: 'commander',
        title: 'Least-worst under R3m — the relaxation cards (thesis B)',
        presenterNote:
          'The "Commander · least-worst" panel shows what happens when no plan satisfies all commitments. Under R3m "Spoiling Withdrawal — mining branch" (both approaches mined, causeway dropped), three least-worst cards appear — each names its sacrifice in command language, and every card carries the scenario-imposed loss: the causeway is already down, so "taken intact" (C5) is off the table for all of them. The sacrifice is stated in the commander\'s words, not in system terms. C3 "no fires into the port district" is sacrificed before C4 "amphibious group not exposed" because of the stated tie-break — these are least-worst options, never optimal ones.',
      },
      {
        tab: 'planner',
        title: 'Centrepiece — back to the matrix with scenario awareness',
        presenterNote:
          'Back on the honest matrix, the view is now scenario-conditioned: the BASE-green plan is R2-red. The comparison is honest because it shows the pattern, not a sum. Every cell traces back to named knowledge with named owners.',
      },
    ],
  },

  // ---- Commander narrative ----
  {
    id: 'commander',
    name: 'Commander narrative',
    audience: 'Commander / COS',
    leadTheses: ['B'],
    centrepiece: 'Three cards, one sacrifice stated in command language',
    beats: [
      {
        tab: 'commander',
        title: 'The least-worst argument — three cards, never silent',
        presenterNote:
          'The "Commander · least-worst, never silence" panel under R3m "Spoiling Withdrawal — mining branch" shows three cards. Each card names a sacrifice in command language — the commitment\'s own label, authored in the commander\'s frame. "Opens the strait D+9, two days late" is command language; "C2 margin band [−2, 4]" is system language. Command language leads; system detail is available on hover or click. The report is never empty (G4): if nothing is feasible, it says so with the least-worst set.',
        doctrinalQuote:
          'FM 6-0 §5-27: "The commander alone decides." The staff presents the trade in the commander\'s frame; the machine enumerates, the commander weighs.',
      },
      {
        tab: 'commander',
        title: 'Trace to named knowledge — every card opens backward',
        presenterNote:
          'Clicking a verdict chip on any card opens its relationships menu: one-hop "Informs (upstream)" knowledge and "Influences (downstream)" artefacts. Every element traces back to named knowledge with named owners (G3). The commander sees not just the sacrifice but WHY — which assessment drives it, who owns that assessment, and how strongly it is held.',
      },
      {
        tab: 'planner',
        title: 'The honest matrix — the trade the cards summarise',
        presenterNote:
          'On the "Planner · the honest matrix", the same verdicts that fill the cards are the cells of the matrix. The card is a summary; the matrix is the detail. Neither has a total row. A sweep-first plan might hold C1 "relief ships by D+10" robust, C2 "strait swept by D+7" marginal, C3 tight, C4 violated — never "scores 2.5 out of 4."',
      },
      {
        tab: 'commander',
        title: 'Centrepiece — the sacrifice is stated, never silent',
        presenterNote:
          'Back on the "Commander · least-worst" panel, the three cards are the deliverable: each sacrifice named, each tie-break stated, each traced to evidence. The commander\'s decision is supported by argument, not by arithmetic. This is the Stage-4 exit: least-worst, never silence.',
      },
    ],
  },

  // ---- Bridge narrative ----
  {
    id: 'bridge',
    name: 'Bridge narrative',
    audience: 'Both staffs (J-2 + J-3/5)',
    leadTheses: ['A', 'F'],
    centrepiece: 'Supersede K5 and watch the flags land — no email, no re-brief',
    beats: [
      {
        tab: 'observer',
        title: 'The seam, watched — the delta feed',
        presenterNote:
          'The "Observer · the seam, watched" panel shows every knowledge write as a stamped, sequenced entry. This IS the bridge: every act by every role is visible here, typed and traceable. No email, no annex, no verbal caveat that evaporates.',
      },
      {
        tab: 'j2',
        title: 'The J-2 edits a band — supersession in action',
        presenterNote:
          'On the "J-2 · knowledge base" panel, the "Edit assessed band" control lets you supersede K1 "number of transit steps" — change from the current range to a shifted range. The supersede writes a new version, a supersedes edge, and a delta — all visible in the "Observer · the seam, watched" panel. The glow tells you who is affected: the J-2 workbench tab does not glow (it originated the change), but the Planner and Commander tabs do (their content depends on this knowledge).',
        action: 'edit-k8',
      },
      {
        tab: 'observer',
        title: 'Centrepiece — flags land, cross-role, no re-brief',
        presenterNote:
          'Back on Observer / bridge, the "Observer · staleness flags" panel shows exactly which downstream artefacts the edit invalidated — the K1-dependent verdicts, and nothing else (thesis F). The flags arrived through the trace graph, not through a meeting. The planner sees "recompile when ready"; the commander sees the affected cards marked stale. One object model, one store, one trace graph — the bridge is the seam itself.',
      },
      {
        tab: 'observer',
        title: 'The heartbeat — one turn of the loop',
        presenterNote:
          'The "Observer · the seam, watched" panel now shows the full sequence: create, supersede, contest, resolve, recompile. Each is a typed act with provenance. The bridge (thesis A) is not a separate system — it is the same store and trace graph that every role reads and writes. A change in one role glows the roles it touches, through the propagation graph (G6).',
      },
    ],
  },

  // ---- REMIT narrative ----
  {
    id: 'remit',
    name: 'REMIT narrative',
    audience: 'Design team',
    leadTheses: ['A', 'B', 'C', 'D', 'E', 'F'],
    centrepiece: 'The seam is one shared store, walked end-to-end',
    beats: [
      {
        tab: 'observer',
        title: 'The seam architecture — one store, typed edges, stamped deltas',
        presenterNote:
          'The "Observer · the seam, watched" panel shows the seam contract in action: every write publishes exactly one stamped delta (seam §10). Objects are immutable and content-addressed (DEC-21); edges are written at write time, never reconstructed (constitution III). This is the architecture: does it hold under the banded-honesty invariant?',
      },
      {
        tab: 'j2',
        title: 'Knowledge capture — banded honesty in practice',
        presenterNote:
          'On the "J-2 · knowledge base" panel, the assessed bands and provenance chips are visible on every entry. The encoding firewall (G2) and confidence lint (DEC-16) are not rules the operator follows — they are constraints the system enforces. Try a dishonest edit (e.g. a band narrower than the source class warrants): the system refuses with a named reason. The refusal is first-class, never an error toast.',
      },
      {
        tab: 'planner',
        title: 'Compile → score → handful — the pipeline walks forward',
        presenterNote:
          'On the Planner tab, the "compiled world (sparse channels)", "the generated handful", and "the honest matrix" panels show the pipeline: compile → score → organise, each step writing trace edges. The handful is generated (seeded fan-out), not authored — the organiser uses banded ε-non-domination (DEC-19), never a scalar ranking.',
      },
      {
        tab: 'commander',
        title: 'Relaxation — least-worst as a design decision',
        presenterNote:
          'On the Commander tab, the "Commander · least-worst, never silence" panel embodies the design decision ASSAY re-derived: ordinal tiers, stated tie-breaks, no weights (DEC-19). REMIT\'s DEC-22 uses priority-weighted soft-commitment penalties; ASSAY shows the same mechanism works without weights — FIND-2 in the findings ledger. The cards speak command language because the commitment label is authored in the vignette, not generated.',
      },
      {
        tab: 'observer',
        title: 'Centrepiece — the full heartbeat, end-to-end',
        presenterNote:
          'Back on Observer / bridge, resolving the K12 "minefield extent" contest and then editing a band triggers the full pipeline. The "Observer · the seam, watched" panel shows the sequence: create → supersede → contest → resolve → recompile → score → relax, each stamped, each typed, each traced. The seam is one shared store, walked end-to-end. That is the claim: the architecture holds under the invariants the register imposes (G1–G6), and every joint is examinable.',
        action: 'resolve',
      },
    ],
  },
];

/** Look up a narrative by id. */
export function narrativeById(id: string): Narrative | undefined {
  return NARRATIVES.find((n) => n.id === id);
}
