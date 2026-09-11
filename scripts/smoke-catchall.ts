/**
 * Exercises api/[...path].ts the way Vercel's Node runtime actually does.
 *
 * The runtime's launcher wraps the module's default export like this
 * (@vercel/node, serverless-handler):
 *
 *   if (options.shouldAddHelpers && typeof listener.listen !== 'function') {
 *     await addHelpers(req, res);
 *   }
 *   return listener(req, res);
 *
 * An Express app is a function carrying a `.listen` method, so the helpers — including
 * the lazy `req.body` getter that would otherwise race express.json() — are not
 * installed at all. This harness reproduces that branch rather than assuming it.
 */
import http from 'node:http';
import handler from '../api/index';

const listener = handler as unknown as ((q: unknown, s: unknown) => void) & { listen?: unknown };

const helpersWouldBeAdded = typeof listener.listen !== 'function';
console.log(
  helpersWouldBeAdded
    ? '!! Vercel would inject req.body/req.query helpers over this export'
    : 'ok   export carries .listen, so Vercel skips helper injection\n',
);

const server = http.createServer((req, res) => listener(req, res));

interface Case {
  name: string;
  method: string;
  path: string;
  headers?: Record<string, string>;
  body?: string;
  expect: number;
}

const cases: Case[] = [
  { name: 'health (public)', method: 'GET', path: '/api/health', expect: 200 },
  { name: 'projects, no session', method: 'GET', path: '/api/projects', expect: 401 },
  {
    name: 'cron, wrong bearer',
    method: 'GET',
    path: '/api/cron/collect-mentions',
    headers: { authorization: 'Bearer wrong' },
    expect: 401,
  },
  {
    // The scheduler carries no session, so this route authenticates itself and must
    // stay reachable through the catch-all without the /api session guard eating it.
    name: 'cron, right bearer',
    method: 'GET',
    path: '/api/cron/collect-mentions',
    headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
    expect: 200,
  },
  { name: 'nested path, no session', method: 'GET', path: '/api/mentions/sources', expect: 401 },
  {
    name: 'login, JSON body read',
    method: 'POST',
    path: '/api/auth/login',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'nobody@example.com', password: 'wrong' }),
    expect: 401,
  },
  // The guard sits ahead of the route table, so an unknown path is refused for want of
  // a session rather than 404-ing — an anonymous caller learns nothing about what exists.
  { name: 'unknown route', method: 'GET', path: '/api/not-a-route', expect: 401 },

  // The shape Vercel's rewrite actually delivers. `vercel.json` sends every /api path to
  // this one function as `/api/index?__path=<the original path>`, so if the middleware
  // that puts the path back ever breaks, every nested route 404s in production while
  // looking fine locally. That is the failure this pair of cases exists to catch.
  { name: 'rewritten: health', method: 'GET', path: '/api/index?__path=health', expect: 200 },
  { name: 'rewritten: nested', method: 'GET', path: '/api/index?__path=auth/me', expect: 401 },
  {
    name: 'rewritten: keeps query',
    method: 'GET',
    path: '/api/index?__path=mentions&status=pending',
    expect: 401,
  },
];

server.listen(0, async () => {
  const port = (server.address() as { port: number }).port;
  let failures = 0;

  for (const c of cases) {
    const res = await fetch(`http://127.0.0.1:${port}${c.path}`, {
      method: c.method,
      headers: c.headers,
      body: c.body,
    });
    const text = await res.text();
    const ok = res.status === c.expect;
    if (!ok) failures++;
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${c.name.padEnd(24)} ${res.status} (want ${c.expect})  ${text.slice(0, 80)}`);
  }

  console.log(failures === 0 ? '\nAll catch-all routes behaved.' : `\n${failures} case(s) failed.`);
  server.close();
  process.exit(failures === 0 || helpersWouldBeAdded ? (failures === 0 ? 0 : 1) : 1);
});
