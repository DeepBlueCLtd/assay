# experiments/ — non-canonical sandbox

**Nothing in this directory is canonical.** It is a standalone spike space for
learning about theses the core has deliberately *not* opened, without touching
core ASSAY.

Rules that keep it from polluting the core:

- No file here is imported by `src/`, `schema/`, `specs/`, or `docs/research/`.
- No schema change, no `npm run gen`, no LinkML class. Sandboxes define their own
  local throwaway types.
- No register decision (DEC). Findings feed back only as **flagged concept §6
  candidates** for a future batch (DEC-2) — they assert nothing.
- Reads of core fixtures are one-way and read-only.

## thesis-g/ — interdependency (PMESII node-link)

Probes concept §6.3's open question: *does thesis G admit any honest v1 slice, or
is it horizon-only?* Thesis G is flagged "highest false-precision risk" (concept
§1); `assay-knowledge-model.md:484` keeps PMESII shapes out of the core on purpose.

- `thesis-g-interdependency.md` — the design note (this spike's DEC-11-shaped
  gate, kept *out* of `docs/research/` because it gates no build stage and
  decides nothing canonical).
