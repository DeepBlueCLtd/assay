/**
 * SPEC-24 — the decision support matrix (review §4.2/M1 — "the doctrinally-native
 * killer exhibit"; research note 12).
 *
 * One row per DERIVED decision point: the commitment at stake, the verdict
 * pattern that makes it a DP (divergence witnesses / margin band), the commit
 * step and LTIOV as step counts with the commit rule in words, the
 * discriminating open questions with per-evidence-pair classification and
 * expected-answer provenance chips (SPEC-23 — G3 applies to the matrix), the
 * collection options with banded cost and the three-state answerable-in-time
 * result — in time (slack shown) / **cannot answer in time, with its
 * arithmetic** (never dropped, FR-005) / no earliest result stated — and the
 * validity-window tripwires. Honest empty state; mixed-stamps statement.
 *
 * The DSM ranks and derives, never tasks (FR-007): there is no button, no
 * write affordance, no imperative verb — the collection option renders with
 * its cost band and its trace hooks, and nothing else. No urgency, priority,
 * or risk scalar exists anywhere in the DOM (DEC-19): every quantity is a
 * band, a step count, a verdict, or a classification word; row order is
 * commitment logical_id — a stated presentation order, no priority claim.
 *
 * Pure component: HTML string from data, no DOM, no state, no services
 * (constitution I; SPEC-14 extractability). Glow ids follow SPEC-16 —
 * a row's sig is keyed by its displayed values only (G6).
 */
import type { Band, KnowledgeObject, VerdictBand } from '../generated/types.js';
import type { DecisionPointRow, DecisionSupportSuccess, DpEvidence, DsmCollection, SeparationClass } from '../seam.js';
import { provenanceChip } from './provenanceChip.js';

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** One colour language across every surface (ui-design §2). */
const STOP: Record<VerdictBand, { bg: string; fg: string }> = {
  robust: { bg: '#1E6B3A', fg: '#FFFFFF' },
  marginal: { bg: '#7A6A12', fg: '#FFFFFF' },
  tight: { bg: '#9A5212', fg: '#FFFFFF' },
  violated: { bg: '#8A2020', fg: '#FFFFFF' },
};

const verdictChip = (v: VerdictBand): string =>
  `<span style="display:inline-block;padding:1px 6px;border-radius:8px;font-family:ui-monospace,monospace;font-size:10px;font-weight:700;background:${STOP[v].bg};color:${STOP[v].fg}">${v}</span>`;

function bandPill(b: Band): string {
  const text = b.lo === b.hi ? `${b.lo} ${b.unit}` : `${b.lo}–${b.hi} ${b.unit}`;
  return `<span style="display:inline-block;padding:1px 6px;border-radius:8px;font-family:ui-monospace,monospace;font-size:10px;font-weight:600;background:#E0E8ED;color:#1B2732;margin:1px 2px">${esc(text)}</span>`;
}

const stepPill = (n: number): string =>
  `<span style="display:inline-block;padding:1px 6px;border-radius:8px;font-family:ui-monospace,monospace;font-size:10px;font-weight:700;background:#EAF0F7;color:#3E5D8A;border:1px solid #C9D7E8">step ${n}</span>`;

const tierChip = (tier: string): string =>
  `<span style="font-family:ui-monospace,monospace;font-size:9.5px;font-weight:600;color:#3E5D8A;background:#EAF0F7;border:1px solid #C9D7E8;border-radius:3px;padding:0 4px">${esc(tier)}</span>`;

/** The classification word + mark — the SPEC-23 vocabulary, reused (note 08 §7.2). */
const CLASS_LABEL: Record<SeparationClass, { mark: string; word: string; fg: string; bg: string }> = {
  disjoint: { mark: '✓', word: 'discriminates', fg: '#1E6B3A', bg: '#E4F0E8' },
  partial: { mark: '~', word: 'could discriminate', fg: '#7A6A12', bg: '#F5F0DC' },
  nested: { mark: '✕', word: 'cannot discriminate', fg: '#8A2020', bg: '#F6E4E4' },
};

function evidenceLine(ev: DpEvidence): string {
  if (ev.kind === 'scenario_divergence') {
    return `<div data-dp-evidence="divergence:${esc(ev.a)}-${esc(ev.b)}" style="display:flex;align-items:center;gap:4px;margin:2px 0;flex-wrap:wrap"><span style="font-family:ui-monospace,monospace;font-size:9.5px;color:#5B6B77">${esc(ev.a)}</span>${verdictChip(ev.verdict_a)}<span style="font-size:9.5px;color:#5B6B77">↔</span><span style="font-family:ui-monospace,monospace;font-size:9.5px;color:#5B6B77">${esc(ev.b)}</span>${verdictChip(ev.verdict_b)}</div>`;
  }
  return `<div data-dp-evidence="margin:${esc(ev.scenario)}" style="display:flex;align-items:center;gap:4px;margin:2px 0;flex-wrap:wrap"><span style="font-family:ui-monospace,monospace;font-size:9.5px;color:#5B6B77">${esc(ev.scenario)}</span>${verdictChip(ev.verdict)}${ev.margin ? `<span style="font-size:9.5px;color:#5B6B77">margin</span>${bandPill(ev.margin)}` : ''}</div>`;
}

/** The three-state answerable-in-time line — never collapsed (note 12 §4). */
function inTimeState(co: DsmCollection, ltiov: number | undefined): string {
  if (co.earliest_result === undefined) {
    return `<span data-ltiov-state="unstated" style="font-family:ui-monospace,monospace;font-size:9.5px;color:#5B6B77;background:#F1F3F5;border:1px solid #D8DFE4;border-radius:3px;padding:1px 5px">no earliest result stated — never assumed answerable</span>`;
  }
  if (ltiov === undefined || co.in_time === undefined) {
    return `<span data-ltiov-state="no-ltiov" style="font-family:ui-monospace,monospace;font-size:9.5px;color:#5B6B77;background:#F1F3F5;border:1px solid #D8DFE4;border-radius:3px;padding:1px 5px">earliest result ${co.earliest_result} — no LTIOV to evaluate against</span>`;
  }
  if (co.in_time) {
    return `<span data-ltiov-state="in-time" style="font-family:ui-monospace,monospace;font-size:9.5px;font-weight:600;color:#1E6B3A;background:#E4F0E8;border:1px solid #BFDCC9;border-radius:3px;padding:1px 5px">in time — earliest result ${co.earliest_result} ≤ LTIOV ${ltiov} (slack ${co.slack} steps)</span>`;
  }
  // The honest red state, with its arithmetic visible — never dropped (FR-005).
  return `<span data-ltiov-state="red" style="font-family:ui-monospace,monospace;font-size:9.5px;font-weight:700;color:#FFFFFF;background:#8A2020;border:1px solid #6E1717;border-radius:3px;padding:1px 5px">cannot answer in time — earliest result ${co.earliest_result} &gt; LTIOV ${ltiov}</span>`;
}

function discriminatorBlock(
  row: DecisionPointRow,
  knowledgeById: Record<string, KnowledgeObject>,
): string {
  if (row.gap) {
    return `<div data-dp-gap style="font-family:ui-monospace,monospace;font-size:10px;color:#9A6A14;background:#F7EDD8;border:1px solid #E7D3A6;border-radius:4px;padding:4px 8px">${esc(row.gap)}</div>`;
  }
  if (row.discriminators.length === 0) {
    return `<span style="font-family:ui-monospace,monospace;font-size:9.5px;color:#5B6B77">margin-class — no COA pair to separate; the sensitivity ranking (thesis E) is the informing surface</span>`;
  }
  return row.discriminators
    .map((d) => {
      const qid = d.question.logical_id;
      const ko = knowledgeById[qid];
      const pairChips = d.pairs
        .map((p) => {
          const l = CLASS_LABEL[p.classification];
          const sepText = p.separation.lo === p.separation.hi ? `${round(p.separation.lo)} ${p.separation.unit}` : `${round(p.separation.lo)}–${round(p.separation.hi)} ${p.separation.unit}`;
          return `<span data-pair="${esc(p.a)}-${esc(p.b)}" data-separation-class="${p.classification}" style="display:inline-flex;align-items:center;gap:3px;margin:1px 4px 1px 0"><span style="font-family:ui-monospace,monospace;font-size:9.5px;color:#5B6B77">${esc(p.a)}↔${esc(p.b)}</span><span style="display:inline-block;padding:0 5px;border-radius:8px;font-family:ui-monospace,monospace;font-size:9.5px;font-weight:600;background:${l.bg};color:${l.fg}">${l.mark} ${esc(l.word)}</span><span style="font-family:ui-monospace,monospace;font-size:9px;color:#5B6B77">${esc(sepText)}</span></span>`;
        })
        .join('');
      const expected = (ko?.expected_answers ?? [])
        .filter((ea) => d.pairs.some((p) => p.a === ea.coa || p.b === ea.coa))
        .map((ea) => {
          const chip = ea.provenance
            ? provenanceChip(ea.provenance)
            : `<span style="font-family:ui-monospace,monospace;font-size:9.5px;color:#A33131;background:#F8E2E2;border:1px solid #EFC6C6;border-radius:3px;padding:1px 5px">no provenance — expectation unattributed</span>`;
          return `<div data-expected-coa="${esc(ea.coa)}" style="display:flex;align-items:center;gap:4px;margin:2px 0;flex-wrap:wrap"><span style="font-family:ui-monospace,monospace;font-size:9.5px;font-weight:600;color:#1B2732">${esc(ea.coa)}</span>${bandPill(ea.band)}${chip}</div>`;
        })
        .join('');
      const collection = d.collection
        .map(
          (co) =>
            `<div data-collection style="display:flex;align-items:center;gap:5px;margin:2px 0;flex-wrap:wrap"><span style="font-size:10px;color:#1B2732">${esc(co.method)}</span><span style="font-size:9.5px;color:#5B6B77">cost</span>${bandPill(co.cost)}${inTimeState(co, row.ltiov)}</div>`,
        )
        .join('');
      return `<div data-discriminator="${esc(qid)}" data-logical-id="${esc(qid)}" style="margin:3px 0;padding:4px 6px;border:1px solid #EDF0F2;border-radius:4px"><div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap"><span style="font-family:ui-monospace,monospace;font-size:10.5px;font-weight:700;color:#1B2732">${esc(qid)}</span>${ko ? `<span style="font-size:10px;color:#5B6B77">${esc(ko.question)}</span>` : ''}</div><div style="margin-top:2px">${pairChips}</div>${expected ? `<details style="margin-top:2px"><summary style="cursor:pointer;font-size:9.5px;color:#3E5D8A">expected answers (who says the COA would look like that)</summary><div style="margin-top:2px">${expected}</div></details>` : ''}${collection}</div>`;
    })
    .join('');
}

const round = (n: number): number => Math.round(n * 1000) / 1000;

function tripwireBlock(row: DecisionPointRow, knowledgeById: Record<string, KnowledgeObject>): string {
  if (row.tripwires.length === 0) {
    return `<span style="font-family:ui-monospace,monospace;font-size:9.5px;color:#5B6B77">—</span>`;
  }
  return row.tripwires
    .map((t) => {
      const ko = knowledgeById[t.knowledge.logical_id];
      return `<div data-tripwire="${esc(t.knowledge.logical_id)}" data-logical-id="${esc(t.knowledge.logical_id)}" style="margin:2px 0"><div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap"><span style="font-family:ui-monospace,monospace;font-size:10px;font-weight:700;color:#9A6A14">⏱ ${esc(t.knowledge.logical_id)}</span><span style="font-family:ui-monospace,monospace;font-size:9.5px;color:#9A6A14;background:#F7EDD8;border:1px solid #E7D3A6;border-radius:3px;padding:1px 5px">lapses at ${t.valid_until} — before the commit step (${t.commit_step})</span></div>${ko?.provenance ? `<div style="margin-top:1px">${provenanceChip(ko.provenance, ko.jipoe_step)}</div>` : ''}<div style="font-size:9.5px;color:#5B6B77">the world under this decision will contain lapsed knowledge at decision time — re-validate before committing</div></div>`;
    })
    .join('');
}

/** A row's glow sig is keyed by its displayed values only (G6 — no over-report). */
function rowSig(row: DecisionPointRow): string {
  const ev = row.evidence
    .map((e) => (e.kind === 'scenario_divergence' ? `${e.a}${e.verdict_a}|${e.b}${e.verdict_b}` : `${e.scenario}${e.verdict}${e.margin ? `${e.margin.lo},${e.margin.hi}` : ''}`))
    .join(';');
  const disc = row.discriminators
    .map((d) => `${d.question.logical_id}:${d.collection.map((c) => `${c.earliest_result ?? '∅'}${c.in_time === undefined ? '?' : c.in_time ? '+' : '-'}${c.slack ?? ''}`).join(',')}`)
    .join(';');
  const trip = row.tripwires.map((t) => `${t.knowledge.logical_id}@${t.valid_until}<${t.commit_step}`).join(';');
  return `${row.commit_kind}:${row.commit_step ?? '∅'}:${row.ltiov ?? '∅'}|${ev}|${disc}|${trip}${row.gap ? '|gap' : ''}`;
}

export interface DsmTableOpts {
  /** Latest knowledge objects by logical_id — for question text, expected-answer
   *  provenance chips, and tripwire chips. Display data only; the component
   *  derives nothing from it. */
  knowledgeById?: Record<string, KnowledgeObject>;
  /** Stated absence of a `/select` selection (spec Assumptions) — rendered verbatim. */
  selectionNote?: string;
}

export function dsmTable(result: DecisionSupportSuccess, opts: DsmTableOpts = {}): string {
  const kb = opts.knowledgeById ?? {};

  const headerBits = [
    `derived for <strong>${esc(result.plan)}</strong>`,
    `selected world <strong>${esc(result.selected)}</strong>`,
    `adversary vocabulary ${result.coas.map(esc).join('/')}`,
    `lead ${result.lead} (v1 — a non-zero lead is an authored assessment, not an engine constant)`,
  ];
  const header = `<div class="assay-dsm-header" style="font-family:ui-monospace,monospace;font-size:10px;color:#5B6B77;margin-bottom:4px">${headerBits.join(' · ')}${opts.selectionNote ? ` · ${esc(opts.selectionNote)}` : ''}</div>`;

  const statement = result.statement
    ? `<div class="assay-dsm-statement" data-dsm-statement style="font-family:ui-monospace,monospace;font-size:10.5px;color:#5B6B77;background:#F1F3F5;border:1px solid #D8DFE4;border-radius:4px;padding:4px 8px;margin-bottom:6px">${esc(result.statement)}</div>`
    : '';

  if (result.rows.length === 0) {
    return `${header}${statement}`;
  }

  const th = (label: string): string =>
    `<th style="padding:5px 10px;font-size:10px;color:#5B6B77;border-bottom:2px solid #D8DFE4;text-align:left">${label}</th>`;
  const head = `<tr>${th('Decision point')}${th('Evidence (why it is a DP)')}${th('Commit step · LTIOV')}${th('Discriminating questions · collection (ranked by separation — tasking is a human act)')}${th('Tripwires')}</tr>`;

  const rows = result.rows
    .map((row) => {
      const commitCell =
        row.commit_step !== undefined
          ? `<div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap">${stepPill(row.commit_step)}${row.commit_kind === 'world_decided' ? `<span style="font-family:ui-monospace,monospace;font-size:9px;color:#3E5D8A;background:#EAF0F7;border:1px solid #C9D7E8;border-radius:3px;padding:0 4px">world-decided</span>` : ''}</div><div style="font-family:ui-monospace,monospace;font-size:9.5px;color:#5B6B77;margin-top:2px">LTIOV ${row.ltiov}</div><div style="font-size:9.5px;color:#5B6B77;margin-top:2px">${esc(row.commit_detail)}</div>`
          : `<div data-commit-absent style="font-size:9.5px;color:#5B6B77">${esc(row.commit_detail)}</div>`;
      return `<tr data-logical-id="${esc(row.commitment)}" data-glow-id="dsm:${esc(result.plan)}:${esc(row.commitment)}" data-glow-sig="${esc(rowSig(row))}">
        <td style="padding:6px 10px;border-bottom:1px solid #EDF0F2;vertical-align:top;white-space:nowrap"><span style="font-family:ui-monospace,monospace;font-size:11px;font-weight:700;color:#1B2732">${esc(row.commitment)}</span> ${tierChip(row.tier)}<div style="font-size:10px;color:#5B6B77;margin-top:2px;max-width:180px;white-space:normal">${esc(row.statement)}</div></td>
        <td style="padding:6px 10px;border-bottom:1px solid #EDF0F2;vertical-align:top">${row.evidence.map(evidenceLine).join('')}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #EDF0F2;vertical-align:top;max-width:220px">${commitCell}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #EDF0F2;vertical-align:top">${discriminatorBlock(row, kb)}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #EDF0F2;vertical-align:top;max-width:230px">${tripwireBlock(row, kb)}</td>
      </tr>`;
    })
    .join('');

  return `${header}${statement}<div style="overflow-x:auto"><table class="assay-dsm-table" style="border-collapse:collapse;width:100%">
  <thead>${head}</thead>
  <tbody>${rows}</tbody>
</table></div>`;
}
