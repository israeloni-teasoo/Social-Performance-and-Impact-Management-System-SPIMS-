import { addReportCommentHandler, listReportCommentsHandler } from '../server/handlers/reportComments';
import { requireUser } from '../server/lib/requireAuth';
import { getSessionUserId } from '../server/lib/session';
import type { VercelRequest, VercelResponse } from '../server/lib/vercel-types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    const author = await requireUser(getSessionUserId(req));
    const r = await addReportCommentHandler((req.body as Record<string, unknown>) ?? {}, author);
    return res.status(r.status).json(r.body);
  }
  const r = await listReportCommentsHandler();
  res.status(r.status).json(r.body);
}
