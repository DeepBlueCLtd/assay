/**
 * SPEC-05 — the minimal S1 knowledge table.
 *
 * A pure projection renderer (constitution I / DEC-5): it arranges row
 * view-models the harness builds from the store and the knowledge service —
 * it computes nothing and holds no state. Every assessed value renders through
 * the band pill with its provenance chip; no bare assessed scalar appears (G2).
 * A refused save renders its banner in place; contested rows carry a
 * compile-blocking flag; waived values carry a waiver chip.
 */
import type { KnowledgeObject, LifecycleStatus } from '../generated/types.js';
import type { LintWarning, Refusal } from '../seam.js';
import { bandPill } from './bandPill.js';
import { provenanceChip } from './provenanceChip.js';
import { refusalBanner } from './refusalBanner.js';

export interface S1Row {
  object: KnowledgeObject;
  /** From the service (edge-derived); falls back to the authored status. */
  effectiveStatus?: LifecycleStatus;
  /** Contested → compile-blocking flag (G5). */
  blocked?: boolean;
  /** Confidence-lint cautions (research note 01). */
  warnings?: LintWarning[];
}

export interface S1TableOptions {
  /** A refused save attempt, rendered where the save was attempted. */
  refusal?: Refusal;
  caption?: string;
}

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const chip = (text: string, fg: string, bg: string, border: string): string =>
  `<span style="font-family:ui-monospace,monospace;font-size:10.5px;padding:2px 7px;border-radius:3px;background:${bg};color:${fg};border:1px solid ${border};margin-right:5px;white-space:nowrap">${esc(text)}</span>`;

const waiverChip = (): string => chip('waiver W-1', '#5B3B8C', '#EFE8F7', '#D5C6EF');
const blockingFlag = (): string => chip('blocks compile', '#A33131', '#F8E2E2', '#EFC6C6');
const statusChip = (s: string): string => chip(s, '#5B6B77', '#F1F3F5', '#D8DFE4');

/** Value cell: observed may render unbanded (DEC-14); everything else is a band. */
function valueCell(ko: KnowledgeObject): string {
  if (!ko.answer) {
    return `<span style="color:#9A6A14;font-family:ui-monospace,monospace;font-size:11px">open — awaiting collection</span>`;
  }
  if (ko.provenance?.source_class === 'observed') {
    return `<span style="font-family:ui-monospace,monospace;font-size:11px;color:#14655F">${esc(
      `${ko.answer.lo} ${ko.answer.unit}`,
    )}</span>`;
  }
  return bandPill(ko.answer);
}

function warningLine(warnings: LintWarning[]): string {
  if (warnings.length === 0) return '';
  return warnings
    .map(
      (w) =>
        `<div class="assay-lint" style="margin-top:3px;font-family:ui-monospace,monospace;font-size:10px;color:#9A6A14">⚠ ${esc(
          w.message,
        )}</div>`,
    )
    .join('');
}

function rowHtml(row: S1Row): string {
  const ko = row.object;
  const status = row.effectiveStatus ?? ko.status;
  const provenance = ko.provenance ? provenanceChip(ko.provenance, ko.jipoe_step) : '';
  const waiver = ko.waiver ? waiverChip() : '';
  const flag = row.blocked ? blockingFlag() : '';
  // Value signature for the glow: the row glows iff its displayed value changed
  // (answer band, status, blocking/waiver flags, provenance) — not on every
  // upstream re-stamp. Keyed on the values a reader actually sees.
  const answerSig = ko.answer ? `${ko.answer.lo}-${ko.answer.hi} ${ko.answer.unit}` : 'open';
  const provSig = ko.provenance ? `${ko.provenance.source_class}·${ko.provenance.confidence}` : '';
  const sig = `${answerSig}|${status}|${row.blocked ? 'blk' : ''}|${ko.waiver ? 'wv' : ''}|${provSig}|${ko.jipoe_step ?? ''}`;
  return `<tr data-logical-id="${esc(ko.logical_id)}" data-glow-id="k:${esc(ko.logical_id)}" data-glow-sig="${esc(sig)}" style="border-top:1px solid #E4E9ED">
    <td style="padding:8px 10px;vertical-align:top;font-family:ui-monospace,monospace;font-size:11px;color:#1B2732">${esc(
      ko.logical_id,
    )}</td>
    <td style="padding:8px 10px;vertical-align:top;font-size:12px;color:#33414D">${esc(ko.question)}</td>
    <td style="padding:8px 10px;vertical-align:top">${valueCell(ko)}${warningLine(row.warnings ?? [])}</td>
    <td style="padding:8px 10px;vertical-align:top">${provenance}${waiver}</td>
    <td style="padding:8px 10px;vertical-align:top">${statusChip(status)}${flag}</td>
  </tr>`;
}

export function s1Table(rows: S1Row[], opts: S1TableOptions = {}): string {
  const banner = opts.refusal ? `<div style="margin-bottom:10px">${refusalBanner(opts.refusal)}</div>` : '';
  const caption = opts.caption
    ? `<caption style="text-align:left;padding:0 0 8px;font-size:12px;color:#5B6B77">${esc(opts.caption)}</caption>`
    : '';
  const head = `<thead><tr style="text-align:left;color:#5B6B77;font-size:10.5px;text-transform:uppercase;letter-spacing:.04em">
    <th style="padding:0 10px 6px">Id</th><th style="padding:0 10px 6px">Question</th><th style="padding:0 10px 6px">Answer</th><th style="padding:0 10px 6px">Provenance</th><th style="padding:0 10px 6px">Status</th>
  </tr></thead>`;
  return `<div class="assay-s1-table">${banner}<table style="border-collapse:collapse;width:100%">${caption}${head}<tbody>${rows
    .map(rowHtml)
    .join('')}</tbody></table></div>`;
}
