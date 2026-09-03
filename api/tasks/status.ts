import { guard } from '../../server/lib/guard';
import { setTaskStatusHandler } from '../../server/handlers/tasks';
import type { VercelRequest, VercelResponse } from '../../server/lib/vercel-types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { user, denial } = await guard(req, '/api/tasks/status');
  if (denial) return res.status(denial.status).json(denial.body);
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const r = await setTaskStatusHandler((req.body as Record<string, unknown>) ?? {});
  res.status(r.status).json(r.body);
}
