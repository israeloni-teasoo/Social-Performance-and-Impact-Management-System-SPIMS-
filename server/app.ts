import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import { addApprovalCommentHandler, approveHandler, listApprovalsHandler, returnApprovalHandler } from './handlers/approvals';
import { loginHandler, meHandler } from './handlers/auth';
import { bulkUploadHandler } from './handlers/bulkUpload';
import { listCommunitiesHandler, listEvidenceHandler, listIndicatorsHandler, listProjectImpactsHandler, listProjectsHandler, listReportsHandler } from './handlers/content';
import { createCustomFieldHandler, deleteCustomFieldHandler, listCustomFieldsHandler, updateCustomFieldHandler } from './handlers/customFields';
import {
  createMentionSourceHandler,
  deleteMentionSourceHandler,
  listMentionSourcesHandler,
  listMentionsHandler,
  reviewMentionHandler,
  runMentionIngestionHandler,
  setMentionSourceActiveHandler,
} from './handlers/mentions';
import {
  createAlertChannelHandler,
  createAlertRuleHandler,
  deleteAlertChannelHandler,
  deleteAlertRuleHandler,
  listAlertConfigHandler,
  setAlertRuleActiveHandler,
  testAlertChannelHandler,
} from './handlers/alerts';
import { checkCronAuth } from './lib/cronAuth';
import { addReportCommentHandler, listReportCommentsHandler } from './handlers/reportComments';
import { generateReportPreviewHandler } from './handlers/reportPreview';
import { createProjectHandler, updateProjectHandler } from './handlers/projects';
import { getIntegrationStatusHandler, getSettingsHandler, updateSettingsHandler } from './handlers/settings';
import { createStakeholderHandler, listStakeholdersHandler } from './handlers/stakeholders';
import { closeTargetHandler, createTargetHandler, listTargetsHandler } from './handlers/targets';
import { assignTaskHandler, listTasksHandler, setTaskStatusHandler } from './handlers/tasks';
import { inviteTeamMemberHandler, listTeamHandler } from './handlers/team';
import { changeOwnPasswordHandler, createUserHandler, listUsersHandler, resetUserPasswordHandler, setUserActiveHandler, setUserRoleHandler } from './handlers/users';
import { prisma } from './lib/db';
import { guard } from './lib/guard';
import { requireUser } from './lib/requireAuth';
import { clearSessionCookie, getSessionUserId, setSessionCookie } from './lib/session';

export const app = express();
app.use(express.json({ limit: '5mb' })); // CSV text rides along in the JSON body for bulk uploads

type AsyncRoute = (req: Request, res: Response) => Promise<unknown> | unknown;

/**
 * Every route is registered through these rather than through `app.get`/`app.post`.
 *
 * Express 4 does not catch a rejected promise from an async handler. The rejection goes
 * unhandled, and since Node 15 that terminates the process. A transient database blip
 * therefore took down the whole API instead of returning an error — and on a serverless
 * platform a crashed invocation answers with the host's own error page, which the
 * frontend reads as "no API here" and falls back to demo data. Routing the rejection
 * into Express's error handling turns that into an ordinary 500 with a JSON body.
 */
function get(path: string, handler: AsyncRoute) {
  app.get(path, (req, res, next) => Promise.resolve(handler(req, res)).catch(next));
}
function post(path: string, handler: AsyncRoute) {
  app.post(path, (req, res, next) => Promise.resolve(handler(req, res)).catch(next));
}

// In the supported deployments the browser is same-origin with the API (nginx serves
// the build and proxies /api, and Vite proxies /api in dev), so no CORS header is
// needed. Reflecting every origin with credentials would let any site make
// credentialed requests against this API, so cross-origin access is opt-in and must
// name its origins explicitly.
const corsOrigins = (process.env.CORS_ORIGINS ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
if (corsOrigins.length > 0) {
  app.use(cors({ origin: corsOrigins, credentials: true }));
}

// Container healthcheck: liveness plus a real round trip to Postgres, so an
// unreachable database fails the check instead of reporting a healthy app.
get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ok', database: 'connected' });
  } catch {
    res.status(503).json({ status: 'degraded', database: 'unreachable' });
  }
});

/**
 * Authorisation gate for every /api route.
 *
 * Placed ahead of the route table so a route cannot be added without being covered:
 * anything not explicitly public requires a session, and any write without a
 * permission rule is refused rather than allowed through.
 */
app.use('/api', (req, res, next) => {
  // The guard reads the user from the database, so it can reject; same reasoning as the
  // route wrappers above.
  guard(req, req.baseUrl + (req.path === '/' ? '' : req.path))
    .then(({ user, denial }) => {
      if (denial) {
        res.status(denial.status).json(denial.body);
        return;
      }
      res.locals.user = user;
      next();
    })
    .catch(next);
});

async function currentUser(req: Request) {
  return requireUser(getSessionUserId(req));
}

// --- Auth ---
post('/api/auth/login', async (req, res) => {
  const result = await loginHandler(req.body ?? {});
  if (result.status === 200 && result.body.token) setSessionCookie(res, result.body.token);
  const { token: _token, ...body } = result.body;
  res.status(result.status).json(body);
});
post('/api/auth/logout', (_req, res) => {
  clearSessionCookie(res);
  res.status(200).json({ ok: true });
});
get('/api/auth/me', async (req, res) => {
  const result = await meHandler(getSessionUserId(req));
  res.status(result.status).json(result.body);
});

// --- Read-only content ---
get('/api/projects', async (_req, res) => {
  const r = await listProjectsHandler();
  res.status(r.status).json(r.body);
});
post('/api/projects', async (req, res) => {
  const r = await createProjectHandler(req.body ?? {});
  res.status(r.status).json(r.body);
});
post('/api/projects/update', async (req, res) => {
  const r = await updateProjectHandler(req.body ?? {});
  res.status(r.status).json(r.body);
});
get('/api/project-impacts', async (_req, res) => {
  const r = await listProjectImpactsHandler();
  res.status(r.status).json(r.body);
});
get('/api/communities', async (_req, res) => {
  const r = await listCommunitiesHandler();
  res.status(r.status).json(r.body);
});
get('/api/indicators', async (_req, res) => {
  const r = await listIndicatorsHandler();
  res.status(r.status).json(r.body);
});
get('/api/reports', async (_req, res) => {
  const r = await listReportsHandler();
  res.status(r.status).json(r.body);
});
get('/api/evidence', async (_req, res) => {
  const r = await listEvidenceHandler();
  res.status(r.status).json(r.body);
});

// --- Stakeholders ---
get('/api/stakeholders', async (_req, res) => {
  const r = await listStakeholdersHandler();
  res.status(r.status).json(r.body);
});
post('/api/stakeholders', async (req, res) => {
  const r = await createStakeholderHandler(req.body ?? {});
  res.status(r.status).json(r.body);
});

// --- Targets ---
get('/api/targets', async (_req, res) => {
  const r = await listTargetsHandler();
  res.status(r.status).json(r.body);
});
post('/api/targets', async (req, res) => {
  const r = await createTargetHandler(req.body ?? {});
  res.status(r.status).json(r.body);
});
post('/api/targets/close', async (req, res) => {
  const r = await closeTargetHandler(req.body ?? {});
  res.status(r.status).json(r.body);
});

// --- Field tasks ---
get('/api/tasks', async (_req, res) => {
  const r = await listTasksHandler();
  res.status(r.status).json(r.body);
});
post('/api/tasks', async (req, res) => {
  const r = await assignTaskHandler(req.body ?? {}, await currentUser(req));
  res.status(r.status).json(r.body);
});
post('/api/tasks/status', async (req, res) => {
  const r = await setTaskStatusHandler(req.body ?? {});
  res.status(r.status).json(r.body);
});

// --- Team ---
get('/api/team', async (_req, res) => {
  const r = await listTeamHandler();
  res.status(r.status).json(r.body);
});
post('/api/team', async (req, res) => {
  const r = await inviteTeamMemberHandler(req.body ?? {});
  res.status(r.status).json(r.body);
});

// --- Approvals ---
get('/api/approvals', async (_req, res) => {
  const r = await listApprovalsHandler();
  res.status(r.status).json(r.body);
});
post('/api/approvals/approve', async (req, res) => {
  const r = await approveHandler(req.body ?? {});
  res.status(r.status).json(r.body);
});
post('/api/approvals/return', async (req, res) => {
  const r = await returnApprovalHandler(req.body ?? {});
  res.status(r.status).json(r.body);
});
post('/api/approvals/comment', async (req, res) => {
  const r = await addApprovalCommentHandler(req.body ?? {}, await currentUser(req));
  res.status(r.status).json(r.body);
});

// --- Bulk upload ---
post('/api/bulk-upload', async (req, res) => {
  const r = await bulkUploadHandler(req.body ?? {}, await currentUser(req));
  res.status(r.status).json(r.body);
});

// --- Claude-generated report preview ---
post('/api/reports/generate-preview', async (req, res) => {
  const r = await generateReportPreviewHandler(req.body ?? {}, await currentUser(req));
  res.status(r.status).json(r.body);
});

// --- Custom fields (per-programme questions) ---
get('/api/custom-fields', async (_req, res) => {
  const r = await listCustomFieldsHandler();
  res.status(r.status).json(r.body);
});
post('/api/custom-fields', async (req, res) => {
  const r = await createCustomFieldHandler(req.body ?? {}, await currentUser(req));
  res.status(r.status).json(r.body);
});
post('/api/custom-fields/update', async (req, res) => {
  const r = await updateCustomFieldHandler(req.body ?? {}, await currentUser(req));
  res.status(r.status).json(r.body);
});
post('/api/custom-fields/delete', async (req, res) => {
  const r = await deleteCustomFieldHandler(req.body ?? {});
  res.status(r.status).json(r.body);
});

// --- Media mentions (press and web monitoring) ---
get('/api/mentions', async (req, res) => {
  const r = await listMentionsHandler((req.query as Record<string, unknown>) ?? {});
  res.status(r.status).json(r.body);
});
post('/api/mentions/review', async (req, res) => {
  const r = await reviewMentionHandler(req.body ?? {}, await currentUser(req));
  res.status(r.status).json(r.body);
});
post('/api/mentions/run', async (_req, res) => {
  const r = await runMentionIngestionHandler();
  res.status(r.status).json(r.body);
});
get('/api/mentions/sources', async (_req, res) => {
  const r = await listMentionSourcesHandler();
  res.status(r.status).json(r.body);
});
post('/api/mentions/sources', async (req, res) => {
  const r = await createMentionSourceHandler(req.body ?? {});
  res.status(r.status).json(r.body);
});
post('/api/mentions/sources/active', async (req, res) => {
  const r = await setMentionSourceActiveHandler(req.body ?? {});
  res.status(r.status).json(r.body);
});
post('/api/mentions/sources/delete', async (req, res) => {
  const r = await deleteMentionSourceHandler(req.body ?? {});
  res.status(r.status).json(r.body);
});

// --- Mention alerts (what is worth interrupting someone for, and where to send it) ---
get('/api/alerts', async (_req, res) => {
  const r = await listAlertConfigHandler();
  res.status(r.status).json(r.body);
});
post('/api/alerts/rules', async (req, res) => {
  const r = await createAlertRuleHandler(req.body ?? {});
  res.status(r.status).json(r.body);
});
post('/api/alerts/rules/active', async (req, res) => {
  const r = await setAlertRuleActiveHandler(req.body ?? {});
  res.status(r.status).json(r.body);
});
post('/api/alerts/rules/delete', async (req, res) => {
  const r = await deleteAlertRuleHandler(req.body ?? {});
  res.status(r.status).json(r.body);
});
post('/api/alerts/channels', async (req, res) => {
  const r = await createAlertChannelHandler(req.body ?? {});
  res.status(r.status).json(r.body);
});
post('/api/alerts/channels/delete', async (req, res) => {
  const r = await deleteAlertChannelHandler(req.body ?? {});
  res.status(r.status).json(r.body);
});
post('/api/alerts/channels/test', async (req, res) => {
  const r = await testAlertChannelHandler(req.body ?? {});
  res.status(r.status).json(r.body);
});

/**
 * Scheduled media collection.
 *
 * Present in both adapters so a self-hosted install can drive it from system cron
 * exactly as Vercel drives it from vercel.json — the same path, the same bearer token.
 * It authenticates itself rather than going through the session guard, because a
 * scheduler has no session.
 */
get('/api/cron/collect-mentions', async (req, res) => {
  const auth = checkCronAuth(req.headers.authorization);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });
  const r = await runMentionIngestionHandler();
  if (r.status === 400) return res.status(200).json({ skipped: true, ...(r.body as object) });
  res.status(r.status).json(r.body);
});

// --- Organisation settings ---
get('/api/settings', async (_req, res) => {
  const r = await getSettingsHandler();
  res.status(r.status).json(r.body);
});
post('/api/settings', async (req, res) => {
  const r = await updateSettingsHandler(req.body ?? {});
  res.status(r.status).json(r.body);
});
get('/api/settings/status', async (_req, res) => {
  const r = await getIntegrationStatusHandler();
  res.status(r.status).json(r.body);
});

// --- User accounts ---
// The guard has already established the caller's role, so currentUser cannot be null
// on these routes; the non-null assertion documents that rather than hiding it.
get('/api/users', async (_req, res) => {
  const r = await listUsersHandler();
  res.status(r.status).json(r.body);
});
post('/api/users', async (req, res) => {
  const r = await createUserHandler(req.body ?? {});
  res.status(r.status).json(r.body);
});
post('/api/users/role', async (req, res) => {
  const r = await setUserRoleHandler(req.body ?? {}, (await currentUser(req))!);
  res.status(r.status).json(r.body);
});
post('/api/users/active', async (req, res) => {
  const r = await setUserActiveHandler(req.body ?? {}, (await currentUser(req))!);
  res.status(r.status).json(r.body);
});
post('/api/users/reset-password', async (req, res) => {
  const r = await resetUserPasswordHandler(req.body ?? {});
  res.status(r.status).json(r.body);
});
post('/api/users/change-password', async (req, res) => {
  const r = await changeOwnPasswordHandler(req.body ?? {}, (await currentUser(req))!);
  res.status(r.status).json(r.body);
});

// --- Report comments ---
get('/api/report-comments', async (_req, res) => {
  const r = await listReportCommentsHandler();
  res.status(r.status).json(r.body);
});
post('/api/report-comments', async (req, res) => {
  const r = await addReportCommentHandler(req.body ?? {}, await currentUser(req));
  res.status(r.status).json(r.body);
});

/**
 * The last word on any request that failed.
 *
 * Registered after every route, because Express picks error handlers by their four
 * arguments and by their position. Two things matter here. The response is JSON, so a
 * failure still looks like an API to the frontend's mode detection rather than tipping
 * the whole interface into demo data. And the detail stays in the server log: an error
 * from Prisma can carry a query, a connection string fragment or a row, none of which
 * belongs in a browser.
 */
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error in an API route:', error);
  if (res.headersSent) return;
  res.status(500).json({ error: 'Something went wrong on the server.' });
});
