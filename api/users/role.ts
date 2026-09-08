import { guard } from '../../server/lib/guard';
import { setUserRoleHandler } from '../../server/handlers/users';
import type { VercelRequest, VercelResponse } from '../../server/lib/vercel-types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { user, denial } = await guard(req, '/api/users/role');
  if (denial) return res.status(denial.status).json(denial.body);
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const r = await setUserRoleHandler((req.body as Record<string, unknown>) ?? {}, user!);
  res.status(r.status).json(r.body);
}
