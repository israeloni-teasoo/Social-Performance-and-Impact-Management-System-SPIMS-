import { loginHandler } from '../../server/handlers/auth';
import { setSessionCookie } from '../../server/lib/session';
import type { VercelRequest, VercelResponse } from '../../server/lib/vercel-types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const result = await loginHandler((req.body as Record<string, unknown>) ?? {});
  if (result.status === 200 && result.body.token) setSessionCookie(res, result.body.token);
  const { token: _token, ...body } = result.body;
  res.status(result.status).json(body);
}
