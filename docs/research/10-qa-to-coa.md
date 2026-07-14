# Research note 10 — From Q&A to COA: tracing a banded answer through the pipeline

Research spike · per ASSAY-DEC-11 · 2026-07-14 · bounded to hours, one page preferred
Prompts: a user asked *"is the current system actually parsing banded Q&A information when it scores COAs?"* — trace K3 (civil population in Port Halcyon district) end-to-end and document the gap.

## 1. The question that motivated this note

ASSAY stores knowledge as banded Q&A objects — assessed intervals with provenance, never point estimates. The claim is that these bands propagate honestly through the pipeline to verdict. But when a reader looks at the knowledge set and the commitment set, the path from a specific knowledge item to a specific COA verdict is not obvious. This note traces one item — K3, civil population in the port district — all the way through to the commander's selection, documenting each stage and what happens to the band.

## 2. K3's journey: each stage instrumented

The test suite `tests/k3-trace.test.ts` instruments every stage. Summary:

### Stage 1 — Knowledge object

K3: *"What is the civil population in the Port Halcyon district?"*
- **answer**: `[35,000–55,000] persons` (banded, moderate confidence)
- **subject**: `civil_density.port_district`
- **provenance**: NGO census, 18 months old, reported, J-2 civil affairs

The band width (20,000 persons) reflects the uncertainty in an ageing census. This is honest representation per DEC-15.

### Stage 2 — Routing (config subject_map)

`vignette-config.json` routes `civil_density.port_district` to:
- **channel**: `civil_density`
- **region**: `port_district` (x:24–40, y:30–46)

This routing is configuration-driven, not inferred.

### Stage 3 — Compile

The compile service places K3's answer `{lo:35000, hi:55000, unit:"persons"}` as a `RegionOverride` on the `civil_density` channel for the `port_district` region. The channel's default is `{lo:0, hi:0}` elsewhere. K3's band is **copied verbatim** — no transformation, no summarisation.

### Stage 4 — Materialisation (score-time)

`channelAt(world, config, 'civil_density', x, y, t)` returns:
- `[35000, 55000]` for any `(x,y)` inside `port_district`
- `[0, 0]` outside

K3's band is **live in the compiled world** and resolvable at any cell/time.

### Stage 5 — Scoring commitment C3

C3: *"No fires into the populated port district"*
- **metric**: `civil_harm_exposure`
- **comparator**: `at_most`
- **threshold**: 0
- **scope**: `port_district`

The `civil_harm_exposure` metric is of kind `fires`, which is defined in `src/metrics.ts` as:

```typescript
function fires(plan, element, region, config, unit): Band {
  let count = 0;
  for (const leg of legs) {
    if (leg inside region geometry) count += 1;
  }
  return { lo: count, hi: count, unit };
}
```

**This metric counts FE-FALCON route legs inside `port_district`'s geometry.** It is a purely geometric test — does FE-FALCON enter the district or not? It never calls `channelAt` on the `civil_density` channel. K3's band `[35000, 55000]` is present in the world but **never read by the scorer**.

### Stage 5b — The proof

Scoring P2 against C3 with K3 in the world: `fires = [1, 1]` → violated.
Scoring P2 against C3 **without K3** in the world: `fires = [1, 1]` → violated.

**Identical.** K3's banded answer has zero effect on any COA verdict.

### Stage 6 — Verdict matrix

| Plan | C3 verdict | C3 margin | K3 influence |
|------|-----------|-----------|--------------|
| P1   | marginal  | [0, 0]    | none         |
| P2   | violated  | [-1, -1]  | none         |

P1 marginal because FE-FALCON routes away from the district (0 legs inside).
P2 violated because FE-FALCON enters the district (1 leg inside).

## 3. Is K3's presence in the pipeline *wrong*?

**No.** K3 is compiled correctly into the world — the civil-density channel carries the population band for the port district. Its presence serves several honest purposes:

1. **Attribution**: the commitment's *statement* says "populated port district." K3 is the evidence that the district *is* populated, and by how many. If the population were zero, C3 would be meaningless.

2. **Forward readiness**: a future metric variant — say `weighted_civil_harm` that multiplies leg-count by population density — would immediately read K3's compiled band. The infrastructure is ready; the metric is simple by design choice, not by limitation.

3. **Sensitivity/discrimination/staleness**: the Stage-6 analysis services already read `civil_density` via the perturbation hook (`knowledge_overrides`). K3's band participates in sensitivity analysis even if the scorer doesn't read it for C3 specifically.

4. **Narrative context**: the blog article and the flow-view both need to show the reader *why* the district matters. K3 is the answer.

The gap is not a bug — the `fires` metric is deliberately simple: a binary "did fires enter the district?" test, not a population-weighted harm index. The honesty of the system is that a wider K3 band (less certain population) does not widen the C3 verdict — because the commitment is about the *decision to fire*, not the *scale of harm*. This is a design choice worth explaining, not a defect worth fixing.

## 4. What the blog article should show

The article should walk the reader through K3's journey as a concrete, traceable example of how banded intelligence feeds (and sometimes intentionally does not feed) into COA evaluation. The pedagogic structure:

1. **Start with the question**: "What is the civil population in Port Halcyon?" — an intelligence question with an honest uncertain answer.
2. **Show the band**: `[35,000–55,000]` — why it's a band, not a number.
3. **Follow the routing**: subject → channel → region — how the answer enters the world.
4. **The fork**: C3 reads the *geometry*, not the *density*. Why this is honest.
5. **Contrast with a channel-reading metric**: C4 (`threat_exposure`) reads threat bands along FE-ANVIL's route — show how K4/K6's bands *do* propagate into a banded verdict.
6. **The punchline**: banded honesty means knowing which answers matter *and which don't* — and being transparent about both. K3 informs the *context* of C3, not its *arithmetic*. A system that pretended K3's population band affected the C3 verdict would be *less* honest, not more.

### Embed candidate

A side-by-side interactive: left panel shows K3 flowing into the world (the channel fills up, the cell lights), right panel shows C3's scorer walking FE-FALCON's route and counting legs. The reader sees the density sitting there, the route passing through it, and the counter ticking — but no line between the density band and the counter. Then toggle to C4 × K4 and watch the *actual* channel-reading propagation with bands widening through the sum.

## 5. Decision

No register decision needed. The `fires` metric's geometric-only design is within the latitude of DEC-10 (the scorer's metric registry) and DEC-19 (no invented quantity). The blog article is a communications artefact per DEC-30 (blog cadence), not a system change.
