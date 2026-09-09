export type BulkUploadDataType =
  | 'Beneficiary counts'
  | 'Activity logs'
  | 'Financial spend'
  | 'Project master data'
  | 'Project completion';

export const BULK_UPLOAD_DATA_TYPES: BulkUploadDataType[] = [
  'Beneficiary counts',
  'Activity logs',
  'Financial spend',
  'Project master data',
  'Project completion',
];

export interface UploadTemplate {
  filename: string;
  columns: string[];
  example: string[];
  note: string;
}

export const UPLOAD_TEMPLATES: Record<BulkUploadDataType, UploadTemplate> = {
  /**
   * What a finished project must supply for the system to produce its report.
   *
   * One row per completed project. Every field maps directly to something the report
   * prints: reach and impact are separate columns on purpose, and each headline figure
   * has a paired source column, because a number without a source is not reportable.
   */
  'Project completion': {
    filename: 'spims-template-project-completion.csv',
    columns: [
      'project_code',
      'completion_date',
      'final_spend_ngn',
      'output_headline',
      'outcome_statement',
      'reach_total',
      'reach_description',
      'reach_channels',
      'impact_direct_beneficiaries',
      'impact_statement',
      'reach_vs_impact_note',
      'beneficiaries_female',
      'beneficiaries_male',
      'beneficiaries_youth_under_35',
      'beneficiaries_pwd',
      'communities_served',
      'baseline_value',
      'endline_value',
      'measure_description',
      'evidence_source',
      'lessons_learned',
    ],
    example: [
      'SOLAR',
      '2027-06-30',
      '180000000',
      '120 youth certified in solar installation',
      'Certified youth entering paid solar installation work across Delta host communities',
      '1640',
      'young people who applied for a training place',
      'Applications received: 1640',
      '120',
      '120 young people trained and certified',
      '1,520 applicants were not selected — they were reached, not impacted',
      '54',
      '66',
      '118',
      '3',
      'Sapele, Delta; Amukpe, Delta',
      '12% employed in the sector at intake',
      '61% employed six months after certification',
      'Share of cohort in paid solar work, measured at intake and six months post-certification',
      'Cohort tracking survey, June 2027, n=112 of 120',
      'Tool kits on graduation mattered more than course length — cohorts without kits had far lower conversion',
    ],
    note:
      'One row per completed project. reach_total counts everyone the project interacted with; impact_direct_beneficiaries counts only those who received the intervention — do not put the same number in both. Separate multiple reach_channels or communities with a semicolon. evidence_source is required: any figure without one is reported as unverified.',
  },
  'Beneficiary counts': {
    filename: 'spims-template-beneficiary-counts.csv',
    columns: ['project_code', 'activity_date', 'community', 'total_reached', 'female', 'male', 'youth_under_35', 'pwd'],
    example: ['STEP', '2026-07-06', 'Sapele, Delta', '42', '24', '18', '31', '1'],
    note: 'One row per activity/date. Disaggregation columns should add up to total_reached.',
  },
  'Activity logs': {
    filename: 'spims-template-activity-logs.csv',
    columns: ['project_code', 'activity_date', 'activity_type', 'location', 'total_reached', 'female', 'male', 'youth_under_35', 'pwd', 'site_notes'],
    example: ['STEP', '2026-07-06', 'Training / workshop', 'Sapele — 5.8904, 5.6767', '42', '24', '18', '31', '1', 'Full-day literacy methods training delivered.'],
    note: 'Mirrors the fields on the Log Activity form — activity_type should match one of the options there.',
  },
  'Financial spend': {
    filename: 'spims-template-financial-spend.csv',
    columns: ['project_code', 'period_month', 'pillar', 'amount_ngn', 'funding_source', 'notes'],
    example: ['WATER', '2026-07', 'Infrastructure', '43000000', 'PIA HCDT — 3% OpEx', 'Q3 borehole works'],
    note: 'period_month as YYYY-MM. amount_ngn as a plain number, no currency symbol or commas.',
  },
  'Project master data': {
    filename: 'spims-template-project-master-data.csv',
    columns: ['project_id', 'title', 'pillar', 'owner', 'community', 'lga', 'state', 'gps_coordinates', 'start_date', 'end_date', 'budget_ngn', 'funding_source', 'contractor', 'implementing_ngo'],
    example: ['SPL-2026-048', 'Solar Skills Academy — Cohort 3', 'Economic Empowerment', 'Tunde Bello', 'Sapele', 'Sapele LGA', 'Delta', '5.8904, 5.6767', '2026-09-01', '2027-06-30', '180000000', 'PIA HCDT — 3% OpEx', 'Bright Energy Ltd', 'C4C Foundation'],
    note: 'Mirrors the fields on the New Project intake form.',
  },
};
