import type { Approval, Community, EvidenceItem, FieldTask, Grievance, Indicator, Project, Report, Stakeholder } from '../types';

export const PROJECTS: Project[] = [
  { id: 'STEP', code: 'STEP', name: 'Teachers Empowerment (STEP)', output: '623 teachers certified', pillar: 'Education', state: 'Edo · Delta', budget: '₦480M', utilPct: '90%', progress: '90%', progPct: '90%', status: 'On track' },
  { id: 'PEARL', code: 'PEARL', name: 'PEARLs Academic Quiz', output: '51,955 students', pillar: 'Education', state: 'Multi-state', budget: '₦210M', utilPct: '96%', progress: '96%', progPct: '96%', status: 'On track' },
  { id: 'EYE', code: 'EYE', name: 'Eye Can See Outreach', output: '23,447 screened', pillar: 'Health', state: 'Edo', budget: '₦640M', utilPct: '72%', progress: '70%', progPct: '70%', status: 'On track' },
  { id: 'WATER', code: 'WATER', name: 'Community Water Scheme', output: '12 boreholes', pillar: 'Infrastructure', state: 'Delta', budget: '₦520M', utilPct: '58%', progress: '54%', progPct: '54%', status: 'At risk' },
  { id: 'POWER', code: 'POWER', name: 'Mini-grid Electrification', output: '3 sites energised', pillar: 'Infrastructure', state: 'Imo', budget: '₦710M', utilPct: '41%', progress: '38%', progPct: '38%', status: 'Delayed' },
  { id: 'YEP', code: 'YEP', name: 'Youth Entrepreneurship (YEP)', output: '129+ trained', pillar: 'Economic Emp.', state: 'Delta', budget: '₦300M', utilPct: '66%', progress: '64%', progPct: '64%', status: 'On track' },
  { id: 'FELL', code: 'FELL', name: 'Entrepreneurship Fellowship', output: '55 fellows', pillar: 'Economic Emp.', state: 'Edo', budget: '₦150M', utilPct: '88%', progress: '85%', progPct: '85%', status: 'On track' },
  { id: 'STEAM', code: 'STEAM', name: 'STEAM Labs & Scholarships', output: '2 labs built', pillar: 'Education', state: 'Edo · Delta', budget: '₦260M', utilPct: '50%', progress: '48%', progPct: '48%', status: 'At risk' },
];

export const COMMUNITIES: Community[] = [
  { id: 'sapele', name: 'Sapele', lga: 'Sapele LGA', state: 'Delta', pop: '≈174K', projects: 6, spend: '₦640M', cdc: 'Chief E. Okpako · active CDC' },
  { id: 'oben', name: 'Oben', lga: 'Orhionmwon', state: 'Edo', pop: '≈28K', projects: 4, spend: '₦410M', cdc: 'HRH Ogiegbaen · active CDC' },
  { id: 'amukpe', name: 'Amukpe', lga: 'Sapele LGA', state: 'Delta', pop: '≈52K', projects: 3, spend: '₦230M', cdc: 'Women & Youth council' },
  { id: 'ovhor', name: 'Ovhor', lga: 'Ughelli South', state: 'Delta', pop: '≈19K', projects: 2, spend: '₦180M', cdc: 'CDC forming · Phase 1' },
  { id: 'orogun', name: 'Orogun', lga: 'Ughelli North', state: 'Delta', pop: '≈61K', projects: 5, spend: '₦520M', cdc: 'Chief Council · active' },
  { id: 'ozara', name: 'Ozara', lga: 'Igueben', state: 'Edo', pop: '≈14K', projects: 2, spend: '₦120M', cdc: 'Traditional council' },
];

export const INDICATORS: Indicator[] = [
  { id: 'ind-1', metric: 'Local employment & content', local: 'NCDMB Nigerian Content %', global: 'GRI 202 / 401 · IPIECA SOC-5', sdg: '8' },
  { id: 'ind-2', metric: 'Community investment (₦)', local: 'PIA HCDT — 3% OpEx', global: 'GRI 203 / 413 · IPIECA SOC-9', sdg: '1 · 11' },
  { id: 'ind-3', metric: 'Skills & training', local: 'NCDMB human-capital dev.', global: 'GRI 404 · IPIECA SOC-6', sdg: '4 · 8' },
  { id: 'ind-4', metric: 'Health access', local: 'State health partnerships', global: 'GRI 203 / 403', sdg: '3' },
  { id: 'ind-5', metric: 'Engagement & grievances', local: 'NUPRC HC Regs 2022', global: 'GRI 413 · IPIECA SOC-13', sdg: '16' },
  { id: 'ind-6', metric: 'Women & youth inclusion', local: 'Federal inclusion targets', global: 'GRI 405 · IPIECA SOC-4', sdg: '5 · 10' },
];

export const REPORTS: Report[] = [
  { id: 'rep-1', name: 'Board Social Performance Pack', lens: 'Board', desc: 'Quarterly KPI summary, aspiration progress and risk register for the Seplat board.', updated: 'Updated 2d ago' },
  { id: 'rep-2', name: 'ESG / Sustainability Report', lens: 'Global', desc: 'GRI 400, IFRS S1 and IPIECA social disclosures — investor-grade, LSE-ready.', updated: 'Updated 5d ago' },
  { id: 'rep-3', name: 'NCDMB Compliance Return', lens: 'Local', desc: 'Nigerian content, community employment and human-capital development return.', updated: 'Updated 1w ago' },
  { id: 'rep-4', name: 'PIA HCDT Statement', lens: 'Local', desc: 'Host Community Development Trust 3% OpEx allocation and spend reconciliation.', updated: 'Updated 1w ago' },
  { id: 'rep-5', name: 'SDG Contribution Report', lens: 'Global', desc: 'Investment and impact mapped to the UN Sustainable Development Goals.', updated: 'Updated 3d ago' },
  { id: 'rep-6', name: 'Community Feedback Report', lens: 'Community', desc: 'Plain-language summary of projects and outcomes for host communities.', updated: 'Updated 4d ago' },
];

export const STAKEHOLDERS: Stakeholder[] = [
  { id: 'sh-1', name: 'Ovhor Community Development Committee', type: 'Community institution', community: 'Ovhor, Delta', engagements: 6, commitments: '2 open', status: 'Active' },
  { id: 'sh-2', name: 'Delta State Ministry of Education', type: 'Government agency', community: 'State-wide', engagements: 4, commitments: 'On track', status: 'Active' },
  { id: 'sh-3', name: 'C4C Foundation', type: 'Implementing NGO', community: 'Multi-community', engagements: 9, commitments: 'On track', status: 'Active' },
  { id: 'sh-4', name: "Sapele Women's Cooperative", type: "Women's group", community: 'Sapele, Delta', engagements: 3, commitments: '1 open', status: 'Active' },
  { id: 'sh-5', name: 'Niger Delta Youth Council', type: 'Youth group', community: 'Regional', engagements: 5, commitments: '2 open', status: 'Watch' },
  { id: 'sh-6', name: 'HRH the Ogie of Oben', type: 'Traditional institution', community: 'Oben, Edo', engagements: 4, commitments: 'On track', status: 'Active' },
];

export const TASKS: FieldTask[] = [
  { id: 'task-1', title: 'Log Q3 teacher-training session', project: 'STEP · Sapele', due: 'Due today', dueColor: '#C0491E' },
  { id: 'task-2', title: 'Beneficiary count — eye screening', project: 'Eye Can See · Oben', due: 'Due tomorrow', dueColor: '#8A8DA6' },
  { id: 'task-3', title: 'Upload borehole handover photos', project: 'Water Scheme · Ovhor', due: 'Due in 3 days', dueColor: '#8A8DA6' },
  { id: 'task-4', title: 'Community meeting minutes', project: 'YEP · Orogun', due: 'Overdue · 1 day', dueColor: '#E31A38' },
];

export const APPROVALS: Approval[] = [
  { id: 'appr-1', who: 'Grace Idemudia', item: 'Activity log — teacher training (42 attendees)', project: 'STEP · Sapele', when: '2h ago', type: 'Activity' },
  { id: 'appr-2', who: 'John Efe', item: 'Beneficiary count — 318 people screened', project: 'Eye Can See · Oben', when: '5h ago', type: 'Beneficiaries' },
  { id: 'appr-3', who: 'Grace Idemudia', item: 'Spend record — ₦2.4M training venue', project: 'STEP · Sapele', when: 'Yesterday', type: 'Spend' },
  { id: 'appr-4', who: 'Mary Uche', item: 'Evidence — 8 photos + attendance sheet', project: 'YEP · Orogun', when: 'Yesterday', type: 'Evidence' },
];

export const EVIDENCE_ITEMS: EvidenceItem[] = [
  { id: 'ev-1', label: 'training-session.jpg', meta: 'STEP · Sapele · 12 Jun', kind: 'PHOTO' },
  { id: 'ev-2', label: 'attendance-sheet.pdf', meta: 'STEP · Sapele · 12 Jun', kind: 'DOC' },
  { id: 'ev-3', label: 'borehole-handover.jpg', meta: 'Water · Ovhor · 09 Jun', kind: 'PHOTO' },
  { id: 'ev-4', label: 'eye-clinic-outreach.jpg', meta: 'Eye Can See · Oben · 08 Jun', kind: 'PHOTO' },
  { id: 'ev-5', label: 'community-meeting.mp4', meta: 'YEP · Orogun · 05 Jun', kind: 'VIDEO' },
  { id: 'ev-6', label: 'mou-signed.pdf', meta: 'YEP · Orogun · 01 Jun', kind: 'DOC' },
];

export const INITIAL_GRIEVANCES: Grievance[] = [
  {
    id: 'g-118', ref: 'GRV-118', title: 'Delayed borehole handover', category: 'Infrastructure / service delivery', severity: 'High', status: 'Investigating', channel: 'Community meeting',
    raisedByName: 'Pa Godwin Eze', raisedByRole: 'Community elder', raisedByCommunity: 'Ovhor, Delta', raisedByContact: '0803 000 1121',
    loggedBy: 'Grace Idemudia · Field Officer', assignee: 'Blessing Aganbi · Community Relations',
    description: 'Borehole completed but not handed over; community still without potable water.',
    dateRaised: '28 Jun 2026', dueDate: '12 Jul 2026', overdue: false, resolution: null, resolvedDate: null, satisfaction: null,
    timeline: [
      { id: 'g-118-t1', ts: '28 Jun · 10:12', actor: 'Grace Idemudia · Field Officer', action: 'Grievance logged via community meeting' },
      { id: 'g-118-t2', ts: '29 Jun · 09:40', actor: 'Blessing Aganbi · Community Relations', action: 'Assigned to self · investigation started' },
    ],
  },
  {
    id: 'g-116', ref: 'GRV-116', title: 'Local hiring dispute', category: 'Employment / local content', severity: 'Medium', status: 'Open', channel: 'Phone hotline',
    raisedByName: 'Comrade Efe Ako', raisedByRole: 'Youth leader', raisedByCommunity: 'Sapele, Delta', raisedByContact: '0810 000 4432',
    loggedBy: 'John Efe · Field Officer', assignee: null,
    description: 'Youths allege non-locals were hired for the training-centre construction.',
    dateRaised: '01 Jul 2026', dueDate: '15 Jul 2026', overdue: false, resolution: null, resolvedDate: null, satisfaction: null,
    timeline: [{ id: 'g-116-t1', ts: '01 Jul · 14:05', actor: 'John Efe · Field Officer', action: 'Grievance logged via phone hotline' }],
  },
  {
    id: 'g-113', ref: 'GRV-113', title: 'Dust from construction site', category: 'Environment / nuisance', severity: 'Medium', status: 'Investigating', channel: 'Walk-in desk',
    raisedByName: 'Mrs. Rita Okoro', raisedByRole: 'Resident', raisedByCommunity: 'Orogun, Delta', raisedByContact: '0805 000 8890',
    loggedBy: 'Grace Idemudia · Field Officer', assignee: 'Blessing Aganbi · Community Relations',
    description: 'Excess dust from mini-grid works is affecting nearby homes.',
    dateRaised: '20 Jun 2026', dueDate: '04 Jul 2026', overdue: true, resolution: null, resolvedDate: null, satisfaction: null,
    timeline: [
      { id: 'g-113-t1', ts: '20 Jun · 11:30', actor: 'Grace Idemudia · Field Officer', action: 'Grievance logged via walk-in desk' },
      { id: 'g-113-t2', ts: '22 Jun · 08:15', actor: 'Blessing Aganbi · Community Relations', action: 'Assigned to self · investigation started' },
    ],
  },
  {
    id: 'g-111', ref: 'GRV-111', title: 'Scholarship shortlist query', category: 'Programme / fairness', severity: 'Low', status: 'Resolved', channel: 'Community meeting',
    raisedByName: 'Mr. Sunday Ibe', raisedByRole: 'Parent', raisedByCommunity: 'Oben, Edo', raisedByContact: '0813 000 2210',
    loggedBy: 'John Efe · Field Officer', assignee: 'Blessing Aganbi · Community Relations',
    description: 'Query over how the scholarship shortlist was compiled.',
    dateRaised: '10 Jun 2026', dueDate: '24 Jun 2026', overdue: false,
    resolution: 'Selection criteria published and shared with the CDC; two eligible names reinstated.', resolvedDate: '21 Jun 2026', satisfaction: null,
    timeline: [
      { id: 'g-111-t1', ts: '10 Jun · 09:00', actor: 'John Efe · Field Officer', action: 'Grievance logged via community meeting' },
      { id: 'g-111-t2', ts: '12 Jun · 10:20', actor: 'Blessing Aganbi · Community Relations', action: 'Assigned to self · investigation started' },
      { id: 'g-111-t3', ts: '21 Jun · 16:40', actor: 'Blessing Aganbi · Community Relations', action: 'Resolved · criteria published, two names reinstated' },
    ],
  },
  {
    id: 'g-109', ref: 'GRV-109', title: 'Clinic opening-hours request', category: 'Programme / access', severity: 'Low', status: 'Closed', channel: 'Suggestion box',
    raisedByName: "Amukpe Women's Cooperative", raisedByRole: "Women's group", raisedByCommunity: 'Amukpe, Delta', raisedByContact: 'via CDC',
    loggedBy: 'Grace Idemudia · Field Officer', assignee: 'Blessing Aganbi · Community Relations',
    description: 'Request to extend Eye Can See clinic hours on market days.',
    dateRaised: '02 Jun 2026', dueDate: '16 Jun 2026', overdue: false,
    resolution: 'Clinic hours extended on Wednesdays and Saturdays with the outreach team.', resolvedDate: '11 Jun 2026', satisfaction: 'Very satisfied',
    timeline: [
      { id: 'g-109-t1', ts: '02 Jun · 12:00', actor: 'Grace Idemudia · Field Officer', action: 'Grievance logged via suggestion box' },
      { id: 'g-109-t2', ts: '04 Jun · 09:10', actor: 'Blessing Aganbi · Community Relations', action: 'Assigned to self · investigation started' },
      { id: 'g-109-t3', ts: '11 Jun · 15:00', actor: 'Blessing Aganbi · Community Relations', action: 'Resolved · hours extended' },
      { id: 'g-109-t4', ts: '14 Jun · 10:00', actor: 'Blessing Aganbi · Community Relations', action: 'Case closed · satisfaction: Very satisfied' },
    ],
  },
];
