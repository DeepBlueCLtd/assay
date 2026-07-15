# ASSAY

**Assessment Semantics & Scenario Analysis**

ASSAY is a software demonstrator exploring the application of optimisation techniques to command-and-control planning, using the JIPOE/IPOE process family (JP 2-01.3, ATP 2-01.3, AIntP-17) as its doctrinal anchor. Its central premise: **the questions and answers collated during intelligence preparation can be made objective, quantifiable, typed objects — and exploited by planning machinery honestly**, i.e. without laundering judgement into false precision.

ASSAY is a deliberate re-derivation of the principles of REMIT (a sibling project) against a different problem domain: intelligence-fed course-of-action analysis rather than requirement-to-plan tasking. Where a principle survives the re-derivation it is validated as general; where it doesn't, that is a finding.

## Status

**Built through the spine and beyond.** All seven build stages (0–7) of the build plan are implemented and demonstrated on the Meridian fixtures: the content-addressed store and trace graph, knowledge capture with its honesty lints and refusals, the sparse compile, banded scoring with the four-stop verdict, the generated handful, relaxation, scenario robustness, the analysis loops (sensitivity, discrimination, staleness), and the presentation lane (live SPA, system-flow explainer, spatial/temporal COA surface, narratives). Theses A–F are `explored`; G and H remain horizon. The single source of truth for progress is [`docs/status.yml`](docs/status.yml), projected honestly onto the [published site](https://deepbluecltd.github.io/assay/); the current-phase line in [`CLAUDE.md`](CLAUDE.md) carries the running detail. Development proceeds slice-by-slice through the spec-kit workflow (`specs/NNN-name/`) under register discipline.

## Where to start

The fastest route in:

1. **[The published site](https://deepbluecltd.github.io/assay/)** — the live demonstrator (the real pipeline running in-browser), the component gallery, the system-flow explainer, and the blog with working embeds.
2. **[`docs/assay-vignette.md`](docs/assay-vignette.md)** — the Meridian Archipelago: the fictional scenario every fixture, exit criterion, and demo moment is engineered from. Everything else cites its identifiers (K1–K14, C1–C6, R1–R3, FE-*).
3. **[`docs/assay-walkthrough.md`](docs/assay-walkthrough.md)** — one full heartbeat of the system played end-to-end: who acts, what objects and trace edges each act creates, and what every other role sees. The fastest way to understand what ASSAY *does*.
4. **[`docs/assay-ui-wireframes.html`](docs/assay-ui-wireframes.html)** — the four role surfaces rendered on Meridian data (open in a browser).

For the formal set in authority order, start with the concept document in the map below.

## What ASSAY demonstrates

One coherent environment — a shared backend and a small set of role surfaces — within which a catalogue of theses can be explored rather than separately built:

| Thesis | Claim |
|---|---|
| A · Pipeline | JIPOE knowledge can flow into an optimiser honestly (typed encoding + compile path) |
| B · Least-worst | When commitments conflict, minimal relaxation produces a defensible plan-as-argument |
| C · Robustness | Scoring friendly plans across the adversary COA set beats optimising against most-likely |
| D · Collection | Optimisation can tell you where to look (COA-hypothesis discrimination) |
| E · Sensitivity/deception | The system can identify which beliefs the decision is leaning on |
| F · Staleness | A changed answer identifies exactly what it invalidates |
| G · Interdependency | Systems-perspective (PMESII node-link) knowledge can be computable — horizon |
| H · Reactive red | A responding adversary changes which plans survive — horizon |

The demonstration runs against a deliberately fictional scenario — the **Meridian Archipelago** vignette — engineered so that every thesis has a concrete instance to exercise. Nothing in this repository reflects any real operational picture.

## Design commitments (abbreviated)

Full authority lives in the decision register; three commitments shape everything else:

- **Banded honesty.** No scalar derived from an assessed source reaches any surface unbanded. Bands are pure closed intervals `{lo, hi, unit}` — no stored midpoint, no distributional claim. Only directly observed values and commander's directive thresholds may be scalar.
- **Register-first.** Every decision is recorded in `docs/assay-register.md` before it is cited or relied upon anywhere else. Peer documents are projections of the register, updated by batch propagation.
- **The seam is the durable asset.** All compute sits behind a REST-shaped seam contract. The v1 implementation is an in-browser mock, but the shapes, error model, refusal paths, and invariants bind the mock exactly as they would bind a server — and the scorer is honestly real even in the mock.

## Document map

All canonical documents live in `docs/`:

| Document | Role |
|---|---|
| [`assay-register.md`](docs/assay-register.md) | Decision register — the sole home of decisions (ASSAY-DEC-n) |
| [`assay-concept.md`](docs/assay-concept.md) | Purpose, theses, narratives, principles — start here |
| [`assay-knowledge-model.md`](docs/assay-knowledge-model.md) | LinkML schema + commentary; source of truth for every data shape |
| [`assay-seam-contract.md`](docs/assay-seam-contract.md) | REST shapes and semantics; system invariants (§G) |
| [`assay-vignette.md`](docs/assay-vignette.md) | The Meridian Archipelago scenario — the sole fixture source |
| [`assay-walkthrough.md`](docs/assay-walkthrough.md) | One heartbeat end-to-end on Meridian; standing contract validation (canonical, ASSAY-DEC-22) |
| [`assay-ui-design.md`](docs/assay-ui-design.md) | Surfaces, information flows, discipline-moment interactions, shared components |
| [`assay-ui-wireframes.html`](docs/assay-ui-wireframes.html) | Populated wireframes of all four surfaces |
| [`assay-build-plan.md`](docs/assay-build-plan.md) | Stage sequencing, gates (machine- and user-observable), demo moments, research prompts |
| [`assay-delivery-plan.md`](docs/assay-delivery-plan.md) | Spec slicing, dependency graph, parallel lanes |
| [`assay-comms-plan.md`](docs/assay-comms-plan.md) | Public GitHub Pages site plan, including the SME evaluation checkpoints |
| [`assay-findings.md`](docs/assay-findings.md) | Findings ledger — thesis states and transition criteria, re-derivation verdicts, REMIT candidates (canonical, ASSAY-DEC-26) |

`assay-architecture.md` is deferred by decision (ASSAY-DEC-13) until the knowledge model and seam contract stabilise; orientation lives in the concept §3.

## Working conventions

- **Decisions** originate only in the register. Open questions are held as candidates in the concept and UI design documents; nothing may cite a candidate as authority.
- **Research-first development** (ASSAY-DEC-11): every build stage opens with a bounded research task; findings land as a note in `docs/research/` before implementation starts. Doctrinal or algorithmic claims must trace to a research note or a register entry.
- **Spec-kit** machinery (`.specify/`, `.claude/skills/`) applies to build slices only; the canonical documents are authored directly under register discipline. The project constitution (`.specify/memory/constitution.md`) is a projection of the register, not a rival body of law.
- **Branching**: branch-per-batch (`docs/<batch-name>`, `feat/<slice-name>`).

## License

[MIT](LICENSE) © 2026 Deep Blue C Technology Ltd
