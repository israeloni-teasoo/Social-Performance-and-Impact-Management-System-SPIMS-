import { ReachVsImpactTip } from '../components/ReachPanel';
import { InfoTip } from '../components/Tooltip';
import { analysePortfolio, formatCompact, formatCount } from '../analytics/metrics';
import { card } from '../ui';
import type { Project, ProjectImpact } from '../types';

const COMPLIANCE_ITEMS = [
  {
    icon: '✓',
    iconColor: '#1F8A5B',
    text: 'PIA HCDT — 3% OpEx funded',
    detail: 'FY26 Host Community Development Trust allocation is fully funded and reconciled quarterly against actual OpEx. No open gap.',
  },
  {
    icon: '87%',
    iconColor: '#2B4C9B',
    text: 'NCDMB local content',
    detail: 'Target: 90% Nigerian personnel, goods and services. Current: 87%. Gap: local-hire share on 2 infrastructure contracts is below threshold — Procurement is tracking corrective hiring targets with those contractors this quarter.',
  },
  {
    icon: '!',
    iconColor: '#C0491E',
    text: '4 IFRS S1 gaps open',
    detail: 'Open items: climate-related risk disclosure, governance oversight statement, scenario analysis, and value-chain emissions estimate. Owner: Sustainability team, targeted for close-out before the FY26 annual report.',
  },
  {
    icon: '96%',
    iconColor: '#1F8A5B',
    text: 'GRI 403 disclosure complete',
    detail: 'Target: 100% of active sites with occupational-health disclosure. Current: 96%. Gap: 1 site is awaiting its Q3 safety audit before its disclosure can be finalised.',
  },
  {
    icon: '✓',
    iconColor: '#1F8A5B',
    text: 'SDG mapping current',
    detail: 'Every active project is tagged to at least one SDG target. No open gap.',
  },
];

const OUTCOME_ROWS = [
  { delta: '+12%', desc: 'literacy in STEP-supported schools', localTag: 'NCDMB human-capital', globalTag: 'SDG 4' },
  { delta: '−8%', desc: 'youth unemployment in YEP-covered LGAs', localTag: 'NCDMB local content', globalTag: 'SDG 8' },
  { delta: '+22K', desc: 'people gained clean-water access', localTag: 'PIA HCDT', globalTag: 'SDG 6' },
];

const SPEND_TILE = { label: 'Social investment · FY26', value: '\u20a64.68B', sub: '90% of \u20a65.2B budget' };
const COMMUNITIES_TILE = { label: 'Host communities', value: '42', sub: 'Edo \u00b7 Delta \u00b7 Imo' };

export function ExecutiveDashboard({
  targetYear,
  projects,
  impacts,
}: {
  targetYear: number;
  projects: Project[];
  impacts: Record<string, ProjectImpact>;
}) {
  const totals = analysePortfolio(projects, impacts);
  const pillars = totals.pillars;

  const atAGlance = [
    SPEND_TILE,
    { label: 'Reach \u00b7 interactions', value: formatCompact(totals.reach), sub: `${formatCount(totals.reach)} people engaged`, tone: 'reach' as const },
    { label: 'Impact \u00b7 people served', value: formatCompact(totals.impact), sub: `${formatCount(totals.impact)} · ${totals.conversionPct}% of interactions`, tone: 'impact' as const },
    COMMUNITIES_TILE,
  ];

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 6px', color: 'var(--navy)' }}>
          Executive Dashboard
        </h1>
        <p style={{ fontSize: 14.5, color: 'var(--muted)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
          Social investment performance, FY26 year to date.
          <InfoTip label="About this data">
            This build isn't connected to Seplat's real field data yet — figures shown are illustrative, pending verified data.
          </InfoTip>
        </p>
      </div>

      <div style={{ background: 'linear-gradient(160deg,#1a2a63,#111c55)', borderRadius: 18, padding: '26px 28px', marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 19, fontWeight: 800, color: '#fff' }}>What changed</div>
          <div style={{ fontSize: 12.5, color: '#9EA1C0' }}>Outcome deltas for FY26, mapped to local and global frameworks</div>
        </div>
        <div className="grid-3" style={{ gap: 16 }}>
          {OUTCOME_ROWS.map((row) => (
            <div key={row.desc} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, padding: '18px 20px' }}>
              <div style={{ fontSize: 34, fontWeight: 800, color: '#fff', lineHeight: 1.1, marginBottom: 8 }}>{row.delta}</div>
              <div style={{ fontSize: 13.5, color: '#E4E6F5', marginBottom: 12 }}>{row.desc}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: 'rgba(43,76,155,0.35)', color: '#B9CBEB' }}>{row.localTag}</span>
                <span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: 'rgba(31,138,91,0.3)', color: '#9EE8C4' }}>{row.globalTag}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 26, marginTop: 20, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.12)' }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
              3.4×
              <InfoTip label="How SROI is calculated">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div>SROI = total social value created ÷ total invested. 3.4× means ₦3.40 of estimated social value for every ₦1 spent.</div>
                  <div>Social value is estimated by assigning a financial proxy to each outcome — for example, the wage uplift from a job created, or the healthcare-cost value of restored sight — then adjusting for deadweight (what would have happened anyway), attribution, and drop-off over time.</div>
                  <div style={{ color: '#8A5A0B' }}>⚠ This figure is a Phase 1 illustrative placeholder. Seplat's M&amp;E team hasn't yet validated the financial proxies each outcome needs, so this ratio isn't computed from live data.</div>
                </div>
              </InfoTip>
            </div>
            <div style={{ fontSize: 11.5, color: '#9EA1C0' }}>SROI ratio</div>
          </div>
          <div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#fff' }}>78%</div>
            <div style={{ fontSize: 11.5, color: '#9EA1C0' }}>Community satisfaction</div>
          </div>
          <div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#fff' }}>52%</div>
            <div style={{ fontSize: 11.5, color: '#9EA1C0' }}>{targetYear} social aspiration achieved</div>
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
          <div
            key={item.label}
            style={{
              flex: '1 1 200px',
              padding: '14px 20px',
              borderLeft: i === 0 ? 'none' : '1px solid var(--line)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {item.label}
              {'tone' in item && <ReachVsImpactTip width={300} />}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 2 }}>
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
          {pillars.map((p) => {
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
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)' }}>Where the money went</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>FY26 spend by pillar</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {[
              { name: 'Education', pct: 45, amt: '₦2.10B · 45%', color: '#2B4C9B' },
              { name: 'Health', pct: 22, amt: '₦1.03B · 22%', color: '#1F8A5B' },
              { name: 'Infrastructure', pct: 20, amt: '₦0.94B · 20%', color: '#0E7C86' },
              { name: 'Economic Emp.', pct: 13, amt: '₦0.61B · 13%', color: '#C0491E' },
            ].map((row) => (
              <div key={row.name} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ width: 130, fontSize: 13.5, fontWeight: 600 }}>{row.name}</span>
                <span style={{ flex: 1, height: 22, background: 'var(--bg)', borderRadius: 6, overflow: 'hidden' }}>
                  <span style={{ display: 'block', height: '100%', width: `${row.pct}%`, background: row.color, borderRadius: 6 }} />
                </span>
                <span style={{ width: 112, fontSize: 13.5, fontWeight: 700, textAlign: 'right' }}>{row.amt}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 26, marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--line)' }}>
            {[
              { label: 'By state · Edo', val: '58%' },
              { label: 'Delta', val: '34%' },
              { label: 'Imo', val: '8%' },
            ].map((s) => (
              <div key={s.label}>
                <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--navy)' }}>{s.val}</div>
              </div>
            ))}
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
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#9EA1C0',
              marginBottom: 16,
              alignSelf: 'flex-start',
            }}
          >
            {targetYear} Social aspirations
          </div>
          <div
            style={{
              width: 190,
              height: 190,
              borderRadius: '50%',
              background: 'conic-gradient(var(--accent) 0% 52%, rgba(255,255,255,0.12) 52% 100%)',
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
              <span style={{ fontSize: 50, fontWeight: 800, lineHeight: 1 }}>52%</span>
              <span style={{ fontSize: 12, color: '#9EA1C0', marginTop: 4 }}>achieved</span>
            </div>
          </div>
          <div style={{ fontSize: 13.5, color: '#C7C9DA', marginTop: 18, textAlign: 'center' }}>
            On track across 4 pillars — Economic Empowerment flagged as the priority gap.
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 18, gap: 18 }}>
        <div style={card}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 18 }}>Who benefited</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
            {[
              { label: 'Female', pct: 48, color: 'var(--accent)' },
              { label: 'Youth (under 35)', pct: 64, color: '#2B4C9B' },
              { label: 'Persons w/ disability', pct: 3, barPct: 12, color: '#0E7C86' },
            ].map((row) => (
              <div key={row.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span style={{ fontWeight: 600 }}>{row.label}</span>
                  <span style={{ color: 'var(--muted)' }}>{row.pct}%</span>
                </div>
                <span style={{ display: 'block', height: 8, background: 'var(--bg)', borderRadius: 5, overflow: 'hidden' }}>
                  <span
                    style={{ display: 'block', height: '100%', width: `${row.barPct ?? row.pct}%`, background: row.color }}
                  />
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 16 }}>
            Are we compliant? <span style={{ fontWeight: 500, fontSize: 12, color: 'var(--muted)' }}>· local + global view</span>
            <InfoTip label="How compliance is assessed">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div>Each row compares one commitment — a PIA HCDT allocation, an NCDMB threshold, a disclosure standard — against the data logged for it in SPIMS. A checkmark means the target is fully met; a percentage shows partial progress; ! flags an open gap.</div>
                <div>Tap the ⓘ on any row below to see exactly what the gap is and who owns closing it.</div>
                <div style={{ color: '#8A5A0B' }}>⚠ In this prototype these figures are a static illustrative summary, not a live check against source data — automatic gap-detection against real compliance data is a Phase 2 backend integration.</div>
              </div>
            </InfoTip>
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#1F8A5B', marginBottom: 14 }}>22 / 24 commitments met</div>
          <div className="grid-compliance-inner">
            {COMPLIANCE_ITEMS.map((row) => (
              <div
                key={row.text}
                style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg)', borderRadius: 10, padding: '11px 14px' }}
              >
                <span style={{ fontSize: row.icon.length > 1 && row.icon !== '!' ? 12 : undefined, fontWeight: row.icon.length > 1 ? 700 : undefined, color: row.iconColor }}>
                  {row.icon}
                </span>
                <span style={{ fontSize: 13, flex: 1 }}>{row.text}</span>
                <InfoTip label={`Detail on ${row.text}`} width={300}>
                  {row.detail}
                </InfoTip>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 16 }}>What risks exist?</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 11,
              background: 'rgba(227,26,56,0.1)',
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 18,
              flexShrink: 0,
            }}
          >
            6
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>High-risk projects</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>budget or delivery flagged</div>
          </div>
        </div>
      </div>
    </div>
  );
}
