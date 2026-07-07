import { GRIEVANCE_STATUS_COLORS, h1, pill, SEVERITY_COLORS, tableHeaderRow, tableRow } from '../ui';
import type { Grievance } from '../types';

export function GrievancesExec({
  grievances,
  onOpen,
}: {
  grievances: Grievance[];
  onOpen: (id: string) => void;
}) {
  const gOpen = grievances.filter((g) => g.status === 'Open' || g.status === 'Investigating').length;
  const gClosed = grievances.filter((g) => g.status === 'Resolved' || g.status === 'Closed').length;
  const grievanceBreach = grievances.filter((g) => (g.status === 'Open' || g.status === 'Investigating') && g.overdue).length;

  return (
    <div>
      <h1 style={h1}>Grievance Management</h1>
      <p style={{ fontSize: 14.5, color: 'var(--muted)', margin: '0 0 18px' }}>
        Intake, investigation and resolution — tracked against the NUPRC host-community SLA.
      </p>

      <div style={{ display: 'flex', alignItems: 'stretch', gap: 0, background: '#fff', border: '1px solid var(--line)', borderRadius: 14, overflow: 'hidden', marginBottom: 22 }}>
        <div style={{ flex: 1, padding: '16px 22px', borderRight: '1px solid var(--line)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#2B4C9B', marginBottom: 4 }}>
            Who raises it
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.4 }}>
            Community members &amp; stakeholders — via field officers, the phone hotline, walk-in desk or suggestion box.
          </div>
        </div>
        <div style={{ flex: 1, padding: '16px 22px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 4 }}>
            Who attends to it
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.4 }}>
            Community Relations — assign, investigate, resolve and close each case with the community.
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18, marginBottom: 22 }}>
        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '20px 22px' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Open</div>
          <div style={{ fontSize: 34, fontWeight: 800, color: 'var(--accent)' }}>{gOpen}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '20px 22px' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Resolved / closed</div>
          <div style={{ fontSize: 34, fontWeight: 800, color: 'var(--navy)' }}>{gClosed}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '20px 22px' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Avg resolution</div>
          <div style={{ fontSize: 34, fontWeight: 800, color: 'var(--navy)' }}>
            9<span style={{ fontSize: 16, fontWeight: 600 }}> days</span>
          </div>
        </div>
        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '20px 22px' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Breaching SLA</div>
          <div style={{ fontSize: 34, fontWeight: 800, color: '#C0491E' }}>{grievanceBreach}</div>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, overflow: 'hidden' }}>
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
      <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: '14px 0 0' }}>
        Click any case to open the full case file. Switch to <strong style={{ color: 'var(--ink)' }}>Relations</strong> to manage the workflow.
      </p>
    </div>
  );
}
