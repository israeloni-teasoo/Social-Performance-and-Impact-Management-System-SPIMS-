import type { Role, View } from './types';

export const DEFAULT_VIEW_FOR_ROLE: Record<Role, View> = {
  exec: 'dashboard',
  manager: 'myprojects',
  field: 'mytasks',
  relations: 'stakeholders',
};

export const CRUMBS: Record<View, string> = {
  dashboard: 'Executive Dashboard',
  portfolio: 'Project Portfolio',
  impact: 'Impact Chain',
  communities: 'Communities',
  communitydetail: 'Community Detail',
  reports: 'Reports & Exports',
  myprojects: 'My Projects',
  newproject: 'New Project',
  approvals: 'Approvals Queue',
  mytasks: 'My Tasks',
  logactivity: 'Log Activity',
  evidence: 'Evidence Repository',
  stakeholders: 'Stakeholder Register',
  projectdetail: 'Project Detail',
  help: 'Help & Standards',
  targets: 'Targets',
  team: 'My Team',
  bulkupload: 'Bulk Upload',
};
