import { guard } from '../../../server/lib/guard';
import { createMentionSourceHandler, listMentionSourcesHandler } from '../../../server/handlers/mentions';
import type { VercelRequest, VercelResponse } from '../../../server/lib/vercel-types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { denial } = await guard(req, '/api/mentions/sources');
  if (denial) return res.status(denial.status).json(denial.body);
  if (req.method === 'POST') {
    const r = await createMentionSourceHandler((req.body as Record<string, unknown>) ?? {});
    return res.status(r.status).json(r.body);
  }
  const r = await listMentionSourcesHandler();
  res.status(r.status).json(r.body);
}
