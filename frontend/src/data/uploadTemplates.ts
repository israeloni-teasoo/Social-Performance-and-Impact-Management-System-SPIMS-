export type BulkUploadDataType = 'Beneficiary counts' | 'Activity logs' | 'Financial spend' | 'Project master data';

export const BULK_UPLOAD_DATA_TYPES: BulkUploadDataType[] = ['Beneficiary counts', 'Activity logs', 'Financial spend', 'Project master data'];

export interface UploadTemplate {
  filename: string;
  columns: string[];
  example: string[];
  note: string;
}

export const UPLOAD_TEMPLATES: Record<BulkUploadDataType, UploadTemplate> = {
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
