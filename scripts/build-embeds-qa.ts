/**
 * Standalone-embed build target for the SPEC-18 "From Q&A to COA" article
 * (comms plan §8, §6.2; issue #42). Peer of scripts/build-embeds.ts.
 *
 * HONESTY — the load-bearing bit (same rule as build-embeds.ts). This is NOT a
 * browser re-implementation of the pipeline. It imports the *real* components
 * (bandPill, provenanceChip, channelTrace, s2Matrix) and drives the *real*
 * services (CompileService, ScoreService) over the frozen Meridian fixtures at
 * BUILD time. Every band, verdict, and margin below is a value the shipped
 * scorer actually produced. The reader's one live control — Panel 2's K6-width
 * slider — swaps between pre-computed *real* scorer outputs, one frame per band
 * width. The interaction is real; the pixels are the components' own. No runtime
 * crypto, no bundler, offline-clean.
 *
 * The article proves the three-pattern taxonomy the investigation found:
 *   Panel 1  K3 → C3  — band compiled, metric geometric (the honest gap)
 *   Panel 2  K6 → C4  — band propagates into the verdict (G6, the slider)
 *   Panel 3  K7 → C4  — band compiled, route misses region (the near-miss)
 * Every claim here is also asserted by tests/k3-trace.test.ts (merged).
 *
 * Output is committed under docs/blog/embeds/qa-to-coa/ and copied verbatim into
 * the published site by build-site.ts. Regenerate with `npm run embeds`.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type {
  Commitment,
  CommitmentVerdict,
  CompiledWorld,
  KnowledgeObject,
  Plan,
  ScenarioCOA,
  VignetteConfig,
} from '../src/generated/types.js';
import { KnowledgeService } from '../src/knowledge.js';
import { CompileService } from '../src/compile.js';
import { ScoreService } from '../src/score.js';
import { evaluateMetric, isSevered } from '../src/metrics.js';
import { isRefusal } from '../src/seam.js';
import type { Ref } from '../src/store.js';
import { bandPill } from '../src/components/bandPill.js';
import { provenanceChip } from '../src/components/provenanceChip.js';
import { channelTrace } from '../src/components/channelTrace.js';
import { s2Matrix } from '../src/components/s2Matrix.js';

const root = new URL('../', import.meta.url);
const load = <T>(name: string): T[] =>
  JSON.parse(readFileSync(fileURLToPath(new URL(`fixtures/${name}.json`, root)), 'utf8')) as T[];

const knowledge = load<KnowledgeObject>('knowledge');
const coas = load<ScenarioCOA>('coas');
const commitments = load<Commitment>('commitments');
const plans = load<Plan>('plans');
const config = JSON.parse(
  readFileSync(fileURLToPath(new URL('fixtures/vignette-config.json', root)), 'utf8'),
) as VignetteConfig;

const byId = new Map(knowledge.map((k) => [k.logical_id, k]));
const K = (id: string): KnowledgeObject => structuredClone(byId.get(id)!);
const answered = (id: string): KnowledgeObject => ({ ...K(id), status: 'answered' as const });
const ref = (id: string): Ref => ({ logical_id: id, content_hash: '' });
const BASE_IDS = ['K1', 'K2', 'K3', 'K4', 'K6', 'K7', 'K8', 'K9'];
const ENGINE = '0.1.0';

/** A KnowledgeService seeded exactly as tests/k3-trace.test.ts does. */
async function makeRig(includeK3 = true) {
  const svc = new KnowledgeService();
  for (const id of BASE_IDS.filter((i) => includeK3 || i !== 'K3')) await svc.create(answered(id));
  await svc.create(K('K12a'));
  await svc.create(K('K12b'));
  svc.contest('K12a', 'K12b');
  svc.resolve('K12a', 'defector debrief corroborated');
  for (const coa of coas) await svc.store.put(coa as unknown as Record<string, unknown>);
  for (const c of commitments) await svc.store.put(c as unknown as Record<string, unknown>);
  const planRefs = new Map<string, Ref>();
  for (const p of plans)
    planRefs.set(p.logical_id, await svc.store.put(p as unknown as Record<string, unknown>));
  return { svc, planRefs };
}

async function buildWorld(svc: KnowledgeService, includeK3 = true) {
  const ids = BASE_IDS.filter((i) => includeK3 || i !== 'K3');
  const compiler = new CompileService({ knowledge: svc });
  const r = await compiler.compile({
    knowledge: [...ids, 'K12a'].map(ref),
    config,
    engine_version: ENGINE,
  });
  if (isRefusal(r)) throw new Error(`compile refused: ${r.reason}`);
  return { world: svc.store.get(r.world.content_hash) as CompiledWorld, worldRef: r.world };
}

const plan = (id: string): Plan => plans.find((p) => p.logical_id === id)!;
const commitment = (id: string): Commitment => commitments.find((c) => c.logical_id === id)!;

/** A world showing only one channel — for a focused channelTrace panel. */
const oneChannel = (world: CompiledWorld, kind: string): CompiledWorld => ({
  ...world,
  channels: world.channels.filter((c) => c.kind === kind),
});

const firesBand = (planId: string, world: CompiledWorld): { lo: number; hi: number } => {
  const r = evaluateMetric(commitment('C3'), plan(planId), world, config);
  if (isSevered(r)) throw new Error('C3 severed unexpectedly');
  return { lo: r.band.lo, hi: r.band.hi };
};

// ── Build the real world and the contrasting no-K3 world ────────────────────
const { svc, planRefs } = await makeRig(true);
const { world, worldRef } = await buildWorld(svc, true);
const koById = Object.fromEntries(knowledge.map((k) => [k.logical_id, k]));
const scorer = new ScoreService({ store: svc.store, trace: svc.trace, config, commitments });

// Panel 1 — K3 → C3 (geometric-only). The gap: score P2×C3 with and without K3.
const { svc: svcNoK3 } = await makeRig(false);
const { world: worldNoK3 } = await buildWorld(svcNoK3, false);
const p2FiresWithK3 = firesBand('P2', world);
const p2FiresNoK3 = firesBand('P2', worldNoK3);
const panel1 = {
  answer: bandPill({ lo: 35000, hi: 55000, unit: 'persons' }, { label: 'K3 civil population' }),
  prov: provenanceChip(K('K3').provenance!, K('K3').jipoe_step),
  trace: channelTrace(oneChannel(world, 'civil_density'), koById),
  p1Fires: firesBand('P1', world),
  p2Fires: p2FiresWithK3,
  withK3: p2FiresWithK3,
  withoutK3: p2FiresNoK3,
  identical: p2FiresWithK3.lo === p2FiresNoK3.lo && p2FiresWithK3.hi === p2FiresNoK3.hi,
};

// Panel 2 — K6 → C4 (band-propagating). Base exposure + the K6-width slider.
const c4 = commitment('C4');
const p1ExposureRes = evaluateMetric(c4, plan('P1'), world, config);
if (isSevered(p1ExposureRes)) throw new Error('C4 severed for P1');
// Real scorer output for each K6 band width — symmetric widen about the
// assessed centre (4). h=2 is the as-assessed [2,6] low-confidence band.
const sliderFrames: Array<{
  lo: number;
  hi: number;
  half: number;
  assessed: boolean;
  marginLo: number;
  marginHi: number;
  verdict: string;
}> = [];
for (let half = 0; half <= 4; half++) {
  const lo = 4 - half;
  const hi = 4 + half;
  const res = await scorer.score({
    plan: planRefs.get('P1')!,
    world: worldRef,
    scenario: 'BASE',
    engine_version: ENGINE,
    knowledge_overrides: [{ ref: ref('K6'), answer: { lo, hi, unit: 'sorties/day' } }],
  });
  if (isRefusal(res)) throw new Error(`score refused: ${res.reason}`);
  const v = res.verdicts.find((x) => x.commitment === 'C4')!;
  sliderFrames.push({
    lo,
    hi,
    half,
    assessed: half === 2,
    marginLo: v.margin!.lo,
    marginHi: v.margin!.hi,
    verdict: v.verdict,
  });
}
const panel2 = {
  answer: bandPill({ lo: 2, hi: 6, unit: 'sorties/day' }, { label: 'K6 FAC sortie rate' }),
  prov: provenanceChip(K('K6').provenance!, K('K6').jipoe_step),
  trace: channelTrace(oneChannel(world, 'threat'), koById),
  exposure: { lo: p1ExposureRes.band.lo, hi: p1ExposureRes.band.hi, unit: p1ExposureRes.band.unit },
  frames: sliderFrames,
};

// Panel 3 — K7 → C4 (route-dependent miss). FE-ANVIL enters air_defence in neither plan.
const adRegion = config.regions.find((r) => r.name === 'air_defence')!;
const anvilInAD = (planId: string): boolean => {
  const anvil = plan(planId).elements.find((e) => e.force_element === 'FE-ANVIL')!;
  return (anvil.route ?? []).some(
    (leg) => leg.x >= adRegion.x0 && leg.x <= adRegion.x1 && leg.y >= adRegion.y0 && leg.y <= adRegion.y1,
  );
};
const panel3 = {
  answer: bandPill({ lo: 8, hi: 14, unit: 'km' }, { label: 'K7 air-defence envelope' }),
  prov: provenanceChip(K('K7').provenance!, K('K7').jipoe_step),
  p1InAD: anvilInAD('P1'),
  p2InAD: anvilInAD('P2'),
};

// The P1/P2 × C3,C4 verdict matrix (the honest matrix), real scorer output.
async function verdicts(planId: string): Promise<CommitmentVerdict[]> {
  const r = await scorer.score({
    plan: planRefs.get(planId)!,
    world: worldRef,
    scenario: 'BASE',
    engine_version: ENGINE,
  });
  if (isRefusal(r)) throw new Error(`score refused: ${r.reason}`);
  return r.verdicts.filter((v) => v.commitment === 'C3' || v.commitment === 'C4');
}
const matrix = s2Matrix(['C3', 'C4'], [
  { plan: 'P1', verdicts: await verdicts('P1') },
  { plan: 'P2', verdicts: await verdicts('P2') },
]);

// ── Assemble the self-contained, offline-clean page ─────────────────────────
const page = `<!DOCTYPE html>
<!-- GENERATED by scripts/build-embeds-qa.ts — do not edit by hand; run \`npm run embeds\`.
     Self-contained standalone embed for the SPEC-18 "From Q&A to COA" article
     (issue #42). All bands/verdicts/margins below are the shipped CompileService
     + ScoreService output over frozen Meridian fixtures; only the Panel-2 slider
     chrome is embed-local. Every value is asserted by tests/k3-trace.test.ts. -->
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>From Q&amp;A to COA — three-pattern embed</title>
<style>
  :root { color-scheme: light dark; --ink:#1B2732; --ink-soft:#33414D; --muted:#5B6B77;
    --page:transparent; --panel:#FCFDFD; --panel-2:#F1F3F5; --line:#D8DFE4; --line-soft:#E4E9ED;
    --band-ink:#9A6A14; --band-fill:#F7EDD8; --band-line:#E7D3A6;
    --robust-ink:#14655F; --robust-fill:#E2EFEA; --robust-line:#BFDCD3;
    --miss-ink:#5B6B77; --miss-fill:#F1F3F5;
    --sans:system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
    --mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace; }
  @media (prefers-color-scheme: dark){ :root{ --ink:#E7ECF0; --ink-soft:#C4CED6; --muted:#93A2AE;
    --panel:#17212A; --panel-2:#131C24; --line:#2A3945; --line-soft:#222E38;
    --band-ink:#E0B457; --band-fill:#2E2513; --band-line:#4A3C1C;
    --robust-ink:#63C3B6; --robust-fill:#122824; --robust-line:#1F3F39; --miss-fill:#131C24; } }
  * { box-sizing:border-box; }
  body { margin:0; font-family:var(--sans); color:var(--ink); background:var(--page);
    font-size:14px; line-height:1.55; -webkit-font-smoothing:antialiased; }
  .grid { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; padding:2px; }
  @media (max-width:820px){ .grid { grid-template-columns:1fr; } }
  .panel { border:1px solid var(--line); border-radius:12px; background:var(--panel);
    padding:16px 16px 18px; display:flex; flex-direction:column; }
  .tag { font-family:var(--mono); font-size:10px; letter-spacing:.06em; text-transform:uppercase; }
  .panel.prop .tag { color:var(--robust-ink); }
  .panel.geo .tag { color:var(--band-ink); }
  .panel.miss .tag { color:var(--miss-ink); }
  h3 { font-size:15px; margin:8px 0 2px; letter-spacing:-.01em; }
  .sub { font-size:12px; color:var(--muted); margin:0 0 12px; }
  .row { margin:10px 0; }
  .lbl { font-size:11px; color:var(--muted); text-transform:uppercase; letter-spacing:.04em; margin-bottom:5px; }
  .trace-wrap { overflow-x:auto; font-size:11px; border:1px solid var(--line-soft); border-radius:8px; padding:2px 4px; }
  .verdict-chip { display:inline-block; min-width:60px; padding:3px 9px; border-radius:11px;
    font-family:var(--mono); font-size:10.5px; font-weight:700; color:#fff; text-align:center; }
  .callout { border-radius:10px; padding:11px 13px; font-size:12.5px; line-height:1.5; margin-top:12px; }
  .callout.geo { border:1px solid var(--band-line); background:var(--band-fill); color:var(--band-ink); }
  .callout.prop { border:1px solid var(--robust-line); background:var(--robust-fill); color:var(--robust-ink); }
  .callout.miss { border:1px solid var(--line); background:var(--miss-fill); color:var(--ink-soft); }
  .callout b { color:inherit; }
  input[type=range]{ width:100%; accent-color:var(--band-ink); }
  .read { font-family:var(--mono); font-size:12px; margin-top:9px; min-height:34px; }
  .read b { color:var(--band-ink); }
  .mono { font-family:var(--mono); }
  .matrix-wrap { margin:2px; padding:14px 16px; border:1px solid var(--line); border-radius:12px;
    background:var(--panel); overflow-x:auto; }
  .matrix-wrap .cap { font-size:12px; color:var(--muted); margin-top:8px; }
  .eq { font-family:var(--mono); font-size:12px; color:var(--ink-soft); }
</style>
</head>
<body>
<div class="grid">

  <!-- Panel 1 — K3 → C3: band compiled, metric geometric -->
  <section class="panel geo">
    <div class="tag">geometric-only</div>
    <h3>K3 &rarr; C3</h3>
    <p class="sub">Civil population &rarr; "no fires into the port district"</p>

    <div class="row"><div class="lbl">The banded answer</div>${panel1.answer}<div style="margin-top:6px">${panel1.prov}</div></div>
    <div class="row"><div class="lbl">Compiled into the world (civil_density channel)</div>
      <div class="trace-wrap">${panel1.trace}</div></div>

    <div class="callout geo">
      <b>The metric never reads it.</b> C3's <span class="mono">fires</span> scorer counts FE-FALCON
      route legs inside the district — a purely geometric test. It never calls <span class="mono">channelAt</span>.
      <div class="eq" style="margin-top:8px">
        P2 &times; C3 <b>with</b> K3: fires = [${panel1.withK3.lo}, ${panel1.withK3.hi}]<br>
        P2 &times; C3 <b>without</b> K3: fires = [${panel1.withoutK3.lo}, ${panel1.withoutK3.hi}]
      </div>
      <div style="margin-top:6px">${panel1.identical ? '<b>Identical.</b> K3&rsquo;s band has zero effect on the verdict &mdash; honest by design.' : ''}</div>
    </div>
  </section>

  <!-- Panel 2 — K6 → C4: band propagates into the verdict -->
  <section class="panel prop">
    <div class="tag">band-propagating</div>
    <h3>K6 &rarr; C4</h3>
    <p class="sub">FAC sortie rate &rarr; "amphibious group not over-exposed"</p>

    <div class="row"><div class="lbl">The banded answer</div>${panel2.answer}<div style="margin-top:6px">${panel2.prov}</div></div>
    <div class="row"><div class="lbl">Compiled into the world (threat channel)</div>
      <div class="trace-wrap">${panel2.trace}</div></div>

    <div class="callout prop">
      <b>The metric reads it.</b> C4's <span class="mono">exposure</span> scorer walks FE-ANVIL's route and
      reads <span class="mono">channelAt</span> at each leg. In P1 the route enters <span class="mono">fac_waters</span>,
      so K6's band <span class="mono">[2, 6]</span> propagates into the exposure sum
      <span class="mono">[${panel2.exposure.lo}, ${panel2.exposure.hi}] ${panel2.exposure.unit}</span>.
    </div>

    <div class="row" style="margin-top:14px">
      <div class="lbl">Drag: how wide is the K6 assessment? (G6 — real scorer, per frame)</div>
      <input type="range" id="k6" min="0" max="${sliderFrames.length - 1}" value="2" step="1">
      <div class="read" id="k6read"></div>
    </div>
  </section>

  <!-- Panel 3 — K7 → C4: band compiled, route misses region -->
  <section class="panel miss">
    <div class="tag">route-dependent miss</div>
    <h3>K7 &rarr; C4</h3>
    <p class="sub">Air-defence envelope &rarr; the same C4, a different fate</p>

    <div class="row"><div class="lbl">The banded answer</div>${panel3.answer}<div style="margin-top:6px">${panel3.prov}</div></div>
    <div class="row"><div class="lbl">Compiled into the threat channel &mdash; region <span class="mono">air_defence</span></div>
      <div class="eq">The <span class="mono">exposure</span> metric <b>would</b> read it. But:</div>
    </div>

    <div class="callout miss">
      <div class="eq">
        P1 &nbsp;FE-ANVIL enters air_defence? <b>${panel3.p1InAD ? 'yes' : 'no'}</b><br>
        P2 &nbsp;FE-ANVIL enters air_defence? <b>${panel3.p2InAD ? 'yes' : 'no'}</b>
      </div>
      <div style="margin-top:8px"><b>The route never intersects the region</b>, so K7's band has zero effect on C4.
      K7's real role is <b>upstream</b>: it shapes which plans are <em>generated</em> (stand off Carrick, or enter
      the envelope), not how they are scored.</div>
    </div>
  </section>

</div>

<div class="matrix-wrap">
  <div class="lbl" style="margin-bottom:8px">Where it lands — P1/P2 &times; C3, C4 (the honest matrix, real scorer)</div>
  ${matrix}
  <div class="cap">Four-stop verdicts, no decimals on the face (hover a chip for its margin band). This is the
  Commander's view: C3 is geometric (K3-blind); C4 carries K6's propagated band.</div>
</div>

<script>
  // Each frame is the REAL ScoreService output for that K6 band width — captured
  // at build time via knowledge_overrides. Widening the band widens the margin
  // (G6). Nothing is computed in the browser.
  var FRAMES = ${JSON.stringify(sliderFrames)};
  var STOP = { robust:'#1E6B3A', marginal:'#7A6A12', tight:'#9A5212', violated:'#8A2020' };
  var slider = document.getElementById('k6');
  var read = document.getElementById('k6read');
  function render(){
    var f = FRAMES[Number(slider.value)];
    var band = f.lo === f.hi ? (f.lo + ' sorties/day (a single number)') : ('[' + f.lo + ', ' + f.hi + '] sorties/day');
    var chip = '<span class="verdict-chip" style="background:' + STOP[f.verdict] + '">' + f.verdict + '</span>';
    read.innerHTML =
      'K6 ' + (f.assessed ? '<b>(as assessed, low confidence)</b> ' : '') + '<b>' + band + '</b>' +
      '<br>&rarr; C4 margin <b>[' + f.marginLo + ', ' + f.marginHi + '] band-hours</b> &nbsp; ' + chip +
      (f.half === 0 ? '<br><span style="color:var(--muted)">a certain answer the source cannot support</span>' : '') +
      (f.half === 4 ? '<br><span style="color:var(--muted)">wider band, wider margin — less certain intelligence, less certain verdict</span>' : '');
  }
  slider.addEventListener('input', render);
  render();
</script>
</body>
</html>
`;

const outDir = new URL('docs/blog/embeds/qa-to-coa/', root);
mkdirSync(fileURLToPath(outDir), { recursive: true });
writeFileSync(fileURLToPath(new URL('index.html', outDir)), page);
console.log('wrote docs/blog/embeds/qa-to-coa/index.html');
