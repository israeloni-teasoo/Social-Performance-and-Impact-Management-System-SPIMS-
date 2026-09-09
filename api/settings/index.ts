import { guard } from '../../server/lib/guard';
import { getSettingsHandler, updateSettingsHandler } from '../../server/handlers/settings';
import type { VercelRequest, VercelResponse } from '../../server/lib/vercel-types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { denial } = await guard(req, '/api/settings');
  if (denial) return res.status(denial.status).json(denial.body);
  if (req.method === 'POST') {
    const r = await updateSettingsHandler((req.body as Record<string, unknown>) ?? {});
    return res.status(r.status).json(r.body);
  }
  const r = await getSettingsHandler();
  res.status(r.status).json(r.body);
}
