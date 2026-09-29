/**
 * One-off codemod: add the `.js` extension to relative imports in the server code.
 *
 *   node scripts/add-esm-extensions.mjs [--check]
 *
 * The server is ESM (`"type": "module"`), and ESM requires the file extension on a
 * relative import. TypeScript with `moduleResolution: "Bundler"` does not, and `tsx`
 * resolves them happily, so extensionless imports ran locally for months — and produced
 * a Vercel function that died on its first import with ERR_MODULE_NOT_FOUND, which the
 * platform reports as FUNCTION_INVOCATION_FAILED and the frontend reads as "no API".
 *
 * `./thing.js` pointing at `thing.ts` is the normal ESM-TypeScript spelling: the
 * extension names the *emitted* file, which is what Node will look for.
 *
 * Kept in the repository with a `--check` mode so the rule is enforced rather than
 * remembered; `npm run check:esm` runs it.
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK_ONLY = process.argv.includes('--check');

/** Everything that ends up inside the serverless function bundle. */
const ROOTS = ['server', 'api', 'prisma'];

/** Files outside those trees that the server imports, and which therefore ship with it. */
const EXTRA_FILES = ['frontend/src/data/uploadTemplates.ts', 'frontend/src/data/vocabulary.ts'];

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (/\.ts$/.test(entry.name)) out.push(full);
  }
  return out;
}

const files = [];
for (const r of ROOTS) files.push(...(await walk(path.join(ROOT, r))));
for (const f of EXTRA_FILES) files.push(path.join(ROOT, f));

// from './x' / from "../y" — and the same inside `import type` and `export … from`.
const RELATIVE = /(\bfrom\s+['"])(\.[^'"]*?)(['"])/g;

let changed = 0;
const offenders = [];

for (const file of files) {
  const source = await readFile(file, 'utf8');
  const next = source.replace(RELATIVE, (whole, prefix, spec, suffix) => {
    // Already explicit, or a directory/asset import we should not guess at.
    if (/\.(js|json|css|svg|png|woff2?)$/.test(spec)) return whole;
    return `${prefix}${spec}.js${suffix}`;
  });

  if (next !== source) {
    offenders.push(path.relative(ROOT, file));
    changed += 1;
    if (!CHECK_ONLY) await writeFile(file, next);
  }
}

if (CHECK_ONLY) {
  if (changed === 0) {
    console.log(`Relative imports carry their .js extension in all ${files.length} server-side files.`);
    process.exit(0);
  }
  console.log(`${changed} file(s) have extensionless relative imports. On Vercel these crash the function at import:\n`);
  for (const f of offenders) console.log(`  ${f}`);
  console.log('\nRun: node scripts/add-esm-extensions.mjs\n');
  process.exit(1);
}

console.log(`Added .js to relative imports in ${changed} file(s) of ${files.length}.`);
