# ASSAY

**Assessment Semantics & Scenario Analysis** — a software demonstrator exploring whether the questions and answers collated during intelligence preparation (JIPOE/IPOE) can be made objective, quantifiable, typed objects and exploited by planning machinery *honestly* — without laundering judgement into false precision.

This repository is currently documentation-first: the value here is in how the documents surface the **user interactions**, **data structures**, and **data flows** involved in developing and defending courses of action. Code follows the plan below; nothing is claimed as built that isn't.

## Where to start

1. **`docs/assay-vignette.md`** — the Meridian Archipelago: the fictional scenario every fixture, exit criterion, and demo moment is engineered from. Read this first; everything else cites its identifiers (K1–K14, C1–C6, R1–R3, FE-*).
2. **`docs/assay-walkthrough.md`** — one full heartbeat of the system played end-to-end: who acts, what objects and trace edges each act creates, and what every other role sees. The fastest way to understand what ASSAY *does*.
3. **`docs/assay-ui-wireframes.html`** — the four role surfaces rendered on Meridian data (open in a browser).

## The canonical document set

| Document | Role |
|---|---|
| [`docs/assay-register.md`](docs/assay-register.md) | decision register — the sole origin of decisions (register-first) |
| [`docs/assay-concept.md`](docs/assay-concept.md) | purpose, the thesis catalogue A–H, demo narratives, principles |
| [`docs/assay-knowledge-model.md`](docs/assay-knowledge-model.md) | LinkML schema + commentary — every data shape, and the deliberate absences |
| [`docs/assay-seam-contract.md`](docs/assay-seam-contract.md) | REST shapes and semantics — how the shapes move; invariants G1–G5 |
| [`docs/assay-vignette.md`](docs/assay-vignette.md) | the Meridian Archipelago fixture scenario and its normative coverage matrix |
| [`docs/assay-walkthrough.md`](docs/assay-walkthrough.md) | one heartbeat end-to-end — interactions, structures, and flows in one place |
| [`docs/assay-ui-design.md`](docs/assay-ui-design.md) | surfaces, information flows, discipline-moment interactions, shared components |
| [`docs/assay-build-plan.md`](docs/assay-build-plan.md) | seven research-first stages, exit criteria (machine- and user-observable), demo moments |
| [`docs/assay-delivery-plan.md`](docs/assay-delivery-plan.md) | spec slicing, dependency graph, parallel lanes |
| [`docs/assay-comms-plan.md`](docs/assay-comms-plan.md) | the public GitHub Pages site — same honesty discipline, applied to comms |

## The stance, in one line

No scalar derived from an assessed source is ever shown unbanded; every computed artefact traces back to named knowledge with named owners; infeasibility returns a least-worst argument, never silence; contested knowledge never compiles.

**The Meridian Archipelago scenario is fiction**, engineered so that every thesis has a named demonstration moment. Nothing in this repository reflects any real operational picture.

## Status

Documents authored, draft for review. Build stages 0–7 (see the build plan) have not started; each opens with a bounded research note in `docs/research/` before implementation (ASSAY-DEC-11).
