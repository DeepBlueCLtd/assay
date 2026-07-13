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
 */
import { copyFileSync, cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const site = new URL('site/', root);
const gallery = new URL('gallery/', site);
const appDir = new URL('assets/app/', site);

mkdirSync(fileURLToPath(gallery), { recursive: true });
mkdirSync(fileURLToPath(appDir), { recursive: true });

// The demonstrator's static surfaces, copied verbatim.
copyFileSync(
  fileURLToPath(new URL('docs/assets/gallery/index.html', root)),
  fileURLToPath(new URL('index.html', gallery)),
);
copyFileSync(
  fileURLToPath(new URL('docs/assay-ui-wireframes.html', root)),
  fileURLToPath(new URL('wireframes.html', site)),
);

// The live interactive app (SPEC-16) — a self-contained bundle. Placed at
// site/assets/app/ so the blog article's relative embed (../../assets/app/…)
// resolves identically in the repo and on the published site.
copyFileSync(
  fileURLToPath(new URL('docs/assets/app/index.html', root)),
  fileURLToPath(new URL('index.html', appDir)),
);

// The blog (comms plan §6) — index + posts, copied verbatim.
cpSync(
  fileURLToPath(new URL('docs/blog/', root)),
  fileURLToPath(new URL('blog/', site)),
  { recursive: true },
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
