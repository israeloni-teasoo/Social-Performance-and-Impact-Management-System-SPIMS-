import { formatCount } from './analytics/metrics';
import type { ReportSection } from './reportContent';
import type { CustomField, Project, ProjectImpact, Report } from './types';

function todayLabel(): string {
  return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
}

/** Strip characters outside single-byte printable ASCII so hand-built byte-offset formats (PDF) stay valid. */
/**
 * Kept only for line wrapping, which counts characters rather than measuring them.
 *
 * It no longer strips anything: the hand-rolled PDF writer that needed single-byte
 * ASCII — because its cross-reference table counted UTF-16 code units as bytes — has
 * been deleted, and both remaining formats carry Unicode. Every naira sign in every
 * Word and Excel export used to come out as "NGN " for want of this.
 */
function toAscii(s: string): string {
  return s;
}

function wrap(text: string, width: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > width) {
      if (line) lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function buildCsvFromRows(rows: string[][]): string {
  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
  // A byte-order mark, so Excel opens the file as UTF-8 rather than guessing at the
  // local code page and rendering the naira sign as mojibake.
  return `\uFEFF${rows.map((r) => r.map(esc).join(',')).join('\r\n')}`;
}

function buildRtfFromLines(title: string, bodyLines: string[]): string {
  /** RTF is a 7-bit format; anything above it is written as a signed 16-bit escape. */
  const esc = (s: string) =>
    s
      .replace(/\\/g, '\\\\')
      .replace(/{/g, '\\{')
      .replace(/}/g, '\\}')
      .replace(/[\u0080-\uFFFF]/g, (ch) => {
        const code = ch.charCodeAt(0);
        return `\\u${code > 32767 ? code - 65536 : code}?`;
      });
  const body = bodyLines.map((l) => (l ? `${esc(l)}\\par` : '\\par')).join('\n');
  return `{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Arial;}}\\f0\\fs32\\b ${esc(title)}\\b0\\fs20\\par\\par${body}}`;
}

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function reportBodyLines(report: Report, sections: ReportSection[], fy: string, scopeNote: string): string[] {
  const lines = [
    `Lens: ${report.lens} · Financial year: ${fy}`,
    '',
    ...wrap(toAscii(report.desc), 88),
    '',
    toAscii(scopeNote),
    '',
  ];
  for (const section of sections) {
    lines.push(toAscii(section.heading).toUpperCase());
    for (const line of section.lines) lines.push(...wrap(`- ${toAscii(line)}`, 88));
    lines.push('');
  }
  lines.push(
    `Generated: ${todayLabel()}`,
    `Last updated: ${report.updated}`,
    '',
    'This export is a Phase 1 illustrative summary generated from SPIMS mock data.',
    'Replace with live figures once connected to Seplat production data.',
  );
  return lines;
}

export function exportReport(report: Report, format: 'excel' | 'word', sections: ReportSection[], fy: string, scopeNote: string): string {
  const base = slug(report.name);
  if (format === 'excel') {
    const rows: string[][] = [
      ['Field', 'Value'],
      ['Report name', report.name],
      ['Lens', report.lens],
      ['Financial year', fy],
      ['Description', report.desc],
      ['Scope', scopeNote],
      ['Last updated', report.updated],
      ['Generated on', todayLabel()],
      ['Data status', 'Illustrative - Phase 1 mock data, replace with live Seplat figures'],
    ];
    for (const section of sections) {
      rows.push([section.heading, '']);
      for (const line of section.lines) rows.push(['', line]);
    }
    downloadBlob(new Blob([buildCsvFromRows(rows)], { type: 'text/csv;charset=utf-8' }), `${base}.csv`);
    return `${base}.csv`;
  }
  downloadBlob(new Blob([buildRtfFromLines(report.name, reportBodyLines(report, sections, fy, scopeNote))], { type: 'application/rtf' }), `${base}.rtf`);
  return `${base}.rtf`;
}

function projectBodyLines(project: Project, impact: ProjectImpact | undefined, customFields: CustomField[]): string[] {
  const lines = [
    `Pillar: ${project.pillar} · State: ${project.state} · Status: ${project.status}`,
    `Budget: ${project.budget} (${project.utilPct} utilised) · Progress: ${project.progress}`,
    '',
  ];
  if (impact) {
    lines.push(
      '01 INPUTS — What we invest',
      ...wrap(toAscii(impact.inputs), 88),
      '',
      '02 ACTIVITIES — What we do',
      ...wrap(toAscii(impact.activities), 88),
      '',
      '03 OUTPUTS — What we deliver',
      toAscii(impact.outputHeadline),
      '',
      '04 OUTCOMES — What changes',
      ...wrap(toAscii(impact.outcome), 88),
      '',
      'REACH VS IMPACT',
      ...(impact.reach
        ? [
            `Reach (interactions): ${formatCount(impact.reach.total)} - ${toAscii(impact.reach.label)}`,
            `Impact (people served): ${formatCount(impact.reach.directBeneficiaries)} received the intervention`,
            ...impact.reach.channels.map((c) => `- ${toAscii(c.label)}: ${formatCount(c.value)}`),
            ...wrap(toAscii(impact.reach.note), 88),
          ]
        : ['Reach has not been separated from impact for this programme yet.']),
      '',
      '05 IMPACT — What it means',
      toAscii(impact.impactHeadline),
      `${toAscii(impact.impactFigure)} ${toAscii(impact.impactFigureLabel)}`,
      ...impact.impactPoints.map((p) => `- ${toAscii(p)}`),
      '',
      'METHODOLOGY',
      `Metric: ${impact.methodology.metric}`,
      ...wrap(`Calculation: ${impact.methodology.calculation}`, 88),
      ...wrap(`Source: ${impact.methodology.source}`, 88),
      ...wrap(`Note: ${impact.methodology.note}`, 88),
      '',
    );
    if (impact.impactScenarios && impact.impactScenarios.length > 0) {
      lines.push('WHAT IT MEANS, TRANSLATED INTO FIGURES');
      if (impact.impactScenarioBasis) lines.push(...wrap(toAscii(impact.impactScenarioBasis), 88));
      for (const s of impact.impactScenarios) {
        lines.push(`${s.horizon}: ${toAscii(s.conservative)} (conservative) to ${toAscii(s.highImpact)} (high-impact)`);
      }
      lines.push('');
    }
    lines.push(
      `Cost per outcome: ${impact.costPerOutcome} · Est. SROI: ${impact.sroi}`,
      `Communities impacted: ${impact.communitiesImpacted.join(', ')}`,
      `Project manager: ${impact.contactPerson}`,
    );
  }
  lines.push('', `Generated: ${todayLabel()}`, 'This export is a Phase 1 illustrative summary generated from SPIMS mock data.');
  const mine = customFields.filter((f) => f.projectCode === project.code);
  if (mine.length > 0) {
    lines.push('', 'QUESTIONS ABOUT THIS PROGRAMME');
    for (const f of mine) {
      lines.push(
        ...wrap(toAscii(f.question), 88),
        ...wrap(`  ${toAscii(f.answer)}`, 88),
        ...wrap(`  Source: ${toAscii(f.source)}`, 88),
        `  Updated ${toAscii(f.updatedAt)} by ${toAscii(f.updatedBy)}`,
        '',
      );
    }
  }

  return lines;
}

/**
 * The data formats for a single programme.
 *
 * PDF and PowerPoint are not here: those are designed documents, built from the report
 * specification and rendered by the shared renderers. This handles the two formats
 * whose job is to carry the numbers somewhere else.
 */
export function exportProjectReport(project: Project, impact: ProjectImpact | undefined, format: 'excel' | 'word', customFields: CustomField[] = []): string {
  const base = slug(`${project.code}-${project.name}`);
  const title = `${project.name} — Project Report`;
  if (format === 'excel') {
    const rows: string[][] = [
      ['Field', 'Value'],
      ['Project', project.name],
      ['Code', project.code],
      ['Pillar', project.pillar],
      ['State', project.state],
      ['Status', project.status],
      ['Budget', project.budget],
      ['Utilised', project.utilPct],
      ['Progress', project.progress],
    ];
    if (impact) {
      rows.push(
        ['Inputs', impact.inputs],
        ['Activities', impact.activities],
        ['Outputs', impact.outputHeadline],
        ['Outcome', impact.outcome],
        ['Reach — interactions', impact.reach ? `${formatCount(impact.reach.total)} (${impact.reach.label})` : 'Not yet separated'],
        ['Impact — people served', impact.reach ? formatCount(impact.reach.directBeneficiaries) : 'Not yet separated'],
        ['Reach vs impact note', impact.reach ? impact.reach.note : '—'],
        ['Impact', `${impact.impactHeadline} — ${impact.impactFigure} ${impact.impactFigureLabel}`],
        ['Impact — what it means', impact.impactPoints.join('; ')],
        ['Methodology metric', impact.methodology.metric],
        ['Methodology calculation', impact.methodology.calculation],
        ['Methodology source', impact.methodology.source],
        ['Methodology note', impact.methodology.note],
      );
      if (impact.impactScenarios) {
        for (const s of impact.impactScenarios) {
          rows.push([`Projection — ${s.horizon}`, `${s.conservative} (conservative) to ${s.highImpact} (high-impact)`]);
        }
      }
      rows.push(
        ['Cost per outcome', impact.costPerOutcome],
        ['Est. SROI', impact.sroi],
        ['Communities impacted', impact.communitiesImpacted.join('; ')],
        ['Project manager', impact.contactPerson],
      );
    }
    for (const f of customFields.filter((x) => x.projectCode === project.code)) {
      rows.push([`Q: ${f.question}`, `${f.answer} — source: ${f.source} (updated ${f.updatedAt} by ${f.updatedBy})`]);
    }
    downloadBlob(new Blob([buildCsvFromRows(rows)], { type: 'text/csv;charset=utf-8' }), `${base}.csv`);
    return `${base}.csv`;
  }
  downloadBlob(new Blob([buildRtfFromLines(title, projectBodyLines(project, impact, customFields))], { type: 'application/rtf' }), `${base}.rtf`);
  return `${base}.rtf`;
}
