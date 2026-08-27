import { addApprovalCommentHandler } from '../../server/handlers/approvals';
import { requireUser } from '../../server/lib/requireAuth';
import { getSessionUserId } from '../../server/lib/session';
import type { VercelRequest, VercelResponse } from '../../server/lib/vercel-types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const author = await requireUser(getSessionUserId(req));
  const r = await addApprovalCommentHandler((req.body as Record<string, unknown>) ?? {}, author);
  res.status(r.status).json(r.body);
}
