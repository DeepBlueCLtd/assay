/**
 * SPEC-05 — delta log (seam contract §10).
 *
 * Every cross-surface write publishes exactly one delta (DEC-5). The feed is
 * ordered by a monotonic `seq`; `at` is a display-only envelope and never
 * participates in any hash or computation (DEC-17), so it takes an injected
 * clock — there is no ambient entropy behind the seam (G1).
 */
import type { Ref } from './store.js';
import type { Delta, LintWarning } from './seam.js';

export interface PublishInput {
  op: Delta['op'];
  refs: Ref[];
  actor: string;
  role: string;
  stamp?: string;
  warnings?: LintWarning[];
}

const FIXED_EPOCH = '1970-01-01T00:00:00.000Z';

export class DeltaLog {
  #deltas: Delta[] = [];
  #seq = 0;
  #clock: () => string;

  /** The clock feeds only the display-only `at`; default is fixed for determinism. */
  constructor(clock: () => string = () => FIXED_EPOCH) {
    this.#clock = clock;
  }

  publish(input: PublishInput): Delta {
    const delta: Delta = {
      seq: ++this.#seq,
      actor: input.actor,
      role: input.role,
      op: input.op,
      refs: input.refs,
      at: this.#clock(),
    };
    if (input.stamp !== undefined) delta.stamp = input.stamp;
    if (input.warnings !== undefined && input.warnings.length > 0) delta.warnings = input.warnings;
    this.#deltas.push(delta);
    return delta;
  }

  /** GET /deltas?since=seq — strictly after `seq`. */
  since(seq: number): Delta[] {
    return this.#deltas.filter((d) => d.seq > seq);
  }

  get size(): number {
    return this.#deltas.length;
  }

  get all(): readonly Delta[] {
    return this.#deltas;
  }

  /**
   * A byte-faithful, independent copy (SPEC-25 US2, the shadow fork). Deltas are
   * flat envelopes; the clone carries the same clock and `seq` so a shadow write
   * publishes the next seq exactly as a commit would — yet onto the clone's own
   * array, never the committed feed (note 13 §2.2).
   */
  clone(): DeltaLog {
    const copy = new DeltaLog(this.#clock);
    copy.#deltas = this.#deltas.map((d) => ({ ...d }));
    copy.#seq = this.#seq;
    return copy;
  }
}
