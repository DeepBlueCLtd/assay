# The ASSAY blog — authoring & embed convention

Dev-facing guide (not published — `build-site.ts` copies `docs/blog/` into the site but skips
`.md`). Authority: comms plan §6 (blog articles), §8 (technical implementation), §9 (cadence).

## What the blog is

The durable written record of the updates feed. A dated note that warrants it grows into an
**article** that walks through what a landed slice actually does — carrying a **working embed** of
the new component or algorithm, never a screenshot. Articles are part of a stage/spec's definition
of *done* (§9), not a downstream chore.

## Layout

```
docs/blog/
  index.html                     hand-authored index (updates feed + article list); copied verbatim
  posts/YYYY-MM-DD-<slug>.html   one self-contained static page per article
  embeds/<component>/index.html  GENERATED standalone embeds (npm run embeds); committed, reviewable
  backlog.md                     articles still owed by landed stages (dev-facing)
  README.md                      this file
```

`build-site.ts` copies everything under `docs/blog/` (except `.md`) into `site/blog/` verbatim, so
the whole thing is plain self-contained static HTML — no Jekyll, no build step per post. (Comms plan
§8 floated Jekyll; the project settled on the hand-rolled static assembler already used for the Home
page and gallery, so the two paths stay consistent. That divergence from a non-binding §8
recommendation is noted in the flagged comms candidate, concept §6.14.)

## Writing an article

1. Copy `posts/2026-07-13-band-pill.html` as the template — it is the pattern-setter and already
   carries every §6.2 honesty affordance. Keep it **self-contained**: inline CSS, no external
   fonts/scripts/CDNs, so it serves from Pages and works offline.
2. Header carries the date, one embed label (`live component` or `illustrative widget`), and the
   slice IDs. Body ends with a **Sources & trace** list — every claim links to a document, research
   note, or component file. Deep-link the **named item**, not just its document: a DEC to its exact
   register row (`assay-register.md#L25`), a K-object to its vignette table row, a component to its
   source line. GitHub blob line anchors are precise, and — since the register is append-only and an
   article freezes at publication (§6.2 rule 6) — durable enough; a drifted link is fixed with a
   dated editorial note, never a silent rebuild.
3. Carry the fictional-vignette disclaimer (Meridian is engineered fiction, ASSAY-DEC-8) and the
   "assessment, not fact / explored, not proven" stance.
4. Add the article to `index.html` (Articles + updates feed) and to `docs/status.yml`'s `blog:` and
   `updates:` lists. Remove its row from `backlog.md`.

## Mounting an embed (§8, §6.2)

An embed is a self-contained client-side bundle under `embeds/<component>/`, mounted into a post
with a single `<iframe>` pointing at `../embeds/<component>/`. It must obey §6.2:

- **Label it** — `live component — the demonstrator's actual code`, or `illustrative widget — real
  rule, simplified data`. Never pass one off as the other.
- **Real rule, fixture data** — a live component imports the **shipped** component and pre-renders
  its reachable states over real Meridian fixtures (`scripts/build-embeds.ts`); it never
  re-implements the component in browser JS (a second copy of the rule drifts and lies).
- **Only when shipped** — an embed appears only when the slice's status supports it.
- **Freeze at publication** — an article's embed is a dated snapshot. If a later change makes it
  misleading, add a dated editorial note to the article; never silently rebuild the embed. Run
  `npm run embeds` only for the embed still being authored.

## Generating embeds

```
npm run embeds        # regenerate docs/blog/embeds/** from the shipped components
npm run build:site    # gallery + embeds + assemble site/ (used by the Pages deploy)
```

`build-site.ts` also enforces the honesty gates over `docs/status.yml`: the Home page must carry
the current-stage label, and no stage may be `building`/`done` with its research note unpublished.
A drift there fails the build — the site polices its own optimism (§5).
