import { guard } from '../../server/lib/guard';
import { reviewMentionHandler } from '../../server/handlers/mentions';
import type { VercelRequest, VercelResponse } from '../../server/lib/vercel-types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { user, denial } = await guard(req, '/api/mentions/review');
  if (denial) return res.status(denial.status).json(denial.body);
  const r = await reviewMentionHandler((req.body as Record<string, unknown>) ?? {}, user);
  res.status(r.status).json(r.body);
}
