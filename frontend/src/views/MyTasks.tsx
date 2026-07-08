import { h1, primaryBtn, subtitle } from '../ui';
import type { FieldTask } from '../types';

export function MyTasks({ tasks, goLogActivity }: { tasks: FieldTask[]; goLogActivity: () => void }) {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: '#FFF4E9',
          border: '1px solid #F3D9BC',
          borderRadius: 12,
          padding: '11px 18px',
          marginBottom: 20,
          fontSize: 13,
          color: '#8A5A0B',
          fontWeight: 500,
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#C0491E', display: 'inline-block' }}></span>
        Working offline — 2 saved entries will sync automatically when you regain signal.
      </div>
      <h1 style={h1}>My Tasks</h1>
      <p style={subtitle}>Assigned to you across Sapele cluster. Tap a task to log it — takes under five minutes.</p>
      <div className="grid-2">
        {tasks.map((t) => (
          <div
            key={t.id}
            style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 14, padding: '22px 24px', display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}
          >
            <div style={{ flex: '1 1 180px' }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--navy)', marginBottom: 4 }}>{t.title}</div>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                {t.project} · <span style={{ color: t.dueColor, fontWeight: 600 }}>{t.due}</span>
              </div>
            </div>
            <button onClick={goLogActivity} style={{ ...primaryBtn, fontSize: 14, borderRadius: 11, padding: '13px 22px', whiteSpace: 'nowrap' }}>
              Log now →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
