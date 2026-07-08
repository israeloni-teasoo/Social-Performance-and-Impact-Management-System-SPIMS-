import type { Project, ProjectImpact, Report } from './types';

function todayLabel(): string {
  return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
}

/** Strip characters outside single-byte printable ASCII so hand-built byte-offset formats (PDF) stay valid. */
function toAscii(s: string): string {
  const replaced = s
    .replace(/[–—]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, '...')
    .replace(/×/g, 'x')
    .replace(/₦/g, 'NGN ');
  let out = '';
  for (const ch of replaced) {
    const code = ch.codePointAt(0) ?? 63;
    out += code >= 32 && code <= 126 ? ch : '?';
  }
  return out;
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

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Hand-rolled minimal single-page PDF - no dependency, but a genuinely valid PDF file.
 * Content is forced to single-byte ASCII so `pdf.length` (UTF-16 code units) exactly
 * matches its encoded byte length; otherwise the xref byte offsets below would be wrong
 * for any title/body containing an em dash, curly quote, or the Naira sign.
 */
function buildPdfFromLines(title: string, bodyLines: string[]): string {
  const escape = (s: string) => toAscii(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

  const contentParts: string[] = ['BT', '/F1 18 Tf', '50 770 Td', `(${escape(title)}) Tj`, '/F1 11 Tf'];
  let first = true;
  for (const line of bodyLines) {
    contentParts.push(first ? '0 -32 Td' : '0 -16 Td');
    first = false;
    if (line) contentParts.push(`(${escape(line)}) Tj`);
  }
  contentParts.push('ET');
  const content = contentParts.join('\n');

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((obj, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) {
    pdf += `${off.toString().padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return pdf;
}

function buildCsvFromRows(rows: string[][]): string {
  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
  return rows.map((r) => r.map(esc).join(',')).join('\r\n');
}

function buildRtfFromLines(title: string, bodyLines: string[]): string {
  const esc = (s: string) => toAscii(s).replace(/\\/g, '\\\\').replace(/{/g, '\\{').replace(/}/g, '\\}');
  const body = bodyLines.map((l) => (l ? `${esc(l)}\\par` : '\\par')).join('\n');
  return `{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Arial;}}\\f0\\fs32\\b ${esc(title)}\\b0\\fs20\\par\\par${body}}`;
}

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function reportBodyLines(report: Report): string[] {
  return [
    `Lens: ${report.lens}`,
    '',
    ...wrap(toAscii(report.desc), 88),
    '',
    `Generated: ${todayLabel()}`,
    `Last updated: ${report.updated}`,
    '',
    'This export is a Phase 1 illustrative summary generated from SPIMS mock data.',
    'Replace with live figures once connected to Seplat production data.',
  ];
}

export function exportReport(report: Report, format: 'pdf' | 'excel' | 'word'): string {
  const base = slug(report.name);
  if (format === 'pdf') {
    downloadBlob(new Blob([buildPdfFromLines(report.name, reportBodyLines(report))], { type: 'application/pdf' }), `${base}.pdf`);
    return `${base}.pdf`;
  }
  if (format === 'excel') {
    const rows = [
      ['Field', 'Value'],
      ['Report name', report.name],
      ['Lens', report.lens],
      ['Description', report.desc],
      ['Last updated', report.updated],
      ['Generated on', todayLabel()],
      ['Data status', 'Illustrative - Phase 1 mock data, replace with live Seplat figures'],
    ];
    downloadBlob(new Blob([buildCsvFromRows(rows)], { type: 'text/csv' }), `${base}.csv`);
    return `${base}.csv`;
  }
  downloadBlob(new Blob([buildRtfFromLines(report.name, reportBodyLines(report))], { type: 'application/rtf' }), `${base}.rtf`);
  return `${base}.rtf`;
}

function projectBodyLines(project: Project, impact: ProjectImpact | undefined): string[] {
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
      '05 IMPACT — What it means',
      toAscii(impact.impactHeadline),
      ...wrap(toAscii(impact.impactDetail), 88),
      '',
      'METHODOLOGY',
      `Metric: ${impact.methodology.metric}`,
      ...wrap(`Calculation: ${impact.methodology.calculation}`, 88),
      ...wrap(`Source: ${impact.methodology.source}`, 88),
      ...wrap(`Note: ${impact.methodology.note}`, 88),
      '',
      `Cost per outcome: ${impact.costPerOutcome} · Est. SROI: ${impact.sroi}`,
      `Communities impacted: ${impact.communitiesImpacted.join(', ')}`,
      `Project manager: ${impact.contactPerson}`,
    );
  }
  lines.push('', `Generated: ${todayLabel()}`, 'This export is a Phase 1 illustrative summary generated from SPIMS mock data.');
  return lines;
}

export function exportProjectReport(project: Project, impact: ProjectImpact | undefined, format: 'pdf' | 'excel' | 'word'): string {
  const base = slug(`${project.code}-${project.name}`);
  const title = `${project.name} — Project Report`;
  if (format === 'pdf') {
    downloadBlob(new Blob([buildPdfFromLines(title, projectBodyLines(project, impact))], { type: 'application/pdf' }), `${base}.pdf`);
    return `${base}.pdf`;
  }
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
        ['Impact', `${impact.impactHeadline} — ${impact.impactDetail}`],
        ['Methodology metric', impact.methodology.metric],
        ['Methodology calculation', impact.methodology.calculation],
        ['Methodology source', impact.methodology.source],
        ['Methodology note', impact.methodology.note],
        ['Cost per outcome', impact.costPerOutcome],
        ['Est. SROI', impact.sroi],
        ['Communities impacted', impact.communitiesImpacted.join('; ')],
        ['Project manager', impact.contactPerson],
      );
    }
    downloadBlob(new Blob([buildCsvFromRows(rows)], { type: 'text/csv' }), `${base}.csv`);
    return `${base}.csv`;
  }
  downloadBlob(new Blob([buildRtfFromLines(title, projectBodyLines(project, impact))], { type: 'application/rtf' }), `${base}.rtf`);
  return `${base}.rtf`;
}
