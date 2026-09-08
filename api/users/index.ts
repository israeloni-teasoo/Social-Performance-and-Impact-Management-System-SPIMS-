import { guard } from '../../server/lib/guard';
import { createUserHandler, listUsersHandler } from '../../server/handlers/users';
import type { VercelRequest, VercelResponse } from '../../server/lib/vercel-types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { denial } = await guard(req, '/api/users');
  if (denial) return res.status(denial.status).json(denial.body);
  if (req.method === 'POST') {
    const r = await createUserHandler((req.body as Record<string, unknown>) ?? {});
    return res.status(r.status).json(r.body);
  }
  const r = await listUsersHandler();
  res.status(r.status).json(r.body);
}
