import { prisma } from '../lib/db';
import type { HandlerResult } from '../lib/types';

export async function listProjectsHandler(): Promise<HandlerResult> {
  const projects = await prisma.project.findMany({ orderBy: { name: 'asc' } });
  return { status: 200, body: projects };
}

export async function listProjectImpactsHandler(): Promise<HandlerResult> {
  const impacts = await prisma.projectImpact.findMany();
  const byCode: Record<string, unknown> = {};
  for (const imp of impacts) {
    byCode[imp.projectCode] = {
      projectCode: imp.projectCode,
      inputs: imp.inputs,
      activities: imp.activities,
      outputHeadline: imp.outputHeadline,
      outcome: imp.outcome,
      impactHeadline: imp.impactHeadline,
      impactFigure: imp.impactFigure,
      impactFigureLabel: imp.impactFigureLabel,
      impactPoints: imp.impactPoints,
      methodology: imp.methodology,
      impactScenarios: imp.impactScenarios ?? undefined,
      impactScenarioBasis: imp.impactScenarioBasis ?? undefined,
      baseline: imp.baseline,
      baselineCaption: imp.baselineCaption,
      dualLens: imp.dualLens,
      costPerOutcome: imp.costPerOutcome,
      sroi: imp.sroi,
      contactPerson: imp.contactPerson,
      communitiesImpacted: imp.communitiesImpacted,
    };
  }
  return { status: 200, body: byCode };
}

export async function listCommunitiesHandler(): Promise<HandlerResult> {
  const communities = await prisma.community.findMany({ orderBy: { name: 'asc' } });
  return { status: 200, body: communities };
}

export async function listIndicatorsHandler(): Promise<HandlerResult> {
  const indicators = await prisma.indicator.findMany({ orderBy: { id: 'asc' } });
  return { status: 200, body: indicators };
}

export async function listReportsHandler(): Promise<HandlerResult> {
  const reports = await prisma.report.findMany({ orderBy: { id: 'asc' } });
  return { status: 200, body: reports };
}

export async function listEvidenceHandler(): Promise<HandlerResult> {
  const items = await prisma.evidenceItem.findMany();
  return { status: 200, body: items };
}
