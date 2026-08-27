import { prisma } from '../lib/db';
import type { HandlerResult } from '../lib/types';

export async function listTargetsHandler(): Promise<HandlerResult> {
  const targets = await prisma.target.findMany({ orderBy: { createdAt: 'desc' } });
  return { status: 200, body: targets };
}

export async function createTargetHandler(input: {
  name?: unknown;
  metric?: unknown;
  unit?: unknown;
  periodStart?: unknown;
  periodEnd?: unknown;
  totalTarget?: unknown;
  currentValue?: unknown;
}): Promise<HandlerResult> {
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const metric = typeof input.metric === 'string' ? input.metric.trim() : '';
  const unit = typeof input.unit === 'string' ? input.unit : 'people';
  const periodStart = typeof input.periodStart === 'string' ? input.periodStart : '';
  const periodEnd = typeof input.periodEnd === 'string' ? input.periodEnd : '';
  const totalTarget = typeof input.totalTarget === 'number' ? input.totalTarget : Number(input.totalTarget) || 0;
  const currentValue = typeof input.currentValue === 'number' ? input.currentValue : Number(input.currentValue) || 0;

  if (!periodStart || !periodEnd) return { status: 400, body: { error: 'periodStart and periodEnd are required.' } };

  const created = await prisma.target.create({
    data: {
      name: name || 'Unnamed target',
      metric: metric || '—',
      unit,
      periodStart,
      periodEnd,
      totalTarget,
      currentValue,
      status: 'Active',
    },
  });
  return { status: 201, body: created };
}

export async function closeTargetHandler(input: { id?: unknown }): Promise<HandlerResult> {
  const id = typeof input.id === 'string' ? input.id : '';
  if (!id) return { status: 400, body: { error: 'id is required.' } };
  const existing = await prisma.target.findUnique({ where: { id } });
  if (!existing) return { status: 404, body: { error: 'Target not found.' } };
  const updated = await prisma.target.update({ where: { id }, data: { status: 'Closed' } });
  return { status: 200, body: updated };
}
