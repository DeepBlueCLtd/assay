# Feature Specification: From Q&A to COA — tracing banded answers through the pipeline (SPEC-18)

**Feature Branch**: `claude/qa-banding-coa-scoring-64pib5`

**Created**: 2026-07-14

**Status**: Draft

**Stage**: Research spike (cross-cutting, no stage gate) · **Depends on**: SPEC-05 (knowledge), SPEC-06 (compile), SPEC-07 (scorer), SPEC-08 (handful), SPEC-09 (relaxation), SPEC-16 (surfaces)

**Input**: A user-triggered investigation: *"Is the current system actually parsing banded Q&A information when it scores COAs? I don't see how it extracts the relevant impact from the items."*

**Deliverable**: A blog article with an embedded interactive demonstrator that walks a reader through a test case from Knowledge Object to Commander's selected COA, using three knowledge items (K3, K6, K7) as traced exemplars. Accompanied by an instrumented test suite (`tests/k3-trace.test.ts`) that proves every claim the article makes. No `src/` code is modified.

---

## 1. Investigation: how banded answers reach COA verdicts

The connection from a knowledge item to a COA verdict is **spatially mediated** — not a direct input→output function. The pipeline has five stages, and each knowledge item may participate at different stages, or not at all. This section traces three items to expose the three patterns.

### 1.1 The pipeline (common to all knowledge items)

```
KnowledgeObject
  .subject (e.g. "civil_density.port_district")
       │
       │ vignette-config.json subject_map lookup
       ▼
  (channel, region) pair
       │
       │ compile.ts: answer band → RegionOverride on channel
       ▼
CompiledWorld.channels[kind].regions[]
       │
       │ score.ts: evaluateMetric(commitment, plan, world, config)
       │   → metrics.ts: metric-specific evaluator
       │     → materialise.ts: channelAt(world, config, kind, x, y, t)
       │   → accumulate into metric Band
       ▼
  metric Band
       │
       │ marginBand(comparator, threshold, metric) → margin Band
       │ verdictFor(margin) → {robust, marginal, tight, violated}
       ▼
  CommitmentVerdict
```

The critical question is **what the metric evaluator does at the `channelAt` step**. Not all metrics read the channel. This produces three distinct patterns, each traced below.

### 1.2 K3 — band compiled, metric geometric (the honest gap)

**K3**: *"What is the civil population in the Port Halcyon district?"*
- answer: `[35,000–55,000] persons` (reported, moderate confidence, 18-month-old NGO census)
- subject: `civil_density.port_district` → channel `civil_density`, region `port_district` (x:24–40, y:30–46)

**Compile**: K3's answer is placed verbatim as a `RegionOverride` on the `civil_density` channel. `channelAt(world, config, 'civil_density', 32, 38, 0)` returns `[35000, 55000]` inside the district, `[0, 0]` outside. The band is live in the world.

**C3**: *"No fires into the populated port district"*
- metric: `civil_harm_exposure` (kind `fires`)
- comparator: `at_most`, threshold: `0`, scope: `port_district`

**The `fires` metric counts FE-FALCON route legs inside the `port_district` geometry.** It is a purely geometric test — it never calls `channelAt` on any channel. K3's band is present in the world at the cells FE-FALCON passes through, but the scorer never reads it.

**Instrumented proof** (`tests/k3-trace.test.ts` stage 5b): Scoring P2 against C3 with K3 in the world produces `fires = [1, 1]` → violated. Scoring P2 against C3 *without* K3 produces `fires = [1, 1]` → violated. **Identical.** K3's banded answer has zero effect on any COA verdict.

| Plan | FE-FALCON in district? | C3 fires | C3 verdict | C3 margin |
|------|----------------------|----------|-----------|-----------|
| P1   | No (legs at (30,50), (48,15)) | `[0, 0]` | marginal  | `[0, 0]`  |
| P2   | Yes (leg at (32,38))  | `[1, 1]` | violated  | `[-1, -1]` |

**Why this is honest, not broken**: C3's commitment is about the *decision to fire*, not the *scale of harm*. The population number contextualises *why* the district matters — it is the J-2's evidence that the district is populated — but it does not modulate the binary question of whether FE-FALCON fires there. A system that multiplied leg-count by population would invent a quantity (weighted harm) that no commitment asked for, violating DEC-19 (no invented quantities).

### 1.3 K6 — band propagates into verdict (the positive case)

**K6**: *"What sortie rate can the FAC squadron sustain?"*
- answer: `[2–6] sorties/day` (assessed, **low** confidence — wide band from weak evidence)
- subject: `threat.fac_sorties` → channel `threat`, region `fac_waters` (x:30–50, y:20–34)

**C4**: *"Amphibious group not exposed to unsuppressed battery or FAC threat"*
- metric: `threat_exposure` (kind `exposure`)
- comparator: `at_most`, threshold: `12`, scope: `FE-ANVIL`

**The `exposure` metric reads the threat channel** via `channelAt` along FE-ANVIL's route, accumulating `threat_value × dwell_hours` as a band. When FE-ANVIL enters `fac_waters`, the scorer reads K6's band `[2, 6]` and the band propagates into the sum.

**Instrumented trace** (`tests/k3-trace.test.ts` stage 5c):

| Plan | FE-ANVIL in fac_waters? | Threat at leg | C4 exposure | C4 margin | C4 verdict |
|------|------------------------|---------------|------------|-----------|-----------|
| P1   | Yes (leg (32,22) steps 8–9) | `[2, 6]` | `[12, 36]` | `[-24, 0]` | tight |
| P2   | No (leg (30,50) only) | `[0, 0]` | `[0, 0]` | `[12, 12]` | robust |

**Propagation honesty proof (G6)** (`tests/k3-trace.test.ts` stage 5e): Widening K6 from `[2, 6]` to `[1, 8]` via `knowledge_overrides` widens C4's margin from `[-24, 0]` to `[-36, 6]`. The widened margin strictly contains the original. **Less certain intelligence produces less certain verdicts.** K3's band has no such effect on C3.

### 1.4 K7 — band compiled, route misses region (the near-miss)

**K7**: *"What is the air-defence engagement envelope at Carrick strip?"*
- answer: `[8–14] km` (assessed, moderate confidence)
- subject: `threat.air_defence` → channel `threat`, region `air_defence` (x:40–52, y:40–52)

K7 is compiled into the threat channel for `air_defence`. The `exposure` metric *would* read it — unlike the `fires` metric, `exposure` calls `channelAt` on the `threat` channel. But FE-ANVIL's route in both P1 and P2 does not pass through `air_defence`.

**Instrumented trace** (`tests/k3-trace.test.ts` stage 5d):

| Plan | FE-ANVIL in air_defence? | K7 read? | C4 effect |
|------|-------------------------|----------|-----------|
| P1   | No | No | zero |
| P2   | No | No | zero |

**K7's role is upstream**: it shapes FE-FALCON routing decisions at the *plan-generation* level (`generate.ts`), determining whether FALCON takes a stand-off route around Carrick or enters the air-defence envelope. K7 affects which plans are *generated*, not how they are *scored*. A plan whose route entered `air_defence` *would* see K7's band propagate into C4.

### 1.5 The three-pattern taxonomy

| Pattern | Example | Metric reads channel? | Route enters region? | Band affects verdict? |
|---------|---------|----------------------|---------------------|----------------------|
| **Band-propagating** | K6 → C4 | Yes (`exposure`) | Yes (P1) | Yes — band widens metric |
| **Geometric-only** | K3 → C3 | No (`fires`) | n/a | No — metric counts legs |
| **Route-dependent miss** | K7 → C4 | Yes (`exposure`) | No (P1, P2) | No — route doesn't intersect |

This taxonomy is the article's pedagogic core. A reader who understands these three patterns understands how banded intelligence feeds — and sometimes intentionally does not feed — into COA evaluation.

---

## 2. User Scenarios & Testing

### User Story 1 — The reader traces K3 from question to compiled world (Priority: P1)

A reader follows K3 from its banded answer through config routing into the compiled world as a `RegionOverride`, seeing the band arrive intact.

**Independent Test**: `tests/k3-trace.test.ts` stages 1–4.

**Acceptance Scenarios**:

1. **Given** K3 with answer `{lo:35000, hi:55000, unit:"persons"}` and subject `civil_density.port_district`, **When** compiled into a BASE world, **Then** the `civil_density` channel has a `RegionOverride` with `region:"port_district"`, `value:{lo:35000, hi:55000}`, `source:"K3"`.
2. **Given** the compiled world, **When** `channelAt` is called inside/outside `port_district`, **Then** it returns K3's band inside and the default outside.

---

### User Story 2 — The reader sees K3 does NOT affect C3 (Priority: P1)

The article shows the `fires` metric is geometric. K3's band is present but never read.

**Independent Test**: `tests/k3-trace.test.ts` stages 5–5b: score P2 against C3 with and without K3; assert identical results.

**Acceptance Scenarios**:

1. **Given** P1 with FE-FALCON outside `port_district`, **When** scored against C3, **Then** `fires = [0,0]`, verdict `marginal`.
2. **Given** P2 with FE-FALCON inside `port_district`, **When** scored against C3, **Then** `fires = [1,1]`, verdict `violated`.
3. **Given** P2 scored against C3 with and without K3, **Then** identical results — K3 has zero effect.

---

### User Story 3 — K6 contrast: a band that DOES propagate (Priority: P1)

K6's FAC sortie band propagates into C4's exposure metric. Widening K6 widens the C4 margin (G6).

**Independent Test**: `tests/k3-trace.test.ts` stages 5c, 5e.

**Acceptance Scenarios**:

1. **Given** P1 scored against C4, **When** FE-ANVIL enters `fac_waters`, **Then** K6's threat band `[2, 6]` is read by `channelAt` and the exposure metric is a genuine band `[12, 36]`.
2. **Given** K6 widened from `[2,6]` to `[1,8]` via `knowledge_overrides`, **When** P1 is re-scored, **Then** C4's margin band widens (G6 propagation honesty).

---

### User Story 4 — K7 contrast: compiled but route-dependent miss (Priority: P1)

K7's air-defence band is compiled into the threat channel but FE-ANVIL's route misses the region. K7's role is upstream at plan generation.

**Independent Test**: `tests/k3-trace.test.ts` stage 5d.

**Acceptance Scenarios**:

1. **Given** P1 and P2 scored against C4, **When** neither FE-ANVIL route enters `air_defence`, **Then** K7's band has zero effect on C4.
2. **Given** the article, **When** the reader reaches the K7 section, **Then** the article explains K7's upstream role: shaping which plans are generated, not how they are scored.

---

### User Story 5 — Full journey to COA selection (Priority: P2)

The article traces from verdict through handful/relaxation to the commander's selection, showing how C3's `violated` verdict on P2 drives the relaxation trade.

**Independent Test**: Generate a handful containing P1/P2; relax over R3m; verify C3 appears in a `sacrificed` set.

**Acceptance Scenarios**:

1. **Given** the relaxation service over R3m, **Then** at least one candidate sacrifices C3.
2. **Given** P1 and P2 scored against C3 under all scenarios, **Then** the C3 verdict is scenario-independent (geometric, not world-dependent).

---

### User Story 6 — Blog article and embed ship (Priority: P1)

The blog article ships as a self-contained HTML page with a three-panel interactive demonstrator showing the K3/K6/K7 taxonomy.

**Independent Test**: Blog build produces the article; embed renders in Chromium offline.

**Acceptance Scenarios**:

1. **Given** the article in `docs/blog/posts/`, **When** the blog build runs, **Then** it appears in the index.
2. **Given** the embed, **When** the reader interacts with it, **Then** the three patterns (band-propagating, geometric-only, route-dependent miss) are visually distinct.

---

## 3. Embed design

A three-panel interactive showing the three knowledge-to-verdict patterns:

- **Panel 1 (K3 → C3)**: K3's civil-density band flows into the world (the channel fills, the cell lights in `port_district`). C3's `fires` scorer walks FE-FALCON's route and counts legs — the density sits there, the route passes through it, but no line connects the band to the counter. The verdict is purely geometric.
- **Panel 2 (K6 → C4)**: K6's FAC-sortie band flows into the threat channel for `fac_waters`. C4's `exposure` scorer walks FE-ANVIL's route and reads `channelAt` at each leg — when the route enters `fac_waters`, the band propagates into the exposure sum. A slider widens K6's band and watches C4's margin band widen in response (G6).
- **Panel 3 (K7 → C4)**: K7's air-defence band flows into the threat channel for `air_defence`. C4's scorer walks FE-ANVIL's route — but the route never enters `air_defence`, so K7 has zero effect. A callout explains K7's role is upstream at plan generation.

Follows the blessed embed pattern (static, self-contained, offline-clean, no runtime crypto, no bundler).

---

## 4. Non-functional requirements

- **No system change**: this spec produces a test suite and a blog article. No `src/` code is modified. The `fires` metric's geometric-only design is within DEC-10/DEC-19 latitude and is not a defect.
- **Honesty**: the article must not pretend K3's band affects C3's verdict. The gap is the lesson, not a problem to paper over.
- **Blog cadence**: per DEC-30, the article is part of the definition of done for this spike.

## 5. Open questions

1. **Should the article suggest a `weighted_civil_harm` metric variant?** The infrastructure supports it (the `civil_density` channel is already compiled). But proposing it would imply a register candidate (concept §6), which is out of scope. **Recommendation**: mention the possibility in a "what could change" sidebar; if the reader/SME wants it, they open an issue. — **Resolved 2026-07-14 (issue #41 → ASSAY-DEC-35, batch 5): declined.** C3 stays a geometric red line; civil harm is not quantified or weighted (the honest default, option (a)). Whether firing into 55,000 is worse than 5,000 is a commander/SME value judgement DEC-19 reserves to that role; the geometric-only pattern documented in §1.2 is affirmed as a design feature, not a gap to close.
2. **Which embed layout?** Three-panel side-by-side (recommended — the contrast is the pedagogic point) vs tabbed single-panel (saves horizontal space). **Recommendation**: three-panel with responsive collapse to tabs on narrow viewports.
