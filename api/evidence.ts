import { guard } from '../server/lib/guard';
import { listEvidenceHandler } from '../server/handlers/content';
import type { VercelRequest, VercelResponse } from '../server/lib/vercel-types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { user, denial } = await guard(req, '/api/evidence');
  if (denial) return res.status(denial.status).json(denial.body);
  const r = await listEvidenceHandler();
  res.status(r.status).json(r.body);
}
