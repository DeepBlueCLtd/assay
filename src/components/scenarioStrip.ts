/**
 * SPEC-10 — scenario strip component (thesis C; ui-design §S2).
 *
 * Renders a plan × commitment × scenario verdict grid: one row per plan, one
 * column group per commitment, one sub-column per toggled scenario. Each cell
 * is a four-stop verdict chip (reuses s2Matrix colour language). Collapse —
 * a verdict dropping from its BASE value under a scenario — is visually marked
 * with a downward arrow. No decimals, no robustness index, no scenario weights
 * in the VERDICT GRID (DEC-9/15/19; FR-005). Pure component: HTML string from
 * data, no DOM, no state (constitution I). Glow ids follow the SPEC-16 pattern.
 *
 * SPEC-22 — the strip optionally carries an ATTENTION BLOCK above the grid:
 * each scenario's likelihood band (K14a–c, `scenario_weight`) rendered under
 * the interval order — strictly-ranked layers stacked, honestly-incomparable
 * (overlapping) bands level, missing/contested weights unranked — on a shared
 * 0–100 % track so overlap is visible as geometry. Provenance is welded on
 * (DEC-9) and the block is labelled "orders attention — never compiles"
 * (knowledge model §9): the verdicts to its right owe it nothing, and their
 * content and order never move with it (research note 11-attention.md §5).
 */
import type { Band, CommitmentVerdict, JipoeStep, Provenance, VerdictBand } from '../generated/types.js';
import type { ScenarioVerdictTensor } from '../seam.js';
import { attentionLayers, type AttentionItem } from '../attention.js';
import { bandPill } from './bandPill.js';
import { provenanceChip } from './provenanceChip.js';

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const STOP: Record<VerdictBand, { bg: string; fg: string; label: string }> = {
  robust: { bg: '#1E6B3A', fg: '#FFFFFF', label: 'robust' },
  marginal: { bg: '#7A6A12', fg: '#FFFFFF', label: 'marginal' },
  tight: { bg: '#9A5212', fg: '#FFFFFF', label: 'tight' },
  violated: { bg: '#8A2020', fg: '#FFFFFF', label: 'violated' },
};

const VERDICT_ORDER: Record<VerdictBand, number> = {
  violated: 0, tight: 1, marginal: 2, robust: 3,
};

const marginText = (v: CommitmentVerdict): string =>
  v.margin === undefined
    ? 'no margin (objective unreachable)'
    : v.margin.lo === v.margin.hi
      ? `margin ${v.margin.lo} ${v.margin.unit}`
      : `margin ${v.margin.lo}–${v.margin.hi} ${v.margin.unit}`;

function chipCell(v: CommitmentVerdict, collapsed: boolean): string {
  const s = STOP[v.verdict];
  const arrow = collapsed ? ' ▼' : '';
  return `<td data-glow-id="vs:${esc(v.plan)}:${esc(v.commitment)}:${esc(v.scenario)}" data-glow-sig="${esc(v.verdict)}" style="padding:4px 5px;text-align:center;border-bottom:1px solid #EDF0F2">
    <span class="assay-verdict-chip" title="${esc(v.scenario)}: ${esc(marginText(v))}" style="display:inline-block;min-width:54px;padding:2px 6px;border-radius:10px;font-family:ui-monospace,monospace;font-size:10px;font-weight:700;background:${s.bg};color:${s.fg}">${s.label}${arrow}</span>
  </td>`;
}

function worstChip(planId: string, commitmentId: string, verdict: VerdictBand): string {
  const s = STOP[verdict];
  return `<td data-glow-id="vw:${esc(planId)}:${esc(commitmentId)}" data-glow-sig="${esc(verdict)}" style="padding:4px 5px;text-align:center;border-bottom:1px solid #EDF0F2;border-left:2px solid #1B2732">
    <span class="assay-verdict-chip" title="worst case across all scenarios" style="display:inline-block;min-width:54px;padding:2px 6px;border-radius:10px;font-family:ui-monospace,monospace;font-size:10px;font-weight:700;background:${s.bg};color:${s.fg}">${s.label}</span>
  </td>`;
}

/** One scenario's likelihood standing, for the attention block (SPEC-22). */
export interface ScenarioLikelihood {
  /** ScenarioCOA logical id (R1, R2, …). */
  scenario: string;
  /** Display name (e.g. "Fortress Halcyon"). */
  name?: string;
  /** The `scenario_weight` KnowledgeObject id (K14a…) — the G3 trace hook. */
  logical_id?: string;
  /** The likelihood band. Absent → "no assessment", never defaulted. */
  band?: Band;
  provenance?: Provenance;
  jipoe_step?: JipoeStep;
  /** Contested weights render their mark and rank nothing until resolved. */
  contested?: boolean;
}

export interface ScenarioStripOpts {
  planNames?: Record<string, string>; // logical_id → display name
  /** SPEC-22 — when present, the attention block renders above the grid. */
  likelihoods?: ScenarioLikelihood[];
}

const contestMark = (): string =>
  `<span style="font-family:ui-monospace,monospace;font-size:10.5px;padding:2px 7px;border-radius:3px;background:#F8E2E2;color:#A33131;border:1px solid #EFC6C6;white-space:nowrap">contested — orders nothing until resolved</span>`;

function likelihoodLine(l: ScenarioLikelihood): string {
  const label = l.name ? `${l.scenario} · ${l.name}` : l.scenario;
  const sig = `${l.band ? `${l.band.lo}-${l.band.hi} ${l.band.unit}` : 'none'}|${l.contested ? 'contested' : ''}`;
  const traceHook = l.logical_id ? ` data-logical-id="${esc(l.logical_id)}"` : '';
  const pill = l.band
    ? bandPill(l.band, { trackLo: 0, trackHi: 100, label: 'likelihood' })
    : `<span style="font-family:ui-monospace,monospace;font-size:11px;color:#9A6A14">no assessment — unranked, never defaulted</span>`;
  const prov = l.provenance ? provenanceChip(l.provenance, l.jipoe_step) : '';
  const mark = l.contested ? contestMark() : '';
  return `<div class="assay-attention-scenario"${traceHook} data-glow-id="att:${esc(l.logical_id ?? l.scenario)}" data-glow-sig="${esc(sig)}" style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:3px 0">
    <span style="font-family:ui-monospace,monospace;font-size:11px;font-weight:600;color:#1B2732;min-width:150px">${esc(label)}</span>
    ${pill}
    ${prov}${mark}
  </div>`;
}

/**
 * SPEC-22 — the attention block: likelihood bands under the interval order.
 * Ordering is STRUCTURAL (stacked layer rows) — no sort-key attribute, no
 * scalar anywhere (FR-002); level scenarios share a row, visibly overlapping
 * on the shared 0–100 % track.
 */
function attentionBlock(likelihoods: ScenarioLikelihood[]): string {
  const items: AttentionItem[] = likelihoods.map((l) => {
    const item: AttentionItem = { scenario: l.scenario };
    if (l.band) item.band = l.band;
    if (l.contested) item.contested = l.contested;
    return item;
  });
  const { layers, unranked } = attentionLayers(items);
  const byScenario = new Map(likelihoods.map((l) => [l.scenario, l]));

  const layerRows = layers
    .map((layer, idx) => {
      const lines = layer.map((sid) => likelihoodLine(byScenario.get(sid)!)).join('');
      const levelNote =
        layer.length > 1
          ? `<div style="font-size:10px;color:#9A6A14;font-family:ui-monospace,monospace;padding:1px 0">level — bands overlap; honestly unranked between themselves</div>`
          : '';
      return `<div class="assay-attention-layer" data-attention-layer="${idx}" style="border-left:3px solid #C8D2DA;padding:3px 0 3px 10px;margin:2px 0">${levelNote}${lines}</div>`;
    })
    .join('');

  const unrankedRow =
    unranked.length > 0
      ? `<div class="assay-attention-unranked" style="border-left:3px dashed #C8D2DA;padding:3px 0 3px 10px;margin:2px 0">
    <div style="font-size:10px;color:#5B6B77;font-family:ui-monospace,monospace;padding:1px 0">unranked</div>
    ${unranked.map((sid) => likelihoodLine(byScenario.get(sid)!)).join('')}
  </div>`
      : '';

  return `<div class="assay-attention" style="border:1px solid #D8DFE4;border-radius:6px;padding:8px 12px;margin-bottom:10px;background:#FCFDFD">
  <div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:8px">
    <span style="font-size:11px;font-weight:700;color:#1B2732;letter-spacing:.03em">Adversary COA likelihood (J-2 assessment)</span>
    <span class="assay-attention-label" style="font-family:ui-monospace,monospace;font-size:10.5px;padding:2px 7px;border-radius:3px;background:#EAF0F7;color:#3E5D8A;border:1px solid #C9D7E8;white-space:nowrap">orders attention — never compiles</span>
  </div>
  ${layerRows}${unrankedRow}
</div>`;
}

export function scenarioStrip(tensor: ScenarioVerdictTensor, opts?: ScenarioStripOpts): string {
  const { scenarios, plans, commitments, verdicts, worst_case, stamps_compatible } = tensor;
  const planName = (id: string) => opts?.planNames?.[id] ?? id;

  const incompatBanner = stamps_compatible
    ? ''
    : `<div class="assay-scenario-incompat" style="background:#FFF3E0;border:1px solid #E6A817;border-radius:5px;padding:8px 12px;margin-bottom:10px;font-size:11.5px;color:#7A5500;font-family:ui-monospace,monospace">⚠ stamp lineages differ — cross-scenario comparison may be misleading (G1 comparability guard)</div>`;

  const scenarioHeaders = commitments
    .map((cid) => {
      const group = scenarios
        .map((sid) => `<th style="padding:4px 5px;font-size:9.5px;font-weight:600;color:#5B6B77;text-transform:uppercase;letter-spacing:.03em">${esc(sid)}</th>`)
        .join('');
      const worstCol = `<th style="padding:4px 5px;font-size:9.5px;font-weight:700;color:#1B2732;text-transform:uppercase;letter-spacing:.03em;border-left:2px solid #1B2732">worst</th>`;
      return group + worstCol;
    })
    .join('');

  const commitmentHeaders = commitments
    .map((cid) => `<th colspan="${scenarios.length + 1}" style="padding:5px 8px;text-align:center;font-size:10.5px;color:#1B2732;letter-spacing:.04em;border-bottom:2px solid #D8DFE4">${esc(cid)}</th>`)
    .join('');

  const head = `<tr style="text-align:center">
    <th style="padding:5px 10px;text-align:left"></th>
    ${commitmentHeaders}
  </tr>
  <tr style="text-align:center">
    <th style="padding:4px 10px;text-align:left;font-size:10px;color:#5B6B77">plan \\ scenario</th>
    ${scenarioHeaders}
  </tr>`;

  const body = plans
    .map((pid) => {
      const cells = commitments
        .map((cid) => {
          const baseVerdict = verdicts.get(`${pid}-${cid}-${scenarios[0]}`);
          const baseOrd = baseVerdict ? VERDICT_ORDER[baseVerdict.verdict] : 3;

          const scenarioCells = scenarios.map((sid) => {
            const v = verdicts.get(`${pid}-${cid}-${sid}`);
            if (!v) return `<td style="padding:4px 5px;text-align:center;color:#B0BAC2">—</td>`;
            const collapsed = VERDICT_ORDER[v.verdict] < baseOrd;
            return chipCell(v, collapsed);
          });

          const wc = worst_case.get(`${pid}-${cid}`) ?? 'robust';
          return scenarioCells.join('') + worstChip(pid, cid, wc);
        })
        .join('');
      return `<tr><td style="padding:5px 10px;font-family:ui-monospace,monospace;font-size:11px;font-weight:600;color:#1B2732;white-space:nowrap">${esc(planName(pid))}</td>${cells}</tr>`;
    })
    .join('');

  // SPEC-22: the attention block sits ABOVE the grid; the grid itself never
  // moves with likelihood — same cells, same scenario-column order (note 06 §4).
  const attention = opts?.likelihoods && opts.likelihoods.length > 0 ? attentionBlock(opts.likelihoods) : '';

  return `${attention}${incompatBanner}<div style="overflow-x:auto"><table class="assay-scenario-strip" style="border-collapse:collapse;width:100%">
  <thead>${head}</thead>
  <tbody>${body}</tbody>
</table></div>`;
}
