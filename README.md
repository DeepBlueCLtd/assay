# ASSAY

**Assessment Semantics & Scenario Analysis**

ASSAY is a software demonstrator exploring the application of optimisation techniques to command-and-control planning, using the JIPOE/IPOE process family (JP 2-01.3, ATP 2-01.3, AIntP-17) as its doctrinal anchor. Its central premise: **the questions and answers collated during intelligence preparation can be made objective, quantifiable, typed objects — and exploited by planning machinery honestly**, i.e. without laundering judgement into false precision.

ASSAY is a deliberate re-derivation of the principles of REMIT (a sibling project) against a different problem domain: intelligence-fed course-of-action analysis rather than requirement-to-plan tasking. Where a principle survives the re-derivation it is validated as general; where it doesn't, that is a finding.

## Status

**Documentation phase.** The canonical document set is authored (draft for review); implementation has not started. Per the delivery plan, code begins with the spec-kit workflow (`specs/NNN-name/`) once the document workstream closes. Nothing here should be read as a shipped capability.

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

The demonstration runs against a deliberately fictional scenario — the **Meridian Archipelago** vignette — engineered so that every thesis has a concrete instance to exercise.

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
| [`assay-ui-design.md`](docs/assay-ui-design.md) | Surfaces, information flows, shared components |
| [`assay-ui-wireframes.html`](docs/assay-ui-wireframes.html) | Populated wireframes of all four surfaces |
| [`assay-build-plan.md`](docs/assay-build-plan.md) | Stage sequencing, gates, per-stage research prompts |
| [`assay-delivery-plan.md`](docs/assay-delivery-plan.md) | Spec slicing, dependency graph, parallel lanes |
| [`assay-comms-plan.md`](docs/assay-comms-plan.md) | Public GitHub Pages site plan |

`assay-architecture.md` is deferred by decision (ASSAY-DEC-13) until the knowledge model and seam contract stabilise; orientation lives in the concept §3.

## Working conventions

- **Decisions** originate only in the register. Open questions are held as candidates in the concept and UI design documents; nothing may cite a candidate as authority.
- **Research-first development** (ASSAY-DEC-11): every build stage opens with a bounded research task; findings land as a note in `docs/research/` before implementation starts. Doctrinal or algorithmic claims must trace to a research note or a register entry.
- **Spec-kit** machinery (`.specify/`, `.claude/skills/`) applies to build slices only; the canonical documents are authored directly under register discipline. The project constitution (`.specify/memory/constitution.md`) is a projection of the register, not a rival body of law.
- **Branching**: branch-per-batch (`docs/<batch-name>`, `feat/<slice-name>`).

## License

[MIT](LICENSE) © 2026 Deep Blue C Technology Ltd
