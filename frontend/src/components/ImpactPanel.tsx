import { MethodologyTip } from './ImpactExplainers';
import type { ProjectImpact } from '../types';

/** The "05 · Impact — what it means" stage, promoted out of the equal-height stage-card grid so its
 * figures and bullets have room to breathe instead of stretching the other four cards to match. */
export function ImpactPanel({ impact }: { impact: ProjectImpact }) {
  const thisYear = impact.impactScenarios?.[0];

  return (
    <div style={{ background: 'var(--accent)', color: '#fff', borderRadius: 16, padding: '26px 28px', marginBottom: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#FFD2D9' }}>05 · Impact</span>
        <MethodologyTip impact={impact} />
      </div>
      <div style={{ fontSize: 19, fontWeight: 700, marginBottom: 18 }}>What it means</div>

      {thisYear ? (
        <div style={{ display: 'flex', gap: 36, flexWrap: 'wrap', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#FFD2D9', marginBottom: 4 }}>
              Conservative · {thisYear.horizon}
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.1 }}>{thisYear.conservative}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#FFD2D9', marginBottom: 4 }}>
              High-impact · {thisYear.horizon}
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.1 }}>{thisYear.highImpact}</div>
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.1 }}>{impact.impactFigure}</div>
          <div style={{ fontSize: 13, color: '#FFE4E8', marginTop: 4 }}>{impact.impactFigureLabel}</div>
        </div>
      )}

      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#FFD2D9', marginBottom: 10 }}>
        Anticipated outcomes
      </div>
      <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {impact.impactPoints.map((p, i) => (
          <li key={i} style={{ fontSize: 13, lineHeight: 1.45, color: '#FFE4E8' }}>
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}
