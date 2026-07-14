# Feature Specification: [FEATURE NAME]

**Feature Branch**: `[###-feature-name]`

**Created**: [DATE]

**Status**: Draft

**Input**: User description: "$ARGUMENTS"

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.

  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - [Brief Title] (Priority: P1)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently - e.g., "Can be fully tested by [specific action] and delivers [specific value]"]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]
2. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

### User Story 2 - [Brief Title] (Priority: P2)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

### User Story 3 - [Brief Title] (Priority: P3)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right edge cases.
-->

- What happens when [boundary condition]?
- How does system handle [error scenario]?

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: System MUST [specific capability, e.g., "allow users to create accounts"]
- **FR-002**: System MUST [specific capability, e.g., "validate email addresses"]
- **FR-003**: Users MUST be able to [key interaction, e.g., "reset their password"]
- **FR-004**: System MUST [data requirement, e.g., "persist user preferences"]
- **FR-005**: System MUST [behavior, e.g., "log all security events"]

*Example of marking unclear requirements:*

- **FR-006**: System MUST authenticate users via [NEEDS CLARIFICATION: auth method not specified - email/password, SSO, OAuth?]
- **FR-007**: System MUST retain user data for [NEEDS CLARIFICATION: retention period not specified]

### Key Entities *(include if feature involves data)*

- **[Entity 1]**: [What it represents, key attributes without implementation]
- **[Entity 2]**: [What it represents, relationships to other entities]

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: [Measurable metric, e.g., "Users can complete account creation in under 2 minutes"]
- **SC-002**: [Measurable metric, e.g., "System handles 1000 concurrent users without degradation"]
- **SC-003**: [User satisfaction metric, e.g., "90% of users successfully complete primary task on first attempt"]
- **SC-004**: [Business metric, e.g., "Reduce support tickets related to [X] by 50%"]

## Blog & Evidence Plan *(mandatory)*

<!--
  A blog article is part of a spec's DEFINITION OF DONE — not a downstream chore.
  The spec author is in the best position to plan the article because they know the
  demo moment, the thesis being explored, and what the evidence should show.

  This section is the input to the task generator: it produces explicit tasks for
  evidence capture (Playwright screenshots during test verification), blog article
  authoring, and evidence commit. If those tasks don't exist, the blog won't happen.

  Evidence images are committed to `docs/blog/evidence/{spec-id}/` and referenced
  from both the blog article and the PR description.

  Follow the conventions in `docs/blog/README.md` — in particular: self-contained
  static HTML, one of two embed labels (live component / illustrative widget), the
  Meridian disclaimer, and Sources & trace with deep links.
-->

### Article plan

- **Title**: [The article headline — short, thesis-forward, e.g. "Don't plan on most-likely"]
- **Thesis / demo moment**: [Which thesis (A–H) this demonstrates and the key exhibit, e.g. "Thesis C: the R1-optimal plan collapses under R2 in the scenario strip"]
- **Narrative hook**: [One sentence — the problem this slice solves, e.g. "A plan optimised against the most-likely scenario may catastrophically fail under the most-dangerous one"]
- **Embed type**: [live component | illustrative widget] — [brief justification for the choice]

### Evidence captures

<!--
  Define 2–4 screenshots that prove the demo moment. Each capture specifies:
  - WHAT: the page/component being captured
  - STATE: the exact interaction state to reach (e.g. "R2 toggled on, P1 collapse visible")
  - VARIANTS: light + dark mode (both required)
  - FILE: the output filename in docs/blog/evidence/{spec-id}/

  These captures become Playwright screenshot tasks. The tests that verify the
  acceptance scenarios should capture these screenshots as a side effect — the
  component is already rendered to verify it, so the screenshot is free.
-->

1. **[Descriptive name]**
   - Page/component: [e.g. `scenarioStrip` in the gallery, or `blog/posts/...`]
   - State: [e.g. "R2 scenario toggled on, P1 C1/C2 showing violated with collapse markers"]
   - Files: `docs/blog/evidence/{spec-id}/[slug]-light.png`, `[slug]-dark.png`

2. **[Descriptive name]**
   - Page/component: [e.g. `sensitivityTable` in the gallery]
   - State: [e.g. "K8 at top of ranking with single-source badge visible"]
   - Files: `docs/blog/evidence/{spec-id}/[slug]-light.png`, `[slug]-dark.png`

[Add more captures as needed — 2–4 is typical]

## Assumptions

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right assumptions based on reasonable defaults
  chosen when the feature description did not specify certain details.
-->

- [Assumption about target users, e.g., "Users have stable internet connectivity"]
- [Assumption about scope boundaries, e.g., "Mobile support is out of scope for v1"]
- [Assumption about data/environment, e.g., "Existing authentication system will be reused"]
- [Dependency on existing system/service, e.g., "Requires access to the existing user profile API"]
