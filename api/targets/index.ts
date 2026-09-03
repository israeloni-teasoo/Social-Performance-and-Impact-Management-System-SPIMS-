import { guard } from '../../server/lib/guard';
import { createTargetHandler, listTargetsHandler } from '../../server/handlers/targets';
import type { VercelRequest, VercelResponse } from '../../server/lib/vercel-types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { user, denial } = await guard(req, '/api/targets');
  if (denial) return res.status(denial.status).json(denial.body);
  if (req.method === 'POST') {
    const r = await createTargetHandler((req.body as Record<string, unknown>) ?? {});
    return res.status(r.status).json(r.body);
  }
  const r = await listTargetsHandler();
  res.status(r.status).json(r.body);
}
