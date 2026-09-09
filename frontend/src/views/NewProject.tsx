import { useState } from 'react';
import { api } from '../api';
import { isApiAvailable } from '../apiMode';
import { InfoTip } from '../components/Tooltip';
import { formField, h1, input, label, primaryBtn, secondaryBtn, sectionCardTitle, subtitle } from '../ui';
import type { Community, NewProjectInput, Project } from '../types';
import type { ToastTone } from '../useToastQueue';

const PILLARS = ['Education', 'Health', 'Infrastructure', 'Economic Emp.'];
const STATES = ['Delta', 'Edo', 'Imo', 'Multi-state'];
const FUNDING = ['PIA HCDT — 3% OpEx', 'Direct CSR budget', 'Partner co-funded', 'Other'];

const EMPTY: NewProjectInput = {
  code: '',
  name: '',
  pillar: 'Education',
  state: 'Delta',
  budget: '',
  output: '',
  status: 'On track',
  progPct: '0',
  utilPct: '0',
  startDate: '',
  endDate: '',
  fundingSource: 'PIA HCDT — 3% OpEx',
  contractor: '',
  partner: '',
  community: '',
  lga: '',
  owner: '',
};

/** Derives a suggested code from the name so the field is rarely typed by hand. */
function suggestCode(name: string): string {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.slice(0, 5))
    .join('-');
}

export function NewProject({
  communities,
  onCreated,
  pushToast,
}: {
  communities: Community[];
  onCreated: (project: Project) => void;
  pushToast: (message: string, tone?: ToastTone) => void;
}) {
  const [form, setForm] = useState<NewProjectInput>(EMPTY);
  const [codeTouched, setCodeTouched] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof NewProjectInput>(key: K, value: NewProjectInput[K]) => setForm((f) => ({ ...f, [key]: value }));

  const setName = (value: string) => {
    setForm((f) => ({ ...f, name: value, code: codeTouched ? f.code : suggestCode(value) }));
  };

  const submit = async () => {
    if (!form.name.trim()) return setError('Enter a project name.');
    if (!form.code.trim()) return setError('Enter a project code — it is the key used across reports and uploads.');
    if (!form.budget.trim()) return setError('Enter a budget.');
    setError('');
    setBusy(true);
    try {
      if (!(await isApiAvailable())) {
        setError('Creating a project needs the server, which this demo build has no connection to.');
        return;
      }
      const created = await api.post<Project>('/api/projects', form);
      pushToast(`${created.name} created.`, 'success');
      setForm(EMPTY);
      setCodeTouched(false);
      onCreated(created);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'Could not create that project.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ maxWidth: 1000 }}>
      <h1 style={h1}>New Project</h1>
      <p style={subtitle}>
        Enter a project once. It is tagged against both local and global indicators, and appears immediately in the portfolio and in
        reports.
      </p>

      <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '24px 26px', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, ...sectionCardTitle }}>
          1 · Project details
          <InfoTip label="About the project code" width={320}>
            The code is the key that ties this project to its impact chain, spend records, bulk uploads and custom fields. It has to
            be unique and cannot be changed afterwards, so keep it short and recognisable — STEP, WATER, YEP.
          </InfoTip>
        </div>
        <div className="form-grid-3" style={{ marginBottom: 14 }}>
          <div style={{ ...formField, gridColumn: 'span 2' }}>
            <label style={label}>Project name</label>
            <input value={form.name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Solar Skills Academy" style={input} />
          </div>
          <div style={formField}>
            <label style={label}>Project code</label>
            <input
              value={form.code}
              onChange={(e) => {
                setCodeTouched(true);
                set('code', e.target.value.toUpperCase());
              }}
              placeholder="e.g. SOLAR"
              style={{ ...input, fontFamily: 'monospace' }}
            />
          </div>
        </div>
        <div className="form-grid-3">
          <div style={formField}>
            <label style={label}>Pillar</label>
            <select value={form.pillar} onChange={(e) => set('pillar', e.target.value)} style={input}>
              {PILLARS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>
          <div style={formField}>
            <label style={label}>State</label>
            <select value={form.state} onChange={(e) => set('state', e.target.value)} style={input}>
              {STATES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div style={formField}>
            <label style={label}>Project owner</label>
            <input value={form.owner} onChange={(e) => set('owner', e.target.value)} placeholder="Who is accountable" style={input} />
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '24px 26px', marginBottom: 18 }}>
        <div style={sectionCardTitle}>2 · Location</div>
        <div className="form-grid-3">
          <div style={formField}>
            <label style={label}>Community</label>
            <select value={form.community} onChange={(e) => set('community', e.target.value)} style={input}>
              <option value="">Not specified</option>
              {communities.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div style={formField}>
            <label style={label}>LGA</label>
            <input value={form.lga} onChange={(e) => set('lga', e.target.value)} placeholder="e.g. Sapele LGA" style={input} />
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '24px 26px', marginBottom: 18 }}>
        <div style={sectionCardTitle}>3 · Timeline, budget and delivery</div>
        <div className="form-grid-3" style={{ marginBottom: 14 }}>
          <div style={formField}>
            <label style={label}>Start date</label>
            <input type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} style={input} />
          </div>
          <div style={formField}>
            <label style={label}>End date</label>
            <input type="date" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} style={input} />
          </div>
          <div style={formField}>
            <label style={label}>Budget</label>
            <input value={form.budget} onChange={(e) => set('budget', e.target.value)} placeholder="e.g. ₦180M" style={input} />
          </div>
        </div>
        <div className="form-grid-3">
          <div style={formField}>
            <label style={label}>Funding source</label>
            <select value={form.fundingSource} onChange={(e) => set('fundingSource', e.target.value)} style={input}>
              {FUNDING.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </div>
          <div style={formField}>
            <label style={label}>Contractor</label>
            <input value={form.contractor} onChange={(e) => set('contractor', e.target.value)} placeholder="Optional" style={input} />
          </div>
          <div style={formField}>
            <label style={label}>Implementing partner</label>
            <input value={form.partner} onChange={(e) => set('partner', e.target.value)} placeholder="Optional" style={input} />
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '24px 26px', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, ...sectionCardTitle }}>
          4 · Current position
          <InfoTip label="Leave these at zero for a new project" width={310}>
            A project being set up before it starts has no outputs and no spend. These are here so an existing project can be
            entered at its true position rather than pretending it starts today.
          </InfoTip>
        </div>
        <div className="form-grid-3">
          <div style={formField}>
            <label style={label}>Status</label>
            <select value={form.status} onChange={(e) => set('status', e.target.value)} style={input}>
              {['On track', 'At risk', 'Delayed', 'Completed'].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div style={formField}>
            <label style={label}>Progress (%)</label>
            <input value={form.progPct} onChange={(e) => set('progPct', e.target.value)} style={input} />
          </div>
          <div style={formField}>
            <label style={label}>Budget utilised (%)</label>
            <input value={form.utilPct} onChange={(e) => set('utilPct', e.target.value)} style={input} />
          </div>
        </div>
        <div style={{ ...formField, marginTop: 14 }}>
          <label style={label}>Headline output so far</label>
          <input
            value={form.output}
            onChange={(e) => set('output', e.target.value)}
            placeholder="e.g. 120 youth trained — leave empty if nothing delivered yet"
            style={input}
          />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <button onClick={submit} disabled={busy} style={{ ...primaryBtn, opacity: busy ? 0.6 : 1 }}>
          {busy ? 'Creating…' : 'Create project →'}
        </button>
        <button onClick={() => { setForm(EMPTY); setCodeTouched(false); setError(''); }} style={secondaryBtn}>
          Clear
        </button>
        {error && <div style={{ flex: '1 1 100%', fontSize: 13, color: 'var(--accent)' }}>{error}</div>}
      </div>
    </div>
  );
}
