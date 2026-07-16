/**
 * SPEC-01 — content-addressed object store.
 *
 * Seam contract §2: PUT/GET/exists/versions. Objects are immutable and
 * addressed by the SHA-256 of their canonical JSON; PUT of byte-identical
 * content is idempotent and returns the same hash; there is no update and
 * no delete (knowledge model §2). Immutability is by construction: the
 * store keeps only the canonical string and parses a fresh copy on GET,
 * so no caller ever holds a reference into stored state.
 */
import { canonicalJson, contentHash } from './canonical.js';

export interface Ref {
  logical_id: string;
  content_hash: string;
}

interface StoredEntry {
  canonical: string;
  logical_id?: string;
  version?: number;
}

export class ObjectStore {
  #byHash = new Map<string, StoredEntry>();
  #lineages = new Map<string, string[]>(); // logical_id → hashes, insertion order

  /** PUT /objects — hash computed here; idempotent on identical content. */
  async put(obj: Record<string, unknown>): Promise<Ref> {
    const canonical = canonicalJson(obj);
    const hash = await contentHash(obj);
    if (!this.#byHash.has(hash)) {
      const logical_id = typeof obj.logical_id === 'string' ? obj.logical_id : undefined;
      const version = typeof obj.version === 'number' ? obj.version : undefined;
      const entry: StoredEntry = { canonical };
      if (logical_id !== undefined) entry.logical_id = logical_id;
      if (version !== undefined) entry.version = version;
      this.#byHash.set(hash, entry);
      if (logical_id) {
        const lineage = this.#lineages.get(logical_id) ?? [];
        lineage.push(hash);
        this.#lineages.set(logical_id, lineage);
      }
    }
    return { logical_id: (obj.logical_id as string) ?? '', content_hash: hash };
  }

  /** GET /objects/{hash} — returns a fresh copy; mutating it cannot touch the store. */
  get(hash: string): unknown | undefined {
    const entry = this.#byHash.get(hash);
    return entry === undefined ? undefined : JSON.parse(entry.canonical);
  }

  /** GET /objects/exists/{hash} */
  exists(hash: string): boolean {
    return this.#byHash.has(hash);
  }

  /** GET /objects/{logical_id}/versions — lineage, oldest first (by version, then insertion). */
  versions(logicalId: string): Ref[] {
    const hashes = this.#lineages.get(logicalId) ?? [];
    return hashes
      .map((h) => ({ hash: h, entry: this.#byHash.get(h)! }))
      .sort((a, b) => (a.entry.version ?? 0) - (b.entry.version ?? 0))
      .map(({ hash, entry }) => ({ logical_id: entry.logical_id ?? '', content_hash: hash }));
  }

  /** GET /objects?class= support arrives with the knowledge service (Stage 1);
   * the store itself stays class-blind. */
  get size(): number {
    return this.#byHash.size;
  }

  /**
   * A byte-faithful, independent copy of the store (SPEC-25 US2, the shadow
   * fork). Entries hold only a canonical string plus scalars, so a shallow copy
   * of each entry is a full copy; the clone shares no mutable state with the
   * original, so writing to the clone never touches the committed store (the
   * preview's "nothing persisted" guarantee, note 13 §2.2).
   */
  clone(): ObjectStore {
    const copy = new ObjectStore();
    for (const [hash, entry] of this.#byHash) copy.#byHash.set(hash, { ...entry });
    for (const [id, lineage] of this.#lineages) copy.#lineages.set(id, [...lineage]);
    return copy;
  }
}
