import { returnApprovalHandler } from '../../server/handlers/approvals';
import type { VercelRequest, VercelResponse } from '../../server/lib/vercel-types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const r = await returnApprovalHandler((req.body as Record<string, unknown>) ?? {});
  res.status(r.status).json(r.body);
}
