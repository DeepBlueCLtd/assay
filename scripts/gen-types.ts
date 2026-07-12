/**
 * SPEC-03 — LinkML → TypeScript type-generation pipeline.
 *
 * Reads schema/assay-knowledge-model.yaml (extracted verbatim from
 * docs/assay-knowledge-model.md §11, the source of truth) and emits
 * src/generated/types.ts: named types, enum unions, interfaces, and a
 * SCHEMA metadata object consumed by the runtime validator.
 *
 * TypeScript types are generated, never hand-drifted (constitution,
 * Additional Constraints). Output is deterministic: same schema bytes,
 * same output bytes.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { parse } from 'yaml';

interface SlotDef {
  range?: string;
  required?: boolean;
  multivalued?: boolean;
  description?: string;
}
interface ClassDef {
  is_a?: string;
  abstract?: boolean;
  description?: string;
  attributes?: Record<string, SlotDef | null>;
}
interface Schema {
  types?: Record<string, { typeof?: string; description?: string }>;
  enums?: Record<string, { description?: string; permissible_values: Record<string, unknown> }>;
  classes?: Record<string, ClassDef>;
}

const SCHEMA_PATH = new URL('../schema/assay-knowledge-model.yaml', import.meta.url);
const OUT_PATH = new URL('../src/generated/types.ts', import.meta.url);

const schema = parse(readFileSync(SCHEMA_PATH, 'utf8')) as Schema;

const PRIMITIVES: Record<string, string> = {
  string: 'string',
  float: 'number',
  double: 'number',
  integer: 'number',
  boolean: 'boolean',
};

const typeAliases = schema.types ?? {};
const enums = schema.enums ?? {};
const classes = schema.classes ?? {};

function tsRange(range: string | undefined): string {
  const r = range ?? 'string'; // default_range: string
  if (PRIMITIVES[r]) return PRIMITIVES[r];
  if (typeAliases[r]) return r;
  if (enums[r]) return r;
  if (classes[r]) return r;
  throw new Error(`unknown range: ${r}`);
}

function docComment(text: string | undefined, indent: string): string {
  if (!text) return '';
  return `${indent}/** ${text.trim().replace(/\s+/g, ' ')} */\n`;
}

const out: string[] = [];
out.push('/**');
out.push(' * GENERATED FILE — do not edit.');
out.push(' * Source: schema/assay-knowledge-model.yaml (docs/assay-knowledge-model.md §11).');
out.push(' * Regenerate with: npm run gen');
out.push(' */');
out.push('');

// -- named types ------------------------------------------------------------
for (const [name, def] of Object.entries(typeAliases)) {
  out.push(docComment(def.description, ''));
  out.push(`export type ${name} = ${PRIMITIVES[def.typeof ?? 'string'] ?? 'string'};`);
  out.push('');
}

// -- enums as literal unions -------------------------------------------------
for (const [name, def] of Object.entries(enums)) {
  const values = Object.keys(def.permissible_values);
  out.push(docComment(def.description, ''));
  out.push(`export type ${name} = ${values.map((v) => `'${v}'`).join(' | ')};`);
  out.push(
    `export const ${name}Values = [${values.map((v) => `'${v}'`).join(', ')}] as const;`,
  );
  out.push('');
}

// -- classes as interfaces ----------------------------------------------------
for (const [name, def] of Object.entries(classes)) {
  out.push(docComment(def.description, ''));
  const parent = def.is_a ? ` extends ${def.is_a}` : '';
  out.push(`export interface ${name}${parent} {`);
  for (const [slot, rawSlot] of Object.entries(def.attributes ?? {})) {
    const s: SlotDef = rawSlot ?? {};
    const base = tsRange(s.range);
    const t = s.multivalued ? `${base}[]` : base;
    out.push(docComment(s.description, '  ') + `  ${slot}${s.required ? '' : '?'}: ${t};`);
  }
  out.push('}');
  out.push('');
}

// -- SCHEMA metadata for the runtime validator --------------------------------
out.push('/** Slot metadata for runtime validation (src/validate.ts). */');
out.push('export interface SlotMeta { range: string; required: boolean; multivalued: boolean; }');
out.push('export interface ClassMeta { parent?: string; abstract?: boolean; attributes: Record<string, SlotMeta>; }');
out.push('export const SCHEMA: {');
out.push('  typeAliases: Record<string, string>;');
out.push('  enums: Record<string, readonly string[]>;');
out.push('  classes: Record<string, ClassMeta>;');
out.push('} = {');
out.push('  typeAliases: {');
for (const [name, def] of Object.entries(typeAliases)) {
  out.push(`    ${name}: '${PRIMITIVES[def.typeof ?? 'string'] ?? 'string'}',`);
}
out.push('  },');
out.push('  enums: {');
for (const [name, def] of Object.entries(enums)) {
  out.push(`    ${name}: [${Object.keys(def.permissible_values).map((v) => `'${v}'`).join(', ')}],`);
}
out.push('  },');
out.push('  classes: {');
for (const [name, def] of Object.entries(classes)) {
  const attrs = Object.entries(def.attributes ?? {}).map(([slot, rawSlot]) => {
    const s: SlotDef = rawSlot ?? {};
    return `${slot}: { range: '${s.range ?? 'string'}', required: ${!!s.required}, multivalued: ${!!s.multivalued} }`;
  });
  const parts: string[] = [];
  if (def.is_a) parts.push(`parent: '${def.is_a}'`);
  if (def.abstract) parts.push('abstract: true');
  parts.push(`attributes: { ${attrs.join(', ')} }`);
  out.push(`    ${name}: { ${parts.join(', ')} },`);
}
out.push('  },');
out.push('};');
out.push('');

mkdirSync(new URL('../src/generated/', import.meta.url), { recursive: true });
writeFileSync(OUT_PATH, out.join('\n'));
console.log(`generated ${OUT_PATH.pathname}`);
