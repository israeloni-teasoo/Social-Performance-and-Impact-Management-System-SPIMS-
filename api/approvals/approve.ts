import { guard } from '../../server/lib/guard';
import { approveHandler } from '../../server/handlers/approvals';
import type { VercelRequest, VercelResponse } from '../../server/lib/vercel-types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { user, denial } = await guard(req, '/api/approvals/approve');
  if (denial) return res.status(denial.status).json(denial.body);
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const r = await approveHandler((req.body as Record<string, unknown>) ?? {});
  res.status(r.status).json(r.body);
}
