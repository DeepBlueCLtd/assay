# Feature Specification: From Q&A to COA — tracing a banded answer through the pipeline (SPEC-18)

**Feature Branch**: `claude/qa-banding-coa-scoring-64pib5`

**Created**: 2026-07-14

**Status**: Draft

**Stage**: Research spike (cross-cutting, no stage gate) · **Depends on**: SPEC-05 (knowledge), SPEC-06 (compile), SPEC-07 (scorer), SPEC-08 (handful), SPEC-09 (relaxation), SPEC-16 (surfaces) · **Research note**: `docs/research/10-qa-to-coa.md` (DEC-11 gate — present)

**Input**: A user-triggered investigation: *"Is the current system actually parsing banded Q&A information when it scores COAs? I don't see how it extracts the relevant impact from the items."* The answer — traced and instrumented in the research note — is that the system *does* propagate bands honestly through compile → materialise → score, but the connection from a specific knowledge item to a specific COA verdict is **spatially mediated** (subject → channel/region → route intersection → metric accumulation → margin → verdict), and some knowledge items (K3, civil population) are compiled into the world but intentionally not read by the metric that evaluates the commitment they contextualise (C3, no fires in the district). The blog article walks a reader through this pipeline using K3 as the primary trace and K4/K6 as the contrast, demonstrating both the propagation path and the honest gap.

## User Scenarios & Testing *(mandatory)*

The deliverable is a blog article with an embedded interactive demonstrator, not a system change. The article is part of the blog cadence (DEC-30) and the comms plan §6. The instrumented test suite (`tests/k3-trace.test.ts`) is the acceptance leg — it traces K3 through every pipeline stage and proves the gap.

### User Story 1 — The reader traces K3 from question to compiled world (Priority: P1)

A reader who has never seen the codebase opens the article and follows K3 — *"What is the civil population in Port Halcyon?"* — from its banded answer `[35,000–55,000] persons` through the config routing (`civil_density.port_district`) into the compiled world as a `RegionOverride`. The reader sees the band arrive intact in the channel, resolving to K3's interval inside the port district and to zero outside it.

**Why this priority**: The compile pipeline is the least visible part of the system. Users see knowledge objects and verdicts; the channel layer between them is infrastructure. This story makes it concrete.

**Independent Test**: `tests/k3-trace.test.ts` stages 1–4: assert K3's answer band appears verbatim as a `RegionOverride` on the `civil_density` channel for `port_district`, and that `channelAt` resolves it correctly inside/outside the region.

**Acceptance Scenarios**:

1. **Given** K3 with answer `{lo:35000, hi:55000, unit:"persons"}` and subject `civil_density.port_district`, **When** compiled into a BASE world, **Then** the `civil_density` channel has a `RegionOverride` with `region:"port_district"`, `value:{lo:35000, hi:55000}`, `source:"K3"`.
2. **Given** the compiled world, **When** `channelAt` is called at a cell inside `port_district`, **Then** it returns `{lo:35000, hi:55000, unit:"persons"}`.
3. **Given** the compiled world, **When** `channelAt` is called at a cell outside `port_district`, **Then** it returns the default `{lo:0, hi:0, unit:"persons"}`.

---

### User Story 2 — The reader sees why K3 does NOT affect C3's verdict (Priority: P1)

The reader follows C3 — *"No fires into the populated port district"* — to its metric (`civil_harm_exposure`, kind `fires`). The article shows that the `fires` metric counts FE-FALCON route legs inside the `port_district` geometry. It is a spatial/geometric test, not a channel read. K3's `[35,000–55,000]` band is present in the civil_density channel at the same cells, but the scorer never reads it. The reader sees the proof: scoring with and without K3 produces identical verdicts.

**Why this priority**: This is the pedagogic core — the honest gap. The system does not pretend K3's population band affects C3's verdict, because the commitment is about the *decision to fire*, not the *scale of harm*. Explaining this gap honestly is more instructive than hiding it.

**Independent Test**: `tests/k3-trace.test.ts` stages 5–5b: score P2 against C3 with and without K3 in the world; assert identical `fires` metric results. Assert that the `fires` function never calls `channelAt` on `civil_density`.

**Acceptance Scenarios**:

1. **Given** plan P1 with FE-FALCON route outside `port_district`, **When** scored against C3, **Then** `fires = [0,0]`, verdict `marginal` (margin `[0,0]`).
2. **Given** plan P2 with FE-FALCON route entering `port_district`, **When** scored against C3, **Then** `fires = [1,1]`, verdict `violated` (margin `[-1,-1]`).
3. **Given** plan P2 scored against C3 with K3 in the world, **And** scored again against C3 with K3 removed, **Then** both produce `fires = [1,1]` — identical results.

---

### User Story 3 — The reader contrasts with a channel-reading metric (Priority: P2)

The article contrasts C3 (geometric, K3-blind) with C4 (`threat_exposure`, kind `exposure`) which *does* read the threat channel along FE-ANVIL's route. K4's garrison threat band `[300–450]` and K6's FAC sortie band `[2–6]` propagate through `channelAt` into the exposure sum, and the resulting metric band is genuinely wider when the input bands are wider. The reader sees the two kinds of metric side by side: one that ignores its channel (C3) and one that reads it (C4).

**Why this priority**: P2 because it requires no new implementation — the contrast uses the existing scorer. But it is essential for the article's pedagogic completeness: without the contrast, the reader might conclude that bands *never* propagate into verdicts.

**Independent Test**: Score P1 and P2 against C4; assert that the threat-exposure metric result is a genuine band (lo ≠ hi), and that widening K6's answer band widens the C4 metric band (propagation honesty, O-4/G6).

**Acceptance Scenarios**:

1. **Given** plan P1 scored against C4 (`threat_exposure`, scope `FE-ANVIL`), **When** scored, **Then** the metric result is a band with `lo ≤ hi`, and the verdict is one of the four stops.
2. **Given** K6's answer widened from `[2,6]` to `[1,8]`, **When** P1 is re-scored against C4 via `knowledge_overrides`, **Then** the C4 metric band is at least as wide as the original (G6 propagation honesty).
3. **Given** the article's interactive embed, **When** the reader toggles from "K3 → C3" view to "K4 → C4" view, **Then** the channel-reading path lights up and the band propagation is visible.

---

### User Story 4 — The reader follows the full journey to COA selection (Priority: P2)

The article completes the trace from verdict through handful generation (SPEC-08), relaxation (SPEC-09), and robustness (SPEC-10) to the commander's selection. The reader sees how C3's `violated` verdict on P2 enters the relaxation frontier (P2 sacrifices C3 — "accept fires in the district" — to hold C1/C2), and how the commander's choice between P1 (marginal C3, no fires) and P2 (violated C3, fires) is a real trade presented honestly.

**Why this priority**: P2 because it composes existing functionality. The handful/relax/robustness pipeline already works; this story traces K3's influence (or non-influence) through it.

**Independent Test**: Generate a handful containing P1 and P2; relax over R3m; verify that P2's relaxation candidate includes C3 in its `sacrificed` set. Score both plans against all scenarios; verify that C3's verdict is scenario-independent (it is geometric, not world-dependent).

**Acceptance Scenarios**:

1. **Given** the handful containing P1 and P2, **When** the relaxation service runs over R3m, **Then** at least one candidate sacrifices C3, and that candidate's `sacrificed` set includes `C3`.
2. **Given** P1 and P2 scored against C3 under BASE, R1, R2, R3, **Then** the C3 verdict for each plan is identical across all scenarios (the `fires` metric is geometric, independent of scenario excursions on non-mobility channels).
3. **Given** the full trace from K3 → compile → score → handful → relax → commander choice, **When** the article is read end-to-end, **Then** the reader understands: (a) K3's band is real and honestly represented, (b) C3's metric intentionally does not read it, (c) C3's verdict still matters to COA selection via the relaxation trade, (d) a channel-reading metric variant could read K3 if the commitment were reformulated.

---

### User Story 5 — The blog article and embed ship (Priority: P1)

The blog article renders as a self-contained HTML page in the blog pipeline (`docs/blog/posts/`), with an embedded interactive demonstrator following the blessed embed pattern (no runtime crypto, no bundler, zero network). The embed shows the K3-to-C3 trace (knowledge → channel → route → counter) side by side with the K4-to-C4 trace (knowledge → channel → route → exposure sum). The article is linked from the blog index and the home page.

**Why this priority**: P1 because shipping the article is the deliverable. The research note and tests are intermediate artefacts; the article is what the user asked for.

**Independent Test**: The blog build pipeline (`npm run blog` or `scripts/build-site.ts`) produces the article at the expected path. The article's embed renders in Chromium without network access. The article appears in the blog index.

**Acceptance Scenarios**:

1. **Given** the article source in `docs/blog/posts/`, **When** the blog build runs, **Then** the article appears in the blog index and renders at its expected URL.
2. **Given** the article opened in Chromium with network disabled, **When** the embed loads, **Then** it renders the K3→C3 and K4→C4 traces with no console errors.
3. **Given** the embed, **When** the reader interacts with it (toggling between K3/C3 and K4/C4 views), **Then** the band propagation and the geometric/channel-reading distinction are visually clear.

---

## Non-functional requirements

- **No system change**: this spec produces a test, a research note, and a blog article. No `src/` code is modified. The `fires` metric's geometric-only design is within DEC-10/DEC-19 latitude and is not a defect.
- **Honesty**: the article must not pretend K3's band affects C3's verdict. The gap is the lesson, not a problem to paper over.
- **Embed pattern**: the interactive follows the blessed band-pill embed pattern (static, self-contained, offline-clean, no runtime crypto, no bundler).
- **Blog cadence**: per DEC-30, the article is part of the definition of done for this spike.

## Open questions

1. **Should the article suggest a `weighted_civil_harm` metric variant?** The infrastructure supports it (the `civil_density` channel is already compiled). But proposing it would imply a register candidate (concept §6), which is out of scope for a research spike. **Recommendation**: mention the possibility in a "what could change" sidebar, but do not propose or implement it. If the reader/SME wants it, they open an issue.
2. **Which embed variant?** The research note §4 proposes a side-by-side (K3→C3 vs K4→C4). An alternative is a single-panel trace with a toggle. **Recommendation**: side-by-side — the contrast is the pedagogic point, and a toggle hides it behind a click.
