export type Role = 'exec' | 'manager' | 'field' | 'relations';

export type View =
  | 'dashboard'
  | 'portfolio'
  | 'impact'
  | 'communities'
  | 'indicators'
  | 'grievances'
  | 'reports'
  | 'myprojects'
  | 'newproject'
  | 'approvals'
  | 'mytasks'
  | 'logactivity'
  | 'evidence'
  | 'cases'
  | 'loggrievance'
  | 'stakeholders';

export interface Project {
  id: string;
  code: string;
  name: string;
  output: string;
  pillar: string;
  state: string;
  budget: string;
  utilPct: string;
  progress: string;
  progPct: string;
  status: string;
}

export interface Community {
  id: string;
  name: string;
  lga: string;
  state: string;
  pop: string;
  projects: number;
  spend: string;
  cdc: string;
}

export interface Indicator {
  id: string;
  metric: string;
  local: string;
  global: string;
  sdg: string;
}

export interface Report {
  id: string;
  name: string;
  lens: string;
  desc: string;
  updated: string;
}

export interface Stakeholder {
  id: string;
  name: string;
  type: string;
  community: string;
  engagements: number;
  commitments: string;
  status: string;
}

export interface FieldTask {
  id: string;
  title: string;
  project: string;
  due: string;
  dueColor: string;
}

export interface Approval {
  id: string;
  who: string;
  item: string;
  project: string;
  when: string;
  type: string;
}

export interface EvidenceItem {
  id: string;
  label: string;
  meta: string;
  kind: string;
}

export interface GrievanceTimelineEntry {
  id: string;
  ts: string;
  actor: string;
  action: string;
}

export interface Grievance {
  id: string;
  ref: string;
  title: string;
  category: string;
  severity: 'Low' | 'Medium' | 'High';
  status: 'Open' | 'Investigating' | 'Resolved' | 'Closed';
  channel: string;
  raisedByName: string;
  raisedByRole: string;
  raisedByCommunity: string;
  raisedByContact: string;
  loggedBy: string;
  assignee: string | null;
  description: string;
  dateRaised: string;
  dueDate: string;
  overdue: boolean;
  resolution: string | null;
  resolvedDate: string | null;
  satisfaction: string | null;
  timeline: GrievanceTimelineEntry[];
}

export interface NewGrievanceInput {
  title: string;
  category: string;
  severity: string;
  channel: string;
  raisedByName: string;
  raisedByCommunity: string;
  raisedByContact: string;
  description: string;
}
