import { guard } from '../../../server/lib/guard';
import { deleteMentionSourceHandler } from '../../../server/handlers/mentions';
import type { VercelRequest, VercelResponse } from '../../../server/lib/vercel-types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { denial } = await guard(req, '/api/mentions/sources/delete');
  if (denial) return res.status(denial.status).json(denial.body);
  const r = await deleteMentionSourceHandler((req.body as Record<string, unknown>) ?? {});
  res.status(r.status).json(r.body);
}
