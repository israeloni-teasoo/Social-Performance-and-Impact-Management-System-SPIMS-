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
  | 'stakeholders'
  | 'projectdetail'
  | 'standards'
  | 'help'
  | 'departments'
  | 'targets';

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

export interface ImpactMethodology {
  metric: string;
  calculation: string;
  source: string;
  note: string;
}

export interface BaselinePoint {
  label: string;
  value: string;
  pct: number;
}

export interface DualLensTag {
  tag: 'Local' | 'Global' | 'SDG';
  text: string;
}

export interface ImpactScenario {
  horizon: string;
  conservative: string;
  highImpact: string;
}

export interface ProjectImpact {
  projectCode: string;
  inputs: string;
  activities: string;
  outputHeadline: string;
  outcome: string;
  impactHeadline: string;
  /** Single big number for the Impact stage card, e.g. "934,500" or "≈4,000". */
  impactFigure: string;
  /** Short caption under the big number, e.g. "potential students reached over 10 years". */
  impactFigureLabel: string;
  /** What that figure means, as short scannable bullets rather than a paragraph. */
  impactPoints: string[];
  methodology: ImpactMethodology;
  /** Optional conservative-vs-high-impact projection table for "what it means" figures that compound over time. */
  impactScenarios?: ImpactScenario[];
  impactScenarioBasis?: string;
  baseline: BaselinePoint[];
  baselineCaption: string;
  dualLens: DualLensTag[];
  costPerOutcome: string;
  sroi: string;
  contactPerson: string;
  communitiesImpacted: string[];
}

export interface Department {
  id: string;
  name: string;
  /** Aligns to a pillar name where applicable (e.g. "Education") for shared colour-coding, or a standalone function like "Stakeholder Relations". */
  function: string;
  lead: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
}

export interface NewDepartmentInput {
  name: string;
  function: string;
  lead: string;
}

export interface TargetAllocation {
  departmentId: string;
  allocated: number;
}

export interface Target {
  id: string;
  name: string;
  metric: string;
  unit: 'people' | 'naira' | 'percent' | 'communities';
  periodLabel: string;
  totalTarget: number;
  currentValue: number;
  allocations: TargetAllocation[];
  status: 'Active' | 'Draft' | 'Closed';
  createdAt: string;
}

export interface NewTargetInput {
  name: string;
  metric: string;
  unit: Target['unit'];
  periodLabel: string;
  totalTarget: number;
  currentValue: number;
  allocations: TargetAllocation[];
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
