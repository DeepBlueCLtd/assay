/**
 * Stage-0 microbenchmark (research note 00, "what we will do differently" #3):
 * canonicalise + hash at synthetic dense-world scale, so 02-compile.md decides
 * sparse-vs-dense channel representation from numbers.
 *
 * Dense Meridian world: 60×60 cells × 56 steps × 6 channels ≈ 1.2M banded cells.
 */
import { canonicalJson, contentHash } from '../src/canonical.js';

const COLS = 60, ROWS = 60, STEPS = 56, CHANNELS = 6;

function denseWorld(): Record<string, unknown> {
  const channels = [];
  for (let c = 0; c < CHANNELS; c++) {
    const cells = [];
    for (let t = 0; t < STEPS; t++) {
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          // deterministic pseudo-values; no Math.random (G1 habit)
          const v = ((x * 7 + y * 13 + t * 3 + c * 29) % 100) / 100;
          cells.push({ x, y, t, value: { lo: v, hi: v + 0.1, unit: 'index' } });
        }
      }
    }
    cells.length && channels.push({ name: `ch${c}`, kind: 'threat', cells });
  }
  return { logical_id: 'W-BENCH', version: 1, engine_version: '0.1.0', stamp: 'bench', channels };
}

const t0 = performance.now();
const world = denseWorld();
const t1 = performance.now();
const json = canonicalJson(world);
const t2 = performance.now();
const hash = await contentHash(world);
const t3 = performance.now();

const cellCount = COLS * ROWS * STEPS * CHANNELS;
console.log(`cells:        ${cellCount.toLocaleString()}`);
console.log(`build:        ${(t1 - t0).toFixed(0)} ms`);
console.log(`canonicalise: ${(t2 - t1).toFixed(0)} ms → ${(json.length / 1e6).toFixed(1)} MB`);
console.log(`hash:         ${(t3 - t2).toFixed(0)} ms (${hash.slice(0, 12)}…)`);
console.log(`total serialise+hash per recompile: ${(t3 - t1).toFixed(0)} ms`);
