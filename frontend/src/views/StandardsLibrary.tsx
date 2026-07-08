import { useState } from 'react';
import type { CSSProperties } from 'react';
import { STANDARDS } from '../data/standards';
import { h1, subtitle } from '../ui';
import type { Project } from '../types';

type Filter = 'all' | 'local' | 'global' | 'sdg';

const CATEGORY_META: Record<'local' | 'global' | 'sdg', { label: string; bg: string; fg: string }> = {
  local: { label: 'Local', bg: 'rgba(43,76,155,0.1)', fg: '#2B4C9B' },
  global: { label: 'Global', bg: 'rgba(227,26,56,0.1)', fg: 'var(--accent)' },
  sdg: { label: 'SDG', bg: 'rgba(31,138,91,0.12)', fg: '#1F8A5B' },
};

export function StandardsLibrary({ projects, goProjectDetail }: { projects: Project[]; goProjectDetail: (id: string) => void }) {
  const [filter, setFilter] = useState<Filter>('all');
  const visible = filter === 'all' ? STANDARDS : STANDARDS.filter((s) => s.category === filter);

  const tabStyle = (active: boolean): CSSProperties => ({
    fontSize: 12.5,
    fontWeight: 600,
    padding: '8px 16px',
    borderRadius: 9,
    background: active ? 'var(--navy)' : '#fff',
    color: active ? '#fff' : 'var(--ink)',
    border: active ? 'none' : '1px solid var(--line)',
    fontFamily: 'inherit',
    cursor: 'pointer',
  });

  return (
    <div>
      <h1 style={h1}>Standards Library</h1>
      <p style={subtitle}>
        Every local and global standard SPIMS reports against — what it covers, and a worked example of how it's actually applied to a real project.
      </p>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <button onClick={() => setFilter('all')} style={tabStyle(filter === 'all')}>
          All standards
        </button>
        <button onClick={() => setFilter('local')} style={tabStyle(filter === 'local')}>
          Local — Nigeria
        </button>
        <button onClick={() => setFilter('global')} style={tabStyle(filter === 'global')}>
          Global
        </button>
        <button onClick={() => setFilter('sdg')} style={tabStyle(filter === 'sdg')}>
          SDGs
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {visible.map((s) => {
          const meta = CATEGORY_META[s.category];
          const project = s.exampleProjectCode ? projects.find((p) => p.code === s.exampleProjectCode) : undefined;
          return (
            <div key={s.id} style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 14, padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 6, background: meta.bg, color: meta.fg }}>
                  {meta.label}
                </span>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)' }}>{s.code}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>{s.issuer}</div>
              <p style={{ fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.55, margin: '0 0 14px' }}>{s.summary}</p>
              <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: 'var(--ink)', lineHeight: 1.5 }}>
                <span style={{ fontWeight: 700, color: 'var(--navy)' }}>Example in SPIMS: </span>
                {s.exampleText}
                {project && (
                  <>
                    {' '}
                    <button
                      onClick={() => goProjectDetail(project.id)}
                      style={{ fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                    >
                      View {project.name} →
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
