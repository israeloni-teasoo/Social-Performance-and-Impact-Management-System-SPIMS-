import { STANDARDS } from './data/standards';
import type { Project, ProjectImpact, Report } from './types';

export interface ReportSection {
  heading: string;
  lines: string[];
}

const NCDMB_PROJECT_CODES = ['STEP', 'YEP', 'FELL', 'POWER'];

export function buildReportSections(report: Report, projects: Project[], impacts: Record<string, ProjectImpact>): ReportSection[] {
  const byCode = (code: string) => projects.find((p) => p.code === code);

  switch (report.name) {
    case 'Board Social Performance Pack':
      return [
        {
          heading: 'FY26 KPI summary',
          lines: [
            'Social investment: ₦4.68B (90% of ₦5.2B FY26 budget) · $64M invested since 2010',
            'Beneficiaries reached: 312K (▲18% vs FY25)',
            'Active projects: 47 — 38 on track, 6 at risk, 3 delayed',
            'Host communities: 42 across Edo, Delta and Imo',
          ],
        },
        {
          heading: '2030 aspiration progress',
          lines: ['52% of the 2030 social aspiration achieved — on track across 4 pillars, with Economic Empowerment flagged as the priority gap.'],
        },
        {
          heading: 'Risk register',
          lines: ['6 high-risk projects — budget or delivery flagged', '4 grievances breaching the 30-day resolution SLA'],
        },
        {
          heading: 'Value created',
          lines: ['SROI ratio: 3.4×', 'Community satisfaction: 78%', 'ESG · Social score: B+'],
        },
      ];

    case 'ESG / Sustainability Report':
      return [
        {
          heading: 'Global standards applied',
          lines: STANDARDS.filter((s) => s.category === 'global').map((s) => `${s.code} — ${s.summary}`),
        },
        {
          heading: 'SDG contribution',
          lines: STANDARDS.filter((s) => s.category === 'sdg').map((s) => `${s.code} — ${s.summary}`),
        },
        {
          heading: 'Headline ESG figures',
          lines: ['ESG · Social score: B+', 'SROI ratio: 3.4×', '4 IFRS S1 disclosure gaps currently open — remediation in progress'],
        },
      ];

    case 'NCDMB Compliance Return':
      return [
        {
          heading: 'Nigerian content compliance',
          lines: ['NCDMB local content: 87% of applicable spend', 'Human-capital development, local employment and technician training reported below.'],
        },
        {
          heading: 'Projects contributing to this return',
          lines: NCDMB_PROJECT_CODES.map((code) => {
            const p = byCode(code);
            const imp = impacts[code];
            return p && imp ? `${p.name} (${p.code}) — ${imp.outputHeadline}` : code;
          }),
        },
      ];

    case 'PIA HCDT Statement':
      return [
        {
          heading: 'Host Community Development Trust — 3% OpEx',
          lines: ['Status: funded and reconciled for FY26.', `${byCode('WATER')?.name ?? 'Community Water Scheme'} is funded directly from this allocation — ${impacts.WATER?.outputHeadline ?? ''}, budget ${byCode('WATER')?.budget ?? ''}.`],
        },
        {
          heading: 'Community investment by state',
          lines: ['Edo: 58%', 'Delta: 34%', 'Imo: 8%'],
        },
      ];

    case 'SDG Contribution Report':
      return [
        {
          heading: 'Investment mapped to the UN SDGs',
          lines: STANDARDS.filter((s) => s.category === 'sdg').map((s) => {
            const p = s.exampleProjectCode ? byCode(s.exampleProjectCode) : undefined;
            return p ? `${s.code} — ${p.name}` : `${s.code} — company-wide`;
          }),
        },
      ];

    case 'Community Feedback Report':
      return [
        {
          heading: 'What we did in your community this year',
          lines: projects.map((p) => {
            const imp = impacts[p.code];
            return imp ? `${p.name}: ${imp.outputHeadline}. ${imp.outcome}` : `${p.name}: ${p.output}`;
          }),
        },
        {
          heading: 'What communities told us',
          lines: ['78% of people surveyed said they were satisfied with the programmes reaching their community.', 'Grievances are welcomed via field officers, the phone hotline, walk-in desks or the suggestion box — every case gets a reference number and a named contact.'],
        },
      ];

    default:
      return [{ heading: report.name, lines: [report.desc] }];
  }
}
