import { Icon } from '../components/Icon';
import { GRIEVANCE_STATUS_COLORS, h1, pill, primaryBtn, SEVERITY_COLORS, tableHeaderRow, tableRow } from '../ui';
import type { Grievance } from '../types';

export function GrievanceCases({
  grievances,
  onOpen,
  goLogGrievance,
}: {
  grievances: Grievance[];
  onOpen: (id: string) => void;
  goLogGrievance: () => void;
}) {
  const gOpen = grievances.filter((g) => g.status === 'Open' || g.status === 'Investigating').length;
  const gInvestigating = grievances.filter((g) => g.status === 'Investigating').length;
  const gUnassigned = grievances.filter((g) => g.status === 'Open' && !g.assignee).length;
  const grievanceBreach = grievances.filter((g) => (g.status === 'Open' || g.status === 'Investigating') && g.overdue).length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 , flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={h1}>Grievance Cases</h1>
          <p style={{ fontSize: 14.5, color: 'var(--muted)', margin: 0 }}>
            Community complaints assigned to you. Open a case to assign, investigate, resolve and close it.
          </p>
        </div>
        <button onClick={goLogGrievance} style={{ ...primaryBtn, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="plus" size={16} strokeWidth={2.4} />
          Log grievance
        </button>
      </div>

      <div className="grid-4" style={{ marginBottom: 22 }}>
        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '20px 22px' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Open &amp; active</div>
          <div style={{ fontSize: 34, fontWeight: 800, color: 'var(--accent)' }}>{gOpen}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '20px 22px' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Investigating</div>
          <div style={{ fontSize: 34, fontWeight: 800, color: '#2B4C9B' }}>{gInvestigating}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '20px 22px' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Unassigned</div>
          <div style={{ fontSize: 34, fontWeight: 800, color: '#C0491E' }}>{gUnassigned}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '20px 22px' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Breaching SLA</div>
          <div style={{ fontSize: 34, fontWeight: 800, color: '#C0491E' }}>{grievanceBreach}</div>
        </div>
      </div>

      <div className="table-scroll">
      <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, overflow: 'hidden', minWidth: 860 }}>
        <div style={{ ...tableHeaderRow, display: 'grid', gridTemplateColumns: '0.8fr 1.9fr 1.4fr 1.4fr 0.9fr 1fr' }}>
          <span>Ref</span>
          <span>Complaint</span>
          <span>Raised by</span>
          <span>Handled by</span>
          <span>Severity</span>
          <span>Status</span>
        </div>
        {grievances.map((g) => {
          const [sevBg, sevFg] = SEVERITY_COLORS[g.severity];
          const [stBg, stFg] = GRIEVANCE_STATUS_COLORS[g.status];
          return (
            <div
              key={g.id}
              className="rowh"
              onClick={() => onOpen(g.id)}
              style={{ ...tableRow, display: 'grid', gridTemplateColumns: '0.8fr 1.9fr 1.4fr 1.4fr 0.9fr 1fr', cursor: 'pointer' }}
            >
              <span style={{ fontFamily: 'monospace', fontSize: 12.5, color: 'var(--muted)' }}>{g.ref}</span>
              <span style={{ color: 'var(--navy)', fontWeight: 500 }}>{g.title}</span>
              <span style={{ color: 'var(--ink)' }}>
                {g.raisedByName}
                <br />
                <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>{g.raisedByCommunity}</span>
              </span>
              <span style={{ fontWeight: 600, color: g.assignee ? '#2A2E52' : '#C0491E' }}>
                {g.assignee ? g.assignee.split(' · ')[0] : 'Unassigned'}
              </span>
              <span>
                <span style={pill(sevBg, sevFg)}>{g.severity}</span>
              </span>
              <span>
                <span style={pill(stBg, stFg)}>{g.status}</span>
              </span>
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}
