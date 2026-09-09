import { useState } from 'react';
import { ReportPreviewModal } from '../components/ReportPreviewModal';
import { exportReport } from '../reportExport';
import { exportReportPdf } from '../reportPdf';
import { card, h1, pill, REPORT_LENS_COLORS, subtitle } from '../ui';
import type { ReportSection } from '../reportContent';
import type { OrgSettings, Project, ProjectImpact, Report, ReportComment, Role } from '../types';
import type { ToastTone } from '../useToastQueue';

export function Reports({
  reports,
  projects,
  impacts,
  role,
  userName,
  comments,
  onComment,
  org,
  pushToast,
}: {
  reports: Report[];
  projects: Project[];
  impacts: Record<string, ProjectImpact>;
  role: Role;
  userName: string;
  comments: ReportComment[];
  onComment: (reportId: string, author: string, text: string, requestsCorrection: boolean) => void;
  org: OrgSettings;
  pushToast: (message: string, tone?: ToastTone) => void;
}) {
  const [previewing, setPreviewing] = useState<Report | null>(null);
  const canComment = role === 'manager';

  const handleFormat = async (report: Report, format: 'pdf' | 'excel' | 'word' | 'powerpoint', sections: ReportSection[], fy: string, scopeNote: string) => {
    if (format === 'powerpoint') {
      pushToast('PowerPoint export is planned for Phase 2 — it will produce real, editable charts rather than pictures of them. Use PDF or Word for now.', 'info');
      return;
    }
    if (format === 'pdf') {
      // The designed exporter pulls in its engine on demand, so give feedback first.
      pushToast('Building the report…', 'info');
      const base = report.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      try {
        await exportReportPdf({ report, sections, fy, scopeNote, org, projects, impacts }, `${base}.pdf`);
        pushToast(`Downloaded ${base}.pdf.`, 'success');
      } catch {
        pushToast('Could not build that PDF — try again.', 'warning');
      }
      return;
    }
    const filename = exportReport(report, format, sections, fy, scopeNote);
    pushToast(`Downloaded ${filename}.`, 'success');
  };

  const needsRevision = (reportId: string) => comments.some((c) => c.reportId === reportId && c.requestsCorrection);

  return (
    <div>
      <h1 style={h1}>Reports &amp; Exports</h1>
      <p style={subtitle}>
        Each report is compiled automatically from live SPIMS data using a standardized template for its audience.
      </p>

      <div
        style={{
          background: 'linear-gradient(120deg,#111c55,#1c2e6e)',
          color: '#fff',
          borderRadius: 16,
          padding: '26px 30px',
          marginBottom: 22,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9EA1C0' }}>
            Reporting formats
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>Local compliance and global ESG reporting from one dataset.</div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {['PDF', 'Excel', 'PowerPoint', 'Word'].map((f) => (
            <span key={f} style={{ fontSize: 12.5, fontWeight: 600, padding: '9px 16px', borderRadius: 9, background: 'rgba(255,255,255,0.12)' }}>
              {f}
            </span>
          ))}
        </div>
      </div>

      <div className="grid-3">
        {reports.map((r) => {
          const [tagBg, tagFg] = REPORT_LENS_COLORS[r.lens] ?? ['#eee', '#555'];
          return (
            <div key={r.id} className="card-lift" style={{ ...card, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 6 }}>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    padding: '4px 10px',
                    borderRadius: 6,
                    background: tagBg,
                    color: tagFg,
                  }}
                >
                  {r.lens}
                </span>
                {needsRevision(r.id) ? <span style={pill('rgba(192,73,30,0.14)', '#C0491E')}>Needs revision</span> : <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>{r.updated}</span>}
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>{r.name}</div>
              <p style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.45, margin: '0 0 18px', flex: 1 }}>{r.desc}</p>

              <button
                onClick={() => setPreviewing(r)}
                style={{
                  alignSelf: 'flex-start',
                  fontFamily: 'inherit',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#fff',
                  background: 'var(--accent)',
                  border: 'none',
                  borderRadius: 9,
                  padding: '9px 18px',
                  cursor: 'pointer',
                }}
              >
                Preview report →
              </button>
            </div>
          );
        })}
      </div>

      {previewing && (
        <ReportPreviewModal
          report={previewing}
          projects={projects}
          impacts={impacts}
          comments={comments.filter((c) => c.reportId === previewing.id)}
          canComment={canComment}
          onClose={() => setPreviewing(null)}
          onFormat={handleFormat}
          onComment={(text, requestsCorrection) => onComment(previewing.id, userName, text, requestsCorrection)}
        />
      )}
    </div>
  );
}
