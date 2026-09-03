import { guard } from '../server/lib/guard';
import { bulkUploadHandler } from '../server/handlers/bulkUpload';
import { requireUser } from '../server/lib/requireAuth';
import { getSessionUserId } from '../server/lib/session';
import type { VercelRequest, VercelResponse } from '../server/lib/vercel-types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { user, denial } = await guard(req, '/api/bulk-upload');
  if (denial) return res.status(denial.status).json(denial.body);
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const uploadedBy = await requireUser(getSessionUserId(req));
  const r = await bulkUploadHandler((req.body as Record<string, unknown>) ?? {}, uploadedBy);
  res.status(r.status).json(r.body);
}
