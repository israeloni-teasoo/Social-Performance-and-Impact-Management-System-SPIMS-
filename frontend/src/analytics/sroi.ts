import { DEFAULT_SROI_ASSUMPTIONS, VALUE_PROXIES } from '../data/valueProxies';
import type { SroiAssumptions, ValueProxy } from '../data/valueProxies';
import type { Project, ProjectImpact } from '../types';

/**
 * Social return on investment, calculated rather than asserted.
 *
 * Part of the analytics layer, under the same rule as everything else in it: the figure
 * is computed here and nowhere else, and it carries its workings.
 *
 * **Method.** The standard one — Social Value International's, as used by every
 * published SROI study. The value created is estimated by applying a financial proxy to
 * the outcome, deducting what would have happened anyway (deadweight) and what belongs
 * to other people (attribution), decaying the remainder each year (drop-off), and
 * discounting future years back to today's money. The ratio is that present value
 * divided by what was spent:
 *
 *     SROI = Σ  beneficiaries × proxy × (1−deadweight) × (1−attribution) × (1−dropOff)^(n−1)
 *            n          ÷ (1 + discount)^n
 *            ─────────────────────────────────────────────────────────────────────────
 *                                      amount invested
 *
 * **Why it is reported as a range.** One number from an unvalidated proxy invites a
 * precision nobody has earned. The range is the same calculation with the proxy moved
 * either way by a stated amount, so a reader sees how much the answer depends on the
 * assumption rather than having to take it on trust.
 *
 * **What it is not.** It is not a Seplat figure and must never be presented as one. Every
 * surface that shows it shows the proxy, the deductions and the source alongside, and
 * says it is illustrative until Seplat's M&E function validates the proxy. A programme
 * with no proxy, no recorded spend or no count of people served returns `null` — an
 * unanswerable question is reported as unanswered, never as zero.
 */

export interface SroiWorking {
  year: number;
  /** Value created in that year, before discounting. */
  gross: number;
  /** The same value brought back to today's money. */
  presentValue: number;
}

export interface SroiEstimate {
  /** Naira of social value for each naira invested, e.g. 0.69. */
  ratio: number;
  /** The same figure with the proxy moved down and up by its stated uncertainty. */
  low: number;
  high: number;
  /** Ready to print: "₦0.69 per ₦1". */
  display: string;
  /** Total present value of the social value created, in naira. */
  presentValueNgn: number;
  investmentNgn: number;
  beneficiaries: number;
  proxy: ValueProxy;
  assumptions: SroiAssumptions;
  workings: SroiWorking[];
  /** One sentence a reader can check the arithmetic against. */
  calculation: string;
  /** Why this is not yet a figure to publish externally. */
  caveat: string;
}

/** Why no estimate could be made, in words that say what is missing. */
export type SroiGap =
  | 'no recorded spend'
  | 'no count of people served'
  | 'no financial proxy for this pillar';

export interface SroiUnavailable {
  ratio: null;
  /** What is missing, so the screen can ask for it rather than showing a dash. */
  missing: SroiGap;
}

export type SroiResult = SroiEstimate | SroiUnavailable;

export function isSroiEstimate(result: SroiResult | undefined): result is SroiEstimate {
  return Boolean(result && result.ratio !== null);
}

function presentValue(
  beneficiaries: number,
  annualValue: number,
  proxyDurationYears: number,
  a: SroiAssumptions,
): { total: number; workings: SroiWorking[] } {
  const perYearAtFull = beneficiaries * annualValue * (1 - a.deadweight) * (1 - a.attribution);
  const workings: SroiWorking[] = [];
  let total = 0;
  for (let year = 1; year <= proxyDurationYears; year++) {
    const gross = perYearAtFull * (1 - a.dropOff) ** (year - 1);
    const pv = gross / (1 + a.discountRate) ** year;
    workings.push({ year, gross, presentValue: pv });
    total += pv;
  }
  return { total, workings };
}

export interface SroiInput {
  /** What was spent, in naira. */
  investmentNgn: number;
  /** How many people actually received the intervention — never the reach figure. */
  beneficiaries: number;
  pillar: string;
  assumptions?: SroiAssumptions;
}

export function estimateSroi(input: SroiInput): SroiResult {
  const a = input.assumptions ?? DEFAULT_SROI_ASSUMPTIONS;
  if (!(input.investmentNgn > 0)) return { ratio: null, missing: 'no recorded spend' };
  if (!(input.beneficiaries > 0)) return { ratio: null, missing: 'no count of people served' };

  const proxy = VALUE_PROXIES[input.pillar];
  if (!proxy) return { ratio: null, missing: 'no financial proxy for this pillar' };

  const central = presentValue(input.beneficiaries, proxy.annualValueNgn, proxy.durationYears, a);
  const low = presentValue(input.beneficiaries, proxy.annualValueNgn * (1 - a.proxyUncertainty), proxy.durationYears, a);
  const high = presentValue(input.beneficiaries, proxy.annualValueNgn * (1 + a.proxyUncertainty), proxy.durationYears, a);

  const round = (n: number) => Math.round((n / input.investmentNgn) * 100) / 100;
  const ratio = round(central.total);

  return {
    ratio,
    low: round(low.total),
    high: round(high.total),
    display: `₦${ratio.toFixed(2)} per ₦1`,
    presentValueNgn: central.total,
    investmentNgn: input.investmentNgn,
    beneficiaries: input.beneficiaries,
    proxy,
    assumptions: a,
    workings: central.workings,
    calculation:
      `${input.beneficiaries} people × ₦${proxy.annualValueNgn.toLocaleString('en-NG')} a year, ` +
      `less ${Math.round(a.deadweight * 100)}% deadweight and ${Math.round(a.attribution * 100)}% attribution, ` +
      `decaying ${Math.round(a.dropOff * 100)}% a year over ${proxy.durationYears} year${proxy.durationYears === 1 ? '' : 's'} ` +
      `and discounted at ${(a.discountRate * 100).toFixed(1)}%, divided by ₦${Math.round(input.investmentNgn).toLocaleString('en-NG')} spent.`,
    caveat:
      'Illustrative. The financial proxy has not been validated by Seplat’s M&E function, and the deductions are the conventional starting assumptions rather than measurements of this programme.',
  };
}

/** The estimate for one programme, from what the system already holds about it. */
export function sroiForProject(project: Project, impact: ProjectImpact | undefined): SroiResult {
  return estimateSroi({
    // The recorded spend as a figure, not the "₦3.44M" label on the inputs line: reading
    // that back reintroduces the rounding that put a project which spent its budget to the
    // naira at 101% utilised.
    investmentNgn: impact?.spentNgn ?? 0,
    beneficiaries: impact?.reach?.directBeneficiaries ?? 0,
    pillar: project.pillar,
  });
}

/* ------------------------------------------------------- what the figures mean later */

/**
 * The outcome projected forward, in the form Seplat's own report uses.
 *
 * Their 2025 report does not compute a return; it states an assumption and projects from
 * it — "if as little as 10% of impacted students leverage these skills for income
 * generation within 10 years, that would add between 31,250 and 93,750 economically
 * active youths". This is the same move, with the assumption named and the arithmetic
 * reproducible, and it is what gives a thin completion file a real impact section:
 * the depth comes from stated assumptions carried through, not from longer prose.
 *
 * Conservative and high-impact are the proxy moved either way by its stated uncertainty —
 * not two different stories, one range honestly drawn.
 */
export interface ImpactProjection {
  scenarios: { horizon: string; conservative: string; highImpact: string }[];
  basis: string;
}

function money(naira: number): string {
  if (naira >= 1_000_000) {
    const millions = naira / 1_000_000;
    return millions >= 1000 ? `₦${(millions / 1000).toFixed(2)}B` : `₦${Number(millions.toFixed(2))}M`;
  }
  return `₦${Math.round(naira).toLocaleString('en-NG')}`;
}

/** Year one, undiscounted — the figure a reader can check against a household. */
function firstYear(e: SroiEstimate, proxyMultiplier: number): number {
  return (
    e.beneficiaries *
    e.proxy.annualValueNgn *
    proxyMultiplier *
    (1 - e.assumptions.deadweight) *
    (1 - e.assumptions.attribution)
  );
}

export function projectionFor(e: SroiEstimate): ImpactProjection {
  const u = e.assumptions.proxyUncertainty;
  const years = e.proxy.durationYears;
  return {
    scenarios: [
      {
        horizon: 'First year',
        conservative: money(firstYear(e, 1 - u)),
        highImpact: money(firstYear(e, 1 + u)),
      },
      {
        horizon: `Over ${years} year${years === 1 ? '' : 's'}`,
        conservative: money(e.presentValueNgn * (1 - u)),
        highImpact: money(e.presentValueNgn * (1 + u)),
      },
    ],
    basis:
      `${e.proxy.basis} for the ${e.beneficiaries} people served, at ₦${e.proxy.annualValueNgn.toLocaleString('en-NG')} ` +
      `a person a year, less ${Math.round(e.assumptions.deadweight * 100)}% deadweight and ` +
      `${Math.round(e.assumptions.attribution * 100)}% attribution and decaying ` +
      `${Math.round(e.assumptions.dropOff * 100)}% a year. Later years are discounted at ` +
      `${(e.assumptions.discountRate * 100).toFixed(1)}% to today’s money. The two columns are the same ` +
      `calculation with the proxy moved ${Math.round(u * 100)}% either way — not two different stories. ` +
      `Illustrative: the proxy is not yet validated by Seplat’s M&E function.`,
  };
}

/** Every figure this module states for a programme, for the report validator's verified set. */
export function projectedFigures(result: SroiResult): number[] {
  if (!isSroiEstimate(result)) return [];
  const u = result.assumptions.proxyUncertainty;
  return [
    firstYear(result, 1 - u),
    firstYear(result, 1 + u),
    result.presentValueNgn * (1 - u),
    result.presentValueNgn * (1 + u),
    result.presentValueNgn,
    // The two inputs the workings quote by name. They are stated in the report precisely
    // so a reader can check the arithmetic, so the validator must recognise them or it
    // flags the very transparency it exists to encourage.
    result.proxy.annualValueNgn,
    result.investmentNgn,
  ].map((n) => Math.round(n));
}
