import { checkCronAuth } from '../../server/lib/cronAuth';
import { runMentionIngestionHandler } from '../../server/handlers/mentions';
import type { VercelRequest, VercelResponse } from '../../server/lib/vercel-types';

/**
 * Scheduled media collection, triggered by the cron entry in vercel.json.
 *
 * Deliberately not behind the session guard — a scheduler has no session — so it
 * carries its own authentication and refuses everything when no secret is configured.
 * See server/lib/cronAuth.ts.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = checkCronAuth(req.headers.authorization);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  const r = await runMentionIngestionHandler();
  // A run with no sources configured answers 400, which would make the schedule look
  // broken in the platform's logs. Nothing to collect is not a failure of the job.
  if (r.status === 400) return res.status(200).json({ skipped: true, ...(r.body as object) });
  res.status(r.status).json(r.body);
}
