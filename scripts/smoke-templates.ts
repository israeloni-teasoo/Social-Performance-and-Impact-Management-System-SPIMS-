/**
 * Round-trips every upload template through the real parser.
 *
 *   npm run smoke:templates
 *
 * The templates now carry their own instructions as `#` lines, which means the file the
 * system hands out is no longer the shape the parser was written for. This check
 * generates each template exactly as the download button does, then feeds it to the
 * handler's own validation path, so a template that cannot be uploaded unedited fails
 * here rather than in front of whoever was asked to fill it in.
 *
 * It also enforces the wording rules, because those are the point of the exercise and a
 * rule nobody checks is a rule that lasts one commit.
 */

import assert from 'node:assert/strict';
import {
  BULK_UPLOAD_DATA_TYPES,
  TEMPLATE_COMMENT,
  UPLOAD_TEMPLATES,
  columnsOf,
  exampleOf,
  guidanceRows,
} from '../frontend/src/data/uploadTemplates';
import { parseCsv } from '../server/lib/csv';

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

/** The same CSV the download button produces. Kept in step with BulkUpload.tsx. */
function buildTemplateCsv(type: (typeof BULK_UPLOAD_DATA_TYPES)[number]): string {
  const t = UPLOAD_TEMPLATES[type];
  const rows = [columnsOf(t), exampleOf(t), ...guidanceRows(t)];
  return rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
}

/** The header/record logic from bulkUploadHandler, over a parsed file. */
function readAsUpload(csvText: string, columns: string[]) {
  const rows = parseCsv(csvText).filter((r) => !(r[0] ?? '').trim().startsWith(TEMPLATE_COMMENT));
  const [header, ...dataRows] = rows;
  const headerOk =
    header!.length === columns.length && columns.every((col, i) => col.toLowerCase() === header![i]?.trim().toLowerCase());
  const records = dataRows
    .filter((r) => r.some((cell) => cell.trim() !== ''))
    .map((r) => Object.fromEntries(columns.map((col, i) => [col, (r[i] ?? '').trim()])));
  return { headerOk, records };
}

console.log('\nRound trip: download a template, upload it unedited');

for (const type of BULK_UPLOAD_DATA_TYPES) {
  const template = UPLOAD_TEMPLATES[type];
  const columns = columnsOf(template);

  test(`${type} — header is accepted with the instructions left in`, () => {
    const { headerOk } = readAsUpload(buildTemplateCsv(type), columns);
    assert.ok(headerOk, 'header did not match');
  });

  test(`${type} — the instruction lines are not read as data`, () => {
    const { records } = readAsUpload(buildTemplateCsv(type), columns);
    assert.equal(records.length, 1, `expected only the example row, got ${records.length}`);
  });

  test(`${type} — the example row survives intact`, () => {
    const { records } = readAsUpload(buildTemplateCsv(type), columns);
    assert.deepEqual(Object.values(records[0]!), exampleOf(template));
  });

  test(`${type} — still parses with the instructions deleted`, () => {
    const csv = buildTemplateCsv(type)
      .split('\n')
      .filter((l) => !l.replace(/^"/, '').startsWith(TEMPLATE_COMMENT))
      .join('\n');
    const { headerOk, records } = readAsUpload(csv, columns);
    assert.ok(headerOk);
    assert.equal(records.length, 1);
  });
}

console.log('\nWording');

const BANNED = [
  // Acronyms and sector shorthand that mean nothing, or something else, to the person
  // typing into the spreadsheet.
  { pattern: /(^|_)pwd(_|$)/, why: '"pwd" reads as password' },
  { pattern: /(^|_)ngo(_|$)/, why: '"ngo" excludes company and foundation partners' },
  { pattern: /(^|_)lga(_|$)/, why: '"lga" is an acronym — spell it out' },
  { pattern: /endline|midline|baseline/, why: 'monitoring-and-evaluation shorthand' },
  { pattern: /(^|_)m&e(_|$)/, why: '"M&E" is an acronym' },
  { pattern: /disaggregat/, why: 'sector jargon' },
];

for (const type of BULK_UPLOAD_DATA_TYPES) {
  const template = UPLOAD_TEMPLATES[type];

  test(`${type} — no banned terms in any column heading`, () => {
    for (const name of columnsOf(template)) {
      for (const { pattern, why } of BANNED) {
        assert.ok(!pattern.test(name.toLowerCase()), `"${name}": ${why}`);
      }
    }
  });

  test(`${type} — every column says what to put in it`, () => {
    for (const field of template.fields) {
      assert.ok(field.meaning.trim().length > 20, `"${field.name}" has no useful explanation`);
      assert.ok(field.meaning.trim().endsWith('.'), `"${field.name}" explanation should be a sentence`);
    }
  });

  test(`${type} — headings are lower case with underscores only`, () => {
    for (const name of columnsOf(template)) {
      assert.match(name, /^[a-z][a-z0-9_]*$/, `"${name}" is not a plain lower-case heading`);
    }
  });
}

test('the same idea has the same heading in every template', () => {
  // These were the actual drifts: people reached had two names, and the project
  // identifier had two names with two different example formats, so rows uploaded from
  // one template would not have linked to the project created by another.
  for (const type of BULK_UPLOAD_DATA_TYPES) {
    const columns = columnsOf(UPLOAD_TEMPLATES[type]);
    assert.ok(columns.includes('project_code'), `${type} does not identify the project as project_code`);
    assert.ok(!columns.includes('project_id'), `${type} still uses project_id`);
    assert.ok(!columns.includes('total_reached') && !columns.includes('reach_total'), `${type} uses an old reach heading`);
  }
});

test('every template names the project the same way in its example', () => {
  const examples = BULK_UPLOAD_DATA_TYPES.map((type) => {
    const t = UPLOAD_TEMPLATES[type];
    return exampleOf(t)[columnsOf(t).indexOf('project_code')];
  });
  // Short codes, not contract references — a mixture taught people the wrong format.
  for (const value of examples) assert.match(String(value), /^[A-Z]+$/, `"${value}" is not a short project code`);
});

test('reach and benefit are asked for as separate, differently named columns', () => {
  const columns = columnsOf(UPLOAD_TEMPLATES['Project completion']);
  assert.ok(columns.includes('people_reached'));
  assert.ok(columns.includes('people_who_benefited'));
  assert.ok(columns.includes('why_the_two_numbers_differ'), 'the gap must be explained in the file, not inferred');
});

test('the spend template matches the columns the handler writes from', () => {
  // bulkUpload.ts reads these by name. Renaming a column without renaming them there
  // silently skips every row.
  const columns = columnsOf(UPLOAD_TEMPLATES['Financial spend']);
  for (const needed of ['project_code', 'month', 'programme_pillar', 'amount_naira', 'funding_source', 'notes']) {
    assert.ok(columns.includes(needed), `handler expects ${needed}`);
  }
});

console.log(failures === 0 ? '\nEvery template downloads, uploads and reads cleanly.\n' : `\n${failures} check(s) failed.\n`);
process.exit(failures === 0 ? 0 : 1);
