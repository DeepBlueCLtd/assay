/** SCRATCH — functional smoke test of the built page via happy-dom. */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Window } from 'happy-dom';

const here = fileURLToPath(new URL('.', import.meta.url));
const html = readFileSync(here + 'relevance-viz.html', 'utf8');

const scriptText = html.match(/<script>([\s\S]*?)<\/script>/)![1]!;
const domHtml = html.replace(/<script>[\s\S]*?<\/script>/, '');

const window = new Window({ url: 'http://localhost/' });
const doc = window.document as any;
doc.write(domHtml);

const errors: string[] = [];
try {
  // The page script uses only `document`; run it against the parsed DOM.
  new Function('document', scriptText)(doc);
} catch (e) {
  errors.push(String(e));
}

const q = (s: string) => doc.querySelector(s);
const count = (s: string) => doc.querySelectorAll(s).length;

const checks: [string, boolean][] = [];
checks.push(['scenario buttons rendered', count('#scen button') === 3]);
checks.push(['map has region groups', count('#map g') >= 10]);
checks.push(['map drew routes (polylines)', count('#map polyline') >= 1]);
checks.push(['matrix rows rendered', count('#mx tbody tr.rrow') === 10]);
checks.push(['relevance chips present', count('#mx .chip') >= 30]);
checks.push(['verdict pills present', count('#vt .vpill') === 18]);
checks.push(['callout populated', (q('#callout')?.textContent ?? '').length > 20]);
checks.push(['engine label filled', (q('#eng')?.textContent ?? '') === '0.2.0']);

// Toggle to R-SEA and confirm S3 becomes decisive somewhere (the headline shift).
const rsea = [...doc.querySelectorAll('#scen button')].find((b: any) => b.textContent === 'R-SEA') as any;
if (rsea) rsea.click();
const s3decisive = [...doc.querySelectorAll('#mx tbody tr.rrow')].some((tr: any) => {
  const id = tr.querySelector('.kid')?.textContent;
  return id === 'S3' && [...tr.querySelectorAll('.chip')].some((c: any) => c.classList.contains('decisive'));
});
checks.push(['toggling R-SEA makes S3 decisive (shift visible)', s3decisive]);
checks.push(['no JS errors', errors.length === 0]);

for (const [n, ok] of checks) console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${n}`);
if (errors.length) console.log('  errors:', errors.slice(0, 5).join(' | '));
process.exitCode = checks.every(([, ok]) => ok) ? 0 : 1;
