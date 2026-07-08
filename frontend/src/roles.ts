import type { Role, View } from './types';

export const ROLE_USERS: Record<Role, { name: string; role: string; initials: string }> = {
  exec: { name: 'Amaka Okonkwo', role: 'Executive · Read-only', initials: 'AO' },
  manager: { name: 'Tunde Bello', role: 'Project Manager · Edo', initials: 'TB' },
  field: { name: 'Grace Idemudia', role: 'Field Officer · Sapele', initials: 'GI' },
  relations: { name: 'Blessing Aganbi', role: 'Community Relations', initials: 'BA' },
};

export const DEFAULT_VIEW_FOR_ROLE: Record<Role, View> = {
  exec: 'dashboard',
  manager: 'myprojects',
  field: 'mytasks',
  relations: 'cases',
};

export function currentUserLabel(role: Role): string {
  const u = ROLE_USERS[role];
  return `${u.name} · ${u.role.split(' · ')[0]}`;
}

export const CRUMBS: Record<View, string> = {
  dashboard: 'Executive Dashboard',
  portfolio: 'Project Portfolio',
  impact: 'Impact Chain',
  communities: 'Communities',
  indicators: 'Indicator Library',
  grievances: 'Grievances',
  reports: 'Reports & Exports',
  myprojects: 'My Projects',
  newproject: 'New Project',
  approvals: 'Approvals Queue',
  mytasks: 'My Tasks',
  logactivity: 'Log Activity',
  evidence: 'Evidence Repository',
  cases: 'Grievance Cases',
  loggrievance: 'Log Grievance',
  stakeholders: 'Stakeholder Register',
  projectdetail: 'Project Detail',
};
