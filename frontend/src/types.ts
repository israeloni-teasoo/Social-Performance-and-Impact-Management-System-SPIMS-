export type Role = 'exec' | 'manager' | 'field' | 'relations';

export type View =
  | 'dashboard'
  | 'settings'
  | 'portfolio'
  | 'impact'
  | 'communities'
  | 'communitydetail'
  | 'reports'
  | 'myprojects'
  | 'newproject'
  | 'approvals'
  | 'mytasks'
  | 'logactivity'
  | 'evidence'
  | 'stakeholders'
  | 'mentions'
  | 'projectdetail'
  | 'help'
  | 'targets'
  | 'team'
  | 'bulkupload';

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

export interface ReportComment {
  id: string;
  reportId: string;
  author: string;
  text: string;
  requestsCorrection: boolean;
  createdAt: string;
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
  assigneeId?: string;
  status?: 'Not started' | 'In progress' | 'Done';
  createdBy?: string;
}

export interface NewTaskInput {
  title: string;
  project: string;
  due: string;
  assigneeId: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  roleTitle: string;
  status: 'Active' | 'Invited';
  joinedAt: string;
}

export interface NewTeamMemberInput {
  name: string;
  email: string;
  roleTitle: string;
}

export interface ApprovalComment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface Approval {
  id: string;
  who: string;
  item: string;
  project: string;
  when: string;
  type: string;
  details: string[];
  comments: ApprovalComment[];
}

export interface EvidenceItem {
  id: string;
  label: string;
  meta: string;
  kind: string;
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

export interface ReachChannel {
  /** How the interaction happened, e.g. "Scholarship applications received". */
  label: string;
  value: number;
}

/**
 * Reach is everyone a programme interacted with — applicants, attendees, people
 * screened, residents in a catchment area. Impact is the subset who actually
 * received the intervention. The two are deliberately separate figures: counting
 * an applicant who was turned down as someone the programme impacted overstates
 * the result, which is the single correction Seplat pressed hardest on.
 */
export interface ReachProfile {
  /** Total interactions across every channel. Aggregatable, so it is a number, not a display string. */
  total: number;
  /** What those interactions were, in plain words. */
  label: string;
  channels: ReachChannel[];
  /** The subset who actually received the intervention — the impact-side counterpart. */
  directBeneficiaries: number;
  /** What separates the two figures for this specific programme. */
  note: string;
}

export interface ProjectImpact {
  projectCode: string;
  inputs: string;
  activities: string;
  outputHeadline: string;
  outcome: string;
  /** Interactions vs. people actually served. Optional so a programme that hasn't
   *  had its reach separated yet is visibly unmapped rather than silently zero. */
  reach?: ReachProfile;
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

export interface Target {
  id: string;
  name: string;
  metric: string;
  unit: 'people' | 'naira' | 'percent' | 'communities';
  /** Month inputs, e.g. "2026-01" — supports targets that span more than one year. */
  periodStart: string;
  periodEnd: string;
  totalTarget: number;
  currentValue: number;
  status: 'Active' | 'Closed';
  createdAt: string;
}

export interface NewTargetInput {
  name: string;
  metric: string;
  unit: Target['unit'];
  periodStart: string;
  periodEnd: string;
  totalTarget: number;
  currentValue: number;
}

export type CustomFieldFormat = 'text' | 'number' | 'percent' | 'naira' | 'date';

/**
 * A question a programme keeps getting asked, answered on the programme's own page
 * so it doesn't need a fresh ad-hoc report each time. Every field carries a source,
 * on the same provenance rule as impact figures.
 */
export interface CustomField {
  id: string;
  projectCode: string;
  question: string;
  answer: string;
  format: CustomFieldFormat;
  /** Where the answer came from, so a reader can challenge it. */
  source: string;
  updatedAt: string;
  updatedBy: string;
}

export interface NewCustomFieldInput {
  projectCode: string;
  question: string;
  answer: string;
  format: CustomFieldFormat;
  source: string;
}

/** An account as shown to an administrator. Never carries the password hash. */
export interface ManagedUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  roleLabel: string;
  initials: string;
  /** Accounts are deactivated rather than deleted, so their history survives. */
  active: boolean;
  createdAt: string;
}

export interface NewUserInput {
  email: string;
  name: string;
  role: Role;
  password: string;
}

/** Organisation settings, editable by an Executive under Settings. */
export interface OrgSettings {
  orgName: string;
  financialYear: string;
  currencyLabel: string;
  targetYear: number;
  dataStatusNote: string;
}

/** What this deployment has connected. Never carries any key or secret. */
export interface IntegrationStatus {
  claudeConfigured: boolean;
  mediaMonitoringConfigured: boolean;
  database: string;
  projects: number;
  activeUsers: number;
  uploads: number;
}

export interface NewProjectInput {
  code: string;
  name: string;
  pillar: string;
  state: string;
  budget: string;
  output?: string;
  status?: string;
  progPct?: string;
  utilPct?: string;
  startDate?: string;
  endDate?: string;
  fundingSource?: string;
  contractor?: string;
  partner?: string;
  community?: string;
  lga?: string;
  owner?: string;
}

/* ------------------------------------------------------------ media mentions */

export type MentionStatus = 'pending' | 'accepted' | 'rejected';
export type MentionCategory = 'socialInvestment' | 'corporate' | 'unrelated';
export type MentionSourceKind = 'gdelt' | 'rss' | 'googleAlerts';

/** A source SPIMS looks in. Phase one carries only free press and web sources. */
export interface MentionSource {
  id: string;
  name: string;
  kind: MentionSourceKind;
  /** A search query for GDELT; a feed URL for the others. */
  target: string;
  active: boolean;
}

/**
 * One article that mentions Seplat.
 *
 * Never a reported figure — a mention is evidence that somebody published something,
 * which is a different kind of claim from the counted figures in the analytics layer.
 */
export interface Mention {
  id: string;
  url: string;
  title: string;
  publisher: string;
  snippet: string;
  language: string;
  country: string;
  publishedAt: string | null;
  status: MentionStatus;
  category: MentionCategory | null;
  projectCode: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  /** Alert rules this matched when it arrived. Empty when it matched none. */
  flags: string[];
  foundAt: string;
  sourceName: string;
  sourceKind: string;
}

/** What makes a mention worth interrupting someone for. */
export interface AlertRule {
  id: string;
  name: string;
  /** Terms, one per line or comma separated. */
  terms: string;
  active: boolean;
}

export type AlertChannelKind = 'teams' | 'slack' | 'webhook';

/**
 * Where an alert is delivered.
 *
 * The URL never reaches the browser: it is a credential, and anyone holding it can
 * post into that channel. Only the host comes back, which is enough to tell two
 * channels apart.
 */
export interface AlertChannel {
  id: string;
  name: string;
  kind: AlertChannelKind;
  urlMasked: string;
  active: boolean;
  lastStatus: string | null;
  lastError: string | null;
  lastSentAt: string | null;
}

export interface AlertConfig {
  rules: AlertRule[];
  channels: AlertChannel[];
  /** False when the deployment has no public URL set, so alerts carry no link. */
  appUrlConfigured: boolean;
}

/** What the last ingestion did, so an empty queue can be told from a broken fetch. */
export interface MentionRun {
  startedAt: string;
  status: 'ok' | 'partial' | 'failed';
  found: number;
  added: number;
  duplicates: number;
  detail: { source: string; ok: boolean; items: number; error?: string }[];
}

export interface MentionFeed {
  /** The coverage limitation, carried with the data rather than left in a document. */
  coverageNote: string;
  activeSources: number;
  counts: Partial<Record<MentionStatus, number>>;
  lastRun: MentionRun | null;
  mentions: Mention[];
}
