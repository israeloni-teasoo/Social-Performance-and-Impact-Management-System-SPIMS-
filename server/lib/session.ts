import * as cookie from 'cookie';
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, verifySession } from './auth';

interface CookieCarrier {
  headers: { cookie?: string | string[] };
}

interface CookieSetter {
  setHeader(name: string, value: string | string[]): void;
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
      secure: process.env.NODE_ENV === 'production',
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
      secure: process.env.NODE_ENV === 'production',
    }),
  );
}
