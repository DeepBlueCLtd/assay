import { describe, expect, it } from 'vitest';
import { canonicalJson, contentHash } from '../src/canonical.js';

describe('canonical JSON (RFC 8785 subset — research note 00)', () => {
  it('is key-order independent', async () => {
    const a = { question: 'q', subject: 's', criticality: 'critical' };
    const b = { criticality: 'critical', subject: 's', question: 'q' };
    expect(canonicalJson(a)).toBe(canonicalJson(b));
    expect(await contentHash(a)).toBe(await contentHash(b));
  });

  it('sorts keys recursively by UTF-16 code units', () => {
    expect(canonicalJson({ b: { z: 1, a: 2 }, a: 1 })).toBe('{"a":1,"b":{"a":2,"z":1}}');
  });

  it('serialises numbers in ES shortest round-trip form', () => {
    expect(canonicalJson({ a: 1e21 })).toBe('{"a":1e+21}');
    expect(canonicalJson({ a: 0.1 })).toBe('{"a":0.1}');
    expect(canonicalJson({ a: 56 })).toBe('{"a":56}');
  });

  it('rejects rather than coerces: NaN, Infinity, -0, null', () => {
    expect(() => canonicalJson({ a: NaN })).toThrow(/non-finite/);
    expect(() => canonicalJson({ a: Infinity })).toThrow(/non-finite/);
    expect(() => canonicalJson({ a: -0 })).toThrow(/-0/);
    expect(() => canonicalJson({ a: null })).toThrow(/null/);
  });

  it('drops undefined object slots (absent, never null) but rejects undefined in arrays', () => {
    expect(canonicalJson({ a: 1, b: undefined })).toBe('{"a":1}');
    expect(() => canonicalJson({ a: [1, undefined] })).toThrow(/undefined in array/);
  });

  it('does not normalise unicode: composed and decomposed forms are different content', async () => {
    const nfc = { name: 'café' }; // U+00E9
    const nfd = { name: 'café' }; // e + combining acute
    expect(await contentHash(nfc)).not.toBe(await contentHash(nfd));
  });

  it('rejects non-plain objects', () => {
    expect(() => canonicalJson({ d: new Date(0) })).toThrow(/non-plain/);
  });
});
