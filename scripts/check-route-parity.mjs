/**
 * Confirms every Express route has a matching serverless function, and vice versa.
 *
 *   node scripts/check-route-parity.mjs
 *
 * This exists because the failure it catches is silent and expensive. A route present
 * only in `server/app.ts` does not 404 on Vercel — the single-page application's
 * rewrite answers it with HTML, and `isApiAvailable()` reads HTML as "no API here" and
 * falls the whole interface back to bundled sample data. The deployment then looks
 * like it is working, on real-looking numbers, while writing nothing to the database.
 *
 * `/api/health` was exactly this: Express-only, so a monitor pointed at a Vercel
 * deployment would have recorded 200 and called it healthy.
 *
 * Exits non-zero on a mismatch so it can sit in a pipeline.
 */

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Routes the Express adapter registers. */
async function expressRoutes() {
  const source = await readFile(path.join(ROOT, 'server/app.ts'), 'utf8');
  return new Set([...source.matchAll(/app\.(?:get|post)\('(\/api\/[^']*)'/g)].map((m) => m[1]));
}

/** Routes the serverless adapter exposes, derived from the file tree. */
async function serverlessRoutes(dir = path.join(ROOT, 'api'), prefix = '/api') {
  const routes = new Set();
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      for (const nested of await serverlessRoutes(path.join(dir, entry.name), `${prefix}/${entry.name}`)) {
        routes.add(nested);
      }
      continue;
    }
    if (!entry.name.endsWith('.ts')) continue;
    const base = entry.name.replace(/\.ts$/, '');
    routes.add(base === 'index' ? prefix : `${prefix}/${base}`);
  }
  return routes;
}

const [express, serverless] = await Promise.all([expressRoutes(), serverlessRoutes()]);

const missingFunctions = [...express].filter((r) => !serverless.has(r)).sort();
const missingExpress = [...serverless].filter((r) => !express.has(r)).sort();

console.log(`Express routes:    ${express.size}`);
console.log(`Serverless routes: ${serverless.size}`);

if (missingFunctions.length > 0) {
  console.log('\nIn Express but with no serverless function — these answer with HTML on Vercel:');
  for (const route of missingFunctions) console.log(`  ${route}`);
}
if (missingExpress.length > 0) {
  console.log('\nHave a serverless function but no Express route — these 404 when self-hosted:');
  for (const route of missingExpress) console.log(`  ${route}`);
}

const failed = missingFunctions.length + missingExpress.length;
console.log(failed === 0 ? '\nBoth adapters expose the same routes.' : `\n${failed} route(s) exist in only one adapter.`);
process.exit(failed === 0 ? 0 : 1);
