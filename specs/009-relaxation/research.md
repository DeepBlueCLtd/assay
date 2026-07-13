# Phase 0 — Research (SPEC-09)

The DEC-11 research gate for this slice is **`docs/research/04-relaxation.md`** (Stage 4). It is the authoritative note; this file is a pointer and a decision digest so the spec-kit bundle is self-contained.

## Decisions carried into the plan (all from `04-relaxation.md`)

1. **Formalism — preemptive lexicographic priority over the `must/should/prefer` tiers, no weights** (note §1–2). The register (DEC-19) chose it: weighted CSP (Schiex et al., 1995), partial weighted MAX-SAT (Li & Manyà, 2009), and Archimedean goal programming (Charnes & Cooper, 1961) all attach numeric weights and are rejected on honesty grounds, not scale. Lexicographic (preemptive) goal programming (Ignizio, 1976) maps term-for-term to the ordinal tiers.
2. **Frontier, not optimum** (note §2; G4). Return the inclusion-minimal correction sets — the minimal-correction-set view of infeasibility (Liffiton & Sakallah, 2008; Marques-Silva & Planes, 2011). At v1 scale this is generate-and-re-score, not a SAT solver.
3. **`sacrificed` = the `violated` commitments** (note §3), read off the four-stop scale the SPEC-07 scorer already computes; `tight`/`marginal` are risks, not sacrifices.
4. **Reuse the scorer; author the R3m-responsive candidates** (note §3–4). The SPEC-08 BASE generator routes clear of the banded regions and cannot enter the mined water, so it cannot surface the mining conflict; SPEC-09 authors candidate geometry that does (vignette §8 latitude), and the scorer — not the author — computes the sacrifices (DEC-10).
5. **Content-neutral, stated tie-break** (note §4). Same-tier orderings by commitment-id, stated in `tie_break` as a placeholder for commander priority — because encoding a civil-harm-vs-force-protection ranking is the value judgement DEC-19 forbids.
6. **Command-language narratives** (note §5) matching MDMP / JP 5-0 mission-analysis idiom; the banded `margin` stays for the trace drawer (G2).

## Register position

No new register decision (note "What we will do differently", final paragraph). The formalism, report shape, and tie-break rule are all *consequences* of existing decisions (DEC-10/14/19/20) and invariants (G2/G4). The concept §6 open items are unaffected (the sparse-channel candidate, item 12, remains the only open one).
