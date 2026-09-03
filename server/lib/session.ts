import * as cookie from 'cookie';
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, verifySession } from './auth';

interface CookieCarrier {
  headers: { cookie?: string | string[] };
}

interface CookieSetter {
  setHeader(name: string, value: string | string[]): void;
}

/**
 * A Secure cookie is never sent over plain HTTP, so an internal self-hosted
 * deployment served on http:// would accept the login and then silently drop the
 * session on the next request. Defaults to on in production — the correct default,
 * since sessions belong over TLS — but stays explicitly overridable for an
 * internal-HTTP install rather than failing in a way that looks like a bad password.
 */
function secureCookie(): boolean {
  const explicit = process.env.SESSION_COOKIE_SECURE;
  if (explicit !== undefined) return explicit === 'true';
  return process.env.NODE_ENV === 'production';
}

export function getSessionUserId(req: CookieCarrier): string | null {
  const raw = req.headers.cookie;
  if (!raw) return null;
  const header = Array.isArray(raw) ? raw.join('; ') : raw;
  const parsed = cookie.parse(header);
  const token = parsed[SESSION_COOKIE];
  if (!token) return null;
  return verifySession(token)?.userId ?? null;
}

export function setSessionCookie(res: CookieSetter, token: string) {
  res.setHeader(
    'Set-Cookie',
    cookie.serialize(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
      secure: secureCookie(),
    }),
  );
}

export function clearSessionCookie(res: CookieSetter) {
  res.setHeader(
    'Set-Cookie',
    cookie.serialize(SESSION_COOKIE, '', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
      secure: secureCookie(),
    }),
  );
}
