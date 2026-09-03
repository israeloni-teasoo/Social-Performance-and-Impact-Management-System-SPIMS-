import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import type { Request } from 'express';
import { addApprovalCommentHandler, approveHandler, listApprovalsHandler, returnApprovalHandler } from './handlers/approvals';
import { loginHandler, meHandler } from './handlers/auth';
import { bulkUploadHandler } from './handlers/bulkUpload';
import { listCommunitiesHandler, listEvidenceHandler, listIndicatorsHandler, listProjectImpactsHandler, listProjectsHandler, listReportsHandler } from './handlers/content';
import { createCustomFieldHandler, deleteCustomFieldHandler, listCustomFieldsHandler, updateCustomFieldHandler } from './handlers/customFields';
import { addReportCommentHandler, listReportCommentsHandler } from './handlers/reportComments';
import { generateReportPreviewHandler } from './handlers/reportPreview';
import { createStakeholderHandler, listStakeholdersHandler } from './handlers/stakeholders';
import { closeTargetHandler, createTargetHandler, listTargetsHandler } from './handlers/targets';
import { assignTaskHandler, listTasksHandler, setTaskStatusHandler } from './handlers/tasks';
import { inviteTeamMemberHandler, listTeamHandler } from './handlers/team';
import { prisma } from './lib/db';
import { requireUser } from './lib/requireAuth';
import { clearSessionCookie, getSessionUserId, setSessionCookie } from './lib/session';

export const app = express();
app.use(express.json({ limit: '5mb' })); // CSV text rides along in the JSON body for bulk uploads

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
app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ok', database: 'connected' });
  } catch {
    res.status(503).json({ status: 'degraded', database: 'unreachable' });
  }
});

async function currentUser(req: Request) {
  return requireUser(getSessionUserId(req));
}

// --- Auth ---
app.post('/api/auth/login', async (req, res) => {
  const result = await loginHandler(req.body ?? {});
  if (result.status === 200 && result.body.token) setSessionCookie(res, result.body.token);
  const { token: _token, ...body } = result.body;
  res.status(result.status).json(body);
});
app.post('/api/auth/logout', (_req, res) => {
  clearSessionCookie(res);
  res.status(200).json({ ok: true });
});
app.get('/api/auth/me', async (req, res) => {
  const result = await meHandler(getSessionUserId(req));
  res.status(result.status).json(result.body);
});

// --- Read-only content ---
app.get('/api/projects', async (_req, res) => {
  const r = await listProjectsHandler();
  res.status(r.status).json(r.body);
});
app.get('/api/project-impacts', async (_req, res) => {
  const r = await listProjectImpactsHandler();
  res.status(r.status).json(r.body);
});
app.get('/api/communities', async (_req, res) => {
  const r = await listCommunitiesHandler();
  res.status(r.status).json(r.body);
});
app.get('/api/indicators', async (_req, res) => {
  const r = await listIndicatorsHandler();
  res.status(r.status).json(r.body);
});
app.get('/api/reports', async (_req, res) => {
  const r = await listReportsHandler();
  res.status(r.status).json(r.body);
});
app.get('/api/evidence', async (_req, res) => {
  const r = await listEvidenceHandler();
  res.status(r.status).json(r.body);
});

// --- Stakeholders ---
app.get('/api/stakeholders', async (_req, res) => {
  const r = await listStakeholdersHandler();
  res.status(r.status).json(r.body);
});
app.post('/api/stakeholders', async (req, res) => {
  const r = await createStakeholderHandler(req.body ?? {});
  res.status(r.status).json(r.body);
});

// --- Targets ---
app.get('/api/targets', async (_req, res) => {
  const r = await listTargetsHandler();
  res.status(r.status).json(r.body);
});
app.post('/api/targets', async (req, res) => {
  const r = await createTargetHandler(req.body ?? {});
  res.status(r.status).json(r.body);
});
app.post('/api/targets/close', async (req, res) => {
  const r = await closeTargetHandler(req.body ?? {});
  res.status(r.status).json(r.body);
});

// --- Field tasks ---
app.get('/api/tasks', async (_req, res) => {
  const r = await listTasksHandler();
  res.status(r.status).json(r.body);
});
app.post('/api/tasks', async (req, res) => {
  const r = await assignTaskHandler(req.body ?? {}, await currentUser(req));
  res.status(r.status).json(r.body);
});
app.post('/api/tasks/status', async (req, res) => {
  const r = await setTaskStatusHandler(req.body ?? {});
  res.status(r.status).json(r.body);
});

// --- Team ---
app.get('/api/team', async (_req, res) => {
  const r = await listTeamHandler();
  res.status(r.status).json(r.body);
});
app.post('/api/team', async (req, res) => {
  const r = await inviteTeamMemberHandler(req.body ?? {});
  res.status(r.status).json(r.body);
});

// --- Approvals ---
app.get('/api/approvals', async (_req, res) => {
  const r = await listApprovalsHandler();
  res.status(r.status).json(r.body);
});
app.post('/api/approvals/approve', async (req, res) => {
  const r = await approveHandler(req.body ?? {});
  res.status(r.status).json(r.body);
});
app.post('/api/approvals/return', async (req, res) => {
  const r = await returnApprovalHandler(req.body ?? {});
  res.status(r.status).json(r.body);
});
app.post('/api/approvals/comment', async (req, res) => {
  const r = await addApprovalCommentHandler(req.body ?? {}, await currentUser(req));
  res.status(r.status).json(r.body);
});

// --- Bulk upload ---
app.post('/api/bulk-upload', async (req, res) => {
  const r = await bulkUploadHandler(req.body ?? {}, await currentUser(req));
  res.status(r.status).json(r.body);
});

// --- Claude-generated report preview ---
app.post('/api/reports/generate-preview', async (req, res) => {
  const r = await generateReportPreviewHandler(req.body ?? {}, await currentUser(req));
  res.status(r.status).json(r.body);
});

// --- Custom fields (per-programme questions) ---
app.get('/api/custom-fields', async (_req, res) => {
  const r = await listCustomFieldsHandler();
  res.status(r.status).json(r.body);
});
app.post('/api/custom-fields', async (req, res) => {
  const r = await createCustomFieldHandler(req.body ?? {}, await currentUser(req));
  res.status(r.status).json(r.body);
});
app.post('/api/custom-fields/update', async (req, res) => {
  const r = await updateCustomFieldHandler(req.body ?? {}, await currentUser(req));
  res.status(r.status).json(r.body);
});
app.post('/api/custom-fields/delete', async (req, res) => {
  const r = await deleteCustomFieldHandler(req.body ?? {});
  res.status(r.status).json(r.body);
});

// --- Report comments ---
app.get('/api/report-comments', async (_req, res) => {
  const r = await listReportCommentsHandler();
  res.status(r.status).json(r.body);
});
app.post('/api/report-comments', async (req, res) => {
  const r = await addReportCommentHandler(req.body ?? {}, await currentUser(req));
  res.status(r.status).json(r.body);
});
