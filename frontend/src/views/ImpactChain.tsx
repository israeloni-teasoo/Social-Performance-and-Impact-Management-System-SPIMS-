import { h1 } from '../ui';

export function ImpactChain() {
  return (
    <div>
      <h1 style={h1}>Impact Chain</h1>
      <p style={{ fontSize: 14.5, color: 'var(--muted)', margin: '0 0 20px' }}>
        Trace one programme from what we invest to what it means. Example —{' '}
        <strong style={{ color: 'var(--ink)' }}>STEP · Seplat Teachers Empowerment Programme</strong>.
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 22, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, padding: '8px 16px', borderRadius: 9, background: 'var(--navy)', color: '#fff' }}>
          STEP
        </span>
        {['Eye Can See', 'YEP', 'PEARLs Quiz'].map((t) => (
          <span
            key={t}
            style={{ fontSize: 12.5, fontWeight: 600, padding: '8px 16px', borderRadius: 9, background: '#fff', border: '1px solid var(--line)', color: 'var(--ink)' }}
          >
            {t}
          </span>
        ))}
      </div>

      <div className="grid-impact-cols" style={{ marginBottom: 22 }}>
        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 14, padding: '20px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            01 · Inputs
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, margin: '10px 0 12px' }}>What we invest</div>
          <div style={{ fontSize: 13, lineHeight: 1.45, color: 'var(--ink)', borderTop: '1px solid var(--line)', paddingTop: 12 }}>
            ₦480M, staff &amp; partners — C4C, state ministries of education.
          </div>
        </div>
        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 14, padding: '20px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            02 · Activities
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, margin: '10px 0 12px' }}>What we do</div>
          <div style={{ fontSize: 13, lineHeight: 1.45, color: 'var(--ink)', borderTop: '1px solid var(--line)', paddingTop: 12 }}>
            Train &amp; certify teachers and inspectors in Edo &amp; Delta.
          </div>
        </div>
        <div style={{ background: '#2B4C9B', color: '#fff', borderRadius: 14, padding: '20px 18px', position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              top: -10,
              left: 18,
              background: '#2B4C9B',
              fontSize: 9.5,
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              padding: '3px 9px',
              borderRadius: 20,
            }}
          >
            Reported today
          </div>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#B9CBEB' }}>
            03 · Outputs
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, margin: '10px 0 12px' }}>What we deliver</div>
          <div style={{ fontSize: 13, lineHeight: 1.45, color: '#E4ECF8', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: 12 }}>
            <strong style={{ color: '#fff' }}>623 teachers</strong> certified in 2026.
          </div>
        </div>
        <div style={{ background: '#fff', border: '1px solid var(--accent)', borderRadius: 14, padding: '20px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent)' }}>
            04 · Outcomes
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, margin: '10px 0 12px' }}>What changes</div>
          <div style={{ fontSize: 13, lineHeight: 1.45, color: 'var(--ink)', borderTop: '1px solid #F6D3D9', paddingTop: 12 }}>
            Better teaching quality &amp; classroom practice; +12% literacy.
          </div>
        </div>
        <div style={{ background: 'var(--accent)', color: '#fff', borderRadius: 14, padding: '20px 18px', position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              top: -10,
              left: 18,
              background: 'var(--navy)',
              fontSize: 9.5,
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              padding: '3px 9px',
              borderRadius: 20,
            }}
          >
            Platform adds
          </div>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#FFD2D9' }}>
            05 · Impact
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, margin: '10px 0 12px' }}>What it means</div>
          <div style={{ fontSize: 13, lineHeight: 1.45, color: '#FFE4E8', borderTop: '1px solid rgba(255,255,255,0.28)', paddingTop: 12 }}>
            <strong style={{ color: '#fff' }}>50,000+ children</strong> better educated → poverty &amp; restiveness reduced.
          </div>
        </div>
      </div>

      <div className="grid-impact-lower">
        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '22px 24px' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 18 }}>Baseline → Midline → Endline</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24, height: 150, paddingBottom: 8 }}>
            {[
              { label: 'Baseline', val: '54%', height: 54, color: '#D7DBEA' },
              { label: 'Midline', val: '61%', height: 82, color: '#2B4C9B' },
              { label: 'Endline', val: '66%', height: 104, color: 'var(--accent)', accent: true },
            ].map((b) => (
              <div key={b.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: b.accent ? 'var(--accent)' : undefined }}>{b.val}</span>
                <span style={{ width: '100%', height: b.height, background: b.color, borderRadius: '8px 8px 0 0' }} />
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>{b.label}</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 6 }}>Pupil literacy proficiency in STEP-supported schools.</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '22px 24px' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 16 }}>Dual-lens tags on this programme</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { tag: 'Local', bg: 'rgba(43,76,155,0.1)', fg: '#2B4C9B', text: 'NCDMB human-capital development' },
              { tag: 'Global', bg: 'rgba(227,26,56,0.1)', fg: 'var(--accent)', text: 'GRI 404 · IPIECA SOC-6' },
              { tag: 'SDG', bg: 'rgba(31,138,91,0.12)', fg: '#1F8A5B', text: 'SDG 4 · Quality Education & SDG 8' },
            ].map((row) => (
              <div key={row.tag} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    padding: '4px 10px',
                    borderRadius: 6,
                    background: row.bg,
                    color: row.fg,
                  }}
                >
                  {row.tag}
                </span>
                <span style={{ fontSize: 13 }}>{row.text}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Cost per outcome</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)' }}>₦2,140</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Est. SROI</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)' }}>3.4×</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
