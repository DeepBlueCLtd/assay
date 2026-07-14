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
  'Never narrate a weighted sum — describe the pattern of verdicts, not "P1 is better overall."',
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
          'Open on the S1 table. Walk the assessed bands: each value is a range, not a number. Point out the provenance chips — source class and confidence are welded on, never optional. Highlight K8: single-source, under waiver W-1. Do not narrate any midpoint; say "K8\'s band is 30 to 60", never a single number.',
      },
      {
        tab: 'j2',
        title: 'Sensitivity ranking — which beliefs are load-bearing',
        presenterNote:
          'Scroll to the sensitivity panel (thesis E). K8 tops the ranking: perturbing its band edge changes the most commitment verdicts. It is single-source (ICD 203 flag). The system identifies that K8 is load-bearing; the J-2 decides what to do about it. Say "K8\'s perturbation changes verdicts on C3 and C4" — never "K8 has a sensitivity score of 2."',
        doctrinalQuote:
          'JP 2-01.3 ch. IV: source diversification — an assessment resting on a single source is flagged, never silently relied upon.',
      },
      {
        tab: 'j2',
        title: 'Discrimination ranking — which questions to answer next',
        presenterNote:
          'Show the discrimination panel (thesis D). K11 ranks above K13 despite higher collection cost — the R1/R2 expected-answer bands are disjoint (the question discriminates between scenarios), while K13\'s bands overlap. Value and cost are shown side by side, never collapsed into one number. The system ranks; the J-2 tasks.',
      },
      {
        tab: 'observer',
        title: 'Staleness — a changed answer flags exactly what it invalidates',
        presenterNote:
          'Switch to Observer. Show the staleness flags (thesis F): K9 superseding K5 flags exactly P1·C2, P2·C1, P2·C2 — the K5-dependent verdicts and nothing else. The flags are a transitive trace walk, not a recompute. The planner decides when to recompile; the system flags, it does not act.',
      },
      {
        tab: 'j2',
        title: 'Centrepiece — K8 is single-source and load-bearing',
        presenterNote:
          'Return to S1. The sensitivity ranking, the single-source flag, and the waiver W-1 converge: K8 is the assessment the J-2 should verify next. This is not a system recommendation — it is the J-2\'s own data, prioritised by its own load on the decision. "Verify K8 next" is the J-2\'s conclusion from the evidence the system shows, not an instruction the system gives.',
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
          'Open on S2. The matrix shows plans (rows) against commitments (columns), each cell a four-stop verdict chip: robust, marginal, tight, violated. There is no total row and no weighted sum — the pattern of verdicts IS the comparison, and the commander weighs it, not the machine. Walk the BASE scenario: P1 holds C1 and C2 robust.',
      },
      {
        tab: 'commander',
        title: 'Scenario robustness — the favourite under stress (thesis C)',
        presenterNote:
          'Switch to the Commander tab and show the scenario strip. Toggle R2 (Strait Denial). P1\'s C1 and C2 drop from robust to violated — the strait-early plan dies under mines. P2 holds. Say "P1 is robust under BASE but violated under R2" — never "P1 scores lower under R2." The verdict is a category, not a rank. The collapse markers (▼) show exactly which cells degraded.',
        doctrinalQuote:
          'JP 2-01.3: "Don\'t plan on most-likely." The most-likely scenario is an anchor (Tversky & Kahneman 1974); the strip makes the most-dangerous visible.',
      },
      {
        tab: 'commander',
        title: 'Least-worst under R3m — the relaxation cards (thesis B)',
        presenterNote:
          'Show S3\'s relaxation cards. Under R3m (both approaches mined, causeway dropped), no plan satisfies all commitments. Three least-worst cards appear — each names the sacrifice in command language: "Maintain the causeway, violated under R3m." The sacrifice is stated in the commander\'s words, not in system terms. State the tie-break: "C3 is sacrificed before C4 because [the stated reason]." Never say "the optimal option" — say "the least-worst option sacrificing C4."',
      },
      {
        tab: 'planner',
        title: 'Centrepiece — back to the matrix with scenario awareness',
        presenterNote:
          'Return to S2. The planner now sees the matrix as scenario-conditioned: the BASE-green plan is R2-red. The comparison is honest because it shows the pattern, not a sum. Every cell traces back to named knowledge with named owners.',
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
          'Open on S3 (Commander tab). The relaxation report under R3m shows three cards. Each card names a sacrifice in command language — the commitment\'s own label, authored in the commander\'s frame. "Opens the strait D+9, two days late" is command language; "C2 margin band [−2, 4]" is system language. Command language leads; system detail is on hover/click. The report is never empty (G4): if nothing is feasible, it says so with the least-worst set.',
        doctrinalQuote:
          'FM 6-0 §5-27: "The commander alone decides." The staff presents the trade in the commander\'s frame; the machine enumerates, the commander weighs.',
      },
      {
        tab: 'commander',
        title: 'Trace to named knowledge — every card opens backward',
        presenterNote:
          'Click a verdict chip on one of the cards. The trace menu opens: one-hop informs (upstream knowledge) and influences (downstream artefacts). Every element traces back to named knowledge with named owners (G3). The commander sees not just the sacrifice but WHY — which assessment drives it, who owns that assessment, and how strongly it is held.',
      },
      {
        tab: 'planner',
        title: 'The honest matrix — the trade the cards summarise',
        presenterNote:
          'Switch to S2. The same verdicts that fill the cards are the cells of the matrix. The card is a summary; the matrix is the detail. Neither has a total row. Walk one plan\'s row: "P2 holds C1 robust, C2 marginal, C3 tight, C4 violated" — never "P2 scores 2.5 out of 4."',
      },
      {
        tab: 'commander',
        title: 'Centrepiece — the sacrifice is stated, never silent',
        presenterNote:
          'Return to S3. The three cards are the deliverable: each sacrifice named, each tie-break stated, each traced to evidence. The commander\'s decision is supported by argument, not by arithmetic. This is the Stage-4 exit: least-worst, never silence.',
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
          'Open on Observer (S4). The delta feed shows every knowledge write as a stamped, sequenced entry. This IS the bridge: every act by every role is visible here, typed and traceable. No email, no annex, no verbal caveat that evaporates.',
      },
      {
        tab: 'j2',
        title: 'The J-2 edits a band — supersession in action',
        presenterNote:
          'Switch to S1. Use the edit control to supersede K1\'s band (e.g. change from the current range to a shifted range). The supersede writes a new version, a supersedes edge, and a delta — all visible in the Observer feed. Watch the glow: the J-2 tab does not glow (it originated the change), but the Planner and Commander tabs do (their content depends on this knowledge).',
        action: 'edit-k8',
      },
      {
        tab: 'observer',
        title: 'Centrepiece — flags land, cross-role, no re-brief',
        presenterNote:
          'Return to Observer. The staleness flags show exactly which downstream artefacts the edit invalidated — the K1-dependent verdicts, and nothing else (thesis F). The flags arrived through the trace graph, not through a meeting. The planner sees "recompile when ready"; the commander sees the affected cards marked stale. One object model, one store, one trace graph — the bridge is the seam itself.',
      },
      {
        tab: 'observer',
        title: 'The heartbeat — one turn of the loop',
        presenterNote:
          'The delta feed now shows the full sequence: create, supersede, contest, resolve, recompile. Each is a typed act with provenance. The bridge (thesis A) is not a separate system — it is the same store and trace graph that every role reads and writes. A change in one role glows the roles it touches, through the propagation graph (G6).',
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
          'Open on Observer (S4). The delta feed IS the seam contract in action: every write publishes exactly one stamped delta (seam §10). Objects are immutable and content-addressed (DEC-21); edges are written at write time, never reconstructed (constitution III). This is the architecture the design team can examine: does it hold under the banded-honesty invariant?',
      },
      {
        tab: 'j2',
        title: 'Knowledge capture — banded honesty in practice',
        presenterNote:
          'Switch to S1. Walk the assessed bands and provenance chips. The encoding firewall (G2) and confidence lint (DEC-16) are not rules the operator follows — they are constraints the system enforces. Try a dishonest edit (e.g. a band narrower than the source class warrants): the system refuses with a named reason. The refusal is first-class, never an error toast.',
      },
      {
        tab: 'planner',
        title: 'Compile → score → handful — the pipeline walks forward',
        presenterNote:
          'Switch to S2. Show the compiled world (sparse channels), then the handful strip and the honest matrix. The pipeline is compile → score → organise, each step writing trace edges. The handful is generated (seeded fan-out), not authored — the organiser uses banded ε-non-domination (DEC-19), never a scalar ranking.',
      },
      {
        tab: 'commander',
        title: 'Relaxation — least-worst as a design decision',
        presenterNote:
          'Switch to S3 (Commander tab). The relaxation report is the design decision ASSAY re-derived: ordinal tiers, stated tie-breaks, no weights (DEC-19). REMIT\'s DEC-22 uses priority-weighted soft-commitment penalties; ASSAY shows the same mechanism works without weights — FIND-2 in the findings ledger. The cards speak command language because the commitment label is authored in the vignette, not generated.',
      },
      {
        tab: 'observer',
        title: 'Centrepiece — the full heartbeat, end-to-end',
        presenterNote:
          'Return to Observer. Resolve K12 if not already resolved, then trigger a recompile by editing a band. Watch the delta feed: create → supersede → contest → resolve → recompile → score → relax, each stamped, each typed, each traced. The seam is one shared store, walked end-to-end. That is the claim: the architecture holds under the invariants the register imposes (G1–G6), and the design team can examine every joint.',
        action: 'resolve',
      },
    ],
  },
];

/** Look up a narrative by id. */
export function narrativeById(id: string): Narrative | undefined {
  return NARRATIVES.find((n) => n.id === id);
}
