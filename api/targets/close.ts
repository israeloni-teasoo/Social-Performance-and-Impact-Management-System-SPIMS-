import { closeTargetHandler } from '../../server/handlers/targets';
import type { VercelRequest, VercelResponse } from '../../server/lib/vercel-types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const r = await closeTargetHandler((req.body as Record<string, unknown>) ?? {});
  res.status(r.status).json(r.body);
}
