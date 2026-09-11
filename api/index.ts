import express from 'express';
import { app } from '../server/app';

/**
 * The whole API, as a single Vercel function.
 *
 * Vercel turns every file under `api/` into its own function, and this project has 48
 * routes — over the Hobby plan's twelve-function ceiling, and two route tables to keep
 * in step. One function over one Express app avoids both.
 *
 * **Why this is `index.ts` and not a catch-all filename.** It was `api/[...path].ts`
 * first, which does not work: Vercel's route generator treats any `[segment]` under
 * `api/` as exactly one path segment, with no special handling for the `...` spread —
 * that is a Next.js convention, not a Vercel one. The generated route was
 *
 *     { "src": "^/api/([^/]+)$", "dest": "/api/[...path]?...path=$1" }
 *     { "src": "^/api(/.*)?$",   "status": 404 }
 *
 * so `/api/health` reached the function and `/api/auth/me` fell through to a 404 that
 * Vercel answers with an HTML error page. `isApiAvailable()` reads HTML as "no API
 * here", so the whole interface dropped into demo mode and every action reported that
 * there was no server. The routing is now an explicit rewrite in `vercel.json`, which
 * is the documented way to put one Express app behind every `/api` path.
 *
 * The rewrite carries the original path in `__path`, and the middleware below puts it
 * back on the request. Whether Vercel hands a rewritten function the original URL or
 * the destination URL is an implementation detail that is not worth depending on:
 * reconstructing from `__path` is correct under either, and costs one small middleware.
 *
 * Express is mounted directly rather than wrapped in a bare `(req, res)` handler
 * because Vercel's launcher skips its request helpers — including a lazy `req.body`
 * that would race `express.json()` — when the default export has a `.listen` method.
 * An Express instance has one; a plain function does not.
 */
const handler = express();

handler.use((req, _res, next) => {
  const raw = req.url ?? '/';
  const queryAt = raw.indexOf('?');
  if (queryAt !== -1) {
    const params = new URLSearchParams(raw.slice(queryAt + 1));
    const forwarded = params.get('__path');
    if (forwarded !== null) {
      params.delete('__path');
      const rest = params.toString();
      req.url = `/api/${forwarded}${rest ? `?${rest}` : ''}`;
    }
  }
  next();
});

handler.use(app);

export default handler;
