import { useState } from 'react';
import { CompletenessPanel } from '../components/CompletenessPanel';
import { CustomFieldsPanel } from '../components/CustomFieldsPanel';
import { ProjectEditPanel } from '../components/ProjectEditPanel';
import { ImpactStageCard as StageCard } from '../components/ImpactStageCard';
import { ProvenanceTip } from '../components/ImpactExplainers';
import { ImpactPanel } from '../components/ImpactPanel';
import { ReachPanel, ReachVsImpactTip } from '../components/ReachPanel';
import { InfoTip } from '../components/Tooltip';
import { barWidth, formatCount, percentLabel, utilisedCaption } from '../analytics/metrics';
import { isSroiEstimate, projectionFor, sroiForProject } from '../analytics/sroi';
import type { SroiResult } from '../analytics/sroi';
import { exportProjectReport } from '../reportExport';
import { buildProgrammeSpec } from '../report/buildSpec';
import { downloadDesignedReport, generatedOnLabel, slugForFile } from '../report/download';
import { h1, PILLAR_COLORS, pill, primaryBtn, STATUS_COLORS } from '../ui';
import type { CustomField, NewCustomFieldInput, OrgSettings, Project, ProjectImpact } from '../types';
import type { ToastTone } from '../useToastQueue';

const FORMATS: { key: 'pdf' | 'powerpoint' | 'excel' | 'word'; label: string }[] = [
  { key: 'pdf', label: 'PDF' },
  { key: 'powerpoint', label: 'PowerPoint' },
  { key: 'excel', label: 'Excel' },
  { key: 'word', label: 'Word' },
];

/**
 * The whole SROI working, in the tooltip on the card.
 *
 * The ratio is an estimate built on an assumption nobody has validated, so the only
 * responsible way to show it is to show what it was built from: the proxy, where the
 * proxy came from, each deduction, and the arithmetic as a sentence. A reader who
 * disagrees should be able to say which number they disagree with.
 */
function SroiTip({ estimate, confirmed }: { estimate: SroiResult; confirmed: string }) {
  if (confirmed) {
    return (
      <InfoTip label="How this SROI was arrived at" width={320}>
        <div>Confirmed figure, recorded against this project. It replaces the system’s own estimate.</div>
      </InfoTip>
    );
  }
  if (!isSroiEstimate(estimate)) {
    return (
      <InfoTip label="Why there is no SROI" width={320}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>Social value created ÷ amount invested. It needs three things: what was spent, how many people were served, and a value for a year of the outcome.</div>
          <div>This project has {estimate.missing}.</div>
        </div>
      </InfoTip>
    );
  }
  const pct = (n: number) => `${Math.round(n * 100)}%`;
  return (
    <InfoTip label="How this SROI was calculated" width={360}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        <div>
          <strong>Method.</strong> Social Value International’s: value the outcome with a financial proxy, deduct what would
          have happened anyway and what belongs to others, decay it each year, and discount future years to today’s money.
          Divide by what was spent.
        </div>
        <div>
          <strong>Proxy.</strong> ₦{estimate.proxy.annualValueNgn.toLocaleString('en-NG')} a year per person — {estimate.proxy.basis.toLowerCase()},
          counted for {estimate.proxy.durationYears} year{estimate.proxy.durationYears === 1 ? '' : 's'}.
        </div>
        <div>
          <strong>Deductions.</strong> {pct(estimate.assumptions.deadweight)} deadweight, {pct(estimate.assumptions.attribution)} attribution,
          {' '}{pct(estimate.assumptions.dropOff)} drop-off a year, discounted at {(estimate.assumptions.discountRate * 100).toFixed(1)}%.
        </div>
        <div>
          <strong>Working.</strong> {estimate.calculation} Present value ₦{Math.round(estimate.presentValueNgn).toLocaleString('en-NG')}.
        </div>
        <div>
          <strong>Range.</strong> ₦{estimate.low.toFixed(2)}–₦{estimate.high.toFixed(2)} if the proxy is out by
          {' '}{pct(estimate.assumptions.proxyUncertainty)} either way.
        </div>
        <div style={{ color: '#8A5A0B' }}>⚠ {estimate.caveat}</div>
        <div style={{ color: 'var(--muted)' }}>Source of the proxy: {estimate.proxy.source}</div>
      </div>
    </InfoTip>
  );
}

/**
 * A summary figure, shown as the silence it is when nothing was recorded.
 *
 * `{impact?.sroi ?? '—'}` was not enough. SROI and cost per outcome arrive from a
 * completion upload as an empty string — deliberately, because an SROI needs a financial
 * proxy nobody has validated — and an empty string is not nullish, so `??` never fired
 * and the card rendered a blank space under its heading. A reader cannot tell that from
 * a figure that failed to load.
 */
function Figure({
  value,
  fallback,
  size = 26,
  color = 'var(--navy)',
}: {
  value: string | undefined;
  fallback: string;
  size?: number;
  color?: string;
}) {
  const present = (value ?? '').trim() !== '';
  return (
    <div
      style={{
        fontSize: present ? size : 13.5,
        fontWeight: present ? 800 : 600,
        color: present ? color : 'var(--muted)',
        lineHeight: 1.3,
        marginTop: present ? 0 : 4,
      }}
    >
      {present ? value : fallback}
    </div>
  );
}

export function ProjectDetail({
  project,
  impact,
  customFields,
  org,
  canEditFields,
  canEditProject,
  onProjectUpdated,
  onAddField,
  onUpdateField,
  onRemoveField,
  goBack,
  pushToast,
}: {
  project: Project;
  impact: ProjectImpact | undefined;
  customFields: CustomField[];
  org: OrgSettings;
  canEditFields: boolean;
  canEditProject: boolean;
  onProjectUpdated: () => void;
  onAddField: (input: NewCustomFieldInput) => void;
  onUpdateField: (id: string, answer: string, source: string) => void;
  onRemoveField: (id: string) => void;
  goBack: () => void;
  pushToast: (message: string, tone?: ToastTone) => void;
}) {
  const [pillarBg, pillarFg] = PILLAR_COLORS[project.pillar] ?? ['#eee', '#555'];
  const [statusBg, statusFg] = STATUS_COLORS[project.status] ?? ['#eee', '#555'];
  const [formatOpen, setFormatOpen] = useState(false);

  /** Charted only when at least one point carries a percentage worth a bar height. */
  const charted = (impact?.baseline ?? []).some((b) => b.pct > 0);
  const manager = (impact?.contactPerson ?? '').trim();
  const communities = (impact?.communitiesImpacted ?? []).join(' · ').trim();
  /** Calculated here, never stored: a stored ratio would survive a change of method. */
  const sroi = sroiForProject(project, impact);
  /** A ratio Seplat's M&E function has confirmed takes precedence over the estimate. */
  const confirmedSroi = (impact?.sroi ?? '').trim();

  const handleFormat = async (format: (typeof FORMATS)[number]['key']) => {
    setFormatOpen(false);

    // A programme report is a report like any other: same specification, same
    // renderers, same design. It used to have an exporter of its own that wrote a
    // single page of ASCII and turned every naira sign into "NGN ".
    if (format === 'pdf' || format === 'powerpoint') {
      const spec = buildProgrammeSpec({
        project,
        impact,
        customFields,
        org,
        fy: org.financialYear,
        generatedOn: generatedOnLabel(),
      });
      // Reconciled against this programme's own figures — the only ones it quotes.
      await downloadDesignedReport({
        spec,
        format,
        base: slugForFile(`${project.code}-${project.name}`),
        projects: [project],
        impacts: impact ? { [project.code]: impact } : {},
        notify: pushToast,
      });
      return;
    }

    const filename = exportProjectReport(project, impact, format, customFields);
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
          <p style={{ fontSize: 14.5, color: 'var(--muted)', margin: 0, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span>{project.state} · {project.output}</span>
            {impact?.reach && (
              <>
                <span>
                  · {formatCount(impact.reach.total)} reached · {formatCount(impact.reach.directBeneficiaries)} served
                </span>
                <ReachVsImpactTip />
              </>
            )}
          </p>
        </div>
        <div style={{ position: 'relative' }}>
          {formatOpen ? (
            <div style={{ display: 'flex', gap: 8 }}>
              {FORMATS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => { void handleFormat(f.key); }}
                  style={{ fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, color: 'var(--navy)', background: '#fff', border: '1px solid var(--line)', borderRadius: 8, padding: '8px 14px', cursor: 'pointer' }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {canEditProject && <ProjectEditPanel project={project} onUpdated={onProjectUpdated} pushToast={pushToast} />}
              <button onClick={() => setFormatOpen(true)} style={primaryBtn}>
                Download project report →
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 22 }}>
        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '20px 22px' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Budget · utilised</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--navy)' }}>{project.budget}</div>
          <span style={{ display: 'block', height: 6, width: '100%', background: 'var(--bg)', borderRadius: 4, overflow: 'hidden', marginTop: 8 }}>
            <span style={{ display: 'block', height: '100%', width: barWidth(project.utilPct), background: '#2B4C9B' }} />
          </span>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{utilisedCaption(project.utilPct)}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '20px 22px' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Progress</div>
          <Figure value={percentLabel(project.progress, '')} fallback="Not set — enter it under Edit project" color="var(--accent)" />
          <span style={{ display: 'block', height: 6, width: '100%', background: 'var(--bg)', borderRadius: 4, overflow: 'hidden', marginTop: 8 }}>
            <span style={{ display: 'block', height: '100%', width: barWidth(project.progPct), background: 'var(--accent)' }} />
          </span>
        </div>
        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {confirmedSroi ? 'SROI' : 'Est. SROI'}
            <SroiTip estimate={sroi} confirmed={confirmedSroi} />
          </div>
          {confirmedSroi ? (
            <Figure value={confirmedSroi} fallback="" />
          ) : isSroiEstimate(sroi) ? (
            <>
              <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--navy)', lineHeight: 1.2 }}>{sroi.display}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                of social value · range ₦{sroi.low.toFixed(2)}–₦{sroi.high.toFixed(2)}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#8A5A0B', marginTop: 6, letterSpacing: '0.04em' }}>ILLUSTRATIVE</div>
            </>
          ) : (
            <Figure value="" fallback={`Not calculated — ${sroi?.ratio === null ? sroi.missing : 'nothing recorded to calculate from'}`} />
          )}
        </div>
        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '20px 22px' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Cost per outcome</div>
          <Figure value={impact?.costPerOutcome} fallback="Not calculated — needs recorded spend and a count of people served" size={18} />
        </div>
      </div>

      <CompletenessPanel project={project} impact={impact} />

      {impact ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--navy)' }}>Impact chain</div>
            <ProvenanceTip />
          </div>
          <div className="grid-impact-cols" style={{ marginBottom: 18 }}>
            <StageCard index="01" label="Inputs" title="What we invest" detail={impact.inputs} variant="plain" badge="Entered by team" />
            <StageCard index="02" label="Activities" title="What we do" detail={impact.activities} variant="plain" badge="Entered by team" />
            <StageCard index="03" label="Outputs" title="What we deliver" detail={impact.outputHeadline} variant="navyFill" badge="System-aggregated" />
            <StageCard index="04" label="Outcomes" title="What changes" detail={impact.outcome} variant="accentBorder" badge="Calculated" />
          </div>

          <ReachPanel reach={impact.reach} />

          <ImpactPanel impact={impact} projection={isSroiEstimate(sroi) ? projectionFor(sroi) : undefined} />

          <CustomFieldsPanel
            projectCode={project.code}
            fields={customFields}
            canEdit={canEditFields}
            onAdd={onAddField}
            onUpdate={onUpdateField}
            onRemove={onRemoveField}
          />

          <div className="grid-impact-lower">
            <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '22px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 18 }}>
                {charted ? 'Progress breakdown' : 'What was measured'}
                {charted && (
                  <InfoTip label="What this chart shows" width={280}>
                    Each bar is a milestone or comparison point for this specific project — sometimes a time series (e.g. quarterly figures), sometimes a breakdown by site or cohort. The caption below the chart states exactly what's being compared.
                  </InfoTip>
                )}
              </div>
              {impact.baseline.length === 0 ? (
                <div style={{ fontSize: 13.5, color: 'var(--muted)' }}>No before-and-after measure has been recorded for this project yet.</div>
              ) : charted ? (
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
              ) : (
                /* Written measures, written out. Charting them would mean inventing a bar
                   height from prose: a measure like "0% mortality" is a good result that
                   reads as zero progress, and two floor-height bars say less than the
                   sentences do. */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {impact.baseline.map((b, i) => (
                    <div key={b.label}>
                      <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{b.label}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: i === impact.baseline.length - 1 ? 'var(--accent)' : 'var(--navy)', lineHeight: 1.45 }}>
                        {b.value.trim() || 'Not recorded'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {impact.baselineCaption && <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 12 }}>{impact.baselineCaption}</div>}
            </div>
            <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '22px 24px' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 16 }}>Dual-lens tags on this project</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18 }}>
                {impact.dualLens.length === 0 && (
                  <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
                    No local, global or SDG indicator has been mapped to this project yet. Mapping is done against the indicator library under Help.
                  </div>
                )}
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
                <div style={{ fontSize: 14, fontWeight: 600, color: manager ? 'var(--navy)' : 'var(--muted)', marginBottom: 12 }}>
                  {manager || 'Not recorded'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Communities impacted</div>
                <div style={{ fontSize: 13.5, color: communities ? 'var(--ink)' : 'var(--muted)' }}>{communities || 'Not recorded'}</div>
                {/* The completion template asks what the team learned, the database stores
                    it and the API serves it — and until now no screen showed it. It is
                    often the most useful thing a finished project produces. */}
                {impact.lessons && (
                  <>
                    <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '14px 0 6px' }}>
                      What the team learned
                    </div>
                    <div style={{ fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.55 }}>{impact.lessons}</div>
                  </>
                )}
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
