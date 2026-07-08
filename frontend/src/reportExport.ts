import type { Report } from './types';

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
 * for any report containing an em dash, curly quote, or the Naira sign.
 */
function buildPdf(report: Report): string {
  const escape = (s: string) => toAscii(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

  const bodyLines = [
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

  const contentParts: string[] = ['BT', '/F1 18 Tf', '50 770 Td', `(${escape(report.name)}) Tj`, '/F1 11 Tf'];
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

function buildCsv(report: Report): string {
  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const rows = [
    ['Field', 'Value'],
    ['Report name', report.name],
    ['Lens', report.lens],
    ['Description', report.desc],
    ['Last updated', report.updated],
    ['Generated on', todayLabel()],
    ['Data status', 'Illustrative - Phase 1 mock data, replace with live Seplat figures'],
  ];
  return rows.map((r) => r.map(esc).join(',')).join('\r\n');
}

function buildRtf(report: Report): string {
  const esc = (s: string) => toAscii(s).replace(/\\/g, '\\\\').replace(/{/g, '\\{').replace(/}/g, '\\}');
  return (
    '{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Arial;}}\\f0' +
    `\\fs32\\b ${esc(report.name)}\\b0\\fs20\\par\\par` +
    `\\b Lens:\\b0 ${esc(report.lens)}\\par\\par` +
    `${esc(report.desc)}\\par\\par` +
    `\\b Last updated:\\b0 ${esc(report.updated)}\\par` +
    `\\b Generated on:\\b0 ${esc(todayLabel())}\\par\\par` +
    '\\i This export is a Phase 1 illustrative summary generated from SPIMS mock data.\\i0\\par' +
    '}'
  );
}

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function exportReport(report: Report, format: 'pdf' | 'excel' | 'word'): string {
  const base = slug(report.name);
  if (format === 'pdf') {
    downloadBlob(new Blob([buildPdf(report)], { type: 'application/pdf' }), `${base}.pdf`);
    return `${base}.pdf`;
  }
  if (format === 'excel') {
    downloadBlob(new Blob([buildCsv(report)], { type: 'text/csv' }), `${base}.csv`);
    return `${base}.csv`;
  }
  downloadBlob(new Blob([buildRtf(report)], { type: 'application/rtf' }), `${base}.rtf`);
  return `${base}.rtf`;
}
