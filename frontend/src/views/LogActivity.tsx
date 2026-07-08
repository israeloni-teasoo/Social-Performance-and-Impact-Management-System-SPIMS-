import { useRef, useState } from 'react';
import { Icon } from '../components/Icon';
import { formField, h1, input, primaryBtn, subtitle } from '../ui';
import type { ToastTone } from '../useToastQueue';

const ACTIVITY_TYPES = [
  'Training / workshop',
  'Community meeting',
  'Site visit',
  'Public consultation',
  'Awareness campaign',
  'M&E monitoring visit',
  'Distribution / handover',
];

export function LogActivity({ goMyTasks, pushToast }: { goMyTasks: () => void; pushToast: (message: string, tone?: ToastTone) => void }) {
  const [activityType, setActivityType] = useState('Training / workshop');
  const [photoCount, setPhotoCount] = useState(2);
  const [docCount, setDocCount] = useState(1);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const handleSaveOffline = () => {
    pushToast('Activity saved offline — it will sync automatically when you regain signal.', 'info');
  };

  const handleSubmit = () => {
    pushToast('Activity logged and submitted for manager approval.', 'success');
    goMyTasks();
  };

  return (
    <div style={{ maxWidth: 780, margin: '0 auto' }}>
      <h1 style={h1}>Log Activity</h1>
      <p style={subtitle}>Record what happened on the ground — activity, people reached and evidence, in one pass.</p>

      <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '26px 28px' }}>
        <div style={{ ...formField, marginBottom: 20 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>Project</label>
          <select style={{ ...input, fontSize: 16, padding: '15px 16px', borderRadius: 12 }} defaultValue="STEP · Seplat Teachers Empowerment — Sapele">
            <option>STEP · Seplat Teachers Empowerment — Sapele</option>
            <option>Eye Can See — Oben</option>
            <option>YEP — Orogun</option>
          </select>
        </div>

        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)', display: 'block', marginBottom: 10 }}>Activity type</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginBottom: 22 }}>
          {ACTIVITY_TYPES.map((at) => {
            const active = activityType === at;
            return (
              <button
                key={at}
                onClick={() => setActivityType(at)}
                style={{
                  fontFamily: 'inherit',
                  fontSize: 13.5,
                  fontWeight: 500,
                  padding: '11px 16px',
                  borderRadius: 11,
                  border: active ? '1px solid var(--accent)' : '1px solid var(--line)',
                  background: active ? 'rgba(227,26,56,0.08)' : '#fbfbfd',
                  color: active ? 'var(--accent)' : 'var(--ink)',
                  cursor: 'pointer',
                }}
              >
                {at}
              </button>
            );
          })}
        </div>

        <div className="form-grid-2" style={{ marginBottom: 22 }}>
          <div style={formField}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>Date</label>
            <input defaultValue="2026-07-06" style={{ ...input, fontSize: 16, padding: '15px 16px', borderRadius: 12 }} />
          </div>
          <div style={formField}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>Location (auto-GPS)</label>
            <input
              defaultValue="Sapele — 5.8904, 5.6767"
              style={{ ...input, fontFamily: 'monospace', fontSize: 14, padding: '15px 16px', borderRadius: 12, background: '#f1f1f6', color: 'var(--muted)' }}
            />
          </div>
        </div>

        <div style={{ background: '#fbfbfd', border: '1px solid var(--line)', borderRadius: 14, padding: '20px 22px', marginBottom: 22 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', display: 'block', marginBottom: 14 }}>
            Beneficiaries reached <span style={{ fontWeight: 500, color: 'var(--muted)' }}>· disaggregated</span>
          </label>
          <div className="form-grid-5">
            {[
              { label: 'Total', value: '42', color: 'var(--navy)' },
              { label: 'Female', value: '24', color: 'var(--ink)' },
              { label: 'Male', value: '18', color: 'var(--ink)' },
              { label: 'Youth', value: '31', color: 'var(--ink)' },
              { label: 'PWD', value: '1', color: 'var(--ink)' },
            ].map((f) => (
              <div key={f.label} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11.5, color: 'var(--muted)' }}>{f.label}</label>
                <input
                  defaultValue={f.value}
                  style={{ width: '100%', fontFamily: 'inherit', fontSize: 18, fontWeight: 700, textAlign: 'center', padding: '13px 8px', border: '1px solid var(--line)', borderRadius: 11, background: '#fff', color: f.color }}
                />
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...formField, marginBottom: 22 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>Site notes</label>
          <textarea
            rows={3}
            style={{ width: '100%', fontFamily: 'inherit', fontSize: 15, padding: '14px 16px', border: '1px solid var(--line)', borderRadius: 12, background: '#fbfbfd', color: 'var(--ink)', resize: 'vertical' }}
            defaultValue="Full-day literacy methods training delivered at Sapele Grammar School. Strong turnout; two teachers requested follow-up materials."
          />
        </div>

        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)', display: 'block', marginBottom: 10 }}>Evidence</label>
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => {
              const n = e.target.files?.length ?? 0;
              if (n > 0) {
                setPhotoCount((c) => c + n);
                pushToast(`${n} photo${n > 1 ? 's' : ''} attached.`, 'success');
              }
            }}
          />
          <button
            onClick={() => photoInputRef.current?.click()}
            style={{ flex: 1, minWidth: 200, border: '1.5px dashed #C7CADB', borderRadius: 12, padding: 22, textAlign: 'center', color: 'var(--muted)', background: '#fbfbfd', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <Icon name="evidence" size={22} style={{ marginBottom: 6 }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Add photos</div>
            <div style={{ fontSize: 11.5 }}>{photoCount} attached</div>
          </button>
          <input
            ref={docInputRef}
            type="file"
            accept=".pdf,.doc,.docx,image/*"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => {
              const n = e.target.files?.length ?? 0;
              if (n > 0) {
                setDocCount((c) => c + n);
                pushToast(`${n} file${n > 1 ? 's' : ''} attached.`, 'success');
              }
            }}
          />
          <button
            onClick={() => docInputRef.current?.click()}
            style={{ flex: 1, minWidth: 200, border: '1.5px dashed #C7CADB', borderRadius: 12, padding: 22, textAlign: 'center', color: 'var(--muted)', background: '#fbfbfd', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <Icon name="doc" size={22} style={{ marginBottom: 6 }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Attendance sheet</div>
            <div style={{ fontSize: 11.5 }}>{docCount} attached</div>
          </button>
        </div>

        <div className="btn-row-stack">
          <button
            onClick={handleSaveOffline}
            style={{ flex: 1, fontFamily: 'inherit', fontSize: 15, fontWeight: 600, color: 'var(--navy)', background: '#fff', border: '1px solid var(--line)', borderRadius: 12, padding: 15, cursor: 'pointer' }}
          >
            Save offline
          </button>
          <button onClick={handleSubmit} style={{ ...primaryBtn, flex: 1.4, fontSize: 15, borderRadius: 12, padding: 15 }}>
            Save &amp; submit for approval →
          </button>
        </div>
      </div>
    </div>
  );
}
