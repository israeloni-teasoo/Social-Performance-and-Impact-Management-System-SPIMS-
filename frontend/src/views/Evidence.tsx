import { Icon } from '../components/Icon';
import { h1, primaryBtn } from '../ui';
import type { EvidenceItem } from '../types';

export function Evidence({ items, goLogActivity }: { items: EvidenceItem[]; goLogActivity: () => void }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 22 }}>
        <div>
          <h1 style={h1}>Evidence Repository</h1>
          <p style={{ fontSize: 14.5, color: 'var(--muted)', margin: 0 }}>
            Photos, sheets, videos and documents — geo-tagged and linked to their project.
          </p>
        </div>
        <button onClick={goLogActivity} style={{ ...primaryBtn, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="plus" size={16} strokeWidth={2.4} />
          Upload
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18 }}>
        {items.map((e) => (
          <div key={e.id} className="card-lift" style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 14, overflow: 'hidden' }}>
            <div
              style={{
                height: 132,
                background: 'repeating-linear-gradient(45deg,#eef0f6,#eef0f6 9px,#e5e8f2 9px,#e5e8f2 18px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: '#9498b5', background: '#fff', padding: '4px 10px', borderRadius: 6 }}>
                {e.kind}
              </span>
            </div>
            <div style={{ padding: '14px 16px' }}>
              <div style={{ fontFamily: 'monospace', fontSize: 12.5, fontWeight: 600, color: 'var(--navy)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {e.label}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 3 }}>{e.meta}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
