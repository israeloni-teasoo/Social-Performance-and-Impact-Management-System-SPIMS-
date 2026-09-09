import { prisma } from '../lib/db';
import type { HandlerResult } from '../lib/types';

const PILLARS = ['Education', 'Health', 'Infrastructure', 'Economic Emp.'];
const STATUSES = ['On track', 'At risk', 'Delayed', 'Completed'];

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function optional(value: unknown): string | null {
  const s = str(value);
  return s === '' ? null : s;
}

/** Accepts "62", "62%" or " 62 % " and returns a canonical "62%". */
function percent(value: unknown, fallback = '0%'): string {
  const raw = str(value).replace('%', '');
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return `${Math.max(0, Math.min(100, Math.round(n)))}%`;
}

/**
 * Project codes are used as the join key for impact chains, custom fields and spend,
 * so they have to be stable, unique and free of anything that would break a URL or a
 * CSV column reference.
 */
function normaliseCode(value: unknown): string {
  return str(value).toUpperCase().replace(/[^A-Z0-9_-]/g, '');
}

export async function createProjectHandler(input: Record<string, unknown>): Promise<HandlerResult> {
  const code = normaliseCode(input.code);
  const name = str(input.name);
  const pillar = str(input.pillar);
  const state = str(input.state);
  const budget = str(input.budget);

  if (!code) return { status: 400, body: { error: 'A project code is required (letters, digits, dash or underscore).' } };
  if (!name) return { status: 400, body: { error: 'A project name is required.' } };
  if (!PILLARS.includes(pillar)) return { status: 400, body: { error: 'Choose a valid pillar.' } };
  if (!state) return { status: 400, body: { error: 'A state is required.' } };

  const existing = await prisma.project.findUnique({ where: { code } });
  if (existing) return { status: 409, body: { error: `A project with the code ${code} already exists.` } };

  const status = STATUSES.includes(str(input.status)) ? str(input.status) : 'On track';

  const created = await prisma.project.create({
    data: {
      id: code,
      code,
      name,
      pillar,
      state,
      budget: budget || '₦0',
      output: str(input.output) || 'No outputs recorded yet',
      utilPct: percent(input.utilPct),
      progress: percent(input.progPct),
      progPct: percent(input.progPct),
      status,
      startDate: optional(input.startDate),
      endDate: optional(input.endDate),
      fundingSource: optional(input.fundingSource),
      contractor: optional(input.contractor),
      partner: optional(input.partner),
      community: optional(input.community),
      lga: optional(input.lga),
      owner: optional(input.owner),
    },
  });
  return { status: 201, body: created };
}

export async function updateProjectHandler(input: Record<string, unknown>): Promise<HandlerResult> {
  const code = normaliseCode(input.code);
  if (!code) return { status: 400, body: { error: 'code is required.' } };

  const existing = await prisma.project.findUnique({ where: { code } });
  if (!existing) return { status: 404, body: { error: 'Project not found.' } };

  // Only fields actually present in the request are touched, so a partial edit from
  // one screen cannot blank out values set on another.
  const data: Record<string, unknown> = {};
  if ('name' in input && str(input.name)) data.name = str(input.name);
  if ('output' in input && str(input.output)) data.output = str(input.output);
  if ('budget' in input && str(input.budget)) data.budget = str(input.budget);
  if ('pillar' in input && PILLARS.includes(str(input.pillar))) data.pillar = str(input.pillar);
  if ('state' in input && str(input.state)) data.state = str(input.state);
  if ('status' in input && STATUSES.includes(str(input.status))) data.status = str(input.status);
  if ('utilPct' in input) data.utilPct = percent(input.utilPct, existing.utilPct);
  if ('progPct' in input) {
    data.progPct = percent(input.progPct, existing.progPct);
    data.progress = data.progPct;
  }
  for (const key of ['startDate', 'endDate', 'fundingSource', 'contractor', 'partner', 'community', 'lga', 'owner'] as const) {
    if (key in input) data[key] = optional(input[key]);
  }

  if (Object.keys(data).length === 0) return { status: 400, body: { error: 'Nothing to update.' } };

  const updated = await prisma.project.update({ where: { code }, data });
  return { status: 200, body: updated };
}
