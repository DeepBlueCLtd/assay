# ASSAY — Communications Plan

Status: draft for review · v0.1 · 2026-07-11
Authority: ASSAY-DEC-9 (banded honesty — re-derived here as *communications* honesty), ASSAY-DEC-2 (register discipline; the site surfaces the register, never replaces it), ASSAY-DEC-7 (theses as explorations; the site reports thesis *state*, not thesis *products* claimed as shipped).

The vehicle is a **public GitHub Pages site** whose single job is to communicate ASSAY's goals and demonstrate its progress — honestly, always-current, and doctrinally literate — to the audiences who will judge it. The site is not a product page; it is the demonstrator's accountable public face, and it inherits ASSAY's signature discipline: **nothing is shown as done that is not, and nothing assessed is shown as fact.**

---

## 1. Principles (the site's restatement of the register)

1. **Communications honesty mirrors ASSAY-DEC-9.** The banded-honesty invariant — no assessed quantity rendered as fact — has a communications analogue: no *planned* capability rendered as *shipped*. Every goal, thesis, and stage carries an explicit status. A stakeholder seeing "done" against something that isn't discredits the site the way a false-precision number discredits the pipeline.
2. **The site arranges; it does not invent.** As surfaces only project the store (ASSAY-DEC-5), the site only projects the canonical documents and the build's real state. If a page implies progress the repository doesn't show, the page is wrong.
3. **One source of truth for progress.** Progress lives in a single machine-readable status file (`docs/status.yml`); every progress display on the site reads from it. Updating progress is a one-file edit, which keeps the site from drifting into optimism.
4. **Doctrinal literacy over marketing.** The primary audience is SMEs who will test the band pill first. The register voice — precise, sourced, unshowy — is the site voice. No hype adjectives; claims trace to a document or a research note.
5. **Demonstrator, not product.** Every page frames ASSAY as an exploration of theses over a shared spine (ASSAY-DEC-1/7), on a deliberately fictional vignette (ASSAY-DEC-8). The site says so plainly and repeatedly.

## 2. Audiences

Primary is SME-facing; the site serves three concentric rings.

| Ring | Audience | What they come for | What convinces them |
|---|---|---|---|
| Primary | **Doctrine SMEs** (J-2/J-3/commander backgrounds) | Is the JIPOE/planning treatment honest and doctrinally real? | The vignette, the banded-honesty stance made visible, the research notes citing JP 2-01.3 / ICD 203 |
| Secondary | **Stakeholders & observers** | Where is this, and is it moving? | The stage tracker, the spine-complete gate, a dated updates feed |
| Tertiary | **Design/dev & REMIT team** | Decisions, architecture, re-derivation findings | The register, the architecture summary, REMIT-narrative findings |

The site is written for the primary ring; the secondary ring is served by the roadmap page reading cleanly at a glance; the tertiary ring is served by deep links to the canonical set.

## 3. What we communicate — and what we deliberately don't

**We communicate:**
- **Goals** — the central premise (JIPOE knowledge made typed, quantified, honestly exploitable) and the thesis catalogue A–H with each thesis's *state* (planned / explored / horizon / deferred).
- **Progress** — the seven build stages and the spine-complete gate as a live tracker; research notes as they are published; a dated updates feed at milestone cadence.
- **The vignette** — enough of Meridian Archipelago that a visitor can follow any demo narrative.
- **The demo** — the existing wireframes now; the live in-browser demonstrator once the spine-complete gate passes.
- **The reasoning** — the decision register and the research-first discipline, as evidence the work is accountable.

**We deliberately do not communicate:**
- Anything read as a delivery commitment or date beyond the stage the repo actually shows.
- Thesis *claims* stated as proven — a thesis is "explored," never "true."
- REMIT internals beyond the re-derivation findings intended for external view.
- Any suggestion of real-world operational applicability; the fictional-vignette framing is load-bearing and stated on every relevant page.

## 4. Site architecture (information architecture)

Seven pages, each a projection of a canonical source. Kept flat and few — a demonstrator's site earns trust by being scannable, not sprawling.

| # | Page | Projects from | Job |
|---|---|---|---|
| 1 | **Home / Overview** | `assay-concept.md` §1 | The premise in one screen; the honesty stance; a current-stage badge and "demonstrator, not product" framing. |
| 2 | **Goals & Theses** | concept §1 (thesis table) | The A–H catalogue with per-thesis state and one-line claim; the five demo narratives named. |
| 3 | **Roadmap & Progress** | `assay-build-plan.md` + `docs/status.yml` | The seven stages as a tracker with exit criteria; the spine-complete gate; research-notes index; the updates feed. |
| 4 | **The Vignette** | `assay-vignette.md` (when authored) | Meridian Archipelago: setting, forces, the engineered conflicts each narrative exercises. |
| 5 | **Demo** | `assay-ui-wireframes.html`, `assay-ui-design.md`, the SPEC-14 gallery | Embedded wireframes of the four surfaces now; the fixture-backed component gallery as it lands (real Meridian objects, honestly labelled as components-not-product); the live demonstrator post-gate. |
| 6 | **Register** | `assay-register.md` (when split out) | The DEC log — transparency is the project's signature, so the decisions are a feature, not an appendix. |
| 7 | **Documents** | canonical set | Linked index of the canonical documents with status and version. |

## 5. Progress mechanism — the single status file

Per the chosen approach, one file is the source of truth; the Roadmap page (and the Home badge) render from it. This is the communications analogue of the content-addressed store: one authoritative object, many projections.

`docs/status.yml` (illustrative schema):

```yaml
# Single source of truth for all progress shown on the site.
# Editing this file is the ONLY way progress changes on the site.
updated: 2026-07-11
current_stage: 0            # 0..7, the stage in flight
gate_passed: false          # the spine-complete gate

stages:
  - id: 0
    name: Foundations
    status: research         # not-started | research | building | done
    research_note: docs/research/00-foundations.md
    research_published: false
  - id: 1
    name: Knowledge capture & discipline
    status: not-started
    research_note: docs/research/01-knowledge.md
    research_published: false
  # ...stages 2..7 as in assay-build-plan.md

theses:
  - id: A
    name: Pipeline
    state: planned           # planned | explored | horizon | deferred
  - id: G
    name: Interdependency
    state: horizon
  # ...B..H per concept §1

updates:                     # newest first; the dated feed
  - date: 2026-07-11
    note: Communications plan drafted; site scaffold pending review.
```

**Why this shape.** `status` values map to the build plan's own rhythm (research-first, then build, then exit); a stage cannot honestly show `building` before its research note is published, and the schema makes that visible. Thesis `state` reuses the register's own vocabulary so the site never invents a claim stronger than the register makes. The `updates` list is the changelog and needs no separate CMS.

**Honesty guardrail baked in:** the tracker renders `research_published: false` as an unmet precondition, so a stage marked `building` without its note shows as an inconsistency on the site itself — the site polices its own optimism.

## 6. Honesty guardrails (the site's version of the banded seam)

- **Status everywhere.** No thesis, stage, or goal is shown without an explicit state label. There is no unlabelled "done."
- **Fictional-vignette disclaimer** on Home, Vignette, and Demo pages: Meridian is engineered fiction (ASSAY-DEC-8); nothing here reflects any real operational picture.
- **"Assessment, not fact"** carried into copy: theses are *explored*, not proven; the site never claims a thesis result as established.
- **Dates are descriptive, not promissory.** The updates feed dates what *happened*; the roadmap shows *where we are*, never a delivery date the repo can't back.
- **Every claim links to its source** document or research note — the site's equivalent of a trace chain terminating in a named object.

## 7. Technical implementation (recommendation for the build pass)

- **Hosting:** GitHub Pages, served from `/docs` on the default branch (keeps site and canonical docs co-located; no `gh-pages` branch to drift). Public, per the SME-facing decision.
- **Generator:** Jekyll (Pages-native, zero extra CI) with a minimal, high-legibility theme (`just-the-docs` or a hand-trimmed minimal layout). A small Jekyll data plugin reads `docs/status.yml` so the tracker is data-driven with no JavaScript required.
- **Wireframes:** `assay-ui-wireframes.html` embedded as a static asset on the Demo page; it already renders the four surfaces on Meridian data.
- **Deploy:** built-in Pages-from-branch build (no custom Action needed at first); revisit a GitHub Actions build only if a plugin outside the Pages allowlist is wanted.
- **Diagrams:** Mermaid with pinned theme variables per the repo convention (concept §5), for the spine/architecture picture on the Overview.
- **Voice & visual:** register-document restraint; the band pill and four-stop verdict colour language (ASSAY-DEC-9, ui-design §2) reused as the site's accent system so the site *looks like* the demonstrator's honesty.

## 8. Cadence & ownership

- **On every stage gate** (exit criteria met in the build plan): update `status.yml`, publish the stage's research note to the Roadmap index, add an updates-feed entry. This ties site currency to the build's own gates — no separate reporting ritual.
- **On each research note written:** flip `research_published: true`; the note appears in the index.
- **At the spine-complete gate:** swap the Demo page from wireframes to the live demonstrator; add a milestone entry.
- **Milestones** continue to fire to `ntfy.sh/iancc2025` (concept §5); the updates feed is the durable written record of the same events.
- **Ownership:** the person closing a stage owns that stage's `status.yml` edit — progress reporting is part of "done," not a downstream chore.

## 9. Build plan for the site (next pass, after sign-off)

Mirroring ASSAY's own lap-then-depth discipline:

**Launch sequencing rule.** The site *publishes* no earlier than the first demoable moment (the Stage-1 exit at the earliest, or the SPEC-14 gallery rendering fixture data — whichever lands first). A site showing only plans contradicts §1.1's own honesty principle: with nothing demonstrable, "communicating progress" degrades into promising it. Scaffold, wiring, and population (steps 1–3) may proceed dark at any time; flipping Pages public is gated on having something real on the Demo page.

1. **Scaffold** — enable Pages from `/docs`; Jekyll config; theme; the seven page stubs; `status.yml` seeded from the current build state (Stage 0, gate not passed).
2. **Wire progress** — the data-driven Roadmap tracker and Home badge reading `status.yml`; the research-notes index.
3. **Populate** — Overview, Goals & Theses, Register, Documents from the canonical set; Demo page embedding the wireframes.
4. **Vignette page** — authored when `assay-vignette.md` lands (currently a founding-doc target, not yet written).
5. **Polish** — Mermaid spine diagram; band-pill accent styling; the honesty disclaimers; a scan pass for any unlabelled claim.

## 10. Open questions (candidates for the next register batch)

1. Custom domain, or the default `deepbluecltd.github.io/assay` path?
2. Does the Register page publish the *full* DEC log, or a curated public subset (some entries may reference REMIT internals not for external view)?
3. Should the REMIT-narrative re-derivation findings live on the public site at all, or stay in the canonical set only?
4. Analytics: none (privacy-clean, fits the restraint), or a minimal privacy-respecting counter to evidence stakeholder reach?
5. Does the live demonstrator embed in the Demo page (iframe) or link out, once it exists?

## 11. Success criteria

- An SME landing cold understands, within one screen, what ASSAY claims and that it claims it honestly.
- A stakeholder can answer "where is it and is it moving?" from the Roadmap page alone.
- No page ever shows a capability as delivered that the repository does not contain.
- Updating progress after a stage gate is a single-file edit, and the site reflects it with no other action.
- The site reads as an extension of the register's discipline, not a marketing layer bolted onto it.
