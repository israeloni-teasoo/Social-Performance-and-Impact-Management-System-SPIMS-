import { createCustomFieldHandler, listCustomFieldsHandler } from '../../server/handlers/customFields';
import { requireUser } from '../../server/lib/requireAuth';
import { getSessionUserId } from '../../server/lib/session';
import type { VercelRequest, VercelResponse } from '../../server/lib/vercel-types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    const user = await requireUser(getSessionUserId(req));
    const r = await createCustomFieldHandler((req.body as Record<string, unknown>) ?? {}, user);
    return res.status(r.status).json(r.body);
  }
  const r = await listCustomFieldsHandler();
  res.status(r.status).json(r.body);
}
