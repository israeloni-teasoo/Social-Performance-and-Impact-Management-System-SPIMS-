import { guard } from '../server/lib/guard';
import { addReportCommentHandler, listReportCommentsHandler } from '../server/handlers/reportComments';
import type { VercelRequest, VercelResponse } from '../server/lib/vercel-types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { user, denial } = await guard(req, '/api/report-comments');
  if (denial) return res.status(denial.status).json(denial.body);
  if (req.method === 'POST') {
    const r = await addReportCommentHandler((req.body as Record<string, unknown>) ?? {}, user);
    return res.status(r.status).json(r.body);
  }
  const r = await listReportCommentsHandler();
  res.status(r.status).json(r.body);
}
