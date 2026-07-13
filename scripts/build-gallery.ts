/**
 * SPEC-14 — fixture-backed component gallery (start).
 *
 * Renders the band pill and provenance chip — the demonstrator's signature
 * components — over the real Meridian fixture objects (SPEC-04). No compute
 * is faked: this is projection of content-addressable fixture data, which
 * is why it may exist before any service does (delivery plan §2.2).
 *
 * Output: docs/assets/gallery/index.html (committed so the comms site can
 * embed it; regenerate with `npm run gallery` — the header marks it
 * generated).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { bandPill } from '../src/components/bandPill.js';
import { provenanceChip } from '../src/components/provenanceChip.js';
import { s1Table, type S1Row } from '../src/components/s1Table.js';
import { channelTrace } from '../src/components/channelTrace.js';
import { refusalBanner } from '../src/components/refusalBanner.js';
import { checkEncoding } from '../src/encoding.js';
import { confidenceLint } from '../src/lint.js';
import { KnowledgeService } from '../src/knowledge.js';
import { CompileService } from '../src/compile.js';
import { isRefusal } from '../src/seam.js';
import type {
  CompiledWorld,
  KnowledgeObject,
  ScenarioCOA,
  VignetteConfig,
} from '../src/generated/types.js';

const knowledge = JSON.parse(
  readFileSync(new URL('../fixtures/knowledge.json', import.meta.url), 'utf8'),
) as KnowledgeObject[];
const coas = JSON.parse(
  readFileSync(new URL('../fixtures/coas.json', import.meta.url), 'utf8'),
) as ScenarioCOA[];
const vignetteConfig = JSON.parse(
  readFileSync(new URL('../fixtures/vignette-config.json', import.meta.url), 'utf8'),
) as VignetteConfig;

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const rows = knowledge
  .map((k) => {
    const answer = k.answer
      ? bandPill(k.answer)
      : `<span style="font-family:ui-monospace,monospace;font-size:11px;color:#3E5D8A;background:#E6ECF6;border:1px solid #C8D5EA;border-radius:3px;padding:2px 7px">open question — ranked for collection</span>`;
    const prov = k.provenance ? provenanceChip(k.provenance) : '';
    const status = `<span style="font-family:ui-monospace,monospace;font-size:10px;color:#5B6B77">${k.logical_id} · v${k.version} · ${k.status}</span>`;
    return `<div style="border:1px solid #D8DFE4;border-radius:6px;padding:12px 14px;margin-bottom:10px;background:#FCFDFD">
  ${status}
  <div style="font-weight:600;font-size:13.5px;margin:3px 0 8px">${esc(k.question)}</div>
  <div style="margin-bottom:6px">${answer}</div>
  <div>${prov}</div>
</div>`;
  })
  .join('\n');

// SPEC-05 — the minimal S1 table, rendered over the same fixtures, with the
// real Stage-1 discipline moments: K10's save refused (the demo moment,
// computed by the actual firewall), the contested K12 pair flagged
// compile-blocking, and any confidence-lint cautions in place.
const k10 = knowledge.find((k) => k.logical_id === 'K10');
const refusal = k10 ? checkEncoding(k10) ?? undefined : undefined;
const s1Rows: S1Row[] = knowledge
  .filter((k) => k.logical_id !== 'K10') // refused, never a live row
  .map((k) => ({ object: k, blocked: k.status === 'contested', warnings: confidenceLint(k) }));
const caption =
  'Save K10 (an assumption dressed as a hard constraint): the system declines laundered judgement.';
const s1 = s1Table(s1Rows, refusal ? { refusal, caption } : { caption });

// SPEC-06 — the Stage-2 compile demo moment, run by the ACTUAL compile service
// over the same fixtures: "contested never compiles" (K12 refuses), then resolve
// and recompile so every channel value walks back to named knowledge (G3).
const BASE = ['K1', 'K2', 'K3', 'K4', 'K6', 'K7', 'K8', 'K9'];
const kById = new Map(knowledge.map((k) => [k.logical_id, k]));
const svc = new KnowledgeService();
for (const id of BASE) await svc.create({ ...structuredClone(kById.get(id)!), status: 'answered' });
await svc.create(structuredClone(kById.get('K12a')!));
await svc.create(structuredClone(kById.get('K12b')!));
for (const coa of coas) await svc.store.put(coa as unknown as Record<string, unknown>);
const compiler = new CompileService({ knowledge: svc });

const refFor = (id: string) => ({ logical_id: id, content_hash: '' });
const contested = await compiler.compile({
  knowledge: [...BASE, 'K12a', 'K12b'].map(refFor),
  config: vignetteConfig,
  engine_version: '0.1.0',
});
const compileRefusalHtml = isRefusal(contested) ? refusalBanner(contested) : '';

svc.contest('K12a', 'K12b');
svc.resolve('K12a', 'defector debrief corroborated; manifests predate the drawdown');
const compiled = await compiler.compile({
  knowledge: [...BASE, 'K12a'].map(refFor),
  config: vignetteConfig,
  engine_version: '0.1.0',
});
const world = isRefusal(compiled)
  ? undefined
  : (svc.store.get(compiled.world.content_hash) as CompiledWorld);
const knowledgeById = Object.fromEntries(
  [...BASE, 'K12a'].map((id) => [id, kById.get(id)!]),
) as Record<string, KnowledgeObject>;
const channelHtml = world ? channelTrace(world, knowledgeById) : '';
const stampLine =
  world && !isRefusal(compiled)
    ? `<span style="font-family:ui-monospace,monospace;font-size:11px;color:#5B6B77">stamp ${compiled.stamp.slice(0, 16)}… · ${world.consumed.length} knowledge objects consumed · sparse channels (no dense cell stored)</span>`
    : '';

const html = `<!DOCTYPE html>
<!-- GENERATED by scripts/build-gallery.ts (npm run gallery) — do not edit by hand. -->
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ASSAY — component gallery (SPEC-14)</title>
</head>
<body style="margin:0;background:#EDF0F2;color:#1B2732;font-family:system-ui,sans-serif;font-size:14px;line-height:1.5">
<div style="max-width:820px;margin:0 auto;padding:28px 24px 64px">
<h1 style="font-size:24px;border-bottom:3px solid #1B2732;padding-bottom:12px">ASSAY component gallery</h1>
<p style="font-size:12.5px;color:#5B6B77"><b>Live components — the demonstrator's actual code</b>, rendered over Meridian vignette fixture data (SPEC-04). Components, not product: no service, no compute, no plan exists behind this page. Every assessed value is banded with provenance welded on (ASSAY-DEC-9); the Meridian scenario is engineered fiction (ASSAY-DEC-8).</p>
<h2 style="font-size:16px;margin-top:28px">The knowledge base, K1–K14</h2>
${rows}
<h2 style="font-size:16px;margin-top:32px">Minimal S1 knowledge table (SPEC-05)</h2>
<p style="font-size:12.5px;color:#5B6B77">The knowledge service's four discipline moments, rendered by the actual firewall over the same fixtures: the refused K10 save (banner), the contested K12 pair (compile-blocking flag), K8's waiver and single-source markings, and confidence-lint cautions. Banded honesty holds — no bare assessed scalar appears (G2).</p>
<div style="background:#FCFDFD;border:1px solid #D8DFE4;border-radius:6px;padding:14px">${s1}</div>
<h2 style="font-size:16px;margin-top:32px">Compile — knowledge → CompiledWorld (SPEC-06)</h2>
<p style="font-size:12.5px;color:#5B6B77">The Stage-2 demo moment, run by the actual compile service. <b>Contested never compiles</b> (G5): with the K12 mine-stock pair disputed, the compile refuses rather than average an irreconcilable band into a channel —</p>
<div style="margin:10px 0">${compileRefusalHtml}</div>
<p style="font-size:12.5px;color:#5B6B77">Resolve the contest, and the recompile builds the world. Channels are stored <b>sparse</b> — a per-channel default plus named region overrides (the MCOO idiom; no dense 1.2M-cell surface is ever stored or hashed). Every channel value walks back to the named knowledge it came from, with its owner (G3). ${stampLine}</p>
<div style="background:#FCFDFD;border:1px solid #D8DFE4;border-radius:6px;padding:14px;overflow-x:auto">${channelHtml}</div>
<p style="font-size:11.5px;color:#5B6B77;margin-top:28px">Generated from <code>fixtures/</code> by <code>npm run gallery</code> · identifiers frozen per assay-vignette.md §8 · compile per research note <code>docs/research/02-compile.md</code></p>
</div>
</body>
</html>
`;

mkdirSync(new URL('../docs/assets/gallery/', import.meta.url), { recursive: true });
writeFileSync(new URL('../docs/assets/gallery/index.html', import.meta.url), html);
console.log('wrote docs/assets/gallery/index.html');
