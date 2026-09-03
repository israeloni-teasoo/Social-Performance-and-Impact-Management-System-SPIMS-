import { guard } from '../../server/lib/guard';
import { createCustomFieldHandler, listCustomFieldsHandler } from '../../server/handlers/customFields';
import type { VercelRequest, VercelResponse } from '../../server/lib/vercel-types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { user, denial } = await guard(req, '/api/custom-fields');
  if (denial) return res.status(denial.status).json(denial.body);
  if (req.method === 'POST') {
    const r = await createCustomFieldHandler((req.body as Record<string, unknown>) ?? {}, user);
    return res.status(r.status).json(r.body);
  }
  const r = await listCustomFieldsHandler();
  res.status(r.status).json(r.body);
}
