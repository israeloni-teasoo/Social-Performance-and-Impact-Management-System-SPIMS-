/**
 * Confirms the API is still exposed to Vercel as a single catch-all function.
 *
 *   node scripts/check-api-surface.mjs
 *
 * Vercel turns every file under `api/` into its own function, so adding one wrapper per
 * route has two costs, and both bite quietly.
 *
 * The loud one is a ceiling: the Hobby plan rejects a deployment carrying more than
 * twelve functions, and this project has 41 routes. The quiet one is drift. A route
 * present in `server/app.ts` but missing from `api/` does not 404 on Vercel — the
 * single-page application answers it with HTML, and `isApiAvailable()` reads HTML as
 * "no API here", so the interface falls back to bundled sample data and looks like it is
 * working while writing nothing to the database. `/api/health` was exactly that:
 * Express-only, so a monitor would have recorded 200 and called a broken deployment
 * healthy.
 *
 * One catch-all delegating to the Express app removes both. This script guards that
 * arrangement, because restoring a per-route file is an easy and plausible thing for
 * someone to do, and nothing else would complain until a deployment failed or a
 * deployment lied.
 *
 * Exits non-zero on a breach so it can sit in a pipeline.
 */

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CATCH_ALL = '[...path].ts';

/** Vercel's per-deployment function ceiling on the Hobby plan. */
const HOBBY_FUNCTION_LIMIT = 12;

/** Every file Vercel would treat as a function, relative to `api/`. */
async function functionFiles(dir = path.join(ROOT, 'api'), prefix = '') {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      found.push(...(await functionFiles(path.join(dir, entry.name), rel)));
    } else if (/\.(ts|js|mjs)$/.test(entry.name)) {
      found.push(rel);
    }
  }
  return found;
}

/** Routes the Express adapter registers — the surface the catch-all therefore serves. */
async function expressRoutes() {
  const source = await readFile(path.join(ROOT, 'server/app.ts'), 'utf8');
  return new Set([...source.matchAll(/app\.(?:get|post)\('(\/api\/[^']*)'/g)].map((m) => m[1]));
}

const [files, routes] = await Promise.all([functionFiles(), expressRoutes()]);
const problems = [];

const strays = files.filter((f) => f !== CATCH_ALL).sort();
if (!files.includes(CATCH_ALL)) {
  problems.push(`api/${CATCH_ALL} is missing — nothing would serve /api on Vercel.`);
}
if (strays.length > 0) {
  problems.push(
    `${strays.length} per-route function file(s) are back under api/. Each is a separate ` +
      `Vercel function, and each shadows the catch-all for its path:\n` +
      strays.map((s) => `    api/${s}`).join('\n'),
  );
}
if (files.length > HOBBY_FUNCTION_LIMIT) {
  problems.push(`${files.length} function files exceed the Hobby plan's ceiling of ${HOBBY_FUNCTION_LIMIT}.`);
}

if (files.includes(CATCH_ALL)) {
  const source = await readFile(path.join(ROOT, 'api', CATCH_ALL), 'utf8');
  if (!/from '\.\.\/server\/app'/.test(source)) {
    problems.push(`api/${CATCH_ALL} no longer delegates to server/app.ts, so the two adapters can diverge again.`);
  }
}

console.log(`Vercel functions:  ${files.length} (ceiling ${HOBBY_FUNCTION_LIMIT} on Hobby)`);
console.log(`Express routes:    ${routes.size} (all served through the catch-all)`);

if (problems.length === 0) {
  console.log('\nThe API is exposed as one catch-all over a single route table.');
  process.exit(0);
}

for (const problem of problems) console.log(`\n  ${problem}`);
console.log(`\n${problems.length} problem(s) with the API surface.`);
process.exit(1);
