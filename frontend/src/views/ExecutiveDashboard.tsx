import { ReachVsImpactTip } from '../components/ReachPanel';
import { InfoTip } from '../components/Tooltip';
import { analysePortfolio, formatCompact, formatCount, formatMillions } from '../analytics/metrics';
import { communitiesFor, deliveryFor, demographicsFor, moneyFor, outcomesFor, sroiFor, statesFor } from '../analytics/portfolio';
import { card, PILLAR_COLORS } from '../ui';
import type { MoneySlice } from '../analytics/portfolio';
import type { Project, ProjectImpact, Target } from '../types';

/**
 * The executive dashboard.
 *
 * Every figure on this screen is computed from the programmes in the portfolio. That
 * sounds unremarkable and was not true: the social investment total, the host-community
 * count, the SROI ratio, community satisfaction, the share of the social aspiration
 * achieved, the spend split by pillar and by state, the four "who benefited"
 * percentages, the compliance tally and the high-risk count were all written into this
 * file. None of them moved when a project was added, which makes the first screen an
 * executive opens the worst place in the product for a number nobody can trace.
 *
 * Two of them had no source at all — community satisfaction is measured by nothing in
 * this system, and compliance is checked against nothing. Those are now absent, with the
 * screen saying what would have to be connected, rather than estimated into place.
 */

/** What SPIMS would check compliance against, once something is connected to check. */
const COMPLIANCE_COMMITMENTS = [
  { text: 'PIA host-community trust allocation', needs: 'the trust’s funding position, from finance' },
  { text: 'NCDMB local-content thresholds', needs: 'contractor local-hire data, from procurement' },
  { text: 'IFRS S1 disclosures', needs: 'the sustainability team’s disclosure register' },
  { text: 'GRI 403 occupational health', needs: 'site-level safety audit status' },
  { text: 'SDG mapping of active programmes', needs: 'each programme tagged in the indicator library' },
];

/** One portfolio-level figure in the headline band. */
function HeadlineCard({ value, label, detail }: { value: string; label: string; detail: string }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, padding: '18px 20px' }}>
      <div style={{ fontSize: 34, fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#E4E6F5', marginTop: 4 }}>{label}</div>
      <div style={{ fontSize: 12, color: '#9EA1C0', marginTop: 6, lineHeight: 1.5 }}>{detail}</div>
    </div>
  );
}

function MoneyBars({ rows, title, note }: { rows: MoneySlice[]; title: string; note: string }) {
  if (rows.length === 0) {
    return <div style={{ fontSize: 13, color: 'var(--muted)' }}>No programme carries a budget yet.</div>;
  }
  return (
    <>
      <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {rows.map((row) => (
          <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ width: 130, fontSize: 13.5, fontWeight: 600 }}>{row.label}</span>
            <span style={{ flex: 1, height: 20, background: 'var(--bg)', borderRadius: 6, overflow: 'hidden' }}>
              <span
                style={{
                  display: 'block',
                  height: '100%',
                  width: `${Math.max(row.sharePct, 0.8)}%`,
                  background: PILLAR_COLORS[row.label]?.[1] ?? '#2B4C9B',
                  borderRadius: 6,
                }}
              />
            </span>
            <span style={{ width: 128, fontSize: 13, fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap' }}>
              {formatMillions(row.budgetMillions)} · {row.sharePct}%
            </span>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 12 }}>{note}</div>
    </>
  );
}

export function ExecutiveDashboard({
  targetYear,
  projects,
  impacts,
  targets,
}: {
  targetYear: number;
  projects: Project[];
  impacts: Record<string, ProjectImpact>;
  targets: Target[];
}) {
  const totals = analysePortfolio(projects, impacts);
  const money = moneyFor(projects, impacts);
  const people = demographicsFor(projects, impacts);
  const sroi = sroiFor(projects, impacts);
  const delivery = deliveryFor(projects);
  const communities = communitiesFor(projects, impacts);
  const states = statesFor(projects);
  const outcomes = outcomesFor(projects, impacts);

  // The aspiration figure comes from the targets somebody actually set, as the mean of
  // how far each has run. Targets are measured in different units, so they are averaged
  // as percentages rather than summed — stated below the figure, because an average of
  // percentages is a different claim from a total.
  const active = targets.filter((t) => t.status === 'Active' && t.totalTarget > 0);
  const aspirationPct = active.length === 0
    ? null
    : Math.round(active.reduce((sum, t) => sum + Math.min(t.currentValue / t.totalTarget, 1), 0) / active.length * 100);

  const atAGlance = [
    {
      label: 'Social investment',
      value: formatMillions(money.budgetMillions),
      sub: money.programmesWithRecordedSpend > 0
        ? `${formatMillions(money.spentMillions)} recorded spent · ${money.utilisedPct}% of those programmes’ budgets`
        : `budgeted across ${projects.length} programme${projects.length === 1 ? '' : 's'} · none has recorded spend yet`,
    },
    { label: 'Reach · interactions', value: formatCompact(totals.reach), sub: `${formatCount(totals.reach)} people engaged`, tone: 'reach' as const },
    { label: 'Impact · people served', value: formatCompact(totals.impact), sub: `${formatCount(totals.impact)} · ${totals.conversionPct}% of interactions`, tone: 'impact' as const },
    {
      label: 'Host communities',
      value: String(communities.length),
      sub: communities.length === 0 ? 'none recorded against a programme yet' : communities.slice(0, 3).join(' · ') + (communities.length > 3 ? ' …' : ''),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 6px', color: 'var(--navy)' }}>
          Executive Dashboard
        </h1>
        <p style={{ fontSize: 14.5, color: 'var(--muted)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
          Social investment performance across {projects.length} programme{projects.length === 1 ? '' : 's'}.
          <InfoTip label="Where these figures come from" width={340}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div>Every figure on this screen is calculated from the programmes recorded in SPIMS. Add or change one and these move.</div>
              <div>Two things are not shown because nothing feeds them: community satisfaction, which no part of this system collects, and compliance, which has no source to check against. Both are named below rather than estimated.</div>
            </div>
          </InfoTip>
        </p>
      </div>

      <div style={{ background: 'linear-gradient(160deg,#1a2a63,#111c55)', borderRadius: 18, padding: '26px 28px', marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 19, fontWeight: 800, color: '#fff' }}>What changed</div>
          <div style={{ fontSize: 12.5, color: '#9EA1C0' }}>Across the whole portfolio, from results recorded against programmes</div>
        </div>

        {/* Three figures that mean the same thing whatever the programme is — a borehole,
            a scholarship, a clinic or a starter kit all serve people, reach communities and
            record a result. The band used to hold one card per programme, which reads as a
            summary when there is one programme and as an arbitrary pick of three when there
            are forty. */}
        <div className="grid-3" style={{ gap: 16 }}>
          <HeadlineCard
            value={formatCount(totals.impact)}
            label="People served"
            detail={
              totals.reach > 0
                ? `of ${formatCount(totals.reach)} reached · ${totals.conversionPct}% received a delivered intervention`
                : 'no programme has recorded who it reached yet'
            }
          />
          <HeadlineCard
            value={String(communities.length)}
            label={`Communit${communities.length === 1 ? 'y' : 'ies'} reached`}
            detail={
              states.length > 0
                ? `across ${states.length} state${states.length === 1 ? '' : 's'} · ${states.slice(0, 3).join(', ')}${states.length > 3 ? ' …' : ''}`
                : 'no community recorded against a programme yet'
            }
          />
          <HeadlineCard
            value={`${outcomes.length}`}
            label={`Programme${outcomes.length === 1 ? '' : 's'} with a recorded result`}
            detail={`of ${projects.length} in the portfolio · ${delivery.completed} completed`}
          />
        </div>

        {outcomes.length === 0 ? (
          <div style={{ fontSize: 13, color: '#C7C9DA', lineHeight: 1.6, marginTop: 18, maxWidth: 720 }}>
            No programme has recorded what changed as a result of its work. It is the{' '}
            <span style={{ fontFamily: 'monospace', fontSize: 12.5 }}>what_changed_as_a_result</span> column of the project completion
            upload, and until one is filled in these figures count delivery, not change.
          </div>
        ) : (
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.12)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9EA1C0', marginBottom: 10 }}>
              In each programme’s own words
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {outcomes.slice(0, 4).map((row) => (
                <div key={row.code} style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: 'rgba(43,76,155,0.35)', color: '#B9CBEB', whiteSpace: 'nowrap' }}>
                    {row.pillar}
                  </span>
                  <span style={{ fontSize: 11.5, fontFamily: 'monospace', color: '#9EA1C0' }}>{row.code}</span>
                  <span style={{ flex: 1, minWidth: 240, fontSize: 13, color: '#E4E6F5', lineHeight: 1.5 }}>{row.outcome}</span>
                </div>
              ))}
              {outcomes.length > 4 && (
                <div style={{ fontSize: 12.5, color: '#9EA1C0' }}>
                  and {outcomes.length - 4} more recorded against other programmes.
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 26, marginTop: 20, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.12)', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
              {sroi ? `₦${sroi.ratio.toFixed(2)}` : '—'}
              <InfoTip label="How the social return is calculated" width={360}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div>
                    Social value created ÷ amount invested, by Social Value International’s method: a financial proxy for each
                    programme’s outcome, less deadweight and attribution, decaying each year and discounted to today’s money.
                  </div>
                  {sroi ? (
                    <div>
                      Across {sroi.programmes} programme{sroi.programmes === 1 ? '' : 's'} with recorded spend and a count of people
                      served: {formatMillions(sroi.presentValueNgn / 1_000_000)} of estimated social value against{' '}
                      {formatMillions(sroi.investmentNgn / 1_000_000)} invested.
                    </div>
                  ) : (
                    <div>No programme yet carries both recorded spend and a count of people served, so there is nothing to calculate.</div>
                  )}
                  <div style={{ color: '#FFD2D9' }}>
                    ⚠ Illustrative. The financial proxies have not been validated by Seplat’s M&amp;E function — they are placeholders in
                    one file, and the ratio changes when they are replaced.
                  </div>
                </div>
              </InfoTip>
            </div>
            <div style={{ fontSize: 11.5, color: '#9EA1C0' }}>Social value per ₦1 · illustrative</div>
          </div>
          <div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#fff' }}>
              {sroi ? formatMillions(sroi.presentValueNgn / 1_000_000) : '—'}
            </div>
            <div style={{ fontSize: 11.5, color: '#9EA1C0' }}>Estimated social value created · illustrative</div>
          </div>
          <div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#fff' }}>{aspirationPct === null ? '—' : `${aspirationPct}%`}</div>
            <div style={{ fontSize: 11.5, color: '#9EA1C0' }}>
              {aspirationPct === null ? `No ${targetYear} target set yet` : `Mean progress across ${active.length} target${active.length === 1 ? '' : 's'}`}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 0,
          background: '#fff',
          border: '1px solid var(--line)',
          borderRadius: 14,
          marginBottom: 22,
          overflow: 'hidden',
        }}
      >
        {atAGlance.map((item, i) => (
          <div key={item.label} style={{ flex: '1 1 200px', padding: '14px 20px', borderLeft: i === 0 ? 'none' : '1px solid var(--line)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {item.label}
              {'tone' in item && <ReachVsImpactTip width={300} />}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 2, flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: 19,
                  fontWeight: 800,
                  color: 'tone' in item && item.tone === 'impact' ? 'var(--accent)' : 'tone' in item ? '#2B4C9B' : 'var(--navy)',
                }}
              >
                {item.value}
              </span>
              <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>{item.sub}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ ...card, marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 17, fontWeight: 800, color: 'var(--navy)' }}>
            Reach and impact by pillar
            <ReachVsImpactTip width={300} />
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>Scale on the left, delivered intervention on the right</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 18 }}>
          {totals.pillars.map((p) => {
            const share = totals.reach === 0 ? 0 : (p.reach / totals.reach) * 100;
            const impactShare = p.reach === 0 ? 0 : (p.impact / p.reach) * 100;
            return (
              <div key={p.pillar}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--navy)' }}>
                    {p.pillar} <span style={{ fontWeight: 500, color: 'var(--muted)' }}>· {p.projectCount} programme{p.projectCount === 1 ? '' : 's'}</span>
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                    <strong style={{ color: '#2B4C9B' }}>{formatCount(p.reach)}</strong> reached ·{' '}
                    <strong style={{ color: 'var(--accent)' }}>{formatCount(p.impact)}</strong> served
                  </span>
                </div>
                <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', background: 'var(--bg)' }}>
                  <span style={{ width: `${share}%`, display: 'flex', background: 'rgba(43,76,155,0.28)' }}>
                    <span style={{ width: `${Math.max(impactShare, 0.5)}%`, background: 'var(--accent)' }} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--line)', lineHeight: 1.55 }}>
          Bar width is each pillar's share of total reach; the solid segment inside it is the share that received the intervention.
          {totals.unmapped.length > 0 && ` ${totals.unmapped.join(', ')} not yet separated into reach and impact, so ${totals.unmapped.length === 1 ? 'it is' : 'they are'} excluded from these totals.`}
        </div>
      </div>

      <div className="grid-dash-money" style={{ marginBottom: 18 }}>
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 22, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)' }}>Where the money is committed</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              {money.programmesWithRecordedSpend} of {projects.length} programme{projects.length === 1 ? '' : 's'} has recorded actual spend
            </div>
          </div>
          <MoneyBars
            rows={money.byPillar}
            title="By pillar"
            note="Budgets as recorded against each programme, not ledger entries from a finance system."
          />
          <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid var(--line)' }}>
            <MoneyBars
              rows={money.byState}
              title="By state"
              note="A programme covering more than one state is counted in each, so the shares describe where the work is rather than splitting a budget."
            />
          </div>
        </div>

        <div
          style={{
            background: 'var(--navy)',
            color: '#fff',
            borderRadius: 16,
            padding: '24px 26px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9EA1C0', marginBottom: 16, alignSelf: 'flex-start' }}>
            {targetYear} Social aspirations
          </div>
          <div
            style={{
              width: 190,
              height: 190,
              borderRadius: '50%',
              background: `conic-gradient(var(--accent) 0% ${aspirationPct ?? 0}%, rgba(255,255,255,0.12) ${aspirationPct ?? 0}% 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: 142,
                height: 142,
                borderRadius: '50%',
                background: 'var(--navy)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: aspirationPct === null ? 22 : 50, fontWeight: 800, lineHeight: 1 }}>
                {aspirationPct === null ? 'Not set' : `${aspirationPct}%`}
              </span>
              <span style={{ fontSize: 12, color: '#9EA1C0', marginTop: 4 }}>{aspirationPct === null ? '' : 'achieved'}</span>
            </div>
          </div>
          <div style={{ fontSize: 13, color: '#C7C9DA', marginTop: 18, textAlign: 'center', lineHeight: 1.55 }}>
            {aspirationPct === null
              ? 'No active target has been set. Targets are created under Targets, and this is the mean of how far each has run.'
              : `Mean progress across ${active.length} active target${active.length === 1 ? '' : 's'}. Targets use different units, so they are averaged as percentages rather than added together.`}
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 18, gap: 18 }}>
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>
            Who benefited
            <InfoTip label="What this counts" width={330}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div>The four breakdown columns of the project completion upload, added across the programmes that filled them in.</div>
                <div>
                  Shares are of the people served by those programmes only. A programme that reported no breakdown is left out rather
                  than counted as zero, which would push every share down and read as a finding about the people rather than about the
                  paperwork.
                </div>
              </div>
            </InfoTip>
          </div>
          {people.programmesReporting === 0 ? (
            <div style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.6, marginTop: 10 }}>
              No programme has reported a breakdown of who it served. The columns are{' '}
              <span style={{ fontFamily: 'monospace', fontSize: 12.5 }}>of_whom_female</span>,{' '}
              <span style={{ fontFamily: 'monospace', fontSize: 12.5 }}>of_whom_male</span>,{' '}
              <span style={{ fontFamily: 'monospace', fontSize: 12.5 }}>of_whom_aged_under_35</span> and{' '}
              <span style={{ fontFamily: 'monospace', fontSize: 12.5 }}>of_whom_living_with_disability</span> in the project completion
              file.
            </div>
          ) : (
            <>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
                Across {people.programmesReporting} of {people.programmesTotal} programmes, covering {formatCount(people.benefited)} people served
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                {[
                  { label: 'Female', value: people.female, color: 'var(--accent)' },
                  { label: 'Male', value: people.male, color: '#2B4C9B' },
                  { label: 'Youth (under 35)', value: people.under35, color: '#1F8A5B' },
                  { label: 'Living with a disability', value: people.livingWithDisability, color: '#0E7C86' },
                ].map((row) => {
                  const pct = people.benefited === 0 ? 0 : Math.round((row.value / people.benefited) * 100);
                  return (
                    <div key={row.label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                        <span style={{ fontWeight: 600 }}>{row.label}</span>
                        <span style={{ color: 'var(--muted)' }}>{formatCount(row.value)} · {pct}%</span>
                      </div>
                      <span style={{ display: 'block', height: 8, background: 'var(--bg)', borderRadius: 5, overflow: 'hidden' }}>
                        <span style={{ display: 'block', height: '100%', width: `${pct}%`, background: row.color }} />
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>
            Are we compliant?
            <InfoTip label="Why there are no figures here" width={330}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div>
                  SPIMS holds no compliance data. It showed a tally of commitments met, with percentages against each framework; those
                  were written into the screen and no upload could change them.
                </div>
                <div>Each row below names what would have to be connected for the check to be real.</div>
              </div>
            </InfoTip>
          </div>
          <div style={{ fontSize: 12.5, color: '#8A5A0B', marginBottom: 14 }}>Not connected — no source to check against</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {COMPLIANCE_COMMITMENTS.map((row) => (
              <div key={row.text} style={{ background: 'var(--bg)', borderRadius: 10, padding: '10px 14px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{row.text}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Needs {row.needs}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 16 }}>What risks exist?</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 11,
              background: delivery.needingAttention > 0 ? 'rgba(227,26,56,0.1)' : 'rgba(31,138,91,0.12)',
              color: delivery.needingAttention > 0 ? 'var(--accent)' : '#1F8A5B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 18,
              flexShrink: 0,
            }}
          >
            {delivery.needingAttention}
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>
              {delivery.needingAttention === 0 ? 'No programme flagged' : `Programme${delivery.needingAttention === 1 ? '' : 's'} flagged on delivery`}
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              {delivery.atRisk} at risk · {delivery.delayed} delayed · {delivery.onTrack} on track · {delivery.completed} completed.
              Status is set on each project, not inferred from its budget.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
