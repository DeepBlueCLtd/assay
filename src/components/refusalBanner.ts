/**
 * SPEC-05 — refusal banner (ui-design §3.4.1).
 *
 * Renders a Refusal in place, where the save was attempted: reason, offending
 * refs, and the one-sentence explanation. A refusal is an honest outcome shown
 * to the user (seam §1), never a swallowed error. Framework-free HTML string,
 * dependent only on the seam Refusal type.
 */
import type { Refusal } from '../seam.js';

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function refusalBanner(refusal: Refusal): string {
  const refs = refusal.offending
    .map((r) => esc(r.logical_id || r.content_hash))
    .filter(Boolean)
    .join(', ');
  return `<div class="assay-refusal" role="alert" style="font-family:ui-monospace,monospace;font-size:11.5px;border:1px solid #EFC6C6;border-left:4px solid #A33131;background:#FBEDED;color:#7A1F1F;padding:8px 11px;border-radius:4px">
  <span style="font-weight:700">Refused · ${esc(refusal.reason)}</span>
  <span style="margin-left:8px;color:#9A3B3B">offending: ${refs}</span>
  <div style="margin-top:3px;color:#5E2020">${esc(refusal.explanation)}</div>
</div>`;
}
