import type { Project, ProjectImpact, ReachProfile } from '../types';

/**
 * The analytics layer: the only place a reported figure is calculated.
 *
 * Every number that reaches a dashboard, an export or a generated narrative comes from
 * here. Two rules follow from that, and they are the reason this module exists rather
 * than each screen doing its own arithmetic:
 *
 *   1. Calculations are deterministic. No language model computes a figure SPIMS
 *      reports — it may only describe figures produced here.
 *   2. Every figure carries its provenance, so a reader can challenge it and a
 *      validator can reconcile a narrative against it.
 */

export interface Provenance {
  /** What is being counted. */
  metric: string;
  /** How it was arrived at, in words a reviewer can check. */
  calculation: string;
  /** Anything that qualifies the figure. */
  caveat?: string;
}

export interface Metric {
  key: string;
  label: string;
  value: number;
  /** Preformatted for display, e.g. "169,841" or "12%". */
  display: string;
  unit: 'people' | 'percent' | 'currency' | 'count';
  provenance: Provenance;
}

export interface PillarMetrics {
  pillar: string;
  projectCount: number;
  reach: number;
  impact: number;
  conversionPct: number;
}

export interface ProgrammeSpend {
  code: string;
  name: string;
  /** Millions of naira, so programmes are comparable regardless of how they were typed. */
  budgetMillions: number;
  budgetLabel: string;
  utilisedPct: number;
}

export interface ProgrammeMetrics {
  code: string;
  name: string;
  reach: number;
  impact: number;
  mapped: boolean;
  /**
   * Figures the programme's own record states, which a report quotes verbatim — its
   * cost per outcome, for instance.
   *
   * They are not computed here, and the validator cannot reconcile them against
   * anything, so without this it flagged every programme report: "₦29,268 per student
   * engaged does not correspond to any figure the analytics layer produced". A
   * validator that cries wolf on correct content is worse than none, so the figures it
   * cannot check are declared rather than guessed at.
   */
  quotedFigures: number[];
}

export interface PortfolioAnalytics {
  projectCount: number;
  reach: number;
  impact: number;
  conversionPct: number;
  /** Programmes with no reach profile, excluded from totals rather than counted as zero. */
  unmapped: string[];
  pillars: PillarMetrics[];
  /** Per-programme figures. Reports legitimately quote a single programme, so these
   *  are part of the verified set a narrative is reconciled against. */
  programmes: ProgrammeMetrics[];
  spend: ProgrammeSpend[];
  totalBudgetMillions: number;
  /** The headline figures, ready to render and to validate a narrative against. */
  headline: Metric[];
}

/* ----------------------------------------------------------------- helpers */

/** Thousands separators. Figures are compared against published reports, so no rounding. */
export function formatCount(n: number): string {
  return n.toLocaleString('en-NG');
}

/** Compact form for tiles where space is tight. */
export function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 10_000) return `${Math.round(n / 1000)}K`;
  return formatCount(n);
}

function pct(part: number, whole: number): number {
  return whole === 0 ? 0 : Math.round((part / whole) * 1000) / 10;
}

/**
 * Budgets are entered as display strings ("₦480M", "₦4.68B"), so comparing them means
 * parsing. Normalised to millions; an unparseable value contributes zero rather than
 * NaN, which would poison every total downstream.
 */
export function budgetToMillions(budget: string): number {
  const n = Number(budget.replace(/[^\d.]/g, ''));
  if (!Number.isFinite(n)) return 0;
  return budget.toUpperCase().includes('B') ? n * 1000 : n;
}

/**
 * Millions of naira as a compact label.
 *
 * Kept to two decimals below ₦10M, because the portfolio now holds projects of a few
 * million naira as well as programmes of several hundred: rounding to the nearest
 * million printed "₦3M" at the top of a report whose budget line, two rows below, read
 * "₦3.44M". The form always carries an M or a B, so `budgetToMillions` reads it back.
 */
export function formatMillions(millions: number): string {
  if (millions >= 1000) return `₦${(millions / 1000).toFixed(2)}B`;
  if (millions >= 10) return `₦${Math.round(millions)}M`;
  return `₦${Number(millions.toFixed(2))}M`;
}

/* ------------------------------------------- percentages that may never have been set
 *
 * `utilPct`, `progress` and `progPct` are display strings, and an unrecorded one used
 * to be stored as "0%" — which reads as a measurement rather than as a silence. A
 * project created from a master-data upload claimed "0% utilised" while its completion
 * file recorded the entire budget spent, and nobody could tell the two apart.
 *
 * An unrecorded value is now an empty string, and these helpers are the only place that
 * is interpreted. `barWidth` matters most: an empty string is not a valid CSS width, the
 * browser drops the declaration, and a block-level bar then stretches to its container —
 * so "not recorded" would have rendered as a full bar.
 */
export function isPercentRecorded(value: string | undefined): boolean {
  return /^\d+(?:\.\d+)?%$/.test((value ?? '').trim());
}

export function barWidth(value: string | undefined): string {
  return isPercentRecorded(value) ? (value ?? '').trim() : '0%';
}

export function percentLabel(value: string | undefined, unrecorded = 'Not recorded'): string {
  return isPercentRecorded(value) ? (value ?? '').trim() : unrecorded;
}

/** "72% utilised", or a statement that nobody has recorded it. */
export function utilisedCaption(value: string | undefined): string {
  return isPercentRecorded(value) ? `${(value ?? '').trim()} utilised` : 'Utilisation not recorded';
}

/* --------------------------------------------------------------- the layer */

/** The grouped numbers in a stated figure, e.g. "₦5,136–₦15,409 per child" → two values. */
function groupedFiguresIn(value: string | undefined): number[] {
  const found: number[] = [];
  for (const match of (value ?? '').matchAll(/\b\d{1,3}(?:,\d{3})+\b/g)) {
    const n = Number(match[0].replace(/,/g, ''));
    if (Number.isFinite(n)) found.push(n);
  }
  return found;
}

function reachOf(project: Project, impacts: Record<string, ProjectImpact>): ReachProfile | undefined {
  return impacts[project.code]?.reach;
}

function totalsFor(projects: Project[], impacts: Record<string, ProjectImpact>) {
  let reach = 0;
  let impact = 0;
  const unmapped: string[] = [];

  for (const project of projects) {
    const profile = reachOf(project, impacts);
    if (!profile) {
      unmapped.push(project.code);
      continue;
    }
    reach += profile.total;
    impact += profile.directBeneficiaries;
  }
  return { reach, impact, unmapped, conversionPct: pct(impact, reach) };
}

function pillarsFor(projects: Project[], impacts: Record<string, ProjectImpact>): PillarMetrics[] {
  const groups = new Map<string, Project[]>();
  for (const project of projects) {
    const existing = groups.get(project.pillar);
    if (existing) existing.push(project);
    else groups.set(project.pillar, [project]);
  }

  return [...groups.entries()]
    .map(([pillar, group]) => {
      const t = totalsFor(group, impacts);
      return { pillar, projectCount: group.length, reach: t.reach, impact: t.impact, conversionPct: t.conversionPct };
    })
    .sort((a, b) => b.reach - a.reach);
}

function spendFor(projects: Project[]): ProgrammeSpend[] {
  return projects
    .map((p) => ({
      code: p.code,
      name: p.name,
      budgetMillions: budgetToMillions(p.budget),
      budgetLabel: p.budget,
      utilisedPct: Number(p.utilPct.replace('%', '')) || 0,
    }))
    .sort((a, b) => b.budgetMillions - a.budgetMillions);
}

/** Computes every portfolio figure SPIMS reports, once. */
export function analysePortfolio(projects: Project[], impacts: Record<string, ProjectImpact>): PortfolioAnalytics {
  const totals = totalsFor(projects, impacts);
  const pillars = pillarsFor(projects, impacts);
  const spend = spendFor(projects);
  const programmes: ProgrammeMetrics[] = projects.map((p) => {
    const profile = reachOf(p, impacts);
    return {
      code: p.code,
      name: p.name,
      reach: profile?.total ?? 0,
      impact: profile?.directBeneficiaries ?? 0,
      mapped: Boolean(profile),
      quotedFigures: groupedFiguresIn(impacts[p.code]?.costPerOutcome),
    };
  });
  const totalBudgetMillions = spend.reduce((sum, s) => sum + s.budgetMillions, 0);

  const unmappedNote =
    totals.unmapped.length > 0
      ? `${totals.unmapped.join(', ')} ${totals.unmapped.length === 1 ? 'has' : 'have'} no reach profile and ${
          totals.unmapped.length === 1 ? 'is' : 'are'
        } excluded rather than counted as zero.`
      : undefined;

  const headline: Metric[] = [
    {
      key: 'projects',
      label: 'Programmes',
      value: projects.length,
      display: String(projects.length),
      unit: 'count',
      provenance: { metric: 'Programmes in scope', calculation: 'Count of programmes included in this report.' },
    },
    {
      key: 'reach',
      label: 'Reach',
      value: totals.reach,
      display: formatCount(totals.reach),
      unit: 'people',
      provenance: {
        metric: 'People a programme interacted with',
        calculation: 'Sum of each programme’s recorded interactions — applicants, attendees, people screened, catchment residents.',
        caveat: unmappedNote,
      },
    },
    {
      key: 'impact',
      label: 'Impact',
      value: totals.impact,
      display: formatCount(totals.impact),
      unit: 'people',
      provenance: {
        metric: 'People who received the intervention',
        calculation: 'Sum of each programme’s direct beneficiaries. Deliberately smaller than reach — an applicant who received nothing is not counted.',
        caveat: unmappedNote,
      },
    },
    {
      key: 'conversion',
      label: 'Conversion',
      value: totals.conversionPct,
      display: `${totals.conversionPct}%`,
      unit: 'percent',
      provenance: {
        metric: 'Share of interactions that became a delivered intervention',
        calculation: 'Impact ÷ reach, expressed as a percentage.',
      },
    },
    {
      key: 'budget',
      label: 'Total budget',
      value: totalBudgetMillions,
      display: formatMillions(totalBudgetMillions),
      unit: 'currency',
      provenance: {
        metric: 'Combined programme budget',
        calculation: 'Sum of programme budgets, normalised to millions of naira.',
        caveat: 'Budgets are recorded as display values rather than ledger entries; reconcile against finance before external reporting.',
      },
    },
  ];

  return {
    projectCount: projects.length,
    reach: totals.reach,
    impact: totals.impact,
    conversionPct: totals.conversionPct,
    unmapped: totals.unmapped,
    pillars,
    programmes,
    spend,
    totalBudgetMillions,
    headline,
  };
}

/** Per-programme view, for a single-programme report. */
export function analyseProgramme(project: Project, impacts: Record<string, ProjectImpact>) {
  const profile = reachOf(project, impacts);
  return {
    code: project.code,
    name: project.name,
    reach: profile?.total ?? 0,
    impact: profile?.directBeneficiaries ?? 0,
    conversionPct: profile ? pct(profile.directBeneficiaries, profile.total) : 0,
    mapped: Boolean(profile),
    budgetMillions: budgetToMillions(project.budget),
    utilisedPct: Number(project.utilPct.replace('%', '')) || 0,
  };
}
