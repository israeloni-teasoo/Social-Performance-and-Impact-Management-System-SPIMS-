import { prisma } from '../lib/db';
import type { HandlerResult } from '../lib/types';
import type { User } from '@prisma/client';

const FORMATS = ['text', 'number', 'percent', 'naira', 'date'];

function displayDate(): string {
  return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export async function listCustomFieldsHandler(): Promise<HandlerResult> {
  const fields = await prisma.customField.findMany({ orderBy: { createdAt: 'asc' } });
  return {
    status: 200,
    body: fields.map((f) => ({
      id: f.id,
      projectCode: f.projectCode,
      question: f.question,
      answer: f.answer,
      format: f.format,
      source: f.source,
      updatedAt: f.updatedAt,
      updatedBy: f.updatedBy,
    })),
  };
}

export async function createCustomFieldHandler(
  input: { projectCode?: unknown; question?: unknown; answer?: unknown; format?: unknown; source?: unknown },
  author: User | null,
): Promise<HandlerResult> {
  if (!author) return { status: 401, body: { error: 'Not signed in.' } };
  const projectCode = typeof input.projectCode === 'string' ? input.projectCode.trim() : '';
  const question = typeof input.question === 'string' ? input.question.trim() : '';
  const answer = typeof input.answer === 'string' ? input.answer.trim() : '';
  const format = typeof input.format === 'string' && FORMATS.includes(input.format) ? input.format : 'text';
  const source = typeof input.source === 'string' ? input.source.trim() : '';

  if (!projectCode) return { status: 400, body: { error: 'projectCode is required.' } };
  if (!question) return { status: 400, body: { error: 'A question is required.' } };
  if (!answer) return { status: 400, body: { error: 'An answer is required.' } };

  const project = await prisma.project.findUnique({ where: { code: projectCode } });
  if (!project) return { status: 404, body: { error: 'Project not found.' } };

  const created = await prisma.customField.create({
    data: { projectCode, question, answer, format, source, updatedBy: author.name, updatedAt: displayDate() },
  });
  return {
    status: 201,
    body: {
      id: created.id,
      projectCode: created.projectCode,
      question: created.question,
      answer: created.answer,
      format: created.format,
      source: created.source,
      updatedAt: created.updatedAt,
      updatedBy: created.updatedBy,
    },
  };
}

export async function updateCustomFieldHandler(
  input: { id?: unknown; answer?: unknown; source?: unknown },
  author: User | null,
): Promise<HandlerResult> {
  if (!author) return { status: 401, body: { error: 'Not signed in.' } };
  const id = typeof input.id === 'string' ? input.id : '';
  if (!id) return { status: 400, body: { error: 'id is required.' } };

  const existing = await prisma.customField.findUnique({ where: { id } });
  if (!existing) return { status: 404, body: { error: 'Field not found.' } };

  const answer = typeof input.answer === 'string' ? input.answer.trim() : existing.answer;
  const source = typeof input.source === 'string' ? input.source.trim() : existing.source;
  if (!answer) return { status: 400, body: { error: 'An answer is required.' } };

  const updated = await prisma.customField.update({
    where: { id },
    data: { answer, source, updatedBy: author.name, updatedAt: displayDate() },
  });
  return {
    status: 200,
    body: {
      id: updated.id,
      projectCode: updated.projectCode,
      question: updated.question,
      answer: updated.answer,
      format: updated.format,
      source: updated.source,
      updatedAt: updated.updatedAt,
      updatedBy: updated.updatedBy,
    },
  };
}

export async function deleteCustomFieldHandler(input: { id?: unknown }): Promise<HandlerResult> {
  const id = typeof input.id === 'string' ? input.id : '';
  if (!id) return { status: 400, body: { error: 'id is required.' } };
  const existing = await prisma.customField.findUnique({ where: { id } });
  if (!existing) return { status: 404, body: { error: 'Field not found.' } };
  await prisma.customField.delete({ where: { id } });
  return { status: 200, body: { id } };
}
