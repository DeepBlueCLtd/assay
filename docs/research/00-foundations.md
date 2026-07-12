# Research note 00 — Foundations

Stage 0 · per ASSAY-DEC-11 · 2026-07-12 · bounded to hours, one page preferred
Prompts (build plan §Stage 0): JP 2-01.3 ch. II — the four-step process and its products; content-addressed storage and canonical-serialisation pitfalls across JS runtimes, including cost at CompiledWorld scale.

## 1. JIPOE: the four-step process and its products

JP 2-01.3, *Joint Intelligence Preparation of the Operational Environment* (21 May 2014), ch. II, defines the four steps: **(1) define the operational environment** (bounds, characteristics, gaps — the gaps become information requirements); **(2) describe the impact of the OE** (terrain, weather, civil considerations — the MCOO, the modified combined obstacle overlay, is the signature product: obstacles, mobility corridors, avenues of approach layered into one combined graphic); **(3) evaluate the adversary** (capabilities, doctrine → threat/situation templates); **(4) determine adversary COAs** (a *set* of valid COAs, each with a situation template; the **event template** identifies named areas of interest (NAIs) where observable **indicators** discriminate between the COAs, tabulated in the **event matrix**). ATP 2-01.3 (Mar 2019) gives the tactical-level MCOO construction detail behind step 2.

**Implications confirmed for ASSAY** (mostly validating decisions already taken): the compile channels are step-2 products (the MCOO decomposed into typed layers — and MCOO overlays are *sparse by construction*: overlays mark deviations, not every cell); ScenarioCOA-as-world-variant matches step 4's "set of valid COAs, each templated"; `expected_answers` per COA (DEC-18) is the event matrix, and its doctrinal vocabulary is **indicator** and **NAI** — S1's *Collect next* queue should use those words, not invented ones. One correction to internalise: doctrine treats step-1 *gaps* as the origin of open questions — our KnowledgeObject lifecycle starting at `open` (DEC-17) is the same idea; fixtures should show at least one open question motivated by a stated gap, not appearing from nowhere.

## 2. Canonical serialisation across JS runtimes

The trap inventory, against **RFC 8785 (JSON Canonicalization Scheme, June 2020)**, which we adopt outright rather than inventing our own rules:

- **Key ordering**: JCS sorts object keys by UTF-16 code units. `JSON.stringify` preserves insertion order — sorting must be explicit and recursive.
- **Numbers**: JCS mandates ECMAScript's `Number::toString` serialisation (shortest round-trip form; engines converged on Grisu/Ryū-class algorithms; deterministic across V8/JSC/SpiderMonkey for finite doubles). Two edge cases matter: **`-0` serialises as `"0"`** (sign silently lost — we reject `-0` at the seam rather than let identity depend on it), and magnitudes ≥ 10²¹ switch to exponent form (harmless if consistent, and JCS makes it consistent).
- **Non-finite**: `JSON.stringify` turns `NaN`/`Infinity` into `null`. The knowledge model already forbids them (§2); the canonicaliser must *reject*, never coerce.
- **Absent vs null**: model rule is "optional absent slots omitted entirely (never null)" — the canonicaliser rejects explicit `null` and drops `undefined`, so the two cannot produce different bytes.
- **Unicode**: JCS does **not** normalise (no NFC). We hash the UTF-8 bytes of the string as-is; visually identical but differently-composed strings are different content — correct for tamper-evidence, worth documenting for fixture authors.
- **Hashing**: SHA-256 via WebCrypto (`crypto.subtle.digest`), available on `globalThis.crypto` in browsers and Node ≥ 19 alike — one code path, no polyfill.

## 3. Cost at CompiledWorld scale

A dense Meridian world is 60×60×56 × 6 channels ≈ **1.2M banded cells**. **Measured** (Stage-0 microbenchmark, `npm run bench`, Node 22): canonical JSON materialises at **84.9 MB**, canonicalisation takes **~7.9 s**, SHA-256 **~9.8 s** — **~18 s serialise+hash per recompile**, per scenario variant, before any browser-tab memory pressure. Dense channels are conclusively not viable even in the mock; seam-contract open item 2's reclassification is vindicated by measurement, not argument. The sparse direction (cells deviating from a per-channel default — exactly how the MCOO works, §1) is the leading candidate; `02-compile.md` picks the representation against these numbers, with a target of well under one second per recompile.

## What we will do differently

1. **Adopt RFC 8785 verbatim** (UTF-16-code-unit key sort, ES number serialisation, UTF-8 bytes hashed) instead of inventing a house canonical form; cite it in `canonical.ts`.
2. **Reject, never coerce, at the canonicaliser**: `-0`, `NaN`, `±Infinity`, explicit `null`, and non-plain-object values all throw — a coercion that changes bytes is a determinism bug waiting to be blamed on G1.
3. **Ship a canonicalise+hash microbenchmark in Stage 0** at synthetic dense-world scale, so `02-compile.md` decides sparse-vs-dense from numbers, not vibes.
4. **Use doctrine vocabulary on S1**: *indicator*, *NAI*, *event matrix* in the Collect-next queue labels; and give at least one fixture open question an explicit step-1 gap as its stated origin.

Sources: JP 2-01.3 (2014) ch. II; ATP 2-01.3 (2019); AIntP-17 Ed. A (orientation only this stage); RFC 8785; ECMA-262 §Number::toString; MDN/Node docs for `crypto.subtle` availability.
