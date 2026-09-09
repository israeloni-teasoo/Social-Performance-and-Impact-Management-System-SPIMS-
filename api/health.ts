import { prisma } from '../server/lib/db';
import type { VercelRequest, VercelResponse } from '../server/lib/vercel-types';

/**
 * Liveness check. Public by design — it carries no data beyond whether the database
 * answers, and a check that needs a session is no use to a monitor.
 *
 * It existed only in the Express adapter, so a Vercel deployment answered it with the
 * single-page application's HTML instead: a monitor would have recorded 200 and called
 * a broken deployment healthy.
 */
export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ok', database: 'connected' });
  } catch {
    res.status(503).json({ status: 'degraded', database: 'unreachable' });
  }
}
