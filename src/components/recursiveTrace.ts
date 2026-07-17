/**
 * SPEC-26 US3 (DEC-38) — the recursive-on-demand trace tooltip (pure).
 *
 * The SPEC-16 one-hop "informs / influenced by" menu, made recursively
 * expandable to a STATED depth cap of 3 (note 15 §5; Cowan 2001 / Miller 1956 —
 * the ~3–4 chunk working-memory ceiling). It is note 13's transitive walk
 * (`traceView.neighbours` under `EDGE_ORIENTATION`) applied depth-by-depth —
 * ONE traversal semantics, no parallel walker (FR-006/FR-007): it reuses the
 * exact `neighbours()` reading the one-hop menu and the dependency-graph view
 * use, so it agrees with them (and with `TraceStore.walk`'s edge set and cycle
 * guard) by construction.
 *
 * The honesty rules it carries:
 *  - each hop labelled from the trace graph itself — the `edge_type` in its own
 *    vocabulary, plus a FIXED operation gloss for the computation edges (a
 *    legend over `edge_type`, never an invented "why", note §5);
 *  - dead ends render as dead ends at EVERY depth (`known: false`, G3);
 *  - symmetric `contests` edges render on both flanks, once each, cycle-guarded;
 *  - at the cap, an honest counted remainder ("N more — open full trace") routes
 *    to the trace drawer / issue #24 graph — the G4 no-silent-drop rule lifted to
 *    a view; truncation is visible, bounded, and escapable (note §5).
 *
 * Pure and self-contained (SPEC-14): depends only on generated types, the
 * TraceStore, and the ObjectStore — no DOM events, no services, no app state.
 */
import type { TraceEdgeType } from '../generated/types.js';
import type { TraceStore } from '../trace.js';
import type { ObjectStore } from '../store.js';
import { neighbours, type Relation } from '../traceView.js';

/** The stated depth cap — a constant, not adaptive, so the surface decomposes an
 *  object to the same depth everywhere (note §5). */
export const TRACE_DEPTH_CAP = 3;

/**
 * The fixed operation gloss for the computation edges — a legend over
 * `edge_type` drawn from the metric registry's own names (note §5). An edge not
 * listed carries no computation semantics; its hop shows the edge type alone.
 */
export const OPERATION_GLOSS: Partial<Record<TraceEdgeType, string>> = {
  compiled_into: 'band materialisation — the assessed band becomes a channel',
  scored_from: 'interval evaluation of the commitment metric over the channel reads',
  cited_in: 'carried into the report as stated evidence',
  sacrificed_in: 'named as a sacrifice in the relaxation report',
  supersedes: 'a newer version replaced this one',
  resolves: 'the contest was adjudicated in this version’s favour',
  contests: 'an irreconcilable second answer to the same question',
  waives: 'admitted under a recorded waiver',
};

export interface RecursiveHop {
  hash: string;
  label: string;
  edge_type: TraceEdgeType;
  relation: Relation;
  operationGloss?: string;
  /** Whether the store knows this hash — a dead end renders as one (G3). */
  known: boolean;
  depth: number;
  children: RecursiveHop[];
  /** At the cap: the count of onward neighbours NOT expanded — never silent (G4). */
  remainder?: number;
}

/** A short readable label for a stored object (mirrors the depGraph labeller);
 *  an unknown hash reads as an explicit dead end (G3). */
function describe(store: ObjectStore, hash: string): string {
  const o = store.get(hash) as Record<string, unknown> | undefined;
  if (!o) return `${hash.slice(0, 8)}… (dead end — G3)`;
  if (typeof o.verdict === 'string' && typeof o.plan === 'string' && typeof o.commitment === 'string') {
    const scenario = typeof o.scenario === 'string' && o.scenario !== 'BASE' ? ` (${o.scenario})` : '';
    return `${o.verdict} ${o.plan}·${o.commitment}${scenario}`;
  }
  if (typeof o.logical_id === 'string' && o.logical_id) {
    return typeof o.name === 'string' ? `${o.logical_id} · ${o.name}` : (o.logical_id as string);
  }
  if (typeof o.stamp === 'string') {
    const scenario = typeof o.scenario === 'string' ? (o.scenario as string) : '';
    return scenario ? `${scenario} world` : `world ${(o.stamp as string).slice(0, 8)}…`;
  }
  return `${hash.slice(0, 8)}…`;
}

function buildHop(
  trace: TraceStore,
  store: ObjectStore,
  hash: string,
  edge_type: TraceEdgeType,
  relation: Relation,
  depth: number,
  depthCap: number,
  path: ReadonlySet<string>,
): RecursiveHop {
  const known = store.exists(hash);
  const hop: RecursiveHop = {
    hash,
    label: describe(store, hash),
    edge_type,
    relation,
    known,
    depth,
    children: [],
  };
  const gloss = OPERATION_GLOSS[edge_type];
  if (gloss) hop.operationGloss = gloss;
  if (!known) return hop; // dead end — nothing onward from an unknown hash (G3)

  // Onward neighbours in the same relation, cycle-guarded against the current path.
  const onward = neighbours(trace, hash, relation, (h) => store.exists(h)).filter(
    (nb) => !path.has(nb.hash),
  );
  if (depth >= depthCap) {
    if (onward.length > 0) hop.remainder = onward.length; // honest counted overflow (G4)
    return hop;
  }
  const nextPath = new Set(path).add(hash);
  hop.children = onward.map((nb) =>
    buildHop(trace, store, nb.hash, nb.edge_type, relation, depth + 1, depthCap, nextPath),
  );
  return hop;
}

/**
 * The recursive trace for one relation from `startHash`, depth-capped. Roots are
 * exactly the one-hop `neighbours()` (the SPEC-16 menu's source of truth); each
 * expands to the cap, with dead ends and counted remainders surfaced.
 */
export function buildRecursiveTrace(
  trace: TraceStore,
  store: ObjectStore,
  startHash: string,
  relation: Relation,
  depthCap: number = TRACE_DEPTH_CAP,
): RecursiveHop[] {
  const path = new Set<string>([startHash]);
  return neighbours(trace, startHash, relation, (h) => store.exists(h)).map((nb) =>
    buildHop(trace, store, nb.hash, nb.edge_type, relation, 1, depthCap, path),
  );
}

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function renderHops(hops: RecursiveHop[]): string {
  if (hops.length === 0) return `<div class="row" style="color:var(--muted,#5B6B77)">— none —</div>`;
  return `<ul style="list-style:none;margin:0;padding-left:12px;border-left:1px solid #E4E9ED">${hops
    .map((h) => {
      const deadStyle = h.known ? '' : ' style="color:#A33131"';
      const gloss = h.operationGloss
        ? `<div style="font-size:10px;color:#5B6B77;margin-left:2px">↳ ${esc(h.operationGloss)}</div>`
        : '';
      const kids = h.children.length > 0 ? renderHops(h.children) : '';
      const remainder =
        h.remainder && h.remainder > 0
          ? `<div class="assay-rtrace-more" style="font-size:10.5px;color:#3E5D8A;font-weight:600;cursor:pointer;margin:2px 0 2px 2px" data-remainder-hash="${h.hash}">⋯ ${h.remainder} more — open full trace →</div>`
          : '';
      return `<li style="padding:2px 0"><div class="row"${deadStyle}>${esc(h.label)} <span class="edge" style="color:#8091A0">· ${esc(
        h.edge_type,
      )}</span>${h.known ? '' : ' <span style="font-size:9.5px">(dead end — G3)</span>'}</div>${gloss}${kids}${remainder}</li>`;
    })
    .join('')}</ul>`;
}

/**
 * Render the recursive trace menu for an item: both flanks (informs upstream /
 * influences downstream), each a depth-capped nested hop list. The remainder
 * affordances carry `data-remainder-hash` so the shell can route them to the
 * trace drawer / dependency-graph overlay (T20). Framework-free HTML string.
 */
export function recursiveTrace(
  trace: TraceStore,
  store: ObjectStore,
  startHash: string,
  opts: { title?: string; depthCap?: number } = {},
): string {
  const cap = opts.depthCap ?? TRACE_DEPTH_CAP;
  const up = buildRecursiveTrace(trace, store, startHash, 'informs', cap);
  const down = buildRecursiveTrace(trace, store, startHash, 'influences', cap);
  const head = opts.title
    ? `<div style="font-weight:600;margin-bottom:4px">${esc(opts.title)}</div>`
    : '';
  return `${head}<div class="assay-rtrace">
    <h4 style="margin:6px 0 3px;font-size:10.5px;text-transform:uppercase;letter-spacing:.05em;color:#5B6B77">Informs (upstream)</h4>
    ${renderHops(up)}
    <h4 style="margin:8px 0 3px;font-size:10.5px;text-transform:uppercase;letter-spacing:.05em;color:#5B6B77">Influences (downstream)</h4>
    ${renderHops(down)}
    <div style="margin-top:6px;font-size:10px;color:#8091A0">Recursive to depth ${cap} — a counted remainder never hides the rest (G4).</div>
  </div>`;
}
