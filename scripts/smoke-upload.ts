/**
 * Drives the two project uploads against a real database and checks what landed.
 *
 *   DATABASE_URL=postgresql://… npm run smoke:upload
 *
 * This exists because of the failure it catches. The upload said "received — pending
 * review", counted the rows, and stored none of them; the screen that would have shown
 * the result read its figures from whatever it had fetched at load time, so nothing
 * looked wrong anywhere. The only way to tell a write from a well-worded message is to
 * read the records back.
 *
 * So it uploads a master-data file, then a completion file for the same project, then
 * asserts on the stored row — including the fields deliberately left empty, because an
 * empty field and a field nobody filled in are different claims and the interface shows
 * them differently.
 *
 * It writes to whatever database DATABASE_URL names and cleans up after itself, so point
 * it at a scratch database, never at the deployment.
 */

import assert from 'node:assert/strict';
import { budgetToMillions } from '../frontend/src/analytics/metrics';
import { bulkUploadHandler } from '../server/handlers/bulkUpload';
import { listProjectImpactsHandler, listProjectsHandler } from '../server/handlers/content';
import { prisma } from '../server/lib/db';
import type { Project, ProjectImpact } from '../frontend/src/types';
import type { User } from '@prisma/client';

const CODE = 'SMOKEUP';
const BUDGET = 3_443_000;
const SPEND = 3_443_000;

let failures = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ok    ${name}`);
  } catch (error) {
    failures += 1;
    console.log(`  FAIL  ${name}`);
    console.log(`        ${(error as Error).message.split('\n')[0]}`);
  }
}

function csv(rows: string[][]): string {
  return rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
}

/** Filled by column name, so a reordered template still exercises the same values. */
const MASTER_ROW: Record<string, string> = {
  project_code: CODE,
  project_name: 'Smoke Poultry Starter Pack',
  programme_pillar: 'Economic Emp.',
  person_responsible: '',
  community: 'Ehor; Obagie',
  local_government_area: 'Uhunmwonde',
  state: 'Edo',
  start_date: '2026-01-01',
  end_date: '2026-06-30',
  budget_naira: String(BUDGET),
  funding_source: 'Seplat Energy Plc',
};

const COMPLETION_ROW: Record<string, string> = {
  project_code: CODE,
  date_completed: '2026-06-30',
  total_spent_naira: String(SPEND),
  what_was_delivered: '10 laying birds, feed and a cage per participant',
  what_changed_as_a_result: 'Participants now keep laying birds and sell eggs',
  people_reached: '13',
  who_was_reached: 'People invited to the training',
  how_they_were_reached: 'Community training invitations',
  people_who_benefited: '10',
  what_they_received: 'Birds, feed, a cage and six days of training',
  why_the_two_numbers_differ: 'Three invitees did not complete the training',
  communities: 'Ehor, Edo; Obagie, Edo',
  // A good result that reads as zero progress if a chart is drawn from the text.
  measure_before: '0% mortality',
  measure_after: '0% mortality',
  what_was_measured: 'Bird mortality across the cohort',
  where_the_figures_come_from: 'Completion report and payment vouchers',
  what_we_learned: 'Start the feed supply before the birds arrive',
};

/** One data row in the template's own column order, so the order is never assumed. */
function rowFor(columns: string[], values: Record<string, string>): string[] {
  for (const name of Object.keys(values)) {
    assert.ok(columns.includes(name), `the template no longer has a "${name}" column — update this harness`);
  }
  return columns.map((c) => values[c] ?? '');
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log('\nsmoke:upload needs DATABASE_URL pointing at a scratch database.\n');
    process.exit(1);
  }

  // The columns are read from the template at run time, so a renamed heading fails here
  // rather than silently skipping every row — the same trap smoke:templates guards.
  const { UPLOAD_TEMPLATES, columnsOf } = await import('../frontend/src/data/uploadTemplates');
  const master = columnsOf(UPLOAD_TEMPLATES['Project master data']);
  const completion = columnsOf(UPLOAD_TEMPLATES['Project completion']);

  const uploader = (await prisma.user.findFirst()) ?? null;
  const user: User =
    uploader ??
    (await prisma.user.create({
      data: {
        email: `smoke-upload-${Date.now()}@example.invalid`,
        passwordHash: 'not-a-usable-hash',
        name: 'Smoke Upload',
        role: 'exec',
        roleLabel: 'Executive',
        initials: 'SU',
      },
    }));

  await prisma.project.deleteMany({ where: { code: CODE } });

  const masterCsv = csv([master, rowFor(master, MASTER_ROW)]);

  const masterResult = await bulkUploadHandler(
    { filename: 'smoke-master.csv', dataType: 'Project master data', projectId: null, csvText: masterCsv },
    user,
  );

  console.log('\nMaster data');
  console.log(`        status: ${(masterResult.body as { status?: string }).status ?? ''}`);

  test('the row is written, and says so', () => {
    assert.equal(masterResult.status, 201);
    assert.match(String((masterResult.body as { status: string }).status), /^1 of 1 row written to projects/);
  });

  const stored = await prisma.project.findUniqueOrThrow({ where: { code: CODE } });

  test('the budget is kept as a figure, not only as a label', () => {
    assert.equal(stored.budgetNgn, BUDGET);
  });

  test('the budget label survives being parsed back', () => {
    // budgetToMillions reads digits as millions, so a label of "₦3,443,000" would be
    // charted as ₦3.44 trillion. Within a tenth of a percent is close enough for a chart.
    const parsed = budgetToMillions(stored.budget) * 1_000_000;
    assert.ok(Math.abs(parsed - BUDGET) / BUDGET < 0.001, `${stored.budget} parses back as ${parsed}`);
  });

  test('utilisation and progress are recorded as unset, not as zero', () => {
    assert.equal(stored.utilPct, '', 'a master-data file says nothing about utilisation');
    assert.equal(stored.progress, '', 'nor about progress');
    assert.equal(stored.progPct, '');
  });

  const completionCsv = csv([completion, rowFor(completion, COMPLETION_ROW)]);

  const completionResult = await bulkUploadHandler(
    { filename: 'smoke-completion.csv', dataType: 'Project completion', projectId: null, csvText: completionCsv },
    user,
  );

  console.log('\nCompletion');
  console.log(`        status: ${(completionResult.body as { status?: string }).status ?? ''}`);

  test('the impact record is written, and says so', () => {
    assert.equal(completionResult.status, 201);
    assert.match(String((completionResult.body as { status: string }).status), /^1 of 1 row written to project impact records/);
  });

  test('the upload reports the utilisation it changed', () => {
    assert.match(String((completionResult.body as { status: string }).status), /Utilisation updated to 100%/);
  });

  const afterCompletion = await prisma.project.findUniqueOrThrow({ where: { code: CODE } });

  test('utilisation is computed from recorded spend against the exact budget', () => {
    // The whole reason budgetNgn exists: against the rounded label this came out at 101%.
    assert.equal(afterCompletion.utilPct, '100%');
  });

  test('progress and status are left to a person', () => {
    assert.equal(afterCompletion.progress, '', 'a completion file does not decide a project is finished');
    assert.equal(afterCompletion.status, 'On track');
  });

  test('the delivered output reaches the project, where the portfolio reads it', () => {
    assert.match(afterCompletion.output, /laying birds/);
  });

  // Read back through the serialiser the frontend actually calls. A column that is stored
  // and never named there is invisible, which is how the lessons field was lost.
  const projects = (await listProjectsHandler()).body as Project[];
  const impacts = (await listProjectImpactsHandler()).body as Record<string, ProjectImpact>;
  const served = projects.find((p) => p.code === CODE);
  const impact = impacts[CODE];

  test('the project is served to the browser', () => {
    assert.ok(served, 'the project never reached the list the portfolio reads');
    assert.equal(served?.utilPct, '100%');
  });

  test('every field the project page reads is served', () => {
    assert.ok(impact, 'the impact record never reached the browser');
    // Compact, so the validator has nothing to reconcile it against in a report.
    assert.match(impact.inputs, /₦3\.44M/);
    assert.equal(impact.costPerOutcome, '₦344,300 per person');
    assert.ok(impact.lessons, 'what the team learned was stored and not served');
    assert.equal(impact.reach?.total, 13);
    assert.equal(impact.reach?.directBeneficiaries, 10);
  });

  test('SROI stays empty, and the page is responsible for saying why', () => {
    // Not a defect. An SROI needs a financial proxy nobody has validated, and the card
    // reads "Not calculated — needs a validated financial proxy for this outcome".
    assert.equal(impact.sroi, '');
  });

  test('a written before-and-after measure carries no invented bar height', () => {
    // "0% mortality" is a good result. Read as a percentage it charted as no progress.
    assert.deepEqual(
      impact.baseline.map((b) => b.pct),
      [0, 0],
    );
    assert.equal(impact.baseline[0]?.value, '0% mortality');
  });

  await prisma.project.deleteMany({ where: { code: CODE } });
  await prisma.bulkUpload.deleteMany({ where: { filename: { startsWith: 'smoke-' } } });
  if (!uploader) await prisma.user.delete({ where: { id: user.id } });

  console.log(failures === 0 ? '\nBoth uploads wrote what they claimed to write.\n' : `\n${failures} check(s) failed.\n`);
  process.exit(failures === 0 ? 0 : 1);
}

await main();
