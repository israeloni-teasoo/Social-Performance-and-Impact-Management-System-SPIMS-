import { prisma } from '../lib/db';
import type { HandlerResult } from '../lib/types';

export async function listStakeholdersHandler(): Promise<HandlerResult> {
  const stakeholders = await prisma.stakeholder.findMany({ orderBy: { name: 'asc' } });
  return { status: 200, body: stakeholders };
}

export async function createStakeholderHandler(input: { name?: unknown; type?: unknown; community?: unknown }): Promise<HandlerResult> {
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const type = typeof input.type === 'string' ? input.type.trim() : '';
  const community = typeof input.community === 'string' ? input.community.trim() : '';

  const created = await prisma.stakeholder.create({
    data: {
      name: name || 'Unnamed stakeholder',
      type: type || 'Other',
      community: community || '—',
      engagements: 0,
      commitments: 'None yet',
      status: 'Active',
    },
  });
  return { status: 201, body: created };
}
