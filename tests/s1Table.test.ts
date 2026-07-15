import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { KnowledgeObject } from '../src/generated/types.js';
import { s1Table, type S1Row } from '../src/components/s1Table.js';
import { refusalBanner } from '../src/components/refusalBanner.js';
import { componentLegend } from '../src/components/legends.js';
import { provenanceChip } from '../src/components/provenanceChip.js';
import { confidenceLint } from '../src/lint.js';
import type { Refusal } from '../src/seam.js';

const knowledge = JSON.parse(
  readFileSync(new URL('../fixtures/knowledge.json', import.meta.url), 'utf8'),
) as KnowledgeObject[];
const byId = new Map(knowledge.map((k) => [k.logical_id, k]));

const rows = (ids: string[]): S1Row[] =>
  ids.map((id) => ({ object: byId.get(id)!, warnings: confidenceLint(byId.get(id)!) }));

describe('S1 table — banded honesty made visible (SPEC-05; G2)', () => {
  it('every non-observed answered value renders through a band pill with provenance', () => {
    const answered = knowledge.filter((k) => k.answer && k.provenance?.source_class !== 'observed');
    const html = s1Table(rows(answered.map((k) => k.logical_id)));
    // one band pill per non-observed answered row, each with its provenance chip
    for (const k of answered) {
      const row = html.slice(html.indexOf(`data-logical-id="${k.logical_id}"`));
      expect(row.includes('assay-band'), `${k.logical_id} renders a band pill`).toBe(true);
    }
    expect((html.match(/assay-provenance/g) ?? []).length).toBe(answered.length);
    // the mandatory "assessment, not fact" marking appears for assessed values
    expect(html.includes('assessment, not fact')).toBe(true);
  });

  it('an observed value (K1) may render unbanded and carries no assessment marking', () => {
    const html = s1Table(rows(['K1']));
    expect(html.includes('assay-band')).toBe(false); // unbanded permitted (DEC-14)
    expect(html.includes('assessment, not fact')).toBe(false);
    expect(html.includes('7.5 m controlling depth')).toBe(true);
  });

  it('the demo moment: a refused K10 save renders its banner and adds no K10 row', () => {
    const refusal: Refusal = {
      refused: true,
      reason: 'encoding_violation',
      offending: [{ logical_id: 'K10', content_hash: '' }],
      explanation: 'K10: an assumption may never be a hard constraint — no waiver can license one.',
    };
    const html = s1Table(rows(['K1', 'K2']), { refusal });
    expect(html.includes('assay-refusal')).toBe(true);
    expect(html.includes('encoding_violation')).toBe(true);
    expect(html.includes('data-logical-id="K10"')).toBe(false); // nothing stored, no row
  });

  it('a contested row carries a compile-blocking flag; K8 carries a waiver chip', () => {
    const html = s1Table([
      { object: byId.get('K12a')!, effectiveStatus: 'contested', blocked: true },
      { object: byId.get('K8')! },
    ]);
    expect(html.includes('blocks compile')).toBe(true);
    expect(html.includes('waiver W-1')).toBe(true);
    expect(html.includes('single-source')).toBe(true); // K8's mandatory marking (DEC-9)
  });

  it('a low-confidence tight band surfaces a lint caution on its row', () => {
    const k = structuredClone(byId.get('K6')!);
    k.answer = { lo: 4.0, hi: 4.2, unit: 'sorties/day' };
    const html = s1Table([{ object: k, warnings: confidenceLint(k) }]);
    expect(html.includes('assay-lint')).toBe(true);
    expect(html.includes('false precision')).toBe(true);
  });

  it('SPEC-21: the provenance chip renders the JIPOE step in words, on every chip-bearing row', () => {
    const html = s1Table(rows(['K8', 'K1', 'K14a']));
    expect(html).toContain('JIPOE 3 · evaluate the adversary'); // K8 — never a bare number
    expect(html).toContain('JIPOE 1 · define the OE'); // K1 — observed values carry it too
    expect(html).toContain('JIPOE 4 · determine adversary COAs'); // K14a — the firewall's doctrinal home
    // words, not the enum token — on the chip itself (the glow sig is an internal attribute)
    const chip = provenanceChip(byId.get('K8')!.provenance!, byId.get('K8')!.jipoe_step);
    expect(chip).toContain('JIPOE 3 · evaluate the adversary');
    expect(chip).not.toContain('step3_evaluate_adversary');
  });

  it('SPEC-21: the s1Table legend documents the JIPOE step chip', () => {
    expect(componentLegend('s1Table')).toContain('JIPOE step chip');
    expect(componentLegend('channelTrace')).toContain('JIPOE step chip');
  });

  it('refusalBanner renders reason, offending ref, and explanation', () => {
    const html = refusalBanner({
      refused: true,
      reason: 'waiver_required',
      offending: [{ logical_id: 'K8', content_hash: '' }],
      explanation: 'K8: a assessed value needs a recorded waiver to act as a hard constraint.',
    });
    expect(html).toContain('waiver_required');
    expect(html).toContain('K8');
    expect(html).toContain('recorded waiver');
  });
});
