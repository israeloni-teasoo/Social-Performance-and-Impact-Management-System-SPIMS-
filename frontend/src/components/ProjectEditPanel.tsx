import { useState } from 'react';
import { api } from '../api';
import { isApiAvailable } from '../apiMode';
import { formField, input, label as labelStyle, primaryBtn, secondaryBtn, sectionCardTitle } from '../ui';
import type { Project } from '../types';
import type { ToastTone } from '../useToastQueue';

const STATUSES = ['On track', 'At risk', 'Delayed', 'Completed'];

/**
 * Updates the things that actually move over a project's life — status, progress,
 * budget utilisation and the headline output. Identity fields (code, pillar) are not
 * editable here: the code is the join key for impact chains, spend and uploads, so
 * changing it would orphan those records.
 */
export function ProjectEditPanel({
  project,
  onUpdated,
  pushToast,
}: {
  project: Project;
  onUpdated: () => void;
  pushToast: (message: string, tone?: ToastTone) => void;
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(project.status);
  const [progPct, setProgPct] = useState(project.progPct.replace('%', ''));
  const [utilPct, setUtilPct] = useState(project.utilPct.replace('%', ''));
  const [budget, setBudget] = useState(project.budget);
  const [output, setOutput] = useState(project.output);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      if (!(await isApiAvailable())) {
        setError('Editing a project needs the server, which this demo build has no connection to.');
        return;
      }
      await api.post('/api/projects/update', { code: project.code, status, progPct, utilPct, budget, output });
      pushToast(`${project.name} updated.`, 'success');
      onUpdated();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'Could not save those changes.');
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={secondaryBtn}>
        Edit project
      </button>
    );
  }

  return (
    <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '22px 24px', marginBottom: 18 }}>
      <div style={sectionCardTitle}>Edit {project.name}</div>
      <div className="form-grid-3" style={{ marginBottom: 14 }}>
        <div style={formField}>
          <label style={labelStyle}>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} style={input}>
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <div style={formField}>
          <label style={labelStyle}>Progress (%)</label>
          <input value={progPct} onChange={(e) => setProgPct(e.target.value)} style={input} />
        </div>
        <div style={formField}>
          <label style={labelStyle}>Budget utilised (%)</label>
          <input value={utilPct} onChange={(e) => setUtilPct(e.target.value)} style={input} />
        </div>
      </div>
      <div className="form-grid-3" style={{ marginBottom: 14 }}>
        <div style={formField}>
          <label style={labelStyle}>Budget</label>
          <input value={budget} onChange={(e) => setBudget(e.target.value)} style={input} />
        </div>
        <div style={{ ...formField, gridColumn: 'span 2' }}>
          <label style={labelStyle}>Headline output</label>
          <input value={output} onChange={(e) => setOutput(e.target.value)} style={input} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={save} disabled={busy} style={{ ...primaryBtn, opacity: busy ? 0.6 : 1 }}>
          {busy ? 'Saving…' : 'Save changes'}
        </button>
        <button onClick={() => setOpen(false)} style={secondaryBtn}>
          Cancel
        </button>
        {error && <div style={{ flex: '1 1 100%', fontSize: 12.5, color: 'var(--accent)' }}>{error}</div>}
      </div>
    </div>
  );
}
