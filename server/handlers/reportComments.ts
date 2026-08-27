import { prisma } from '../lib/db';
import type { HandlerResult } from '../lib/types';
import type { User } from '@prisma/client';

function formatTimestamp(date: Date): string {
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export async function listReportCommentsHandler(): Promise<HandlerResult> {
  const comments = await prisma.reportComment.findMany({ include: { author: true }, orderBy: { createdAt: 'asc' } });
  const shaped = comments.map((c) => ({
    id: c.id,
    reportId: c.reportId,
    author: c.author.name,
    text: c.text,
    requestsCorrection: c.requestsCorrection,
    createdAt: formatTimestamp(c.createdAt),
  }));
  return { status: 200, body: shaped };
}

export async function addReportCommentHandler(
  input: { reportId?: unknown; text?: unknown; requestsCorrection?: unknown },
  author: User | null,
): Promise<HandlerResult> {
  if (!author) return { status: 401, body: { error: 'Not signed in.' } };
  const reportId = typeof input.reportId === 'string' ? input.reportId : '';
  const text = typeof input.text === 'string' ? input.text.trim() : '';
  const requestsCorrection = Boolean(input.requestsCorrection);
  if (!reportId || !text) return { status: 400, body: { error: 'reportId and text are required.' } };

  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report) return { status: 404, body: { error: 'Report not found.' } };

  const comment = await prisma.reportComment.create({ data: { reportId, authorId: author.id, text, requestsCorrection } });
  return {
    status: 201,
    body: { id: comment.id, reportId, author: author.name, text: comment.text, requestsCorrection, createdAt: formatTimestamp(comment.createdAt) },
  };
}
