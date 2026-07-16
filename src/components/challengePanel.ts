/**
 * SPEC-25 US4 — the challenge affordance (research note `13-legibility.md` §5).
 *
 * "Challenge" on a verdict re-renders the SPEC-11 sensitivity ranking RESTRICTED
 * to that verdict: the knowledge whose band-edge perturbation flips it, with
 * single-source flags co-shown, deep-linked to the S1 rows where the lifecycle
 * acts (contest, collect, refresh) live. It ROUTES challenge to the knowledge —
 * it does not adjudicate it (the UK Red Teaming Handbook's warning: lip-service
 * challenge instils false confidence). An insensitive verdict renders the honest
 * "nothing flips it" sentence — itself assurance, never a blank.
 *
 * Pure (SPEC-14): depends only on its inputs; no service call, no state, no
 * scalar. It re-renders computed sensitivity, never an opinion.
 */
const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** One challenge contributor: the knowledge whose band-edge move flips this verdict. */
export interface ChallengeContributor {
  knowledge: string; // logical_id
  single_source: boolean;
  from: string; // the verdict at the commitment before perturbation
  to: string; // the verdict after the band-edge move (the flip)
}

export interface ChallengeResult {
  plan: string;
  commitment: string;
  /** The verdict being challenged, for the header. */
  verdict: string;
  contributors: ChallengeContributor[];
  /** The reused sensitivity stamp — the same as an equivalent /analyse/sensitivity call. */
  stamp: string;
}

const singleSourceFlag = (): string =>
  `<span style="font-family:ui-monospace,monospace;font-size:9.5px;font-weight:700;color:#A33131;background:#F8E2E2;border:1px solid #EFC6C6;border-radius:3px;padding:1px 5px;margin-left:6px">single-source</span>`;

function contributorRow(c: ChallengeContributor): string {
  return `<div data-logical-id="${esc(c.knowledge)}" style="display:flex;gap:8px;align-items:baseline;padding:3px 0;font-size:11.5px">
    <span style="font-family:ui-monospace,monospace;font-size:11px;font-weight:700;color:#1B2732;min-width:44px">${esc(c.knowledge)}</span>
    <span style="color:#5B6B77">pushed to its band edge, flips this verdict <b style="font-family:ui-monospace,monospace">${esc(c.from)} → ${esc(c.to)}</b></span>
    ${c.single_source ? singleSourceFlag() : ''}
  </div>`;
}

/**
 * Render the challenge for one verdict. `contributors` empty ⇒ the honest
 * insensitive message (the verdict is robust to each assessment's stated
 * uncertainty — assurance, not a blank).
 */
export function challengePanel(result: ChallengeResult): string {
  const header = `<div style="font-family:ui-monospace,monospace;font-size:11.5px;font-weight:700;color:#1B2732">Challenge · ${esc(result.plan)} · ${esc(result.commitment)} (${esc(result.verdict)}) — key assumptions</div>`;
  if (result.contributors.length === 0) {
    return `<div class="assay-challenge" style="border:1px solid #B7DCC4;border-left:4px solid #1E6B3A;background:#EFF6F1;border-radius:6px;padding:10px 12px">
      ${header}
      <div style="margin-top:6px;font-size:11.5px;color:#1E6B3A"><b>No single band-edge movement flips this verdict.</b> The verdict is robust to each assessment's stated uncertainty — itself assurance, not a gap.</div>
    </div>`;
  }
  return `<div class="assay-challenge" style="border:1px solid #E4D3A6;border-left:4px solid #8A6A12;background:#FBF7EC;border-radius:6px;padding:10px 12px">
    ${header}
    <div style="margin-top:4px;font-size:10.5px;color:#8091A0">These items, each pushed to its band edge, change this verdict (a re-render of the sensitivity ranking, SPEC-11 — computed, never opined). Click one to open its knowledge row and challenge it there.</div>
    <div style="margin-top:6px">${result.contributors.map(contributorRow).join('')}</div>
  </div>`;
}
