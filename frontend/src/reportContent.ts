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
    case 'Social Performance Report':
      return [
        {
          heading: 'Overview — Seplat at a glance',
          lines: [
            'Social investment: ₦4.68B (90% of ₦5.2B FY26 budget) · $64M invested since 2010',
            'Active projects: 47 — 38 on track, 6 at risk, 3 delayed',
            'Host communities: 42 across Edo, Delta and Imo',
            '52% of the 2030 social aspiration achieved — Economic Empowerment flagged as the priority gap.',
          ],
        },
        {
          heading: 'Our Impact — what changed',
          lines: [
            '+12% literacy in STEP-supported schools',
            '−8% youth unemployment in YEP-covered LGAs',
            '+22K people gained clean-water access',
            'SROI ratio: 3.4× · Community satisfaction: 78%',
          ],
        },
        {
          heading: 'Our Impact — material issues we report against',
          lines: STANDARDS.filter((s) => s.category === 'local' || s.category === 'global').map((s) => `${s.code} — ${s.summary}`),
        },
        {
          heading: 'Our Communities — flagship corporate social investment programmes',
          lines:
            projects.length > 0
              ? projects.map((p) => {
                  const imp = impacts[p.code];
                  return imp ? `${p.name} — ${imp.outputHeadline}` : `${p.name} — ${p.output}`;
                })
              : ['No projects are in the selected report scope.'],
        },
        {
          heading: 'Our Communities — Host Community Development Trust (PIA)',
          lines: [
            'Status: funded and reconciled for FY26.',
            byCode('WATER')
              ? `${byCode('WATER')!.name} is funded directly from this allocation — ${impacts.WATER?.outputHeadline ?? ''}, budget ${byCode('WATER')!.budget}.`
              : 'Community Water Scheme is excluded from the selected report scope.',
          ],
        },
        {
          heading: 'Our People — health, safety, culture, environment, governance',
          lines: [
            'Not yet tracked in SPIMS Phase 1 — this section populates once HR, HSE and environmental data sources are connected (headcount, safety incident rate, D&I metrics, emissions).',
          ],
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

    case 'NCDMB Compliance Return': {
      const inScope = projects.filter((p) => NCDMB_PROJECT_CODES.includes(p.code));
      return [
        {
          heading: 'Nigerian content compliance',
          lines: ['NCDMB local content: 87% of applicable spend', 'Human-capital development, local employment and technician training reported below.'],
        },
        {
          heading: 'Projects contributing to this return',
          lines:
            inScope.length > 0
              ? inScope.map((p) => {
                  const imp = impacts[p.code];
                  return imp ? `${p.name} (${p.code}) — ${imp.outputHeadline}` : `${p.name} (${p.code})`;
                })
              : ['No NCDMB-relevant projects are in the selected scope.'],
        },
      ];
    }

    case 'PIA HCDT Statement': {
      const water = byCode('WATER');
      return [
        {
          heading: 'Host Community Development Trust — 3% OpEx',
          lines: [
            'Status: funded and reconciled for FY26.',
            water ? `${water.name} is funded directly from this allocation — ${impacts.WATER?.outputHeadline ?? ''}, budget ${water.budget}.` : 'Community Water Scheme is excluded from the selected report scope.',
          ],
        },
        {
          heading: 'Community investment by state',
          lines: ['Edo: 58%', 'Delta: 34%', 'Imo: 8%'],
        },
      ];
    }

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
          lines:
            projects.length > 0
              ? projects.map((p) => {
                  const imp = impacts[p.code];
                  return imp ? `${p.name}: ${imp.outputHeadline}. ${imp.outcome}` : `${p.name}: ${p.output}`;
                })
              : ['No projects are in the selected report scope.'],
        },
        {
          heading: 'What communities told us',
          lines: ['78% of people surveyed said they were satisfied with the programmes reaching their community.', 'Feedback is welcomed via field officers, community meetings, or the local CDC — every stakeholder has a named contact.'],
        },
      ];

    default:
      return [{ heading: report.name, lines: [report.desc] }];
  }
}
