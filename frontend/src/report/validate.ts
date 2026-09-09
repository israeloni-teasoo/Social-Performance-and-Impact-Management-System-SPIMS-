import type { PortfolioAnalytics } from '../analytics/metrics';
import type { ReportSpec } from './spec';

/**
 * Reconciles the figures quoted in a report's narrative against the analytics layer.
 *
 * SPIMS reports numbers to a board and to regulators, and narrative text is the one
 * place a figure can drift from the data — a section written by hand months ago, or a
 * sentence drafted by a language model. Either way, the failure is silent: the
 * paragraph reads perfectly and contradicts the chart on the previous page.
 *
 * This does not attempt to understand the prose. It extracts the large numbers a
 * reader would take as portfolio figures and checks each one is a figure the analytics
 * layer actually produced. Anything unrecognised is reported for a human to confirm,
 * not silently corrected — a validator that edits a report is worse than one that
 * flags it.
 */

export type FindingSeverity = 'mismatch' | 'unverified';

export interface ValidationFinding {
  severity: FindingSeverity;
  heading: string;
  quoted: string;
  message: string;
}

export interface ValidationResult {
  ok: boolean;
  findings: ValidationFinding[];
  /** How many numeric claims were checked, so a clean pass is distinguishable from no checks. */
  checked: number;
}

/** Below this, a number is a count of projects or a percentage, not a portfolio total. */
const SIGNIFICANT = 1000;

function parseGrouped(raw: string): number | null {
  const n = Number(raw.replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

/**
 * Every figure the analytics layer stands behind, including the parts that make up the
 * totals — a section may legitimately quote a single pillar or programme.
 */
function verifiedValues(analytics: PortfolioAnalytics): Set<number> {
  const values = new Set<number>();
  const add = (n: number) => {
    if (Number.isFinite(n)) values.add(Math.round(n));
  };

  add(analytics.reach);
  add(analytics.impact);
  add(analytics.reach - analytics.impact);
  add(analytics.projectCount);
  add(analytics.conversionPct);
  add(analytics.totalBudgetMillions);

  for (const p of analytics.pillars) {
    add(p.reach);
    add(p.impact);
    add(p.reach - p.impact);
  }
  // A section may quote one programme rather than a portfolio total; without these
  // the validator flags legitimate content and quickly gets ignored.
  for (const p of analytics.programmes) {
    add(p.reach);
    add(p.impact);
    add(p.reach - p.impact);
  }
  for (const s of analytics.spend) {
    add(s.budgetMillions);
    add(s.utilisedPct);
  }
  for (const m of analytics.headline) add(m.value);

  return values;
}

export function validateReport(spec: ReportSpec, analytics: PortfolioAnalytics): ValidationResult {
  const verified = verifiedValues(analytics);
  const findings: ValidationFinding[] = [];
  let checked = 0;

  for (const block of spec.blocks) {
    if (block.kind !== 'section') continue;

    for (const line of block.lines) {
      // Grouped numbers ("169,841") are the ones a reader reads as a portfolio figure.
      for (const match of line.matchAll(/\b\d{1,3}(?:,\d{3})+\b/g)) {
        const value = parseGrouped(match[0]);
        if (value === null || value < SIGNIFICANT) continue;
        checked += 1;
        if (!verified.has(value)) {
          findings.push({
            severity: 'unverified',
            heading: block.heading,
            quoted: match[0],
            message: `"${match[0]}" in "${block.heading}" does not correspond to any figure the analytics layer produced. Confirm it before this report is issued.`,
          });
        }
      }
    }
  }

  return { ok: findings.length === 0, findings, checked };
}

/** One-line summary for a toast or a log. */
export function describeValidation(result: ValidationResult): string {
  if (result.checked === 0) return 'No numeric claims to reconcile.';
  if (result.ok) return `${result.checked} numeric claims reconciled against the analytics layer.`;
  return `${result.findings.length} of ${result.checked} numeric claims could not be reconciled.`;
}
