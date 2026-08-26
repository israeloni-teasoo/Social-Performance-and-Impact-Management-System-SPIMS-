import { useEffect, useState } from 'react';
import { CaseModal } from './components/CaseModal';
import { Sidebar } from './components/Sidebar';
import { ToastStack } from './components/ToastStack';
import { Topbar } from './components/Topbar';
import { COMMUNITIES, EVIDENCE_ITEMS, INDICATORS, PROJECT_IMPACTS, PROJECTS, REPORTS } from './data/seed';
import { CRUMBS, DEFAULT_VIEW_FOR_ROLE, ROLE_USERS } from './roles';
import type { View } from './types';
import { useApprovalsStore } from './useApprovalsStore';
import { useGrievanceStore } from './useGrievanceStore';
import { useReportCommentsStore } from './useReportCommentsStore';
import { useStakeholdersStore } from './useStakeholdersStore';
import { useTargetsStore } from './useTargetsStore';
import { useTasksStore } from './useTasksStore';
import { useTeamStore } from './useTeamStore';
import { useToastQueue } from './useToastQueue';
import { Approvals } from './views/Approvals';
import { Communities } from './views/Communities';
import { CommunityDetail } from './views/CommunityDetail';
import { Evidence } from './views/Evidence';
import { ExecutiveDashboard } from './views/ExecutiveDashboard';
import { GrievanceCases } from './views/GrievanceCases';
import { GrievancesExec } from './views/GrievancesExec';
import { HelpPage } from './views/HelpPage';
import { ImpactChain } from './views/ImpactChain';
import { LogActivity } from './views/LogActivity';
import { LogGrievance } from './views/LogGrievance';
import { MyProjects } from './views/MyProjects';
import { MyTasks } from './views/MyTasks';
import { NewProject } from './views/NewProject';
import { ProjectDetail } from './views/ProjectDetail';
import { ProjectPortfolio } from './views/ProjectPortfolio';
import { Reports } from './views/Reports';
import { StakeholderRegister } from './views/StakeholderRegister';
import { Targets } from './views/Targets';
import { Team } from './views/Team';
import { useAuth } from './useAuth';
import { Login } from './views/Login';

const TARGET_YEAR = 2030;
const ORG_NAME = 'Seplat Energy Plc';

export default function App() {
  const { role, login, logout } = useAuth();
  const [view, setViewState] = useState<View>('dashboard');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectDetailReturnView, setProjectDetailReturnView] = useState<View>('portfolio');
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);

  const { toasts, push: pushToast, dismiss: dismissToast } = useToastQueue();
  const { grievances, logGrievance, assign, addNote, resolve, closeCase, escalate } = useGrievanceStore(role ?? 'exec');
  const { approvals, approve, returnItem, addComment: addApprovalComment } = useApprovalsStore(pushToast);
  const { stakeholders, addStakeholder } = useStakeholdersStore(pushToast);
  const { targets, addTarget, closeTarget } = useTargetsStore(pushToast);
  const { members, inviteMember } = useTeamStore(pushToast);
  const { tasks, assignTask, setTaskStatus } = useTasksStore(pushToast);
  const { comments, addComment } = useReportCommentsStore(pushToast);

  useEffect(() => {
    if (role) {
      setViewState(DEFAULT_VIEW_FOR_ROLE[role]);
      setSelectedId(null);
      setSidebarOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const setView = (v: View) => {
    setViewState(v);
    setSidebarOpen(false);
  };

  const goProjectDetail = (projectId: string, fromView: View) => {
    setSelectedProjectId(projectId);
    setProjectDetailReturnView(fromView);
    setView('projectdetail');
  };

  const goCommunityDetail = (communityId: string) => {
    setSelectedCommunityId(communityId);
    setView('communitydetail');
  };

  const handleLogGrievance = (input: Parameters<typeof logGrievance>[0]) => {
    const created = logGrievance(input);
    setView('cases');
    setSelectedId(created.id);
  };

  if (!role) return <Login onLogin={login} />;

  const selected = grievances.find((g) => g.id === selectedId) ?? null;
  const gOpen = grievances.filter((g) => g.status === 'Open' || g.status === 'Investigating').length;
  const user = ROLE_USERS[role];
  const selectedProject = PROJECTS.find((p) => p.id === selectedProjectId) ?? null;
  const selectedCommunity = COMMUNITIES.find((c) => c.id === selectedCommunityId) ?? null;
  const myTasks = tasks.filter((t) => t.assigneeId === 'tm-1');

  return (
    <div className="spims-shell" style={{ fontFamily: "'Poppins',sans-serif", background: 'var(--bg)', color: 'var(--ink)' }}>
      <div className={`spims-sidebar-backdrop${sidebarOpen ? ' is-open' : ''}`} onClick={() => setSidebarOpen(false)} />
      <Sidebar
        role={role}
        view={view}
        setView={setView}
        gOpen={gOpen}
        approvalsCount={approvals.length}
        tasksCount={myTasks.length}
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
          userName={user.name}
          userRole={user.role}
          onLogout={logout}
          onMenuClick={() => setSidebarOpen((o) => !o)}
          projects={PROJECTS}
          communities={COMMUNITIES}
          goProjectDetail={(id) => goProjectDetail(id, DEFAULT_VIEW_FOR_ROLE[role] === 'myprojects' ? 'myprojects' : 'portfolio')}
          goCommunityDetail={goCommunityDetail}
        />

        <main className="spims-scroll" style={{ flex: 1, overflowY: 'auto', padding: '30px 34px 48px' }}>
          {view === 'dashboard' && <ExecutiveDashboard targetYear={TARGET_YEAR} />}
          {view === 'portfolio' && <ProjectPortfolio projects={PROJECTS} onOpen={(id) => goProjectDetail(id, 'portfolio')} />}
          {view === 'impact' && (
            <ImpactChain
              projects={PROJECTS}
              impacts={PROJECT_IMPACTS}
              communities={COMMUNITIES}
              grievances={grievances}
              goProjectDetail={(id) => goProjectDetail(id, 'impact')}
            />
          )}
          {view === 'communities' && <Communities communities={COMMUNITIES} onOpen={goCommunityDetail} />}
          {view === 'communitydetail' && selectedCommunity && (
            <CommunityDetail
              community={selectedCommunity}
              projects={PROJECTS}
              impacts={PROJECT_IMPACTS}
              grievances={grievances}
              goBack={() => setView('communities')}
              goProjectDetail={(id) => goProjectDetail(id, 'communitydetail')}
            />
          )}
          {view === 'grievances' && <GrievancesExec grievances={grievances} onOpen={setSelectedId} />}
          {view === 'reports' && (
            <Reports
              reports={REPORTS}
              projects={PROJECTS}
              impacts={PROJECT_IMPACTS}
              role={role}
              userName={user.name}
              comments={comments}
              onComment={addComment}
              pushToast={pushToast}
            />
          )}
          {view === 'myprojects' && <MyProjects projects={PROJECTS} goNewProject={() => setView('newproject')} onOpen={(id) => goProjectDetail(id, 'myprojects')} />}
          {view === 'newproject' && <NewProject goApprovals={() => setView('approvals')} pushToast={pushToast} />}
          {view === 'approvals' && (
            <Approvals approvals={approvals} onApprove={approve} onReturn={returnItem} onComment={(id, text) => addApprovalComment(id, user.name, text)} />
          )}
          {view === 'mytasks' && <MyTasks tasks={myTasks} goLogActivity={() => setView('logactivity')} onSetStatus={setTaskStatus} />}
          {view === 'logactivity' && <LogActivity goMyTasks={() => setView('mytasks')} pushToast={pushToast} />}
          {view === 'evidence' && <Evidence items={EVIDENCE_ITEMS} goLogActivity={() => setView('logactivity')} />}
          {view === 'cases' && <GrievanceCases grievances={grievances} onOpen={setSelectedId} goLogGrievance={() => setView('loggrievance')} />}
          {view === 'loggrievance' && <LogGrievance onCancel={() => setView('cases')} onSubmit={handleLogGrievance} />}
          {view === 'stakeholders' && <StakeholderRegister stakeholders={stakeholders} onAdd={addStakeholder} />}
          {view === 'targets' && <Targets targets={targets} onAdd={addTarget} onClose={closeTarget} pushToast={pushToast} />}
          {view === 'team' && <Team members={members} tasks={tasks} projects={PROJECTS} onInvite={inviteMember} onAssignTask={assignTask} />}
          {view === 'help' && <HelpPage projects={PROJECTS} indicators={INDICATORS} goProjectDetail={(id) => goProjectDetail(id, 'help')} />}
          {view === 'projectdetail' && selectedProject && (
            <ProjectDetail
              project={selectedProject}
              impact={PROJECT_IMPACTS[selectedProject.code]}
              goBack={() => setView(projectDetailReturnView)}
              pushToast={pushToast}
            />
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
