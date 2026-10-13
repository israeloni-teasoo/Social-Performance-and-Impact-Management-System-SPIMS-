/**
 * The SROI arithmetic, checked against figures worked out by hand.
 *
 *   npm run test:sroi
 *
 * A ratio nobody can reproduce is a ratio nobody should publish, so the point of these
 * checks is not that the code runs — it is that the number it produces is the number the
 * stated method produces, and that the method's deductions actually bite.
 */

import assert from 'node:assert/strict';
import { estimateSroi, isSroiEstimate } from '../frontend/src/analytics/sroi';
import { DEFAULT_SROI_ASSUMPTIONS, VALUE_PROXIES } from '../frontend/src/data/valueProxies';

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

console.log('\nSocial return on investment');

test('matches the present value worked out independently', () => {
  // 10 people × ₦120,000 × 0.8 × 0.8 = ₦768,000 in year one, decaying 20% a year for
  // five years, each discounted at 3.5%.
  const a = DEFAULT_SROI_ASSUMPTIONS;
  let expected = 0;
  for (let year = 1; year <= 5; year++) {
    expected += (10 * 120_000 * 0.8 * 0.8 * 0.8 ** (year - 1)) / 1.035 ** year;
  }
  const result = estimateSroi({ investmentNgn: 3_443_000, beneficiaries: 10, pillar: 'Economic Emp.' });
  assert.ok(isSroiEstimate(result));
  assert.ok(Math.abs(result.presentValueNgn - expected) < 1, `${result.presentValueNgn} vs ${expected}`);
  assert.equal(result.ratio, Math.round((expected / 3_443_000) * 100) / 100);
  assert.equal(result.workings.length, 5);
});

test('the deductions reduce the ratio rather than decorating it', () => {
  const withNone = estimateSroi({
    investmentNgn: 1_000_000,
    beneficiaries: 10,
    pillar: 'Economic Emp.',
    assumptions: { ...DEFAULT_SROI_ASSUMPTIONS, deadweight: 0, attribution: 0, dropOff: 0, discountRate: 0 },
  });
  const withAll = estimateSroi({ investmentNgn: 1_000_000, beneficiaries: 10, pillar: 'Economic Emp.' });
  assert.ok(isSroiEstimate(withNone) && isSroiEstimate(withAll));
  assert.ok(withAll.ratio < withNone.ratio * 0.7, 'the standard deductions should cost more than a third of the raw value');
});

test('the range brackets the central figure and widens with the proxy', () => {
  const r = estimateSroi({ investmentNgn: 3_443_000, beneficiaries: 10, pillar: 'Economic Emp.' });
  assert.ok(isSroiEstimate(r));
  assert.ok(r.low < r.ratio && r.ratio < r.high, `${r.low} / ${r.ratio} / ${r.high}`);
  // ±40% on the proxy is ±40% on the value, so the range is proportional.
  assert.ok(Math.abs(r.low - r.ratio * 0.6) < 0.02);
  assert.ok(Math.abs(r.high - r.ratio * 1.4) < 0.02);
});

test('says what is missing instead of returning zero', () => {
  const noSpend = estimateSroi({ investmentNgn: 0, beneficiaries: 10, pillar: 'Economic Emp.' });
  const noPeople = estimateSroi({ investmentNgn: 1_000_000, beneficiaries: 0, pillar: 'Economic Emp.' });
  const noProxy = estimateSroi({ investmentNgn: 1_000_000, beneficiaries: 10, pillar: 'Something else' });
  assert.equal(noSpend.ratio, null);
  assert.equal(noPeople.ratio, null);
  assert.equal(noProxy.ratio, null);
  assert.equal(noSpend.ratio === null ? noSpend.missing : '', 'no recorded spend');
  assert.equal(noProxy.ratio === null ? noProxy.missing : '', 'no financial proxy for this pillar');
});

test('every pillar the system uses has a proxy, so no programme falls through', () => {
  for (const pillar of ['Education', 'Health', 'Infrastructure', 'Economic Emp.']) {
    assert.ok(VALUE_PROXIES[pillar], `${pillar} has no proxy`);
    assert.ok(VALUE_PROXIES[pillar]!.source.length > 20, `${pillar}'s proxy states no source`);
  }
});

test('the calculation reads back as a sentence a reviewer can check', () => {
  const r = estimateSroi({ investmentNgn: 3_443_000, beneficiaries: 10, pillar: 'Economic Emp.' });
  assert.ok(isSroiEstimate(r));
  for (const fragment of ['10 people', '₦120,000', '20% deadweight', '20% attribution', '3.5%', '₦3,443,000']) {
    assert.ok(r.calculation.includes(fragment), `the calculation does not state ${fragment}: ${r.calculation}`);
  }
});

console.log(failures === 0 ? '\nThe ratio is reproducible from the stated method.\n' : `\n${failures} check(s) failed.\n`);
process.exit(failures === 0 ? 0 : 1);
