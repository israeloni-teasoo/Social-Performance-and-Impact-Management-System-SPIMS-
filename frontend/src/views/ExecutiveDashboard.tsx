import { useState } from 'react';
import { card } from '../ui';

type Lens = 'both' | 'local' | 'global';

const COMPLIANCE_ITEMS = [
  { icon: '✓', iconColor: '#1F8A5B', text: 'PIA HCDT — 3% OpEx funded', lens: 'local' as const },
  { icon: '87%', iconColor: '#2B4C9B', text: 'NCDMB local content', lens: 'local' as const },
  { icon: '92%', iconColor: '#2B4C9B', text: 'NUPRC grievance SLA', lens: 'local' as const },
  { icon: '!', iconColor: '#C0491E', text: '4 IFRS S1 gaps open', lens: 'global' as const },
  { icon: '96%', iconColor: '#1F8A5B', text: 'GRI 403 disclosure complete', lens: 'global' as const },
  { icon: '✓', iconColor: '#1F8A5B', text: 'SDG mapping current', lens: 'global' as const },
];

const OUTCOME_ROWS = [
  { delta: '+12%', desc: 'literacy in STEP schools', localTag: 'NCDMB human-capital', globalTag: 'SDG 4' },
  { delta: '−8%', desc: 'youth unemployment (YEP LGAs)', localTag: 'NCDMB local content', globalTag: 'SDG 8' },
  { delta: '+22K', desc: 'people with clean-water access', localTag: 'PIA HCDT', globalTag: 'SDG 6' },
];

const LENS_BANNER: Record<Lens, { bg: string; border: string; color: string; text: string }> = {
  both: {
    bg: 'rgba(17,28,85,0.06)',
    border: 'rgba(17,28,85,0.18)',
    color: 'var(--navy)',
    text: 'Showing both lenses — the same dataset, framed for Nigerian regulators and international investors side by side.',
  },
  local: {
    bg: 'rgba(43,76,155,0.08)',
    border: 'rgba(43,76,155,0.25)',
    color: '#2B4C9B',
    text: 'Local lens — framed for Nigerian regulators: NCDMB local content, PIA Host Community Development Trust, NUPRC host-community rules.',
  },
  global: {
    bg: 'rgba(227,26,56,0.07)',
    border: 'rgba(227,26,56,0.22)',
    color: 'var(--accent)',
    text: 'Global lens — framed for international investors: GRI Standards, IFRS Sustainability Disclosures (ISSB), and UN SDGs.',
  },
};

export function ExecutiveDashboard({ targetYear }: { targetYear: number }) {
  const [lens, setLens] = useState<Lens>('both');
  const visibleCompliance = lens === 'both' ? COMPLIANCE_ITEMS : COMPLIANCE_ITEMS.filter((c) => c.lens === lens);
  const banner = LENS_BANNER[lens];

  const tabStyle = (active: boolean) => ({
    fontSize: 12.5,
    fontWeight: 600,
    padding: '8px 16px',
    borderRadius: 8,
    background: active ? 'var(--navy)' : 'transparent',
    color: active ? '#fff' : 'var(--muted)',
    border: 'none',
    fontFamily: 'inherit',
    cursor: 'pointer',
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 6px', color: 'var(--navy)' }}>
            Executive Dashboard
          </h1>
          <p style={{ fontSize: 14.5, color: 'var(--muted)', margin: 0 }}>
            Company-wide social performance — the whole story, at a glance. <span style={{ color: '#B84' }}>Illustrative data.</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, background: '#fff', border: '1px solid var(--line)', borderRadius: 11, padding: 4 }}>
          <button onClick={() => setLens('both')} style={tabStyle(lens === 'both')}>
            Local + Global
          </button>
          <button onClick={() => setLens('local')} style={tabStyle(lens === 'local')}>
            Local
          </button>
          <button onClick={() => setLens('global')} style={tabStyle(lens === 'global')}>
            Global
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: banner.bg,
          border: `1px solid ${banner.border}`,
          borderRadius: 12,
          padding: '12px 18px',
          marginBottom: 18,
          fontSize: 13,
          fontWeight: 600,
          color: banner.color,
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: banner.color, flexShrink: 0 }} />
        {banner.text}
      </div>

      {/* KPI row */}
      <div className="grid-4" style={{ marginBottom: 18 }}>
        <div className="card-lift" style={{ background: 'var(--navy)', color: '#fff', borderRadius: 16, padding: '22px 24px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9EA1C0' }}>
            Social investment · FY26
          </div>
          <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-0.02em', margin: '8px 0 4px' }}>
            ₦4.68<span style={{ fontSize: 20, fontWeight: 700 }}>B</span>
          </div>
          <div style={{ fontSize: 12.5, color: '#C7C9DA' }}>
            {lens === 'local' && '90% of ₦5.2B budget utilised · 3% PIA HCDT OpEx mandate met'}
            {lens === 'global' && '$64M invested since 2010 · GRI 201-1 economic value disclosed'}
            {lens === 'both' && '90% of ₦5.2B budget utilised · $64M since 2010'}
          </div>
        </div>
        <div className="card-lift" style={card}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            Beneficiaries reached
          </div>
          <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-0.02em', margin: '8px 0 4px', color: 'var(--accent)' }}>312K</div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>
            {lens === 'local' && 'per NCDMB host-community headcount'}
            {lens === 'global' && <><span style={{ color: '#1F8A5B', fontWeight: 600 }}>▲ 18%</span> vs FY25 · GRI 413-1</>}
            {lens === 'both' && <><span style={{ color: '#1F8A5B', fontWeight: 600 }}>▲ 18%</span> vs FY25</>}
          </div>
        </div>
        <div className="card-lift" style={card}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            Active projects
          </div>
          <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-0.02em', margin: '8px 0 4px', color: 'var(--navy)' }}>47</div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>38 on track · 6 at risk · 3 delayed</div>
        </div>
        <div className="card-lift" style={card}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            Host communities
          </div>
          <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-0.02em', margin: '8px 0 4px', color: 'var(--navy)' }}>42</div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>Edo · Delta · Imo</div>
        </div>
      </div>

      {/* middle grid */}
      <div className="grid-dash-money" style={{ marginBottom: 18 }}>
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 22, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)' }}>Where the money went</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              {lens === 'local' && 'FY26 spend by NCDMB reporting category'}
              {lens === 'global' && 'FY26 spend by GRI 201-1 category'}
              {lens === 'both' && 'FY26 spend by pillar'}
            </div>
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

      {/* lower grid */}
      <div className="grid-dash-lower">
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
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 18 }}>
            What changed <span style={{ fontWeight: 500, fontSize: 12, color: 'var(--muted)' }}>· outcomes</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {OUTCOME_ROWS.map((row) => (
              <div key={row.desc} style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: '#1F8A5B' }}>{row.delta}</span>
                <span style={{ fontSize: 13, color: 'var(--ink)' }}>{row.desc}</span>
                {(lens === 'both' || lens === 'local') && (
                  <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'rgba(43,76,155,0.1)', color: '#2B4C9B' }}>
                    {row.localTag}
                  </span>
                )}
                {(lens === 'both' || lens === 'global') && (
                  <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'rgba(31,138,91,0.12)', color: '#1F8A5B' }}>
                    {row.globalTag}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: 'linear-gradient(160deg,#1a2a63,#111c55)', color: '#fff', borderRadius: 16, padding: '22px 24px' }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 18 }}>Value created</div>
          <div style={{ display: 'flex', gap: 22 }}>
            <div>
              <div style={{ fontSize: 30, fontWeight: 800, color: '#fff' }}>3.4×</div>
              <div style={{ fontSize: 11.5, color: '#9EA1C0' }}>SROI ratio</div>
            </div>
            <div>
              <div style={{ fontSize: 30, fontWeight: 800, color: '#fff' }}>78%</div>
              <div style={{ fontSize: 11.5, color: '#9EA1C0' }}>Satisfaction</div>
            </div>
          </div>
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.12)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {lens !== 'global' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12.5, color: '#C7C9DA' }}>NCDMB · Local content</span>
                <span style={{ fontSize: 15, fontWeight: 800, background: '#2B4C9B', padding: '3px 12px', borderRadius: 8 }}>87%</span>
              </div>
            )}
            {lens !== 'local' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12.5, color: '#C7C9DA' }}>ESG · Social score</span>
                <span style={{ fontSize: 15, fontWeight: 800, background: 'var(--accent)', padding: '3px 12px', borderRadius: 8 }}>B+</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* compliance + risk strip */}
      <div className="grid-dash-compliance" style={{ marginTop: 18 }}>
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)' }}>
              Are we compliant? <span style={{ fontWeight: 500, fontSize: 12, color: 'var(--muted)' }}>· {lens === 'both' ? 'local + global' : lens} view</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#1F8A5B' }}>
              {lens === 'both' ? '24 / 28' : lens === 'local' ? '3 / 3' : '2 / 3'} commitments met
            </span>
          </div>
          <div className="grid-compliance-inner">
            {visibleCompliance.map((row) => (
              <div
                key={row.text}
                style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg)', borderRadius: 10, padding: '11px 14px' }}
              >
                <span style={{ fontSize: row.icon.length > 1 && row.icon !== '!' ? 12 : undefined, fontWeight: row.icon.length > 1 ? 700 : undefined, color: row.iconColor }}>
                  {row.icon}
                </span>
                <span style={{ fontSize: 13 }}>{row.text}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={card}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 16 }}>What risks exist?</div>
          {[
            { n: 6, bg: 'rgba(227,26,56,0.1)', fg: 'var(--accent)', title: 'High-risk projects', sub: 'budget or delivery flagged' },
            { n: 4, bg: 'rgba(192,73,30,0.1)', fg: '#C0491E', title: 'Grievances > 30 days', sub: 'breaching resolution SLA' },
          ].map((row, i) => (
            <div key={row.title} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: i === 0 ? 12 : 0 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 11,
                  background: row.bg,
                  color: row.fg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 18,
                }}
              >
                {row.n}
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{row.title}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{row.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
