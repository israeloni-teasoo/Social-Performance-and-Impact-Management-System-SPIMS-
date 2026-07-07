import type { Indicator } from '../types';

export function IndicatorLibrary({ indicators }: { indicators: Indicator[] }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 6px', color: 'var(--navy)' }}>
            Indicator Library
          </h1>
          <p style={{ fontSize: 14.5, color: 'var(--muted)', margin: 0 }}>
            Capture each metric once — report it against the local mandate and global capital-market frameworks.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6, background: '#fff', border: '1px solid var(--line)', borderRadius: 11, padding: 4 }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, padding: '8px 16px', borderRadius: 8, background: 'var(--navy)', color: '#fff' }}>
            Both lenses
          </span>
          <span style={{ fontSize: 12.5, fontWeight: 600, padding: '8px 16px', borderRadius: 8, color: 'var(--muted)' }}>Local</span>
          <span style={{ fontSize: 12.5, fontWeight: 600, padding: '8px 16px', borderRadius: 8, color: 'var(--muted)' }}>Global</span>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, overflow: 'hidden' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.5fr 1.5fr 1.6fr 0.7fr',
            background: 'var(--navy)',
            color: '#fff',
            fontSize: 11.5,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          <div style={{ padding: '16px 22px' }}>Social metric</div>
          <div style={{ padding: '16px 22px', borderLeft: '1px solid rgba(255,255,255,0.12)' }}>Local — Nigeria</div>
          <div style={{ padding: '16px 22px', borderLeft: '1px solid rgba(255,255,255,0.12)' }}>Global standard</div>
          <div style={{ padding: '16px 22px', borderLeft: '1px solid rgba(255,255,255,0.12)' }}>SDG</div>
        </div>
        {indicators.map((i) => (
          <div
            key={i.id}
            className="rowh"
            style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1.6fr 0.7fr', fontSize: 14, borderBottom: '1px solid var(--line)' }}
          >
            <div style={{ padding: '16px 22px', fontWeight: 600, color: 'var(--navy)' }}>{i.metric}</div>
            <div style={{ padding: '16px 22px', color: 'var(--ink)', borderLeft: '1px solid var(--line)' }}>{i.local}</div>
            <div style={{ padding: '16px 22px', color: 'var(--ink)', borderLeft: '1px solid var(--line)' }}>{i.global}</div>
            <div style={{ padding: '16px 22px', fontWeight: 700, color: '#2B4C9B', borderLeft: '1px solid var(--line)' }}>{i.sdg}</div>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 13, color: 'var(--muted)', margin: '14px 0 0' }}>
        Illustrative mapping — the full indicator library is confirmed with Seplat during Phase 1.
      </p>
    </div>
  );
}
