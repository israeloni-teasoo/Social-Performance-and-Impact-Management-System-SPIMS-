import { listApprovalsHandler } from '../../server/handlers/approvals';
import type { VercelRequest, VercelResponse } from '../../server/lib/vercel-types';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const r = await listApprovalsHandler();
  res.status(r.status).json(r.body);
}
