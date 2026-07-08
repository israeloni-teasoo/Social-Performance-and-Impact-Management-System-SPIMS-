import { useState } from 'react';
import { ImpactStageCard as StageCard } from '../components/ImpactStageCard';
import { exportProjectReport } from '../reportExport';
import { h1, PILLAR_COLORS, pill, primaryBtn, STATUS_COLORS } from '../ui';
import type { Project, ProjectImpact } from '../types';
import type { ToastTone } from '../useToastQueue';

const FORMATS: { key: 'pdf' | 'excel' | 'word'; label: string }[] = [
  { key: 'pdf', label: 'PDF' },
  { key: 'excel', label: 'Excel' },
  { key: 'word', label: 'Word' },
];

export function ProjectDetail({
  project,
  impact,
  goBack,
  pushToast,
}: {
  project: Project;
  impact: ProjectImpact | undefined;
  goBack: () => void;
  pushToast: (message: string, tone?: ToastTone) => void;
}) {
  const [pillarBg, pillarFg] = PILLAR_COLORS[project.pillar] ?? ['#eee', '#555'];
  const [statusBg, statusFg] = STATUS_COLORS[project.status] ?? ['#eee', '#555'];
  const [formatOpen, setFormatOpen] = useState(false);

  const handleFormat = (format: (typeof FORMATS)[number]['key']) => {
    setFormatOpen(false);
    const filename = exportProjectReport(project, impact, format);
    pushToast(`Downloaded ${filename}.`, 'success');
  };

  return (
    <div>
      <button
        onClick={goBack}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontFamily: 'inherit',
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--muted)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          marginBottom: 14,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Back to portfolio
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
            <span style={pill(pillarBg, pillarFg)}>{project.pillar}</span>
            <span style={pill(statusBg, statusFg)}>{project.status}</span>
            <span style={{ fontFamily: 'monospace', fontSize: 12.5, color: 'var(--muted)' }}>{project.code}</span>
          </div>
          <h1 style={{ ...h1, margin: '0 0 4px' }}>{project.name}</h1>
          <p style={{ fontSize: 14.5, color: 'var(--muted)', margin: 0 }}>{project.state} · {project.output}</p>
        </div>
        <div style={{ position: 'relative' }}>
          {formatOpen ? (
            <div style={{ display: 'flex', gap: 8 }}>
              {FORMATS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => handleFormat(f.key)}
                  style={{ fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, color: 'var(--navy)', background: '#fff', border: '1px solid var(--line)', borderRadius: 8, padding: '8px 14px', cursor: 'pointer' }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          ) : (
            <button onClick={() => setFormatOpen(true)} style={primaryBtn}>
              Download project report →
            </button>
          )}
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 22 }}>
        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '20px 22px' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Budget · utilised</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--navy)' }}>{project.budget}</div>
          <span style={{ display: 'block', height: 6, width: '100%', background: 'var(--bg)', borderRadius: 4, overflow: 'hidden', marginTop: 8 }}>
            <span style={{ display: 'block', height: '100%', width: project.utilPct, background: '#2B4C9B' }} />
          </span>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{project.utilPct} utilised</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '20px 22px' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Progress</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--accent)' }}>{project.progress}</div>
          <span style={{ display: 'block', height: 6, width: '100%', background: 'var(--bg)', borderRadius: 4, overflow: 'hidden', marginTop: 8 }}>
            <span style={{ display: 'block', height: '100%', width: project.progPct, background: 'var(--accent)' }} />
          </span>
        </div>
        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '20px 22px' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Est. SROI</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--navy)' }}>{impact?.sroi ?? '—'}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '20px 22px' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Cost per outcome</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy)', lineHeight: 1.3 }}>{impact?.costPerOutcome ?? '—'}</div>
        </div>
      </div>

      {impact ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--navy)' }}>Impact chain</div>
            <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>Where does this data come from?</span>
          </div>
          <div
            style={{
              display: 'flex',
              gap: 18,
              flexWrap: 'wrap',
              fontSize: 12,
              color: 'var(--ink)',
              background: '#fbfbfd',
              border: '1px solid var(--line)',
              borderRadius: 12,
              padding: '12px 16px',
              marginBottom: 14,
            }}
          >
            <span><strong style={{ color: '#2B4C9B' }}>Inputs &amp; Activities</strong> — entered by the field officer / project manager when the project is set up.</span>
            <span><strong style={{ color: 'var(--navy)' }}>Outputs</strong> — aggregated automatically from approved field activity logs (Log Activity → manager approval).</span>
            <span><strong style={{ color: 'var(--accent)' }}>Outcomes &amp; Impact</strong> — calculated by applying the stated methodology below to those outputs; not a live sensor feed.</span>
            <span>⚠ All figures shown are Phase 1 illustrative placeholders pending confirmed field data from Seplat's M&amp;E team — see note below.</span>
          </div>
          <div className="grid-impact-cols" style={{ marginBottom: 22 }}>
            <StageCard index="01" label="Inputs" title="What we invest" detail={impact.inputs} variant="plain" badge="Entered by team" />
            <StageCard index="02" label="Activities" title="What we do" detail={impact.activities} variant="plain" badge="Entered by team" />
            <StageCard index="03" label="Outputs" title="What we deliver" detail={impact.outputHeadline} variant="navyFill" badge="System-aggregated" />
            <StageCard index="04" label="Outcomes" title="What changes" detail={impact.outcome} variant="accentBorder" badge="Calculated" />
            <StageCard index="05" label="Impact" title="What it means" detail={impact.impactDetail} variant="accentFill" badge="Calculated" />
          </div>

          <div
            style={{
              background: '#fbfbfd',
              border: '1px solid var(--line)',
              borderRadius: 16,
              padding: '22px 24px',
              marginBottom: 22,
            }}
          >
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
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 16 }}>Dual-lens tags on this project</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18 }}>
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
              <div style={{ paddingTop: 16, borderTop: '1px solid var(--line)' }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Project manager</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy)', marginBottom: 12 }}>{impact.contactPerson}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Communities impacted</div>
                <div style={{ fontSize: 13.5, color: 'var(--ink)' }}>{impact.communitiesImpacted.join(' · ')}</div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '22px 24px', color: 'var(--muted)', fontSize: 13.5 }}>
          Impact chain data for this project hasn't been mapped yet.
        </div>
      )}
    </div>
  );
}
