import { useState } from 'react';
import { CaseModal } from './components/CaseModal';
import { Sidebar } from './components/Sidebar';
import { ToastStack } from './components/ToastStack';
import { Topbar } from './components/Topbar';
import { COMMUNITIES, EVIDENCE_ITEMS, INDICATORS, PROJECT_IMPACTS, PROJECTS, REPORTS, TASKS } from './data/seed';
import { CRUMBS, DEFAULT_VIEW_FOR_ROLE, ROLE_USERS } from './roles';
import type { Role, View } from './types';
import { useApprovalsStore } from './useApprovalsStore';
import { useGrievanceStore } from './useGrievanceStore';
import { useStakeholdersStore } from './useStakeholdersStore';
import { useToastQueue } from './useToastQueue';
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
import { ProjectDetail } from './views/ProjectDetail';
import { ProjectPortfolio } from './views/ProjectPortfolio';
import { Reports } from './views/Reports';
import { StakeholderRegister } from './views/StakeholderRegister';

const TARGET_YEAR = 2030;
const ORG_NAME = 'Seplat Energy Plc';

export default function App() {
  const [role, setRoleState] = useState<Role>('exec');
  const [view, setViewState] = useState<View>('dashboard');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectDetailReturnView, setProjectDetailReturnView] = useState<View>('portfolio');

  const { toasts, push: pushToast, dismiss: dismissToast } = useToastQueue();
  const { grievances, logGrievance, assign, addNote, resolve, closeCase, escalate } = useGrievanceStore(role);
  const { approvals, approve, returnItem } = useApprovalsStore(pushToast);
  const { stakeholders, addStakeholder } = useStakeholdersStore(pushToast);

  const setRole = (r: Role) => {
    setRoleState(r);
    setViewState(DEFAULT_VIEW_FOR_ROLE[r]);
    setSelectedId(null);
    setSidebarOpen(false);
  };

  const setView = (v: View) => {
    setViewState(v);
    setSidebarOpen(false);
  };

  const goProjectDetail = (projectId: string, fromView: View) => {
    setSelectedProjectId(projectId);
    setProjectDetailReturnView(fromView);
    setView('projectdetail');
  };

  const handleLogGrievance = (input: Parameters<typeof logGrievance>[0]) => {
    const created = logGrievance(input);
    setView('cases');
    setSelectedId(created.id);
  };

  const selected = grievances.find((g) => g.id === selectedId) ?? null;
  const gOpen = grievances.filter((g) => g.status === 'Open' || g.status === 'Investigating').length;
  const user = ROLE_USERS[role];
  const selectedProject = PROJECTS.find((p) => p.id === selectedProjectId) ?? null;

  return (
    <div className="spims-shell" style={{ fontFamily: "'Poppins',sans-serif", background: 'var(--bg)', color: 'var(--ink)' }}>
      <div className={`spims-sidebar-backdrop${sidebarOpen ? ' is-open' : ''}`} onClick={() => setSidebarOpen(false)} />
      <Sidebar
        role={role}
        view={view}
        setView={setView}
        gOpen={gOpen}
        approvalsCount={approvals.length}
        tasksCount={TASKS.length}
        orgName={ORG_NAME}
        userName={user.name}
        userRole={user.role}
        userInitials={user.initials}
        open={sidebarOpen}
      />

      <div className="spims-main-col">
        <Topbar
          orgName={ORG_NAME}
          crumb={CRUMBS[view]}
          role={role}
          setRole={setRole}
          onMenuClick={() => setSidebarOpen((o) => !o)}
          projects={PROJECTS}
          communities={COMMUNITIES}
          goProjectDetail={(id) => goProjectDetail(id, DEFAULT_VIEW_FOR_ROLE[role] === 'myprojects' ? 'myprojects' : 'portfolio')}
          goCommunities={() => setView('communities')}
        />

        <main className="spims-scroll" style={{ flex: 1, overflowY: 'auto', padding: '30px 34px 48px' }}>
          {view === 'dashboard' && <ExecutiveDashboard targetYear={TARGET_YEAR} />}
          {view === 'portfolio' && <ProjectPortfolio projects={PROJECTS} onOpen={(id) => goProjectDetail(id, 'portfolio')} />}
          {view === 'impact' && <ImpactChain projects={PROJECTS} />}
          {view === 'communities' && <Communities communities={COMMUNITIES} />}
          {view === 'indicators' && <IndicatorLibrary indicators={INDICATORS} />}
          {view === 'grievances' && <GrievancesExec grievances={grievances} onOpen={setSelectedId} />}
          {view === 'reports' && <Reports reports={REPORTS} pushToast={pushToast} />}
          {view === 'myprojects' && <MyProjects projects={PROJECTS} goNewProject={() => setView('newproject')} onOpen={(id) => goProjectDetail(id, 'myprojects')} />}
          {view === 'newproject' && <NewProject goApprovals={() => setView('approvals')} pushToast={pushToast} />}
          {view === 'approvals' && <Approvals approvals={approvals} onApprove={approve} onReturn={returnItem} />}
          {view === 'mytasks' && <MyTasks tasks={TASKS} goLogActivity={() => setView('logactivity')} />}
          {view === 'logactivity' && <LogActivity goMyTasks={() => setView('mytasks')} pushToast={pushToast} />}
          {view === 'evidence' && <Evidence items={EVIDENCE_ITEMS} goLogActivity={() => setView('logactivity')} />}
          {view === 'cases' && <GrievanceCases grievances={grievances} onOpen={setSelectedId} goLogGrievance={() => setView('loggrievance')} />}
          {view === 'loggrievance' && <LogGrievance onCancel={() => setView('cases')} onSubmit={handleLogGrievance} />}
          {view === 'stakeholders' && <StakeholderRegister stakeholders={stakeholders} onAdd={addStakeholder} />}
          {view === 'projectdetail' && selectedProject && (
            <ProjectDetail project={selectedProject} impact={PROJECT_IMPACTS[selectedProject.code]} goBack={() => setView(projectDetailReturnView)} />
          )}
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

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
