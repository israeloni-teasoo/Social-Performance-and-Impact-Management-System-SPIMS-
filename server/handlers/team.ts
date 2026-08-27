import { prisma } from '../lib/db';
import type { HandlerResult } from '../lib/types';

export async function listTeamHandler(): Promise<HandlerResult> {
  const members = await prisma.teamMember.findMany({ orderBy: { name: 'asc' } });
  return { status: 200, body: members };
}

export async function inviteTeamMemberHandler(input: { name?: unknown; email?: unknown; roleTitle?: unknown }): Promise<HandlerResult> {
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const email = typeof input.email === 'string' ? input.email.trim() : '';
  const roleTitle = typeof input.roleTitle === 'string' ? input.roleTitle.trim() : '';

  const created = await prisma.teamMember.create({
    data: {
      name: name || 'Unnamed member',
      email: email || '—',
      roleTitle: roleTitle || 'Field Officer',
      status: 'Invited',
      joinedAt: 'Invited just now',
    },
  });
  return { status: 201, body: created };
}
