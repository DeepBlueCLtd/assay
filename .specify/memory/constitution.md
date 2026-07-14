<!--
Sync Impact Report
- Version change: 1.1.0 → 1.2.0 (batch 4 projection: seven new decisions, front-end
  lane + communications taxonomy ratified)
- Source of authority: docs/assay-register.md (ASSAY-DEC-1 … ASSAY-DEC-34); this
  constitution is a projection of the register into spec-kit form, not a rival body of law.
- Modified principles: n/a (no principle text redefined)
- Added / materially expanded sections:
  · Additional Constraints — "Writes are events" expanded: the glow (DEC-34) is the
    rendering of G6, and auto-recompute in the flow view (DEC-31a) is attribution-visible.
    Shell/pure-component split (DEC-33) added as a standing extractability constraint.
    Three slice categories named (DEC-30).
- Batch 4 decisions projected (docs/assay-register.md): ASSAY-DEC-28 (home-page
  currency at spec granularity), DEC-29 (sparse channel representation), DEC-30
  (communications as register-blessed authoring, not spec-kit), DEC-31 (flow-view
  behaviours a/b/c ratified, d deferred), DEC-32 (SPA shell with four role tabs),
  DEC-33 (in-browser pipeline + shell/pure-component split), DEC-34 (glow as G6
  made visible).
- Removed sections: n/a
- Templates requiring updates: none (existing templates already accommodate).
- Follow-up TODOs: none. No deferred placeholders.

Prior versions:
- 1.1.0 (2026-07-12): batch 3 projection — G6 ratified (DEC-25), six new decisions
  (DEC-22…27); Contract invariants expanded to G1–G6; Governance compliance covers G1–G6.
- (none) → 1.0.0 (2026-07-11): initial ratification; Core Principles I–VI; Additional
  Constraints; Development Workflow & Quality Gates; Governance; projection of
  ASSAY-DEC-1 … ASSAY-DEC-11.
-->

# ASSAY Constitution

## Core Principles

### I. Seam Contract Is the Invariant
All compute (compile, plan, score, relax, analyse) MUST sit behind the REST-shaped
seam contract defined in `docs/assay-seam-contract.md`. The v1 in-browser mock is one
implementation of that contract and is exempt from resembling any future real service
internally; it is NOT exempt from the contract's shapes, error model, or invariants.
Surfaces arrange existing projections of the store; a surface MUST NOT compute, hold
private derived state, or demand semantics the seam does not offer. The scorer MUST be
honestly real even in the mock — sensitivity, discrimination, and robustness features
are re-scoring loops, and a faked scorer renders them theatre. (ASSAY-DEC-4, DEC-5,
DEC-10)

### II. Banded Honesty (NON-NEGOTIABLE)
No scalar derived from an assessed source may appear unbanded anywhere: not in seam
responses, not in stored objects, not on any surface, not in logs shown to users.
Assessed values are carried as bands `{lo, hi}`; provenance (source class, confidence,
owner) travels with every value and is rendered wherever the value is rendered,
including `single-source` and `assessment, not fact` markings. Plan dominance and
commitment verdicts are computed in banded space only; verdicts use the four-stop
scale (robust / marginal / tight / violated) with no decimal display. Code review MUST
reject any change that surfaces a bare assessed number. (ASSAY-DEC-9)

### III. Traceability Terminates in Named Knowledge
Every computed artefact — channel, verdict, score, ranking, sacrifice — MUST be
reachable by a backward trace that terminates, transitively, in named KnowledgeObjects
with named owners. Trace edges are written at compute time by the service performing
the computation, never reconstructed after the fact. A chain that dead-ends is a
defect and MUST surface as a visible error state, not be hidden. Encoding discipline
is part of this principle: `scenario_weight` objects MUST NOT compile into constraints
or costs; an assessed source claiming `hard_constraint` MUST carry a recorded waiver;
`contested` knowledge MUST NOT reach a CompiledWorld by any path. (ASSAY-DEC-5, DEC-6)

### IV. Determinism and Content Addressing
Stored objects are immutable and content-addressed; revision is supersession with a
trace edge, never mutation. Every compute response carries `{engine_version, stamp}`;
identical stamp and engine version MUST yield byte-identical results, and all
randomness flows from explicit seeds. Results computed under different stamps MUST NOT
be compared silently — the comparability guard fails loudly. (ASSAY-DEC-5, DEC-6;
seam contract invariant G1)

### V. Research Before Implementation
Every build stage opens with a bounded research task on the doctrine and literature it
touches (JIPOE/IPOE and military planning doctrine; optimisation techniques). A
research note MUST exist in `docs/research/` — citing sources and ending with "what we
will do differently" — before implementation of that stage begins. Doctrinal or
algorithmic claims in specs, plans, or canonical documents MUST trace to a research
note or a register entry, not to developer recollection. Research is bounded in hours,
not weeks; a ballooning note is a register conversation, not a licence to stall.
(ASSAY-DEC-11)

### VI. Register Supremacy
`docs/assay-register.md` is the sole origin of methodology and design decisions.
Decisions are recorded in the register before being cited or relied upon in any peer
document, spec, or plan (register-first). Spec-kit artefacts — this constitution
included — are projections of the register: where a spec, plan, or this document
conflicts with the register, the register wins and the artefact is corrected. New
principles enter the register as ASSAY-DEC entries first. (ASSAY-DEC-2)

## Additional Constraints

- **Stack**: TypeScript/TSX, in-browser, offline-capable; no server-side runtime in
  v1. LinkML (`docs/assay-knowledge-model.md`) is the source of truth for all data
  shapes; TypeScript types are generated, never hand-drifted. (ASSAY-DEC-3, DEC-4)
- **Independence**: no code or schema dependency on REMIT. Convergence or divergence
  findings are reported as candidate REMIT register entries, never as imports.
  (ASSAY-DEC-3)
- **Fixtures**: the Meridian Archipelago vignette (`docs/assay-vignette.md`) is the
  sole fixture source; its coverage matrix (§7) is normative, and a change that breaks
  a matrix row is a register matter. (ASSAY-DEC-8)
- **Contract invariants G1–G6** (seam contract §G) are standing acceptance criteria
  for every feature: determinism (G1); no bare assessed scalars at the seam (G2);
  complete trace chains (G3); infeasibility returns least-worst plans with `sacrificed`
  populated, never an empty set or a silent constraint drop (G4); contested knowledge
  never compiles (G5); propagation honesty — widening any input band never narrows any
  output band, and every point-realisation of the inputs scores inside the output band
  (G6, ASSAY-DEC-25; hand-computed oracle cases in vignette §9, binding on SPEC-07 and
  re-asserted by the spine-complete gate).
- **Writes are events**: every cross-surface write is a stamped delta; no surface
  writes to another surface's state directly. Nothing recomputes silently on
  knowledge change — staleness flags, humans decide. Where auto-recompute is used
  (the flow view, DEC-31a), it is attribution-visible: stamp flip, delta row, and
  gate pulse. The propagation glow (DEC-34) renders G6 as an operator-visible
  affordance — value-keyed, row/cell-level, never under- or over-reports.
  (ASSAY-DEC-5, DEC-31, DEC-34)
- **Shell / pure-component split** (ASSAY-DEC-33): the eight `src/components/*`
  renderers stay pure (types-in, HTML-string-out, no app state dependency); all
  state, events, recompute, and propagation live in `src/app/`. This preserves
  SPEC-14 extractability — components are reusable in any consumer.
- **Three slice categories** (ASSAY-DEC-12, DEC-30): document slices (D#), build
  specifications (SPEC-##), and communications artefacts. Communications are
  projections of shipped work under register/comms honesty discipline, never
  spec-kit features.

## Development Workflow & Quality Gates

- **Stage sequence**: development follows `docs/assay-build-plan.md` (stages 0–7 with
  the spine-complete gate after stage 6). The generator is declared sacrificial scope;
  the scorer is never sacrificed. Work outside the current stage requires a register
  entry.
- **Per-stage gates**, in order: (1) research note exists (Principle V); (2)
  contract-invariant tests for the stage's endpoints written against the seam shapes
  and confirmed failing before implementation; (3) stage exit criteria from the build
  plan demonstrably met against Meridian fixtures; (4) trace-chain completeness
  spot-checked for every new computed artefact type.
- **Spec hygiene**: `spec.md` states WHAT/WHY in domain language and cites register
  DEC ids where it restates decisions; `plan.md` holds HOW. The Constitution Check in
  every plan MUST evaluate Principles I–IV explicitly and cite G1–G6 where applicable.
- **Repo conventions**: branch-per-batch (`docs/<batch>`, `feat/<slice>`); guarded
  patch scripts for canonical-document edits; milestone notifications to
  ntfy.sh/iancc2025; Claude Code as the development environment.

## Governance

This constitution is subordinate to the ASSAY register and supersedes all other
practice documents within the repo. Amendment procedure: (1) the change is proposed
and recorded as an ASSAY-DEC register entry; (2) this document is amended to project
it, with a Sync Impact Report and a semantic version bump (MAJOR: principle removed or
redefined incompatibly; MINOR: principle or section added or materially expanded;
PATCH: clarification or wording); (3) dependent templates and specs are swept in the
same batch. All PRs and `/speckit.analyze` runs MUST verify compliance with Principles
I–VI and invariants G1–G6; complexity beyond the current stage MUST be justified
against the build plan or rejected. Runtime development guidance lives in the
canonical documents under `docs/`, which remain the authoritative elaboration of
every rule stated here.

**Version**: 1.2.0 | **Ratified**: 2026-07-11 | **Last Amended**: 2026-07-14
