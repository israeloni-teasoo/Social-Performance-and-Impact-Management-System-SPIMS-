/**
 * Verifies the PDF and PowerPoint exports by producing them and inspecting them.
 *
 * Two passes, because each catches what the other cannot:
 *
 *   end-to-end   Signs into the built application and clicks the export buttons. This
 *                is the pass that proves the renderers are actually reached. A renderer
 *                that works when called directly and is never wired to a button has
 *                been this project's characteristic failure.
 *   block cover  Pushes a synthetic specification containing every block type through
 *                both renderers. The flagship report contains no callout — every
 *                programme currently has a reach profile, so there is no caveat to
 *                state — which leaves the block carrying the report's honesty
 *                qualification as the one block the end-to-end pass never exercises.
 *
 * Neither pass asserts that the output looks right; that needs eyes. What they assert
 * is that both formats are produced without a page error, that the PDF embeds its
 * fonts and carries the naira sign, and that the deck contains native chart XML rather
 * than pictures of charts.
 *
 * Playwright is not a dependency of this project — it would be a large install for
 * everyone in order to serve one script. Install it when you need this:
 *
 *   npm i --no-save playwright
 *   npm run build
 *   node scripts/verify-exports.mjs [output directory]
 */

import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const DIST = path.join(ROOT, 'dist');
const OUT = path.resolve(process.argv[2] ?? path.join(ROOT, '.export-verification'));

const ACCOUNT = { email: 'amaka.okonkwo@seplat.com', password: 'Exec@2026' };

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.error('Playwright is not installed. Run: npm i --no-save playwright');
  process.exit(1);
}

const CHROME = process.env.PLAYWRIGHT_CHROMIUM
  ?? execFileSync('bash', ['-c', 'ls -d /opt/pw-browsers/chromium*/chrome-linux/chrome 2>/dev/null | head -1'])
    .toString().trim();

await mkdir(OUT, { recursive: true });

/* ------------------------------------------------------------------- serving */

const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.json': 'application/json',
};

/** Serves the built application, with the SPA fallback a static host would have. */
function serveDist(port) {
  const server = createServer(async (req, res) => {
    let file = decodeURIComponent(req.url.split('?')[0]);
    if (file === '/') file = '/index.html';
    try {
      const body = await readFile(path.join(DIST, file));
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
      res.end(body);
    } catch {
      // Note this answers /api/* with 200 HTML, which is exactly the condition
      // isApiAvailable() uses to decide the application is in demo mode.
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(await readFile(path.join(DIST, 'index.html')));
    }
  });
  return new Promise((r) => server.listen(port, () => r(server)));
}

/** Serves a bare page with the two renderers bundled onto `window.__renderers`. */
async function serveRenderers(port) {
  // Absolute imports: the output directory is caller-supplied and need not sit inside
  // the project, so a relative path from it cannot be relied on.
  const entry = path.join(OUT, 'entry.ts');
  await writeFile(entry, [
    `import { renderReportPdf } from ${JSON.stringify(path.join(ROOT, 'src/reportPdf'))};`,
    `import { renderReportPptx } from ${JSON.stringify(path.join(ROOT, 'src/reportPptx'))};`,
    '(window as any).__renderers = { renderReportPdf, renderReportPptx };',
    '',
  ].join('\n'));

  execFileSync('npx', ['esbuild', entry, '--bundle', '--format=iife',
    `--outfile=${path.join(OUT, 'renderers.js')}`, '--log-level=warning'], { cwd: ROOT, stdio: 'inherit' });

  const page = '<!doctype html><meta charset="utf-8"><title>renderers</title><script src="/renderers.js"></script>';
  const server = createServer(async (req, res) => {
    if (req.url === '/renderers.js') {
      res.writeHead(200, { 'Content-Type': 'text/javascript' });
      res.end(await readFile(path.join(OUT, 'renderers.js')));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(page);
  });
  return new Promise((r) => server.listen(port, () => r(server)));
}

/* ----------------------------------------------------------------- assertions */

const failures = [];
const check = (ok, message) => {
  console.log(`  ${ok ? 'ok  ' : 'FAIL'}  ${message}`);
  if (!ok) failures.push(message);
};

/** For assertions that need a tool this machine may not have. */
const skip = (message) => console.log(`  skip  ${message}`);

/**
 * Reads a PDF's font table directly from its bytes.
 *
 * Enough to confirm the faces were embedded rather than referenced, which is the
 * difference between a report that renders anywhere and one that renders on the
 * machine it was made on.
 */
function inspectPdf(buffer) {
  const raw = buffer.toString('latin1');
  return {
    fonts: [...raw.matchAll(/\/BaseFont\s*\/([A-Za-z0-9+\-]+)/g)].map((m) => m[1]),
    embedded: raw.includes('/FontFile2'),
  };
}

/**
 * Extracts a PDF's readable text, via poppler when it is installed.
 *
 * Inflating the content streams by hand is not enough: the fonts are embedded with
 * Identity-H encoding, so a stream holds glyph indices rather than characters. A check
 * written against the raw stream reports every string as missing — which it did, and
 * which is worse than no check, because it accuses a working renderer.
 */
function pdfText(file) {
  try {
    return execFileSync('pdftotext', [file, '-'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return null;
  }
}

async function inspectPptx(file) {
  const { default: JSZip } = await import(path.join(ROOT, 'node_modules/jszip/dist/jszip.min.js'));
  const zip = await JSZip.loadAsync(await readFile(file));
  const names = Object.keys(zip.files);
  return {
    slides: names.filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n)).length,
    charts: names.filter((n) => /^ppt\/charts\/chart\d+\.xml$/.test(n)).length,
    workbooks: names.filter((n) => n.endsWith('.xlsx')).length,
    media: names.filter((n) => n.startsWith('ppt/media/') && !n.endsWith('/')),
  };
}

/* ---------------------------------------------------------------------- runs */

const browser = await chromium.launch(CHROME ? { executablePath: CHROME } : {});
const errors = [];

async function newPage() {
  const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1440, height: 1000 } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  return page;
}

/** Waits for a download the given action starts, and saves it. */
async function capture(page, filename, start) {
  const pending = page.waitForEvent('download', { timeout: 120000 });
  // Not awaited: the export can outlive the call frame, and awaiting it races the
  // download event with a garbage-collection error.
  Promise.resolve(start()).catch((e) => errors.push(`${filename}: ${e.message}`));
  const download = await pending;
  const dest = path.join(OUT, filename);
  await download.saveAs(dest);
  return dest;
}

console.log('\nend-to-end — exporting through the built application');
{
  const server = await serveDist(4178);
  const page = await newPage();
  await page.goto('http://localhost:4178/', { waitUntil: 'networkidle' });

  await page.locator('input[type="email"]').first().fill(ACCOUNT.email);
  await page.locator('input[type="password"]').first().fill(ACCOUNT.password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForTimeout(1200);

  await page.getByRole('button', { name: /^Reports/ }).first().click();
  await page.waitForTimeout(800);

  const preview = page.getByRole('button', { name: /preview|open|view/i }).first();
  if (await preview.count()) { await preview.click(); await page.waitForTimeout(700); }

  const pdf = await capture(page, 'report.pdf', () => page.getByRole('button', { name: /^PDF$/i }).first().click());
  await page.waitForTimeout(1200);
  const pptx = await capture(page, 'report.pptx', () => page.getByRole('button', { name: /^PowerPoint$/i }).first().click());

  const p = inspectPdf(await readFile(pdf));
  check(p.embedded, 'PDF embeds its font files');
  check(p.fonts.some((f) => /Grotesk/.test(f)), 'PDF carries the Space Grotesk display face');
  check(p.fonts.some((f) => /Poppins/.test(f)), 'PDF carries the Poppins body face');
  check(p.fonts.some((f) => /DejaVu/.test(f)), 'PDF carries the naira fallback face');

  const text = pdfText(pdf);
  if (text === null) skip('naira sign renders (install poppler-utils to check)');
  else check(text.includes('₦'), 'naira sign renders rather than being dropped');

  const d = await inspectPptx(pptx);
  check(d.slides > 1, `deck has ${d.slides} slides`);
  check(d.charts >= 2, `deck has ${d.charts} native charts`);
  check(d.workbooks >= d.charts, 'every chart carries its embedded worksheet');
  check(d.media.length === 0, 'deck contains no chart images — the charts are editable');

  await page.context().close();
  server.close();
}

console.log('\nprogramme report — exporting from a programme page');
{
  const server = await serveDist(4179);
  const page = await newPage();
  await page.goto('http://localhost:4179/', { waitUntil: 'networkidle' });

  await page.locator('input[type="email"]').first().fill(ACCOUNT.email);
  await page.locator('input[type="password"]').first().fill(ACCOUNT.password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForTimeout(1200);

  await page.getByRole('button', { name: /Project Portfolio/i }).first().click();
  await page.waitForTimeout(700);
  // Programme rows are clickable containers rather than buttons, so this matches on
  // the programme's name rather than on a role.
  await page.getByText('Teachers Empowerment (STEP)').first().click();
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: /Download project report/i }).first().click();
  await page.waitForTimeout(400);

  const pdf = await capture(page, 'programme.pdf', () => page.getByRole('button', { name: /^PDF$/i }).first().click());
  await page.waitForTimeout(1200);
  await page.getByRole('button', { name: /Download project report/i }).first().click().catch(() => {});
  await page.waitForTimeout(400);
  const pptx = await capture(page, 'programme.pptx', () => page.getByRole('button', { name: /^PowerPoint$/i }).first().click());

  const p = inspectPdf(await readFile(pdf));
  check(p.embedded, 'programme PDF embeds its font files');
  check(p.fonts.some((f) => /Grotesk/.test(f)), 'programme PDF is set in the designed faces');

  const text = pdfText(pdf);
  if (text === null) skip('programme PDF renders the naira sign (install poppler-utils to check)');
  else {
    // The exporter this replaced substituted "NGN " for every naira sign.
    check(!/NGN /.test(text), 'programme PDF no longer substitutes "NGN " for the naira sign');
  }

  const d = await inspectPptx(pptx);
  check(d.slides > 1, `programme deck has ${d.slides} slides`);
  check(d.media.length === 0, 'programme deck contains no images');

  await page.context().close();
  server.close();
}

console.log('\nblock coverage — every block type, both formats');
{
  const server = await serveRenderers(4187);
  const page = await newPage();
  await page.goto('http://localhost:4187/', { waitUntil: 'load' });

  const spec = JSON.parse(await readFile(path.join(HERE, 'verify-exports.spec.json'), 'utf8'));

  for (const [fn, name] of [['renderReportPdf', 'blocks.pdf'], ['renderReportPptx', 'blocks.pptx']]) {
    await capture(page, name, () =>
      page.evaluate(([f, s, n]) => window.__renderers[f](s, n), [fn, spec, name]));
    console.log(`  ok    rendered ${name}`);
  }

  const text = pdfText(path.join(OUT, 'blocks.pdf'));
  if (text === null) {
    skip('callout block renders (install poppler-utils to check)');
  } else {
    // Whitespace is stripped before matching: the label is letter-spaced, so poppler
    // extracts it as "B A S I S O F P R EP ARAT ION".
    check(/BASISOFPREPARATION/i.test(text.replace(/\s+/g, '')), 'callout block renders in the PDF');
    check(/no reach profile/i.test(text), 'callout carries the caveat text');
  }

  await page.context().close();
  server.close();
}

console.log(`\npage errors: ${errors.length ? errors.join('; ') : 'none'}`);
if (errors.length) failures.push('page errors were raised');

await browser.close();
console.log(`\noutput in ${OUT}`);
console.log(failures.length ? `\n${failures.length} check(s) failed.` : '\nAll checks passed.');
process.exit(failures.length ? 1 : 0);
