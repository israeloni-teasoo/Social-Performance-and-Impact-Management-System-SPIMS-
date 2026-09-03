import { guard } from '../server/lib/guard';
import { listReportsHandler } from '../server/handlers/content';
import type { VercelRequest, VercelResponse } from '../server/lib/vercel-types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { user, denial } = await guard(req, '/api/reports');
  if (denial) return res.status(denial.status).json(denial.body);
  const r = await listReportsHandler();
  res.status(r.status).json(r.body);
}
