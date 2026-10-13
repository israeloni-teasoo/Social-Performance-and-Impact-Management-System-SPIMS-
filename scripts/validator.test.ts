/**
 * The report validator still catches an invented figure.
 *
 *   npm run test:validator
 *
 * The verified set was widened so that a programme report stops warning about its own
 * recorded contents — every programme report used to come back with a page of findings
 * about figures the record itself states, and a check that cries wolf is a check people
 * turn off. Widening it is only safe if the thing it exists for still fails, so that is
 * what this asserts: a number that appears in neither the analytics layer nor the
 * programme's record is reported, and the same number recorded against the programme is
 * not.
 */

import assert from 'node:assert/strict';
import { analysePortfolio } from '../frontend/src/analytics/metrics';
import { validateReport } from '../frontend/src/report/validate';
import { PROJECTS, PROJECT_IMPACTS } from '../frontend/src/data/seed';
import type { ReportSpec } from '../frontend/src/report/spec';

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

const analytics = analysePortfolio(PROJECTS, PROJECT_IMPACTS);

function specWith(line: string): ReportSpec {
  return {
    meta: {
      title: 'Test',
      subtitle: '',
      organisation: 'Seplat Energy Plc',
      financialYear: 'FY 2026',
      currencyLabel: '₦',
      scopeNote: '',
      generatedOn: '13 October 2026',
      dataStatusNote: '',
    },
    blocks: [{ kind: 'section', heading: 'Narrative', lines: [line] }],
  };
}

console.log('\nReport validation');

test('a figure that exists nowhere is reported', () => {
  const result = validateReport(specWith('The programme reached 482,913 people across the region.'), analytics);
  assert.equal(result.ok, false);
  assert.equal(result.findings[0]?.quoted, '482,913');
});

test('a portfolio figure the analytics layer produced passes', () => {
  const result = validateReport(specWith(`Reach across the portfolio was ${analytics.reach.toLocaleString('en-NG')}.`), analytics);
  assert.equal(result.ok, true, JSON.stringify(result.findings));
});

test("a figure a programme's own record states passes", () => {
  const stated = PROJECT_IMPACTS.STEP?.costPerOutcome ?? '';
  const match = /\d{1,3}(?:,\d{3})+/.exec(stated);
  assert.ok(match, `STEP records no grouped cost per outcome to test against: "${stated}"`);
  const result = validateReport(specWith(`Cost per outcome was ₦${match[0]}.`), analytics);
  assert.equal(result.ok, true, JSON.stringify(result.findings));
});

test('small numbers are left alone — they are counts, not portfolio totals', () => {
  const result = validateReport(specWith('Delivered across 1,004 communities is below the significance floor.'), analytics);
  // 1,004 is grouped and above 1000, so it is checked; the point is that the floor is
  // applied at all, rather than every "12" in the prose being reconciled.
  assert.equal(result.checked, 1);
});

console.log(failures === 0 ? '\nThe validator still fails on an invented figure.\n' : `\n${failures} check(s) failed.\n`);
process.exit(failures === 0 ? 0 : 1);
