import { useRef, useState } from 'react';
import { Icon } from '../components/Icon';
import { formField, h1, input, label, primaryBtn, secondaryBtn, subtitle } from '../ui';
import type { NewTargetInput, Target } from '../types';

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

function formatMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  if (!y || !m) return ym;
  return new Date(y, m - 1, 1).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}

function formatPeriod(start: string, end: string): string {
  const [sy] = start.split('-');
  const [ey] = end.split('-');
  if (sy === ey && start.endsWith('-01') && end.endsWith('-12')) return `FY${sy}`;
  return `${formatMonth(start)} – ${formatMonth(end)}`;
}

export function Targets({
  targets,
  onAdd,
  onClose,
  pushToast,
}: {
  targets: Target[];
  onAdd: (input: NewTargetInput) => void;
  onClose: (id: string) => void;
  pushToast: (message: string, tone?: 'success' | 'info' | 'warning') => void;
}) {
  const [formOpen, setFormOpen] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const metricRef = useRef<HTMLInputElement>(null);
  const unitRef = useRef<HTMLSelectElement>(null);
  const startRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLInputElement>(null);
  const totalRef = useRef<HTMLInputElement>(null);
  const currentRef = useRef<HTMLInputElement>(null);

  const submit = () => {
    const name = nameRef.current?.value.trim();
    const total = Number(totalRef.current?.value ?? 0);
    const start = startRef.current?.value;
    const end = endRef.current?.value;
    if (!name || !total || !start || !end) {
      pushToast('Give the target a name, a total value, and a start and end period before saving.', 'warning');
      return;
    }
    if (end < start) {
      pushToast('The end of the period can’t be before the start.', 'warning');
      return;
    }

    onAdd({
      name,
      metric: metricRef.current?.value.trim() || name,
      unit: (unitRef.current?.value as Target['unit']) ?? 'people',
      periodStart: start,
      periodEnd: end,
      totalTarget: total,
      currentValue: Number(currentRef.current?.value ?? 0),
    });

    if (nameRef.current) nameRef.current.value = '';
    if (metricRef.current) metricRef.current.value = '';
    if (totalRef.current) totalRef.current.value = '';
    if (currentRef.current) currentRef.current.value = '';
    setFormOpen(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 22, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={h1}>Targets</h1>
          <p style={subtitle}>Configure targets for a year or period — some run longer than a single year.</p>
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
              <label style={label}>Period start</label>
              <input ref={startRef} type="month" defaultValue="2026-01" style={input} />
            </div>
            <div style={formField}>
              <label style={label}>Period end</label>
              <input ref={endRef} type="month" defaultValue="2026-12" style={input} />
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
          return (
            <div key={t.id} style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '22px 24px', opacity: t.status === 'Closed' ? 0.6 : 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, gap: 12 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)' }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{formatPeriod(t.periodStart, t.periodEnd)} · {t.metric}</div>
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
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{pct}% of the way to target</div>

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
