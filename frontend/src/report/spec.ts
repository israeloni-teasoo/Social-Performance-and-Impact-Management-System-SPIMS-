import type { Metric, PillarMetrics, ProgrammeSpend } from '../analytics/metrics';

/**
 * The report specification.
 *
 * A report is described once, as data, and rendered many ways. The PDF renderer, and
 * the PowerPoint renderer that follows it, both consume this — neither owns the
 * report's structure, and adding a format does not mean reimplementing the report.
 *
 * The block list is deliberately a closed set. A renderer must handle every block
 * type, and the compiler enforces that: adding a block without teaching every renderer
 * about it fails the build rather than producing a silently empty slide.
 */

export interface ReportMeta {
  title: string;
  subtitle: string;
  organisation: string;
  financialYear: string;
  currencyLabel: string;
  scopeNote: string;
  dataStatusNote: string;
  generatedOn: string;
}

/** Opening block: title, scope and data status. */
export interface CoverBlock {
  kind: 'cover';
}

/**
 * The colour families a chapter can be set in.
 *
 * Seplat's own report colour-codes its chapters and carries a tab strip showing which
 * one the reader is in. Naming the tone rather than the colour keeps the palette a
 * renderer's decision — a slide deck and a PDF need not tint it identically.
 */
export type ChapterTone = 'overview' | 'impact' | 'communities' | 'governance';

/**
 * Starts a chapter: a break, a tab strip with this chapter active, and its title.
 *
 * Chapters are what make the tab strip possible. A renderer cannot work out which
 * chapter a given page belongs to after the fact — layout decides where pages fall —
 * so the structure has to be declared here rather than inferred downstream.
 */
export interface ChapterBlock {
  kind: 'chapter';
  title: string;
  tone: ChapterTone;
}

/** A row of headline figures. */
export interface MetricGridBlock {
  kind: 'metricGrid';
  title: string;
  metrics: Metric[];
}

/** Reach against impact, per pillar. */
export interface ReachComparisonBlock {
  kind: 'reachComparison';
  title: string;
  intro: string;
  rows: PillarMetrics[];
}

/** A single proportion, drawn as a filled track. */
export interface ProgressBlock {
  kind: 'progress';
  title?: string;
  pct: number;
  caption: string;
}

/** Programme budgets with the share drawn down. */
export interface SpendBlock {
  kind: 'spend';
  title: string;
  intro: string;
  rows: ProgrammeSpend[];
}

/** Narrative: a heading and its bullet points. */
export interface SectionBlock {
  kind: 'section';
  heading: string;
  lines: string[];
}

/** A qualification the reader must see. */
export interface CalloutBlock {
  kind: 'callout';
  text: string;
}

/** Forces a page or slide boundary. */
export interface BreakBlock {
  kind: 'break';
}

export type ReportBlock =
  | CoverBlock
  | ChapterBlock
  | MetricGridBlock
  | ReachComparisonBlock
  | ProgressBlock
  | SpendBlock
  | SectionBlock
  | CalloutBlock
  | BreakBlock;

export interface ReportSpec {
  meta: ReportMeta;
  blocks: ReportBlock[];
}

/**
 * Exhaustiveness guard for renderers.
 *
 * A renderer's switch ends with `default: return assertNever(block)`. If a block type
 * is added and that renderer is not updated, this fails to compile — which is the
 * point: a missing case would otherwise ship as a blank section in a client report.
 */
export function assertNever(value: never): never {
  throw new Error(`Unhandled report block: ${JSON.stringify(value)}`);
}

/**
 * The chapters a report declares, in order.
 *
 * A tab strip has to name every chapter, not just the one being drawn, so renderers
 * need the whole list before they render any single chapter.
 */
export function chaptersOf(spec: ReportSpec): ChapterBlock[] {
  return spec.blocks.filter((b): b is ChapterBlock => b.kind === 'chapter');
}
