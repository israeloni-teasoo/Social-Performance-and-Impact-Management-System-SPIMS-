import { listCommunitiesHandler } from '../server/handlers/content';
import type { VercelRequest, VercelResponse } from '../server/lib/vercel-types';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const r = await listCommunitiesHandler();
  res.status(r.status).json(r.body);
}
