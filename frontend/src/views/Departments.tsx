import { useRef, useState } from 'react';
import { Icon } from '../components/Icon';
import { formField, h1, input, label, PILLAR_COLORS, pill, primaryBtn, secondaryBtn, subtitle, tableHeaderRow, tableRow } from '../ui';
import type { Department, NewDepartmentInput, Target } from '../types';

const FUNCTION_OPTIONS = ['Education', 'Health', 'Infrastructure', 'Economic Emp.', 'Stakeholder Relations', 'Other'];

const STATUS_COLORS: Record<string, [string, string]> = {
  Active: ['rgba(31,138,91,0.14)', '#1F8A5B'],
  Inactive: ['rgba(138,141,166,0.18)', '#6B6E88'],
};

export function Departments({
  departments,
  targets,
  onAdd,
  onToggleStatus,
}: {
  departments: Department[];
  targets: Target[];
  onAdd: (input: NewDepartmentInput) => void;
  onToggleStatus: (id: string) => void;
}) {
  const [formOpen, setFormOpen] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const functionRef = useRef<HTMLSelectElement>(null);
  const leadRef = useRef<HTMLInputElement>(null);

  const submit = () => {
    if (!nameRef.current?.value.trim()) return;
    onAdd({
      name: nameRef.current.value,
      function: functionRef.current?.value ?? 'Other',
      lead: leadRef.current?.value ?? '',
    });
    if (nameRef.current) nameRef.current.value = '';
    if (leadRef.current) leadRef.current.value = '';
    setFormOpen(false);
  };

  const targetCountFor = (deptId: string) => targets.filter((t) => t.status === 'Active' && t.allocations.some((a) => a.departmentId === deptId)).length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 22, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={h1}>Departments</h1>
          <p style={subtitle}>Onboard and manage the departments and functions that own delivery against SPIMS targets.</p>
        </div>
        <button onClick={() => setFormOpen((o) => !o)} style={{ ...primaryBtn, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="plus" size={16} strokeWidth={2.4} />
          Add department
        </button>
      </div>

      {formOpen && (
        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '22px 24px', marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 16 }}>New department</div>
          <div className="form-grid-3" style={{ marginBottom: 16 }}>
            <div style={formField}>
              <label style={label}>Department name</label>
              <input ref={nameRef} placeholder="e.g. Health & Wellbeing" style={input} />
            </div>
            <div style={formField}>
              <label style={label}>Function</label>
              <select ref={functionRef} style={input} defaultValue="Education">
                {FUNCTION_OPTIONS.map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </div>
            <div style={formField}>
              <label style={label}>Department lead</label>
              <input ref={leadRef} placeholder="e.g. Dr. Chidi Okafor" style={input} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button onClick={() => setFormOpen(false)} style={secondaryBtn}>
              Cancel
            </button>
            <button onClick={submit} style={primaryBtn}>
              Add department →
            </button>
          </div>
        </div>
      )}

      <div className="table-scroll">
        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, overflow: 'hidden', minWidth: 760 }}>
          <div style={{ ...tableHeaderRow, display: 'grid', gridTemplateColumns: '2fr 1.4fr 1.6fr 1fr 1fr 0.9fr' }}>
            <span>Department</span>
            <span>Function</span>
            <span>Lead</span>
            <span>Active targets</span>
            <span>Onboarded</span>
            <span>Status</span>
          </div>
          {departments.map((d) => {
            const [pBg, pFg] = PILLAR_COLORS[d.function] ?? ['rgba(43,76,155,0.1)', '#2B4C9B'];
            const [sBg, sFg] = STATUS_COLORS[d.status];
            return (
              <div key={d.id} className="rowh" style={{ ...tableRow, display: 'grid', gridTemplateColumns: '2fr 1.4fr 1.6fr 1fr 1fr 0.9fr', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, color: 'var(--navy)' }}>{d.name}</span>
                <span>
                  <span style={pill(pBg, pFg)}>{d.function}</span>
                </span>
                <span style={{ color: 'var(--ink)' }}>{d.lead}</span>
                <span style={{ fontWeight: 700, color: 'var(--navy)' }}>{targetCountFor(d.id)}</span>
                <span style={{ color: 'var(--muted)' }}>{d.createdAt}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={pill(sBg, sFg)}>{d.status}</span>
                  <button
                    onClick={() => onToggleStatus(d.id)}
                    style={{ fontFamily: 'inherit', fontSize: 11.5, fontWeight: 600, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                  >
                    {d.status === 'Active' ? 'Deactivate' : 'Reactivate'}
                  </button>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
