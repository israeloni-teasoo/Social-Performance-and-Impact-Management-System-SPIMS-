import { useState } from 'react';
import { MethodologyTip } from './ImpactExplainers';
import { InfoTip } from './Tooltip';
import type { ImpactProjection } from '../analytics/sroi';
import type { ProjectImpact } from '../types';

/** The "05 · Impact — what it means" stage, promoted out of the equal-height stage-card grid so its
 * figures and bullets have room to breathe instead of stretching the other four cards to match. */
export function ImpactPanel({ impact, projection }: { impact: ProjectImpact; projection?: ImpactProjection }) {
  const stored = impact.impactScenarios ?? [];
  // A completion file records what was delivered and what changed, which is true and thin —
  // and impact is what this system exists to show. Where the file carries no projection of
  // its own, the analytics layer supplies one from the project's own figures and a stated
  // proxy, in the form Seplat's published report uses: an assumption, named, with the range
  // it produces beside it. Depth from carrying assumptions through, not from more adjectives.
  const scenarios = stored.length > 0 ? stored : projection?.scenarios ?? [];
  const estimated = stored.length === 0 && (projection?.scenarios.length ?? 0) > 0;
  const basis = stored.length > 0 ? impact.impactScenarioBasis : projection?.basis;
  const [horizonIndex, setHorizonIndex] = useState(0);
  const active = scenarios[horizonIndex];

  return (
    <div style={{ background: 'var(--accent)', color: '#fff', borderRadius: 16, padding: '26px 28px', marginBottom: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#FFD2D9' }}>05 · Impact</span>
          <MethodologyTip impact={impact} />
        </div>
        {scenarios.length > 1 && (
          <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.14)', borderRadius: 9, padding: 3 }}>
            {scenarios.map((s, i) => (
              <button
                key={s.horizon}
                onClick={() => setHorizonIndex(i)}
                style={{
                  fontFamily: 'inherit',
                  fontSize: 11.5,
                  fontWeight: 600,
                  padding: '6px 12px',
                  borderRadius: 7,
                  border: 'none',
                  cursor: 'pointer',
                  background: i === horizonIndex ? '#fff' : 'transparent',
                  color: i === horizonIndex ? 'var(--accent)' : '#fff',
                }}
              >
                {s.horizon}
              </button>
            ))}
          </div>
        )}
      </div>
      <div style={{ fontSize: 19, fontWeight: 700, marginBottom: 18 }}>What it means</div>

      {/* The recorded figure first, because it is the one thing here that was counted
          rather than projected. It used to be replaced by the scenarios rather than
          shown above them, which hid the only verified number in the panel. */}
      {impact.impactFigure.trim() ? (
        <div style={{ marginBottom: scenarios.length > 0 ? 22 : 20 }}>
          <div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.1 }}>{impact.impactFigure}</div>
          <div style={{ fontSize: 13, color: '#FFE4E8', marginTop: 4 }}>{impact.impactFigureLabel}</div>
          {impact.outcome.trim() && (
            <div style={{ fontSize: 14.5, lineHeight: 1.5, marginTop: 10, maxWidth: 640 }}>{impact.outcome}</div>
          )}
        </div>
      ) : (
        <div style={{ fontSize: 14, color: '#FFE4E8', lineHeight: 1.5, marginBottom: 20 }}>
          No counted figure has been recorded for this project yet.
        </div>
      )}

      {active && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.25)', paddingTop: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#FFD2D9' }}>
              What that is worth · {active.horizon}
            </span>
            {estimated && (
              <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', padding: '3px 9px', borderRadius: 6, background: 'rgba(255,255,255,0.18)' }}>
                PROJECTED
              </span>
            )}
            {basis && (
              <InfoTip label="What this projection assumes" width={380}>
                {basis}
              </InfoTip>
            )}
          </div>
          <div style={{ display: 'flex', gap: 36, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#FFD2D9', marginBottom: 4 }}>
                Conservative
              </div>
              <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.1 }}>{active.conservative}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#FFD2D9', marginBottom: 4 }}>
                High-impact
              </div>
              <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.1 }}>{active.highImpact}</div>
            </div>
          </div>
        </div>
      )}

      {/* The heading used to render whatever the list held, including nothing: a
          completion upload records what happened and carries no anticipated outcomes, so
          the panel ended in a label with empty space under it. */}
      {impact.impactPoints.length > 0 && (
        <>
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
        </>
      )}
    </div>
  );
}
