import { prisma } from '../lib/db';
import type { HandlerResult } from '../lib/types';
import type { User } from '@prisma/client';

function formatTimestamp(date: Date): string {
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export async function listApprovalsHandler(): Promise<HandlerResult> {
  const approvals = await prisma.approval.findMany({
    where: { status: 'Pending' },
    orderBy: { id: 'asc' },
    include: { comments: { include: { author: true }, orderBy: { createdAt: 'asc' } } },
  });
  const shaped = approvals.map((a) => ({
    id: a.id,
    who: a.who,
    item: a.item,
    project: a.project,
    when: a.when,
    type: a.type,
    details: a.details,
    comments: a.comments.map((c) => ({ id: c.id, author: c.author.name, text: c.text, createdAt: formatTimestamp(c.createdAt) })),
  }));
  return { status: 200, body: shaped };
}

export async function approveHandler(input: { id?: unknown }): Promise<HandlerResult> {
  const id = typeof input.id === 'string' ? input.id : '';
  if (!id) return { status: 400, body: { error: 'id is required.' } };
  const existing = await prisma.approval.findUnique({ where: { id } });
  if (!existing) return { status: 404, body: { error: 'Approval not found.' } };
  await prisma.approval.update({ where: { id }, data: { status: 'Approved' } });
  return { status: 200, body: { id, item: existing.item } };
}

export async function returnApprovalHandler(input: { id?: unknown }): Promise<HandlerResult> {
  const id = typeof input.id === 'string' ? input.id : '';
  if (!id) return { status: 400, body: { error: 'id is required.' } };
  const existing = await prisma.approval.findUnique({ where: { id } });
  if (!existing) return { status: 404, body: { error: 'Approval not found.' } };
  await prisma.approval.update({ where: { id }, data: { status: 'Returned' } });
  return { status: 200, body: { id, item: existing.item, who: existing.who } };
}

export async function addApprovalCommentHandler(input: { id?: unknown; text?: unknown }, author: User | null): Promise<HandlerResult> {
  if (!author) return { status: 401, body: { error: 'Not signed in.' } };
  const id = typeof input.id === 'string' ? input.id : '';
  const text = typeof input.text === 'string' ? input.text.trim() : '';
  if (!id || !text) return { status: 400, body: { error: 'id and text are required.' } };
  const approval = await prisma.approval.findUnique({ where: { id } });
  if (!approval) return { status: 404, body: { error: 'Approval not found.' } };

  const comment = await prisma.approvalComment.create({ data: { approvalId: id, authorId: author.id, text } });
  return { status: 201, body: { id: comment.id, author: author.name, text: comment.text, createdAt: formatTimestamp(comment.createdAt) } };
}
