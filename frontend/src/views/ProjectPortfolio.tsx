import { useState } from 'react';
import { h1, PILLAR_COLORS, pill, STATUS_COLORS, tableHeaderRow, tableRow } from '../ui';
import type { Project } from '../types';

const PILLARS = ['Education', 'Health', 'Infrastructure', 'Economic Emp.'];

export function ProjectPortfolio({ projects, onOpen }: { projects: Project[]; onOpen: (id: string) => void }) {
  const [pillarFilter, setPillarFilter] = useState<string | null>(null);
  const filtered = pillarFilter ? projects.filter((p) => p.pillar === pillarFilter) : projects;

  return (
    <div>
      <h1 style={h1}>Project Portfolio</h1>
      <p style={{ fontSize: 14.5, color: 'var(--muted)', margin: '0 0 22px' }}>
        {projects.length} active projects across four pillars. Track spend, delivery and risk against plan — click a project for its full impact chain.
      </p>

      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <button
          onClick={() => setPillarFilter(null)}
          style={{
            fontFamily: 'inherit',
            fontSize: 12.5,
            fontWeight: 600,
            padding: '8px 16px',
            borderRadius: 9,
            cursor: 'pointer',
            background: pillarFilter === null ? 'var(--navy)' : '#fff',
            border: pillarFilter === null ? 'none' : '1px solid var(--line)',
            color: pillarFilter === null ? '#fff' : 'var(--ink)',
          }}
        >
          All pillars
        </button>
        {PILLARS.map((p) => (
          <button
            key={p}
            onClick={() => setPillarFilter(p)}
            style={{
              fontFamily: 'inherit',
              fontSize: 12.5,
              fontWeight: 600,
              padding: '8px 16px',
              borderRadius: 9,
              cursor: 'pointer',
              background: pillarFilter === p ? 'var(--navy)' : '#fff',
              border: pillarFilter === p ? 'none' : '1px solid var(--line)',
              color: pillarFilter === p ? '#fff' : 'var(--ink)',
            }}
          >
            {p}
          </button>
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
          {filtered.length === 0 && (
            <div style={{ padding: '32px 22px', textAlign: 'center', color: 'var(--muted)', fontSize: 13.5 }}>No projects in this pillar.</div>
          )}
          {filtered.map((p) => {
            const [pillarBg, pillarFg] = PILLAR_COLORS[p.pillar] ?? ['#eee', '#555'];
            const [statusBg, statusFg] = STATUS_COLORS[p.status] ?? ['#eee', '#555'];
            return (
              <div
                key={p.id}
                className="rowh"
                onClick={() => onOpen(p.id)}
                style={{ ...tableRow, display: 'grid', gridTemplateColumns: '2.2fr 1.1fr 1fr 1.4fr 1.2fr 1fr', cursor: 'pointer' }}
              >
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
