import { analyseProgramme, analysePortfolio, formatCount, formatMillions } from '../analytics/metrics';
import type { Metric } from '../analytics/metrics';
import type { ReportSection } from '../reportContent';
import type { CustomField, OrgSettings, Project, ProjectImpact, Report } from '../types';
import type { ChapterTone, ReportBlock, ReportSpec } from './spec';

/**
 * Builds a report specification from verified analytics plus narrative content.
 *
 * This is the only place that decides what a report contains and in what order.
 * Renderers decide how it looks; they never decide what is in it. Two reports are
 * built here — the portfolio report and the single-programme report — and both are
 * rendered by the same renderers, so a programme report cannot end up looking like a
 * different product from the report it sits inside.
 */

export interface BuildSpecInput {
  report: Report;
  sections: ReportSection[];
  fy: string;
  scopeNote: string;
  org: OrgSettings;
  projects: Project[];
  impacts: Record<string, ProjectImpact>;
  generatedOn: string;
}

/* ------------------------------------------------------------- chaptering */

/**
 * Seplat's four chapters, in their order, with the tone each is set in.
 *
 * The report's own section headings are already written as "Our Impact — what
 * changed", which is to say the content was authored against this structure long
 * before there was anything to render it. Reading the chapter back off the heading is
 * therefore not a heuristic imposed on the data; it is recovering a grouping that was
 * always there and was previously being flattened away.
 */
const CHAPTERS: { title: string; tone: ChapterTone }[] = [
  { title: 'Overview', tone: 'overview' },
  { title: 'Our Impact', tone: 'impact' },
  { title: 'Our Communities', tone: 'communities' },
  { title: 'Our People', tone: 'governance' },
];

/** Everything that does not announce a chapter of its own. */
const OTHER_CHAPTER: { title: string; tone: ChapterTone } = { title: 'Detail', tone: 'governance' };

interface ChapterGroup {
  title: string;
  tone: ChapterTone;
  sections: ReportSection[];
}

/**
 * Splits "Our Impact — what changed" into its chapter and its own heading.
 *
 * Only the em dash separates them. A hyphen is left alone, because programme names
 * legitimately contain them.
 */
function splitHeading(heading: string): { chapter: string | null; rest: string } {
  const at = heading.indexOf('—');
  if (at < 0) return { chapter: null, rest: heading };
  const chapter = heading.slice(0, at).trim();
  const rest = heading.slice(at + 1).trim();
  const known = CHAPTERS.find((c) => c.title.toLowerCase() === chapter.toLowerCase());
  // "Our Impact — material issues" leaves a heading starting in lower case, because it
  // was written to read as the tail of a longer phrase. Standing on its own it needs
  // its capital back.
  const capitalised = rest.charAt(0).toUpperCase() + rest.slice(1);
  return known && rest ? { chapter: known.title, rest: capitalised } : { chapter: null, rest: heading };
}

/**
 * Groups sections into chapters, preserving the order they were written in.
 *
 * A report whose sections carry no chapter prefix — the community and SROI reports —
 * comes back as a single group, which is correct: inventing chapters for content that
 * has none would put empty tabs across the top of every page.
 */
export function groupIntoChapters(sections: ReportSection[]): ChapterGroup[] {
  const groups = new Map<string, ChapterGroup>();

  for (const section of sections) {
    const { chapter, rest } = splitHeading(section.heading);
    const meta = CHAPTERS.find((c) => c.title === chapter) ?? OTHER_CHAPTER;
    const existing = groups.get(meta.title);
    const entry = { ...section, heading: rest };
    if (existing) existing.sections.push(entry);
    else groups.set(meta.title, { title: meta.title, tone: meta.tone, sections: [entry] });
  }

  // Seplat's order, not the order the map happened to fill.
  const order = [...CHAPTERS.map((c) => c.title), OTHER_CHAPTER.title];
  return order.flatMap((title) => {
    const group = groups.get(title);
    return group ? [group] : [];
  });
}

function sectionBlocks(group: ChapterGroup): ReportBlock[] {
  return group.sections.map((s): ReportBlock => ({ kind: 'section', heading: s.heading, lines: s.lines }));
}

/* ------------------------------------------------------ the portfolio report */

export function buildReportSpec(input: BuildSpecInput): ReportSpec {
  const { report, sections, fy, scopeNote, org, projects, impacts, generatedOn } = input;
  const analytics = analysePortfolio(projects, impacts);
  const groups = groupIntoChapters(sections);

  const reachBlock: ReportBlock = {
    kind: 'reachComparison',
    title: 'Reach and impact by pillar',
    intro:
      'Reach counts everyone a programme interacted with. Impact counts only those who received the intervention. They are reported separately so scale is visible without overstating the result.',
    rows: analytics.pillars,
  };
  const spendBlock: ReportBlock = {
    kind: 'spend',
    title: 'Investment by programme',
    intro: 'Budget by programme, largest first. The solid segment is the share drawn down to date.',
    rows: analytics.spend.slice(0, 8),
  };

  /**
   * Where each chart belongs.
   *
   * Reach against impact is the Our Impact chapter's argument; spend belongs with the
   * communities it was spent in. Attaching them to chapters rather than stacking them
   * at the front is what stops a chapter being a heading followed by nothing.
   */
  const chartsFor: Record<string, ReportBlock[]> = {
    Overview: [
      { kind: 'metricGrid', title: 'At a glance', metrics: analytics.headline.slice(0, 4) },
      {
        kind: 'progress',
        pct: analytics.conversionPct,
        caption: `${analytics.conversionPct}% of interactions converted into a delivered intervention · ${formatCount(
          analytics.reach - analytics.impact,
        )} reached but not served`,
      },
    ],
    'Our Impact': [reachBlock],
    'Our Communities': [spendBlock],
  };

  const blocks: ReportBlock[] = [{ kind: 'cover' }];

  // A report with no chaptered sections still needs its figures shown, so the charts
  // lead under a single chapter rather than being dropped for want of a home.
  const chaptered = groups.some((g) => g.title !== OTHER_CHAPTER.title);
  if (!chaptered) {
    blocks.push({ kind: 'chapter', title: 'Performance', tone: 'overview' });
    blocks.push(...chartsFor.Overview!, reachBlock, spendBlock);
    for (const group of groups) {
      blocks.push({ kind: 'chapter', title: group.title, tone: group.tone });
      blocks.push(...sectionBlocks(group));
    }
  } else {
    for (const group of groups) {
      blocks.push({ kind: 'chapter', title: group.title, tone: group.tone });
      blocks.push(...(chartsFor[group.title] ?? []));
      blocks.push(...sectionBlocks(group));
    }
  }

  // Anything qualifying the totals is stated in the report, not just in the interface.
  const unmappedCaveat = analytics.headline.find((m) => m.key === 'reach')?.provenance.caveat;
  if (unmappedCaveat) blocks.push({ kind: 'callout', text: unmappedCaveat });

  return {
    meta: {
      title: report.name,
      subtitle: report.desc,
      organisation: org.orgName,
      financialYear: fy,
      currencyLabel: org.currencyLabel,
      scopeNote,
      dataStatusNote: org.dataStatusNote,
      generatedOn,
    },
    blocks,
  };
}

/* ------------------------------------------------------ the programme report */

export interface BuildProgrammeSpecInput {
  project: Project;
  impact: ProjectImpact | undefined;
  customFields: CustomField[];
  org: OrgSettings;
  fy: string;
  generatedOn: string;
}

/** Drops empty entries so a missing field leaves no blank bullet behind. */
function lines(...values: (string | undefined | false)[]): string[] {
  return values.filter((v): v is string => typeof v === 'string' && v.trim() !== '');
}

/**
 * A single programme, as a report.
 *
 * This replaces a separate hand-written exporter that emitted one fixed page of
 * ASCII — it substituted "NGN " for every naira sign and silently dropped anything
 * past the foot of the page. Expressing the programme as a specification means it is
 * rendered by the same code as everything else, so it gains the design, the paging and
 * the PowerPoint output at no extra cost, and cannot drift from them again.
 */
export function buildProgrammeSpec(input: BuildProgrammeSpecInput): ReportSpec {
  const { project, impact, customFields, org, fy, generatedOn } = input;
  const figures = analyseProgramme(project, impact ? { [project.code]: impact } : {});

  const headline: Metric[] = [
    {
      key: 'reach',
      label: 'Reach',
      value: figures.reach,
      display: formatCount(figures.reach),
      unit: 'people',
      provenance: {
        metric: 'People this programme interacted with',
        calculation: 'Sum of the programme’s recorded interactions.',
      },
    },
    {
      key: 'impact',
      label: 'Impact',
      value: figures.impact,
      display: formatCount(figures.impact),
      unit: 'people',
      provenance: {
        metric: 'People who received the intervention',
        calculation: 'Direct beneficiaries. Deliberately smaller than reach.',
      },
    },
    {
      key: 'budget',
      label: 'Budget',
      value: figures.budgetMillions,
      display: formatMillions(figures.budgetMillions),
      unit: 'currency',
      provenance: { metric: 'Programme budget', calculation: `${project.utilPct} drawn down to date.` },
    },
    {
      key: 'conversion',
      label: 'Conversion',
      value: figures.conversionPct,
      display: `${figures.conversionPct}%`,
      unit: 'percent',
      provenance: { metric: 'Interactions that became a delivered intervention', calculation: 'Impact ÷ reach.' },
    },
  ];

  const blocks: ReportBlock[] = [
    { kind: 'cover' },
    { kind: 'chapter', title: 'Overview', tone: 'overview' },
    { kind: 'metricGrid', title: 'At a glance', metrics: headline },
    {
      kind: 'section',
      heading: 'Programme detail',
      lines: lines(
        `Pillar: ${project.pillar}`,
        `State: ${project.state}`,
        `Status: ${project.status} · ${project.progress} complete`,
        `Budget: ${project.budget}, ${project.utilPct} utilised`,
      ),
    },
  ];

  if (impact) {
    blocks.push(
      { kind: 'chapter', title: 'Our Impact', tone: 'impact' },
      {
        kind: 'section',
        heading: 'The impact chain',
        lines: lines(
          `Inputs — what we invest: ${impact.inputs}`,
          `Activities — what we do: ${impact.activities}`,
          `Outputs — what we deliver: ${impact.outputHeadline}`,
          `Outcomes — what changes: ${impact.outcome}`,
        ),
      },
    );

    if (figures.mapped) {
      blocks.push({
        kind: 'progress',
        title: 'Reach converted into impact',
        pct: figures.conversionPct,
        caption: impact.reach
          ? `${formatCount(impact.reach.total)} interactions · ${formatCount(
              impact.reach.directBeneficiaries,
            )} received the intervention. ${impact.reach.note}`
          : '',
      });
      if (impact.reach) {
        blocks.push({
          kind: 'section',
          heading: 'How this programme reached people',
          lines: impact.reach.channels.map((c) => `${c.label}: ${formatCount(c.value)}`),
        });
      }
    } else {
      // Never shown as zero. A programme without a reach profile is unmapped, and the
      // report has to say so rather than imply nobody was reached.
      blocks.push({
        kind: 'callout',
        text: 'Reach has not yet been separated from impact for this programme, so no reach figure is reported. It is unmapped, not zero.',
      });
    }

    blocks.push({
      kind: 'section',
      heading: 'What it means',
      lines: lines(impact.impactHeadline, `${impact.impactFigure} ${impact.impactFigureLabel}`, ...impact.impactPoints),
    });

    if (impact.impactScenarios && impact.impactScenarios.length > 0) {
      blocks.push({
        kind: 'section',
        heading: 'Translated into figures',
        lines: lines(
          impact.impactScenarioBasis,
          ...impact.impactScenarios.map(
            (s) => `${s.horizon}: ${s.conservative} (conservative) to ${s.highImpact} (high-impact)`,
          ),
        ),
      });
    }

    blocks.push(
      { kind: 'chapter', title: 'Our Communities', tone: 'communities' },
      {
        kind: 'section',
        heading: 'Delivery and cost',
        lines: lines(
          `Communities impacted: ${impact.communitiesImpacted.join(', ')}`,
          `Cost per outcome: ${impact.costPerOutcome}`,
          `Estimated SROI: ${impact.sroi}`,
          `Programme manager: ${impact.contactPerson}`,
        ),
      },
      {
        kind: 'section',
        heading: 'How these figures were arrived at',
        lines: lines(
          `Metric: ${impact.methodology.metric}`,
          `Calculation: ${impact.methodology.calculation}`,
          `Source: ${impact.methodology.source}`,
          `Note: ${impact.methodology.note}`,
        ),
      },
    );
  }

  const mine = customFields.filter((f) => f.projectCode === project.code);
  if (mine.length > 0) {
    blocks.push(
      { kind: 'chapter', title: 'Our People', tone: 'governance' },
      ...mine.map(
        (f): ReportBlock => ({
          kind: 'section',
          heading: f.question,
          lines: lines(f.answer, `Source: ${f.source}`, `Updated ${f.updatedAt} by ${f.updatedBy}`),
        }),
      ),
    );
  }

  return {
    meta: {
      title: project.name,
      subtitle: `${project.code} · ${project.pillar} · ${project.state}`,
      organisation: org.orgName,
      financialYear: fy,
      currencyLabel: org.currencyLabel,
      scopeNote: `Programme report covering ${project.name} (${project.code}).`,
      dataStatusNote: org.dataStatusNote,
      generatedOn,
    },
    blocks,
  };
}
