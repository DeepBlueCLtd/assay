/**
 * SPEC-14 (flow-view sub-slice) — the self-contained page shell.
 *
 * Wraps the pre-computed `FlowModel` (from `src/flow.ts`, driven by the real
 * seam) in one offline-clean HTML document: inline CSS, the model inlined as
 * JSON, and a framework-free browser renderer that swaps between the real
 * service/component outputs as the viewer dials zoom (L0/L1/L2) and mode
 * (tour/sandbox). No external network request, no runtime crypto, no bundler —
 * the embed constraint (spec §4.6, AS-11). System-font stack only (the wireframe's
 * one web-font reference is dropped — offline + CSP, spec §10).
 *
 * The browser code holds no seam logic: it is a pure `render(view)` over the
 * model, exactly `render = f(store, view-state)` (ui-design principle 4; spec §8).
 */
import type { FlowModel } from './flow.js';

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// The browser renderer, as a plain string (no template literals → no escaping
// clashes with this module's own template literal). `MODEL` is injected below.
const CLIENT = String.raw`
"use strict";
var M = window.__FLOW__;
var view = { zoom: "L1", mode: "tour", step: 0,
  sandbox: { coa: "R1", contest: "resolved", superseded: true, waiver: "granted" } };

function h(tag, attrs, html){
  var a = "";
  for (var k in attrs) a += " " + k + '="' + attrs[k] + '"';
  return "<" + tag + a + ">" + (html == null ? "" : html) + "</" + tag + ">";
}
function sandboxId(s){ return s.coa + "|" + s.contest + "|" + (s.superseded ? "K9" : "K5") + "|" + s.waiver; }
function currentState(){
  if (view.mode === "tour") return M.states[M.tour[view.step].stateId];
  return M.states[sandboxId(view.sandbox)];
}
function stampBadge(label, val){
  return '<span class="stamp"><span class="k">' + label + '</span> <b>' + (val || "—") + '</b></span>';
}
function lane(role, name, job, body){
  return '<div class="lane">' +
    '<div class="lanehead"><span class="rolechip">' + role + '</span>' +
    '<span class="rolename">' + name + '</span><span class="rolejob">' + job + '</span></div>' +
    '<div class="lanebody">' + body + '</div></div>';
}
function gatePulse(label){
  if (!label) return "";
  return '<div class="pulse">gate fired · <b>' + label + '</b></div>';
}
function scriptedTag(text){
  if (!text) return "";
  return '<div class="scripted">◑ scripted — not yet computed. ' + text + '</div>';
}
function deltaFeed(st){
  if (!st.deltas.length) return '<div class="empty">no writes yet — the opening tableau.</div>';
  var rows = st.deltas.slice().reverse().map(function(d){
    return '<div class="drow"><span class="seq">seq ' + d.seq + '</span>' +
      '<span class="role">' + d.actor + '</span>' +
      '<span class="op"><b>' + d.op + '</b> · ' + d.text + '</span></div>';
  }).join("");
  return '<div class="feed">' + rows + '</div>';
}
function staleBlock(st){
  if (!st.staleScripted) return "";
  var chips = st.staleScripted.flagged.map(function(f){ return '<span class="flag">⚑ ' + f + '</span>'; }).join(" ");
  return '<div class="stalebox"><div class="flags">' + chips + '</div>' + scriptedTag(st.staleScripted.note) + '</div>';
}

// ————— the three zoom layers (Shneiderman's mantra) —————

function renderL0(st){
  var line = st.outcome === "refused"
    ? "A gate fired — an honest outcome, not a bug. The flow paused where the discipline bit."
    : "A changed answer becomes a typed object; planning machinery uses it honestly — banded, stamped, traceable to a named owner — and a human decides.";
  return '<div class="l0">' +
    '<div class="claim">' + line + '</div>' +
    '<div class="loop">' +
      '<span class="node">knowledge</span><span class="arw">→</span>' +
      '<span class="node">world</span><span class="arw">→</span>' +
      '<span class="node">verdict</span><span class="arw">→</span>' +
      '<span class="node">least-worst</span><span class="arw">→</span>' +
      '<span class="node">decision</span>' +
    '</div>' +
    '<div class="hint">Dial zoom to <b>L1 · heartbeat</b> to watch it move, or <b>L2 · detail</b> to open any object.</div>' +
  '</div>';
}

function renderL1(st, beat){
  var planner;
  if (st.outcome === "refused"){
    planner = '<div class="refusalwrap">' + st.refusalHtml + '</div>';
  } else {
    planner = stampBadge("world", st.stampShort) + " " + stampBadge("handful", st.handfulStampShort) +
      '<div class="block">' + (st.stripHtml || "") + '</div>' +
      '<div class="block scroll">' + (st.matrixHtml || "") + '</div>';
  }
  var commander = st.relaxHtml
    ? '<div class="block scroll">' + st.relaxHtml + '</div>'
    : '<div class="empty">no relaxation needed on this world — /relax runs only where a commitment set is infeasible (R3m).</div>';
  var out = "";
  if (beat) out += '<div class="beatnote"><span class="beattag">' + beat.beat + '</span> ' + beat.narrative + '</div>';
  out += gatePulse(beat ? beat.gatePulse : (st.gate ? st.gate : ""));
  out += staleBlock(st);
  out += '<div class="lanes">' +
    lane("S1 · J-2", "Intelligence", "injects &amp; revises knowledge", st.writeNodes) +
    lane("S2 · J-3/5", "Planner", "compiles world · scores handful", planner) +
    lane("S3 · CMD", "Commander", "weighs least-worst · selects", commander) +
    lane("S4 · BRG", "Bridge", "watches — never writes", deltaFeed(st)) +
  '</div>';
  if (beat && beat.scripted) out += scriptedTag(beat.scripted);
  return out;
}

function renderL2(st){
  if (st.outcome === "refused"){
    return '<div class="refusalwrap">' + st.refusalHtml + '</div>' +
      '<div class="hint">No world compiled — there is nothing to trace. Resolve the gate (sandbox) to build a world, then drill in.</div>';
  }
  var waiver = st.waiverActive
    ? '<div class="waivernote">A <b>waives</b> edge is live — the W-1 waiver chip travels wherever the north-approach constraint bites (K8 → threat channel → the verdicts it drives).</div>'
    : "";
  return '<div class="l2head">Every channel value walks back to the named knowledge it came from, with its owner (G3). Pick a row; it terminates in a named owner.</div>' +
    waiver +
    '<div class="block scroll">' + (st.channelHtml || "") + '</div>' +
    '<div class="l2head">…and the verdicts scored from those channels:</div>' +
    '<div class="block scroll">' + (st.matrixHtml || "") + '</div>';
}

// ————— controls —————

function seg(labelPairs, current, onto){
  return labelPairs.map(function(p){
    var on = p[0] === current ? " on" : "";
    return '<button class="segbtn' + on + '" data-onto="' + onto + '" data-val="' + p[0] + '">' + p[1] + '</button>';
  }).join("");
}

function tourControls(){
  var t = M.tour[view.step];
  return '<div class="tourbar">' +
    '<button id="prev" ' + (view.step === 0 ? "disabled" : "") + '>◀ prev</button>' +
    '<span class="tourstep">beat ' + view.step + " / 6 · <b>" + t.title + "</b></span>" +
    '<button id="next" ' + (view.step === 6 ? "disabled" : "") + '>next ▶</button>' +
  '</div>';
}

function toggleRow(label, onto, options){
  var cur = view.sandbox[onto];
  var btns = options.map(function(o){
    var val = o[0], text = o[1];
    var on = String(val) === String(cur) ? " on" : "";
    return '<button class="tg' + on + '" data-sb="' + onto + '" data-val="' + val + '">' + text + '</button>';
  }).join("");
  return '<div class="act"><div class="atitle">' + label + '</div><div class="toggles">' + btns + '</div></div>';
}

function sandboxPalette(){
  return '<div class="palette">' +
    toggleRow("Red COA excursion", "coa", [["R1","R1"],["R2","R2"],["R3","R3"],["R3m","R3m"]]) +
    toggleRow("Contest / resolve K12", "contest", [["contested","contested"],["resolved","resolve → K12a"]]) +
    toggleRow("Supersede K5 → K9", "superseded", [["true","K9 live"],["false","revert K5"]]) +
    toggleRow("Grant / withhold W-1", "waiver", [["granted","granted"],["withheld","withhold"]]) +
  '</div>' +
  '<div class="palnote">Palette bounded on purpose (spec §4.3) — free-form authoring would wander into states the vignette does not define. Every action drives the real seam; <button id="undo">↺ undo — re-seed to the frozen tableau</button></div>';
}

// ————— top-level render —————

function render(){
  var st = currentState();
  var beat = view.mode === "tour" ? M.tour[view.step] : null;
  document.getElementById("zoomseg").innerHTML =
    seg([["L0","L0 · orient"],["L1","L1 · heartbeat"],["L2","L2 · detail"]], view.zoom, "zoom");
  document.getElementById("modeseg").innerHTML =
    seg([["tour","Tour"],["sandbox","Sandbox"]], view.mode, "mode");
  document.getElementById("worldstamp").innerHTML =
    stampBadge("world", st.stampShort) + " " + stampBadge("seed", String(M.seed));

  var body = "";
  if (view.zoom === "L0") body = renderL0(st);
  else if (view.zoom === "L2") body = renderL2(st);
  else body = renderL1(st, beat);
  document.getElementById("canvas").innerHTML = body;

  document.getElementById("modebar").innerHTML =
    view.mode === "tour" ? tourControls() : sandboxPalette();
  wire();
}

function wire(){
  var segs = document.querySelectorAll(".segbtn");
  for (var i = 0; i < segs.length; i++){
    segs[i].onclick = function(){
      var onto = this.getAttribute("data-onto"), val = this.getAttribute("data-val");
      if (onto === "zoom") view.zoom = val; else view.mode = val;
      render();
    };
  }
  var tgs = document.querySelectorAll(".tg");
  for (var j = 0; j < tgs.length; j++){
    tgs[j].onclick = function(){
      var onto = this.getAttribute("data-sb"), val = this.getAttribute("data-val");
      view.sandbox[onto] = (val === "true") ? true : (val === "false") ? false : val;
      render();
    };
  }
  var prev = document.getElementById("prev");
  if (prev) prev.onclick = function(){ if (view.step > 0){ view.step--; render(); } };
  var next = document.getElementById("next");
  if (next) next.onclick = function(){ if (view.step < 6){ view.step++; render(); } };
  var undo = document.getElementById("undo");
  if (undo) undo.onclick = function(){
    view.sandbox = { coa: "R1", contest: "resolved", superseded: true, waiver: "granted" };
    render();
  };
}

render();
`;

const CSS = `
  *{box-sizing:border-box}
  body{margin:0;background:#EDF0F2;color:#1B2732;font-family:system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.5}
  .wrap{max-width:1120px;margin:0 auto;padding:24px 22px 60px}
  header.mast{display:flex;align-items:baseline;gap:14px;border-bottom:3px solid #1B2732;padding-bottom:12px;flex-wrap:wrap}
  .wordmark{font-weight:800;font-size:26px;letter-spacing:.03em}
  .vig{font-size:14px;color:#5B6B77}
  .clock{margin-left:auto;font-family:ui-monospace,monospace;font-size:12px}
  .subnote{font-size:12px;color:#5B6B77;margin:8px 0 16px;max-width:82ch}
  .controls{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:6px 0 14px}
  .ctl-lab{font-family:ui-monospace,monospace;font-size:10px;color:#5B6B77;text-transform:uppercase;letter-spacing:.06em}
  .seg{display:flex;border:1px solid #1B2732;border-radius:4px;overflow:hidden}
  .segbtn{font-family:ui-monospace,monospace;font-size:11px;border:0;background:#fff;color:#1B2732;padding:5px 11px;cursor:pointer;border-right:1px solid #D8DFE4}
  .segbtn:last-child{border-right:0}
  .segbtn.on{background:#1B2732;color:#fff}
  .spacer{margin-left:auto}
  .stamp{font-family:ui-monospace,monospace;font-size:11px;background:#F1F3F5;border:1px solid #D8DFE4;padding:3px 8px;border-radius:3px;color:#5B6B77}
  .stamp b{color:#1B2732;font-weight:600}
  .stamp .k{color:#5B6B77}
  .panel{background:#fff;border:1px solid #D8DFE4;border-radius:6px;padding:14px}
  h2.sec{font-size:15px;margin:26px 0 4px;display:flex;align-items:center;gap:10px}
  h2.sec .tag{font-family:ui-monospace,monospace;font-size:10px;background:#1B2732;color:#fff;padding:2px 8px;border-radius:3px;letter-spacing:.05em}
  .lead{font-size:12px;color:#5B6B77;margin:2px 0 12px;max-width:82ch}
  .legend{display:grid;grid-template-columns:1fr 1fr;gap:14px}
  .legend h3{font-size:12.5px;margin:0 0 8px}
  .edge,.gate{display:flex;align-items:center;gap:8px;font-size:11.5px;margin-bottom:5px}
  .edge code{font-family:ui-monospace,monospace;font-size:11px;background:#F1F3F5;border:1px solid #D8DFE4;padding:1px 6px;border-radius:3px;min-width:106px;text-align:center}
  .gpill{font-family:ui-monospace,monospace;font-size:10px;background:#EEE7F6;color:#6B4C9A;border:1px solid #D3C6E8;padding:2px 8px;border-radius:10px;min-width:106px;text-align:center}
  .edge .desc,.gate .desc{color:#5B6B77}
  #canvas{margin-top:6px}
  .lanes{display:flex;flex-direction:column;border:1px solid #D8DFE4;border-radius:6px;overflow:hidden;background:#fff}
  .lane{display:grid;grid-template-columns:150px 1fr;border-top:1px dashed #D8DFE4}
  .lane:first-child{border-top:0}
  .lanehead{padding:12px 12px;border-right:2px solid #1B2732;display:flex;flex-direction:column;gap:3px;background:#FAFBFC}
  .rolechip{font-family:ui-monospace,monospace;font-size:10px;background:#1B2732;color:#fff;padding:2px 7px;border-radius:3px;align-self:flex-start}
  .rolename{font-weight:700;font-size:13px}
  .rolejob{font-size:11px;color:#5B6B77}
  .lanebody{padding:12px 14px;display:flex;align-items:flex-start;gap:8px;flex-wrap:wrap}
  .block{width:100%;margin-top:8px}
  .scroll{overflow-x:auto}
  .empty{font-size:11.5px;color:#8A97A0;font-style:italic}
  .feed{width:100%;font-family:ui-monospace,monospace}
  .drow{display:grid;grid-template-columns:56px 78px 1fr;gap:8px;font-size:11px;padding:5px 6px;border-bottom:1px solid #EDF0F2;align-items:center}
  .drow .seq{color:#8A97A0}
  .drow .op b{color:#6B4C9A}
  .beatnote{font-size:12.5px;color:#33424E;background:#F1F3F5;border:1px solid #D8DFE4;border-radius:6px;padding:10px 12px;margin-bottom:10px}
  .beattag{font-family:ui-monospace,monospace;font-size:10px;color:#5B6B77;margin-right:6px}
  .pulse{display:inline-block;font-family:ui-monospace,monospace;font-size:11px;color:#6B4C9A;background:#EEE7F6;border:1px solid #D3C6E8;border-radius:6px;padding:4px 10px;margin-bottom:10px;animation:pulse .5s ease}
  @keyframes pulse{from{background:#D3C6E8}to{background:#EEE7F6}}
  .scripted{font-size:11.5px;color:#9A6A14;background:#F7EDD8;border:1px solid #E7D3A6;border-radius:6px;padding:8px 11px;margin:10px 0}
  .stalebox{margin-bottom:10px}
  .flag{font-family:ui-monospace,monospace;font-size:11px;color:#9A6A14;margin-right:6px}
  .refusalwrap{width:100%}
  .waivernote{font-size:11.5px;color:#6B4C9A;background:#EEE7F6;border:1px solid #D3C6E8;border-radius:6px;padding:8px 11px;margin-bottom:10px}
  .l0{padding:22px 8px;text-align:center}
  .l0 .claim{font-size:19px;line-height:1.5;max-width:70ch;margin:0 auto 22px}
  .loop{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;align-items:center;margin-bottom:18px}
  .loop .node{border:1px solid #D8DFE4;border-radius:20px;padding:6px 14px;background:#fff;font-family:ui-monospace,monospace;font-size:12px}
  .loop .arw{color:#5B6B77}
  .l0 .hint,.hint{font-size:12px;color:#5B6B77;margin-top:6px}
  .l2head{font-size:12px;color:#5B6B77;margin:8px 0 4px}
  #modebar{margin-top:14px}
  .tourbar{display:flex;align-items:center;gap:12px}
  .tourbar button{font-family:ui-monospace,monospace;font-size:12px;border:1px solid #1B2732;background:#fff;color:#1B2732;padding:6px 12px;border-radius:4px;cursor:pointer}
  .tourbar button:disabled{opacity:.4;cursor:default}
  .tourstep{font-size:12.5px}
  .palette{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .act{border:1px solid #D8DFE4;border-radius:5px;padding:10px 12px;background:#FCFDFD}
  .atitle{font-family:ui-monospace,monospace;font-size:11px;font-weight:600;color:#1B2732}
  .toggles{display:flex;gap:5px;margin-top:8px;flex-wrap:wrap}
  .tg{font-family:ui-monospace,monospace;font-size:10.5px;border:1px solid #1B2732;background:#fff;color:#1B2732;padding:3px 9px;border-radius:3px;cursor:pointer}
  .tg.on{background:#1B2732;color:#fff}
  .palnote{font-size:11.5px;color:#5B6B77;margin-top:10px}
  .palnote button,#undo{font-family:ui-monospace,monospace;font-size:11px;border:1px solid #3E5D8A;background:#E6ECF6;color:#3E5D8A;padding:3px 9px;border-radius:3px;cursor:pointer}
  @media(max-width:820px){.legend{grid-template-columns:1fr}.palette{grid-template-columns:1fr}.lane{grid-template-columns:1fr}.lanehead{border-right:0;border-bottom:1px solid #D8DFE4}}
`;

export function renderFlowPage(model: FlowModel): string {
  const connectors = model.legend.connectors
    .map(([code, desc]) => `<div class="edge"><code>${esc(code)}</code><span class="desc">${esc(desc)}</span></div>`)
    .join('');
  const gates = model.legend.gates
    .map(([label, desc]) => `<div class="gate"><span class="gpill">${esc(label)}</span><span class="desc">${esc(desc)}</span></div>`)
    .join('');

  return `<!DOCTYPE html>
<!-- GENERATED by scripts/build-flow.ts (npm run flow) — do not edit by hand.
     Self-contained interactive system-flow infographic (SPEC-14 flow-view sub-slice).
     Every panel below is the shipped src/components/* output over the REAL in-browser
     seam (compile/score/handful/relax/knowledge), pre-rendered at build time over the
     frozen Meridian tableau; the browser swaps between real service outputs (spec §2.4,
     research note 07-flow-view.md §5). Offline-clean: no external request, no runtime
     crypto (embed constraint, spec §4.6 / AS-11). Identifiers frozen by vignette §8. -->
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ASSAY — system-flow infographic</title>
<style>${CSS}</style>
</head>
<body>
<div class="wrap">
  <header class="mast">
    <span class="wordmark">ASSAY</span>
    <span class="vig">System-flow infographic — Meridian Archipelago</span>
    <span class="clock">D+2 · step 8 · world ${esc(model.baseStampShort)}</span>
  </header>
  <div class="subnote">
    The S4 Bridge, grown into a stakeholder explainer. One canvas, three zoom layers, two modes —
    the flow of objects, typed connectors, and gates the demonstrator already models, driven by the
    real seam. Watch a mock operator inject or revise data and watch the honest consequence flow:
    instantly for the fan-out, visibly-and-stamped for the recompute, never silently. All values
    frozen by <code>assay-vignette.md</code> §8; every assessed value is banded (G2).
  </div>

  <div class="controls">
    <span class="ctl-lab">zoom</span><span id="zoomseg" class="seg"></span>
    <span class="ctl-lab" style="margin-left:8px">mode</span><span id="modeseg" class="seg"></span>
    <span class="spacer"></span>
    <span id="worldstamp"></span>
  </div>

  <details class="panel" style="margin-bottom:8px">
    <summary style="cursor:pointer;font-size:13px;font-weight:600">Connectors &amp; gates — the durable vocabulary</summary>
    <div class="legend" style="margin-top:12px">
      <div><h3>Connectors (edges)</h3>${connectors}</div>
      <div><h3>Gates</h3>${gates}</div>
    </div>
    <p class="lead" style="margin-top:10px">Seven typed connectors make every claim walkable both directions to a named owner (G3). Six gates are where the discipline bites — a refusal is an honest outcome, not an error. The comparability guard (G1) is live: ${esc(model.comparability.note)}</p>
  </details>

  <div id="canvas"></div>
  <div id="modebar"></div>

  <p class="lead" style="margin-top:24px">
    Generated by <code>npm run flow</code> from <code>fixtures/</code> over the real seam · one component in two homes
    (in-app S4 systems-map + this Pages embed) · auto-recompute is attribution-visible, never silent (spec §2.2);
    the truly-silent "you-are-the-optimiser" toggle stays deferred for an SME (concept §6.15 candidate d).
    Scripted-and-labelled where a computation is not yet built (staleness fan-out · selection) — never faked (DEC-4).
  </p>
</div>
<script>window.__FLOW__ = ${JSON.stringify(model)};</script>
<script>${CLIENT}</script>
</body>
</html>
`;
}
