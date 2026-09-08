import { guard } from '../../server/lib/guard';
import { resetUserPasswordHandler } from '../../server/handlers/users';
import type { VercelRequest, VercelResponse } from '../../server/lib/vercel-types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { denial } = await guard(req, '/api/users/reset-password');
  if (denial) return res.status(denial.status).json(denial.body);
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const r = await resetUserPasswordHandler((req.body as Record<string, unknown>) ?? {});
  res.status(r.status).json(r.body);
}
