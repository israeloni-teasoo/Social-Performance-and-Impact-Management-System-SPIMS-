import { budgetToMillions } from './metrics';
import { isSroiEstimate, sroiForProject } from './sroi';
import type { Project, ProjectImpact } from '../types';

/**
 * The figures the executive dashboard shows.
 *
 * They were constants in the view: ₦4.68B of social investment, 42 host communities,
 * 3.4× SROI, 78% community satisfaction, 52% of the 2030 aspiration, a spend split by
 * pillar and by state, and "who benefited" as four percentages. None of them moved when
 * a project was added, because none of them came from one — and the first screen an
 * executive opens is the worst possible place for a number that cannot be traced to a
 * record.
 *
 * Everything here is computed from the portfolio. Where the system has no source for a
 * figure at all — community satisfaction was never collected by anything — the figure is
 * gone rather than estimated, and the dashboard says what would have to be connected.
 */

export interface MoneySlice {
  label: string;
  budgetMillions: number;
  sharePct: number;
  programmes: number;
}

export interface PortfolioMoney {
  budgetMillions: number;
  /** Recorded spend, which only completed projects carry. */
  spentMillions: number;
  /** Spend against budget, across the programmes that recorded both. */
  utilisedPct: number;
  programmesWithRecordedSpend: number;
  byPillar: MoneySlice[];
  byState: MoneySlice[];
}

export interface PortfolioDemographics {
  /** People served by the programmes that reported a breakdown — not the portfolio total. */
  benefited: number;
  female: number;
  male: number;
  under35: number;
  livingWithDisability: number;
  programmesReporting: number;
  programmesTotal: number;
}

export interface PortfolioSroi {
  /** Naira of social value per naira invested, across every programme with an estimate. */
  ratio: number;
  presentValueNgn: number;
  investmentNgn: number;
  programmes: number;
}

export interface DeliveryStatus {
  onTrack: number;
  atRisk: number;
  delayed: number;
  completed: number;
  /** At risk plus delayed — the ones an executive is being asked to look at. */
  needingAttention: number;
}

/** One recorded outcome, for the "what changed" band. */
export interface RecordedOutcome {
  code: string;
  name: string;
  pillar: string;
  outcome: string;
  /** The counted figure behind it, when there is one. */
  figure: string;
  figureLabel: string;
}

/**
 * A project's budget in millions, from the figure when there is one.
 *
 * `budget` is a rounded display string: parsing "₦3.44M" back gives ₦3,440,000 for a
 * project budgeted at ₦3,443,000, which showed as 100.1% utilised on a project that spent
 * its budget to the naira. `budgetNgn` is the figure; the label is the fallback for
 * programmes that predate it.
 */
function budgetMillionsOf(project: Project): number {
  const exact = (project as { budgetNgn?: number | null }).budgetNgn;
  return typeof exact === 'number' && exact > 0 ? exact / 1_000_000 : budgetToMillions(project.budget);
}

function share(part: number, whole: number): number {
  return whole === 0 ? 0 : Math.round((part / whole) * 1000) / 10;
}

function slices(
  projects: Project[],
  keyOf: (p: Project) => string,
): MoneySlice[] {
  const by = new Map<string, { budgetMillions: number; programmes: number }>();
  for (const p of projects) {
    for (const label of keyOf(p).split('·').map((k) => k.trim()).filter(Boolean)) {
      const row = by.get(label) ?? { budgetMillions: 0, programmes: 0 };
      // A programme listed under two states contributes its budget once to each, so the
      // shares describe where the work is rather than summing to the portfolio total.
      row.budgetMillions += budgetMillionsOf(p);
      row.programmes += 1;
      by.set(label, row);
    }
  }
  const total = [...by.values()].reduce((sum, r) => sum + r.budgetMillions, 0);
  return [...by.entries()]
    .map(([label, r]) => ({ label, budgetMillions: r.budgetMillions, sharePct: share(r.budgetMillions, total), programmes: r.programmes }))
    .sort((a, b) => b.budgetMillions - a.budgetMillions);
}

export function moneyFor(projects: Project[], impacts: Record<string, ProjectImpact>): PortfolioMoney {
  const budgetMillions = projects.reduce((sum, p) => sum + budgetMillionsOf(p), 0);
  let spentNgn = 0;
  let budgetOfSpenders = 0;
  let programmesWithRecordedSpend = 0;
  for (const p of projects) {
    const spent = impacts[p.code]?.spentNgn ?? 0;
    if (spent > 0) {
      spentNgn += spent;
      budgetOfSpenders += budgetMillionsOf(p) * 1_000_000;
      programmesWithRecordedSpend += 1;
    }
  }
  return {
    budgetMillions,
    spentMillions: spentNgn / 1_000_000,
    // Against the budgets of the programmes that recorded spend, not the whole portfolio:
    // dividing recorded spend by every budget would read as underspend on programmes that
    // have simply not reported yet.
    utilisedPct: share(spentNgn, budgetOfSpenders),
    programmesWithRecordedSpend,
    byPillar: slices(projects, (p) => p.pillar),
    byState: slices(projects, (p) => p.state),
  };
}

export function demographicsFor(projects: Project[], impacts: Record<string, ProjectImpact>): PortfolioDemographics {
  const totals = { benefited: 0, female: 0, male: 0, under35: 0, livingWithDisability: 0 };
  let programmesReporting = 0;
  for (const p of projects) {
    const impact = impacts[p.code];
    const b = impact?.benefited;
    const served = impact?.reach?.directBeneficiaries ?? 0;
    // Only programmes that reported at least one of the four count towards the
    // percentages. Counting a programme that reported nothing as all-zero would push
    // every share down and read as a finding about the people rather than the paperwork.
    if (!b || served <= 0) continue;
    const any = [b.female, b.male, b.under35, b.livingWithDisability].some((v) => typeof v === 'number');
    if (!any) continue;
    programmesReporting += 1;
    totals.benefited += served;
    totals.female += b.female ?? 0;
    totals.male += b.male ?? 0;
    totals.under35 += b.under35 ?? 0;
    totals.livingWithDisability += b.livingWithDisability ?? 0;
  }
  return { ...totals, programmesReporting, programmesTotal: projects.length };
}

export function sroiFor(projects: Project[], impacts: Record<string, ProjectImpact>): PortfolioSroi | null {
  let presentValueNgn = 0;
  let investmentNgn = 0;
  let programmes = 0;
  for (const p of projects) {
    const estimate = sroiForProject(p, impacts[p.code]);
    if (!isSroiEstimate(estimate)) continue;
    presentValueNgn += estimate.presentValueNgn;
    investmentNgn += estimate.investmentNgn;
    programmes += 1;
  }
  if (programmes === 0 || investmentNgn <= 0) return null;
  return {
    ratio: Math.round((presentValueNgn / investmentNgn) * 100) / 100,
    presentValueNgn,
    investmentNgn,
    programmes,
  };
}

export function deliveryFor(projects: Project[]): DeliveryStatus {
  const count = (status: string) => projects.filter((p) => p.status === status).length;
  const atRisk = count('At risk');
  const delayed = count('Delayed');
  return { onTrack: count('On track'), atRisk, delayed, completed: count('Completed'), needingAttention: atRisk + delayed };
}

/** Every community a programme recorded working in, de-duplicated. */
export function communitiesFor(projects: Project[], impacts: Record<string, ProjectImpact>): string[] {
  const names = new Set<string>();
  for (const p of projects) {
    for (const c of impacts[p.code]?.communitiesImpacted ?? []) {
      const name = c.trim();
      if (name) names.add(name);
    }
    for (const c of (p as { community?: string | null }).community?.split(';') ?? []) {
      const name = c.trim();
      if (name) names.add(name);
    }
  }
  return [...names].sort();
}

/**
 * What changed, taken from the programmes that recorded an outcome.
 *
 * The band used to hold three written-in deltas — "+12% literacy in STEP-supported
 * schools" — that no project produced and no upload could change.
 */
export function outcomesFor(projects: Project[], impacts: Record<string, ProjectImpact>, limit = 3): RecordedOutcome[] {
  return projects
    .map((p) => ({ project: p, impact: impacts[p.code] }))
    .filter((row): row is { project: Project; impact: ProjectImpact } => Boolean(row.impact?.outcome?.trim()))
    .sort((a, b) => (b.impact.reach?.directBeneficiaries ?? 0) - (a.impact.reach?.directBeneficiaries ?? 0))
    .slice(0, limit)
    .map(({ project, impact }) => ({
      code: project.code,
      name: project.name,
      pillar: project.pillar,
      outcome: impact.outcome.trim(),
      figure: impact.impactFigure.trim(),
      figureLabel: impact.impactFigureLabel.trim(),
    }));
}
