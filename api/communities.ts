import { guard } from '../server/lib/guard';
import { listCommunitiesHandler } from '../server/handlers/content';
import type { VercelRequest, VercelResponse } from '../server/lib/vercel-types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { user, denial } = await guard(req, '/api/communities');
  if (denial) return res.status(denial.status).json(denial.body);
  const r = await listCommunitiesHandler();
  res.status(r.status).json(r.body);
}
