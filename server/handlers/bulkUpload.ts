import { TEMPLATE_COMMENT, UPLOAD_TEMPLATES, columnsOf } from '../../frontend/src/data/uploadTemplates.js';
import { parseCsv } from '../lib/csv.js';
import { prisma } from '../lib/db.js';
import type { HandlerResult } from '../lib/types.js';
import type { User } from '@prisma/client';

/**
 * Bulk upload.
 *
 * Three of the five data types now write through to live records: financial spend,
 * project master data and project completion. The other two — beneficiary counts and
 * activity logs — are validated and logged but not written, because nobody has yet
 * decided how a day's count should combine with a project's running totals (replace?
 * add? supersede an earlier upload for the same date?). That is a Seplat decision, not
 * an engineering one.
 *
 * What matters is that the difference is **stated**. The status used to read "Received —
 * pending review" for everything that did not write through, which named a review that
 * does not exist: there is no reviewer, no queue and no screen. A file would be accepted,
 * counted, and its contents discarded, while the message implied somebody would pick it
 * up. An upload that stores nothing has to say so.
 */

const PILLARS = ['Education', 'Health', 'Infrastructure', 'Economic Emp.'];

/** Types that are parsed and logged but whose rows are not stored anywhere. */
const LOGGED_ONLY: Record<string, string> = {
  'Beneficiary counts':
    'Validated and logged only — these rows are not written to project records yet, because how a daily count should combine with a project total has not been decided.',
  'Activity logs':
    'Validated and logged only — these rows are not written to project records yet, because how a logged activity should combine with a project total has not been decided.',
};

function digits(value: string): number {
  return Number(String(value).replace(/[^\d.-]/g, ''));
}

/**
 * Formats naira as the compact string the rest of the system expects.
 *
 * `budgetToMillions` strips every non-digit and reads what is left as millions, so a
 * budget stored as "₦3,443,000" would be charted as ₦3.4 million million. The display
 * string is the storage format here, and it has to stay in that shape.
 */
function nairaLabel(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return '₦0';
  const millions = amount / 1_000_000;
  if (millions >= 1000) return `₦${(millions / 1000).toFixed(2)}B`;
  if (millions >= 10) return `₦${Math.round(millions)}M`;
  if (millions >= 1) return `₦${millions.toFixed(1)}M`;
  return `₦${Math.round(amount).toLocaleString('en-NG')}`;
}

/** Splits a semicolon-separated cell. */
function list(value: string): string[] {
  return value
    .split(';')
    .map((v) => v.trim())
    .filter(Boolean);
}

/**
 * Reads a percentage out of a free-text measure, for the before/after chart.
 *
 * Only an explicit percentage counts. Inferring one from "no participant was keeping
 * laying birds" would be drawing a chart from a guess, and a wrong bar is worse than a
 * flat one — so anything without a stated percentage charts as zero and the written
 * measure carries the meaning.
 */
function percentIn(text: string): number {
  const match = /(\d+(?:\.\d+)?)\s*%/.exec(text);
  return match ? Number(match[1]) : 0;
}

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

  let status = LOGGED_ONLY[dataType] ?? 'Received — pending review';
  let written = 0;
  const skipped: string[] = [];

  /** Reported rather than counted: a silent skip leaves someone reconciling by hand. */
  const skip = (index: number, why: string) => skipped.push(`row ${index + 2}: ${why}`);

  if (dataType === 'Financial spend') {
    for (const [index, rec] of records.entries()) {
      const project = await prisma.project.findUnique({ where: { code: rec.project_code } });
      const amount = Number(rec.amount_naira);
      if (!project) {
        skip(index, `no project with code "${rec.project_code}"`);
        continue;
      }
      if (!Number.isFinite(amount)) {
        skip(index, `amount_naira "${rec.amount_naira}" is not a plain number`);
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
    status = describe(written, records.length, 'spend records', skipped);
  }

  if (dataType === 'Project master data') {
    for (const [index, rec] of records.entries()) {
      const code = rec.project_code.toUpperCase().replace(/[^A-Z0-9_-]/g, '');
      if (!code) {
        skip(index, 'project_code is missing');
        continue;
      }
      if (!rec.project_name) {
        skip(index, 'project_name is missing');
        continue;
      }
      if (!PILLARS.includes(rec.programme_pillar)) {
        skip(index, `programme_pillar "${rec.programme_pillar}" is not one of ${PILLARS.join(', ')}`);
        continue;
      }
      if (!rec.state) {
        skip(index, 'state is missing');
        continue;
      }

      const budget = nairaLabel(digits(rec.budget_naira));
      const shared = {
        name: rec.project_name,
        pillar: rec.programme_pillar,
        state: rec.state,
        budget,
        startDate: rec.start_date || null,
        endDate: rec.end_date || null,
        fundingSource: rec.funding_source || null,
        contractor: rec.contractor || null,
        partner: rec.implementing_partner || null,
        community: rec.community || null,
        lga: rec.local_government_area || null,
        owner: rec.person_responsible || null,
      };

      // Upserted, so re-uploading a corrected file fixes the record rather than being
      // refused as a duplicate — which is how a spreadsheet actually gets used.
      await prisma.project.upsert({
        where: { code },
        create: {
          id: code,
          code,
          ...shared,
          output: 'No outputs recorded yet',
          utilPct: '0%',
          progress: '0%',
          progPct: '0%',
          status: 'On track',
        },
        update: shared,
      });
      written++;
    }
    status = describe(written, records.length, 'projects created or updated', skipped);
  }

  if (dataType === 'Project completion') {
    for (const [index, rec] of records.entries()) {
      const project = await prisma.project.findUnique({ where: { code: rec.project_code } });
      if (!project) {
        skip(index, `no project with code "${rec.project_code}" — upload the project master data first`);
        continue;
      }

      const benefited = digits(rec.people_who_benefited);
      const reached = digits(rec.people_reached);
      const spend = digits(rec.total_spent_naira);

      const impact = {
        projectCode: project.code,
        inputs: spend > 0 ? nairaLabel(spend) : 'Not recorded',
        activities: rec.what_they_received,
        outputHeadline: rec.what_was_delivered,
        outcome: rec.what_changed_as_a_result,
        reach: Number.isFinite(reached) && reached > 0
          ? {
              total: reached,
              label: rec.who_was_reached,
              channels: rec.how_they_were_reached ? [{ label: rec.how_they_were_reached, value: reached }] : [],
              directBeneficiaries: benefited,
              note: rec.why_the_two_numbers_differ,
            }
          : undefined,
        impactHeadline: rec.what_changed_as_a_result || rec.what_was_delivered,
        impactFigure: rec.people_who_benefited,
        impactFigureLabel: 'people who benefited',
        impactPoints: [] as string[],
        methodology: {
          metric: rec.what_was_measured,
          calculation: '',
          source: rec.where_the_figures_come_from,
          note: '',
        },
        baseline: [
          { label: 'Before', value: rec.measure_before, pct: percentIn(rec.measure_before) },
          { label: 'After', value: rec.measure_after, pct: percentIn(rec.measure_after) },
        ],
        baselineCaption: rec.what_was_measured,
        dualLens: [] as unknown[],
        // Arithmetic, so it is safe to compute. SROI is left empty on purpose: it needs
        // financial proxies nobody has validated, and an invented one would be reported
        // as though it meant something.
        costPerOutcome: spend > 0 && benefited > 0 ? `${nairaLabel(spend / benefited)} per person` : '',
        sroi: '',
        contactPerson: project.owner ?? '',
        communitiesImpacted: list(rec.communities),
        lessons: rec.what_we_learned || null,
      };

      await prisma.projectImpact.upsert({
        where: { projectId: project.id },
        create: { projectId: project.id, ...impact } as never,
        update: impact as never,
      });

      // The headline output belongs on the project itself, where the portfolio reads it.
      // Status is deliberately left alone: a completion file records what happened, and
      // whether the project is closed is an editorial call made on the project page.
      if (rec.what_was_delivered) {
        await prisma.project.update({ where: { id: project.id }, data: { output: rec.what_was_delivered } });
      }
      written++;
    }
    status = describe(written, records.length, 'project impact records', skipped);
    if (written > 0 && skipped.length === 0) {
      status += '. Project status unchanged — set it on the project page if the work is finished.';
    }
  }

  const created = await prisma.bulkUpload.create({
    data: { filename, dataType, projectId, rowCount: records.length, status, uploadedById: uploadedBy.id },
  });

  return { status: 201, body: { id: created.id, rowCount: created.rowCount, status: created.status } };
}

function describe(written: number, total: number, what: string, skipped: string[]): string {
  const head = `${written} of ${total} row${total === 1 ? '' : 's'} written to ${what}`;
  if (skipped.length === 0) return head;
  const shown = skipped.slice(0, 5).join('; ');
  return `${head}. Skipped — ${shown}${skipped.length > 5 ? `; and ${skipped.length - 5} more` : ''}`;
}
