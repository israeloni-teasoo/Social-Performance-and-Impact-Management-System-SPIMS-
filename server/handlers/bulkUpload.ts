import { UPLOAD_TEMPLATES } from '../../frontend/src/data/uploadTemplates';
import { parseCsv } from '../lib/csv';
import { prisma } from '../lib/db';
import type { HandlerResult } from '../lib/types';
import type { User } from '@prisma/client';

export async function bulkUploadHandler(
  input: { filename?: unknown; dataType?: unknown; projectId?: unknown; csvText?: unknown },
  uploadedBy: User | null,
): Promise<HandlerResult> {
  if (!uploadedBy) return { status: 401, body: { error: 'Not signed in.' } };

  const filename = typeof input.filename === 'string' && input.filename ? input.filename : 'upload.csv';
  const dataType = typeof input.dataType === 'string' ? input.dataType : '';
  const projectId = typeof input.projectId === 'string' ? input.projectId : null;
  const csvText = typeof input.csvText === 'string' ? input.csvText : '';

  const template = (UPLOAD_TEMPLATES as Record<string, (typeof UPLOAD_TEMPLATES)['Beneficiary counts']>)[dataType];
  if (!template) return { status: 400, body: { error: 'Unknown data type.' } };

  const rows = parseCsv(csvText);
  if (rows.length === 0) return { status: 400, body: { error: 'The file is empty.' } };

  const [header, ...dataRows] = rows;
  const headerOk =
    header.length === template.columns.length && template.columns.every((col, i) => col.toLowerCase() === header[i]?.trim().toLowerCase());
  if (!headerOk) {
    return { status: 400, body: { error: `Columns don't match the ${dataType.toLowerCase()} template. Expected: ${template.columns.join(', ')}.` } };
  }

  const records = dataRows
    .filter((r) => r.some((cell) => cell.trim() !== ''))
    .map((r) => Object.fromEntries(template.columns.map((col, i) => [col, (r[i] ?? '').trim()])));

  let status = 'Received — pending review';

  if (dataType === 'Financial spend') {
    let written = 0;
    for (const rec of records) {
      const project = await prisma.project.findUnique({ where: { code: rec.project_code } });
      const amount = Number(rec.amount_ngn);
      if (!project || !Number.isFinite(amount)) continue;
      await prisma.spendEntry.create({
        data: {
          projectId: project.id,
          periodMonth: rec.period_month,
          pillar: rec.pillar,
          amountNgn: amount,
          fundingSource: rec.funding_source,
          notes: rec.notes || null,
        },
      });
      written++;
    }
    status = `${written} of ${records.length} rows written to spend records`;
  }

  const created = await prisma.bulkUpload.create({
    data: { filename, dataType, projectId, rowCount: records.length, status, uploadedById: uploadedBy.id },
  });

  return { status: 201, body: { id: created.id, rowCount: created.rowCount, status: created.status } };
}
