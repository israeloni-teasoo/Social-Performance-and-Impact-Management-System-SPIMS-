import { timingSafeEqual } from 'node:crypto';

/**
 * Authenticates a scheduled request.
 *
 * A cron trigger carries no session cookie, so the guard that protects every other
 * route cannot protect this one — it has to authenticate a caller that is not a
 * person. Vercel sends `Authorization: Bearer $CRON_SECRET` when that variable is set
 * on the project.
 *
 * Two decisions worth stating, because both are the kind that get "simplified" later:
 *
 *   1. **It fails closed.** With `CRON_SECRET` unset, every request is refused. The
 *      tempting alternative — allow the call when no secret is configured — would mean
 *      a deployment that forgot to set it exposes an unauthenticated endpoint that
 *      makes outbound network requests. Scheduled collection being off until somebody
 *      sets a secret is the safe end of that trade.
 *   2. **The comparison is constant-time.** A plain `===` on a secret leaks its length
 *      and prefix to anyone willing to measure, which is cheap against an endpoint
 *      that can be called repeatedly.
 */
export type CronAuthResult = { ok: true } | { ok: false; status: 401 | 503; error: string };

function constantTimeEquals(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  // timingSafeEqual throws on a length mismatch, which would itself be a timing
  // signal, so the lengths are compared first and the result folded in.
  if (left.length !== right.length) {
    // Still compare something of equal length, so the work done does not depend on
    // whether the length happened to match.
    timingSafeEqual(left, left);
    return false;
  }
  return timingSafeEqual(left, right);
}

export function checkCronAuth(authorization: string | string[] | undefined): CronAuthResult {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return {
      ok: false,
      status: 503,
      error: 'Scheduled collection is not configured. Set CRON_SECRET to enable it.',
    };
  }

  const header = Array.isArray(authorization) ? authorization[0] : authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token || !constantTimeEquals(token, secret)) {
    return { ok: false, status: 401, error: 'Not authorised.' };
  }
  return { ok: true };
}
