import { prisma } from '../lib/db';
import type { HandlerResult } from '../lib/types';
import type { User } from '@prisma/client';

export async function listTasksHandler(): Promise<HandlerResult> {
  const tasks = await prisma.fieldTask.findMany({ orderBy: { createdAt: 'desc' } });
  const shaped = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    project: t.projectLabel,
    due: t.due,
    dueColor: t.dueColor,
    assigneeId: t.assigneeId ?? undefined,
    status: t.status,
    createdBy: t.createdBy ?? undefined,
  }));
  return { status: 200, body: shaped };
}

export async function assignTaskHandler(
  input: { title?: unknown; project?: unknown; due?: unknown; assigneeId?: unknown },
  createdByUser: User | null,
): Promise<HandlerResult> {
  const title = typeof input.title === 'string' ? input.title.trim() : '';
  const project = typeof input.project === 'string' ? input.project.trim() : '';
  const due = typeof input.due === 'string' ? input.due.trim() : '';
  const assigneeId = typeof input.assigneeId === 'string' ? input.assigneeId : undefined;

  const created = await prisma.fieldTask.create({
    data: {
      title: title || 'Untitled task',
      projectLabel: project || '—',
      due: due || 'No due date',
      dueColor: '#8A8DA6',
      assigneeId,
      status: 'Not started',
      createdBy: createdByUser ? `${createdByUser.name} · ${createdByUser.roleLabel}` : null,
    },
  });
  return {
    status: 201,
    body: { id: created.id, title: created.title, project: created.projectLabel, due: created.due, dueColor: created.dueColor, assigneeId: created.assigneeId, status: created.status, createdBy: created.createdBy },
  };
}

export async function setTaskStatusHandler(input: { id?: unknown; status?: unknown }): Promise<HandlerResult> {
  const id = typeof input.id === 'string' ? input.id : '';
  const status = typeof input.status === 'string' ? input.status : '';
  if (!id || !['Not started', 'In progress', 'Done'].includes(status)) {
    return { status: 400, body: { error: 'A valid id and status are required.' } };
  }
  const existing = await prisma.fieldTask.findUnique({ where: { id } });
  if (!existing) return { status: 404, body: { error: 'Task not found.' } };
  const updated = await prisma.fieldTask.update({ where: { id }, data: { status } });
  return { status: 200, body: { id: updated.id, status: updated.status } };
}
