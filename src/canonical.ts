/**
 * SPEC-01 — canonical JSON and content hashing.
 *
 * Canonical form is RFC 8785 (JSON Canonicalization Scheme) restricted to
 * ASSAY's stricter subset (research note 00-foundations.md):
 *   - object keys sorted by UTF-16 code units (JCS §3.2.3);
 *   - numbers in ECMAScript shortest-round-trip form (JCS §3.2.2.3 — this is
 *     what JSON.stringify emits for a finite number);
 *   - REJECT rather than coerce: NaN, ±Infinity, -0, explicit null,
 *     undefined inside arrays, and non-plain objects all throw. A coercion
 *     that changes bytes is a determinism bug waiting to be blamed on G1.
 *   - undefined object properties are dropped (model rule: optional absent
 *     slots are omitted entirely, never null — knowledge model §2);
 *   - no unicode normalisation: the UTF-8 bytes of the string are hashed
 *     as-is. Differently-composed lookalikes are different content.
 */

export function canonicalJson(value: unknown): string {
  return serialize(value, '$');
}

function serialize(value: unknown, path: string): string {
  if (value === null) {
    throw new Error(`canonicalJson: explicit null at ${path} — omit absent slots instead (knowledge model §2)`);
  }
  switch (typeof value) {
    case 'string':
      return JSON.stringify(value);
    case 'boolean':
      return value ? 'true' : 'false';
    case 'number': {
      if (!Number.isFinite(value)) throw new Error(`canonicalJson: non-finite number at ${path}`);
      if (Object.is(value, -0)) throw new Error(`canonicalJson: -0 at ${path} — sign would be silently lost`);
      return JSON.stringify(value); // ES shortest round-trip form, per RFC 8785
    }
    case 'object': {
      if (Array.isArray(value)) {
        return `[${value
          .map((item, i) => {
            if (item === undefined) throw new Error(`canonicalJson: undefined in array at ${path}[${i}]`);
            return serialize(item, `${path}[${i}]`);
          })
          .join(',')}]`;
      }
      const proto = Object.getPrototypeOf(value);
      if (proto !== Object.prototype && proto !== null) {
        throw new Error(`canonicalJson: non-plain object at ${path}`);
      }
      const entries = Object.entries(value as Record<string, unknown>)
        .filter(([, v]) => v !== undefined)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)); // UTF-16 code unit order
      return `{${entries
        .map(([k, v]) => `${JSON.stringify(k)}:${serialize(v, `${path}.${k}`)}`)
        .join(',')}}`;
    }
    default:
      throw new Error(`canonicalJson: unsupported ${typeof value} at ${path}`);
  }
}

/** SHA-256 (hex) of the UTF-8 bytes of the canonical JSON. One code path for
 * browser and Node (globalThis.crypto.subtle — Node ≥ 19, all browsers). */
export async function contentHash(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalJson(value));
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
