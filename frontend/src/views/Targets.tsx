import { useRef, useState } from 'react';
import { Icon } from '../components/Icon';
import { formField, h1, input, label, primaryBtn, secondaryBtn, subtitle } from '../ui';
import type { Department, NewTargetInput, Target } from '../types';

const UNIT_OPTIONS: { key: Target['unit']; label: string }[] = [
  { key: 'people', label: 'People' },
  { key: 'naira', label: 'Naira (₦)' },
  { key: 'percent', label: 'Percent (%)' },
  { key: 'communities', label: 'Communities' },
];

function formatValue(n: number, unit: Target['unit']): string {
  if (unit === 'naira') {
    if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(2)}B`;
    if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(0)}M`;
    return `₦${n.toLocaleString()}`;
  }
  if (unit === 'percent') return `${n}%`;
  return n.toLocaleString();
}

function unitSuffix(unit: Target['unit']): string {
  return unit === 'people' ? ' people' : unit === 'communities' ? ' communities' : '';
}

export function Targets({
  targets,
  departments,
  onAdd,
  onClose,
  pushToast,
}: {
  targets: Target[];
  departments: Department[];
  onAdd: (input: NewTargetInput) => void;
  onClose: (id: string) => void;
  pushToast: (message: string, tone?: 'success' | 'info' | 'warning') => void;
}) {
  const [formOpen, setFormOpen] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const metricRef = useRef<HTMLInputElement>(null);
  const unitRef = useRef<HTMLSelectElement>(null);
  const periodRef = useRef<HTMLInputElement>(null);
  const totalRef = useRef<HTMLInputElement>(null);
  const currentRef = useRef<HTMLInputElement>(null);
  const allocRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const deptName = (id: string) => departments.find((d) => d.id === id)?.name ?? id;

  const submit = () => {
    const name = nameRef.current?.value.trim();
    const total = Number(totalRef.current?.value ?? 0);
    if (!name || !total) {
      pushToast('Give the target a name and a total value before saving.', 'warning');
      return;
    }
    const allocations = departments
      .map((d) => ({ departmentId: d.id, allocated: Number(allocRefs.current[d.id]?.value ?? 0) }))
      .filter((a) => a.allocated > 0);

    onAdd({
      name,
      metric: metricRef.current?.value.trim() || name,
      unit: (unitRef.current?.value as Target['unit']) ?? 'people',
      periodLabel: periodRef.current?.value.trim() || 'FY2027',
      totalTarget: total,
      currentValue: Number(currentRef.current?.value ?? 0),
      allocations,
    });

    if (nameRef.current) nameRef.current.value = '';
    if (metricRef.current) metricRef.current.value = '';
    if (totalRef.current) totalRef.current.value = '';
    if (currentRef.current) currentRef.current.value = '';
    allocRefs.current = {};
    setFormOpen(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 22, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={h1}>Targets</h1>
          <p style={subtitle}>Configure targets for a year or period and allocate them across the departments accountable for hitting them.</p>
        </div>
        <button onClick={() => setFormOpen((o) => !o)} style={{ ...primaryBtn, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="plus" size={16} strokeWidth={2.4} />
          Set new target
        </button>
      </div>

      {formOpen && (
        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '22px 24px', marginBottom: 22 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 16 }}>New target</div>
          <div className="form-grid-3" style={{ marginBottom: 16 }}>
            <div style={formField}>
              <label style={label}>Target name</label>
              <input ref={nameRef} placeholder="e.g. Beneficiaries Reached" style={input} />
            </div>
            <div style={formField}>
              <label style={label}>Metric description</label>
              <input ref={metricRef} placeholder="e.g. People reached across all programmes" style={input} />
            </div>
            <div style={formField}>
              <label style={label}>Period</label>
              <input ref={periodRef} placeholder="e.g. FY2027" style={input} />
            </div>
            <div style={formField}>
              <label style={label}>Unit</label>
              <select ref={unitRef} style={input} defaultValue="people">
                {UNIT_OPTIONS.map((u) => (
                  <option key={u.key} value={u.key}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
            <div style={formField}>
              <label style={label}>Total target</label>
              <input ref={totalRef} type="number" placeholder="e.g. 400000" style={input} />
            </div>
            <div style={formField}>
              <label style={label}>Current progress (optional)</label>
              <input ref={currentRef} type="number" placeholder="e.g. 0" style={input} />
            </div>
          </div>

          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--navy)', marginBottom: 10 }}>Allocate across departments (optional)</div>
          <div className="form-grid-3" style={{ marginBottom: 18 }}>
            {departments.map((d) => (
              <div key={d.id} style={formField}>
                <label style={label}>{d.name}</label>
                <input ref={(el) => { allocRefs.current[d.id] = el; }} type="number" placeholder="0" style={input} />
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button onClick={() => setFormOpen(false)} style={secondaryBtn}>
              Cancel
            </button>
            <button onClick={submit} style={primaryBtn}>
              Set target →
            </button>
          </div>
        </div>
      )}

      <div className="grid-2" style={{ gap: 18 }}>
        {targets.map((t) => {
          const pct = t.totalTarget > 0 ? Math.min(100, Math.round((t.currentValue / t.totalTarget) * 100)) : 0;
          const allocSum = t.allocations.reduce((s, a) => s + a.allocated, 0);
          return (
            <div key={t.id} style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '22px 24px', opacity: t.status === 'Closed' ? 0.6 : 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, gap: 12 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)' }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{t.periodLabel} · {t.metric}</div>
                </div>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    padding: '4px 10px',
                    borderRadius: 6,
                    background: t.status === 'Active' ? 'rgba(31,138,91,0.14)' : 'rgba(138,141,166,0.18)',
                    color: t.status === 'Active' ? '#1F8A5B' : '#6B6E88',
                    flexShrink: 0,
                  }}
                >
                  {t.status}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '14px 0 6px' }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent)' }}>{formatValue(t.currentValue, t.unit)}{unitSuffix(t.unit)}</span>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>of {formatValue(t.totalTarget, t.unit)}{unitSuffix(t.unit)} target</span>
              </div>
              <span style={{ display: 'block', height: 8, width: '100%', background: 'var(--bg)', borderRadius: 4, overflow: 'hidden', marginBottom: 6 }}>
                <span style={{ display: 'block', height: '100%', width: `${pct}%`, background: 'var(--accent)' }} />
              </span>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>{pct}% of the way to target</div>

              {t.allocations.length > 0 && (
                <div style={{ paddingTop: 14, borderTop: '1px solid var(--line)' }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                    Allocated by department
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {t.allocations.map((a) => {
                      const share = allocSum > 0 ? Math.round((a.allocated / allocSum) * 100) : 0;
                      return (
                        <div key={a.departmentId}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
                            <span style={{ color: 'var(--ink)' }}>{deptName(a.departmentId)}</span>
                            <span style={{ fontWeight: 600, color: 'var(--navy)' }}>{formatValue(a.allocated, t.unit)}{unitSuffix(t.unit)}</span>
                          </div>
                          <span style={{ display: 'block', height: 5, width: '100%', background: 'var(--bg)', borderRadius: 3, overflow: 'hidden' }}>
                            <span style={{ display: 'block', height: '100%', width: `${share}%`, background: '#2B4C9B' }} />
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {t.status === 'Active' && (
                <div style={{ marginTop: 16, textAlign: 'right' }}>
                  <button
                    onClick={() => onClose(t.id)}
                    style={{ fontFamily: 'inherit', fontSize: 12, fontWeight: 600, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                  >
                    Close target
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
