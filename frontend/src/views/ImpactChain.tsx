import { useState } from 'react';
import { ImpactStageCard } from '../components/ImpactStageCard';
import { PROJECT_IMPACTS } from '../data/seed';
import { h1 } from '../ui';
import type { Project } from '../types';

const CHIPS = [
  { code: 'STEP', label: 'STEP' },
  { code: 'EYE', label: 'Eye Can See' },
  { code: 'YEP', label: 'YEP' },
  { code: 'PEARL', label: 'PEARLs Quiz' },
];

export function ImpactChain({ projects }: { projects: Project[] }) {
  const [code, setCode] = useState('STEP');
  const impact = PROJECT_IMPACTS[code];
  const project = projects.find((p) => p.code === code);

  return (
    <div>
      <h1 style={h1}>Impact Chain</h1>
      <p style={{ fontSize: 14.5, color: 'var(--muted)', margin: '0 0 20px' }}>
        Trace a programme from what we invest to what it means — and how that final number is actually calculated. Example —{' '}
        <strong style={{ color: 'var(--ink)' }}>{project?.name ?? code}</strong>.
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 22, flexWrap: 'wrap' }}>
        {CHIPS.map((c) => (
          <button
            key={c.code}
            onClick={() => setCode(c.code)}
            style={{
              fontFamily: 'inherit',
              fontSize: 12.5,
              fontWeight: 600,
              padding: '8px 16px',
              borderRadius: 9,
              cursor: 'pointer',
              background: code === c.code ? 'var(--navy)' : '#fff',
              border: code === c.code ? 'none' : '1px solid var(--line)',
              color: code === c.code ? '#fff' : 'var(--ink)',
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {impact && (
        <>
          <div className="grid-impact-cols" style={{ marginBottom: 22 }}>
            <ImpactStageCard index="01" label="Inputs" title="What we invest" detail={impact.inputs} variant="plain" />
            <ImpactStageCard index="02" label="Activities" title="What we do" detail={impact.activities} variant="plain" />
            <ImpactStageCard index="03" label="Outputs" title="What we deliver" detail={impact.outputHeadline} variant="navyFill" badge="Reported today" />
            <ImpactStageCard index="04" label="Outcomes" title="What changes" detail={impact.outcome} variant="accentBorder" />
            <ImpactStageCard index="05" label="Impact" title="What it means" detail={impact.impactDetail} variant="accentFill" badge="Platform adds" />
          </div>

          <div style={{ background: '#fbfbfd', border: '1px solid var(--line)', borderRadius: 16, padding: '22px 24px', marginBottom: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 22 }}>🧮</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)' }}>How this impact figure was calculated</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent)' }}>{impact.impactHeadline}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10, fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.55 }}>
              <div>
                <span style={{ color: 'var(--muted)', fontWeight: 600 }}>Metric used: </span>
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
              <div
                style={{
                  marginTop: 6,
                  padding: '10px 14px',
                  background: 'rgba(192,73,30,0.08)',
                  border: '1px solid rgba(192,73,30,0.2)',
                  borderRadius: 10,
                  color: '#8A5A0B',
                  fontSize: 12.5,
                }}
              >
                ⚠ {impact.methodology.note}
              </div>
            </div>
          </div>

          <div className="grid-impact-lower">
            <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '22px 24px' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 18 }}>Progress over time</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24, height: 150, paddingBottom: 8 }}>
                {impact.baseline.map((b, i) => (
                  <div key={b.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: i === impact.baseline.length - 1 ? 'var(--accent)' : undefined }}>{b.value}</span>
                    <span
                      style={{
                        width: '100%',
                        height: Math.max(20, (b.pct / 100) * 110),
                        background: i === impact.baseline.length - 1 ? 'var(--accent)' : i === 0 ? '#D7DBEA' : '#2B4C9B',
                        borderRadius: '8px 8px 0 0',
                      }}
                    />
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>{b.label}</span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 6 }}>{impact.baselineCaption}</div>
            </div>
            <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '22px 24px' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 16 }}>Dual-lens tags on this programme</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {impact.dualLens.map((row) => {
                  const colors: Record<string, [string, string]> = {
                    Local: ['rgba(43,76,155,0.1)', '#2B4C9B'],
                    Global: ['rgba(227,26,56,0.1)', 'var(--accent)'],
                    SDG: ['rgba(31,138,91,0.12)', '#1F8A5B'],
                  };
                  const [bg, fg] = colors[row.tag];
                  return (
                    <div key={row.tag} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 6, background: bg, color: fg }}>
                        {row.tag}
                      </span>
                      <span style={{ fontSize: 13 }}>{row.text}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Cost per outcome</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy)' }}>{impact.costPerOutcome}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Est. SROI</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)' }}>{impact.sroi}</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
