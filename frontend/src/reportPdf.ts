import { formatCount } from './analytics/metrics';
import { assertNever } from './report/spec';
import type { PillarMetrics, ProgrammeSpend } from './analytics/metrics';
import type { ReportBlock, ReportMeta, ReportSpec } from './report/spec';

/**
 * Designed PDF export.
 *
 * This replaces a hand-written PDF writer that emitted a single fixed page of
 * Helvetica text. That approach failed in two ways that mattered: anything past
 * roughly the forty-sixth line was drawn below the page edge and silently lost, and
 * Helvetica's built-in encoding has no naira glyph, so every currency figure in every
 * export came out as a hyphen.
 *
 * The engine is loaded on demand — it is far larger than the rest of the application,
 * and only a person exporting a report ever needs it.
 */

const NAVY = '#111C55';
const ACCENT = '#E31A38';
const BLUE = '#2B4C9B';
const GREEN = '#1F8A5B';
const INK = '#2A2E52';
const MUTED = '#8A8DA6';
const LINE = '#E9E9F1';
const WASH = '#F4F4F8';
/** Unfilled track behind a progress bar. pdfmake canvas accepts hex only — an
 *  rgba() value is not parsed and renders solid black. */
const TRACK = '#D7DDEA';

/** A4 in points, less 40pt margins each side. */
const CONTENT_WIDTH = 595.28 - 80;

interface PdfDoc {
  content: unknown[];
  [key: string]: unknown;
}

/** Characters the embedded Poppins subset has no glyph for. */
const FALLBACK_CHARS = /([\u20A6\u20B9\u20BD\u20A1])/;

/**
 * Splits a string so any character Poppins lacks is rendered in the fallback family.
 *
 * A PDF embeds exactly the glyphs it is handed, so an unsupported character does not
 * fall back the way a browser does — it simply disappears. Every naira sign in every
 * export was being dropped this way.
 */
function richText(value: string): string | { text: string; font?: string }[] {
  if (!FALLBACK_CHARS.test(value)) return value;
  return value
    .split(FALLBACK_CHARS)
    .filter((part) => part !== '')
    .map((part) => (FALLBACK_CHARS.test(part) ? { text: part, font: 'Fallback' } : { text: part }));
}

/* ------------------------------------------------------------- infographics */

/** Row of headline figures, drawn as vector tiles rather than a table. */
function kpiTiles(tiles: { label: string; value: string; sub: string; colour: string }[]) {
  const gap = 12;
  const w = (CONTENT_WIDTH - gap * (tiles.length - 1)) / tiles.length;

  return {
    columns: tiles.map((t, i) => ({
      width: w,
      margin: [i === 0 ? 0 : gap, 0, 0, 0],
      stack: [
        {
          canvas: [
            { type: 'rect', x: 0, y: 0, w, h: 72, r: 8, color: WASH },
            { type: 'rect', x: 0, y: 0, w: 3, h: 72, r: 1.5, color: t.colour },
          ],
        },
        {
          // Drawn over the tile it belongs to.
          relativePosition: { x: 12, y: -60 },
          stack: [
            { text: t.label.toUpperCase(), fontSize: 6.5, color: MUTED, characterSpacing: 0.6 },
            { text: richText(t.value), fontSize: 17, bold: true, color: t.colour, margin: [0, 3, 0, 0] },
            { text: t.sub, fontSize: 7, color: MUTED, margin: [0, 2, 0, 0] },
          ],
        },
      ],
    })),
    margin: [0, 0, 0, 26],
  };
}

/**
 * Horizontal paired bars: reach against impact for each pillar.
 *
 * The two are drawn as separate bars on a shared scale on purpose — the visual gap
 * between them is the point being made, and stacking or merging them would hide it.
 */
function reachChart(rows: PillarMetrics[]) {
  const labelW = 92;
  const valueW = 62;
  // Leave room for both fixed columns plus the gaps pdfmake puts between them,
  // otherwise the value column is pushed off the page edge and clipped.
  const barMax = CONTENT_WIDTH - labelW - valueW - 24;
  const max = Math.max(1, ...rows.map((r) => r.reach));

  // Each row is its own columns block, so the label, bars and values line up by
  // construction rather than by matching separate stacks to a row pitch.
  const bars = rows.map((row) => ({
    columns: [
      { width: labelW, text: row.pillar, fontSize: 8, bold: true, color: INK, margin: [0, 4, 0, 0] },
      {
        width: barMax,
        canvas: [
          { type: 'rect', x: 0, y: 1, w: Math.max(2, (row.reach / max) * barMax), h: 8, r: 2, color: BLUE },
          { type: 'rect', x: 0, y: 12, w: Math.max(2, (row.impact / max) * barMax), h: 8, r: 2, color: ACCENT },
        ],
      },
      {
        width: valueW,
        stack: [
          { text: formatCount(row.reach), fontSize: 7.5, bold: true, color: BLUE },
          { text: formatCount(row.impact), fontSize: 7.5, bold: true, color: ACCENT, margin: [0, 3, 0, 0] },
        ],
        alignment: 'right',
      },
    ],
    margin: [0, 0, 0, 10],
  }));

  return {
    stack: [
      ...bars,
      {
        columns: [
          { width: 'auto', canvas: [{ type: 'rect', x: 0, y: 3, w: 9, h: 9, r: 2, color: BLUE }] },
          { width: 'auto', text: 'Reach — people interacted with', fontSize: 7.5, color: MUTED, margin: [5, 2, 14, 0] },
          { width: 'auto', canvas: [{ type: 'rect', x: 0, y: 3, w: 9, h: 9, r: 2, color: ACCENT }] },
          { width: 'auto', text: 'Impact — people who received the intervention', fontSize: 7.5, color: MUTED, margin: [5, 2, 0, 0] },
        ],
        margin: [0, 4, 0, 0],
      },
    ],
    margin: [0, 4, 0, 22],
  };
}

/** Conversion bar: the share of all interactions that became a delivered intervention. */
function conversionBar(pct: number, caption: string) {
  const filled = Math.max(2, (pct / 100) * CONTENT_WIDTH);
  return {
    stack: [
      {
        canvas: [
          { type: 'rect', x: 0, y: 0, w: CONTENT_WIDTH, h: 14, r: 7, color: TRACK },
          { type: 'rect', x: 0, y: 0, w: filled, h: 14, r: 7, color: ACCENT },
        ],
      },
      { text: caption, fontSize: 7.5, color: MUTED, margin: [0, 6, 0, 0] },
    ],
    margin: [0, 0, 0, 26],
  };
}

/** Horizontal budget bars per programme, scaled to the largest. */
function budgetChart(rows: ProgrammeSpend[]) {
  const max = Math.max(1, ...rows.map((r) => r.budgetMillions));
  const barMax = CONTENT_WIDTH - 210;

  return {
    stack: rows.map((r) => ({
      columns: [
        { width: 150, text: r.name, fontSize: 8, color: INK, margin: [0, 1, 0, 0] },
        {
          width: 'auto',
          canvas: [
            { type: 'rect', x: 0, y: 1, w: Math.max(2, (r.budgetMillions / max) * barMax), h: 10, r: 2, color: BLUE },
            { type: 'rect', x: 0, y: 1, w: Math.max(1, ((r.budgetMillions * r.utilisedPct) / 100 / max) * barMax), h: 10, r: 2, color: NAVY },
          ],
        },
        { width: 60, text: richText(r.budgetLabel), fontSize: 8, bold: true, color: NAVY, alignment: 'right' },
      ],
      margin: [0, 0, 0, 8],
    })),
    margin: [0, 4, 0, 8],
  };
}


/* ------------------------------------------------------- spec-driven render */

function coverPage(meta: ReportMeta) {
  return [
    {
      canvas: [
        { type: 'rect', x: -40, y: -40, w: 595.28, h: 250, color: NAVY },
        { type: 'rect', x: -40, y: 200, w: 595.28, h: 5, color: ACCENT },
      ],
    },
    {
      relativePosition: { x: 0, y: -190 },
      stack: [
        { text: meta.organisation.toUpperCase(), fontSize: 8, color: '#9EA1C0', characterSpacing: 1.4 },
        { text: meta.title, fontSize: 27, bold: true, color: '#FFFFFF', margin: [0, 14, 0, 0], lineHeight: 1.15 },
        { text: meta.subtitle, fontSize: 10, color: '#C7C9DC', margin: [0, 10, 60, 0], lineHeight: 1.3 },
        {
          text: richText(`${meta.financialYear}  ·  ${meta.currencyLabel}`),
          fontSize: 9,
          bold: true,
          color: '#FFFFFF',
          margin: [0, 18, 0, 0],
        },
      ],
    },
    {
      margin: [0, 120, 0, 0],
      stack: [
        { text: 'SCOPE OF THIS REPORT', fontSize: 7, color: MUTED, characterSpacing: 0.8 },
        { text: richText(meta.scopeNote), fontSize: 9.5, color: INK, margin: [0, 6, 0, 0], lineHeight: 1.4 },
        { canvas: [{ type: 'line', x1: 0, y1: 14, x2: CONTENT_WIDTH, y2: 14, lineWidth: 1, lineColor: LINE }] },
        { text: 'DATA STATUS', fontSize: 7, color: MUTED, characterSpacing: 0.8, margin: [0, 22, 0, 0] },
        { text: meta.dataStatusNote, fontSize: 9, color: INK, margin: [0, 6, 0, 0], lineHeight: 1.4 },
        { text: `Generated ${meta.generatedOn}`, fontSize: 8, color: MUTED, margin: [0, 26, 0, 0] },
      ],
    },
  ];
}

function calloutBox(text: string) {
  return {
    margin: [0, 22, 0, 0],
    table: {
      widths: [CONTENT_WIDTH - 2],
      body: [[{ text, fontSize: 8, color: '#4A3A22', margin: [10, 8, 10, 8] }]],
    },
    layout: {
      hLineWidth: () => 0,
      vLineWidth: (i: number) => (i === 0 ? 3 : 0),
      vLineColor: () => ACCENT,
      fillColor: () => '#F7F4EC',
    },
  };
}

/**
 * Renders one specification block.
 *
 * The switch is exhaustive by construction: assertNever fails the build if a block
 * type is added without a case here, so a new block cannot ship as a blank page.
 */
function renderBlock(block: ReportBlock, meta: ReportMeta): unknown[] {
  switch (block.kind) {
    case 'cover':
      return coverPage(meta);

    case 'break':
      return [{ text: '', pageBreak: 'after' }];

    case 'metricGrid':
      return [
        { text: block.title, fontSize: 15, bold: true, color: NAVY, margin: [0, 0, 0, 14] },
        kpiTiles(
          block.metrics.map((m, i) => ({
            label: m.label,
            value: m.display,
            sub: m.provenance.metric,
            colour: [NAVY, BLUE, ACCENT, GREEN][i % 4]!,
          })),
        ),
      ];

    case 'reachComparison':
      return [
        { text: block.title, fontSize: 13, bold: true, color: NAVY, margin: [0, 0, 0, 4] },
        { text: block.intro, fontSize: 8.5, color: MUTED, margin: [0, 0, 0, 12], lineHeight: 1.35 },
        reachChart(block.rows),
      ];

    case 'progress':
      return [
        ...(block.title ? [{ text: block.title, fontSize: 13, bold: true, color: NAVY, margin: [0, 0, 0, 8] }] : []),
        conversionBar(block.pct, block.caption),
      ];

    case 'spend':
      return [
        { text: block.title, fontSize: 13, bold: true, color: NAVY, margin: [0, 0, 0, 4] },
        { text: block.intro, fontSize: 8.5, color: MUTED, margin: [0, 0, 0, 10] },
        budgetChart(block.rows),
      ];

    case 'section':
      return [
        { text: block.heading, fontSize: 13, bold: true, color: NAVY, margin: [0, 18, 0, 8] },
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 44, y2: 0, lineWidth: 2, lineColor: ACCENT }], margin: [0, 0, 0, 10] },
        ...block.lines.map((line) => ({
          // Without this a long bullet splits at a page break and strands its marker
          // at the foot of the previous page, on top of the footer.
          unbreakable: true,
          columns: [
            { width: 10, canvas: [{ type: 'ellipse', x: 3, y: 5, r1: 2, r2: 2, color: ACCENT }] },
            { width: '*', text: richText(line), fontSize: 9.5, color: INK, lineHeight: 1.4 },
          ],
          margin: [0, 0, 0, 6],
        })),
      ];

    case 'callout':
      return [calloutBox(block.text)];

    default:
      return assertNever(block);
  }
}

export function buildPdfDefinition(spec: ReportSpec): PdfDoc {
  const content = spec.blocks.flatMap((block) => renderBlock(block, spec.meta));

  return {
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 52],
    info: { title: `${spec.meta.title} — ${spec.meta.financialYear}`, author: spec.meta.organisation },
    defaultStyle: { font: 'Poppins', fontSize: 9.5, color: INK },
    content,
    footer: (currentPage: number, pageCount: number) =>
      currentPage === 1
        ? { text: '' }
        : {
            margin: [40, 12, 40, 0],
            columns: [
              { text: `${spec.meta.title} · ${spec.meta.financialYear}`, fontSize: 7.5, color: MUTED },
              { text: `${currentPage - 1} of ${pageCount - 1}`, fontSize: 7.5, color: MUTED, alignment: 'right' },
            ],
          },
  };
}

/** Builds and downloads the report. Returns the filename written. */
export async function renderReportPdf(spec: ReportSpec, filename: string): Promise<string> {
  const [{ default: pdfMake }, fonts] = await Promise.all([import('pdfmake/build/pdfmake'), import('./pdfFonts')]);

  // pdfmake 0.3 registers fonts through these functions; assigning .vfs and .fonts
  // directly, as 0.2 allowed, leaves the file system empty and the export fails with
  // "not found in virtual file system".
  const make = pdfMake as unknown as {
    addVirtualFileSystem: (vfs: Record<string, string>) => void;
    addFonts: (fonts: Record<string, Record<string, string>>) => void;
    createPdf: (def: unknown) => { download: (name: string) => void };
  };

  make.addVirtualFileSystem({
    'Poppins-Regular.ttf': fonts.POPPINS_REGULAR,
    'Poppins-Bold.ttf': fonts.POPPINS_BOLD,
    'Fallback.ttf': fonts.CURRENCY_FALLBACK,
  });
  make.addFonts({
    Poppins: {
      normal: 'Poppins-Regular.ttf',
      bold: 'Poppins-Bold.ttf',
      // Poppins italics are not embedded; the upright faces stand in so a stray
      // italic request cannot fail the export.
      italics: 'Poppins-Regular.ttf',
      bolditalics: 'Poppins-Bold.ttf',
    },
    Fallback: {
      normal: 'Fallback.ttf',
      bold: 'Fallback.ttf',
      italics: 'Fallback.ttf',
      bolditalics: 'Fallback.ttf',
    },
  });

  make.createPdf(buildPdfDefinition(spec)).download(filename);
  return filename;
}
