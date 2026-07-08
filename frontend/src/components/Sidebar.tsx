import type { CSSProperties } from 'react';
import type { Role, View } from '../types';
import { Icon } from './Icon';

const SECTION_LABEL: CSSProperties = {
  fontSize: 10.5,
  fontWeight: 600,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: '#5D6088',
  padding: '14px 12px 6px',
};

function navBtnStyle(active: boolean): CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 12px',
    border: 'none',
    borderRadius: 10,
    background: active ? 'rgba(227,26,56,0.16)' : 'transparent',
    color: active ? '#ffffff' : '#C7C9DA',
    fontFamily: 'inherit',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
  };
}

const badgeStyle: CSSProperties = {
  marginLeft: 'auto',
  fontSize: 10.5,
  fontWeight: 700,
  background: 'var(--accent)',
  color: '#fff',
  borderRadius: 20,
  padding: '1px 8px',
};

function NavButton({
  icon,
  label,
  active,
  onClick,
  badge,
}: {
  icon: Parameters<typeof Icon>[0]['name'];
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: string | number;
}) {
  return (
    <button className="navbtn" onClick={onClick} style={navBtnStyle(active)}>
      <Icon name={icon} />
      {label}
      {badge !== undefined && <span style={badgeStyle}>{badge}</span>}
    </button>
  );
}

export function Sidebar({
  role,
  view,
  setView,
  gOpen,
  approvalsCount,
  tasksCount,
  orgName,
  userName,
  userRole,
  userInitials,
  open,
}: {
  role: Role;
  view: View;
  setView: (v: View) => void;
  gOpen: number;
  approvalsCount: number;
  tasksCount: number;
  orgName: string;
  userName: string;
  userRole: string;
  userInitials: string;
  open: boolean;
}) {
  return (
    <aside
      className={`spims-sidebar${open ? ' is-open' : ''}`}
      style={{
        background: 'var(--navy)',
        color: '#C7C9DA',
        display: 'flex',
        flexDirection: 'column',
        padding: '22px 16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 10px 22px' }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 11,
            background: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: 17,
            color: '#fff',
            letterSpacing: '-0.02em',
          }}
        >
          S
        </div>
        <div style={{ lineHeight: 1.1 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>SPIMS</div>
          <div style={{ fontSize: 10.5, fontWeight: 500, color: '#7C7FA0', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Social Perf. &amp; Impact
          </div>
        </div>
      </div>

      <nav className="spims-scroll" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
        {role === 'exec' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={SECTION_LABEL}>Overview</div>
            <NavButton icon="dashboard" label="Executive Dashboard" active={view === 'dashboard'} onClick={() => setView('dashboard')} />

            <div style={SECTION_LABEL}>Plan &amp; Track</div>
            <NavButton icon="portfolio" label="Project Portfolio" active={view === 'portfolio'} onClick={() => setView('portfolio')} />
            <NavButton icon="communities" label="Communities" active={view === 'communities'} onClick={() => setView('communities')} />

            <div style={SECTION_LABEL}>Measure</div>
            <NavButton icon="impact" label="Impact Chain" active={view === 'impact'} onClick={() => setView('impact')} />
            <NavButton icon="grievances" label="Grievances" active={view === 'grievances'} onClick={() => setView('grievances')} />

            <div style={SECTION_LABEL}>Report &amp; Comply</div>
            <NavButton icon="indicators" label="Indicator Library" active={view === 'indicators'} onClick={() => setView('indicators')} />
            <NavButton icon="standards" label="Standards Library" active={view === 'standards'} onClick={() => setView('standards')} />
            <NavButton icon="reports" label="Reports & Exports" active={view === 'reports'} onClick={() => setView('reports')} />
          </div>
        )}

        {role === 'manager' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={SECTION_LABEL}>Workspace</div>
            <NavButton icon="portfolio" label="My Projects" active={view === 'myprojects'} onClick={() => setView('myprojects')} />
            <NavButton icon="newproject" label="New Project" active={view === 'newproject'} onClick={() => setView('newproject')} />
            <div style={SECTION_LABEL}>Review &amp; report</div>
            <NavButton icon="approvals" label="Approvals" active={view === 'approvals'} onClick={() => setView('approvals')} badge={approvalsCount} />
            <NavButton icon="reports" label="Reports & Exports" active={view === 'reports'} onClick={() => setView('reports')} />
          </div>
        )}

        {role === 'field' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={SECTION_LABEL}>Field work</div>
            <NavButton icon="mytasks" label="My Tasks" active={view === 'mytasks'} onClick={() => setView('mytasks')} badge={tasksCount} />
            <NavButton icon="logactivity" label="Log Activity" active={view === 'logactivity'} onClick={() => setView('logactivity')} />
            <NavButton icon="loggrievance" label="Log Grievance" active={view === 'loggrievance'} onClick={() => setView('loggrievance')} />
            <div style={SECTION_LABEL}>Repository</div>
            <NavButton icon="evidence" label="Evidence" active={view === 'evidence'} onClick={() => setView('evidence')} />
          </div>
        )}

        {role === 'relations' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={SECTION_LABEL}>Grievances</div>
            <NavButton icon="cases" label="Grievance Cases" active={view === 'cases'} onClick={() => setView('cases')} badge={gOpen} />
            <NavButton icon="loggrievance" label="Log Grievance" active={view === 'loggrievance'} onClick={() => setView('loggrievance')} />
            <div style={SECTION_LABEL}>Engagement</div>
            <NavButton icon="stakeholders" label="Stakeholders" active={view === 'stakeholders'} onClick={() => setView('stakeholders')} />
            <NavButton icon="communities" label="Communities" active={view === 'communities'} onClick={() => setView('communities')} />
          </div>
        )}

        <div style={{ marginTop: 'auto', paddingTop: 12 }}>
          <NavButton icon="help" label="How SPIMS Works" active={view === 'help'} onClick={() => setView('help')} />
        </div>
      </nav>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 11,
          padding: '14px 10px 4px',
          marginTop: 10,
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: '#2A356E',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 13,
            color: '#fff',
          }}
        >
          {userInitials}
        </div>
        <div style={{ lineHeight: 1.2, flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {userName}
          </div>
          <div style={{ fontSize: 11, color: '#7C7FA0' }}>{userRole}</div>
        </div>
      </div>
      <div style={{ fontSize: 10.5, color: '#5D6088', padding: '8px 10px 0' }}>
        Tenant · <span style={{ color: '#9EA1C0' }}>{orgName}</span>
      </div>
    </aside>
  );
}
