import { card, h1, subtitle } from '../ui';
import type { Community } from '../types';

export function Communities({ communities }: { communities: Community[] }) {
  return (
    <div>
      <h1 style={h1}>Communities</h1>
      <p style={subtitle}>Host community profiles — leadership, needs and the projects running in each.</p>
      <div className="grid-3">
        {communities.map((c) => (
          <div key={c.id} className="card-lift" style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--navy)' }}>{c.name}</div>
                <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                  {c.lga}, {c.state}
                </div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: 'var(--bg)', color: 'var(--ink)' }}>
                {c.projects} projects
              </span>
            </div>
            <div style={{ display: 'flex', gap: 20, borderTop: '1px solid var(--line)', paddingTop: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Population</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{c.pop}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>FY26 spend</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{c.spend}</div>
              </div>
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--ink)', marginTop: 14, lineHeight: 1.4 }}>
              <span style={{ color: 'var(--muted)' }}>CDC:</span> {c.cdc}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
