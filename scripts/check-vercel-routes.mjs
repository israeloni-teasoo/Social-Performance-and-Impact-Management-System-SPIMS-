/**
 * Verifies that every API route actually reaches the function once Vercel has built it.
 *
 *   npm run check:vercel
 *
 * This exists because reasoning about Vercel's routing was not good enough, twice. The
 * API was first exposed as `api/[...path].ts`, on the assumption that a `[...]` filename
 * means a catch-all. It does not — that is a Next.js convention. Vercel's own route
 * generator turns any `[segment]` under `api/` into `([^/]+)`, which matches exactly one
 * path segment, so the build produced:
 *
 *     { "src": "^/api/([^/]+)$", "dest": "/api/[...path]?...path=$1" }
 *     { "src": "^/api(/.*)?$",   "status": 404 }
 *
 * `/api/health` worked. `/api/auth/me` fell through to a 404 that Vercel answers with an
 * HTML error page, which the frontend reads as "no API here" — so the whole interface
 * dropped into demo data and told people there was no server. Nothing in the type
 * checker, the linter, the unit tests or the local Express server could see it, because
 * locally Express does the routing and Express was never the problem.
 *
 * `vercel build` runs offline and writes the real production routing table to
 * `.vercel/output/config.json`. This script builds, then replays that table against
 * every route in `server/app.ts` the way the platform would, and fails if any of them
 * does not end at the function.
 *
 * It is not part of the normal loop — it takes a minute and downloads the Vercel CLI.
 * Run it before deploying, and after any change to `vercel.json` or to `api/`.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT = path.join(ROOT, '.vercel/output/config.json');

/** Routes the Express adapter registers — the paths that must all reach the function. */
function expressRoutes() {
  const source = readFileSync(path.join(ROOT, 'server/app.ts'), 'utf8');
  return [...new Set([...source.matchAll(/^(?:get|post)\('(\/api\/[^']*)'/gm)].map((m) => m[1]))].sort();
}

/**
 * `vercel build` needs a linked project on disk. It never contacts the API for a local
 * build, so a placeholder is enough and is thrown away with the rest of `.vercel/`.
 */
function ensureProjectLink() {
  const dir = path.join(ROOT, '.vercel');
  const file = path.join(dir, 'project.json');
  if (existsSync(file)) return;
  mkdirSync(dir, { recursive: true });
  writeFileSync(file, JSON.stringify({ projectId: 'prj_local_check', orgId: 'team_local_check', settings: {} }));
}

function build() {
  ensureProjectLink();
  console.log('Building with the Vercel CLI (this takes a minute)…\n');
  execFileSync('npx', ['--yes', 'vercel@latest', 'build', '--prod'], {
    cwd: ROOT,
    stdio: ['ignore', 'ignore', 'inherit'],
  });
}

/**
 * Replays the generated routing table against one path, the way the platform does:
 * in order, first match wins, and `dest` decides where the request ends up.
 *
 * The `filesystem`, `miss` and `error` markers split the table into phases. Only the
 * phase before `handle: miss` matters here — nothing under `/api` is a static file, so
 * a request that has not been sent to the function by the end of it never will be.
 */
function resolve(routes, requestPath) {
  for (const route of routes) {
    if (route.handle) {
      if (route.handle === 'filesystem') continue;
      break;
    }
    if (!route.src) continue;
    if (!new RegExp(route.src).test(requestPath)) continue;
    if (route.status && !route.dest) return { outcome: `status ${route.status}`, route };
    if (route.dest) return { outcome: route.dest, route };
  }
  return { outcome: 'no match', route: null };
}

build();

if (!existsSync(OUTPUT)) {
  console.error(`No build output at ${OUTPUT}. The build did not complete.`);
  process.exit(1);
}

const { routes } = JSON.parse(readFileSync(OUTPUT, 'utf8'));
const paths = expressRoutes();

let failures = 0;
for (const p of paths) {
  const { outcome } = resolve(routes, p);
  // Every path must land on the single function, whatever query the rewrite adds.
  const ok = outcome.startsWith('/api/index');
  if (!ok) failures += 1;
  if (!ok || process.env.VERBOSE) console.log(`${ok ? 'ok  ' : 'FAIL'} ${p.padEnd(38)} -> ${outcome}`);
}

console.log(`\n${paths.length} Express route(s) checked against the built routing table.`);

if (failures > 0) {
  console.log(
    `${failures} do not reach the function. On Vercel they answer with an HTML error page,\n` +
      'which the frontend reads as "no API here" — the interface will silently show demo data.',
  );
  process.exit(1);
}

console.log('Every route reaches the function.');
