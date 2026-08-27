import { assignTaskHandler, listTasksHandler } from '../../server/handlers/tasks';
import { requireUser } from '../../server/lib/requireAuth';
import { getSessionUserId } from '../../server/lib/session';
import type { VercelRequest, VercelResponse } from '../../server/lib/vercel-types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    const author = await requireUser(getSessionUserId(req));
    const r = await assignTaskHandler((req.body as Record<string, unknown>) ?? {}, author);
    return res.status(r.status).json(r.body);
  }
  const r = await listTasksHandler();
  res.status(r.status).json(r.body);
}
