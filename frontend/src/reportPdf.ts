import { formatCount } from './analytics/metrics';
import { assertNever, chaptersOf } from './report/spec';
import {
  GREEN,
  GREEN_DEEP,
  GREEN_WASH,
  GREEN_WASH_SOFT,
  INK,
  LINE,
  MUTED,
  ORANGE,
  TEAL,
  TEAL_DEEP,
  TILE_FILLS,
  TONES,
  WHITE,
  inkOn,
} from './report/theme';
import type { PillarMetrics, ProgrammeSpend } from './analytics/metrics';
import type { ChapterBlock, ReportBlock, ReportMeta, ReportSpec } from './report/spec';

/**
 * Designed PDF export, set in the visual language of Seplat's own Social Performance
 * Report.
 *
 * The conventions here were read off their published 2025 report rather than invented:
 * Space Grotesk for display type, deep green headings, blocks of saturated colour
 * carrying a large figure with a small label above and its unit below, a chapter tab
 * strip, and a footer of organisation, page and report title. The point is that a page
 * SPIMS produces can sit inside their report without announcing itself as coming from
 * somewhere else.
 *
 * The engine is loaded on demand — it is far larger than the rest of the application,
 * and only a person exporting a report ever needs it.
 */

/** A4 in points, less 40pt margins each side. */
const CONTENT_WIDTH = 595.28 - 80;
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;

/** Body copy. Seplat set theirs in Aeonik, which we have no licence to embed. */
const BODY = 'Poppins';
/** Display type. The face Seplat's own report is set in. */
const DISPLAY = 'Grotesk';

interface PdfDoc {
  content: unknown[];
  [key: string]: unknown;
}

/** Characters neither embedded family has a glyph for. */
const FALLBACK_CHARS = /([₦₹₽₡])/;

/**
 * Splits a string so any character the embedded faces lack is rendered in the fallback
 * family.
 *
 * A PDF embeds exactly the glyphs it is handed, so an unsupported character does not
 * fall back the way a browser does — it simply disappears. Every naira sign in every
 * export was being dropped this way. Neither Poppins nor Space Grotesk carries one,
 * so this applies to both.
 */
function richText(value: string): string | { text: string; font?: string }[] {
  if (!FALLBACK_CHARS.test(value)) return value;
  return value
    .split(FALLBACK_CHARS)
    .filter((part) => part !== '')
    .map((part) => (FALLBACK_CHARS.test(part) ? { text: part, font: 'Fallback' } : { text: part }));
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/* ------------------------------------------------------------ page furniture */

/**
 * The chapter tab strip.
 *
 * Seplat run this across the head of every page: each chapter named in small capitals
 * under a rule, with the one you are reading picked out. It is the single strongest
 * signal that a page belongs to their report, which is why it is worth the structure
 * chapters required in the specification.
 */
function chapterStrip(chapters: ChapterBlock[], activeIndex: number) {
  const gap = 8;
  const w = (CONTENT_WIDTH - gap * (chapters.length - 1)) / chapters.length;

  return {
    columns: chapters.map((chapter, i) => {
      const active = i === activeIndex;
      const tone = TONES[chapter.tone];
      return {
        width: w,
        margin: [i === 0 ? 0 : gap, 0, 0, 0],
        stack: [
          {
            canvas: [
              { type: 'rect', x: 0, y: 0, w, h: active ? 2.5 : 1, color: active ? tone.base : LINE },
            ],
          },
          {
            text: chapter.title.toUpperCase(),
            font: BODY,
            fontSize: 5.8,
            bold: active,
            characterSpacing: 0.5,
            color: active ? tone.deep : MUTED,
            margin: [0, 5, 0, 0],
          },
        ],
      };
    }),
    margin: [0, 0, 0, 22],
  };
}

/* ------------------------------------------------------------- infographics */

/**
 * Headline figures as blocks of saturated colour.
 *
 * This is the treatment on Seplat's performance spread and it is the reason their
 * numbers read at arm's length: the figure is set very large in display type, the
 * label sits small above it, and the unit sits small below. Two to a row, so a figure
 * has room to be big rather than merely bold.
 */
function kpiTiles(tiles: { label: string; value: string; sub: string }[], accent: string) {
  const gap = 12;
  const perRow = 2;
  const w = (CONTENT_WIDTH - gap * (perRow - 1)) / perRow;
  const h = 92;

  const fills = [...TILE_FILLS];
  fills[2] = accent;

  return {
    stack: chunk(tiles, perRow).map((row, rowIndex) => ({
      columns: row.map((tile, i) => {
        const fill = fills[(rowIndex * perRow + i) % fills.length]!;
        const ink = inkOn(fill);
        return {
          width: w,
          margin: [i === 0 ? 0 : gap, 0, 0, 0],
          stack: [
            { canvas: [{ type: 'rect', x: 0, y: 0, w, h, r: 4, color: fill }] },
            {
              // Drawn back over the block it belongs to.
              relativePosition: { x: 16, y: -(h - 14) },
              stack: [
                { text: tile.label, font: BODY, fontSize: 8, bold: true, color: ink },
                {
                  text: richText(tile.value),
                  font: DISPLAY,
                  fontSize: 27,
                  bold: true,
                  color: ink,
                  margin: [0, 6, 0, 0],
                },
                {
                  // The unit line stays in the tile's own ink rather than going grey:
                  // on a saturated ground a muted grey disappears.
                  text: tile.sub,
                  font: BODY,
                  fontSize: 7,
                  color: ink,
                  margin: [0, 5, 16, 0],
                  lineHeight: 1.25,
                },
              ],
            },
          ],
        };
      }),
      margin: [0, 0, 0, rowIndex === chunk(tiles, perRow).length - 1 ? 24 : gap],
    })),
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
      { width: labelW, text: row.pillar, font: BODY, fontSize: 8, bold: true, color: INK, margin: [0, 4, 0, 0] },
      {
        width: barMax,
        canvas: [
          { type: 'rect', x: 0, y: 1, w: Math.max(2, (row.reach / max) * barMax), h: 8, r: 2, color: TEAL },
          { type: 'rect', x: 0, y: 12, w: Math.max(2, (row.impact / max) * barMax), h: 8, r: 2, color: GREEN_DEEP },
        ],
      },
      {
        width: valueW,
        stack: [
          { text: formatCount(row.reach), font: DISPLAY, fontSize: 8, bold: true, color: TEAL_DEEP },
          { text: formatCount(row.impact), font: DISPLAY, fontSize: 8, bold: true, color: GREEN_DEEP, margin: [0, 3, 0, 0] },
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
          { width: 'auto', canvas: [{ type: 'rect', x: 0, y: 3, w: 9, h: 9, r: 2, color: TEAL }] },
          { width: 'auto', text: 'Reach — people interacted with', font: BODY, fontSize: 7.5, color: MUTED, margin: [5, 2, 14, 0] },
          { width: 'auto', canvas: [{ type: 'rect', x: 0, y: 3, w: 9, h: 9, r: 2, color: GREEN_DEEP }] },
          { width: 'auto', text: 'Impact — people who received the intervention', font: BODY, fontSize: 7.5, color: MUTED, margin: [5, 2, 0, 0] },
        ],
        margin: [0, 4, 0, 0],
      },
    ],
    margin: [0, 4, 0, 24],
  };
}

/**
 * A single proportion, led by the figure itself.
 *
 * Seplat set a standalone statistic as a very large numeral with its explanation
 * underneath in small type, rather than as a labelled chart. The bar follows the
 * number here instead of carrying it.
 */
function conversionBar(pct: number, caption: string) {
  const filled = Math.max(2, (pct / 100) * CONTENT_WIDTH);
  return {
    stack: [
      { text: `${pct}%`, font: DISPLAY, fontSize: 38, bold: true, color: GREEN_DEEP, margin: [0, 0, 0, 8] },
      {
        canvas: [
          // pdfmake's canvas accepts hex only — an rgba() value is not parsed and
          // renders solid black.
          { type: 'rect', x: 0, y: 0, w: CONTENT_WIDTH, h: 12, r: 6, color: GREEN_WASH },
          { type: 'rect', x: 0, y: 0, w: filled, h: 12, r: 6, color: GREEN },
        ],
      },
      { text: caption, font: BODY, fontSize: 7.5, color: MUTED, margin: [0, 7, 0, 0], lineHeight: 1.35 },
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
        { width: 150, text: r.name, font: BODY, fontSize: 8, color: INK, margin: [0, 1, 0, 0] },
        {
          width: 'auto',
          canvas: [
            { type: 'rect', x: 0, y: 1, w: Math.max(2, (r.budgetMillions / max) * barMax), h: 10, r: 2, color: GREEN_WASH },
            { type: 'rect', x: 0, y: 1, w: Math.max(1, ((r.budgetMillions * r.utilisedPct) / 100 / max) * barMax), h: 10, r: 2, color: GREEN },
          ],
        },
        { width: 60, text: richText(r.budgetLabel), font: DISPLAY, fontSize: 8, bold: true, color: GREEN_DEEP, alignment: 'right' },
      ],
      margin: [0, 0, 0, 8],
    })),
    margin: [0, 4, 0, 8],
  };
}

/* ------------------------------------------------------- spec-driven render */

/**
 * The cover.
 *
 * Seplat's is a photograph under a very large two-line title, with the report name and
 * year set small along the bottom. We hold no photography, so the image is replaced by
 * a field of their deep green carrying the same curved wash that runs through their
 * inside pages. The type treatment is theirs.
 */
function coverPage(meta: ReportMeta) {
  const fieldH = 470;
  return [
    {
      canvas: [
        { type: 'rect', x: -40, y: -40, w: PAGE_WIDTH, h: fieldH, color: GREEN_DEEP },
        // The curved wash Seplat carry across their spreads, approximated as a polygon
        // — pdfmake's canvas has no bezier primitive.
        {
          type: 'polyline',
          closePath: true,
          color: GREEN,
          opacity: 0.55,
          points: [
            { x: PAGE_WIDTH - 40, y: 40 },
            { x: 250, y: fieldH - 40 },
            { x: PAGE_WIDTH - 40, y: fieldH - 40 },
          ],
        },
        { type: 'rect', x: -40, y: fieldH - 46, w: PAGE_WIDTH, h: 6, color: GREEN },
      ],
    },
    // Placed against the page rather than the flow. A tall margin inside a relatively
    // positioned stack put the year line onto page two, where white type on white
    // paper made it invisible rather than obviously broken.
    {
      absolutePosition: { x: 40, y: 64 },
      width: CONTENT_WIDTH,
      text: meta.organisation.toUpperCase(),
      font: BODY,
      fontSize: 8,
      bold: true,
      color: '#9ED7B4',
      characterSpacing: 1.4,
    },
    {
      absolutePosition: { x: 40, y: 96 },
      width: 420,
      text: meta.title,
      font: DISPLAY,
      fontSize: 40,
      bold: true,
      color: WHITE,
      lineHeight: 1.05,
    },
    {
      absolutePosition: { x: 40, y: 250 },
      width: 400,
      text: meta.subtitle,
      font: BODY,
      fontSize: 10,
      color: '#CFEBDB',
      lineHeight: 1.4,
    },
    {
      absolutePosition: { x: 40, y: fieldH - 92 },
      width: CONTENT_WIDTH,
      text: richText(`${meta.financialYear}  ·  ${meta.currencyLabel}`),
      font: DISPLAY,
      fontSize: 12,
      bold: true,
      color: WHITE,
    },
    {
      margin: [0, 60, 0, 0],
      stack: [
        { text: 'SCOPE OF THIS REPORT', font: BODY, fontSize: 7, bold: true, color: GREEN_DEEP, characterSpacing: 0.8 },
        { text: richText(meta.scopeNote), font: BODY, fontSize: 9.5, color: INK, margin: [0, 6, 0, 0], lineHeight: 1.45 },
        { canvas: [{ type: 'line', x1: 0, y1: 14, x2: CONTENT_WIDTH, y2: 14, lineWidth: 1, lineColor: LINE }] },
        { text: 'DATA STATUS', font: BODY, fontSize: 7, bold: true, color: GREEN_DEEP, characterSpacing: 0.8, margin: [0, 22, 0, 0] },
        { text: meta.dataStatusNote, font: BODY, fontSize: 9, color: INK, margin: [0, 6, 0, 0], lineHeight: 1.45 },
        { text: `Generated ${meta.generatedOn}`, font: BODY, fontSize: 8, color: MUTED, margin: [0, 24, 0, 0] },
      ],
    },
  ];
}

/** Chapter opening: a break, the tab strip with this chapter picked out, its title. */
function chapterOpener(block: ChapterBlock, chapters: ChapterBlock[]) {
  const tone = TONES[block.tone];
  return [
    { text: '', pageBreak: 'before' },
    chapterStrip(chapters, chapters.indexOf(block)),
    { text: block.title, font: DISPLAY, fontSize: 24, bold: true, color: tone.deep, margin: [0, 0, 0, 6] },
    { canvas: [{ type: 'rect', x: 0, y: 0, w: 54, h: 3, color: tone.base }], margin: [0, 0, 0, 20] },
  ];
}

/**
 * A qualification the reader must see.
 *
 * Set as Seplat set a sub-section marker: a solid orange bar carrying the label, with
 * the text beneath on a tint. Orange is the loudest colour in their palette and they
 * reserve it for exactly this — something you are not meant to skim past.
 */
function calloutBox(text: string) {
  return {
    margin: [0, 22, 0, 0],
    stack: [
      {
        canvas: [{ type: 'rect', x: 0, y: 0, w: CONTENT_WIDTH, h: 17, color: ORANGE }],
      },
      {
        relativePosition: { x: 10, y: -13 },
        text: 'BASIS OF PREPARATION',
        font: BODY,
        fontSize: 7,
        bold: true,
        color: WHITE,
        characterSpacing: 0.7,
      },
      {
        // A table rather than a text node with a background: a background fills only
        // the line boxes, which on a wrapped paragraph leaves a ragged right edge.
        table: {
          widths: [CONTENT_WIDTH - 2],
          body: [[{ text: richText(text), font: BODY, fontSize: 8, color: INK, lineHeight: 1.4, margin: [10, 9, 10, 9] }]],
        },
        layout: {
          hLineWidth: () => 0,
          vLineWidth: () => 0,
          fillColor: () => GREEN_WASH_SOFT,
        },
      },
    ],
  };
}

/**
 * Renders one specification block.
 *
 * The switch is exhaustive by construction: assertNever fails the build if a block
 * type is added without a case here, so a new block cannot ship as a blank page.
 */
function renderBlock(block: ReportBlock, meta: ReportMeta, chapters: ChapterBlock[], tone: string): unknown[] {
  switch (block.kind) {
    case 'cover':
      return coverPage(meta);

    case 'chapter':
      return chapterOpener(block, chapters);

    case 'break':
      return [{ text: '', pageBreak: 'after' }];

    case 'metricGrid':
      return [
        { text: block.title, font: DISPLAY, fontSize: 15, bold: true, color: GREEN_DEEP, margin: [0, 0, 0, 14] },
        kpiTiles(
          block.metrics.map((m) => ({ label: m.label, value: m.display, sub: m.provenance.metric })),
          tone,
        ),
      ];

    case 'reachComparison':
      return [
        { text: block.title, font: DISPLAY, fontSize: 14, bold: true, color: GREEN_DEEP, margin: [0, 0, 0, 5] },
        { text: block.intro, font: BODY, fontSize: 8.5, color: MUTED, margin: [0, 0, 0, 12], lineHeight: 1.4 },
        reachChart(block.rows),
      ];

    case 'progress':
      return [
        ...(block.title
          ? [{ text: block.title, font: DISPLAY, fontSize: 14, bold: true, color: GREEN_DEEP, margin: [0, 0, 0, 8] }]
          : []),
        conversionBar(block.pct, block.caption),
      ];

    case 'spend':
      return [
        { text: block.title, font: DISPLAY, fontSize: 14, bold: true, color: GREEN_DEEP, margin: [0, 0, 0, 5] },
        { text: block.intro, font: BODY, fontSize: 8.5, color: MUTED, margin: [0, 0, 0, 10], lineHeight: 1.4 },
        budgetChart(block.rows),
      ];

    case 'section':
      return [
        { text: block.heading, font: DISPLAY, fontSize: 13, bold: true, color: GREEN_DEEP, margin: [0, 18, 0, 8] },
        { canvas: [{ type: 'rect', x: 0, y: 0, w: 44, h: 2.5, color: tone }], margin: [0, 0, 0, 10] },
        ...block.lines.map((line) => ({
          // Without this a long bullet splits at a page break and strands its marker
          // at the foot of the previous page, on top of the footer.
          unbreakable: true,
          columns: [
            // Seplat mark list items with a small square rather than a round bullet.
            { width: 12, canvas: [{ type: 'rect', x: 0, y: 3.5, w: 4, h: 4, color: tone }] },
            { width: '*', text: richText(line), font: BODY, fontSize: 9.5, color: INK, lineHeight: 1.45 },
          ],
          margin: [0, 0, 0, 7],
        })),
      ];

    case 'callout':
      return [calloutBox(block.text)];

    default:
      return assertNever(block);
  }
}

export function buildPdfDefinition(spec: ReportSpec): PdfDoc {
  const chapters = chaptersOf(spec);

  // A block is tinted by the chapter it falls in, so a chapter reads as one piece of
  // colour rather than as a heading followed by unrelated charts.
  let tone: string = GREEN;
  const content = spec.blocks.flatMap((block) => {
    if (block.kind === 'chapter') tone = TONES[block.tone].base;
    return renderBlock(block, spec.meta, chapters, tone);
  });

  return {
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 54],
    info: { title: `${spec.meta.title} — ${spec.meta.financialYear}`, author: spec.meta.organisation },
    defaultStyle: { font: BODY, fontSize: 9.5, color: INK },
    content,
    /**
     * The corner wash Seplat carry on their inside pages. Drawn behind the content on
     * every page but the cover, which has a field of its own.
     */
    background: (currentPage: number) =>
      currentPage === 1
        ? []
        : {
            canvas: [
              {
                type: 'polyline',
                closePath: true,
                color: GREEN_WASH_SOFT,
                points: [
                  { x: PAGE_WIDTH, y: PAGE_HEIGHT - 150 },
                  { x: PAGE_WIDTH, y: PAGE_HEIGHT },
                  { x: PAGE_WIDTH - 240, y: PAGE_HEIGHT },
                ],
              },
            ],
          },
    /**
     * Organisation left, page number centred in green, report title right — theirs.
     * No "x of y": Seplat's report numbers pages without a total, and the cover is
     * unnumbered, so the count would not match the number shown anyway.
     */
    footer: (currentPage: number) =>
      currentPage === 1
        ? { text: '' }
        : {
            margin: [40, 14, 40, 0],
            columns: [
              { width: '*', text: spec.meta.organisation, font: BODY, fontSize: 7, color: MUTED },
              {
                width: 'auto',
                text: `${currentPage - 1}`,
                font: DISPLAY,
                fontSize: 8,
                bold: true,
                color: GREEN_DEEP,
              },
              {
                width: '*',
                text: `${spec.meta.title} ${spec.meta.financialYear}`,
                font: BODY,
                fontSize: 7,
                color: MUTED,
                alignment: 'right',
              },
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
    'Grotesk-Medium.ttf': fonts.GROTESK_MEDIUM,
    'Grotesk-Bold.ttf': fonts.GROTESK_BOLD,
    'Fallback.ttf': fonts.CURRENCY_FALLBACK,
  });
  make.addFonts({
    Poppins: {
      normal: 'Poppins-Regular.ttf',
      bold: 'Poppins-Bold.ttf',
      // Italics are not embedded; the upright faces stand in so a stray italic request
      // cannot fail the export.
      italics: 'Poppins-Regular.ttf',
      bolditalics: 'Poppins-Bold.ttf',
    },
    Grotesk: {
      normal: 'Grotesk-Medium.ttf',
      bold: 'Grotesk-Bold.ttf',
      italics: 'Grotesk-Medium.ttf',
      bolditalics: 'Grotesk-Bold.ttf',
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
