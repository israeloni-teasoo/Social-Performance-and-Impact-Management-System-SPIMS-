import { analysePortfolio } from '../analytics/metrics';
import type { ReportSection } from '../reportContent';
import type { OrgSettings, Project, ProjectImpact, Report } from '../types';
import type { ReportBlock, ReportSpec } from './spec';

/**
 * Builds the report specification from verified analytics plus the report's narrative
 * content.
 *
 * This is the only place that decides what a report contains and in what order.
 * Renderers decide how it looks; they never decide what is in it.
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

export function buildReportSpec(input: BuildSpecInput): ReportSpec {
  const { report, sections, fy, scopeNote, org, projects, impacts, generatedOn } = input;
  const analytics = analysePortfolio(projects, impacts);

  const blocks: ReportBlock[] = [
    { kind: 'cover' },
    { kind: 'break' },

    { kind: 'metricGrid', title: 'At a glance', metrics: analytics.headline.slice(0, 4) },

    {
      kind: 'reachComparison',
      title: 'Reach and impact by pillar',
      intro:
        'Reach counts everyone a programme interacted with. Impact counts only those who received the intervention. They are reported separately so scale is visible without overstating the result.',
      rows: analytics.pillars,
    },

    {
      kind: 'progress',
      pct: analytics.conversionPct,
      caption: `${analytics.conversionPct}% of interactions converted into a delivered intervention · ${(
        analytics.reach - analytics.impact
      ).toLocaleString('en-NG')} reached but not served`,
    },

    {
      kind: 'spend',
      title: 'Investment by programme',
      intro: 'Budget by programme, largest first. The darker segment is the share drawn down to date.',
      rows: analytics.spend.slice(0, 8),
    },

    { kind: 'break' },
    ...sections.map((s): ReportBlock => ({ kind: 'section', heading: s.heading, lines: s.lines })),
  ];

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
