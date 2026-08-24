import { h1, pill, primaryBtn, subtitle } from '../ui';
import type { FieldTask } from '../types';

const STATUS_COLORS: Record<string, [string, string]> = {
  'Not started': ['rgba(138,141,166,0.18)', '#6B6E88'],
  'In progress': ['rgba(43,76,155,0.12)', '#2B4C9B'],
  Done: ['rgba(31,138,91,0.14)', '#1F8A5B'],
};

const NEXT_STATUS: Record<string, NonNullable<FieldTask['status']>> = {
  'Not started': 'In progress',
  'In progress': 'Done',
  Done: 'Not started',
};

export function MyTasks({
  tasks,
  goLogActivity,
  onSetStatus,
}: {
  tasks: FieldTask[];
  goLogActivity: () => void;
  onSetStatus: (id: string, status: NonNullable<FieldTask['status']>) => void;
}) {
  return (
    <div>
      <h1 style={h1}>My Tasks</h1>
      <p style={subtitle}>Assigned to you by your project manager. Tap a task to log it — takes under five minutes.</p>
      <div className="grid-2">
        {tasks.map((t) => {
          const status = t.status ?? 'Not started';
          const [sBg, sFg] = STATUS_COLORS[status];
          return (
            <div
              key={t.id}
              style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 14, padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 180px' }}>
                  <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--navy)', marginBottom: 4 }}>{t.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                    {t.project} · <span style={{ color: t.dueColor, fontWeight: 600 }}>{t.due}</span>
                  </div>
                  {t.createdBy && <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 4 }}>Assigned by {t.createdBy}</div>}
                </div>
                <span style={pill(sBg, sFg)}>{status}</span>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  onClick={() => onSetStatus(t.id, NEXT_STATUS[status])}
                  style={{ fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, color: 'var(--navy)', background: '#fff', border: '1px solid var(--line)', borderRadius: 9, padding: '9px 14px', cursor: 'pointer' }}
                >
                  Mark {NEXT_STATUS[status]}
                </button>
                <button onClick={goLogActivity} style={{ ...primaryBtn, fontSize: 13.5, borderRadius: 9, padding: '9px 18px', whiteSpace: 'nowrap' }}>
                  Log now →
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
