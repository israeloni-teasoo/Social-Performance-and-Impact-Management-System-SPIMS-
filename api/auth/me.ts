import { meHandler } from '../../server/handlers/auth';
import { getSessionUserId } from '../../server/lib/session';
import type { VercelRequest, VercelResponse } from '../../server/lib/vercel-types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const result = await meHandler(getSessionUserId(req));
  res.status(result.status).json(result.body);
}
