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

export function formatMillions(millions: number): string {
  return millions >= 1000 ? `₦${(millions / 1000).toFixed(2)}B` : `₦${Math.round(millions)}M`;
}

/* --------------------------------------------------------------- the layer */

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
