import type { Approval, Community, EvidenceItem, FieldTask, Grievance, Indicator, Project, ProjectImpact, Report, Stakeholder } from '../types';

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

// Impact figures are derived, not asserted — each carries the metric, calculation and
// source it was extrapolated from, per the board's request to show working, not just totals.
export const PROJECT_IMPACTS: Record<string, ProjectImpact> = {
  STEP: {
    projectCode: 'STEP',
    inputs: '₦480M invested in staff, curriculum materials and delivery partners — C4C Foundation and state ministries of education.',
    activities: 'Trained and certified primary-school teachers and inspectors across Edo and Delta in structured literacy and numeracy methods.',
    outputHeadline: '623 teachers certified in 2026',
    outcome: 'Better teaching quality and classroom practice — literacy proficiency in STEP-supported schools moved from 54% (baseline) to 66% (endline).',
    impactHeadline: '≈19,300 children reached this academic year',
    impactDetail:
      'Better-trained teachers translate into improved classroom outcomes for the pupils in front of them this year. Sustained over several years, this is associated with lower drop-out and (per Seplat’s host-community objectives) reduced youth restiveness — but that longer-run claim is not quantified here.',
    methodology: {
      metric: 'Pupil-teacher ratio, primary education (Nigeria)',
      calculation: '623 certified teachers × ≈31 pupils per teacher ≈ 19,313 children directly reached in the current academic year.',
      source: 'World Bank / UNESCO Institute for Statistics pupil-teacher ratio data for Nigeria; extrapolation approach follows IPIECA’s "Creating Successful, Sustainable Social Investment" M&E guidance and GRI 404 training-outcome disclosures.',
      note: 'This is a single-year, direct-reach figure — not a multi-year cumulative count. A retention-adjusted multi-year figure would need validation against actual teacher-retention data before it goes in an external report.',
    },
    baseline: [
      { label: 'Baseline', value: '54%', pct: 54 },
      { label: 'Midline', value: '61%', pct: 61 },
      { label: 'Endline', value: '66%', pct: 66 },
    ],
    baselineCaption: 'Pupil literacy proficiency in STEP-supported schools.',
    dualLens: [
      { tag: 'Local', text: 'NCDMB human-capital development' },
      { tag: 'Global', text: 'GRI 404 · IPIECA SOC-6' },
      { tag: 'SDG', text: 'SDG 4 · Quality Education & SDG 8' },
    ],
    costPerOutcome: '₦24,858 per child reached',
    sroi: '3.4×',
    contactPerson: 'Tunde Bello · Project Manager, Edo',
    communitiesImpacted: ['Sapele, Delta', 'Amukpe, Delta', 'Oben, Edo'],
  },
  PEARL: {
    projectCode: 'PEARL',
    inputs: '₦210M invested in curriculum-aligned quiz materials, adjudication and multi-state logistics.',
    activities: 'Ran curriculum-aligned academic competitions for secondary-school students across partner states.',
    outputHeadline: '51,955 students engaged in 2026',
    outcome: 'Increased curriculum engagement and exam-oriented study habits among participating students.',
    impactHeadline: '51,955 students — direct reach, no extrapolation needed',
    impactDetail:
      'Unlike STEP, PEARLs’ output figure already counts unique student participants directly, not an intermediate output that needs extrapolating to reach a beneficiary count. The methodology note here is deliberately different from STEP’s: no multiplier is applied because none is needed.',
    methodology: {
      metric: 'Direct participant count',
      calculation: '51,955 registered student participants across the competition cycle — a headcount, not an extrapolation.',
      source: 'Internal PEARLs programme registration and adjudication records.',
      note: 'Because this is a direct count rather than an extrapolation, there is no external multiplier to cite — the number is only as reliable as the registration data feeding it.',
    },
    baseline: [
      { label: 'Cohort 1', value: '41%', pct: 41 },
      { label: 'Cohort 2', value: '48%', pct: 48 },
      { label: 'Cohort 3', value: '55%', pct: 55 },
    ],
    baselineCaption: 'Average quiz score across successive competition cohorts.',
    dualLens: [
      { tag: 'Local', text: 'State ministry curriculum alignment' },
      { tag: 'Global', text: 'GRI 203 · IPIECA SOC-6' },
      { tag: 'SDG', text: 'SDG 4 · Quality Education' },
    ],
    costPerOutcome: '₦4,042 per student engaged',
    sroi: '2.1×',
    contactPerson: 'Tunde Bello · Project Manager, Edo',
    communitiesImpacted: ['Sapele, Delta', 'Oben, Edo', 'Orogun, Delta', 'Ozara, Edo'],
  },
  EYE: {
    projectCode: 'EYE',
    inputs: '₦640M invested in mobile clinics, ophthalmic staff and outreach logistics across Edo.',
    activities: 'Free vision and eye-health screening clinics run in partnership with state health facilities.',
    outputHeadline: '23,447 people screened in 2026',
    outcome: 'Early identification of correctable vision impairment and referral into treatment pathways.',
    impactHeadline: '≈4,000 people identified with a treatable vision condition',
    impactDetail:
      'Nigeria’s National Blindness & Visual Impairment Survey found 84% of blindness nationally is avoidable, with uncorrected refractive error and cataract the leading causes — screening at scale is how those cases get found before they progress.',
    methodology: {
      metric: 'Share of screened population identified with a correctable condition',
      calculation: '23,447 screened × ≈17% (illustrative population eye-screening benchmark) ≈ 3,986 people identified needing corrective or clinical follow-up.',
      source: 'Nigeria National Blindness and Visual Impairment Survey (84% of blindness found avoidable; refractive error and cataract as leading causes). The 17% detection-rate figure is an illustrative placeholder, not lifted from that survey — replace with Eye Can See’s own clinical intake data before external reporting.',
      note: 'Flagged for Phase 1 follow-up: get the real detection rate from the clinical team running the outreach rather than relying on a placeholder percentage.',
    },
    baseline: [
      { label: '2024', value: '61%', pct: 61 },
      { label: '2025', value: '68%', pct: 68 },
      { label: '2026', value: '72%', pct: 72 },
    ],
    baselineCaption: 'Share of screened patients successfully referred into treatment.',
    dualLens: [
      { tag: 'Local', text: 'State health partnership MOU' },
      { tag: 'Global', text: 'GRI 203 / 403' },
      { tag: 'SDG', text: 'SDG 3 · Good Health & Well-being' },
    ],
    costPerOutcome: '₦160,562 per case identified',
    sroi: '1.8×',
    contactPerson: 'Tunde Bello · Project Manager, Edo',
    communitiesImpacted: ['Oben, Edo', 'Ozara, Edo'],
  },
  WATER: {
    projectCode: 'WATER',
    inputs: '₦520M invested in borehole drilling, pump equipment and community water-management training.',
    activities: 'Drilled and commissioned rural boreholes with community-led water committees in Delta State.',
    outputHeadline: '12 boreholes completed',
    outcome: 'Reduced walking distance to potable water and reduced dependence on unsafe surface-water sources.',
    impactHeadline: '≈3,000 people with improved water access',
    impactDetail: 'Rural boreholes are shared community infrastructure — the beneficiary count comes from typical households served per site, not from a per-teacher or per-patient style count.',
    methodology: {
      metric: 'Households served per rural borehole × national average household size',
      calculation: '12 boreholes × ≈50 households per site (typical Nigerian rural water-scheme planning norm) × 5 persons/household (national average) ≈ 3,000 people.',
      source: 'Household size: National Bureau of Statistics (average household size ≈5 persons). Households-per-borehole is a planning-norm assumption, not a cited statistic — validate against actual site household counts before external reporting.',
      note: 'The 50-households-per-site figure is a placeholder planning assumption. Field teams should replace it with actual registered household counts per borehole once available.',
    },
    baseline: [
      { label: 'Q1', value: '3', pct: 25 },
      { label: 'Q2', value: '7', pct: 58 },
      { label: 'Q3', value: '12', pct: 100 },
    ],
    baselineCaption: 'Cumulative boreholes commissioned by quarter.',
    dualLens: [
      { tag: 'Local', text: 'PIA HCDT — 3% OpEx' },
      { tag: 'Global', text: 'GRI 303 · IPIECA ENV-7' },
      { tag: 'SDG', text: 'SDG 6 · Clean Water & Sanitation' },
    ],
    costPerOutcome: '₦173,333 per person reached',
    sroi: '2.6×',
    contactPerson: 'Tunde Bello · Project Manager, Edo',
    communitiesImpacted: ['Ovhor, Delta', 'Orogun, Delta'],
  },
  POWER: {
    projectCode: 'POWER',
    inputs: '₦710M invested in solar mini-grid infrastructure across three sites in Imo State.',
    activities: 'Installed and energised community mini-grids with local technician training for upkeep.',
    outputHeadline: '3 sites energised',
    outcome: 'New household and small-business access to reliable electricity, replacing generator/kerosene use.',
    impactHeadline: '≈2,250 people gaining electricity access',
    impactDetail: 'As with the water scheme, the beneficiary count is derived from households connected per site rather than a direct headcount.',
    methodology: {
      metric: 'Households connected per mini-grid site × national average household size',
      calculation: '3 sites × ≈150 households connected per site (typical scale for a Nigerian community mini-grid) × 5 persons/household ≈ 2,250 people.',
      source: 'Household size: National Bureau of Statistics (average household size ≈5 persons). The 150-households-per-site figure is a planning-scale assumption — validate against actual connection counts once metering data is available.',
      note: 'Replace the 150-households assumption with real connection counts from the mini-grid operator before this number appears in an external report.',
    },
    baseline: [
      { label: 'Site 1', value: 'Energised', pct: 100 },
      { label: 'Site 2', value: 'Energised', pct: 100 },
      { label: 'Site 3', value: 'In progress', pct: 60 },
    ],
    baselineCaption: 'Commissioning status by site.',
    dualLens: [
      { tag: 'Local', text: 'NCDMB local content — technician training' },
      { tag: 'Global', text: 'GRI 302 / 203' },
      { tag: 'SDG', text: 'SDG 7 · Affordable & Clean Energy' },
    ],
    costPerOutcome: '₦315,556 per person reached',
    sroi: '1.6×',
    contactPerson: 'Tunde Bello · Project Manager, Edo',
    communitiesImpacted: ['Ozara, Edo'],
  },
  YEP: {
    projectCode: 'YEP',
    inputs: '₦300M invested in entrepreneurship training, seed grants and mentorship for young adults in Delta.',
    activities: 'Delivered business-skills training and start-up capital to youth entrepreneurs across Delta LGAs.',
    outputHeadline: '129+ youth trained in 2026',
    outcome: 'New and scaled youth-owned micro-enterprises across host communities.',
    impactHeadline: '≈194 additional jobs created (illustrative)',
    impactDetail: 'The jobs figure extrapolates from trained founders to the jobs their ventures create — a standard SME job-creation multiplier, not a direct headcount.',
    methodology: {
      metric: 'Average additional jobs created per supported micro-enterprise',
      calculation: '129 trained youth × ≈1.5 additional jobs per venture (typical MSME job-creation multiplier used in Nigerian development-sector programmes) ≈ 194 additional jobs.',
      source: 'The 1.5-jobs-per-venture multiplier is an illustrative placeholder consistent with commonly cited SMEDAN-style MSME benchmarks, not a figure lifted from a specific published study — replace with YEP’s own graduate-tracking data once available.',
      note: 'Flagged for Phase 1: commission or source a Nigeria-specific youth-entrepreneurship job-creation multiplier rather than relying on a generic placeholder.',
    },
    baseline: [
      { label: '6 months', value: '38%', pct: 38 },
      { label: '12 months', value: '61%', pct: 61 },
      { label: '18 months', value: '74%', pct: 74 },
    ],
    baselineCaption: 'Share of trained ventures still trading, by months since graduation.',
    dualLens: [
      { tag: 'Local', text: 'NCDMB local content — youth employment' },
      { tag: 'Global', text: 'GRI 203 / 401' },
      { tag: 'SDG', text: 'SDG 8 · Decent Work & Economic Growth' },
    ],
    costPerOutcome: '₦1,546,392 per job created',
    sroi: '2.3×',
    contactPerson: 'Tunde Bello · Project Manager, Edo',
    communitiesImpacted: ['Sapele, Delta', 'Orogun, Delta'],
  },
  FELL: {
    projectCode: 'FELL',
    inputs: '₦150M invested in a structured fellowship — mentorship, workspace and follow-on capital access.',
    activities: 'Ran a selective entrepreneurship fellowship for early-stage founders in Edo.',
    outputHeadline: '55 fellows graduated',
    outcome: 'Higher-growth ventures with continued mentor access post-programme.',
    impactHeadline: '≈83 additional jobs created (illustrative)',
    impactDetail: 'Same job-creation extrapolation approach as YEP, applied to a smaller, more selective cohort.',
    methodology: {
      metric: 'Average additional jobs created per fellowship venture',
      calculation: '55 fellows × ≈1.5 additional jobs per venture (same illustrative MSME multiplier used for YEP) ≈ 83 additional jobs.',
      source: 'Same placeholder multiplier as YEP — see that programme’s methodology note. Replace with Fellowship-specific tracking data once available.',
      note: 'Uses the same unverified placeholder multiplier as YEP; both should be replaced with real tracking data from the same source so the two figures stay comparable.',
    },
    baseline: [
      { label: 'Cohort 1', value: '71%', pct: 71 },
      { label: 'Cohort 2', value: '79%', pct: 79 },
      { label: 'Cohort 3', value: '85%', pct: 85 },
    ],
    baselineCaption: 'Share of fellowship ventures still trading after 12 months, by cohort.',
    dualLens: [
      { tag: 'Local', text: 'NCDMB local content — youth employment' },
      { tag: 'Global', text: 'GRI 203 / 401' },
      { tag: 'SDG', text: 'SDG 8 · Decent Work & Economic Growth' },
    ],
    costPerOutcome: '₦1,807,229 per job created',
    sroi: '2.5×',
    contactPerson: 'Tunde Bello · Project Manager, Edo',
    communitiesImpacted: ['Oben, Edo'],
  },
  STEAM: {
    projectCode: 'STEAM',
    inputs: '₦260M invested in lab equipment, scholarships and teacher training for hands-on STEM delivery.',
    activities: 'Built and equipped STEAM labs and awarded scholarships to students in Edo and Delta.',
    outputHeadline: '2 labs built, scholarships awarded',
    outcome: 'Increased hands-on access to science, technology, engineering, arts and maths equipment.',
    impactHeadline: '≈2,000 students gaining lab access (illustrative)',
    impactDetail: 'Each lab is shared infrastructure serving its whole host school, so the beneficiary count comes from typical school enrollment, not a per-student intake count.',
    methodology: {
      metric: 'Average student enrollment per host secondary school',
      calculation: '2 labs × ≈1,000 students per host school (typical Nigerian secondary-school enrollment) ≈ 2,000 students with lab access.',
      source: 'The 1,000-students-per-school figure is an illustrative planning assumption, not a specific cited enrollment count for these two schools — replace with the actual enrollment figures for the host schools before external reporting.',
      note: 'Replace the 1,000-student assumption with the real enrollment figures for each host school once confirmed with the state ministry of education.',
    },
    baseline: [
      { label: 'Lab 1', value: 'Operational', pct: 100 },
      { label: 'Lab 2', value: 'Fit-out', pct: 65 },
      { label: 'Scholarships', value: '48 awarded', pct: 80 },
    ],
    baselineCaption: 'Delivery status across labs and scholarship awards.',
    dualLens: [
      { tag: 'Local', text: 'State ministry STEM curriculum' },
      { tag: 'Global', text: 'GRI 404 · IPIECA SOC-6' },
      { tag: 'SDG', text: 'SDG 4 · Quality Education' },
    ],
    costPerOutcome: '₦130,000 per student reached',
    sroi: '1.9×',
    contactPerson: 'Tunde Bello · Project Manager, Edo',
    communitiesImpacted: ['Sapele, Delta', 'Amukpe, Delta', 'Oben, Edo'],
  },
};

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
