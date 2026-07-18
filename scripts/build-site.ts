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
// The spatial/temporal COA mockup (SPEC-19, `npm run coa-viz`) — the reviewable
// artefact research note 10's invitation points at: map + timeline + live
// drag-to-recompute over the real in-browser pipeline. Linked from a Home-page
// card (comms plan §1.6).
copyFileSync(
  fileURLToPath(new URL('docs/assets/coa-viz/index.html', root)),
  fileURLToPath(new URL('coa-viz.html', site)),
);
// Second home for the same self-contained page, at the assets path the blog
// article's relative iframe (`../../assets/coa-viz/index.html`) resolves to —
// the same convention as the live app above.
const coaVizDir = new URL('assets/coa-viz/', site);
mkdirSync(fileURLToPath(coaVizDir), { recursive: true });
copyFileSync(
  fileURLToPath(new URL('docs/assets/coa-viz/index.html', root)),
  fileURLToPath(new URL('index.html', coaVizDir)),
);

// The SME-facing doctrine page (comms artefact, DEC-30 category; review §4.1
// crosswalk + §4.4 divergence register, actions W1/A1) — handed to SMEs before
// free exploration. Shipped alongside SPEC-21, which makes the crosswalk's step
// column machine-auditable. Linked from a Home-page card (comms plan §1.6).
copyFileSync(
  fileURLToPath(new URL('docs/assay-doctrine.html', root)),
  fileURLToPath(new URL('doctrine.html', site)),
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

// Non-canonical experiments (sandbox spikes) — review-only, and DELIBERATELY
// NOT linked from the Home page. These probe theses the core has consciously
// not opened (e.g. thesis G, PMESII interdependency); featuring one on the
// public face would be exactly the false-precision pollution the sandbox
// exists to avoid. They are an accepted exception to the copy-and-link
// convention above (cf. the dep-graph mockups): reachable under /experiments/
// if you navigate there, each self-stamped "experimental · not canonical",
// never presented as ASSAY output. The `experiments/` tree is source, not a
// build product (see experiments/README.md).
const experimentsRoot = new URL('experiments/', site);
const thesisGDir = new URL('experiments/thesis-g/', site);
mkdirSync(fileURLToPath(thesisGDir), { recursive: true });
copyFileSync(
  fileURLToPath(new URL('experiments/thesis-g/demonstrator.html', root)),
  fileURLToPath(new URL('demonstrator.html', thesisGDir)),
);
// A self-describing, clearly-labelled landing so /experiments/ announces what
// it is rather than serving a bare file.
writeFileSync(
  fileURLToPath(new URL('index.html', experimentsRoot)),
  `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ASSAY experiments — non-canonical sandbox</title>
<style>
  :root{color-scheme:light dark}
  body{margin:0;font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
    background:#f7f8fa;color:#1a1d23;padding:40px 20px}
  @media(prefers-color-scheme:dark){body{background:#0d1117;color:#e6edf3}}
  .wrap{max-width:720px;margin:0 auto}
  .stamp{display:inline-block;font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;
    color:#fff;background:#7c5cff;border-radius:5px;padding:3px 9px}
  h1{font-size:24px;margin:14px 0 6px}
  .warn{border:2px dashed #c2384b;border-radius:10px;padding:12px 16px;margin:18px 0;
    background:rgba(194,56,75,.06);font-size:14px}
  .warn b{color:#c2384b}
  a.card{display:block;text-decoration:none;color:inherit;border:1px solid #d9dee6;border-radius:12px;
    padding:16px 18px;margin:12px 0;background:#fff}
  @media(prefers-color-scheme:dark){a.card{background:#161b22;border-color:#2a313c}}
  a.card:hover{border-color:#7c5cff}
  a.card h2{margin:0 0 4px;font-size:17px}
  a.card p{margin:0;font-size:14px;color:#5b6472}
  @media(prefers-color-scheme:dark){a.card p{color:#9aa4b2}}
  .muted{font-size:13px;color:#5b6472}
</style></head><body><div class="wrap">
  <span class="stamp">experimental · not canonical</span>
  <h1>ASSAY experiments</h1>
  <div class="warn"><b>Not part of ASSAY canon.</b> This area holds standalone sandbox spikes that
    explore theses the core has deliberately <em>not</em> opened. Nothing here is a decided design,
    a shipped surface, or a register decision — it decides nothing and is linked from no canonical page.</div>
  <a class="card" href="thesis-g/demonstrator.html">
    <h2>Thesis G — interdependency, read three ways</h2>
    <p>A PMESII interdependency demonstrator: one Meridian-derived graph read as reachability,
      signed direction (with the opposing-path straddle refused), and the labelled weighted-propagation
      trap — probing where honesty ends. See <code>experiments/thesis-g/</code> in the repo for the argument.</p>
  </a>
  <p class="muted">Meridian is fiction (vignette §8). These pages touch no core ASSAY code, schema, or register.</p>
</div></body></html>
`,
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
