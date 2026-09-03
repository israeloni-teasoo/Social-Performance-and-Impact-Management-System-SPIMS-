import { guard } from '../../server/lib/guard';
import { assignTaskHandler, listTasksHandler } from '../../server/handlers/tasks';
import type { VercelRequest, VercelResponse } from '../../server/lib/vercel-types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { user, denial } = await guard(req, '/api/tasks');
  if (denial) return res.status(denial.status).json(denial.body);
  if (req.method === 'POST') {
    const r = await assignTaskHandler((req.body as Record<string, unknown>) ?? {}, user);
    return res.status(r.status).json(r.body);
  }
  const r = await listTasksHandler();
  res.status(r.status).json(r.body);
}
