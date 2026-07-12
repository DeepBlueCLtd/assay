/**
 * SPEC-04 support — runtime validation of fixture instances against the
 * generated schema metadata. The shapes come from the generated SCHEMA
 * object (never hand-drifted); only the checking logic lives here.
 *
 * Strict by default: unknown slots are errors (a typo'd optional slot that
 * silently validates is how fixtures drift from the schema).
 */
import { SCHEMA, type ClassMeta } from './generated/types.js';

export function validateInstance(className: string, value: unknown, path = className): string[] {
  const cls = SCHEMA.classes[className];
  if (!cls) return [`${path}: unknown class ${className}`];
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return [`${path}: expected object for ${className}`];
  }
  const errors: string[] = [];
  const attrs = collectAttributes(cls);
  const obj = value as Record<string, unknown>;

  for (const key of Object.keys(obj)) {
    if (!(key in attrs)) errors.push(`${path}.${key}: unknown slot on ${className}`);
  }
  for (const [slot, meta] of Object.entries(attrs)) {
    const v = obj[slot];
    if (v === undefined) {
      if (meta.required) errors.push(`${path}.${slot}: required slot missing`);
      continue;
    }
    if (v === null) {
      errors.push(`${path}.${slot}: null is forbidden — omit absent slots (knowledge model §2)`);
      continue;
    }
    if (meta.multivalued) {
      if (!Array.isArray(v)) {
        errors.push(`${path}.${slot}: expected array`);
        continue;
      }
      if (meta.required && v.length === 0) errors.push(`${path}.${slot}: required list is empty`);
      v.forEach((item, i) => errors.push(...checkRange(meta.range, item, `${path}.${slot}[${i}]`)));
    } else {
      errors.push(...checkRange(meta.range, v, `${path}.${slot}`));
    }
  }

  // Cross-slot rules the schema commentary makes normative:
  if (className === 'Band') {
    const { lo, hi } = obj as { lo?: number; hi?: number };
    if (typeof lo === 'number' && typeof hi === 'number' && lo > hi) {
      errors.push(`${path}: lo > hi (${lo} > ${hi}) — Band is a closed interval (DEC-15)`);
    }
  }
  return errors;
}

function collectAttributes(cls: ClassMeta): ClassMeta['attributes'] {
  const chain: ClassMeta[] = [cls];
  let parent = cls.parent;
  while (parent) {
    const p = SCHEMA.classes[parent];
    if (!p) break;
    chain.unshift(p);
    parent = p.parent;
  }
  return Object.assign({}, ...chain.map((c) => c.attributes));
}

function checkRange(range: string, value: unknown, path: string): string[] {
  if (range === 'string') return typeof value === 'string' ? [] : [`${path}: expected string`];
  if (range === 'boolean') return typeof value === 'boolean' ? [] : [`${path}: expected boolean`];
  if (range === 'float' || range === 'double') {
    return typeof value === 'number' && Number.isFinite(value) ? [] : [`${path}: expected finite number`];
  }
  if (range === 'integer') {
    return typeof value === 'number' && Number.isInteger(value) ? [] : [`${path}: expected integer`];
  }
  const alias = SCHEMA.typeAliases[range];
  if (alias) {
    if (range === 'Timestep') {
      return typeof value === 'number' && Number.isInteger(value) && value >= 0
        ? []
        : [`${path}: expected Timestep (integer ≥ 0)`];
    }
    return checkRange(alias === 'number' ? 'float' : alias, value, path);
  }
  const enumValues = SCHEMA.enums[range];
  if (enumValues) {
    return typeof value === 'string' && (enumValues as readonly string[]).includes(value)
      ? []
      : [`${path}: '${String(value)}' not in ${range} (${enumValues.join(' | ')})`];
  }
  if (SCHEMA.classes[range]) return validateInstance(range, value, path);
  return [`${path}: unknown range ${range}`];
}
