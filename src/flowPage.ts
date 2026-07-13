/**
 * SPEC-14 (flow-view sub-slice) — the self-contained page shell.
 *
 * Wraps the pre-computed `FlowModel` (from `src/flow.ts`, driven by the real
 * seam) in one offline-clean HTML document: inline CSS, the model inlined as
 * JSON, and a framework-free browser renderer that swaps between the real
 * service/component outputs as the viewer dials zoom (L0/L1/L2) and mode
 * (tour/sandbox). No external network request, no runtime crypto, no bundler —
 * the embed constraint (spec §4.6, AS-11). System-font stack only.
 *
 * The renderer is a pure `render(view)` over the model (ui-design principle 4;
 * spec §8). It draws three things the seam does not: a **pipeline rail** (the
 * five stages + six gates, the active one lit — the flow made visible), a
 * **Meridian map** (SVG over the real config region geometry, with the current
 * world's threat/mobility channel overrides overlaid — a projection, never a
 * hand-drawn claim; the map is concept §6.15 candidate c, built under delegated
 * authority), and **motion** (a token travelling the rail, gate-fire flashes,
 * beat transitions, ▶ auto-play). None of it computes; all of it arranges.
 */
import type { FlowModel } from './flow.js';

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// The browser renderer, as a plain string (no template literals → no escaping
// clashes with this module's own template literal). `MODEL` is injected below.
const CLIENT = String.raw`
"use strict";
var M = window.__FLOW__;
var STAGES = [
  { id:"knowledge", label:"Knowledge", role:"J-2 injects & revises" },
  { id:"compile",   label:"Compile",   role:"world of channels" },
  { id:"score",     label:"Score",     role:"the honest matrix" },
  { id:"relax",     label:"Least-worst", role:"never a silent drop" },
  { id:"decide",    label:"Decide",    role:"a human commits" }
];
// Which gate sits at which stage boundary (glyph on the rail).
var RAIL_GATES = {
  knowledge: ["encoding lint","waiver gate","staleness · F"],
  compile:   ["contest · G5","comparability · G1"],
  relax:     ["least-worst · G4"]
};
var view = { zoom:"L1", mode:"tour", step:0,
  sandbox:{ coa:"R1", contest:"resolved", superseded:true, waiver:"granted" } };
var playing = false, timer = null;

function sandboxId(s){ return s.coa+"|"+s.contest+"|"+(s.superseded?"K9":"K5")+"|"+s.waiver; }
function currentState(){
  return view.mode==="tour" ? M.states[M.tour[view.step].stateId] : M.states[sandboxId(view.sandbox)];
}
function currentBeat(){ return view.mode==="tour" ? M.tour[view.step] : null; }
function activeStage(){
  var b = currentBeat();
  if (b) return b.stage;
  var st = currentState();
  if (st.outcome==="refused") return "compile";
  if (st.relaxHtml) return "relax";
  return "score";
}
function firedGate(){
  var b = currentBeat();
  if (b && b.gatePulse) return b.gatePulse;
  var st = currentState();
  return st.gate || null;
}
function stampBadge(label,val){ return '<span class="stamp"><span class="k">'+label+'</span> <b>'+(val||"—")+'</b></span>'; }

// ————— the pipeline rail (the flow, made visible) —————

function railHtml(){
  var active = activeStage();
  var fired = firedGate();
  var activeIdx = STAGES.map(function(s){return s.id;}).indexOf(active);
  var cells = STAGES.map(function(s, i){
    var cls = "railstage" + (i===activeIdx?" on":"") + (i<activeIdx?" past":"");
    var gates = (RAIL_GATES[s.id]||[]).map(function(g){
      var gf = (g===fired) ? " firing" : "";
      return '<span class="railgate'+gf+'" title="'+g+'">'+(gf?"◆":"◇")+'</span>';
    }).join("");
    return '<div class="'+cls+'" data-idx="'+i+'">'+
      '<div class="railtop">'+gates+'</div>'+
      '<div class="raildot"></div>'+
      '<div class="raillabel">'+s.label+'</div>'+
      '<div class="railrole">'+s.role+'</div></div>';
  }).join('<div class="raillink"></div>');
  var pct = ((activeIdx + 0.5) / STAGES.length) * 100;
  return '<div class="rail"><div class="railtoken" style="left:'+pct+'%"></div>'+cells+'</div>';
}

// ————— the Meridian map (SVG over real region geometry + live overlays) —————

var NAME = {
  approach:"N. approach", voss_chain:"S. approach", halcyon_strait:"Halcyon Strait",
  causeway:"Causeway", port_district:"Port", garrison:"Garrison", open_water:"Open water",
  fac_waters:"FAC waters", air_defence:"Air defence", battery:"Carrick battery",
  mine_stock:"Mine stock", ledger_quay:"Ledger quay", hq:"HQ", carrick:"Carrick Head"
};
var WATER = {open_water:1, halcyon_strait:1, approach:1, voss_chain:1, fac_waters:1};
var THREATISH = {battery:1, carrick:1, air_defence:1, mine_stock:1, garrison:1, fac_waters:1};
// A curated set of well-separated anchors gets an on-map label (curated x,y so the
// nested real geometry does not pile text up); the rest are named in the chips below.
var LABELPOS = {
  approach:[10,9,"N. approach"], voss_chain:[13,47,"S. approach"],
  open_water:[9,56,"Open water"], carrick:[48,12,"Carrick"],
  halcyon_strait:[30,19,"Halcyon Strait"], port_district:[33,44,"Port"]
};

function mapHtml(st){
  var g = M.grid, W = g.cols, H = g.rows;
  var byRegion = {};
  st.overlay.forEach(function(o){
    var cur = byRegion[o.region];
    if (!cur || o.hi > cur.hi || (o.kind==="threat" && cur.kind!=="threat")) byRegion[o.region] = o;
  });
  // draw larger regions first so small ones (battery, quay) sit on top
  var regions = M.map.slice().sort(function(a,b){
    return ((b.x1-b.x0)*(b.y1-b.y0)) - ((a.x1-a.x0)*(a.y1-a.y0));
  });
  var rects = regions.map(function(r){
    var x=r.x0, y=r.y0, w=r.x1-r.x0+1, h=r.y1-r.y0+1;
    var base = WATER[r.name] ? "#DCEAF2" : (THREATISH[r.name] ? "#EFE0DD" : "#E7EADB");
    var stroke = THREATISH[r.name] ? "#CBB0AB" : "#C4CFC0";
    var dash = THREATISH[r.name] ? ' stroke-dasharray="1.2 1"' : "";
    var ov = byRegion[r.name];
    var extra = "";
    if (ov && ov.kind==="threat" && ov.hi>0){
      base = ov.fromScenario ? "#F3C4BB" : "#EBD0CA";
      stroke = "#B5453A"; dash = "";
      extra = '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="url(#haz)" opacity="0.85"/>'
        + (ov.fromScenario ? '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="#B5453A" opacity="0.1"><animate attributeName="opacity" values="0.04;0.24;0.04" dur="1.6s" repeatCount="indefinite"/></rect>' : "");
    } else if (ov && ov.kind==="mobility" && ov.hi===0){
      stroke = "#8A2020";
      extra = '<line x1="'+x+'" y1="'+y+'" x2="'+(x+w)+'" y2="'+(y+h)+'" stroke="#8A2020" stroke-width="1"/><line x1="'+(x+w)+'" y1="'+y+'" x2="'+x+'" y2="'+(y+h)+'" stroke="#8A2020" stroke-width="1"/>';
    }
    return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="'+base+'" fill-opacity="0.6" stroke="'+stroke+'" stroke-width="0.35"'+dash+' rx="0.6"/>'+extra;
  }).join("");
  var labels = Object.keys(LABELPOS).map(function(name){
    var p = LABELPOS[name];
    return '<text x="'+p[0]+'" y="'+p[1]+'" font-size="2.6" fill="#2A3742" text-anchor="middle" font-family="system-ui" font-weight="600" style="paint-order:stroke;stroke:#EAF1F5;stroke-width:1.1">'+p[2]+'</text>';
  }).join("");
  rects += labels;
  // active-threat chips beneath the map
  var chips = st.overlay.filter(function(o){ return (o.kind==="threat"&&o.hi>0)||(o.kind==="mobility"&&o.hi===0); })
    .map(function(o){
      var isMob = o.kind==="mobility";
      var txt = isMob ? (NAME[o.region]||o.region)+" impassable" : (NAME[o.region]||o.region)+" · threat "+o.lo+"–"+o.hi;
      var cls = o.fromScenario ? "mapchip ex" : "mapchip";
      return '<span class="'+cls+'">'+(o.fromScenario?"⚠ ":"")+txt+'</span>';
    }).join("");
  var exNote = st.key.coa!=="BASE" ? '<span class="mapex">excursion '+st.key.coa+'</span>' : '<span class="mapex base">base world</span>';
  return '<div class="mappanel">'+
    '<div class="maphead">Meridian · '+exNote+'<span class="maphint">named regions to grid scale · live channel overlay</span></div>'+
    '<svg viewBox="-1 -1 '+(W+2)+' '+(H+2)+'" class="mapsvg" preserveAspectRatio="xMidYMid meet">'+
      '<defs><pattern id="haz" width="2.4" height="2.4" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">'+
        '<line x1="0" y1="0" x2="0" y2="2.4" stroke="#B5453A" stroke-width="0.7"/></pattern></defs>'+
      '<rect x="-1" y="-1" width="'+(W+2)+'" height="'+(H+2)+'" fill="#EAF1F5"/>'+ rects +
    '</svg>'+
    '<div class="mapchips">'+(chips||'<span class="mapchip calm">no active threat overlay on this world</span>')+'</div>'+
  '</div>';
}

// ————— lanes & panels —————

function lane(role,name,job,body,tint){
  return '<div class="lane" style="--tint:'+tint+'">'+
    '<div class="lanehead"><span class="rolechip">'+role+'</span>'+
    '<span class="rolename">'+name+'</span><span class="rolejob">'+job+'</span></div>'+
    '<div class="lanebody">'+body+'</div></div>';
}
function scriptedTag(t){ return t ? '<div class="scripted">◑ <b>scripted — not yet computed.</b> '+t+'</div>' : ""; }
function deltaFeed(st){
  if (!st.deltas.length) return '<div class="empty">no writes yet — the opening tableau.</div>';
  return '<div class="feed">'+ st.deltas.slice().reverse().map(function(d){
    return '<div class="drow"><span class="seq">seq '+d.seq+'</span><span class="role">'+d.actor+
      '</span><span class="op"><b>'+d.op+'</b> · '+d.text+'</span></div>';
  }).join("") +'</div>';
}
function staleBlock(st){
  if (!st.staleScripted) return "";
  var chips = st.staleScripted.flagged.map(function(f){ return '<span class="flag">⚑ '+f+'</span>'; }).join(" ");
  return '<div class="stalebox"><div class="flags">fan-out flags: '+chips+'</div>'+scriptedTag(st.staleScripted.note)+'</div>';
}
function gateBanner(fired){
  if (!fired) return "";
  return '<div class="gatebanner" data-gate="'+fired+'">◆ gate fired · <b>'+fired+'</b></div>';
}

function renderL0(st){
  var line = st.outcome==="refused"
    ? "A gate fired — an honest outcome, not a bug. The flow paused where the discipline bit."
    : "A changed answer becomes a typed object; planning machinery uses it honestly — banded, stamped, traceable to a named owner — and a human decides.";
  return railHtml()+
    '<div class="l0">'+
      '<div class="claim">'+line+'</div>'+
      '<div class="loop">'+STAGES.map(function(s,i){
        return '<span class="node">'+s.label.toLowerCase()+'</span>'+(i<STAGES.length-1?'<span class="arw">→</span>':'');
      }).join("")+'</div>'+
      '<div class="hint">Dial zoom to <b>L1 · heartbeat</b> to watch it move, or <b>L2 · detail</b> to open any object.</div>'+
    '</div>';
}

function renderL1(st, beat){
  var planner;
  if (st.outcome==="refused") planner = '<div class="refusalwrap">'+st.refusalHtml+'</div>';
  else planner = stampBadge("world",st.stampShort)+" "+stampBadge("handful",st.handfulStampShort)+
    '<div class="block scroll">'+(st.matrixHtml||"")+'</div>';
  var commander = st.relaxHtml ? '<div class="block scroll">'+st.relaxHtml+'</div>'
    : '<div class="standby">standing by — /relax runs only where a commitment set is infeasible (R3m).</div>';

  var out = railHtml();
  if (beat) out += '<div class="beatnote"><span class="beattag">'+beat.beat+'</span> '+beat.narrative+'</div>';
  out += gateBanner(firedGate());
  out += staleBlock(st);
  out += '<div class="l1grid"><div class="lanes">'+
    lane("S1 · J-2","Intelligence","injects &amp; revises knowledge", st.writeNodes, "#14655F") +
    lane("S2 · J-3/5","Planner","compiles world · scores handful", planner, "#3E5D8A") +
    lane("S3 · CMD","Commander","weighs least-worst · selects", commander, "#5B3B8C") +
    lane("S4 · BRG","Bridge","watches — never writes", deltaFeed(st), "#5B6B77") +
  '</div><div class="mapcol">'+mapHtml(st)+'</div></div>';
  if (beat && beat.scripted) out += scriptedTag(beat.scripted);
  return out;
}

function renderL2(st){
  if (st.outcome==="refused")
    return railHtml()+'<div class="refusalwrap">'+st.refusalHtml+'</div>'+
      '<div class="hint">No world compiled — nothing to trace. Resolve the gate (sandbox) to build a world, then drill in.</div>';
  var waiver = st.waiverActive
    ? '<div class="waivernote">A <b>waives</b> edge is live — the W-1 waiver travels wherever the north-approach constraint bites (K8 → threat channel → the verdicts it drives).</div>' : "";
  return railHtml()+
    '<div class="l2head">Every channel value walks back to the named knowledge it came from, with its owner (G3) — pick a row; it terminates in a named owner.</div>'+
    waiver+
    '<div class="block scroll">'+(st.channelHtml||"")+'</div>'+
    '<div class="l2head">Why each plan is in the handful (the organiser’s derived reason):</div>'+
    '<div class="block scroll">'+(st.stripHtml||"")+'</div>'+
    '<div class="l2head">…and the verdicts scored from those channels:</div>'+
    '<div class="block scroll">'+(st.matrixHtml||"")+'</div>';
}

// ————— controls —————

function seg(pairs,current,onto){
  return pairs.map(function(p){
    return '<button class="segbtn'+(p[0]===current?" on":"")+'" data-onto="'+onto+'" data-val="'+p[0]+'">'+p[1]+'</button>';
  }).join("");
}
function tourControls(){
  var t = M.tour[view.step];
  return '<div class="tourbar">'+
    '<button id="prev" '+(view.step===0?"disabled":"")+'>◀</button>'+
    '<button id="play">'+(playing?"⏸ pause":"▶ play")+'</button>'+
    '<button id="next" '+(view.step===6?"disabled":"")+'>▶</button>'+
    '<span class="tourstep">beat '+view.step+' / 6 · <b>'+t.title+'</b></span>'+
    '<span class="dots">'+M.tour.map(function(_,i){return '<span class="dot'+(i===view.step?" on":"")+'"></span>';}).join("")+'</span>'+
  '</div>';
}
function toggleRow(label,onto,options){
  var cur = view.sandbox[onto];
  var btns = options.map(function(o){
    return '<button class="tg'+(String(o[0])===String(cur)?" on":"")+'" data-sb="'+onto+'" data-val="'+o[0]+'">'+o[1]+'</button>';
  }).join("");
  return '<div class="act"><div class="atitle">'+label+'</div><div class="toggles">'+btns+'</div></div>';
}
function sandboxPalette(){
  return '<div class="palette">'+
    toggleRow("Red COA excursion","coa",[["R1","R1"],["R2","R2"],["R3","R3"],["R3m","R3m"]])+
    toggleRow("Contest / resolve K12","contest",[["contested","contested"],["resolved","resolve → K12a"]])+
    toggleRow("Supersede K5 → K9","superseded",[["true","K9 live"],["false","revert K5"]])+
    toggleRow("Grant / withhold W-1","waiver",[["granted","granted"],["withheld","withhold"]])+
  '</div>'+
  '<div class="palnote">Bounded on purpose (spec §4.3) — every action drives the real seam. '+
  '<button id="undo">↺ undo — re-seed to the frozen tableau</button></div>';
}

// ————— top-level render —————

function stopPlay(){ playing=false; if(timer){clearInterval(timer);timer=null;} }
function render(){
  var st = currentState();
  var beat = currentBeat();
  document.getElementById("zoomseg").innerHTML = seg([["L0","L0 · orient"],["L1","L1 · heartbeat"],["L2","L2 · detail"]], view.zoom, "zoom");
  document.getElementById("modeseg").innerHTML = seg([["tour","Tour"],["sandbox","Sandbox"]], view.mode, "mode");
  document.getElementById("worldstamp").innerHTML = stampBadge("world",st.stampShort)+" "+stampBadge("seed",String(M.seed));
  var canvas = document.getElementById("canvas");
  canvas.className = "swap";
  var body = view.zoom==="L0" ? renderL0(st) : view.zoom==="L2" ? renderL2(st) : renderL1(st, beat);
  canvas.innerHTML = body;
  // retrigger the fade-in transition
  void canvas.offsetWidth; canvas.classList.add("in");
  document.getElementById("modebar").innerHTML = view.mode==="tour" ? tourControls() : sandboxPalette();
  wire();
}
function step(delta){
  var n = view.step + delta;
  if (n<0||n>6) return;
  view.step = n; render();
  if (playing && view.step===6) stopPlay(), render();
}
function wire(){
  document.querySelectorAll(".segbtn").forEach(function(b){
    b.onclick=function(){ var o=this.getAttribute("data-onto"),v=this.getAttribute("data-val");
      if(o==="zoom")view.zoom=v; else { view.mode=v; stopPlay(); } render(); };
  });
  document.querySelectorAll(".tg").forEach(function(b){
    b.onclick=function(){ var o=this.getAttribute("data-sb"),v=this.getAttribute("data-val");
      view.sandbox[o]=(v==="true")?true:(v==="false")?false:v; render(); };
  });
  var prev=document.getElementById("prev"); if(prev)prev.onclick=function(){ stopPlay(); step(-1); };
  var next=document.getElementById("next"); if(next)next.onclick=function(){ stopPlay(); step(1); };
  var play=document.getElementById("play"); if(play)play.onclick=function(){
    if(playing){ stopPlay(); render(); }
    else { if(view.step===6)view.step=0; playing=true; render(); timer=setInterval(function(){ step(1); },4200); }
  };
  var undo=document.getElementById("undo"); if(undo)undo.onclick=function(){
    view.sandbox={ coa:"R1", contest:"resolved", superseded:true, waiver:"granted" }; render(); };
}
render();
`;

const CSS = `
  *{box-sizing:border-box}
  body{margin:0;background:#EDF0F2;color:#1B2732;font-family:system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.5}
  .wrap{max-width:1200px;margin:0 auto;padding:22px 20px 60px}
  header.mast{display:flex;align-items:baseline;gap:14px;border-bottom:3px solid #1B2732;padding-bottom:12px;flex-wrap:wrap}
  .wordmark{font-weight:800;font-size:26px;letter-spacing:.03em}
  .vig{font-size:14px;color:#5B6B77}
  .clock{margin-left:auto;font-family:ui-monospace,monospace;font-size:12px}
  .subnote{font-size:12px;color:#5B6B77;margin:8px 0 14px;max-width:88ch}
  .controls{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:6px 0 12px}
  .ctl-lab{font-family:ui-monospace,monospace;font-size:10px;color:#5B6B77;text-transform:uppercase;letter-spacing:.06em}
  .seg{display:flex;border:1px solid #1B2732;border-radius:5px;overflow:hidden}
  .segbtn{font-family:ui-monospace,monospace;font-size:11px;border:0;background:#fff;color:#1B2732;padding:6px 12px;cursor:pointer;border-right:1px solid #D8DFE4}
  .segbtn:last-child{border-right:0}
  .segbtn.on{background:#1B2732;color:#fff}
  .spacer{margin-left:auto}
  .stamp{font-family:ui-monospace,monospace;font-size:11px;background:#F1F3F5;border:1px solid #D8DFE4;padding:3px 8px;border-radius:3px;color:#5B6B77}
  .stamp b{color:#1B2732;font-weight:600} .stamp .k{color:#5B6B77}

  /* legend strip */
  .legendstrip{display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;background:#fff;border:1px solid #D8DFE4;border-radius:8px;padding:9px 12px;margin-bottom:10px;font-size:11px}
  .legendstrip .grp{font-family:ui-monospace,monospace;font-size:9.5px;letter-spacing:.05em;text-transform:uppercase;color:#8A97A0;margin-right:2px}
  .legendstrip code{font-family:ui-monospace,monospace;font-size:10.5px;background:#F1F3F5;border:1px solid #E2E7EB;border-radius:3px;padding:1px 6px;color:#33424E}
  .legendstrip .gp{font-family:ui-monospace,monospace;font-size:10px;background:#EEE7F6;color:#6B4C9A;border:1px solid #D3C6E8;border-radius:10px;padding:1px 8px}

  /* the pipeline rail */
  .rail{position:relative;display:flex;align-items:stretch;background:linear-gradient(#fff,#FAFBFC);border:1px solid #D8DFE4;border-radius:10px;padding:14px 10px 12px;margin-bottom:12px;overflow:hidden}
  .rail::before{content:"";position:absolute;left:10%;right:10%;top:47px;height:3px;background:#E4E9ED;border-radius:2px;z-index:1}
  .railtoken{position:absolute;top:41px;width:13px;height:13px;background:#3E5D8A;border:2px solid #fff;border-radius:50%;box-shadow:0 0 0 3px rgba(62,93,138,.25),0 1px 4px rgba(27,39,50,.3);transform:translateX(-50%);transition:left .6s cubic-bezier(.5,0,.2,1);z-index:3}
  .railstage{flex:1;position:relative;text-align:center;padding:0 4px;z-index:2}
  .raillink{flex:0 0 0}
  .railtop{height:16px;display:flex;justify-content:center;gap:4px}
  .railgate{font-size:10px;color:#B9A6D6;line-height:1}
  .railgate.firing{color:#8A2020;animation:gflash .5s ease 3}
  @keyframes gflash{0%,100%{transform:scale(1)}50%{transform:scale(1.8)}}
  .raildot{width:14px;height:14px;border-radius:50%;background:#E4E9ED;border:2px solid #fff;margin:6px auto 6px;box-shadow:0 0 0 1px #D8DFE4}
  .railstage.past .raildot{background:#9BB3D0}
  .railstage.on .raildot{background:#3E5D8A;box-shadow:0 0 0 4px rgba(62,93,138,.18)}
  .raillabel{font-weight:700;font-size:12px;color:#8A97A0}
  .railstage.on .raillabel{color:#1B2732}
  .railstage.past .raillabel{color:#5B6B77}
  .railrole{font-size:10px;color:#A6B0B8;margin-top:1px}
  .railstage.on .railrole{color:#5B6B77}

  /* canvas + transition */
  #canvas.swap{opacity:0;transform:translateY(6px)}
  #canvas.swap.in{opacity:1;transform:none;transition:opacity .3s ease,transform .3s ease}

  .beatnote{font-size:13px;color:#26323C;background:#F1F3F5;border:1px solid #D8DFE4;border-left:3px solid #3E5D8A;border-radius:8px;padding:11px 13px;margin-bottom:10px}
  .beattag{font-family:ui-monospace,monospace;font-size:10px;color:#5B6B77;margin-right:6px}
  .gatebanner{font-family:ui-monospace,monospace;font-size:12px;color:#6B4C9A;background:#EEE7F6;border:1px solid #D3C6E8;border-radius:8px;padding:9px 13px;margin-bottom:10px;animation:gatein .5s ease}
  .gatebanner[data-gate^="least"]{color:#8A2020;background:#F8E2E2;border-color:#EFC6C6}
  .gatebanner[data-gate^="contest"]{color:#8A2020;background:#F8E2E2;border-color:#EFC6C6}
  @keyframes gatein{from{transform:scale(.98);opacity:.4}to{transform:none;opacity:1}}
  .scripted{font-size:11.5px;color:#9A6A14;background:#F7EDD8;border:1px solid #E7D3A6;border-radius:8px;padding:8px 11px;margin:10px 0}
  .stalebox{margin-bottom:10px}
  .flags{font-size:11.5px;color:#9A6A14;margin-bottom:4px}
  .flag{font-family:ui-monospace,monospace;font-size:11px;color:#9A6A14;margin-right:6px}

  /* L1 grid: lanes + map */
  .l1grid{display:grid;grid-template-columns:1fr 340px;gap:14px;align-items:start}
  .lanes{display:flex;flex-direction:column;border:1px solid #D8DFE4;border-radius:10px;overflow:hidden;background:#fff}
  .lane{display:grid;grid-template-columns:132px 1fr;border-top:1px solid #EDF0F2}
  .lane:first-child{border-top:0}
  .lanehead{padding:12px 12px;border-right:2px solid var(--tint);display:flex;flex-direction:column;gap:3px;background:color-mix(in srgb, var(--tint) 6%, #FAFBFC)}
  .rolechip{font-family:ui-monospace,monospace;font-size:10px;background:var(--tint);color:#fff;padding:2px 7px;border-radius:3px;align-self:flex-start}
  .rolename{font-weight:700;font-size:13px}
  .rolejob{font-size:10.5px;color:#5B6B77}
  .lanebody{padding:12px 14px;display:flex;align-items:flex-start;gap:8px;flex-wrap:wrap}
  .block{width:100%;margin-top:8px} .scroll{overflow-x:auto}
  .empty,.standby{font-size:11.5px;color:#8A97A0;font-style:italic}
  .standby{padding:4px 0}
  .feed{width:100%;font-family:ui-monospace,monospace}
  .drow{display:grid;grid-template-columns:52px 60px 1fr;gap:8px;font-size:11px;padding:5px 4px;border-bottom:1px solid #EDF0F2;align-items:baseline}
  .drow .seq{color:#8A97A0} .drow .op b{color:#6B4C9A}
  .refusalwrap{width:100%}
  .waivernote{font-size:11.5px;color:#6B4C9A;background:#EEE7F6;border:1px solid #D3C6E8;border-radius:8px;padding:8px 11px;margin-bottom:10px}

  /* map panel */
  .mapcol{position:sticky;top:10px}
  .mappanel{background:#fff;border:1px solid #D8DFE4;border-radius:10px;padding:10px}
  .maphead{font-size:11.5px;color:#33424E;font-weight:600;display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px}
  .mapex{font-family:ui-monospace,monospace;font-size:10px;color:#8A2020;background:#F8E2E2;border:1px solid #EFC6C6;border-radius:10px;padding:1px 8px}
  .mapex.base{color:#14655F;background:#E2EFEA;border-color:#BFDCD3}
  .maphint{font-weight:400;font-size:10px;color:#8A97A0;margin-left:auto}
  .mapsvg{display:block;width:100%;height:auto;border-radius:8px;border:1px solid #E2E7EB;background:#EAF1F5}
  .mapchips{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px}
  .mapchip{font-family:ui-monospace,monospace;font-size:10px;color:#8A2020;background:#FBEDED;border:1px solid #EFC6C6;border-radius:4px;padding:2px 7px}
  .mapchip.ex{font-weight:600;background:#F8DCDA}
  .mapchip.calm{color:#5B6B77;background:#F1F3F5;border-color:#D8DFE4}

  .l0{padding:26px 8px;text-align:center}
  .l0 .claim{font-size:20px;line-height:1.5;max-width:70ch;margin:0 auto 22px}
  .loop{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;align-items:center;margin-bottom:16px}
  .loop .node{border:1px solid #D8DFE4;border-radius:20px;padding:6px 14px;background:#fff;font-family:ui-monospace,monospace;font-size:12px}
  .loop .arw{color:#9BB3D0}
  .hint{font-size:12px;color:#5B6B77;margin-top:6px}
  .l2head{font-size:12px;color:#5B6B77;margin:10px 0 4px}

  #modebar{margin-top:14px}
  .tourbar{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
  .tourbar button{font-family:ui-monospace,monospace;font-size:13px;border:1px solid #1B2732;background:#fff;color:#1B2732;padding:6px 13px;border-radius:5px;cursor:pointer}
  .tourbar #play{background:#1B2732;color:#fff}
  .tourbar button:disabled{opacity:.35;cursor:default}
  .tourstep{font-size:12.5px}
  .dots{display:inline-flex;gap:5px;margin-left:4px}
  .dot{width:8px;height:8px;border-radius:50%;background:#D0D7DC}
  .dot.on{background:#3E5D8A}
  .palette{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .act{border:1px solid #D8DFE4;border-radius:7px;padding:10px 12px;background:#FCFDFD}
  .atitle{font-family:ui-monospace,monospace;font-size:11px;font-weight:600;color:#1B2732}
  .toggles{display:flex;gap:5px;margin-top:8px;flex-wrap:wrap}
  .tg{font-family:ui-monospace,monospace;font-size:10.5px;border:1px solid #1B2732;background:#fff;color:#1B2732;padding:4px 10px;border-radius:4px;cursor:pointer}
  .tg.on{background:#1B2732;color:#fff}
  .palnote{font-size:11.5px;color:#5B6B77;margin-top:10px}
  #undo{font-family:ui-monospace,monospace;font-size:11px;border:1px solid #3E5D8A;background:#E6ECF6;color:#3E5D8A;padding:3px 9px;border-radius:4px;cursor:pointer}
  @media(max-width:900px){.l1grid{grid-template-columns:1fr}.mapcol{position:static}.palette{grid-template-columns:1fr}.lane{grid-template-columns:1fr}.lanehead{border-right:0;border-bottom:1px solid var(--tint)}.railrole{display:none}}
`;

export function renderFlowPage(model: FlowModel): string {
  const connectors = model.legend.connectors
    .map(([code]) => `<code>${esc(code)}</code>`)
    .join(' ');
  const gates = model.legend.gates.map(([label]) => `<span class="gp">${esc(label)}</span>`).join(' ');

  return `<!DOCTYPE html>
<!-- GENERATED by scripts/build-flow.ts (npm run flow) — do not edit by hand.
     Self-contained interactive system-flow infographic (SPEC-14 flow-view sub-slice).
     Every panel is the shipped src/components/* output over the REAL in-browser seam
     (compile/score/handful/relax/knowledge), pre-rendered at build time over the frozen
     Meridian tableau; the browser swaps between real service outputs and adds a pipeline
     rail, a Meridian map (real region geometry + live channel overlays), and motion —
     none of it computes (spec §2.4/§2.5; research note 07-flow-view.md §5). Offline-clean:
     no external request, no runtime crypto (embed constraint, spec §4.6 / AS-11).
     Identifiers frozen by vignette §8. -->
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
    The S4 Bridge, grown into a stakeholder explainer. Watch a mock operator inject or revise data and
    watch the honest consequence flow — instantly for the fan-out, visibly-and-stamped for the recompute,
    never silently. Every panel is the real seam's own output; the map, rail, and motion arrange it, and
    compute nothing (DEC-5). Values frozen by <code>assay-vignette.md</code> §8; every assessed value is banded (G2).
  </div>

  <div class="controls">
    <span class="ctl-lab">zoom</span><span id="zoomseg" class="seg"></span>
    <span class="ctl-lab" style="margin-left:8px">mode</span><span id="modeseg" class="seg"></span>
    <span class="spacer"></span>
    <span id="worldstamp"></span>
  </div>

  <div class="legendstrip">
    <span class="grp">connectors</span> ${connectors}
    <span class="grp" style="margin-left:8px">gates</span> ${gates}
  </div>

  <div id="canvas"></div>
  <div id="modebar"></div>

  <p class="hint" style="margin-top:22px">
    Generated by <code>npm run flow</code> over the real seam · one component in two homes (in-app S4
    systems-map + this Pages embed) · auto-recompute is attribution-visible, never silent (spec §2.2) ·
    the map is a projection of real region geometry + live channel overlays (concept §6.15 candidate c,
    built under delegated authority) · scripted-and-labelled where a computation is not yet built
    (staleness fan-out · selection) — never faked (DEC-4).
  </p>
</div>
<script>window.__FLOW__ = ${JSON.stringify(model)};</script>
<script>${CLIENT}</script>
</body>
</html>
`;
}
