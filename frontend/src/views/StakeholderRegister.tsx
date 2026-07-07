import { h1, pill, STAKEHOLDER_STATUS_COLORS, subtitle, tableHeaderRow, tableRow } from '../ui';
import type { Stakeholder } from '../types';

export function StakeholderRegister({ stakeholders }: { stakeholders: Stakeholder[] }) {
  return (
    <div>
      <h1 style={h1}>Stakeholder Register</h1>
      <p style={subtitle}>Government, community, NGO and traditional stakeholders — engagements, commitments and status.</p>
      <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, overflow: 'hidden' }}>
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
  );
}
