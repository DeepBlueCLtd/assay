# Merged-PR review script — the 12–13 July burst

**For:** a desktop review pass over everything that landed on `main` while you were on the tablet.
**Scope:** 14 PRs merged 2026-07-12 → 2026-07-13 (#14 → #27). All are already merged; this is a
*post-merge* confirm-and-decide pass, not gatekeeping. Two things genuinely wait on you — a design
fork and a register batch — and they're called out in **§5 Decisions owed**. Everything else is
"look, tick, move on."

> Work top-to-bottom, or jump to **§5** first if you only have ten minutes — that's where the
> decisions live; the rest is verification.

---

## 0. How to run this review (all in a browser — no terminal needed)

You're reviewing from a browser against the **hosted GitHub Pages site**, not a local checkout. Two
tabs are all you need:

1. **The live site** — the demonstrator's surfaces you click through:
   `https://deepbluecltd.github.io/assay/`
   Pages must be set to *Deploy from a branch → `gh-pages` / (root)* for this to serve — if the URL
   404s, that's the one-time setup PR #17 flagged (see §5.4), not a broken build.
2. **The repo on GitHub** — for reading research notes, docs, and code where a card says "read":
   `https://github.com/DeepBlueCLtd/assay` (open any file in the web UI; PRs are at `/pull/N`).

CI already did the mechanical checks for you — **all three checks are green on `main`** (Tests, Static
analysis with the generated-types drift guard, and the Pages build), so you don't need to run
`typecheck`/`test` yourself. Everything below is about *reading intent and clicking the surfaces*, not
chasing red. (If you do end up at a terminal, the equivalents are `npm run typecheck`, `npm test` →
199 passed, `npm run build:site`.)

**Live-site surface map** — bookmark these; the cards below link into them:

| Surface | Live URL |
|---|---|
| Home / overview | `https://deepbluecltd.github.io/assay/` |
| Component gallery | `https://deepbluecltd.github.io/assay/gallery/` |
| Role wireframes | `https://deepbluecltd.github.io/assay/wireframes.html` |
| **Live SPA (SPEC-16)** | `https://deepbluecltd.github.io/assay/assets/app/` |
| Flow infographic (swimlane) | `https://deepbluecltd.github.io/assay/flow.html` |
| Flow schematic (engine idiom) | `https://deepbluecltd.github.io/assay/flow-schematic.html` |
| Blog | `https://deepbluecltd.github.io/assay/blog/` |

> **Reading code/docs in the browser:** each merged PR is at `.../assay/pull/N` (the *Files changed*
> tab shows the diff); research notes are at `.../assay/blob/main/docs/research/NN-name.md`. Where a
> card says "read `src/…`" or "read the research note", open it in the GitHub web UI — no clone needed.

---

## 1. Track A — Infrastructure (quick ticks)

These two are plumbing. Read the PR, confirm the workflow files exist, move on.

- [ ] **#14 — CI: tests + static analysis on push/PR** (`.github/workflows/ci.yml`)
  - What: first CI. Runs `typecheck`, a **generated-types drift check** (`npm run gen` then fails if
    `src/generated` differs from committed), and `npm test`. Node 22, least-privilege perms.
  - Look: the Actions tab — is CI green on recent commits to `main`?
  - Note: "lint" in the SPEC-05 docs is the *domain* confidence→band-width lint, not ESLint. There's
    deliberately no code linter. Fine.

- [ ] **#17 — GitHub Pages publish + PR previews** (`.github/workflows/{deploy-pages,pr-preview}.yml`, `scripts/build-site.ts`)
  - What: `main` publishes `site/` to `gh-pages` root; each PR gets a preview under `pr-preview/pr-N/`
    with a comment link. `clean-exclude: pr-preview/` keeps main deploys from wiping open previews.
  - **Action needed:** confirm repo **Settings → Pages** is set to `gh-pages / (root)`. The `gh-pages`
    branch started as a stale PR#2 snapshot; the first main deploy replaces it.
  - Note: fork PRs get no preview (by design — avoids `pull_request_target`). Fine.

---

## 2. Track B — The computational spine (the honesty-critical core)

This is the real substance: Knowledge → Compile → Score → Handful → Relax. Review in build order.
Each landed with a research note (the DEC-11 gate) and the vignette oracle as an independent check.
For each, the *one thing to actually verify* is the honesty invariant, not the code volume.

**Two browser tabs cover this whole track:** the **component gallery**
(`https://deepbluecltd.github.io/assay/gallery/`) renders each stage's live "demo moment" from the
*actual* services (S1 refusal table, "contested never compiles", the honest four-stop matrix, the
generated handful, the three least-worst cards) — so the honesty invariants are visible there, not
just in tests. Where a card says "read the research note" or "read `src/…`", open it in the GitHub web
UI (`.../assay/blob/main/…`). No local run required.

- [ ] **#15 — SPEC-05 knowledge service & encoding discipline** (Stage 1) — *closes #10*
  - Core: `src/{seam,deltas,encoding,lint,knowledge}.ts` + `components/{refusalBanner,s1Table}.ts`.
  - The point: refusals are **first-class values, not thrown errors**; the §9 firewall
    (`assumption`+`hard_constraint` → `encoding_violation`; `reported`/`assessed`+`hard_constraint`
    → `waiver_required`); one delta per act; the `at` field is display-only (never hashed).
  - Verify by reading: K10 refuses and **persists nothing** (0 objects/edges/deltas); K8 waiver
    visible; K9 supersedes exactly `{K5}`; K12a/b contested ⇒ not compilable until resolve.
  - ⚠️ **Frozen-vignette edit to confirm you're happy with:** K10 was changed from `assessed` →
    `assumption` in `fixtures/knowledge.json` and `docs/assay-vignette.md` (it was refusing
    `encoding_violation`, which is impossible for `assessed` under the firewall — a real contract
    defect). PR says this was confirmed with you before touching the frozen vignette. Just re-confirm
    you remember agreeing.

- [ ] **#16 — SPEC-06 compile service, sparse channels** (Stage 2)
  - Gate: `docs/research/02-compile.md` — decides the **sparse channel representation** (dense world
    was ~1.2M cells → 84.9 MB, ~19.4 s/recompile; not viable). Retires dense `Channel.cells`.
  - ⚠️ **Schema change:** `Channel` is now `{name, kind, default: Band, regions: RegionOverride[]}`;
    new `RegionOverride` and `VignetteConfig`. Types regenerated. **This is a flagged register
    candidate (concept §6 item 12), built under seam open-item-2 delegated authority** — see §5.
  - Verify: K12 contested ⇒ compile refuses ⇒ resolve ⇒ recompile; **byte-identical stamp** for
    identical inputs (order-independent); every channel traces to named knowledge via `compiled_into`
    + `source`. Nothing dense is ever stored or hashed.

- [ ] **#19 — SPEC-07 the scorer, four-stop verdicts** (Stage 3, the DEC-10 linchpin)
  - Gate: `docs/research/03-score-plan.md` — the **four-stop mapping as signed margin bands,
    signs-only**: robust iff `m_lo>0`, marginal iff `m_lo=0≤m_hi`, tight iff `m_lo<0≤m_hi`, violated
    iff `m_hi<0`. Claimed to be the *unique* O-3-satisfying rule with no interior cut (no midpoint,
    DEC-15).
  - **Highest-value read of the whole batch:** confirm the oracle reproductions by eye —
    O-1 `2+[4,6]+[3,5]=[9,13]`; O-2 `[9,13]` vs `at_most 28` ⇒ robust, margin `[15,19]`; O-3
    `[9,13]` vs `at_most 12` ⇒ tight, and the 8→14 threshold sweep flips **only at band edges 9/13**.
    These are hand-computed and must never be regenerated from the implementation — check the test
    constants are literals, not derived (`src/interval.ts`, oracle tests).
  - G6 (propagation honesty): superset-under-widening property test via `fast-check`.

- [ ] **#20 — SPEC-08 handful generator + banded non-domination** (Stage 3)
  - Gate: `03-score-plan.md` §5 — **banded ε-non-domination** (`A ⪯ B` iff `A.hi ≤ B.lo`) + Meridian's
    four generation axes. Reuses the SPEC-07 scorer, does **not** re-implement it.
  - The honesty claim to check: the organiser **never invents precision** — overlapping bands are
    honestly incomparable and both survive; no scalar total / weighted sum / midpoint decides
    membership; `distinct_because` is *derived*, not captioned.
  - Verify: `/plan/handful` on base world returns **4 genuinely distinct** plans (each pair mutually
    non-dominated; approach trades C1↔C2, suppression trades C3↔C4); same stamp+seed ⇒ identical
    handful (G1).

- [ ] **#21 — SPEC-09 relaxation / least-worst under infeasibility** (Stage 4, thesis B live)
  - Gate: `docs/research/04-relaxation.md` — **preemptive lexicographic priority over must/should/
    prefer tiers, NO numeric weights** (weighted CSP / MAX-SAT / goal programming rejected on
    *honesty* grounds, DEC-19). Returns the **inclusion-minimal correction-set frontier**, not one
    optimum; `sacrificed` = exactly the `violated` set; content-neutral **stated** tie-break for
    same-tier sacrifices.
  - Verify: `/relax` over R3m returns **three** least-worst candidates sacrificing C4, C3, C2 — each
    `sacrificed` non-empty and *computed* (re-scoring violates exactly its set); the `must`-sacrifice
    (C2) ranked **last but present** (G4: never silence); C3/C4 tie **stated** in `tie_break`.
  - ⚠️ Course-correction to notice: the SPEC-08 BASE generator routes clear of the mined water and
    can't enter it, so SPEC-09 **authors** an R3m-responsive candidate set (`src/relaxCandidates.ts`)
    while sacrifices stay *computed* by the scorer. Confirm you're comfortable that the candidates are
    authored (route latitude) but the verdicts on them are not.

---

## 3. Track C — Public surfaces & comms

- [ ] **#18 — Public Home page** (`docs/assay-home.html`)
  - Self-contained, static, theme-aware (light+dark), reuses the band-pill/four-stop colour language.
  - Look on the live site `/`: spine diagram status colours, thesis chips, progress tracker. Guardrail:
    nothing shown "done" that the repo doesn't contain.
  - ⚠️ Flagged candidate **concept §6.12** — a per-spec "home-page-currency" step in the definition of
    done. Wired provisionally into comms §9 + tasks template, pending ratification — see §5.

- [ ] **#23 — SPEC-16 interactive surfaces (the live SPA)** — *the headline surface change*
  - Was a static build-time snapshot; now a **live SPA running the real pipeline in-browser** (esbuild
    bundle, framework-free). `src/app/{state,shell,glow,bootstrap}.ts` + `src/traceView.ts` +
    `src/components/legends.ts`. The eight `src/components/*` stayed **pure** (SPEC-14 extractability
    intact). No schema change.
  - **Drive it live at `/assets/app/`** (this is the fun one to actually click):
    1. It opens on a live contest → planner **refuses** to compile (G5). Good.
    2. Resolve K12 on the J-2 tab → the planner + commander tab buttons **glow**, the matrix panel
       glows and recomputes. The glow is G6 made visible: a panel glows **iff** a content-hash it
       depends on changed — resolving K12 should glow the **K12a row only**, not K1–K9.
    3. Open the "informs / influenced by" menu on an item (e.g. K1) → one-hop up/downstream.
    4. Try a **dishonest edit** (push a band to a bare scalar) → first-class refusal, persists nothing
       (G2).
  - Register: flagged candidates **§6 items 14/15/16** (tabs/SPA; live pipeline + editable surfaces via
    the shell/pure split; glow=G6). See §5.

- [ ] **#22 — Comms/blog scaffold** (`docs/status.yml`, `scripts/build-{site,embeds}.ts`, `docs/blog/`)
  - `docs/status.yml` is now the **single source of truth**; `build-site.ts` enforces §5 honesty gates
    at build time (Home page must carry the current-stage label; no stage `building`/`done` with its
    research note unpublished — the DEC-11 gate made mechanical). Drift **fails the build**.
  - First article: *"The band pill: why a range is more honest than a number"* with a live embed of the
    **shipped** band pill (not a re-implementation). Read it on `/blog/` — does the honesty framing land?
  - ⚠️ Flagged candidate **concept §6.14** — comms artefacts are a *third* slice category (project work
    that *reports* shipped work, never a spec-kit feature); also records the Jekyll→static-assembler
    build-path divergence. See §5.

---

## 4. Track D — The flow infographic (⚠️ contains a decision fork)

Three PRs, landed as a set. **#26 and #27 ship two different visual idioms of the *same* spec, side by
side, deliberately — you're meant to pick one and retire the other.** This is the main decision (§5.1).

- [ ] **#25 — Flow infographic: spec + wireframes (proposal)** — docs-only
  - `docs/assay-flow-infographic-spec.md` + `docs/assay-flow-infographic-wireframes.html`. The reframe:
    not a new capability, it's **S4 Bridge grown into an explainer** — arranges what the seam already
    offers, computes nothing of its own. Raises the four behavioural candidates (concept §6.15).
  - Read this first — it's the shared spec both renderings below implement.

- [ ] **#26 — Built interactive flow-view (role-swimlane idiom)** — `/flow.html`
  - `src/flow.ts` + `src/flowPage.ts` + `scripts/build-flow.ts`. Drives the **real** seam over the
    frozen Meridian tableau, pre-rendered at build time (blessed band-pill embed pattern: no runtime
    crypto, no bundler, zero network). Three zoom layers (L0/L1/L2) + tour + bounded sandbox.
    Acceptance AS-1..AS-11 are real tests (`tests/flow.test.ts`, +12).
  - Drive it: L0/L1/L2 zoom, tour beats 0→6 (contest refusal + gate pulse at beat 2, three least-worst
    cards at beat 5), sandbox toggles. Unbuilt computations (staleness fan-out, `/select`) are visibly
    labelled **"scripted — not yet computed"**, never faked (DEC-4).
  - **Idiom:** four horizontal role lanes, organised by *who acts*, read as a sequence.

- [ ] **#27 — Flow schematic (engineering-schematic idiom)** — `/flow-schematic.html`
  - `docs/assay-flow-schematic-wireframes.html`. Same spec, same seam, same frozen tableau — different
    skin: the demonstrator drawn as **one apparatus** (motor/power-station style), organised by *the
    flow itself*: knowledge piped in left → process stations `compile → score → relax → select` →
    gates as inline decision valves, every value on a gauge, refusals as honest-outcome terminals.
  - Justified as a peer node-link projection (research note 07 §3 already blesses node-link/PROV).
    Asserts no new decision.

➡️ **Open both `/flow.html` and `/flow-schematic.html` side by side and decide the idiom (§5.1).**

---

## 5. Decisions owed (do these — the rest above is just verification)

### 5.1 — Pick the flow-infographic idiom  ⭐ the main call

#26 (role swimlane) and #27 (engineering schematic) are **two idioms of the same spec**, shipped as a
design fork *from concrete artefacts*, not a replacement. The intent is: look at both, choose one,
retire the other. `assay-flow-infographic-spec.md` §5 currently names both wireframes as **peers**
(neither supersedes the other until you choose).

- [ ] Open `/flow.html` (swimlane) and `/flow-schematic.html` (engine) together.
- [ ] Decide: swimlane, schematic, or a hybrid direction.
- [ ] Tell me the pick — I'll retire the loser, collapse the "peers" note in the spec §5, and (if the
      schematic wins) port the interactive tour/sandbox from #26 onto it since #27 is currently the
      more wireframe-y of the two.

### 5.2 — Ratify (or reject) the flagged register candidates  ⭐ the register debt

Per **register-first (DEC-2)**, several PRs built against *flagged candidates* under delegated
authority rather than asserting decisions in peer docs. They're waiting for a register batch. This is
the "ratify-after debt" the CLAUDE.md phase line mentions. Walk `docs/assay-concept.md §6` and rule on:

- [ ] **§6 item 12 — sparse-channel schema** (from #16). Retires dense `Channel.cells`. *Landed schema
      change* — worth an explicit yes.
- [ ] **§6.12 — home-page-currency step** in each spec's definition of done (from #18).
- [ ] **§6.14 — comms as a third slice category** + Jekyll→static build-path divergence (from #22).
- [ ] **§6 items 14/15/16 — SPA / live in-browser pipeline / glow=G6** (from #23).
- [ ] **§6.15 — the four flow-view behavioural candidates** (auto-recompute is attribution-visible;
      viewer-driven sandbox writes; map/geospatial panel home; the deferred silent "you-are-the-
      optimiser" toggle) (from #25/#26).
- [ ] Say the word and I'll draft the next **register batch** (ASSAY-DEC-28…) recording your rulings and
      batch-propagate the peers, exactly as batches 1–3 were done.

### 5.3 — Confirm the two frozen-tableau / authored touches

- [ ] **K10 `assessed`→`assumption`** vignette edit (#15) — you reportedly approved it; just re-confirm.
- [ ] **Authored R3m relax candidates** (#21) — candidates authored (route latitude), verdicts computed.
      Confirm that split sits right.

### 5.4 — One-time ops

- [ ] Set **Settings → Pages → `gh-pages` / (root)** if the live URL isn't serving yet (#17).

---

## 6. Not part of this batch — open queue (for awareness)

Open issues you may want to schedule after the review, but which the merged PRs don't touch:

- **#24** — Horizon: focused transitive dependency-graph view (upstream/downstream for a chosen item).
  Filed *from* your SPEC-16 review comment; substrate (`traceView` orientation map + `TraceStore.walk`)
  is now in place, so it's cheap. Presentation-only work remaining.
- **#12** — Hand the four REMIT register candidates across (DEC-3 channel) — FIND-1..4, owner you/REMIT.
- **#11** — SME Checkpoint 1 against the Stage-1 exit (comms §12) — invitations have lead time.

---

### How to give me the outcomes

Fastest path: reply per section — e.g. *"5.1: schematic. 5.2: ratify all except §6.15's silent-toggle,
reject that. 5.3: both fine. 5.4 done."* I'll turn that into the register batch + idiom cleanup in one
change.
