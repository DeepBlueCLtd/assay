/**
 * SPEC-25 US2 — consequence preview: the ghost diff (research note
 * `13-legibility.md` §2, the DEC-11 subject).
 *
 * "What would this write change, before I commit it?" — answered by running the
 * REAL pipeline over a byte-faithful SHADOW of the committed store (`AppState.fork`),
 * never an estimate (DEC-10 forbids a second engine). An armed act is applied to
 * the fork through the same service methods and the same firewall as a commit;
 * the ghost diff is the value-keyed glow-signature set difference between the
 * committed snapshot and the shadow snapshot.
 *
 * The five binding rules (note §2.1):
 *   1. same services, same firewall — a dishonest armed edit previews its refusal;
 *   2. nothing persisted, no delta, no stamp mutation (the fork owns its own state);
 *   3. previewed diff ≡ post-commit glow set, byte-for-byte (the fork runs the
 *      identical snapshot code — G1 guarantees it; `tests/preview.test.ts` asserts it);
 *   4. the ghost is banded / four-stop and unmistakably uncommitted (G2);
 *   5. it pre-figures exactly the glow set (DEC-34 — rules 3 and 5 are the same fact).
 *
 * This is a thin CLIENT-SIDE orchestrator (no seam change): it composes the
 * existing service calls over the cloned store. `PreviewState` is app-layer only —
 * never stored, never stamped (concept §6.29, flagged not asserted, DEC-2).
 */
import type { AppState, Snapshot } from './app/state.js';
import { changedGlowUnits, type SignatureMap } from './app/glow.js';

/** The mutating acts a preview can arm — exactly the committed shell's write verbs. */
export type ArmedAct =
  | { kind: 'resolve' }
  | { kind: 'reopen' }
  | { kind: 'band-edit'; id: string; band: { lo: number; hi: number; unit: string } }
  | { kind: 'waypoint-move'; plan: string; element: string; legIndex: number; x: number; y: number }
  | { kind: 'window-shift'; plan: string; element: string; legIndex: number; delta: number };

/** One changed glow unit: its id and the signature it moves from → to. */
export interface GhostCell {
  id: string;
  from?: string; // absent ⇒ the unit appeared (a panel came into existence)
  to: string;
  /** True iff this is a four-stop verdict cell (glow id `v:*` / `coaviz:*`). */
  verdict: boolean;
}

export interface PreviewResult {
  armed: ArmedAct;
  /** The glow ids whose displayed value moves — the ghost-diff set (≡ the commit glow set). */
  changed: Set<string>;
  before: SignatureMap;
  after: SignatureMap;
  cells: GhostCell[];
  /** The refusal banner html iff the armed act previews a refusal (rule 1). */
  refusal?: string;
}

/**
 * Extract the value-keyed glow map (`data-glow-id → data-glow-sig`) the shell
 * diffs, straight from the rendered panel HTML — the same map the shell's glow
 * uses. Shared so the preview diff and the commit glow are computed identically.
 */
export function sigMapOf(snap: Snapshot): SignatureMap {
  const m: SignatureMap = new Map();
  const re = /data-glow-id="([^"]*)" data-glow-sig="([^"]*)"/g;
  for (const p of snap.panels) {
    let match: RegExpExecArray | null;
    while ((match = re.exec(p.html)) !== null) m.set(match[1]!, match[2]!);
  }
  return m;
}

// A four-stop verdict cell (s2Matrix) whose glow signature is exactly the verdict
// word. The coaviz cells carry a composite sig (verdict|margin|version), so they
// are NOT counted here — the ghost shows word-to-word verdict movement only (G2).
const isVerdictUnit = (id: string): boolean => id.startsWith('v:');

/** Apply an armed act to a state (the fork for preview, the real app for commit). */
export async function applyArmedAct(app: AppState, act: ArmedAct): Promise<void> {
  switch (act.kind) {
    case 'resolve':
      app.resolveK12();
      return;
    case 'reopen':
      app.contestK12();
      return;
    case 'band-edit':
      await app.editBand(act.id, act.band);
      return;
    case 'waypoint-move':
      await app.moveWaypoint(act.plan, act.element, act.legIndex, act.x, act.y);
      return;
    case 'window-shift':
      await app.shiftWindow(act.plan, act.element, act.legIndex, act.delta);
      return;
  }
}

/** A short human label for the ghost header. */
export function describeArmedAct(act: ArmedAct): string {
  switch (act.kind) {
    case 'resolve':
      return 'resolve the K12 contest';
    case 'reopen':
      return 're-open the K12 contest';
    case 'band-edit':
      return `supersede ${act.id} → [${act.band.lo}, ${act.band.hi}] ${act.band.unit}`;
    case 'waypoint-move':
      return `move ${act.plan} · ${act.element} leg ${act.legIndex} → (${act.x}, ${act.y})`;
    case 'window-shift':
      return `shift ${act.plan} · ${act.element} leg ${act.legIndex} by ${act.delta} step(s)`;
  }
}

/**
 * Compute the consequence of an armed act WITHOUT committing it: fork the state,
 * apply the act to the fork, snapshot both, diff the glow signatures. The
 * committed `app` is never mutated by this call (rule 2). The returned `changed`
 * set equals, element-for-element, the glow set the same act produces on commit
 * (rule 3), because the fork runs the identical snapshot code over a byte-faithful
 * clone.
 */
export async function previewAct(app: AppState, act: ArmedAct): Promise<PreviewResult> {
  const shadow = app.fork();
  await applyArmedAct(shadow, act);

  const committed = await app.snapshot();
  const shadowSnap = await shadow.snapshot();

  const before = sigMapOf(committed);
  const after = sigMapOf(shadowSnap);
  const changed = changedGlowUnits(before, after);

  const cells: GhostCell[] = [...changed].map((id) => {
    const from = before.get(id);
    const cell: GhostCell = { id, to: after.get(id) ?? '', verdict: isVerdictUnit(id) };
    if (from !== undefined) cell.from = from;
    return cell;
  });

  const result: PreviewResult = { armed: act, changed, before, after, cells };
  if (shadowSnap.notice?.kind === 'refusal') result.refusal = shadowSnap.notice.html;
  return result;
}

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Render the ghost diff as an unmistakably-uncommitted summary (rule 4): the
 * armed act, the refusal-if-any (the refusal IS the preview, rule 1), and the
 * verdict cells that would move — as four-stop words, from → to, never decimals
 * (G2). Framework-free HTML string; the shell mounts it as a distinct ghost layer.
 */
export function ghostSummary(result: PreviewResult): string {
  const header = `<div style="font-family:ui-monospace,monospace;font-size:11px;font-weight:700;color:#5B3B8C">Previewed — not applied · ${esc(describeArmedAct(result.armed))}</div>`;
  if (result.refusal) {
    return `<div class="assay-ghost" style="border:1px dashed #B9A0E0;border-left:4px solid #5B3B8C;background:#F6F1FC;border-radius:6px;padding:10px 12px">
      ${header}
      <div style="margin-top:6px;font-size:11px;color:#5B3B8C">This write would refuse — arming teaches the firewall; nothing is committed.</div>
      <div style="margin-top:6px">${result.refusal}</div>
    </div>`;
  }
  const verdictCells = result.cells.filter((c) => c.verdict && c.from !== undefined && c.from !== c.to);
  const cellLines = verdictCells.length
    ? `<ul style="margin:6px 0 0;padding-left:18px;font-size:11px;color:#33424E">${verdictCells
        .map(
          (c) =>
            `<li style="font-family:ui-monospace,monospace">${esc(c.id.replace(/^v:/, ''))}: <b>${esc(c.from!)}</b> → <b>${esc(c.to)}</b></li>`,
        )
        .join('')}</ul>`
    : `<div style="margin-top:6px;font-size:11px;color:#5B6B77">No verdict cell changes word; ${result.changed.size} unit(s) would glow (rows, stamps, feed).</div>`;
  return `<div class="assay-ghost" style="border:1px dashed #B9A0E0;border-left:4px solid #5B3B8C;background:#F6F1FC;border-radius:6px;padding:10px 12px">
    ${header}
    <div style="margin-top:4px;font-size:10.5px;color:#8091A0">On commit, exactly these ${result.changed.size} unit(s) will glow — the preview IS the glow set (G1/DEC-34).</div>
    ${cellLines}
  </div>`;
}
