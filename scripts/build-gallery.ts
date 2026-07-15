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
import { s2Matrix, type S2Cell } from '../src/components/s2Matrix.js';
import { handfulStrip, type HandfulStripRow } from '../src/components/handfulStrip.js';
import { s3Cards, type S3Card } from '../src/components/s3Cards.js';
import { scenarioStrip } from '../src/components/scenarioStrip.js';
import { sensitivityTable } from '../src/components/sensitivityTable.js';
import { discriminationTable } from '../src/components/discriminationTable.js';
import { stalenessFlags } from '../src/components/stalenessFlags.js';
import { RobustnessService } from '../src/robustness.js';
import { SensitivityService } from '../src/sensitivity.js';
import { DiscriminationService } from '../src/discrimination.js';
import { StalenessService } from '../src/staleness.js';
import { checkEncoding } from '../src/encoding.js';
import { confidenceLint } from '../src/lint.js';
import { KnowledgeService } from '../src/knowledge.js';
import { CompileService } from '../src/compile.js';
import { ScoreService } from '../src/score.js';
import { HandfulService } from '../src/handful.js';
import { RelaxService } from '../src/relax.js';
import { isRefusal } from '../src/seam.js';
import { ENGINE_VERSION } from '../src/engine.js';
import type {
  Commitment,
  CompiledWorld,
  KnowledgeObject,
  Plan,
  ScenarioCOA,
  VignetteConfig,
} from '../src/generated/types.js';

const knowledge = JSON.parse(
  readFileSync(new URL('../fixtures/knowledge.json', import.meta.url), 'utf8'),
) as KnowledgeObject[];
const coas = JSON.parse(
  readFileSync(new URL('../fixtures/coas.json', import.meta.url), 'utf8'),
) as ScenarioCOA[];
const commitments = JSON.parse(
  readFileSync(new URL('../fixtures/commitments.json', import.meta.url), 'utf8'),
) as Commitment[];
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
  engine_version: ENGINE_VERSION,
});
const compileRefusalHtml = isRefusal(contested) ? refusalBanner(contested) : '';

svc.contest('K12a', 'K12b');
svc.resolve('K12a', 'defector debrief corroborated; manifests predate the drawdown');
const compiled = await compiler.compile({
  knowledge: [...BASE, 'K12a'].map(refFor),
  config: vignetteConfig,
  engine_version: ENGINE_VERSION,
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

// SPEC-07/08 — the Stage-3 demo moment, "the honest matrix", now run over the
// GENERATED handful (SPEC-08) rather than a hand-authored one. /plan/handful
// fans out over Meridian's four axes, scores each candidate with the ACTUAL
// scorer, and organises by banded non-domination into 3–5 genuinely distinct
// plans — no author picked the set. The S2 matrix renders the survivors as
// four-stop chips (margins on hover, no decimals); the handful strip shows the
// organiser's derived reason each plan is in the set.
for (const c of commitments) await svc.store.put(c as unknown as Record<string, unknown>);
const scorer = new ScoreService({ store: svc.store, trace: svc.trace, config: vignetteConfig, commitments });
const handfulSvc = new HandfulService({ store: svc.store, scorer, config: vignetteConfig, commitments });
const matrixRows: S2Cell[] = [];
const stripRows: HandfulStripRow[] = [];
let handfulStamp = '';
if (!isRefusal(compiled)) {
  const h = await handfulSvc.handful({ world: compiled.world, seed: 1, engine_version: ENGINE_VERSION });
  if (!isRefusal(h)) {
    handfulStamp = h.stamp;
    h.plans.forEach((planRef, i) => {
      const plan = svc.store.get(planRef.content_hash) as Plan;
      stripRows.push({ plan: planRef, name: plan.name, distinct_because: h.organisation.distinct_because[i]! });
    });
    for (const planRef of h.plans) {
      const scored = await scorer.score({ plan: planRef, world: compiled.world, scenario: 'BASE', engine_version: ENGINE_VERSION });
      const plan = svc.store.get(planRef.content_hash) as Plan;
      if (!isRefusal(scored)) matrixRows.push({ plan: `${plan.logical_id} · ${plan.name}`, verdicts: scored.verdicts });
    }
  }
}
const s2 = matrixRows.length > 0 ? s2Matrix(['C1', 'C2', 'C3', 'C4', 'C5', 'C6'], matrixRows) : '';

// SPEC-11 — sensitivity: which beliefs bear load. Band-edge perturbation of each
// consumed knowledge object; rank by the number of commitment verdicts that change.
const sensitivitySvc = new SensitivityService({ store: svc.store, trace: svc.trace, config: vignetteConfig, commitments });
let sensitivityHtml = '';
let sensitivityStampLine = '';
if (!isRefusal(compiled) && stripRows.length > 0) {
  const sensResult = await sensitivitySvc.analyse({
    plan: stripRows[0]!.plan,
    world: compiled.world,
    scenario: 'BASE',
    engine_version: ENGINE_VERSION,
  });
  if (!isRefusal(sensResult)) {
    sensitivityHtml = sensitivityTable(sensResult.ranking);
    sensitivityStampLine = `<span style="font-family:ui-monospace,monospace;font-size:11px;color:#5B6B77">sensitivity stamp ${sensResult.stamp.slice(0, 16)}… · ${sensResult.ranking.length} knowledge objects perturbed · ranked by verdict-change count · single_source carried, not used in ranking (DEC-19)</span>`;
  }
}

// SPEC-12 — discrimination: which open questions separate COAs. COA-pair band
// separation over expected-answer miniatures (DEC-18). Cost shown alongside,
// never collapsed with value (DEC-19).
const k11 = kById.get('K11')!;
const k13 = kById.get('K13')!;
await svc.store.put(structuredClone(k11) as unknown as Record<string, unknown>);
await svc.store.put(structuredClone(k13) as unknown as Record<string, unknown>);
const k11Ref = svc.store.versions('K11').at(-1)!;
const k13Ref = svc.store.versions('K13').at(-1)!;
const discriminationSvc = new DiscriminationService({ store: svc.store });
let discriminationHtml = '';
let discriminationStampLine = '';
{
  const discResult = await discriminationSvc.analyse({
    questions: [k11Ref, k13Ref],
    coas: ['R1', 'R2', 'R3'],
    engine_version: ENGINE_VERSION,
  });
  if (!isRefusal(discResult)) {
    discriminationHtml = discriminationTable(discResult.ranking);
    discriminationStampLine = `<span style="font-family:ui-monospace,monospace;font-size:11px;color:#5B6B77">discrimination stamp ${discResult.stamp.slice(0, 16)}… · ${discResult.ranking.length} open questions ranked · COA-pair separation over expected-answer bands (DEC-18) · cost alongside, never collapsed (DEC-19)</span>`;
  }
}

// SPEC-13 — staleness: what goes stale when knowledge changes. Transitive forward
// trace walk from K9 (the storm-window knowledge that superseded K5); flags exactly
// the downstream verdicts and nothing else. Does not recompute — flags, then humans
// decide. K9 is in the compiled world so the trace walk finds real edges.
const stalenessSvc = new StalenessService({ store: svc.store, trace: svc.trace });
const k9Ref = svc.store.versions('K9').at(-1);
let stalenessHtml = '';
let stalenessStampLine = '';
if (k9Ref) {
  const staleResult = await stalenessSvc.analyse({ changed: k9Ref, engine_version: ENGINE_VERSION });
  if (!isRefusal(staleResult)) {
    stalenessHtml = stalenessFlags(staleResult.invalidated, staleResult.chains);
    stalenessStampLine = `<span style="font-family:ui-monospace,monospace;font-size:11px;color:#5B6B77">staleness stamp ${staleResult.stamp.slice(0, 16)}… · ${staleResult.invalidated.verdicts.length} verdicts + ${staleResult.invalidated.worlds.length} worlds invalidated · transitive walk from K9 · flags only, no recompute (constitution)</span>`;
  }
}
const strip = stripRows.length > 0 ? handfulStrip(stripRows) : '';
const scoreStampLine = handfulStamp
  ? `<span style="font-family:ui-monospace,monospace;font-size:11px;color:#5B6B77">handful stamp ${handfulStamp.slice(0, 16)}… · ${matrixRows.length} genuinely distinct plans, organised not authored · same stamp + seed ⇒ identical handful (G1) · every verdict carries a scored_from edge to the world (G3)</span>`
  : '';

// SPEC-09 — the Stage-4 demo moment, "least-worst, never silence", run end-to-end
// by the actual machinery: compile the R3m world (both approaches mined), then
// `/relax` the commitment set against it. No plan satisfies C2–C4 together, so the
// service returns the three inclusion-minimal least-worst candidates — sacrificing
// {C4,C5}, {C3,C5}, {C2,C5}: the dropped causeway forecloses C5 for every plan
// (SPEC-20, note 02 §6) — each stated in command language, the must-sacrifice
// ranked last but present, the same-tier tie-break stated. No author picked the
// sacrifices: the reused SPEC-07 scorer computed each candidate's `violated` set.
const commitmentById = new Map(commitments.map((c) => [c.logical_id, c]));
const r3m = await compiler.compile({
  knowledge: [...BASE, 'K12a'].map(refFor),
  config: vignetteConfig,
  scenario: 'R3m',
  engine_version: ENGINE_VERSION,
});
const relaxSvc = new RelaxService({ store: svc.store, trace: svc.trace, scorer, commitments });
let s3 = '';
let relaxStampLine = '';
if (!isRefusal(r3m)) {
  const rr = await relaxSvc.relax({ world: r3m.world, commitments: commitments.map((c) => refFor(c.logical_id)), seed: 1, engine_version: ENGINE_VERSION });
  if (!isRefusal(rr)) {
    const cards: S3Card[] = rr.report.candidates.map((candidate) => ({
      candidate,
      sacrificed: candidate.sacrificed.map((id) => {
        const c = commitmentById.get(id)!;
        return { logical_id: id, tier: c.tier, statement: c.statement };
      }),
    }));
    s3 = s3Cards(cards, rr.report.tie_break);
    relaxStampLine = `<span style="font-family:ui-monospace,monospace;font-size:11px;color:#5B6B77">relax stamp ${rr.stamp.slice(0, 16)}… · ${rr.report.candidates.length} least-worst candidates over R3m, computed not authored · never empty, never a silent drop (G4) · tie-break stated (DEC-19) · each candidate cited_in the report back to named knowledge (G3)</span>`;
  }
}

// SPEC-10 — the Stage-5 demo moment, "don't plan on most-likely": score the
// generated handful across BASE/R1/R2/R3 and render the scenario strip showing
// which plans collapse when an adversary COA is toggled. The R1-optimal
// strait-early plan visibly collapses under R2 while robust alternatives hold.
const robustnessSvc = new RobustnessService({ store: svc.store, scorer, commitments });
let scenarioStripHtml = '';
let robustnessStampLine = '';
if (!isRefusal(compiled)) {
  const scenarioWorlds: Record<string, import('../src/store.js').Ref> = { BASE: compiled.world };
  for (const sid of ['R1', 'R2', 'R3']) {
    const sw = await compiler.compile({
      knowledge: [...BASE, 'K12a'].map(refFor),
      config: vignetteConfig,
      scenario: sid,
      engine_version: ENGINE_VERSION,
    });
    if (!isRefusal(sw)) scenarioWorlds[sid] = sw.world;
  }
  if (Object.keys(scenarioWorlds).length > 1 && stripRows.length > 0) {
    const planRefs = stripRows.map((r) => r.plan);
    const rr = await robustnessSvc.robustness({ plans: planRefs, worlds: scenarioWorlds, engine_version: ENGINE_VERSION });
    if (!isRefusal(rr)) {
      const planNames: Record<string, string> = {};
      for (const row of stripRows) {
        planNames[row.plan.logical_id] = `${row.plan.logical_id} · ${row.name}`;
      }
      scenarioStripHtml = scenarioStrip(rr.tensor, { planNames });
      robustnessStampLine = `<span style="font-family:ui-monospace,monospace;font-size:11px;color:#5B6B77">robustness stamp ${rr.stamp.slice(0, 16)}… · ${rr.tensor.scenarios.length} scenarios × ${rr.tensor.plans.length} plans × ${rr.tensor.commitments.length} commitments · worst-case (minimax) verdict per plan×commitment · stamps_compatible=${rr.tensor.stamps_compatible}</span>`;
    }
  }
}

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
<h2 style="font-size:16px;margin-top:32px">Score & organise — the honest matrix (SPEC-07 · SPEC-08)</h2>
<p style="font-size:12.5px;color:#5B6B77">The Stage-3 demo moment, run end-to-end by the actual machinery: <code>/plan/handful</code> (SPEC-08) fans out over Meridian's four axes — approach, suppression, causeway, extraction — scores every candidate with the SPEC-07 scorer, and <b>organises by banded non-domination</b> into the genuinely distinct plans below. <b>No author picked the set</b>: a plan is kept only when no other conservatively beats it on every commitment (overlapping bands are honestly incomparable and both survive), and dropped only when strictly beaten everywhere — never on a scalar total (DEC-19). Each plan's reason is <i>derived</i> from the organiser, not captioned:</p>
<div style="margin:10px 0">${strip}</div>
<p style="font-size:12.5px;color:#5B6B77">The same handful, as the S2 planner matrix. Verdicts are a <b>four-stop scale</b> — robust / marginal / tight / violated, one colour language, <b>no decimals</b> anywhere; the banded <code>margin</code> rides on hover, never a headline number (G2). Each verdict propagates its metric by interval arithmetic — worst-and-best-case on pure bands, no midpoint (DEC-15) — validated by the vignette §9 oracle cases (O-1–O-3 exact, O-4 containment). <i>Pick a verdict, walk it to the assessment and owner it rests on:</i> every cell was written with a <code>scored_from</code> edge back to the world, whose channels trace to named knowledge above. ${scoreStampLine}</p>
<div style="background:#FCFDFD;border:1px solid #D8DFE4;border-radius:6px;padding:14px;overflow-x:auto">${s2}</div>
<h2 style="font-size:16px;margin-top:32px">Relax — least-worst, never silence (SPEC-09)</h2>
<p style="font-size:12.5px;color:#5B6B77">The Stage-4 demo moment, run end-to-end by the actual machinery. Against the <b>R3m</b> world (both approaches mined, the causeway dropped) no plan satisfies C2, C3 and C4 together — by construction (vignette §6) — and the dropped causeway forecloses <b>C5</b> ("taken intact") for every plan, so C5 rides in every sacrifice set as a scenario-imposed, computed loss (SPEC-20). <code>/relax</code> does not pick one compromise and hide the trade: it returns every <b>inclusion-minimal</b> way forward, each naming what it gives up in <b>command language</b>. The sacrifices are <b>computed</b> — a commitment is sacrificed only when the SPEC-07 scorer returns <code>violated</code> for it — not authored. Ranked <b>least-worst first</b> by the commander's ordinal tiers (<code>must / should / prefer</code>, <b>no numeric weight</b> — DEC-19): the two <code>should</code>-sacrifices lead, the <code>must</code>-sacrifice (C2, "the strait opens two days late") is <b>ranked last but present</b> — never dropped, never silent (G4). Plans that give up <i>more</i> — <code>{C2,C4,C5}</code>, <code>{C3,C4,C5}</code> — are inclusion-dominated and never shown as separate options. ${relaxStampLine}</p>
<div style="background:#FCFDFD;border:1px solid #D8DFE4;border-radius:6px;padding:14px;overflow-x:auto">${s3}</div>
<h2 style="font-size:16px;margin-top:32px">Scenario robustness — don't plan on most-likely (SPEC-10)</h2>
<p style="font-size:12.5px;color:#5B6B77">The Stage-5 demo moment (thesis C; JP 2-01.3: "don't plan on most-likely"). The generated handful scored across <b>BASE, R1, R2, R3</b> — the adversary COA set from the vignette. Each cell is a four-stop verdict chip; a <b>▼</b> marks a verdict that dropped from its BASE value under that scenario ("collapse"). The <b>worst</b> column is the minimax: the plan's worst verdict for that commitment across all scenarios — a real verdict on a real scenario, not a weighted blend (DEC-15/19). <i>Toggle R2 (Strait Denial) and watch the strait-early plan die on C1/C2 while robust alternatives hold.</i> ${robustnessStampLine}</p>
<div style="background:#FCFDFD;border:1px solid #D8DFE4;border-radius:6px;padding:14px;overflow-x:auto">${scenarioStripHtml}</div>
<h2 style="font-size:16px;margin-top:32px">Sensitivity — which beliefs bear load (SPEC-11)</h2>
<p style="font-size:12.5px;color:#5B6B77">The Stage-6 sensitivity demo moment (thesis E). Band-edge perturbation of each consumed knowledge object against the first handful plan: push each answer to its lo and hi edges, re-score, and count how many commitment verdicts change. <b>K8 tops the ranking</b> with <code>single_source: true</code> — its band-edge perturbation changes C4 verdicts via the battery fire-control threshold. The <code>single_source</code> flag is carried through from provenance, <b>never used in the ranking arithmetic</b> (DEC-19) — shown alongside so the commander sees the collection risk without it being laundered into a scalar. ${sensitivityStampLine}</p>
<div style="background:#FCFDFD;border:1px solid #D8DFE4;border-radius:6px;padding:14px;overflow-x:auto">${sensitivityHtml}</div>
<h2 style="font-size:16px;margin-top:32px">Discrimination — which questions separate COAs (SPEC-12)</h2>
<p style="font-size:12.5px;color:#5B6B77">The Stage-6 discrimination demo moment (thesis D). COA-pair band separation over open questions' expected-answer miniatures (DEC-18): for each open question with <code>expected_answers</code>, measure how well the answer bands separate each pair of adversary COAs. <b>K11 ranks above K13</b> despite higher collection cost — the R1/R2 expected-answer bands are disjoint (mines loaded vs not), while K13's radio-traffic bands overlap across all COAs. Cost is shown alongside, <b>never collapsed with value</b> (DEC-19): the commander sees both and decides. No Shannon entropy, no VOI, no scenario weights (research note 08-analysis.md §3). ${discriminationStampLine}</p>
<div style="background:#FCFDFD;border:1px solid #D8DFE4;border-radius:6px;padding:14px;overflow-x:auto">${discriminationHtml}</div>
<h2 style="font-size:16px;margin-top:32px">Staleness — what goes stale when knowledge changes (SPEC-13)</h2>
<p style="font-size:12.5px;color:#5B6B77">The Stage-6 staleness demo moment (thesis F). Transitive forward trace walk from <b>K9</b> (the storm-window knowledge that superseded K5): follow every downstream edge — <code>consumed_by</code>, <code>scored_from</code>, <code>compiled_into</code> — using the <code>EDGE_ORIENTATION</code> map from <code>traceView.ts</code>. The walk flags <b>exactly the dependent verdicts</b> and nothing else. It does <b>not recompute</b> — the constitution says flags, then humans decide. ${stalenessStampLine}</p>
<div style="background:#FCFDFD;border:1px solid #D8DFE4;border-radius:6px;padding:14px;overflow-x:auto">${stalenessHtml}</div>
<p style="font-size:11.5px;color:#5B6B77;margin-top:28px">Generated from <code>fixtures/</code> by <code>npm run gallery</code> · identifiers frozen per assay-vignette.md §8 · compile per research note <code>docs/research/02-compile.md</code> · score per <code>docs/research/03-score-plan.md</code> · relax per <code>docs/research/04-relaxation.md</code> · robustness per <code>docs/research/06-robustness.md</code> · analysis per <code>docs/research/08-analysis.md</code></p>
</div>
</body>
</html>
`;

mkdirSync(new URL('../docs/assets/gallery/', import.meta.url), { recursive: true });
writeFileSync(new URL('../docs/assets/gallery/index.html', import.meta.url), html);
console.log('wrote docs/assets/gallery/index.html');
