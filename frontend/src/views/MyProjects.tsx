import { Icon } from '../components/Icon';
import { h1, PILLAR_COLORS, pill, primaryBtn, secondaryBtn, STATUS_COLORS, tableHeaderRow, tableRow } from '../ui';
import type { Project } from '../types';

export function MyProjects({ projects, goNewProject }: { projects: Project[]; goNewProject: () => void }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 22 }}>
        <div>
          <h1 style={h1}>My Projects</h1>
          <p style={{ fontSize: 14.5, color: 'var(--muted)', margin: 0 }}>
            Projects you own across Edo &amp; Delta. Update delivery, log spend and submit for approval.
          </p>
        </div>
        <button onClick={goNewProject} style={{ ...primaryBtn, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="plus" size={16} strokeWidth={2.4} />
          New project
        </button>
      </div>
      <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ ...tableHeaderRow, display: 'grid', gridTemplateColumns: '2.4fr 1.1fr 1fr 1.3fr 1fr 0.9fr' }}>
          <span>Project</span>
          <span>Pillar</span>
          <span>State</span>
          <span>Progress</span>
          <span>Status</span>
          <span></span>
        </div>
        {projects.map((p) => {
          const [pillarBg, pillarFg] = PILLAR_COLORS[p.pillar] ?? ['#eee', '#555'];
          const [statusBg, statusFg] = STATUS_COLORS[p.status] ?? ['#eee', '#555'];
          return (
            <div key={p.id} className="rowh" style={{ ...tableRow, display: 'grid', gridTemplateColumns: '2.4fr 1.1fr 1fr 1.3fr 1fr 0.9fr' }}>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--navy)' }}>{p.name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                  {p.code} · {p.budget} budget
                </div>
              </div>
              <div>
                <span style={pill(pillarBg, pillarFg)}>{p.pillar}</span>
              </div>
              <div style={{ color: 'var(--ink)' }}>{p.state}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ flex: 1, height: 6, background: 'var(--bg)', borderRadius: 4, overflow: 'hidden' }}>
                  <span style={{ display: 'block', height: '100%', width: p.progPct, background: 'var(--accent)' }} />
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>{p.progress}</span>
              </div>
              <div>
                <span style={pill(statusBg, statusFg)}>{p.status}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <button onClick={goNewProject} style={{ ...secondaryBtn, fontSize: 12.5, padding: '7px 14px' }}>
                  Manage
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
