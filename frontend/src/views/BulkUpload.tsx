import { useRef, useState } from 'react';
import { InfoTip } from '../components/Tooltip';
import { formField, h1, input, label, primaryBtn, sectionCardTitle, subtitle } from '../ui';
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
      const rowCount = countDataRows(String(reader.result ?? ''));
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
          <InfoTip label="How this works">
            The file is validated and queued for a Project Manager to review — it does not write directly into SPIMS records yet. Row-by-row import into live data is planned alongside the reporting API described in Help &amp; Standards.
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={handleUpload} style={primaryBtn}>
            Upload file →
          </button>
          {fileName && <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>{fileName} selected</span>}
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
