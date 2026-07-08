import { formField, h1, input, label, primaryBtn, secondaryBtn, sectionCardTitle } from '../ui';
import type { CSSProperties } from 'react';

const selectStyle: CSSProperties = { ...input };
const darkFormField: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 7 };
const darkInput: CSSProperties = {
  width: '100%',
  fontFamily: 'inherit',
  fontSize: 14,
  padding: '11px 13px',
  border: '1px solid rgba(255,255,255,0.18)',
  borderRadius: 10,
  background: 'rgba(255,255,255,0.06)',
  color: '#fff',
};

export function NewProject({ goApprovals }: { goApprovals: () => void }) {
  return (
    <div style={{ maxWidth: 1080 }}>
      <h1 style={h1}>New Project</h1>
      <p style={{ fontSize: 14.5, color: 'var(--muted)', margin: '0 0 24px' }}>
        Enter a project once. It is tagged against both local and global indicators, then routed for approval — no double entry.
      </p>

      <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '24px 26px', marginBottom: 18 }}>
        <div style={sectionCardTitle}>1 · Project details</div>
        <div style={{ ...formField, marginBottom: 16 }}>
          <label style={label}>Project title</label>
          <input defaultValue="Solar Skills Academy — Cohort 3" style={input} />
        </div>
        <div className="form-grid-3">
          <div style={formField}>
            <label style={label}>Project ID</label>
            <input defaultValue="SPL-2026-048" readOnly style={{ ...input, fontFamily: 'monospace', background: '#f1f1f6', color: 'var(--muted)' }} />
          </div>
          <div style={formField}>
            <label style={label}>Pillar</label>
            <select style={selectStyle} defaultValue="Economic Empowerment">
              <option>Economic Empowerment</option>
              <option>Education</option>
              <option>Health</option>
              <option>Infrastructure</option>
            </select>
          </div>
          <div style={formField}>
            <label style={label}>Project owner</label>
            <input defaultValue="Tunde Bello" style={input} />
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '24px 26px', marginBottom: 18 }}>
        <div style={sectionCardTitle}>2 · Location &amp; community</div>
        <div className="form-grid-4">
          <div style={formField}>
            <label style={label}>Community</label>
            <select style={selectStyle} defaultValue="Sapele">
              <option>Sapele</option>
              <option>Oben</option>
              <option>Amukpe</option>
              <option>Ovhor</option>
              <option>Orogun</option>
            </select>
          </div>
          <div style={formField}>
            <label style={label}>LGA</label>
            <input defaultValue="Sapele LGA" style={input} />
          </div>
          <div style={formField}>
            <label style={label}>State</label>
            <select style={selectStyle} defaultValue="Delta">
              <option>Delta</option>
              <option>Edo</option>
              <option>Imo</option>
            </select>
          </div>
          <div style={formField}>
            <label style={label}>GPS coordinates</label>
            <input defaultValue="5.8904, 5.6767" style={{ ...input, fontFamily: 'monospace', fontSize: 13 }} />
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '24px 26px', marginBottom: 18 }}>
        <div style={sectionCardTitle}>3 · Timeline &amp; budget</div>
        <div className="form-grid-3">
          <div style={formField}>
            <label style={label}>Start date</label>
            <input defaultValue="2026-09-01" style={input} />
          </div>
          <div style={formField}>
            <label style={label}>End date</label>
            <input defaultValue="2027-06-30" style={input} />
          </div>
          <div style={formField}>
            <label style={label}>Budget (₦)</label>
            <input defaultValue="₦ 180,000,000" style={input} />
          </div>
          <div style={formField}>
            <label style={label}>Funding source</label>
            <select style={selectStyle} defaultValue="PIA HCDT — 3% OpEx">
              <option>PIA HCDT — 3% OpEx</option>
              <option>Direct CSR budget</option>
              <option>Partner co-funded (C4C)</option>
            </select>
          </div>
          <div style={formField}>
            <label style={label}>Contractor</label>
            <input defaultValue="Bright Energy Ltd" style={input} />
          </div>
          <div style={formField}>
            <label style={label}>Implementing NGO</label>
            <input defaultValue="C4C Foundation" style={input} />
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--navy)', color: '#fff', borderRadius: 16, padding: '24px 26px', marginBottom: 18 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 18,
            paddingBottom: 12,
            borderBottom: '1px solid rgba(255,255,255,0.14)',
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 700 }}>4 · Dual-lens indicator tags</div>
          <span style={{ fontSize: 12, color: '#9EA1C0' }}>one entry → local + global reports</span>
        </div>
        <div className="form-grid-3">
          <div style={darkFormField}>
            <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9FC0EB' }}>
              Local — Nigeria
            </label>
            <select style={darkInput} defaultValue="NCDMB human-capital dev.">
              <option>NCDMB human-capital dev.</option>
              <option>PIA HCDT — 3% OpEx</option>
              <option>NUPRC HC Regs 2022</option>
            </select>
          </div>
          <div style={darkFormField}>
            <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#F4A6B2' }}>
              Global standard
            </label>
            <select style={darkInput} defaultValue="GRI 404 · IPIECA SOC-6">
              <option>GRI 404 · IPIECA SOC-6</option>
              <option>GRI 203 / 413</option>
              <option>GRI 401 · IPIECA SOC-5</option>
            </select>
          </div>
          <div style={darkFormField}>
            <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9FE0BE' }}>SDG</label>
            <select style={darkInput} defaultValue="SDG 8 · Decent Work">
              <option>SDG 8 · Decent Work</option>
              <option>SDG 4 · Quality Education</option>
              <option>SDG 7 · Clean Energy</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12.5, color: 'var(--muted)', marginRight: 'auto' }}>
          Submitting routes to your reviewer for approval before it appears on the executive dashboard.
        </span>
        <button style={secondaryBtn}>Save draft</button>
        <button onClick={goApprovals} style={primaryBtn}>
          Submit for approval →
        </button>
      </div>
    </div>
  );
}
