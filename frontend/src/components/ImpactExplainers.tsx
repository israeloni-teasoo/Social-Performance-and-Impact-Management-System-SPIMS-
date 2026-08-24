import { InfoTip } from './Tooltip';
import type { ProjectImpact } from '../types';

export function ProvenanceTip() {
  return (
    <InfoTip label="Where does this data come from?" width={300}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div>
          <strong style={{ color: '#2B4C9B' }}>Inputs &amp; Activities</strong> — entered by the field officer or project manager when the project is set up.
        </div>
        <div>
          <strong style={{ color: 'var(--navy)' }}>Outputs</strong> — aggregated automatically from approved field activity logs.
        </div>
        <div>
          <strong style={{ color: 'var(--accent)' }}>Outcomes &amp; Impact</strong> — calculated by applying the stated methodology to those outputs, not a live sensor feed.
        </div>
        <div style={{ color: '#8A5A0B' }}>⚠ Figures are Phase 1 illustrative placeholders pending confirmed field data.</div>
      </div>
    </InfoTip>
  );
}

export function MethodologyTip({ impact }: { impact: ProjectImpact }) {
  return (
    <InfoTip label="How this impact figure was calculated" width={340}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div>
          <span style={{ color: 'var(--muted)', fontWeight: 600 }}>Metric: </span>
          {impact.methodology.metric}
        </div>
        <div>
          <span style={{ color: 'var(--muted)', fontWeight: 600 }}>Calculation: </span>
          {impact.methodology.calculation}
        </div>
        <div>
          <span style={{ color: 'var(--muted)', fontWeight: 600 }}>Source: </span>
          {impact.methodology.source}
        </div>
        <div style={{ color: '#8A5A0B' }}>⚠ {impact.methodology.note}</div>

        {impact.impactScenarios && impact.impactScenarios.length > 0 && (
          <div style={{ marginTop: 4, paddingTop: 8, borderTop: '1px solid var(--line)' }}>
            {impact.impactScenarioBasis && <div style={{ color: 'var(--muted)', marginBottom: 6 }}>{impact.impactScenarioBasis}</div>}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', fontWeight: 700, paddingBottom: 4 }}>Horizon</th>
                  <th style={{ textAlign: 'left', fontWeight: 700, paddingBottom: 4 }}>Conservative</th>
                  <th style={{ textAlign: 'left', fontWeight: 700, paddingBottom: 4 }}>High-impact</th>
                </tr>
              </thead>
              <tbody>
                {impact.impactScenarios.map((s) => (
                  <tr key={s.horizon}>
                    <td style={{ padding: '3px 0', fontWeight: 600 }}>{s.horizon}</td>
                    <td style={{ padding: '3px 0' }}>{s.conservative}</td>
                    <td style={{ padding: '3px 0', fontWeight: 700, color: 'var(--accent)' }}>{s.highImpact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </InfoTip>
  );
}
