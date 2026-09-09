import { useState } from 'react';
import type { CSSProperties } from 'react';
import { Sidebar } from './components/Sidebar';
import { ToastStack } from './components/ToastStack';
import { Topbar } from './components/Topbar';
import { CRUMBS, DEFAULT_VIEW_FOR_ROLE } from './roles';
import type { View } from './types';
import { useApprovalsStore } from './useApprovalsStore';
import { useCustomFieldsStore } from './useCustomFieldsStore';
import { useReportCommentsStore } from './useReportCommentsStore';
import { useStakeholdersStore } from './useStakeholdersStore';
import { useTargetsStore } from './useTargetsStore';
import { useTasksStore } from './useTasksStore';
import { useTeamStore } from './useTeamStore';
import { useSettingsStore } from './useSettingsStore';
import { useToastQueue } from './useToastQueue';
import { Approvals } from './views/Approvals';
import { BulkUpload } from './views/BulkUpload';
import { Communities } from './views/Communities';
import { CommunityDetail } from './views/CommunityDetail';
import { Evidence } from './views/Evidence';
import { ExecutiveDashboard } from './views/ExecutiveDashboard';
import { HelpPage } from './views/HelpPage';
import { ImpactChain } from './views/ImpactChain';
import { LogActivity } from './views/LogActivity';
import { MyProjects } from './views/MyProjects';
import { MyTasks } from './views/MyTasks';
import { NewProject } from './views/NewProject';
import { ProjectDetail } from './views/ProjectDetail';
import { ProjectPortfolio } from './views/ProjectPortfolio';
import { Reports } from './views/Reports';
import { StakeholderRegister } from './views/StakeholderRegister';
import { Targets } from './views/Targets';
import { Settings } from './views/Settings';
import { Team } from './views/Team';
import { useAuth } from './useAuth';
import type { AuthUser } from './useAuth';
import { useAppData } from './useAppData';
import { Login } from './views/Login';

const splash = (color: string): CSSProperties => ({
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color,
  fontFamily: "'Poppins', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  padding: 24,
  textAlign: 'center',
});

export default function App() {
  const { user, loading, demoMode, login, logout } = useAuth();

  if (loading) return <div style={splash('var(--muted)')}>Loading SPIMS…</div>;
  if (!user) return <Login onLogin={login} />;

  // Keyed on the user so signing in as someone else remounts with their own data and
  // landing view, rather than carrying the previous session's state across.
  return <SignedInApp key={user.id} user={user} demoMode={demoMode} onLogout={logout} />;
}

/**
 * Everything behind the sign-in screen.
 *
 * This is a separate component so the data hooks below only ever mount for a
 * signed-in user. When they lived in the parent they fired on page load, before
 * anyone had signed in; once the API began requiring a session those calls returned
 * 401, the hooks fell back to the bundled sample data, and — because they load once on
 * mount — never re-fetched after login. The app then showed seed data while appearing
 * completely healthy.
 */
function SignedInApp({ user, demoMode, onLogout }: { user: AuthUser; demoMode: boolean; onLogout: () => void }) {
  const { projects: PROJECTS, projectImpacts: PROJECT_IMPACTS, communities: COMMUNITIES, indicators: INDICATORS, reports: REPORTS, evidence: EVIDENCE_ITEMS, loading: dataLoading, error: dataError, refresh: refreshData } = useAppData();
  const [view, setViewState] = useState<View>(DEFAULT_VIEW_FOR_ROLE[user.role]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectDetailReturnView, setProjectDetailReturnView] = useState<View>('portfolio');
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);

  const { toasts, push: pushToast, dismiss: dismissToast } = useToastQueue();
  const { settings, status: integrationStatus, live: settingsLive, save: saveSettings } = useSettingsStore(pushToast);
  const { approvals, approve, returnItem, addComment: addApprovalComment } = useApprovalsStore(pushToast);
  const { stakeholders, addStakeholder } = useStakeholdersStore(pushToast);
  const { targets, addTarget, closeTarget } = useTargetsStore(pushToast);
  const { members, inviteMember } = useTeamStore(pushToast);
  const { tasks, assignTask, setTaskStatus } = useTasksStore(pushToast);
  const { comments, addComment } = useReportCommentsStore(pushToast);
  const { fields: customFields, addField, updateField, removeField } = useCustomFieldsStore(pushToast, user.name);

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

  if (dataLoading) return <div style={splash('var(--muted)')}>Loading SPIMS…</div>;
  if (dataError) return <div style={splash('var(--accent)')}>{dataError}</div>;

  const role = user.role;
  const selectedProject = PROJECTS.find((p) => p.id === selectedProjectId) ?? null;
  const selectedCommunity = COMMUNITIES.find((c) => c.id === selectedCommunityId) ?? null;
  const myTasks = tasks.filter((t) => t.assigneeId === 'tm-1');

  return (
    <div className="spims-shell" style={{ fontFamily: "'Poppins', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif", background: 'var(--bg)', color: 'var(--ink)' }}>
      <div className={`spims-sidebar-backdrop${sidebarOpen ? ' is-open' : ''}`} onClick={() => setSidebarOpen(false)} />
      <Sidebar
        role={role}
        view={view}
        setView={setView}
        approvalsCount={approvals.length}
        tasksCount={myTasks.length}
        orgName={settings.orgName}
        userName={user.name}
        userRole={user.roleLabel}
        userInitials={user.initials}
        open={sidebarOpen}
      />

      <div className="spims-main-col">
        <Topbar
          orgName={settings.orgName}
          crumb={CRUMBS[view]}
          userName={user.name}
          userRole={user.roleLabel}
          demoMode={demoMode}
          onLogout={onLogout}
          onMenuClick={() => setSidebarOpen((o) => !o)}
          projects={PROJECTS}
          communities={COMMUNITIES}
          goProjectDetail={(id) => goProjectDetail(id, DEFAULT_VIEW_FOR_ROLE[role] === 'myprojects' ? 'myprojects' : 'portfolio')}
          goCommunityDetail={goCommunityDetail}
        />

        <main className="spims-scroll" style={{ flex: 1, overflowY: 'auto', padding: '30px 34px 48px' }}>
          {view === 'dashboard' && <ExecutiveDashboard targetYear={settings.targetYear} projects={PROJECTS} impacts={PROJECT_IMPACTS} />}
          {view === 'portfolio' && <ProjectPortfolio projects={PROJECTS} onOpen={(id) => goProjectDetail(id, 'portfolio')} />}
          {view === 'impact' && (
            <ImpactChain
              projects={PROJECTS}
              impacts={PROJECT_IMPACTS}
              communities={COMMUNITIES}
              goProjectDetail={(id) => goProjectDetail(id, 'impact')}
            />
          )}
          {view === 'communities' && <Communities communities={COMMUNITIES} onOpen={goCommunityDetail} />}
          {view === 'communitydetail' && selectedCommunity && (
            <CommunityDetail
              community={selectedCommunity}
              projects={PROJECTS}
              impacts={PROJECT_IMPACTS}
              goBack={() => setView('communities')}
              goProjectDetail={(id) => goProjectDetail(id, 'communitydetail')}
            />
          )}
          {view === 'reports' && (
            <Reports
              reports={REPORTS}
              projects={PROJECTS}
              impacts={PROJECT_IMPACTS}
              role={role}
              userName={user.name}
              comments={comments}
              onComment={addComment}
              org={settings}
              pushToast={pushToast}
            />
          )}
          {view === 'myprojects' && <MyProjects projects={PROJECTS} goNewProject={() => setView('newproject')} onOpen={(id) => goProjectDetail(id, 'myprojects')} />}
          {view === 'newproject' && (
            <NewProject
              communities={COMMUNITIES}
              onCreated={(project) => {
                refreshData();
                goProjectDetail(project.id, 'portfolio');
              }}
              pushToast={pushToast}
            />
          )}
          {view === 'approvals' && (
            <Approvals approvals={approvals} onApprove={approve} onReturn={returnItem} onComment={(id, text) => addApprovalComment(id, user.name, text)} />
          )}
          {view === 'mytasks' && <MyTasks tasks={myTasks} goLogActivity={() => setView('logactivity')} onSetStatus={setTaskStatus} />}
          {view === 'logactivity' && <LogActivity goMyTasks={() => setView('mytasks')} pushToast={pushToast} />}
          {view === 'evidence' && <Evidence items={EVIDENCE_ITEMS} goLogActivity={() => setView('logactivity')} />}
          {view === 'stakeholders' && <StakeholderRegister stakeholders={stakeholders} onAdd={addStakeholder} />}
          {view === 'targets' && <Targets targets={targets} onAdd={addTarget} onClose={closeTarget} pushToast={pushToast} />}
          {view === 'team' && <Team members={members} tasks={tasks} projects={PROJECTS} onInvite={inviteMember} onAssignTask={assignTask} />}
          {view === 'bulkupload' && <BulkUpload projects={PROJECTS} pushToast={pushToast} />}
          {view === 'settings' && (
            <Settings
              currentUserId={user.id}
              canAdminister={role === 'exec'}
              settings={settings}
              status={integrationStatus}
              live={settingsLive}
              onSave={saveSettings}
              pushToast={pushToast}
            />
          )}
          {view === 'help' && <HelpPage projects={PROJECTS} indicators={INDICATORS} goProjectDetail={(id) => goProjectDetail(id, 'help')} />}
          {view === 'projectdetail' && selectedProject && (
            <ProjectDetail
              project={selectedProject}
              impact={PROJECT_IMPACTS[selectedProject.code]}
              customFields={customFields}
              canEditFields={role === 'exec' || role === 'manager'}
              canEditProject={role === 'exec' || role === 'manager'}
              onProjectUpdated={refreshData}
              onAddField={addField}
              onUpdateField={updateField}
              onRemoveField={removeField}
              goBack={() => setView(projectDetailReturnView)}
              pushToast={pushToast}
            />
          )}
        </main>
      </div>

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
