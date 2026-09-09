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
  TILE_FILLS,
  TONES,
  WHITE,
  inkOn,
} from './report/theme';
import type { ChapterBlock, ReportBlock, ReportMeta, ReportSpec } from './report/spec';

/**
 * PowerPoint export: a second renderer of the same report specification.
 *
 * The whole reason the specification exists is that this file contains no report
 * structure. It decides how a block looks on a slide; what blocks there are, in what
 * order, and with what numbers in them was settled upstream. A figure cannot differ
 * between the PDF and the deck, because neither of them works it out.
 *
 * Charts are native PowerPoint charts, not pictures of charts. That was the client's
 * condition for this format: a deck that reaches a board should be editable — someone
 * can restyle a bar or correct a label in PowerPoint without coming back to us, and
 * the underlying figures travel with the file in its embedded worksheet.
 *
 * The engine is loaded on demand; only a person exporting a deck ever needs it.
 */

/** Widescreen, in inches — PptxGenJS's unit. */
const W = 13.333;
const H = 7.5;
const MARGIN = 0.62;
const BODY_W = W - MARGIN * 2;

/**
 * No outline.
 *
 * `{ width: 0 }` does not suppress one — PptxGenJS ignores the zero and emits a 1pt
 * dark grey stroke, so every tile, bar and rule in the deck was drawn with a border
 * nobody asked for. Only `type: 'none'` removes it.
 */
const NO_LINE = { type: 'none' as const };

/** PptxGenJS wants hex without the leading hash. */
function hex(colour: string): string {
  return colour.replace('#', '');
}

/**
 * PptxGenJS types are structural and large; the handful of shapes we use are declared
 * here rather than importing the full type surface, which would couple this renderer
 * to the library's internals.
 */
interface Slide {
  background: { color: string };
  addText: (text: unknown, opts: Record<string, unknown>) => void;
  addShape: (shape: unknown, opts: Record<string, unknown>) => void;
  addChart: (type: unknown, data: unknown[], opts: Record<string, unknown>) => void;
}

interface Deck {
  layout: string;
  defineLayout: (opts: { name: string; width: number; height: number }) => void;
  addSlide: () => Slide;
  writeFile: (opts: { fileName: string }) => Promise<string>;
  ShapeType: Record<string, unknown>;
  ChartType: Record<string, unknown>;
  author: string;
  title: string;
  subject: string;
}

const FONT_DISPLAY = 'Space Grotesk';
const FONT_BODY = 'Poppins';

/**
 * Fonts are named, not embedded.
 *
 * A .pptx cannot carry a font the way a PDF does — PowerPoint substitutes whatever the
 * viewer has. Naming the same faces the PDF embeds means the deck matches on a machine
 * that has them and degrades to a sane sans-serif on one that does not, which is the
 * best available behaviour for an editable format.
 */

/* ------------------------------------------------------------ slide furniture */

/** The chapter tab strip, as drawn across the head of every content slide. */
function tabStrip(slide: Slide, deck: Deck, chapters: ChapterBlock[], activeIndex: number) {
  if (chapters.length === 0) return;
  const gap = 0.12;
  const w = (BODY_W - gap * (chapters.length - 1)) / chapters.length;

  chapters.forEach((chapter, i) => {
    const active = i === activeIndex;
    const tone = TONES[chapter.tone];
    const x = MARGIN + i * (w + gap);

    slide.addShape(deck.ShapeType.rect, {
      x,
      y: 0.34,
      w,
      h: active ? 0.035 : 0.014,
      fill: { color: hex(active ? tone.base : LINE) },
      line: NO_LINE,
    });
    slide.addText(chapter.title.toUpperCase(), {
      x,
      y: 0.4,
      w,
      h: 0.22,
      fontFace: FONT_BODY,
      fontSize: 8,
      bold: active,
      charSpacing: 0.6,
      color: hex(active ? tone.deep : MUTED),
    });
  });
}

/** Organisation left, page number centred, report title right — as in the PDF. */
function footer(slide: Slide, meta: ReportMeta, page: number) {
  slide.addText(meta.organisation, {
    x: MARGIN, y: H - 0.5, w: 4, h: 0.25, fontFace: FONT_BODY, fontSize: 9, color: hex(MUTED),
  });
  slide.addText(String(page), {
    x: W / 2 - 0.5, y: H - 0.5, w: 1, h: 0.25, align: 'center',
    fontFace: FONT_DISPLAY, fontSize: 10, bold: true, color: hex(GREEN_DEEP),
  });
  slide.addText(`${meta.title} ${meta.financialYear}`, {
    x: W - MARGIN - 4, y: H - 0.5, w: 4, h: 0.25, align: 'right',
    fontFace: FONT_BODY, fontSize: 9, color: hex(MUTED),
  });
}

/** Top of the body area, below the heading — and below an intro line when there is one. */
const BODY_TOP = 1.62;
const BODY_TOP_WITH_INTRO = 2.35;
/** Bottom of the body area. Everything below belongs to the footer. */
const BODY_BOTTOM = 6.6;

/**
 * A content slide with its strip, footer and heading already placed.
 *
 * `wash` is off for a slide carrying a chart: a chart's plot area is transparent, so a
 * tint behind it shows through the gridlines.
 */
function contentSlide(
  deck: Deck, meta: ReportMeta, chapters: ChapterBlock[], state: RenderState,
  heading: string, intro?: string, wash = true,
) {
  const slide = deck.addSlide();
  slide.background = { color: hex(WHITE) };
  state.page += 1;

  if (wash) {
    // The corner wash the PDF carries, so the two formats read as one document. It
    // stops above the footer band rather than running into the corner: at full height
    // its diagonal cut straight through the footer text.
    slide.addShape(deck.ShapeType.rtTriangle, {
      x: W - 2.6, y: BODY_BOTTOM - 1.15, w: 2.6, h: 1.15,
      fill: { color: hex(GREEN_WASH_SOFT), transparency: 45 }, line: NO_LINE, flipH: true,
    });
  }

  tabStrip(slide, deck, chapters, state.chapterIndex);
  footer(slide, meta, state.page);

  slide.addText(heading, {
    x: MARGIN, y: 0.85, w: BODY_W, h: 0.6,
    fontFace: FONT_DISPLAY, fontSize: 26, bold: true, color: hex(state.tone.deep),
  });
  slide.addShape(deck.ShapeType.rect, {
    x: MARGIN, y: 1.45, w: 1.1, h: 0.05, fill: { color: hex(state.tone.base) }, line: NO_LINE,
  });
  if (intro) {
    slide.addText(intro, {
      x: MARGIN, y: 1.62, w: BODY_W, h: 0.6,
      fontFace: FONT_BODY, fontSize: 12, color: hex(MUTED), lineSpacingMultiple: 1.25,
    });
  }
  return slide;
}

interface RenderState {
  page: number;
  chapterIndex: number;
  tone: { base: string; deep: string; wash: string };
}

/* --------------------------------------------------------------- the blocks */

function coverSlide(deck: Deck, meta: ReportMeta) {
  const slide = deck.addSlide();
  slide.background = { color: hex(GREEN_DEEP) };

  // The angled wash from the PDF cover, as a right triangle.
  slide.addShape(deck.ShapeType.rtTriangle, {
    x: W - 6, y: 0, w: 6, h: H, fill: { color: hex(GREEN), transparency: 55 }, line: NO_LINE, flipH: true,
  });

  slide.addText(meta.organisation.toUpperCase(), {
    x: MARGIN, y: 1.5, w: 8, h: 0.3, fontFace: FONT_BODY, fontSize: 11, bold: true, charSpacing: 1.4, color: '9ED7B4',
  });
  slide.addText(meta.title, {
    x: MARGIN, y: 1.95, w: 8.4, h: 1.9,
    fontFace: FONT_DISPLAY, fontSize: 44, bold: true, color: hex(WHITE), lineSpacingMultiple: 1.05,
  });
  slide.addText(meta.subtitle, {
    x: MARGIN, y: 3.95, w: 7.6, h: 1, fontFace: FONT_BODY, fontSize: 13, color: 'CFEBDB', lineSpacingMultiple: 1.3,
  });
  slide.addText(`${meta.financialYear}  ·  ${meta.currencyLabel}`, {
    x: MARGIN, y: 5.6, w: 6, h: 0.4, fontFace: FONT_DISPLAY, fontSize: 14, bold: true, color: hex(WHITE),
  });
  slide.addText(`Generated ${meta.generatedOn}`, {
    x: MARGIN, y: 6.15, w: 6, h: 0.3, fontFace: FONT_BODY, fontSize: 10, color: '9ED7B4',
  });
}

/**
 * A chapter does not get a slide of its own.
 *
 * In the PDF a chapter opener is right: a page break and a title is how a document
 * signals a new part. A deck has no equivalent — a slide carrying one word and nothing
 * else reads as a slide someone forgot to finish, and with five chapters that is five
 * of them. The tab strip across every slide already says which chapter you are in, and
 * each heading is set in that chapter's colour, so the information is not lost.
 */

/** Headline figures as blocks of colour — Seplat's performance-spread treatment. */
function metricSlide(
  deck: Deck, meta: ReportMeta, chapters: ChapterBlock[], state: RenderState,
  title: string, metrics: { label: string; display: string; provenance: { metric: string } }[],
) {
  const slide = contentSlide(deck, meta, chapters, state, title);

  const perRow = 2;
  const gap = 0.25;
  const w = (BODY_W - gap * (perRow - 1)) / perRow;
  const h = 1.85;

  const fills = [...TILE_FILLS];
  fills[2] = state.tone.base;

  metrics.forEach((metric, i) => {
    const fill = fills[i % fills.length]!;
    const ink = inkOn(fill);
    const x = MARGIN + (i % perRow) * (w + gap);
    const y = 1.75 + Math.floor(i / perRow) * (h + gap);

    slide.addShape(deck.ShapeType.roundRect, {
      x, y, w, h, rectRadius: 0.04, fill: { color: hex(fill) }, line: NO_LINE,
    });
    slide.addText(metric.label, {
      x: x + 0.3, y: y + 0.18, w: w - 0.6, h: 0.28, fontFace: FONT_BODY, fontSize: 12, bold: true, color: hex(ink),
    });
    slide.addText(metric.display, {
      x: x + 0.3, y: y + 0.5, w: w - 0.6, h: 0.72, fontFace: FONT_DISPLAY, fontSize: 40, bold: true, color: hex(ink),
    });
    slide.addText(metric.provenance.metric, {
      x: x + 0.3, y: y + 1.28, w: w - 0.6, h: 0.45, fontFace: FONT_BODY, fontSize: 9.5, color: hex(ink),
    });
  });
}

/**
 * Reach against impact, as a native clustered bar chart.
 *
 * Two series on one category axis rather than a stacked bar: the distance between them
 * is the finding, and stacking would present the sum as if it meant something.
 */
function reachSlide(
  deck: Deck, meta: ReportMeta, chapters: ChapterBlock[], state: RenderState,
  title: string, intro: string, rows: { pillar: string; reach: number; impact: number }[],
) {
  const slide = contentSlide(deck, meta, chapters, state, title, intro, false);
  const labels = rows.map((r) => r.pillar);

  slide.addChart(
    deck.ChartType.bar,
    [
      { name: 'Reach — people interacted with', labels, values: rows.map((r) => r.reach) },
      { name: 'Impact — people who received the intervention', labels, values: rows.map((r) => r.impact) },
    ],
    {
      x: MARGIN, y: BODY_TOP_WITH_INTRO, w: BODY_W, h: BODY_BOTTOM - BODY_TOP_WITH_INTRO + 0.35,
      barDir: 'bar',
      barGrouping: 'clustered',
      chartColors: [hex(TEAL), hex(GREEN_DEEP)],
      showLegend: true,
      legendPos: 'b',
      legendFontFace: FONT_BODY,
      legendFontSize: 10,
      showValue: true,
      dataLabelFontFace: FONT_DISPLAY,
      dataLabelFontSize: 9,
      dataLabelColor: hex(INK),
      dataLabelFormatCode: '#,##0',
      catAxisLabelFontFace: FONT_BODY,
      catAxisLabelFontSize: 10,
      catAxisLabelColor: hex(INK),
      // PowerPoint plots the first category at the foot of a bar chart, which puts the
      // largest row at the bottom and reverses the order the PDF shows.
      catAxisOrientation: 'maxMin',
      valAxisLabelFontFace: FONT_BODY,
      valAxisLabelFontSize: 9,
      valAxisLabelColor: hex(MUTED),
      valAxisLabelFormatCode: '#,##0',
      valGridLine: { style: 'solid', color: hex(LINE), size: 1 },
      catGridLine: { style: 'none' },
    },
  );
}

/** A single proportion, led by the figure itself. */
function progressSlide(
  deck: Deck, meta: ReportMeta, chapters: ChapterBlock[], state: RenderState,
  title: string | undefined, pctValue: number, caption: string,
) {
  const slide = contentSlide(deck, meta, chapters, state, title ?? 'Conversion');

  slide.addText(`${pctValue}%`, {
    x: MARGIN, y: 1.9, w: BODY_W, h: 1.5, fontFace: FONT_DISPLAY, fontSize: 96, bold: true, color: hex(GREEN_DEEP),
  });
  slide.addShape(deck.ShapeType.roundRect, {
    x: MARGIN, y: 3.5, w: BODY_W, h: 0.32, rectRadius: 0.16, fill: { color: hex(GREEN_WASH) }, line: NO_LINE,
  });
  slide.addShape(deck.ShapeType.roundRect, {
    x: MARGIN, y: 3.5, w: Math.max(0.32, (pctValue / 100) * BODY_W), h: 0.32, rectRadius: 0.16,
    fill: { color: hex(GREEN) }, line: NO_LINE,
  });
  slide.addText(caption, {
    x: MARGIN, y: 4.0, w: BODY_W, h: 0.8, fontFace: FONT_BODY, fontSize: 12, color: hex(MUTED), lineSpacingMultiple: 1.3,
  });
}

/** Programme budgets, as a native bar chart in millions of naira. */
function spendSlide(
  deck: Deck, meta: ReportMeta, chapters: ChapterBlock[], state: RenderState,
  title: string, intro: string, rows: { name: string; budgetMillions: number; utilisedPct: number }[],
) {
  const slide = contentSlide(deck, meta, chapters, state, title, intro, false);
  const labels = rows.map((r) => r.name);

  slide.addChart(
    deck.ChartType.bar,
    [
      { name: 'Budget (₦m)', labels, values: rows.map((r) => Math.round(r.budgetMillions)) },
      {
        name: 'Drawn down (₦m)',
        labels,
        values: rows.map((r) => Math.round((r.budgetMillions * r.utilisedPct) / 100)),
      },
    ],
    {
      x: MARGIN, y: BODY_TOP_WITH_INTRO, w: BODY_W, h: BODY_BOTTOM - BODY_TOP_WITH_INTRO + 0.35,
      barDir: 'bar',
      barGrouping: 'clustered',
      chartColors: [hex(GREEN_WASH), hex(GREEN)],
      showLegend: true,
      legendPos: 'b',
      legendFontFace: FONT_BODY,
      legendFontSize: 10,
      showValue: true,
      dataLabelFontFace: FONT_DISPLAY,
      dataLabelFontSize: 9,
      dataLabelColor: hex(INK),
      dataLabelFormatCode: '#,##0',
      catAxisLabelFontFace: FONT_BODY,
      catAxisLabelFontSize: 9,
      catAxisLabelColor: hex(INK),
      // PowerPoint plots the first category at the foot of a bar chart, which puts the
      // largest row at the bottom and reverses the order the PDF shows.
      catAxisOrientation: 'maxMin',
      valAxisLabelFontFace: FONT_BODY,
      valAxisLabelFontSize: 9,
      valAxisLabelColor: hex(MUTED),
      valAxisLabelFormatCode: '#,##0',
      valGridLine: { style: 'solid', color: hex(LINE), size: 1 },
      catGridLine: { style: 'none' },
    },
  );
}

/* ------------------------------------------------------------ narrative slides */

const BODY_FONT_SIZE = 15;
/** Characters that fit on one line of body text across the slide, near enough. */
const CHARS_PER_LINE = 105;
/** Vertical units a slide's body can hold. One unit is roughly one line of body text. */
const SLIDE_CAPACITY = 13;
/** What a section's own heading costs, in the same units. */
const HEADING_COST = 2.2;

interface NarrativeSection {
  heading: string;
  lines: string[];
}

/** How many lines a bullet wraps to, so a slide is filled rather than guessed at. */
function bulletCost(line: string): number {
  return Math.max(1, Math.ceil(line.length / CHARS_PER_LINE)) + 0.35;
}

/**
 * Packs sections onto as few slides as will hold them.
 *
 * One section per slide produced a deck of eighteen slides for a six-page report, most
 * of them four bullets above two-thirds of empty white — which reads as unfinished
 * work rather than as a designed document. Sections are therefore filled onto a slide
 * until it is full, and a section too long for one slide is continued onto the next
 * rather than shrunk to fit. Silently dropping the tail of a section is the failure
 * the original PDF writer had, and auto-shrinking type is the same failure with better
 * manners.
 */
function packSections(sections: NarrativeSection[]): { heading: string; lines: string[]; continued: boolean }[][] {
  const slides: { heading: string; lines: string[]; continued: boolean }[][] = [];
  let current: { heading: string; lines: string[]; continued: boolean }[] = [];
  let used = 0;

  const flush = () => {
    if (current.length > 0) slides.push(current);
    current = [];
    used = 0;
  };

  for (const section of sections) {
    let pending = [...section.lines];
    let continued = false;

    while (pending.length > 0) {
      const room = SLIDE_CAPACITY - used - HEADING_COST;
      // Not enough room left for a heading and at least two bullets under it.
      if (room < bulletCost(pending[0]!) + 1) {
        flush();
        continue;
      }

      const taken: string[] = [];
      let cost = 0;
      while (pending.length > 0 && cost + bulletCost(pending[0]!) <= room) {
        cost += bulletCost(pending[0]!);
        taken.push(pending.shift()!);
      }

      current.push({ heading: section.heading, lines: taken, continued });
      used += HEADING_COST + cost;
      continued = true;

      if (pending.length > 0) flush();
    }
  }

  flush();
  return slides;
}

/** Narrative, as bullets, several sections to a slide where they fit. */
function narrativeSlides(
  deck: Deck, meta: ReportMeta, chapters: ChapterBlock[], state: RenderState, sections: NarrativeSection[],
) {
  for (const group of packSections(sections)) {
    const first = group[0]!;
    const slide = contentSlide(
      deck, meta, chapters, state,
      first.continued ? `${first.heading} (continued)` : first.heading,
    );

    let y = BODY_TOP;
    group.forEach((part, index) => {
      if (index > 0) {
        // Subsequent sections carry their own heading inside the slide.
        slide.addText(part.continued ? `${part.heading} (continued)` : part.heading, {
          x: MARGIN, y, w: BODY_W, h: 0.34,
          fontFace: FONT_DISPLAY, fontSize: 15, bold: true, color: hex(state.tone.deep),
        });
        y += 0.42;
      }

      const height = part.lines.reduce((sum, line) => sum + bulletCost(line), 0) * 0.29;
      slide.addText(
        part.lines.map((line) => ({
          text: line,
          options: { bullet: { characterCode: '25AA' }, breakLine: true, paraSpaceAfter: 8 },
        })),
        {
          x: MARGIN, y, w: BODY_W, h: Math.min(height, BODY_BOTTOM - y),
          fontFace: FONT_BODY, fontSize: BODY_FONT_SIZE, color: hex(INK),
          lineSpacingMultiple: 1.25, valign: 'top',
        },
      );
      y += height + 0.24;
    });
  }
}

/** A qualification the reader must see, under the orange bar the PDF uses. */
function calloutSlide(deck: Deck, meta: ReportMeta, chapters: ChapterBlock[], state: RenderState, text: string) {
  const slide = contentSlide(deck, meta, chapters, state, 'Basis of preparation');

  slide.addShape(deck.ShapeType.rect, {
    x: MARGIN, y: 1.8, w: BODY_W, h: 0.4, fill: { color: hex(ORANGE) }, line: NO_LINE,
  });
  slide.addText('READ THIS ALONGSIDE THE FIGURES', {
    x: MARGIN + 0.2, y: 1.83, w: BODY_W - 0.4, h: 0.34,
    fontFace: FONT_BODY, fontSize: 10, bold: true, charSpacing: 0.7, color: hex(WHITE),
  });
  slide.addShape(deck.ShapeType.rect, {
    x: MARGIN, y: 2.2, w: BODY_W, h: 1.6, fill: { color: hex(GREEN_WASH_SOFT) }, line: NO_LINE,
  });
  slide.addText(text, {
    x: MARGIN + 0.25, y: 2.4, w: BODY_W - 0.5, h: 1.2,
    fontFace: FONT_BODY, fontSize: 12, color: hex(INK), lineSpacingMultiple: 1.3, valign: 'top',
  });
}

/**
 * Renders one specification block onto the deck.
 *
 * As in the PDF renderer, the switch is exhaustive by construction: assertNever fails
 * the build if a block type is added without a case, so a new block cannot ship as a
 * blank slide.
 */
function renderBlock(
  deck: Deck, block: ReportBlock, meta: ReportMeta, chapters: ChapterBlock[], state: RenderState,
): void {
  switch (block.kind) {
    case 'cover':
      coverSlide(deck, meta);
      return;

    case 'chapter':
      // Changes the tone every following slide is drawn in; see above for why it does
      // not produce a slide of its own.
      state.chapterIndex = chapters.indexOf(block);
      state.tone = TONES[block.tone];
      return;

    case 'break':
      // Slides break by construction; a page break has no meaning here. Recorded as a
      // deliberate no-op rather than omitted, so the exhaustiveness check stays honest.
      return;

    case 'metricGrid':
      metricSlide(deck, meta, chapters, state, block.title, block.metrics);
      return;

    case 'reachComparison':
      reachSlide(deck, meta, chapters, state, block.title, block.intro, block.rows);
      return;

    case 'progress':
      progressSlide(deck, meta, chapters, state, block.title, block.pct, block.caption);
      return;

    case 'spend':
      spendSlide(deck, meta, chapters, state, block.title, block.intro, block.rows);
      return;

    case 'section':
      // Reached only when a section stands alone; buildDeck batches consecutive ones
      // so they share a slide.
      narrativeSlides(deck, meta, chapters, state, [{ heading: block.heading, lines: block.lines }]);
      return;

    case 'callout':
      calloutSlide(deck, meta, chapters, state, block.text);
      return;

    default:
      assertNever(block);
  }
}

/** Populates a deck from a specification. Exported so a test can build one without writing a file. */
export function buildDeck(deck: Deck, spec: ReportSpec): Deck {
  deck.defineLayout({ name: 'SPIMS_16x9', width: W, height: H });
  deck.layout = 'SPIMS_16x9';
  deck.author = spec.meta.organisation;
  deck.title = `${spec.meta.title} — ${spec.meta.financialYear}`;
  deck.subject = spec.meta.subtitle;

  const chapters = chaptersOf(spec);
  const state: RenderState = { page: 0, chapterIndex: 0, tone: TONES.overview };

  // Consecutive narrative sections are rendered together so they can share a slide.
  // Every other block renders on its own.
  for (let i = 0; i < spec.blocks.length; i += 1) {
    const block = spec.blocks[i]!;
    if (block.kind !== 'section') {
      renderBlock(deck, block, spec.meta, chapters, state);
      continue;
    }
    const run: NarrativeSection[] = [];
    while (i < spec.blocks.length && spec.blocks[i]!.kind === 'section') {
      const next = spec.blocks[i] as Extract<ReportBlock, { kind: 'section' }>;
      run.push({ heading: next.heading, lines: next.lines });
      i += 1;
    }
    i -= 1;
    narrativeSlides(deck, spec.meta, chapters, state, run);
  }
  return deck;
}

/** Builds and downloads the deck. Returns the filename written. */
export async function renderReportPptx(spec: ReportSpec, filename: string): Promise<string> {
  const { default: PptxGenJS } = await import('pptxgenjs');
  const deck = new PptxGenJS() as unknown as Deck;
  buildDeck(deck, spec);
  await deck.writeFile({ fileName: filename });
  return filename;
}
