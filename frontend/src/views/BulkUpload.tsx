import { useRef, useState } from 'react';
import { InfoTip } from '../components/Tooltip';
import { buildCsvFromRows, downloadBlob } from '../reportExport';
import { formField, h1, input, label, primaryBtn, secondaryBtn, sectionCardTitle, subtitle } from '../ui';
import type { Project } from '../types';
import type { ToastTone } from '../useToastQueue';

const DATA_TYPES = ['Beneficiary counts', 'Activity logs', 'Financial spend', 'Project master data'] as const;

interface UploadRecord {
  id: string;
  filename: string;
  dataType: string;
  project: string;
  rowCount: number;
}

interface UploadTemplate {
  filename: string;
  columns: string[];
  example: string[];
  note: string;
}

const TEMPLATES: Record<(typeof DATA_TYPES)[number], UploadTemplate> = {
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

function downloadTemplate(t: UploadTemplate) {
  const csv = buildCsvFromRows([t.columns, t.example]);
  downloadBlob(new Blob([csv], { type: 'text/csv' }), t.filename);
}

function parseHeaderRow(firstLine: string): string[] {
  return firstLine.split(',').map((cell) => cell.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
}

function countDataRows(text: string): number {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  return Math.max(0, lines.length - 1);
}

export function BulkUpload({ projects, pushToast }: { projects: Project[]; pushToast: (message: string, tone?: ToastTone) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dataType, setDataType] = useState<(typeof DATA_TYPES)[number]>('Beneficiary counts');
  const [projectId, setProjectId] = useState('all');
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploads, setUploads] = useState<UploadRecord[]>([]);

  const projectLabel = projectId === 'all' ? 'All projects' : projects.find((p) => p.id === projectId)?.name ?? 'All projects';

  const handleUpload = () => {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      pushToast('Choose a CSV file first.', 'warning');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      const firstLine = text.split(/\r?\n/)[0] ?? '';
      const expected = TEMPLATES[dataType].columns;
      const actual = parseHeaderRow(firstLine);
      const matches = expected.length === actual.length && expected.every((col, i) => col.toLowerCase() === actual[i]?.toLowerCase());
      if (!matches) {
        pushToast(`Columns don't match the ${dataType.toLowerCase()} template. Expected: ${expected.join(', ')}. Download the template and try again.`, 'warning');
        return;
      }
      const rowCount = countDataRows(text);
      setUploads((prev) => [{ id: `up-${Date.now()}`, filename: file.name, dataType, project: projectLabel, rowCount }, ...prev]);
      pushToast(`${file.name} received — ${rowCount} rows queued for review.`, 'success');
      if (fileRef.current) fileRef.current.value = '';
      setFileName(null);
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ maxWidth: 820 }}>
      <h1 style={h1}>Bulk Upload</h1>
      <p style={subtitle}>Upload a CSV of beneficiary counts, activity logs, financial spend or project data in one file instead of entering it record by record.</p>

      <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '24px 26px', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, ...sectionCardTitle }}>
          File details
          <InfoTip label="How this works" width={320}>
            SPIMS matches columns by exact name — it doesn't yet interpret arbitrary spreadsheet layouts, so the file needs to follow one of the templates below. The file is validated and queued for a Project Manager to review; it does not write directly into SPIMS records yet. These templates are a placeholder scope until Seplat provides their own field list.
          </InfoTip>
        </div>
        <div className="form-grid-3" style={{ marginBottom: 16 }}>
          <div style={formField}>
            <label style={label}>Data type</label>
            <select style={input} value={dataType} onChange={(e) => setDataType(e.target.value as (typeof DATA_TYPES)[number])}>
              {DATA_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div style={formField}>
            <label style={label}>Project</label>
            <select style={input} value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="all">All projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div style={formField}>
            <label style={label}>CSV file</label>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
              style={{ ...input, padding: '8px 13px' }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button onClick={handleUpload} style={primaryBtn}>
            Upload file →
          </button>
          <button onClick={() => downloadTemplate(TEMPLATES[dataType])} style={secondaryBtn}>
            Download {dataType.toLowerCase()} template
          </button>
          {fileName && <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>{fileName} selected</span>}
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '24px 26px', marginBottom: 18 }}>
        <div style={sectionCardTitle}>Templates for each data type</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {DATA_TYPES.map((t, i) => {
            const tpl = TEMPLATES[t];
            return (
              <div
                key={t}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 14,
                  flexWrap: 'wrap',
                  paddingBottom: 14,
                  borderBottom: i === DATA_TYPES.length - 1 ? 'none' : '1px solid var(--line)',
                }}
              >
                <div style={{ flex: 1, minWidth: 260 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--navy)', marginBottom: 4 }}>{t}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--muted)', fontFamily: 'monospace', marginBottom: 4, wordBreak: 'break-word' }}>{tpl.columns.join(', ')}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{tpl.note}</div>
                </div>
                <button onClick={() => downloadTemplate(tpl)} style={{ ...secondaryBtn, flexShrink: 0 }}>
                  Download →
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {uploads.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '15px 22px', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)', background: '#fafafe', borderBottom: '1px solid var(--line)' }}>
            Uploaded this session
          </div>
          {uploads.map((u) => (
            <div
              key={u.id}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, padding: '14px 22px', borderBottom: '1px solid var(--line)', flexWrap: 'wrap' }}
            >
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--navy)' }}>{u.filename}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{u.dataType} · {u.project} · {u.rowCount} rows</div>
              </div>
              <span style={{ fontSize: 11.5, fontWeight: 600, padding: '4px 11px', borderRadius: 20, background: 'rgba(43,76,155,0.12)', color: '#2B4C9B' }}>
                Queued for review
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
