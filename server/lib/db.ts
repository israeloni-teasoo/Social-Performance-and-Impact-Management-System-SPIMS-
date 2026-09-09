import { PrismaClient } from '@prisma/client';

/**
 * The Prisma client, reused across invocations.
 *
 * The cache is deliberately *not* limited to development. It is usually written that
 * way to stop a dev server's hot reload stacking up clients, and production is left
 * out because a long-running server only ever constructs one. That reasoning does not
 * hold on serverless: a warm function container is reused across invocations, so a
 * fresh `new PrismaClient()` each time leaves the previous one's connection pool
 * behind. The failure is not local — it is the database running out of connections
 * once traffic arrives, which looks like an outage rather than like a bug here.
 *
 * Caching on `globalThis` covers both shapes: one client per container on serverless,
 * one client per process when self-hosted, and no stacking under hot reload.
 *
 * Serverless also needs a *pooled* connection string. Point `DATABASE_URL` at the
 * provider's pooler (Supabase's port 6543, or Neon's `-pooler` host) with
 * `?pgbouncer=true&connection_limit=1`; `DIRECT_URL` stays on the direct port for
 * migrations, which cannot run through a transaction pooler. See docs/DEPLOY-VERCEL.md.
 */

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma = globalThis.__prisma ?? new PrismaClient();

globalThis.__prisma = prisma;
