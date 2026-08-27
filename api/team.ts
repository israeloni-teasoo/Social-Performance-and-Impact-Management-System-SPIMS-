import { inviteTeamMemberHandler, listTeamHandler } from '../server/handlers/team';
import type { VercelRequest, VercelResponse } from '../server/lib/vercel-types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    const r = await inviteTeamMemberHandler((req.body as Record<string, unknown>) ?? {});
    return res.status(r.status).json(r.body);
  }
  const r = await listTeamHandler();
  res.status(r.status).json(r.body);
}
