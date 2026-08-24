import { useRef, useState } from 'react';
import { buildReportSections } from '../reportContent';
import { REPORT_LENS_COLORS } from '../ui';
import { InfoTip } from './Tooltip';
import type { Project, ProjectImpact, Report, ReportComment } from '../types';

const FORMATS: { key: 'pdf' | 'excel' | 'word' | 'powerpoint'; label: string }[] = [
  { key: 'pdf', label: 'PDF' },
  { key: 'excel', label: 'Excel' },
  { key: 'word', label: 'Word' },
  { key: 'powerpoint', label: 'PowerPoint' },
];

export function ReportPreviewModal({
  report,
  projects,
  impacts,
  comments,
  canComment,
  onClose,
  onFormat,
  onComment,
}: {
  report: Report;
  projects: Project[];
  impacts: Record<string, ProjectImpact>;
  comments: ReportComment[];
  canComment: boolean;
  onClose: () => void;
  onFormat: (report: Report, format: (typeof FORMATS)[number]['key']) => void;
  onComment: (text: string, requestsCorrection: boolean) => void;
}) {
  const sections = buildReportSections(report, projects, impacts);
  const [tagBg, tagFg] = REPORT_LENS_COLORS[report.lens] ?? ['#eee', '#555'];
  const [requestsCorrection, setRequestsCorrection] = useState(false);
  const commentRef = useRef<HTMLTextAreaElement>(null);

  const submitComment = () => {
    const text = commentRef.current?.value.trim();
    if (!text) return;
    onComment(text, requestsCorrection);
    if (commentRef.current) commentRef.current.value = '';
    setRequestsCorrection(false);
  };

  return (
    <div className="spims-modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(17,28,85,0.5)' }} />
      <div
        className="spims-scroll spims-modal-card"
        style={{
          position: 'relative',
          background: '#fff',
          borderRadius: 18,
          maxWidth: 760,
          width: '100%',
          maxHeight: '88vh',
          overflowY: 'auto',
          boxShadow: '0 30px 80px -20px rgba(0,0,0,0.55)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            padding: '24px 28px 18px',
            borderBottom: '1px solid var(--line)',
            position: 'sticky',
            top: 0,
            background: '#fff',
            zIndex: 1,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 6, background: tagBg, color: tagFg }}>
                {report.lens}
              </span>
              <InfoTip label="About this report">
                Auto-generated from live SPIMS data using a standardized template — not manually authored. Last compiled {report.updated}.
              </InfoTip>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)', lineHeight: 1.2, marginTop: 10 }}>{report.name}</div>
            <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 6 }}>{report.desc}</div>
          </div>
          <button
            onClick={onClose}
            style={{ fontFamily: 'inherit', fontSize: 22, lineHeight: 1, color: 'var(--muted)', background: 'var(--bg)', border: 'none', borderRadius: 10, width: 38, height: 38, cursor: 'pointer', flexShrink: 0 }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '22px 28px' }}>
          {sections.map((section) => (
            <div key={section.heading} style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid var(--line)' }}>
                {section.heading}
              </div>
              <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {section.lines.map((line, i) => (
                  <li key={i} style={{ fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.5 }}>
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', paddingTop: 12, borderTop: '1px solid var(--line)', marginBottom: 24 }}>
            <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>Download this report:</span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {FORMATS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => onFormat(report, f.key)}
                  style={{
                    fontFamily: 'inherit',
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: 'var(--navy)',
                    background: '#fff',
                    border: '1px solid var(--line)',
                    borderRadius: 8,
                    padding: '8px 14px',
                    cursor: 'pointer',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ paddingTop: 12, borderTop: '1px solid var(--line)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', marginBottom: 12 }}>
              Comments {comments.length > 0 && <span style={{ color: 'var(--muted)', fontWeight: 500 }}>({comments.length})</span>}
            </div>
            {comments.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                {comments.map((c) => (
                  <div key={c.id} style={{ background: c.requestsCorrection ? 'rgba(192,73,30,0.06)' : 'var(--bg)', border: c.requestsCorrection ? '1px solid rgba(192,73,30,0.2)' : 'none', borderRadius: 10, padding: '10px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 4 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--navy)' }}>{c.author}</span>
                      <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>{c.createdAt}</span>
                    </div>
                    {c.requestsCorrection && (
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#C0491E', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Correction requested</div>
                    )}
                    <div style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.5 }}>{c.text}</div>
                  </div>
                ))}
              </div>
            )}

            {canComment ? (
              <div>
                <textarea
                  ref={commentRef}
                  rows={3}
                  placeholder="Leave a comment — e.g. flag a figure that looks wrong, or ask for an update before this goes out."
                  style={{ width: '100%', fontFamily: 'inherit', fontSize: 13.5, padding: '12px 14px', border: '1px solid var(--line)', borderRadius: 10, background: '#fbfbfd', color: 'var(--ink)', resize: 'vertical', marginBottom: 10 }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--ink)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={requestsCorrection} onChange={(e) => setRequestsCorrection(e.target.checked)} />
                    Request a correction / update
                  </label>
                  <button
                    onClick={submitComment}
                    style={{ fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, color: '#fff', background: 'var(--accent)', border: 'none', borderRadius: 9, padding: '9px 18px', cursor: 'pointer' }}
                  >
                    Post comment →
                  </button>
                </div>
              </div>
            ) : (
              comments.length === 0 && <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>No comments yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
