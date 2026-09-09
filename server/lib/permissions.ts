import type { Role } from '@prisma/client';

/**
 * Who may call what.
 *
 * The roles for each route are derived from what that role's navigation actually
 * exposes (see the frontend Sidebar), so the API permits exactly what the interface
 * offers and nothing more. Hiding a button is a usability choice; this table is the
 * control.
 *
 * Reads are open to any signed-in user. SPIMS is a single-tenant internal system in
 * which staff are expected to see the portfolio — the meaningful restriction is on who
 * can change it. That is a deliberate decision, not an oversight.
 */

export const PUBLIC_ROUTES = ['/api/health', '/api/auth/login', '/api/auth/logout', '/api/auth/me'];

/** Any signed-in role. */
const ANY: Role[] = ['exec', 'manager', 'field', 'relations'];

/**
 * Reads that are not open to every signed-in user. The account list carries email
 * addresses and role assignments, which is administrative rather than portfolio data.
 */
export const READ_PERMISSIONS: Record<string, Role[]> = {
  '/api/users': ['exec'],
};

export const WRITE_PERMISSIONS: Record<string, Role[]> = {
  // Account administration. The executive is the senior role in this system, so it
  // holds it; if Seplat wants separation of duties, a dedicated admin role can be
  // split out without disturbing anything else.
  '/api/users': ['exec'],
  '/api/users/role': ['exec'],
  '/api/users/active': ['exec'],
  '/api/users/reset-password': ['exec'],
  // Anyone may change their own password — that is what makes an administrator-set
  // password acceptable.
  '/api/users/change-password': ANY,

  // Executive — Targets and Bulk Upload sit under the executive's Configure section.
  '/api/targets': ['exec'],
  '/api/targets/close': ['exec'],
  '/api/bulk-upload': ['exec'],
  // Organisation settings are administrative, so they sit with the Executive; the
  // settings themselves are readable by everyone because the interface needs them.
  '/api/settings': ['exec'],

  // Projects are created and maintained by both, at Seplat's request — in practice
  // the Executive may be the only person using the system.
  '/api/projects': ['exec', 'manager'],
  '/api/projects/update': ['exec', 'manager'],

  // Manager — approvals queue and team management are the manager's workspace.
  '/api/approvals/approve': ['manager'],
  '/api/approvals/return': ['manager'],
  '/api/approvals/comment': ['manager'],
  '/api/team': ['manager'],
  '/api/tasks': ['manager'],

  // Field officer updates progress on their own tasks; a manager may also correct it.
  '/api/tasks/status': ['field', 'manager'],

  // Community Relations owns the stakeholder register.
  '/api/stakeholders': ['relations'],

  // Reports are available to both executive and manager navigations.
  '/api/reports/generate-preview': ['exec', 'manager'],
  '/api/report-comments': ['exec', 'manager'],

  // Programme custom fields — matches canEditFields in the frontend.
  '/api/custom-fields': ['exec', 'manager'],
  '/api/custom-fields/update': ['exec', 'manager'],
  '/api/custom-fields/delete': ['exec', 'manager'],

  // Media mentions. Reviewing coverage is Community Relations' work, and the
  // Executive holds it too because in practice they may be the only user. Which
  // sources are configured decides what leaves Seplat's network, so that is
  // administrative and sits with the Executive alone.
  '/api/mentions/review': ['exec', 'relations'],
  '/api/mentions/run': ['exec', 'relations'],
  '/api/mentions/sources': ['exec'],
  '/api/mentions/sources/active': ['exec'],
  '/api/mentions/sources/delete': ['exec'],
};

export interface AccessDenial {
  status: 401 | 403 | 405;
  body: { error: string };
}

/**
 * Returns a denial to send back, or null if the request may proceed.
 *
 * Unlisted writes are refused rather than allowed, so a route added without a
 * permission entry fails visibly in development instead of shipping unprotected.
 */
export function checkAccess(method: string, path: string, role: Role | null): AccessDenial | null {
  const route = path.replace(/\/+$/, '') || path;
  if (PUBLIC_ROUTES.includes(route)) return null;

  if (!role) return { status: 401, body: { error: 'Not signed in.' } };

  const verb = method.toUpperCase();
  if (verb === 'GET' || verb === 'HEAD') {
    const restricted = READ_PERMISSIONS[route];
    if (restricted) {
      return restricted.includes(role) ? null : { status: 403, body: { error: 'Your role cannot view this.' } };
    }
    return ANY.includes(role) ? null : { status: 403, body: { error: 'Not permitted.' } };
  }

  if (verb !== 'POST') return { status: 405, body: { error: 'Method not allowed.' } };

  const allowed = WRITE_PERMISSIONS[route];
  if (!allowed) {
    return { status: 403, body: { error: 'This action has no permission rule and is refused by default.' } };
  }
  return allowed.includes(role) ? null : { status: 403, body: { error: 'Your role cannot perform this action.' } };
}
