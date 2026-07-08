import { useState } from 'react';
import type { Indicator } from '../types';

type Lens = 'both' | 'local' | 'global';

export function IndicatorLibrary({ indicators }: { indicators: Indicator[] }) {
  const [lens, setLens] = useState<Lens>('both');

  const gridCols = lens === 'both' ? '1.5fr 1.5fr 1.6fr 0.7fr' : '1.5fr 1.8fr 0.7fr';

  const tabStyle = (active: boolean) => ({
    fontSize: 12.5,
    fontWeight: 600,
    padding: '8px 16px',
    borderRadius: 8,
    background: active ? 'var(--navy)' : 'transparent',
    color: active ? '#fff' : 'var(--muted)',
    border: 'none',
    fontFamily: 'inherit',
    cursor: 'pointer',
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 6px', color: 'var(--navy)' }}>
            Indicator Library
          </h1>
          <p style={{ fontSize: 14.5, color: 'var(--muted)', margin: 0 }}>
            Capture each metric once — report it against the local mandate and global capital-market frameworks.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6, background: '#fff', border: '1px solid var(--line)', borderRadius: 11, padding: 4 }}>
          <button onClick={() => setLens('both')} style={tabStyle(lens === 'both')}>
            Both lenses
          </button>
          <button onClick={() => setLens('local')} style={tabStyle(lens === 'local')}>
            Local
          </button>
          <button onClick={() => setLens('global')} style={tabStyle(lens === 'global')}>
            Global
          </button>
        </div>
      </div>

      <div className="table-scroll">
        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, overflow: 'hidden', minWidth: 760 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: gridCols,
              background: 'var(--navy)',
              color: '#fff',
              fontSize: 11.5,
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            <div style={{ padding: '16px 22px' }}>Social metric</div>
            {lens !== 'global' && <div style={{ padding: '16px 22px', borderLeft: '1px solid rgba(255,255,255,0.12)' }}>Local — Nigeria</div>}
            {lens !== 'local' && <div style={{ padding: '16px 22px', borderLeft: '1px solid rgba(255,255,255,0.12)' }}>Global standard</div>}
            <div style={{ padding: '16px 22px', borderLeft: '1px solid rgba(255,255,255,0.12)' }}>SDG</div>
          </div>
          {indicators.map((i) => (
            <div
              key={i.id}
              className="rowh"
              style={{ display: 'grid', gridTemplateColumns: gridCols, fontSize: 14, borderBottom: '1px solid var(--line)' }}
            >
              <div style={{ padding: '16px 22px', fontWeight: 600, color: 'var(--navy)' }}>{i.metric}</div>
              {lens !== 'global' && <div style={{ padding: '16px 22px', color: 'var(--ink)', borderLeft: '1px solid var(--line)' }}>{i.local}</div>}
              {lens !== 'local' && <div style={{ padding: '16px 22px', color: 'var(--ink)', borderLeft: '1px solid var(--line)' }}>{i.global}</div>}
              <div style={{ padding: '16px 22px', fontWeight: 700, color: '#2B4C9B', borderLeft: '1px solid var(--line)' }}>{i.sdg}</div>
            </div>
          ))}
        </div>
      </div>
      <p style={{ fontSize: 13, color: 'var(--muted)', margin: '14px 0 0' }}>
        Illustrative mapping — the full indicator library is confirmed with Seplat during Phase 1.
      </p>
    </div>
  );
}
