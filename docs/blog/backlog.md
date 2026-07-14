# Blog backlog — articles owed by the landed build (Stages 0–4)

Status: **backlog cleared** · 2026-07-14 · dev-facing (not published — `build-site.ts` skips `.md`)
Authority: comms plan §6 (blog articles), §6.1 (candidate embeds), §9 (cadence & ownership).

The comms-plan cadence (§9) makes a blog article part of a stage/spec's *definition of
done* — "choosing and shipping the embed is part of authoring the article, not a separate
task." But the blog vehicle did not exist while Stages 0–4 were built, so those articles
accrued as a **queued debt** against an unbuilt site rather than being skipped. Now that the
scaffold is live (status.yml, the blog index, the standalone-embed target), this file tracks
that debt down to zero.

Each article obeys every §6.2 honesty rule: one of the two embed labels (*live component* /
*illustrative widget*), real rule + fixture data, embed only when the slice's status supports
it, self-contained and static, degrade honestly, and **freeze at publication**.

## Owed articles

Slice IDs per `assay-delivery-plan.md`; candidate embeds per comms plan §6.1. "Embeddable now"
= the underlying component or rule is shipped and could back a *live* (not illustrative) embed.

| Stage | Slice | Article (candidate embed) | Embeddable now? | Status |
|---|---|---|---|---|
| 0 | SPEC-01 store | Content addressing — edit a small object, watch its hash (identity) change | Yes — `src/store` hash is shipped | **shipped** → [posts/2026-07-11-content-addressing.html](posts/2026-07-11-content-addressing.html) |
| 0 | SPEC-02 trace store | Trace walk — click a node, see forward/backward closure light up | Yes — trace graph shipped | **shipped** → [posts/2026-07-11-trace-walk.html](posts/2026-07-11-trace-walk.html) |
| 1 | SPEC-05 knowledge | **The band pill** — a range is more honest than a number | Yes | **shipped** → [posts/2026-07-13-band-pill.html](posts/2026-07-13-band-pill.html) |
| 1 | SPEC-05 knowledge | The provenance chip & the K10 refusal — markings that behave; a refusal that is legible as discipline | Yes — `provenanceChip`, `refusalBanner` shipped | **shipped** → [posts/2026-07-12-provenance-chip.html](posts/2026-07-12-provenance-chip.html) |
| 2 | SPEC-06 compile | Stamp determinism — recompile twice for a byte-identical stamp; change one item and watch it shift | Yes — compile + stamp shipped | **shipped** → [posts/2026-07-12-stamp-determinism.html](posts/2026-07-12-stamp-determinism.html) |
| 3 | SPEC-07 scorer | Verdict playground — move a commitment threshold across a banded score; the four-stop verdict flips only at band edges | Yes — scorer + `s2Matrix` shipped | **shipped** → [posts/2026-07-13-verdict-playground.html](posts/2026-07-13-verdict-playground.html) |
| 3 | SPEC-08 handful | The generated handful — four genuinely distinct plans, distinct *because* of the trade axes (optional; no §6.1 row) | Yes — generator + `handfulStrip` shipped | optional |
| 4 | SPEC-09 relaxation | Least-worst explorer — choose which commitment to sacrifice; see what each relaxation buys and costs | Yes — relax + `s3Cards` shipped | **shipped** → [posts/2026-07-13-least-worst.html](posts/2026-07-13-least-worst.html) |

Future stages (5–6) carry their own §6.1 candidates (SPEC-10 scenario strip, SPEC-11 band-edge
slider, SPEC-13 supersession fan-out); they are not owed until those stages land and so are out
of scope for this backlog.

## Sequencing

Recommended order — highest SME value first, reusing the standalone-embed target as it grows:

1. **SPEC-05 band pill** — *done* (pattern-setter; establishes the embed + article convention).
2. **SPEC-05 provenance chip + K10 refusal** — completes the Stage-1 SME-first triad (comms plan
   §12 Checkpoint 1 tests exactly these); one article, `provenanceChip` + `refusalBanner` embeds.
3. **SPEC-07 verdict playground** — the four-stop honesty made playable; the single most persuasive
   embed for the banded-scoring thesis.
4. **SPEC-09 least-worst explorer** — thesis B's argument surface, hands-on.
5. **SPEC-06 stamp determinism** and **SPEC-01/02 store + trace** — the foundation mechanics; lower
   SME drama, still owed for completeness.

## Notes on the embed target

- The standalone-embed build target (`scripts/build-embeds.ts`, `npm run embeds`) currently bundles
  **one** component: the band pill. Each owed *live-component* article extends it with one more
  component render (the pattern is: import the shipped component, pre-render its reachable states
  over real fixtures, emit a self-contained page — never re-implement the component in browser JS).
- Articles whose substance is an **algorithm** (stamp determinism, verdict flips, least-worst) want
  an *interactive widget* driven by the **real rule**. Where the rule can run client-side unchanged
  it is a live component; where it cannot, the honest fallback is an illustrative widget labelled as
  such (§6.2 rule 1), or a pre-rendered state set swapped by the reader (as the band-pill embed does).
