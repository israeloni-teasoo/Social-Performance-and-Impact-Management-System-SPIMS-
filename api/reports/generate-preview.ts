import { generateReportPreviewHandler } from '../../server/handlers/reportPreview';
import { requireUser } from '../../server/lib/requireAuth';
import { getSessionUserId } from '../../server/lib/session';
import type { VercelRequest, VercelResponse } from '../../server/lib/vercel-types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const user = await requireUser(getSessionUserId(req));
  const r = await generateReportPreviewHandler((req.body as Record<string, unknown>) ?? {}, user);
  res.status(r.status).json(r.body);
}
