import { prisma } from './db.js';

/**
 * Slows down password guessing at the sign-in route.
 *
 * Without it there is no limit at all: a public URL, a known email format and an
 * unlimited number of attempts. Nothing else in the system stands between a guessed
 * password and an Executive session.
 *
 * **Why the database.** The API runs as serverless functions, so consecutive requests
 * land in different instances and an in-process counter is reset roughly as fast as an
 * attacker can trigger it. A counter that resets under load is worse than none, because
 * it reads as protection.
 *
 * **Two keys, deliberately different.** The address being tried is counted, and so is
 * the address trying. Counting only the email lets somebody lock a colleague out of
 * their own account before a board meeting by typing their address wrong five times;
 * counting only the IP lets a spread-out attempt walk through every account. So the
 * account lock is short and the address lock is long: an attacker is stopped for a
 * quarter of an hour, while someone whose account was locked maliciously waits five
 * minutes. Neither reveals whether the account exists — the message is the same either
 * way, and the count is kept against whatever was typed.
 */

const WINDOW_MS = 15 * 60 * 1000;
/** Attempts allowed from one address before it is turned away. */
const IP_THRESHOLD = 10;
const IP_LOCK_MS = 15 * 60 * 1000;
/** Attempts allowed against one email address before it is turned away. */
const EMAIL_THRESHOLD = 5;
const EMAIL_LOCK_MS = 5 * 60 * 1000;
/** Rows older than this are of no further use. */
const FORGET_AFTER_MS = 24 * 60 * 60 * 1000;

export interface ThrottleVerdict {
  locked: boolean;
  /** Whole minutes to wait, rounded up, for the message. */
  retryAfterMinutes: number;
}

const NOT_LOCKED: ThrottleVerdict = { locked: false, retryAfterMinutes: 0 };

function keysFor(email: string, clientIp: string | null): string[] {
  const keys = [`email:${email.trim().toLowerCase()}`];
  if (clientIp) keys.push(`ip:${clientIp}`);
  return keys;
}

function limitsFor(key: string): { threshold: number; lockMs: number } {
  return key.startsWith('ip:')
    ? { threshold: IP_THRESHOLD, lockMs: IP_LOCK_MS }
    : { threshold: EMAIL_THRESHOLD, lockMs: EMAIL_LOCK_MS };
}

/**
 * Whether this attempt should be refused before the password is even checked.
 *
 * Checked before `comparePassword`, so a locked-out caller cannot keep the database
 * busy hashing: bcrypt is deliberately slow, which makes the sign-in route the most
 * expensive one to call repeatedly.
 */
export async function checkSignInThrottle(email: string, clientIp: string | null): Promise<ThrottleVerdict> {
  const rows = await prisma.signInAttempt.findMany({ where: { key: { in: keysFor(email, clientIp) } } });
  const now = Date.now();
  let until = 0;
  for (const row of rows) {
    const lockedUntil = row.lockedUntil?.getTime() ?? 0;
    if (lockedUntil > now) until = Math.max(until, lockedUntil);
  }
  if (until === 0) return NOT_LOCKED;
  return { locked: true, retryAfterMinutes: Math.max(1, Math.ceil((until - now) / 60_000)) };
}

/** Counts a failed attempt against both keys, locking whichever passes its threshold. */
export async function recordSignInFailure(email: string, clientIp: string | null): Promise<void> {
  const now = new Date();
  for (const key of keysFor(email, clientIp)) {
    const { threshold, lockMs } = limitsFor(key);
    const existing = await prisma.signInAttempt.findUnique({ where: { key } });

    // A run of failures that started outside the window is history, not evidence.
    const stale = existing !== null && now.getTime() - existing.firstFailAt.getTime() > WINDOW_MS;
    const failures = existing === null || stale ? 1 : existing.failures + 1;
    const firstFailAt = existing === null || stale ? now : existing.firstFailAt;
    const lockedUntil = failures >= threshold ? new Date(now.getTime() + lockMs) : null;

    await prisma.signInAttempt.upsert({
      where: { key },
      create: { key, failures, firstFailAt, lockedUntil },
      update: { failures, firstFailAt, lockedUntil },
    });
  }

  // Cheap housekeeping on the only path that creates rows, so the table cannot grow
  // without bound on a deployment nobody prunes.
  await prisma.signInAttempt
    .deleteMany({ where: { updatedAt: { lt: new Date(now.getTime() - FORGET_AFTER_MS) } } })
    .catch(() => undefined);
}

/** Clears the counters after a successful sign-in. */
export async function clearSignInFailures(email: string, clientIp: string | null): Promise<void> {
  await prisma.signInAttempt.deleteMany({ where: { key: { in: keysFor(email, clientIp) } } });
}

export const SIGN_IN_THROTTLE_LIMITS = { WINDOW_MS, IP_THRESHOLD, IP_LOCK_MS, EMAIL_THRESHOLD, EMAIL_LOCK_MS };
