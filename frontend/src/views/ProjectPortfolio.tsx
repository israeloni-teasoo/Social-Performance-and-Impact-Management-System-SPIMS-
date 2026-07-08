import { h1, PILLAR_COLORS, pill, STATUS_COLORS, subtitle, tableHeaderRow, tableRow } from '../ui';
import type { Project } from '../types';

export function ProjectPortfolio({ projects }: { projects: Project[] }) {
  return (
    <div>
      <h1 style={h1}>Project Portfolio</h1>
      <p style={subtitle}>47 active projects across four pillars. Track spend, delivery and risk against plan.</p>

      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, padding: '8px 16px', borderRadius: 9, background: 'var(--navy)', color: '#fff' }}>
          All pillars
        </span>
        {['Education', 'Health', 'Infrastructure', 'Economic Emp.'].map((p) => (
          <span
            key={p}
            style={{ fontSize: 12.5, fontWeight: 600, padding: '8px 16px', borderRadius: 9, background: '#fff', border: '1px solid var(--line)', color: 'var(--ink)' }}
          >
            {p}
          </span>
        ))}
      </div>

      <div className="table-scroll">
      <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, overflow: 'hidden', minWidth: 920 }}>
        <div style={{ ...tableHeaderRow, display: 'grid', gridTemplateColumns: '2.2fr 1.1fr 1fr 1.4fr 1.2fr 1fr' }}>
          <span>Project</span>
          <span>Pillar</span>
          <span>State</span>
          <span>Budget · Utilised</span>
          <span>Progress</span>
          <span>Status</span>
        </div>
        {projects.map((p) => {
          const [pillarBg, pillarFg] = PILLAR_COLORS[p.pillar] ?? ['#eee', '#555'];
          const [statusBg, statusFg] = STATUS_COLORS[p.status] ?? ['#eee', '#555'];
          return (
            <div key={p.id} className="rowh" style={{ ...tableRow, display: 'grid', gridTemplateColumns: '2.2fr 1.1fr 1fr 1.4fr 1.2fr 1fr' }}>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--navy)' }}>{p.name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                  {p.code} · {p.output}
                </div>
              </div>
              <div>
                <span style={pill(pillarBg, pillarFg)}>{p.pillar}</span>
              </div>
              <div style={{ color: 'var(--ink)' }}>{p.state}</div>
              <div>
                <div style={{ fontWeight: 600 }}>{p.budget}</div>
                <span style={{ display: 'block', height: 6, width: 110, background: 'var(--bg)', borderRadius: 4, overflow: 'hidden', marginTop: 5 }}>
                  <span style={{ display: 'block', height: '100%', width: p.utilPct, background: '#2B4C9B' }} />
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ flex: 1, height: 6, background: 'var(--bg)', borderRadius: 4, overflow: 'hidden' }}>
                  <span style={{ display: 'block', height: '100%', width: p.progPct, background: 'var(--accent)' }} />
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>{p.progress}</span>
              </div>
              <div>
                <span style={pill(statusBg, statusFg)}>{p.status}</span>
              </div>
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}
