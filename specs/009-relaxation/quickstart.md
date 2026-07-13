# Quickstart — SPEC-09 Relaxation (`/relax`)

## What it does

`/relax` turns an infeasible commitment set into an **argument**, not an error. Against the Meridian R3m world (both approaches mined, causeway dropped) no plan satisfies C2, C3 and C4 together. `/relax` returns the three least-worst ways forward — each naming what it gives up, in command language.

## Run it (in a test / script)

```ts
import { CompileService } from './src/compile.js';
import { ScoreService } from './src/score.js';
import { RelaxService } from './src/relax.js';
import { isRelaxRefusal /* isRefusal */ } from './src/seam.js';

// 1. Compile the R3m world (SPEC-06): base knowledge under the R3m excursion.
const compiled = await compiler.compile({ knowledge: baseRefs, config, scenario: 'R3m', engine_version: '0.1.0' });

// 2. Relax the commitment set against it.
const scorer = new ScoreService({ store, trace, config, commitments });
const relax = new RelaxService({ store, trace, scorer, commitments });
const res = await relax.relax({
  world: compiled.world,
  commitments: ['C1','C2','C3','C4','C5','C6'].map((id) => ({ logical_id: id, content_hash: '' })),
  seed: 1,
  engine_version: '0.1.0',
});
if (isRefusal(res)) throw new Error(res.reason);

// 3. Read the least-worst candidates.
for (const c of res.report.candidates) {
  console.log(c.sacrificed.join(','), '—', c.narrative);
}
console.log('tie-break:', res.report.tie_break);
```

## Expect (Stage-4 exit)

```
C3 — fires forward: clears the FAC berths but fires into the populated harbourfront district
C4 — parallel sweep: the amphibious group crosses the mined strait unsuppressed
C2 — sequential sweep: the strait opens at D+9 — two days late
tie-break: C3 and C4 are both `should`; ordered by commitment id (a stated, commander-owned placeholder — not a claim that one outranks the other)
```

Three candidates, each `sacrificed` non-empty; the two `should`-sacrifices (C3, C4) rank above the `must`-sacrifice (C2); nothing is dropped silently (G4). Plans that give up *more* — `{C2,C4}`, `{C3,C4}` — are inclusion-dominated and never shown as separate options.

## Gallery

`npm run gallery` renders the S3 least-worst cards from this exact call. `npm run typecheck && npm test` gate the slice; no schema regen.
