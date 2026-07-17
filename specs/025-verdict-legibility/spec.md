# Feature Specification: Verdict legibility & the argument surface (SPEC-25)

**Feature Branch**: TBD at pickup (spec authored on `claude/jipoe-c2-process-review-g4kwfn`; spec dir `025-verdict-legibility`)

**Created**: 2026-07-15

**Status**: Draft — queued (US2 gates on the research note below; US1/US3/US4/US5 are presentation over existing outputs)

**Input**: JIPOE/C2 process review (`docs/reviews/2026-07-14-jipoe-c2-process-review.md` §3.1, §3.3, mockups M3/M4/M8/M10, addendum §10 slice S-F). Five legibility moves over existing machinery, ordered by priority: **(1)** a **public verdict legend** — a small, always-available diagram mapping margin-band position → four-stop verdict, the O-3 threshold sweep as its illustration, with the honest disclosure that `marginal` fires only at exact band-edge/threshold coincidence (measure-zero in continuous domains); the wargaming precedent is the hex-game Combat Results Table, the oldest public-outcome-table UI there is — the mapping itself inspectable, never a hidden judgement; **(2)** **consequence preview** — arm any mutating act (resolve, supersede, waiver grant, plan edit) and see the real verdict-matrix ghost-diff *before* commit, computed by the live in-browser pipeline (SPEC-16/19), the Into-the-Breach telegraphed-consequence contract applied to knowledge work; **(3)** **relaxation cards v2** — a derived "puts at risk" line (verdict deltas vs the incumbent plan) beneath the `sacrificed` headline, so a candidate that also drags other commitments to `tight` under-describes nothing; plus numbered-reasons formatting (the matrix-game move form: claim, enumerated traceable reasons); **(4)** a **challenge affordance** — on any verdict, one act surfaces the top sensitivity contributors as a key-assumptions check ("leans on K8 — single-source — challenge it"), a re-rendering of `/analyse/sensitivity`, no new compute; **(5)** **per-role action menus** — each tab surfaces its legal verbs (J-2: collect/contest/resolve/supersede; planner: compile/generate/relax; commander: select/waive), making the C2 role separation legible as different action sets.

**Research Note**: `docs/research/14-legibility.md` (DEC-11 gate for **US2 only** — decides the preview honesty rules; US1/3/4/5 build on the note-09 presentation audit already banked)

**Register Decisions Restated**: DEC-15/G2 (margin bands render as bands; verdicts as the four stops), DEC-19 (no totals, no weights — the legend explains a mapping, never a score), DEC-33 (edits are service calls, honest-by-refusal), DEC-34 (glow = G6 made visible), DEC-32 (four-tab shell — menus refine it, don't fork it)

**Register candidates** *(flagged, not asserted — to be recorded in `docs/assay-concept.md` §6 before build)*: (1) the **consequence-preview interaction class** (a new kind of read: "what would this write change" — the honesty rule is *previewed = computed, never estimated*); (2) per-role action menus **if** they change the write surface (pure re-arrangement of existing affordances may not need one — the note settles it). The legend, cards v2, and challenge affordance are re-renderings of existing computed outputs and are expected to be register-neutral.

## Honesty stance

Legibility work is where a demonstrator drifts into theatre. Three rules bind the slice: the legend explains the **mapping**, never re-scores (it renders the O-3 sweep from the frozen oracle, not from live data); the preview is the **real pipeline on a shadow state** — same services, same firewall, nothing persisted, no delta, no stamp mutation, and the previewed diff must equal the post-commit diff byte-for-byte (G1 makes this testable: preview set ≡ subsequent glow set); and the challenge affordance surfaces **computed** sensitivity, never an opinion — the UK Red Teaming Handbook's warning applies verbatim: lip-service challenge instils more confidence than none.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — The public verdict legend (Priority: P1)

Any viewer opens a small legend showing the margin band against a threshold and the four verdicts as regions of the mapping — robust `m_lo>0`, marginal `m_lo=0≤m_hi`, tight `m_lo<0≤m_hi`, violated `m_hi<0` — illustrated by the O-3 sweep (verdict changes only at band edges 9 and 13, never inside), with the `marginal`-is-edge-coincidence disclosure footnoted.

**Why this priority**: The single cheapest answer to "is the verdict a hidden judgement?" — the mapping made public, CRT-style. It is also where §3.1's honesty disclosure about `marginal` belongs.

**Independent Test**: Render the legend; assert the four regions, the O-3 illustration values ([9,13] against a swept threshold), and the marginal footnote; assert the legend is reachable from every surface that renders a verdict and is keyed into `legends.ts`.

**Acceptance Scenarios**:

1. **Given** any verdict cell, **When** the viewer asks "why this word", **Then** the legend is one act away and the O-3 sweep shows the mapping's honesty property (edges-only changes) rather than asserting it.
2. **Given** the legend content, **Then** it derives from the frozen oracle constants (a change to it is a register/oracle matter), not from live data.

---

### User Story 2 — Consequence preview: the ghost diff (Priority: P1) 🎯 the substantive build

An operator arms a mutating act — resolve K12, supersede K5 with K9, grant a waiver, apply a plan edit — and sees, before committing, the real diff: which matrix cells change verdict, which margins move (band-to-band), which panels would glow. Rendered as an unmistakably *uncommitted* ghost layer ("previewed — not applied"). Commit then applies exactly what was previewed; cancel leaves no trace.

**Why this priority**: The strongest interaction borrowing available (review §6.2): consequences telegraphed before commitment, honest because it is the live pipeline, not an estimate.

**Independent Test**: Arm the K12a-resolve preview; assert the ghost-diff set; commit; assert the actual changed-hash set (the glow set, DEC-34) equals the previewed set exactly; cancel path: arm, cancel, assert store/deltas/stamps byte-identical to before arming.

**Acceptance Scenarios**:

1. **Given** an armed preview, **When** it computes, **Then** it runs the real services against a shadow of the store (same firewall — a dishonest armed edit *previews its refusal*), persists nothing, emits no delta, mutates no stamp.
2. **Given** a committed previewed act, **Then** previewed diff ≡ actual diff (byte-equal cell/verdict sets; G1 guarantees it, a test asserts it).
3. **Given** the ghost rendering, **Then** every previewed value is banded/four-stop as ever (G2 applies to hypotheticals too) and visually distinct from committed state (no chance of reading a ghost as fact).

---

### User Story 3 — Relaxation cards v2: "puts at risk" + numbered reasons (Priority: P2)

Each relaxation card gains a derived second line — the commitments its candidate degrades short of violation (verdict deltas vs the incumbent plan, e.g. robust→tight) — beneath the `sacrificed` headline; and the card body renders as numbered, individually-traceable reasons (the matrix-game move form).

**Why this priority**: §3.3's finding — `sacrificed` ≡ violated-only under-describes a candidate that drags two other commitments to the edge. The risk residue exists in the matrix; the card should carry it.

**Independent Test**: On the R3m relaxation set, assert each card shows its derived at-risk line computed from verdict deltas (pinned per fixture), that `sacrificed` semantics are unchanged, and that each numbered reason opens its trace (G3).

**Acceptance Scenarios**:

1. **Given** a candidate whose non-sacrificed verdicts degrade vs the incumbent, **Then** the card lists exactly those degradations (word-to-word verdict movement, margin bands on demand) — derived, never authored.
2. **Given** the card, **Then** `sacrificed` still means exactly the violated set (SPEC-09 unchanged) — the at-risk line is additive presentation.

---

### User Story 4 — The challenge affordance (Priority: P2)

On any verdict, one act ("challenge") surfaces the top sensitivity contributors for that verdict — which knowledge, pushed to its band edges, flips it — with single-source flags co-displayed; each contributor links to its knowledge row where the existing lifecycle acts (contest, collect, refresh) live.

**Why this priority**: An automated key-assumptions check at the point of reading — the review's M8, honest because it re-renders `/analyse/sensitivity` (SPEC-11) rather than opining.

**Independent Test**: Challenge a C4 verdict; assert the contributors match the SPEC-11 ranking restricted to that verdict (K8 present with its single-source flag); assert no new computation semantics (same stamps as an equivalent sensitivity call).

**Acceptance Scenarios**:

1. **Given** a challenged verdict, **Then** contributors render with band-edge movement evidence and flags, and deep-link to S1 rows — the affordance *routes* challenge, it does not adjudicate it.
2. **Given** a verdict no knowledge flips (insensitive), **Then** the honest answer renders ("no single band-edge movement flips this") — itself assurance, never padded.

---

### User Story 5 — Per-role action menus (Priority: P3)

Each tab presents its legal verbs as a menu (J-2: create/contest/resolve/supersede/collect-mark; planner: compile/generate-handful/relax/score; commander: select/waive; observer: none — read and trace only), replacing uniform-toolbar ambiguity. No verb's semantics change; the shell arranges what the seam already permits.

**Why this priority**: The business-process point made legible in the shell — who may do what is C2 structure, and today it is implicit.

**Independent Test**: Assert each tab's menu equals the seam's legal write set for that role per the walkthrough's role assignments; assert the observer tab exposes no writes; assert no previously-available act was silently removed (menus reorganise, never restrict, unless the note says otherwise).

**Acceptance Scenarios**:

1. **Given** each tab, **Then** its menu matches the documented role verbs, legend-keyed, and every menu act routes through the same gated services as before (DEC-33).

---

### Edge Cases

- **Preview of an act that triggers a refusal**: the refusal *is* the preview (banner in ghost form) — arming a dishonest edit teaches the firewall without a commit.
- **Preview atop a stale/mixed-stamp view**: the comparability guard applies first; no ghost renders over greyed cells.
- **Two armed previews**: v1 permits one armed act at a time (stated); arming a second cancels the first visibly.
- **Challenge on a verdict from an un-scored plan/world combination**: nothing to challenge; the affordance is absent, not erroring.
- **Legend in wall-projection mode**: the legend obeys `data-projection="wall"` sizing like every component (SPEC-17).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The legend MUST render the four-stop mapping from frozen oracle constants with the O-3 sweep and the marginal disclosure; reachable wherever verdicts render; keyed in `legends.ts`.
- **FR-002**: Preview MUST execute the real services over shadow state: no persistence, no delta, no stamp mutation, full firewall; previewed diff MUST equal post-commit diff (tested byte-equal); cancel MUST leave state byte-identical.
- **FR-003**: Ghost rendering MUST be unmistakably uncommitted, banded/four-stop throughout (G2), and MUST pre-figure exactly the glow set (DEC-34 consistency).
- **FR-004**: Cards v2 MUST derive the at-risk line from verdict deltas vs the incumbent; `sacrificed` semantics unchanged; numbered reasons individually trace-walkable (G3).
- **FR-005**: The challenge affordance MUST re-render SPEC-11 output scoped to the verdict, flags co-displayed, no new compute semantics, honest insensitive-state message.
- **FR-006**: Role menus MUST equal the seam's legal write set per role; observer read-only; all acts route through existing gated services (DEC-33); nothing silently removed.
- **FR-007**: No element of this slice may introduce a score, total, weight, or urgency scalar (DEC-19); presentation only ever re-renders computed, traceable output.

### Key Entities

- **PreviewState** (app-layer only: `{armed_act, shadow_result, ghost_diff}` — never stored, never stamped; the register candidate's subject).
- Touches: `src/app/{state,shell,glow}.ts` (preview + menus), `src/components/{legends,s2Matrix,s3Cards}.ts` (legend hook, ghost rendering, cards v2), a thin `src/preview.ts` orchestrator over existing services, tests.
- No schema change; no seam change (preview is client-side orchestration of existing service calls over shadow state — if the note finds a seam-level preview contract cleaner, that is a further candidate).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Legend live on all verdict surfaces with O-3 illustration and marginal disclosure, oracle-derived.
- **SC-002**: Preview-equals-commit proven in test for resolve, supersede, waiver, and plan-edit acts; cancel leaves byte-identical state; refusal-preview renders.
- **SC-003**: R3m cards carry pinned at-risk lines; numbered reasons trace-complete.
- **SC-004**: Challenge on C4 surfaces K8 with single-source flag, matching SPEC-11 output; insensitive verdicts message honestly.
- **SC-005**: Role menus match documented role verbs; observer read-only; typecheck/tests clean; components remain pure (SPEC-14).

## Assumptions

- The store's immutability makes shadow state cheap (an overlay of uncommitted objects over the real store); no store refactor is in scope.
- US2 may split into its own slice if it balloons — US1/3/4/5 ship independently as thin projections; the priorities above encode that.
- The note-09 presentation audit's scripting rules extend to ghosts (no presenter narrates a previewed midpoint); presenter notes updated in the same change.
