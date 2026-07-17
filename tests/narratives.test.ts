import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  NARRATIVES,
  SCRIPTING_PRINCIPLES,
  narrativeById,
  type Narrative,
  type NarrativeBeat,
} from '../src/narratives.js';
import type { Commitment, KnowledgeObject, Plan, ScenarioCOA, VignetteConfig } from '../src/generated/types.js';
import { AppState, type Fixtures } from '../src/app/state.js';

const VALID_TABS = new Set(['j2', 'planner', 'commander', 'observer']);

const load = <T>(name: string): T[] =>
  JSON.parse(readFileSync(new URL(`../fixtures/${name}.json`, import.meta.url), 'utf8')) as T[];
const fixtures = (): Fixtures => ({
  knowledge: load<KnowledgeObject>('knowledge'),
  coas: load<ScenarioCOA>('coas'),
  commitments: load<Commitment>('commitments'),
  plans: load<Plan>('plans'),
  config: JSON.parse(
    readFileSync(new URL('../fixtures/vignette-config.json', import.meta.url), 'utf8'),
  ) as VignetteConfig,
});

describe('narrative definitions (Stage 7, note 09)', () => {
  it('there are exactly five narratives matching concept §1', () => {
    expect(NARRATIVES).toHaveLength(5);
    const ids = NARRATIVES.map((n) => n.id);
    expect(ids).toContain('j2');
    expect(ids).toContain('planner');
    expect(ids).toContain('commander');
    expect(ids).toContain('bridge');
    expect(ids).toContain('remit');
  });

  it('narrativeById returns the correct narrative', () => {
    const j2 = narrativeById('j2');
    expect(j2).toBeDefined();
    expect(j2!.name).toBe('J-2 narrative');
    expect(narrativeById('nonexistent')).toBeUndefined();
  });

  it('every narrative has a non-empty name, audience, centrepiece, and beats', () => {
    for (const n of NARRATIVES) {
      expect(n.name.length).toBeGreaterThan(0);
      expect(n.audience.length).toBeGreaterThan(0);
      expect(n.centrepiece.length).toBeGreaterThan(0);
      expect(n.beats.length).toBeGreaterThan(0);
    }
  });

  it('every beat references a valid tab id', () => {
    for (const n of NARRATIVES) {
      for (const beat of n.beats) {
        expect(VALID_TABS.has(beat.tab), `${n.id} beat "${beat.title}" has invalid tab "${beat.tab}"`).toBe(true);
      }
    }
  });

  it('every beat has a non-empty title and presenterNote', () => {
    for (const n of NARRATIVES) {
      for (const beat of n.beats) {
        expect(beat.title.length, `${n.id} beat has empty title`).toBeGreaterThan(0);
        expect(beat.presenterNote.length, `${n.id} beat "${beat.title}" has empty presenterNote`).toBeGreaterThan(0);
      }
    }
  });

  it('every narrative has at least one lead thesis', () => {
    for (const n of NARRATIVES) {
      expect(n.leadTheses.length, `${n.id} has no lead theses`).toBeGreaterThan(0);
    }
  });

  it('narrative ids are unique', () => {
    const ids = NARRATIVES.map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('scripting principles (note 09 §4)', () => {
  it('there are exactly five scripting principles', () => {
    expect(SCRIPTING_PRINCIPLES).toHaveLength(5);
  });

  it('principle 1 forbids midpoint narration', () => {
    expect(SCRIPTING_PRINCIPLES[0]).toMatch(/midpoint/i);
  });

  it('principle 2 forbids weighted sums', () => {
    expect(SCRIPTING_PRINCIPLES[1]).toMatch(/weighted sum/i);
  });
});

describe('narrative tab orders match note 09 §4 table', () => {
  it('J-2: S1 → S4 → S1', () => {
    const n = narrativeById('j2')!;
    const tabs = n.beats.map((b) => b.tab);
    expect(tabs[0]).toBe('j2');
    expect(tabs).toContain('observer');
    expect(tabs[tabs.length - 1]).toBe('j2');
  });

  it('Planner: S2 → commander → S2', () => {
    const n = narrativeById('planner')!;
    const tabs = n.beats.map((b) => b.tab);
    expect(tabs[0]).toBe('planner');
    expect(tabs).toContain('commander');
  });

  it('Commander: S3 as anchor', () => {
    const n = narrativeById('commander')!;
    const tabs = n.beats.map((b) => b.tab);
    expect(tabs[0]).toBe('commander');
    expect(tabs[tabs.length - 1]).toBe('commander');
  });

  it('Bridge: S4 → S1 → S4', () => {
    const n = narrativeById('bridge')!;
    const tabs = n.beats.map((b) => b.tab);
    expect(tabs[0]).toBe('observer');
    expect(tabs).toContain('j2');
    expect(tabs[tabs.length - 1]).toBe('observer');
  });

  it('REMIT: S4 → S1 → S2 → S3 → S4 (full walk)', () => {
    const n = narrativeById('remit')!;
    const tabs = n.beats.map((b) => b.tab);
    expect(tabs[0]).toBe('observer');
    expect(tabs).toContain('j2');
    expect(tabs).toContain('planner');
    expect(tabs).toContain('commander');
    expect(tabs[tabs.length - 1]).toBe('observer');
  });
});

describe('banded honesty in presenter notes (G2 — note 09 §3)', () => {
  it('no presenter note contains "approximately" or "about" followed by a bare number', () => {
    const dangerousPatterns = [
      /\babout \d/i,
      /\bapproximately \d/i,
      /\baverage\b/i,
    ];
    for (const n of NARRATIVES) {
      for (const beat of n.beats) {
        for (const pat of dangerousPatterns) {
          expect(
            pat.test(beat.presenterNote),
            `${n.id} beat "${beat.title}" contains forbidden pattern ${pat} — violates "never narrate a midpoint"`,
          ).toBe(false);
        }
      }
    }
  });

  it('no presenter note contains "scores X out of" (verdict as score)', () => {
    for (const n of NARRATIVES) {
      for (const beat of n.beats) {
        expect(
          /scores? \d+ out of/i.test(beat.presenterNote),
          `${n.id} beat "${beat.title}" narrates a verdict as a score`,
        ).toBe(false);
      }
    }
  });

  it('no presenter note contains "better overall" or "best option" (weighted sum)', () => {
    for (const n of NARRATIVES) {
      for (const beat of n.beats) {
        const text = beat.presenterNote;
        expect(
          /\b(better overall|best option)\b/i.test(text),
          `${n.id} beat "${beat.title}" narrates a weighted sum`,
        ).toBe(false);
      }
    }
  });
});

describe('doctrinal quotes (note 09 §4, principle 5)', () => {
  it('every narrative with a sensitivity/discrimination beat has at least one doctrinal quote', () => {
    for (const n of NARRATIVES) {
      const hasAnalysisBeat = n.beats.some(
        (b) => b.presenterNote.includes('sensitivity') || b.presenterNote.includes('discrimination'),
      );
      if (hasAnalysisBeat) {
        const hasQuote = n.beats.some((b) => b.doctrinalQuote);
        expect(hasQuote, `${n.id} has analysis beats but no doctrinal quote`).toBe(true);
      }
    }
  });
});

// ---- SPEC-26 (DEC-39): narratives are scrub paths into the canonical record ----

/** The beat→seq oracle table (note 15 §4) — pins each waypoint into the
 *  canonical heartbeat so a drift is a test failure, not a silent re-scripting. */
const BEAT_SEQS: Record<string, number[]> = {
  j2: [20, 20, 20, 20, 20],
  planner: [20, 20, 20, 20],
  commander: [20, 20, 20, 20],
  bridge: [20, 21, 21, 21],
  remit: [18, 19, 20, 20, 21],
};

describe('narratives-as-scrub-paths (SPEC-26 US2, SC-002)', () => {
  it('the bespoke `action` field is gone from every beat (structural)', () => {
    for (const n of NARRATIVES) {
      for (const beat of n.beats) {
        expect('action' in beat, `${n.id} beat "${beat.title}" still carries an action`).toBe(false);
      }
    }
  });

  it('every beat is a waypoint carrying a seq into the record', () => {
    for (const n of NARRATIVES) {
      for (const beat of n.beats) {
        expect(typeof beat.seq, `${n.id} beat "${beat.title}" has no seq`).toBe('number');
        expect(beat.seq).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('the beat→seq oracle table pins each waypoint', () => {
    for (const [id, seqs] of Object.entries(BEAT_SEQS)) {
      const n = narrativeById(id)!;
      expect(n.beats.map((b) => b.seq), `${id} waypoint seqs drifted`).toEqual(seqs);
    }
  });

  it("every beat's rendered state equals reconstructAt(beat.seq) — no bespoke state (AS-1)", async () => {
    const app = new AppState(fixtures());
    await app.seedCanonical();
    for (const n of NARRATIVES) {
      for (const beat of n.beats) {
        expect(beat.seq).toBeLessThanOrEqual(app.historyMaxSeq);
        const snap = await app.reconstructAt(beat.seq);
        // The beat's tab has at least one panel in the reconstructed belief-state,
        // so the presenter's raised tab is never blank at that waypoint.
        expect(
          snap.panels.some((p) => p.tab === beat.tab),
          `${n.id} beat "${beat.title}" (seq ${beat.seq}) has no panel on tab ${beat.tab}`,
        ).toBe(true);
      }
    }
  }, 30000);
});
