import { useRef, useState } from 'react';
import { Icon } from '../components/Icon';
import { formField, h1, input, label, primaryBtn, pill, secondaryBtn, STAKEHOLDER_STATUS_COLORS, subtitle, tableHeaderRow, tableRow } from '../ui';
import type { NewStakeholderInput } from '../useStakeholdersStore';
import type { Stakeholder } from '../types';

const STAKEHOLDER_TYPES = [
  'Community institution',
  'Government agency',
  'Implementing NGO',
  "Women's group",
  'Youth group',
  'Traditional institution',
  'Development partner',
  'Other',
];

export function StakeholderRegister({ stakeholders, onAdd }: { stakeholders: Stakeholder[]; onAdd: (input: NewStakeholderInput) => void }) {
  const [formOpen, setFormOpen] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const typeRef = useRef<HTMLSelectElement>(null);
  const communityRef = useRef<HTMLInputElement>(null);

  const submit = () => {
    if (!nameRef.current?.value.trim()) return;
    onAdd({
      name: nameRef.current.value,
      type: typeRef.current?.value ?? 'Other',
      community: communityRef.current?.value ?? '',
    });
    if (nameRef.current) nameRef.current.value = '';
    if (communityRef.current) communityRef.current.value = '';
    setFormOpen(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 22, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={h1}>Stakeholder Register</h1>
          <p style={subtitle}>Government, community, NGO and traditional stakeholders — engagements, commitments and status.</p>
        </div>
        <button onClick={() => setFormOpen((o) => !o)} style={{ ...primaryBtn, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="plus" size={16} strokeWidth={2.4} />
          Add stakeholder
        </button>
      </div>

      {formOpen && (
        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '22px 24px', marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 16 }}>New stakeholder</div>
          <div className="form-grid-3" style={{ marginBottom: 16 }}>
            <div style={formField}>
              <label style={label}>Name</label>
              <input ref={nameRef} placeholder="e.g. Sapele Fishermen's Association" style={input} />
            </div>
            <div style={formField}>
              <label style={label}>Type</label>
              <select ref={typeRef} style={input} defaultValue="Community institution">
                {STAKEHOLDER_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div style={formField}>
              <label style={label}>Community</label>
              <input ref={communityRef} placeholder="e.g. Sapele, Delta" style={input} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button onClick={() => setFormOpen(false)} style={secondaryBtn}>
              Cancel
            </button>
            <button onClick={submit} style={primaryBtn}>
              Add to register →
            </button>
          </div>
        </div>
      )}

      <div className="table-scroll">
        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, overflow: 'hidden', minWidth: 820 }}>
          <div style={{ ...tableHeaderRow, display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.3fr 0.9fr 1fr 0.9fr' }}>
            <span>Stakeholder</span>
            <span>Type</span>
            <span>Community</span>
            <span>Engagements</span>
            <span>Commitments</span>
            <span>Status</span>
          </div>
          {stakeholders.map((s) => {
            const [stBg, stFg] = STAKEHOLDER_STATUS_COLORS[s.status] ?? ['#eee', '#555'];
            return (
              <div key={s.id} className="rowh" style={{ ...tableRow, display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.3fr 0.9fr 1fr 0.9fr' }}>
                <span style={{ fontWeight: 600, color: 'var(--navy)' }}>{s.name}</span>
                <span style={{ color: 'var(--ink)' }}>{s.type}</span>
                <span style={{ color: 'var(--ink)' }}>{s.community}</span>
                <span style={{ fontWeight: 700, color: 'var(--navy)' }}>{s.engagements}</span>
                <span style={{ color: 'var(--ink)' }}>{s.commitments}</span>
                <span>
                  <span style={pill(stBg, stFg)}>{s.status}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
