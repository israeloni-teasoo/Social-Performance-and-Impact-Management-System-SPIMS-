import { guard } from '../../server/lib/guard';
import { getIntegrationStatusHandler } from '../../server/handlers/settings';
import type { VercelRequest, VercelResponse } from '../../server/lib/vercel-types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { denial } = await guard(req, '/api/settings/status');
  if (denial) return res.status(denial.status).json(denial.body);
  const r = await getIntegrationStatusHandler();
  res.status(r.status).json(r.body);
}
