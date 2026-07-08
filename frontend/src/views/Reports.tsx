import { useState } from 'react';
import { exportReport } from '../reportExport';
import { card, h1, REPORT_LENS_COLORS, subtitle } from '../ui';
import type { Report } from '../types';
import type { ToastTone } from '../useToastQueue';

const FORMATS: { key: 'pdf' | 'excel' | 'word' | 'powerpoint'; label: string }[] = [
  { key: 'pdf', label: 'PDF' },
  { key: 'excel', label: 'Excel' },
  { key: 'word', label: 'Word' },
  { key: 'powerpoint', label: 'PowerPoint' },
];

export function Reports({ reports, pushToast }: { reports: Report[]; pushToast: (message: string, tone?: ToastTone) => void }) {
  const [openId, setOpenId] = useState<string | null>(null);

  const handleFormat = (report: Report, format: (typeof FORMATS)[number]['key']) => {
    setOpenId(null);
    if (format === 'powerpoint') {
      pushToast('PowerPoint export is coming in Phase 2 — use PDF or Word for now.', 'info');
      return;
    }
    const filename = exportReport(report, format);
    pushToast(`Downloaded ${filename}.`, 'success');
  };

  return (
    <div>
      <h1 style={h1}>Reports &amp; Exports</h1>
      <p style={subtitle}>One dataset, two audiences. Generate board, regulatory and investor reports — no double entry.</p>

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
            Same data, reported two ways
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>Local compliance &amp; global ESG — from one entry.</div>
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
          const isOpen = openId === r.id;
          return (
            <div key={r.id} className="card-lift" style={{ ...card, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
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
                <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>{r.updated}</span>
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>{r.name}</div>
              <p style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.45, margin: '0 0 18px', flex: 1 }}>{r.desc}</p>

              {isOpen ? (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {FORMATS.map((f) => (
                    <button
                      key={f.key}
                      onClick={() => handleFormat(r, f.key)}
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
              ) : (
                <button
                  onClick={() => setOpenId(r.id)}
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
                  Generate report →
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
