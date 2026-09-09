import { prisma } from '../lib/db';
import type { HandlerResult } from '../lib/types';

const ID = 'org';

/**
 * Organisation settings. Read by every signed-in user because the interface needs the
 * organisation name and financial year to render; only an Executive may change them.
 *
 * The row is created on first read rather than by the seed, so a fresh installation
 * that skipped seeding still has working defaults.
 */
async function load() {
  return prisma.orgSettings.upsert({ where: { id: ID }, create: { id: ID }, update: {} });
}

export async function getSettingsHandler(): Promise<HandlerResult> {
  const s = await load();
  return {
    status: 200,
    body: {
      orgName: s.orgName,
      financialYear: s.financialYear,
      currencyLabel: s.currencyLabel,
      targetYear: s.targetYear,
      dataStatusNote: s.dataStatusNote,
    },
  };
}

export async function updateSettingsHandler(input: Record<string, unknown>): Promise<HandlerResult> {
  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

  const orgName = str(input.orgName);
  const financialYear = str(input.financialYear);
  const currencyLabel = str(input.currencyLabel);
  const dataStatusNote = str(input.dataStatusNote);
  const targetYear = Number(input.targetYear);

  if (!orgName) return { status: 400, body: { error: 'An organisation name is required.' } };
  if (!financialYear) return { status: 400, body: { error: 'A financial year label is required.' } };
  if (!currencyLabel) return { status: 400, body: { error: 'A currency label is required.' } };
  if (!Number.isInteger(targetYear) || targetYear < 2000 || targetYear > 2100) {
    return { status: 400, body: { error: 'The target year must be a year between 2000 and 2100.' } };
  }

  await load();
  const updated = await prisma.orgSettings.update({
    where: { id: ID },
    data: { orgName, financialYear, currencyLabel, targetYear, dataStatusNote },
  });
  return {
    status: 200,
    body: {
      orgName: updated.orgName,
      financialYear: updated.financialYear,
      currencyLabel: updated.currencyLabel,
      targetYear: updated.targetYear,
      dataStatusNote: updated.dataStatusNote,
    },
  };
}

/**
 * What the deployment has connected, for the Settings screen. Reports whether the
 * Claude key is configured — never the key itself.
 */
export async function getIntegrationStatusHandler(): Promise<HandlerResult> {
  const [projects, users, uploads] = await Promise.all([
    prisma.project.count(),
    prisma.user.count({ where: { active: true } }),
    prisma.bulkUpload.count(),
  ]);
  return {
    status: 200,
    body: {
      claudeConfigured: Boolean(process.env.ANTHROPIC_API_KEY),
      mediaMonitoringConfigured: false,
      database: 'PostgreSQL',
      projects,
      activeUsers: users,
      uploads,
    },
  };
}
