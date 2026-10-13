/**
 * The executive dashboard's figures move with the data.
 *
 *   npm run test:portfolio
 *
 * They did not. The social investment total, the host-community count, the SROI ratio,
 * community satisfaction, the share of the social aspiration achieved, the spend split by
 * pillar and by state, the four "who benefited" percentages, the compliance tally and the
 * high-risk count were all constants in the view file. Adding a project changed none of
 * them, which is the most expensive kind of wrong: the first screen an executive opens,
 * showing figures nobody can trace to a record.
 *
 * So these checks do two things. They assert each figure is computed from the portfolio —
 * change the portfolio, the figure changes — and they read the view file back to assert
 * no currency or percentage literal has crept into it again.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { communitiesFor, deliveryFor, demographicsFor, moneyFor, outcomesFor, sroiFor, statesFor } from '../frontend/src/analytics/portfolio';
import type { Project, ProjectImpact } from '../frontend/src/types';

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

function project(over: Partial<Project> & { code: string }): Project {
  return {
    id: over.code,
    name: `${over.code} programme`,
    output: 'something delivered',
    pillar: 'Economic Emp.',
    state: 'Edo',
    budget: '₦10M',
    utilPct: '',
    progress: '',
    progPct: '',
    status: 'On track',
    ...over,
  };
}

function impact(over: Partial<ProjectImpact> & { projectCode: string }): ProjectImpact {
  return {
    inputs: '',
    activities: '',
    outputHeadline: '',
    outcome: '',
    impactHeadline: '',
    impactFigure: '',
    impactFigureLabel: '',
    impactPoints: [],
    methodology: { metric: '', calculation: '', source: '', note: '' },
    baseline: [],
    baselineCaption: '',
    dualLens: [],
    costPerOutcome: '',
    sroi: '',
    contactPerson: '',
    communitiesImpacted: [],
    ...over,
  };
}

const served = (n: number) => ({ total: n, label: '', channels: [], directBeneficiaries: n, note: '' });

console.log('\nPortfolio figures');

test('social investment is the sum of the budgets, and moves when one is added', () => {
  const one = moneyFor([project({ code: 'A', budget: '₦10M' })], {});
  const two = moneyFor([project({ code: 'A', budget: '₦10M' }), project({ code: 'B', budget: '₦5M' })], {});
  assert.equal(one.budgetMillions, 10);
  assert.equal(two.budgetMillions, 15);
});

test('the exact budget figure wins over the rounded label', () => {
  // "₦3.44M" parses back as ₦3,440,000, which showed a project that spent its budget to
  // the naira as 100.1% utilised on the dashboard.
  const projects = [project({ code: 'A', budget: '₦3.44M', budgetNgn: 3_443_000 })];
  const money = moneyFor(projects, { A: impact({ projectCode: 'A', spentNgn: 3_443_000 }) });
  assert.equal(money.utilisedPct, 100);
});

test('recorded spend counts only programmes that recorded it, and against their budgets', () => {
  const projects = [project({ code: 'A', budget: '₦10M' }), project({ code: 'B', budget: '₦90M' })];
  const money = moneyFor(projects, { A: impact({ projectCode: 'A', spentNgn: 5_000_000 }) });
  assert.equal(money.spentMillions, 5);
  assert.equal(money.programmesWithRecordedSpend, 1);
  // 5 of A's 10, not 5 of the portfolio's 100 — B has not reported, which is not underspend.
  assert.equal(money.utilisedPct, 50);
});

test('a programme in two states is counted in each, and the split says so', () => {
  const money = moneyFor([project({ code: 'A', state: 'Edo · Delta', budget: '₦10M' })], {});
  assert.deepEqual(money.byState.map((s) => s.label).sort(), ['Delta', 'Edo']);
  assert.equal(money.byState[0]?.sharePct, 50);
});

test('who benefited leaves out programmes that reported no breakdown', () => {
  const projects = [project({ code: 'A' }), project({ code: 'B' })];
  const impacts = {
    A: impact({ projectCode: 'A', reach: served(10), benefited: { female: 10, male: 0 } }),
    B: impact({ projectCode: 'B', reach: served(90) }),
  };
  const people = demographicsFor(projects, impacts);
  // Counting B as all-zero would make this 10% female, a finding about the paperwork
  // presented as a finding about the people.
  assert.equal(people.benefited, 10);
  assert.equal(people.female, 10);
  assert.equal(people.programmesReporting, 1);
  assert.equal(people.programmesTotal, 2);
});

test('the social return aggregates the programmes that can be estimated', () => {
  const projects = [project({ code: 'A' }), project({ code: 'B' })];
  const impacts = {
    A: impact({ projectCode: 'A', spentNgn: 3_443_000, reach: served(10) }),
    B: impact({ projectCode: 'B' }),
  };
  const sroi = sroiFor(projects, impacts);
  assert.ok(sroi);
  assert.equal(sroi.programmes, 1);
  assert.equal(sroi.investmentNgn, 3_443_000);
  assert.ok(sroi.ratio > 0 && sroi.ratio < 2, `${sroi.ratio} is not a plausible ratio`);
  assert.equal(sroiFor(projects, {}), null, 'nothing to estimate from must be null, never zero');
});

test('host communities are counted once however they are spelled', () => {
  // The completion file writes "Ehor, Edo" and the project record writes "Ehor". Taking
  // the union of the raw strings reported four communities for a project working in two.
  const projects = [project({ code: 'A', community: 'Ehor; Obagie' }), project({ code: 'B' })];
  const impacts = {
    A: impact({ projectCode: 'A', communitiesImpacted: ['Ehor, Edo', 'Obagie, Edo'] }),
    B: impact({ projectCode: 'B', communitiesImpacted: ['ehor, edo'] }),
  };
  assert.deepEqual(communitiesFor(projects, impacts), ['Ehor, Edo', 'Obagie, Edo']);
});

test('delivery risk is counted from project status, not invented', () => {
  const delivery = deliveryFor([
    project({ code: 'A', status: 'At risk' }),
    project({ code: 'B', status: 'Delayed' }),
    project({ code: 'C', status: 'On track' }),
    project({ code: 'D', status: 'Completed' }),
  ]);
  assert.equal(delivery.needingAttention, 2);
  assert.equal(delivery.completed, 1);
  assert.equal(deliveryFor([]).needingAttention, 0);
});

test('states are de-duplicated, and a multi-state label is not a state', () => {
  const states = statesFor([
    project({ code: 'A', state: 'Edo · Delta' }),
    project({ code: 'B', state: 'Edo' }),
    project({ code: 'C', state: 'Multi-state' }),
  ]);
  assert.deepEqual(states, ['Delta', 'Edo']);
});

test('what changed comes from recorded outcomes, largest first', () => {
  const projects = [project({ code: 'A' }), project({ code: 'B' }), project({ code: 'C' })];
  const impacts = {
    A: impact({ projectCode: 'A', outcome: 'small', reach: served(5) }),
    B: impact({ projectCode: 'B', outcome: 'large', reach: served(500) }),
    C: impact({ projectCode: 'C' }),
  };
  const outcomes = outcomesFor(projects, impacts);
  // Every programme that recorded one, not a sample of three: the headline band reports
  // how many there are, and showing three of forty as "what changed" is an arbitrary pick.
  assert.deepEqual(outcomes.map((o) => o.code), ['B', 'A']);
  assert.equal(outcomesFor(projects, {}).length, 0, 'no record means nothing to show, not a placeholder');
});

console.log('\nThe view file holds no figures of its own');

test('no naira amount or percentage is written into the dashboard', () => {
  const source = readFileSync(new URL('../frontend/src/views/ExecutiveDashboard.tsx', import.meta.url), 'utf8');
  const money = [...source.matchAll(/₦\s?\d[\d.,]*/g)]
    .map((m) => m[0])
    // "₦1" on its own is the denominator of the social return — "social value per ₦1" —
    // which is a unit, not a figure. Anything else is an amount.
    .filter((amount) => amount !== '₦1');
  assert.deepEqual(money, [], `currency literals are back in the dashboard: ${money.join(', ')}`);
  // A percentage sitting in JSX text, e.g. >78%< — CSS values and template expressions
  // are not caught by this and do not need to be.
  const percents = [...source.matchAll(/>\s*\d+(?:\.\d+)?%\s*</g)].map((m) => m[0].trim());
  assert.deepEqual(percents, [], `percentage literals are back in the dashboard: ${percents.join(', ')}`);
});

console.log(failures === 0 ? '\nEvery dashboard figure is computed from the portfolio.\n' : `\n${failures} check(s) failed.\n`);
process.exit(failures === 0 ? 0 : 1);
