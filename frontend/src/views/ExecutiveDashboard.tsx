import { card } from '../ui';

export function ExecutiveDashboard({ targetYear }: { targetYear: number }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 6px', color: 'var(--navy)' }}>
            Executive Dashboard
          </h1>
          <p style={{ fontSize: 14.5, color: 'var(--muted)', margin: 0 }}>
            Company-wide social performance — the whole story, at a glance. <span style={{ color: '#B84' }}>Illustrative data.</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, background: '#fff', border: '1px solid var(--line)', borderRadius: 11, padding: 4 }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, padding: '8px 16px', borderRadius: 8, background: 'var(--navy)', color: '#fff' }}>
            Local + Global
          </span>
          <span style={{ fontSize: 12.5, fontWeight: 600, padding: '8px 16px', borderRadius: 8, color: 'var(--muted)' }}>Local</span>
          <span style={{ fontSize: 12.5, fontWeight: 600, padding: '8px 16px', borderRadius: 8, color: 'var(--muted)' }}>Global</span>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18, marginBottom: 18 }}>
        <div className="card-lift" style={{ background: 'var(--navy)', color: '#fff', borderRadius: 16, padding: '22px 24px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9EA1C0' }}>
            Social investment · FY26
          </div>
          <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-0.02em', margin: '8px 0 4px' }}>
            ₦4.68<span style={{ fontSize: 20, fontWeight: 700 }}>B</span>
          </div>
          <div style={{ fontSize: 12.5, color: '#C7C9DA' }}>90% of ₦5.2B budget utilised · $64M since 2010</div>
        </div>
        <div className="card-lift" style={card}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            Beneficiaries reached
          </div>
          <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-0.02em', margin: '8px 0 4px', color: 'var(--accent)' }}>312K</div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>
            <span style={{ color: '#1F8A5B', fontWeight: 600 }}>▲ 18%</span> vs FY25
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
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 18, marginBottom: 18 }}>
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 22 }}>
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

      {/* lower grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18 }}>
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
            {[
              { delta: '+12%', desc: 'literacy in STEP schools' },
              { delta: '−8%', desc: 'youth unemployment (YEP LGAs)' },
              { delta: '+22K', desc: 'people with clean-water access' },
            ].map((row) => (
              <div key={row.desc} style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: '#1F8A5B' }}>{row.delta}</span>
                <span style={{ fontSize: 13, color: 'var(--ink)' }}>{row.desc}</span>
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
          <div
            style={{
              marginTop: 16,
              paddingTop: 14,
              borderTop: '1px solid rgba(255,255,255,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: 12.5, color: '#C7C9DA' }}>ESG · Social score</span>
            <span style={{ fontSize: 15, fontWeight: 800, background: 'var(--accent)', padding: '3px 12px', borderRadius: 8 }}>B+</span>
          </div>
        </div>
      </div>

      {/* compliance + risk strip */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18, marginTop: 18 }}>
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)' }}>Are we compliant?</div>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#1F8A5B' }}>24 / 28 commitments met</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
            {[
              { icon: '✓', iconColor: '#1F8A5B', text: 'PIA HCDT — 3% OpEx funded' },
              { icon: '87%', iconColor: '#2B4C9B', text: 'NCDMB local content' },
              { icon: '92%', iconColor: '#2B4C9B', text: 'NUPRC grievance SLA' },
              { icon: '!', iconColor: '#C0491E', text: '4 IFRS S1 gaps open' },
            ].map((row) => (
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
