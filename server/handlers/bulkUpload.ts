import { TEMPLATE_COMMENT, UPLOAD_TEMPLATES, columnsOf } from '../../frontend/src/data/uploadTemplates.js';
import { parseCsv } from '../lib/csv.js';
import { prisma } from '../lib/db.js';
import type { HandlerResult } from '../lib/types.js';
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

  const columns = columnsOf(template);

  // The downloaded template carries its own instructions as lines starting with "#", so
  // that the explanation of each column is in front of whoever is filling the file in
  // rather than in a document they were sent once. They are dropped before the header is
  // read, so it makes no difference whether they were left in place, deleted, or moved.
  const rows = parseCsv(csvText).filter((r) => !(r[0] ?? '').trim().startsWith(TEMPLATE_COMMENT));
  if (rows.length === 0) return { status: 400, body: { error: 'The file is empty.' } };

  const [header, ...dataRows] = rows;
  const headerOk =
    header.length === columns.length && columns.every((col, i) => col.toLowerCase() === header[i]?.trim().toLowerCase());
  if (!headerOk) {
    return { status: 400, body: { error: `Columns don't match the ${dataType.toLowerCase()} template. Expected: ${columns.join(', ')}.` } };
  }

  const records = dataRows
    .filter((r) => r.some((cell) => cell.trim() !== ''))
    .map((r) => Object.fromEntries(columns.map((col, i) => [col, (r[i] ?? '').trim()])));

  let status = 'Received — pending review';

  if (dataType === 'Financial spend') {
    let written = 0;
    const skipped: string[] = [];
    for (const [index, rec] of records.entries()) {
      const project = await prisma.project.findUnique({ where: { code: rec.project_code } });
      const amount = Number(rec.amount_naira);
      // Named rather than counted. A silent skip leaves someone comparing totals by hand
      // to work out which row the system quietly dropped, and why.
      if (!project) {
        skipped.push(`row ${index + 2}: no project with code "${rec.project_code}"`);
        continue;
      }
      if (!Number.isFinite(amount)) {
        skipped.push(`row ${index + 2}: amount_naira "${rec.amount_naira}" is not a plain number`);
        continue;
      }
      await prisma.spendEntry.create({
        data: {
          projectId: project.id,
          periodMonth: rec.month,
          pillar: rec.programme_pillar,
          amountNgn: amount,
          fundingSource: rec.funding_source,
          notes: rec.notes || null,
        },
      });
      written++;
    }
    status =
      skipped.length === 0
        ? `${written} of ${records.length} rows written to spend records`
        : `${written} of ${records.length} rows written. Skipped — ${skipped.slice(0, 5).join('; ')}${skipped.length > 5 ? `; and ${skipped.length - 5} more` : ''}`;
  }

  const created = await prisma.bulkUpload.create({
    data: { filename, dataType, projectId, rowCount: records.length, status, uploadedById: uploadedBy.id },
  });

  return { status: 201, body: { id: created.id, rowCount: created.rowCount, status: created.status } };
}
