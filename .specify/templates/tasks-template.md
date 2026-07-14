---

description: "Task list template for feature implementation"
---

# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: The examples below include test tasks. Tests are OPTIONAL - only include them if explicitly requested in the feature specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- **Web app**: `backend/src/`, `frontend/src/`
- **Mobile**: `api/src/`, `ios/src/` or `android/src/`
- Paths shown below assume single project - adjust based on plan.md structure

<!--
  ============================================================================
  IMPORTANT: The tasks below are SAMPLE TASKS for illustration purposes only.

  The /speckit-tasks command MUST replace these with actual tasks based on:
  - User stories from spec.md (with their priorities P1, P2, P3...)
  - Feature requirements from plan.md
  - Entities from data-model.md
  - Endpoints from contracts/

  Tasks MUST be organized by user story so each story can be:
  - Implemented independently
  - Tested independently
  - Delivered as an MVP increment

  DO NOT keep these sample tasks in the generated tasks.md file.
  ============================================================================
-->

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create project structure per implementation plan
- [ ] T002 Initialize [language] project with [framework] dependencies
- [ ] T003 [P] Configure linting and formatting tools

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

Examples of foundational tasks (adjust based on your project):

- [ ] T004 Setup database schema and migrations framework
- [ ] T005 [P] Implement authentication/authorization framework
- [ ] T006 [P] Setup API routing and middleware structure
- [ ] T007 Create base models/entities that all stories depend on
- [ ] T008 Configure error handling and logging infrastructure
- [ ] T009 Setup environment configuration management

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - [Title] (Priority: P1) 🎯 MVP

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 1 (OPTIONAL - only if tests requested) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T010 [P] [US1] Contract test for [endpoint] in tests/contract/test_[name].py
- [ ] T011 [P] [US1] Integration test for [user journey] in tests/integration/test_[name].py

### Implementation for User Story 1

- [ ] T012 [P] [US1] Create [Entity1] model in src/models/[entity1].py
- [ ] T013 [P] [US1] Create [Entity2] model in src/models/[entity2].py
- [ ] T014 [US1] Implement [Service] in src/services/[service].py (depends on T012, T013)
- [ ] T015 [US1] Implement [endpoint/feature] in src/[location]/[file].py
- [ ] T016 [US1] Add validation and error handling
- [ ] T017 [US1] Add logging for user story 1 operations

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - [Title] (Priority: P2)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 2 (OPTIONAL - only if tests requested) ⚠️

- [ ] T018 [P] [US2] Contract test for [endpoint] in tests/contract/test_[name].py
- [ ] T019 [P] [US2] Integration test for [user journey] in tests/integration/test_[name].py

### Implementation for User Story 2

- [ ] T020 [P] [US2] Create [Entity] model in src/models/[entity].py
- [ ] T021 [US2] Implement [Service] in src/services/[service].py
- [ ] T022 [US2] Implement [endpoint/feature] in src/[location]/[file].py
- [ ] T023 [US2] Integrate with User Story 1 components (if needed)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - [Title] (Priority: P3)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 3 (OPTIONAL - only if tests requested) ⚠️

- [ ] T024 [P] [US3] Contract test for [endpoint] in tests/contract/test_[name].py
- [ ] T025 [P] [US3] Integration test for [user journey] in tests/integration/test_[name].py

### Implementation for User Story 3

- [ ] T026 [P] [US3] Create [Entity] model in src/models/[entity].py
- [ ] T027 [US3] Implement [Service] in src/services/[service].py
- [ ] T028 [US3] Implement [endpoint/feature] in src/[location]/[file].py

**Checkpoint**: All user stories should now be independently functional

---

[Add more user story phases as needed, following the same pattern]

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] TXXX [P] Documentation updates in docs/
- [ ] TXXX Home-page currency (plans → achievements): if this spec moves a thesis or stage from planned to demonstrated, update `docs/assay-home.html` so the plan reads as an achievement (objectives/theses state + progress tracker), under banded honesty — nothing shown as done the repository does not contain. See comms plan §9 and the flagged candidate concept §6.12. Skip only if the spec demonstrates no new user-visible capability.
- [ ] TXXX Code cleanup and refactoring
- [ ] TXXX Performance optimization across all stories
- [ ] TXXX [P] Additional unit tests (if requested) in tests/unit/
- [ ] TXXX Security hardening
- [ ] TXXX Run quickstart.md validation

---

## Phase FINAL: Blog Article & Evidence *(mandatory — definition of done)*

<!--
  This phase is MANDATORY for every spec — it is part of the definition of done, not
  optional polish. The spec's "Blog & Evidence Plan" section defines the article plan
  and the evidence captures; this phase turns those plans into concrete tasks.

  Evidence screenshots are captured by Playwright during test verification — the
  component is already rendered to verify acceptance scenarios, so the screenshot is
  free. Do not create a separate screenshot pipeline.

  The blog article follows the conventions in docs/blog/README.md. It is committed to
  docs/blog/posts/ and wired into the blog index and status.yml in the SAME PR as the
  feature code. CI handles deployment automatically:
    - PR preview: build-site.ts assembles site/ (including blog/), CI deploys to
      gh-pages at pr-preview/pr-{N}/ — reviewer sees the article live.
    - On merge to main: deploy-pages.yml pushes site/ to gh-pages root.
  The developer NEVER pushes to gh-pages manually.
-->

**Purpose**: Ship the blog article and evidence that make this spec's demo moment visible

**⚠️ NOT OPTIONAL**: A spec without its blog article is not done. The article is planned
in the spec's "Blog & Evidence Plan" section — follow it.

### Evidence capture

- [ ] TXXX **Capture evidence screenshots**: Add Playwright screenshot calls to the acceptance-scenario tests (the component is already rendered for verification). Capture each evidence image defined in the spec's "Evidence captures" list, in both light and dark mode. Output to `docs/blog/evidence/{spec-id}/`. Commit the `.png` files.

### Blog article

<!--
  THE ARTICLE FILE: docs/blog/posts/YYYY-MM-DD-<slug>.html

  Use docs/blog/posts/2026-07-13-band-pill.html as the structural template.
  The article is a SINGLE self-contained static HTML file. Requirements:

  STRUCTURE (in order):
    1. Header block: date, embed label chip, slice IDs
    2. Article body: thesis statement, worked example over Meridian fixtures,
       the interactive embed or illustrative widget
    3. Meridian disclaimer: "Meridian is engineered fiction (ASSAY-DEC-8) …
       assessment, not fact / explored, not proven"
    4. Sources & trace: every claim deep-links to a document, research note,
       or component file (GitHub blob line anchors — named item, not just
       the document)

  SELF-CONTAINED STATIC HTML:
    - ALL CSS inline in a <style> block — no external stylesheets
    - NO external fonts, scripts, or CDN resources
    - Light + dark mode via prefers-color-scheme media query, using the
      project's CSS custom property palette (see any existing article)
    - Must work offline and render correctly on GitHub Pages

  EMBED LABEL (exactly one):
    - "live component — the demonstrator's actual code" (the shipped
       component imported and pre-rendered via build-embeds.ts)
    - "illustrative widget — real rule, fixture data" (a standalone
       widget using the real algorithm but simplified presentation)

  EVIDENCE IMAGES: reference from docs/blog/evidence/{spec-id}/ using
  relative paths so they work both in the repo and on the deployed site.

  WHAT NOT TO DO:
    - No screenshots in place of working embeds
    - No external dependencies (fonts, scripts, images from CDNs)
    - No unbanded scalars from assessed sources (G2)
    - No silent rebuilds of previously published articles (freeze rule)
-->

- [ ] TXXX **Write the blog article** at `docs/blog/posts/YYYY-MM-DD-<slug>.html` following the spec's "Article plan" (title, thesis, narrative hook, embed type). Copy the structure of `docs/blog/posts/2026-07-13-band-pill.html`. See the checklist in the comment block above. See `docs/blog/README.md` for full conventions.
- [ ] TXXX **Generate embeds** (if the article uses a live-component embed): run `npm run embeds` to regenerate `docs/blog/embeds/`. Commit the output. If using an illustrative widget instead, the widget JS is inline in the article — no embed generation needed.

### Wiring & propagation

- [ ] TXXX **Blog index**: Add the article card to `docs/blog/index.html` — both the Articles section (newest first) and the updates feed `<ul class="feed">`.
- [ ] TXXX **Status file**: Add entries to `docs/status.yml` — both the `blog:` list (with date, title, href, slice, embed label) and the `updates:` list.
- [ ] TXXX **Backlog**: Update `docs/blog/backlog.md` — mark the row as shipped with a relative link to the article.
- [ ] TXXX **Batch propagation**: Sweep `docs/assay-home.html` and `docs/status.yml` for any stage/thesis state changes this spec demonstrates.

### Verify deployment

- [ ] TXXX **PR preview check**: After pushing, confirm the blog article renders at `https://DeepBlueCLtd.github.io/assay/pr-preview/pr-{N}/blog/posts/YYYY-MM-DD-<slug>.html` (CI deploys automatically — wait for the "PR Preview" check to pass). Verify light mode, dark mode, and embed interaction. Evidence images should be visible at `pr-preview/pr-{N}/blog/evidence/{spec-id}/`.

**Checkpoint**: Blog article renders in PR preview, evidence images visible, index and status updated. On merge, deploy-pages.yml will publish everything to the live site automatically — no manual gh-pages push needed.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - May integrate with US1/US2 but should be independently testable

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together (if tests requested):
Task: "Contract test for [endpoint] in tests/contract/test_[name].py"
Task: "Integration test for [user journey] in tests/integration/test_[name].py"

# Launch all models for User Story 1 together:
Task: "Create [Entity1] model in src/models/[entity1].py"
Task: "Create [Entity2] model in src/models/[entity2].py"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
