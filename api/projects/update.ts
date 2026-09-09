import { guard } from '../../server/lib/guard';
import { updateProjectHandler } from '../../server/handlers/projects';
import type { VercelRequest, VercelResponse } from '../../server/lib/vercel-types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { denial } = await guard(req, '/api/projects/update');
  if (denial) return res.status(denial.status).json(denial.body);
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const r = await updateProjectHandler((req.body as Record<string, unknown>) ?? {});
  res.status(r.status).json(r.body);
}
