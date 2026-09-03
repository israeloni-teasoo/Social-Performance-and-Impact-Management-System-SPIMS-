import { guard } from '../../server/lib/guard';
import { listApprovalsHandler } from '../../server/handlers/approvals';
import type { VercelRequest, VercelResponse } from '../../server/lib/vercel-types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { user, denial } = await guard(req, '/api/approvals');
  if (denial) return res.status(denial.status).json(denial.body);
  const r = await listApprovalsHandler();
  res.status(r.status).json(r.body);
}
