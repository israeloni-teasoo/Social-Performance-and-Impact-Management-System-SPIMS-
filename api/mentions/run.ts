import { guard } from '../../server/lib/guard';
import { runMentionIngestionHandler } from '../../server/handlers/mentions';
import type { VercelRequest, VercelResponse } from '../../server/lib/vercel-types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { denial } = await guard(req, '/api/mentions/run');
  if (denial) return res.status(denial.status).json(denial.body);
  const r = await runMentionIngestionHandler();
  res.status(r.status).json(r.body);
}
