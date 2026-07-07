import { useState } from 'react';
import { CaseModal } from './components/CaseModal';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { APPROVALS, COMMUNITIES, EVIDENCE_ITEMS, INDICATORS, PROJECTS, REPORTS, STAKEHOLDERS, TASKS } from './data/seed';
import { CRUMBS, DEFAULT_VIEW_FOR_ROLE, ROLE_USERS } from './roles';
import type { Role, View } from './types';
import { useGrievanceStore } from './useGrievanceStore';
import { Approvals } from './views/Approvals';
import { Communities } from './views/Communities';
import { Evidence } from './views/Evidence';
import { ExecutiveDashboard } from './views/ExecutiveDashboard';
import { GrievanceCases } from './views/GrievanceCases';
import { GrievancesExec } from './views/GrievancesExec';
import { ImpactChain } from './views/ImpactChain';
import { IndicatorLibrary } from './views/IndicatorLibrary';
import { LogActivity } from './views/LogActivity';
import { LogGrievance } from './views/LogGrievance';
import { MyProjects } from './views/MyProjects';
import { MyTasks } from './views/MyTasks';
import { NewProject } from './views/NewProject';
import { ProjectPortfolio } from './views/ProjectPortfolio';
import { Reports } from './views/Reports';
import { StakeholderRegister } from './views/StakeholderRegister';

const TARGET_YEAR = 2030;
const ORG_NAME = 'Seplat Energy Plc';

export default function App() {
  const [role, setRoleState] = useState<Role>('exec');
  const [view, setView] = useState<View>('dashboard');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { grievances, logGrievance, assign, addNote, resolve, closeCase, escalate } = useGrievanceStore(role);

  const setRole = (r: Role) => {
    setRoleState(r);
    setView(DEFAULT_VIEW_FOR_ROLE[r]);
    setSelectedId(null);
  };

  const handleLogGrievance = (input: Parameters<typeof logGrievance>[0]) => {
    const created = logGrievance(input);
    setView('cases');
    setSelectedId(created.id);
  };

  const selected = grievances.find((g) => g.id === selectedId) ?? null;
  const gOpen = grievances.filter((g) => g.status === 'Open' || g.status === 'Investigating').length;
  const user = ROLE_USERS[role];

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', fontFamily: "'Poppins',sans-serif", background: 'var(--bg)', color: 'var(--ink)', overflow: 'hidden' }}>
      <Sidebar
        role={role}
        view={view}
        setView={setView}
        gOpen={gOpen}
        orgName={ORG_NAME}
        userName={user.name}
        userRole={user.role}
        userInitials={user.initials}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar orgName={ORG_NAME} crumb={CRUMBS[view]} role={role} setRole={setRole} />

        <main className="spims-scroll" style={{ flex: 1, overflowY: 'auto', padding: '30px 34px 48px' }}>
          {view === 'dashboard' && <ExecutiveDashboard targetYear={TARGET_YEAR} />}
          {view === 'portfolio' && <ProjectPortfolio projects={PROJECTS} />}
          {view === 'impact' && <ImpactChain />}
          {view === 'communities' && <Communities communities={COMMUNITIES} />}
          {view === 'indicators' && <IndicatorLibrary indicators={INDICATORS} />}
          {view === 'grievances' && <GrievancesExec grievances={grievances} onOpen={setSelectedId} />}
          {view === 'reports' && <Reports reports={REPORTS} />}
          {view === 'myprojects' && <MyProjects projects={PROJECTS} goNewProject={() => setView('newproject')} />}
          {view === 'newproject' && <NewProject goApprovals={() => setView('approvals')} />}
          {view === 'approvals' && <Approvals approvals={APPROVALS} />}
          {view === 'mytasks' && <MyTasks tasks={TASKS} goLogActivity={() => setView('logactivity')} />}
          {view === 'logactivity' && <LogActivity goMyTasks={() => setView('mytasks')} />}
          {view === 'evidence' && <Evidence items={EVIDENCE_ITEMS} goLogActivity={() => setView('logactivity')} />}
          {view === 'cases' && <GrievanceCases grievances={grievances} onOpen={setSelectedId} goLogGrievance={() => setView('loggrievance')} />}
          {view === 'loggrievance' && <LogGrievance onCancel={() => setView('cases')} onSubmit={handleLogGrievance} />}
          {view === 'stakeholders' && <StakeholderRegister stakeholders={STAKEHOLDERS} />}
        </main>
      </div>

      {selected && (
        <CaseModal
          grievance={selected}
          role={role}
          onCloseModal={() => setSelectedId(null)}
          onAssign={(assignee) => assign(selected.id, assignee)}
          onAddNote={(note) => addNote(selected.id, note)}
          onResolve={(resolution) => resolve(selected.id, resolution)}
          onCloseCase={(satisfaction) => closeCase(selected.id, satisfaction)}
          onEscalate={() => escalate(selected.id)}
        />
      )}
    </div>
  );
}
