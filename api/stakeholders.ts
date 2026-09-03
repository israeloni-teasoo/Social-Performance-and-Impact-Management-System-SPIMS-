import { guard } from '../server/lib/guard';
import { createStakeholderHandler, listStakeholdersHandler } from '../server/handlers/stakeholders';
import type { VercelRequest, VercelResponse } from '../server/lib/vercel-types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { user, denial } = await guard(req, '/api/stakeholders');
  if (denial) return res.status(denial.status).json(denial.body);
  if (req.method === 'POST') {
    const r = await createStakeholderHandler((req.body as Record<string, unknown>) ?? {});
    return res.status(r.status).json(r.body);
  }
  const r = await listStakeholdersHandler();
  res.status(r.status).json(r.body);
}
