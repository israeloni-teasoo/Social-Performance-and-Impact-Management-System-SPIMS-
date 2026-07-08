import { APPROVAL_TYPE_COLORS, h1 } from '../ui';
import type { Approval } from '../types';

export function Approvals({ approvals }: { approvals: Approval[] }) {
  return (
    <div>
      <h1 style={h1}>Approvals Queue</h1>
      <p style={{ fontSize: 14.5, color: 'var(--muted)', margin: '0 0 20px' }}>
        Field submissions waiting on your review. Approved records flow straight into the KPIs and reports.
      </p>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          background: '#fff',
          border: '1px solid var(--line)',
          borderRadius: 14,
          padding: '16px 22px',
          marginBottom: 20,
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--muted)',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ color: '#2B4C9B' }}>Field officer logs</span>
        <span style={{ color: 'var(--line)' }}>→</span>
        <span style={{ color: 'var(--accent)' }}>Manager reviews &amp; approves</span>
        <span style={{ color: 'var(--line)' }}>→</span>
        <span style={{ color: '#1F8A5B' }}>Feeds indicators &amp; audit trail</span>
        <span style={{ color: 'var(--line)' }}>→</span>
        <span style={{ color: 'var(--navy)' }}>Executive dashboard &amp; reports</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {approvals.map((a) => {
          const [typeBg, typeFg] = APPROVAL_TYPE_COLORS[a.type] ?? ['#eee', '#555'];
          return (
            <div
              key={a.id}
              style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 14, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: '50%',
                  background: 'var(--bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 12,
                  color: 'var(--navy)',
                  flexShrink: 0,
                }}
              >
                {a.who}
              </div>
              <div style={{ flex: '1 1 220px', minWidth: 200 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      padding: '3px 9px',
                      borderRadius: 6,
                      background: typeBg,
                      color: typeFg,
                    }}
                  >
                    {a.type}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy)' }}>{a.item}</span>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                  {a.project} · submitted {a.when}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                <button
                  style={{ fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, color: 'var(--muted)', background: '#fff', border: '1px solid var(--line)', borderRadius: 9, padding: '9px 16px', cursor: 'pointer' }}
                >
                  Return
                </button>
                <button
                  style={{ fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, color: '#fff', background: '#1F8A5B', border: 'none', borderRadius: 9, padding: '9px 18px', cursor: 'pointer' }}
                >
                  Approve
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
