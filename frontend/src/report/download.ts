import { analysePortfolio } from '../analytics/metrics';
import { renderReportPdf } from '../reportPdf';
import { describeValidation, validateReport } from './validate';
import type { Project, ProjectImpact } from '../types';
import type { ReportSpec } from './spec';

/**
 * The one route from a specification to a downloaded file.
 *
 * Every screen that offers a designed export goes through here — the portfolio report
 * and the single-programme report alike. That matters because the steps between the
 * specification and the file are not incidental: the narrative is reconciled against
 * the analytics layer before anything is written, and a screen that skipped this would
 * quietly issue an unvalidated report. Keeping it in one place means a new export
 * surface cannot forget.
 */

export type DesignedFormat = 'pdf' | 'powerpoint';

export interface DownloadOptions {
  spec: ReportSpec;
  format: DesignedFormat;
  /** Filename without extension. */
  base: string;
  /** The programmes the report's figures are drawn from, for reconciliation. */
  projects: Project[];
  impacts: Record<string, ProjectImpact>;
  notify: (message: string, tone?: 'info' | 'success' | 'warning') => void;
}

/** A filename that will not surprise anyone on Windows. */
export function slugForFile(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'report';
}

export async function downloadDesignedReport(options: DownloadOptions): Promise<void> {
  const { spec, format, base, projects, impacts, notify } = options;
  const isDeck = format === 'powerpoint';
  const label = isDeck ? 'deck' : 'report';
  const filename = `${base}.${isDeck ? 'pptx' : 'pdf'}`;

  // Both renderers pull in their engine on demand, so say something first.
  notify(`Building the ${label}…`, 'info');

  try {
    // Reconcile the narrative against the analytics layer before the report leaves the
    // building. A figure that cannot be tied back to the data is surfaced rather than
    // silently exported.
    const validation = validateReport(spec, analysePortfolio(projects, impacts));
    if (!validation.ok) {
      notify(`${describeValidation(validation)} ${validation.findings[0]?.message ?? ''}`, 'warning');
    }

    if (isDeck) {
      const { renderReportPptx } = await import('../reportPptx');
      await renderReportPptx(spec, filename);
    } else {
      await renderReportPdf(spec, filename);
    }
    notify(`Downloaded ${filename}.`, 'success');
  } catch {
    notify(`Could not build that ${label} — try again.`, 'warning');
  }
}

/** The date stamp every generated report carries. */
export function generatedOnLabel(): string {
  return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
}
