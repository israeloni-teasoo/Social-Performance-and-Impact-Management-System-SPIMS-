import { useRef, useState } from 'react';
import { api } from '../api';
import { InfoTip } from '../components/Tooltip';
import { BULK_UPLOAD_DATA_TYPES, UPLOAD_TEMPLATES } from '../data/uploadTemplates';
import { buildCsvFromRows, downloadBlob } from '../reportExport';
import { formField, h1, input, label, primaryBtn, secondaryBtn, sectionCardTitle, subtitle } from '../ui';
import type { BulkUploadDataType, UploadTemplate } from '../data/uploadTemplates';
import type { Project } from '../types';
import type { ToastTone } from '../useToastQueue';

interface UploadRecord {
  id: string;
  filename: string;
  dataType: string;
  project: string;
  rowCount: number;
  status: string;
}

function downloadTemplate(t: UploadTemplate) {
  const csv = buildCsvFromRows([t.columns, t.example]);
  downloadBlob(new Blob([csv], { type: 'text/csv' }), t.filename);
}

export function BulkUpload({ projects, pushToast }: { projects: Project[]; pushToast: (message: string, tone?: ToastTone) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dataType, setDataType] = useState<BulkUploadDataType>('Beneficiary counts');
  const [projectId, setProjectId] = useState('all');
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploads, setUploads] = useState<UploadRecord[]>([]);

  const handleUpload = () => {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      pushToast('Choose a CSV file first.', 'warning');
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const csvText = String(reader.result ?? '');
      setUploading(true);
      try {
        const result = await api.post<{ id: string; rowCount: number; status: string }>('/api/bulk-upload', {
          filename: file.name,
          dataType,
          projectId: projectId === 'all' ? null : projectId,
          csvText,
        });
        setUploads((prev) => [
          { id: result.id, filename: file.name, dataType, project: projectId === 'all' ? 'All projects' : projects.find((p) => p.id === projectId)?.name ?? 'All projects', rowCount: result.rowCount, status: result.status },
          ...prev,
        ]);
        pushToast(`${file.name} received — ${result.rowCount} rows ${result.status.toLowerCase()}.`, 'success');
        if (fileRef.current) fileRef.current.value = '';
        setFileName(null);
      } catch (err) {
        pushToast(err instanceof Error ? err.message : 'Upload failed — try again.', 'warning');
      } finally {
        setUploading(false);
      }
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
            SPIMS matches columns by exact name — it doesn't yet interpret arbitrary spreadsheet layouts, so the file needs to follow one of the templates below. Validation and row parsing happen server-side. Financial spend rows are written straight into spend records; beneficiary counts, activity logs and project data are parsed and logged for a Project Manager to review, pending a decision on how each should update live records.
          </InfoTip>
        </div>
        <div className="form-grid-3" style={{ marginBottom: 16 }}>
          <div style={formField}>
            <label style={label}>Data type</label>
            <select style={input} value={dataType} onChange={(e) => setDataType(e.target.value as BulkUploadDataType)}>
              {BULK_UPLOAD_DATA_TYPES.map((t) => (
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
          <button onClick={handleUpload} disabled={uploading} style={{ ...primaryBtn, opacity: uploading ? 0.7 : 1 }}>
            {uploading ? 'Uploading…' : 'Upload file →'}
          </button>
          <button onClick={() => downloadTemplate(UPLOAD_TEMPLATES[dataType])} style={secondaryBtn}>
            Download {dataType.toLowerCase()} template
          </button>
          {fileName && <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>{fileName} selected</span>}
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '24px 26px', marginBottom: 18 }}>
        <div style={sectionCardTitle}>Templates for each data type</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {BULK_UPLOAD_DATA_TYPES.map((t, i) => {
            const tpl = UPLOAD_TEMPLATES[t];
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
                  borderBottom: i === BULK_UPLOAD_DATA_TYPES.length - 1 ? 'none' : '1px solid var(--line)',
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
                {u.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
