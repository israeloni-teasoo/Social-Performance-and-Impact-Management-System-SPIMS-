import { checkAccess } from './permissions';
import { requireUser } from './requireAuth';
import { getSessionUserId } from './session';
import type { AccessDenial } from './permissions';
import type { User } from '@prisma/client';

interface GuardableRequest {
  method?: string;
  url?: string;
  headers: { cookie?: string | string[] };
}

export interface GuardResult {
  /** The signed-in user, when there is one. Handlers reuse this rather than re-loading it. */
  user: User | null;
  /** Set when the request must be refused. */
  denial: AccessDenial | null;
}

/**
 * The single authorisation decision, shared by both adapters — the Express server used
 * for self-hosted deployments and the serverless wrappers used for the demo. Keeping
 * one implementation means the two hosting models cannot drift into different
 * security postures.
 *
 * The role is read from the database rather than from the JWT, so a role change or a
 * removed account takes effect on the next request instead of when the 7-day token
 * happens to expire.
 */
export async function guard(req: GuardableRequest, pathOverride?: string): Promise<GuardResult> {
  const path = pathOverride ?? (req.url ?? '').split('?')[0] ?? '';
  const method = req.method ?? 'GET';

  const user = await requireUser(getSessionUserId(req));
  const denial = checkAccess(method, path, user?.role ?? null);
  return { user, denial };
}
