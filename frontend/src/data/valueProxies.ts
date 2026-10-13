/**
 * Financial proxies — what one year of a programme's outcome is worth to one person.
 *
 * **This file is the one place to change when Seplat's M&E function validates its own
 * figures.** Nothing else needs editing: the calculation in `analytics/sroi.ts` reads
 * these, and every screen and report reads the calculation.
 *
 * Every value here is a placeholder. They are stated, sourced and shown on screen rather
 * than hidden in a spreadsheet, so that a reader can disagree with a specific number
 * instead of distrusting the whole figure — which is the only responsible way to publish
 * an SROI before its proxies are agreed.
 *
 * Seplat's published 2025 report does not compute SROI or any return on investment, and
 * sets no proxies; what it does instead is state an assumption and project from it ("if
 * as little as 10% of impacted students leverage these skills…"). The same discipline is
 * applied here: an assumption, named, with the projection visible beside it.
 */

export interface ValueProxy {
  /** What a year of this outcome is worth to one person, in naira. */
  annualValueNgn: number;
  /** What that figure represents, in plain words. Printed beside the result. */
  basis: string;
  /** Where it came from, so it can be challenged. */
  source: string;
  /** How many years the benefit is counted for. Beyond this it is counted as nothing. */
  durationYears: number;
}

/**
 * Per pillar, because a pillar is the coarsest grouping where the outcome is the same
 * kind of thing. A programme that needs its own proxy gets one by pillar today and by
 * programme when Seplat has validated figures worth distinguishing.
 */
export const VALUE_PROXIES: Record<string, ValueProxy> = {
  'Economic Emp.': {
    annualValueNgn: 120_000,
    basis: 'Additional household income a year from the livelihood the programme establishes',
    source:
      'Placeholder. For the poultry cohort it is net of feed: ten point-of-lay birds produce roughly 2,500 eggs a year, against a feed cost of about seventeen 25kg bags. Not validated by Seplat M&E.',
    durationYears: 5,
  },
  Education: {
    annualValueNgn: 150_000,
    basis: 'Earnings uplift a year for a person who gains a marketable skill or completes a supported stage of education',
    source: 'Placeholder, pending Seplat M&E validation. No figure in the published 2025 report to anchor it to.',
    durationYears: 5,
  },
  Health: {
    annualValueNgn: 85_000,
    basis: 'Treatment cost and lost income avoided for a person treated',
    source: 'Placeholder, pending Seplat M&E validation. No figure in the published 2025 report to anchor it to.',
    durationYears: 1,
  },
  Infrastructure: {
    annualValueNgn: 60_000,
    basis: 'Household cost and time saved a year for a person served by the facility',
    source: 'Placeholder, pending Seplat M&E validation. No figure in the published 2025 report to anchor it to.',
    durationYears: 10,
  },
};

/**
 * The four standard deductions, from the Social Value International principles. Every
 * published SROI applies them; omitting them is what turns the ratio into advertising.
 *
 * The values are the conventional starting assumptions used when a programme has no
 * counterfactual data of its own. They are deliberately pessimistic: an SROI that
 * flatters a programme because nobody questioned the deductions is worse than none.
 */
export interface SroiAssumptions {
  /** The share of the outcome that would have happened anyway, without the programme. */
  deadweight: number;
  /** The share properly credited to other people's work. */
  attribution: number;
  /** How much of the benefit is lost each year after the first. */
  dropOff: number;
  /** Used to bring future years back to today's money. */
  discountRate: number;
  /** How far the proxy might be out, either way — the figure is reported as a range. */
  proxyUncertainty: number;
}

export const DEFAULT_SROI_ASSUMPTIONS: SroiAssumptions = {
  deadweight: 0.2,
  attribution: 0.2,
  dropOff: 0.2,
  // HM Treasury Green Book social discount rate, the figure most published SROI studies
  // use. It is a real rate, so it assumes the proxy is in today's money.
  discountRate: 0.035,
  proxyUncertainty: 0.4,
};
