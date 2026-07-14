/**
 * Assembles the publishable static site into `site/` for GitHub Pages.
 *
 * The demonstrator's shippable surfaces are: the fixture-backed component
 * gallery (SPEC-14, `npm run gallery`), the role-surface wireframes (a peer of
 * the canonical set), the live interactive app (SPEC-16, `npm run build:app` —
 * a self-contained in-browser run of the real pipeline), and the blog (comms
 * plan §6, articles with working embeds). This script gathers those into one
 * directory under the hand-authored Home page (`docs/assay-home.html`, comms
 * plan §4 page 1), so the whole thing can be served from a single Pages root
 * (or a per-PR preview subtree).
 *
 * Run via `npm run build:site` (which regenerates the gallery first). Output is
 * generated and git-ignored; the CI workflows publish it, nothing is committed.
 *
 * The Home page is the source of truth for the landing content and is copied
 * verbatim, save for one substitution: a `<!--BUILD_BADGE-->` placeholder is
 * replaced with a honest preview label when — and only when — the build is a
 * PR preview (`PR_NUMBER` present). A production (main) or local build carries
 * no badge: a preview must announce itself; the real site needs no label.
 *
 * Progress is single-sourced from `docs/status.yml` (comms plan §5). This script
 * reads it and enforces two honesty guardrails at BUILD time, so drift fails the
 * build rather than shipping quietly (§1.1, "the site polices its own optimism"):
 *   1. the hand-authored Home page must carry status.yml's current-stage label;
 *   2. no stage may be `building`/`done` in status.yml with its research note
 *      unpublished — the research-first gate (DEC-11) made mechanical.
 * The parsed status is also emitted as `site/status.json` for data-driven pages.
 */
import { copyFileSync, cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const root = new URL('../', import.meta.url);
const site = new URL('site/', root);
const gallery = new URL('gallery/', site);
const appDir = new URL('assets/app/', site);

interface Stage {
  id: number;
  name: string;
  status: 'not-started' | 'research' | 'building' | 'done';
  research_published: boolean;
}
interface Status {
  current_stage_label: string;
  stages: Stage[];
}

// --- Honesty gates over the single source of truth (comms plan §5) ---
const status = parse(
  readFileSync(fileURLToPath(new URL('docs/status.yml', root)), 'utf8'),
) as Status;

const homeSrc = readFileSync(
  fileURLToPath(new URL('docs/assay-home.html', root)),
  'utf8',
);
if (!homeSrc.includes(status.current_stage_label)) {
  throw new Error(
    `status.yml current_stage_label "${status.current_stage_label}" is not on the Home page — ` +
      `progress has drifted. Update docs/assay-home.html and docs/status.yml together.`,
  );
}
for (const s of status.stages) {
  if ((s.status === 'building' || s.status === 'done') && !s.research_published) {
    throw new Error(
      `Stage ${s.id} (${s.name}) is "${s.status}" but its research note is unpublished — ` +
        `research-first gate (DEC-11) violated in status.yml.`,
    );
  }
}

mkdirSync(fileURLToPath(gallery), { recursive: true });
mkdirSync(fileURLToPath(appDir), { recursive: true });

// The demonstrator's static surfaces, copied verbatim.
//
// CONVENTION (review-access): any shippable UI artefact — a surface, a
// wireframe, an explainer — must be BOTH copied here AND linked from a
// navigable page (the Home page cards, `docs/assay-home.html`). A reviewer
// must be able to reach it from the per-PR preview by clicking, never by
// hand-typing a URL. Copy-without-link ships a page that only its author can
// find; that is the same drift the §5 honesty gates exist to prevent, applied
// to reachability. (Comms plan §1.6.)
copyFileSync(
  fileURLToPath(new URL('docs/assets/gallery/index.html', root)),
  fileURLToPath(new URL('index.html', gallery)),
);
copyFileSync(
  fileURLToPath(new URL('docs/assay-ui-wireframes.html', root)),
  fileURLToPath(new URL('wireframes.html', site)),
);
// The interactive system-flow infographic (SPEC-14 flow-view sub-slice) —
// the built explainer, `npm run flow`. Same self-contained component in two
// homes: this Pages embed and the in-app S4 "systems-map" mode. Linked from a
// Home-page card (below / comms plan §1.6).
copyFileSync(
  fileURLToPath(new URL('docs/assets/flow/index.html', root)),
  fileURLToPath(new URL('flow.html', site)),
);
// The same spec rendered in the engineering-drawing / systems-schematic idiom
// (an alternative to the role-swimlane form above; both feed the design choice).
copyFileSync(
  fileURLToPath(new URL('docs/assay-flow-schematic-wireframes.html', root)),
  fileURLToPath(new URL('flow-schematic.html', site)),
);

// The live interactive app (SPEC-16) — a self-contained bundle. Placed at
// site/assets/app/ so the blog article's relative embed (../../assets/app/…)
// resolves identically in the repo and on the published site.
copyFileSync(
  fileURLToPath(new URL('docs/assets/app/index.html', root)),
  fileURLToPath(new URL('index.html', appDir)),
);

// Design mockups (issue #24, dependency-graph view) — temporary, for review only.
const mockDir = new URL('assets/dep-graph-mocks/', site);
mkdirSync(fileURLToPath(mockDir), { recursive: true });
copyFileSync(
  fileURLToPath(new URL('docs/assets/dep-graph-mocks/index.html', root)),
  fileURLToPath(new URL('index.html', mockDir)),
);

// The blog and its standalone embeds, copied verbatim (self-contained static;
// comms plan §8). Markdown sources (README, backlog) are dev-facing and skipped.
cpSync(
  fileURLToPath(new URL('docs/blog/', root)),
  fileURLToPath(new URL('blog/', site)),
  { recursive: true, filter: (src) => !src.endsWith('.md') },
);

// The parsed status as JSON, for any future data-driven page.
writeFileSync(
  fileURLToPath(new URL('status.json', site)),
  JSON.stringify(status, null, 2),
);

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Honest build labelling: only render what the environment actually gives us.
const sha = process.env.GITHUB_SHA?.slice(0, 7);
const pr = process.env.PR_NUMBER;
const server = process.env.GITHUB_SERVER_URL ?? 'https://github.com';
const repo = process.env.GITHUB_REPOSITORY ?? 'DeepBlueCLtd/assay';

// A preview badge is injected only for PR-preview builds; the production Home
// page ships badge-free. The commit link is added only if a SHA is available.
const commitLink = sha
  ? ` · <a style="color:inherit" href="${server}/${repo}/commit/${process.env.GITHUB_SHA}">${esc(sha)}</a>`
  : '';
const badge = pr
  ? `<div style="position:fixed;top:12px;right:12px;z-index:99;font-family:ui-monospace,monospace;font-size:11px;color:#3E5D8A;background:#E6ECF6;border:1px solid #C8D5EA;border-radius:999px;padding:4px 11px;box-shadow:0 1px 3px rgba(27,39,50,.14)">preview of PR #${esc(pr)}${commitLink}</div>`
  : '';

// The Home page is the source of truth; inject the badge at its placeholder.
const home = readFileSync(
  fileURLToPath(new URL('docs/assay-home.html', root)),
  'utf8',
);
const index = home.replace('<!--BUILD_BADGE-->', badge);

writeFileSync(fileURLToPath(new URL('index.html', site)), index);
console.log(`wrote site/ (${pr ? `preview of PR #${pr}` : 'production home'})`);
