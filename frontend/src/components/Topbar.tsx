import type { CSSProperties } from 'react';
import type { Role } from '../types';
import { Icon } from './Icon';

const ROLE_BUTTONS: { key: Role; label: string }[] = [
  { key: 'exec', label: 'Executive' },
  { key: 'manager', label: 'Manager' },
  { key: 'field', label: 'Field' },
  { key: 'relations', label: 'Relations' },
];

function roleBtnStyle(active: boolean): CSSProperties {
  return {
    fontFamily: 'inherit',
    fontSize: 12.5,
    fontWeight: 600,
    padding: '7px 13px',
    border: 'none',
    borderRadius: 7,
    cursor: 'pointer',
    background: active ? '#111C55' : 'transparent',
    color: active ? '#fff' : '#8A8DA6',
  };
}

export function Topbar({ orgName, crumb, role, setRole }: { orgName: string; crumb: string; role: Role; setRole: (r: Role) => void }) {
  return (
    <header
      style={{
        height: 66,
        flexShrink: 0,
        background: '#fff',
        borderBottom: '1px solid var(--line)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 30px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>
          {orgName}
        </span>
        <span style={{ color: 'var(--line)' }}>/</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy)' }}>{crumb}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            Viewing as
          </span>
          <div style={{ display: 'flex', gap: 3, background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 10, padding: 4 }}>
            {ROLE_BUTTONS.map((r) => (
              <button key={r.key} onClick={() => setRole(r.key)} style={roleBtnStyle(role === r.key)}>
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            background: 'var(--bg)',
            border: '1px solid var(--line)',
            borderRadius: 10,
            padding: '8px 14px',
            width: 220,
            color: 'var(--muted)',
          }}
        >
          <Icon name="search" size={16} />
          <span style={{ fontSize: 13 }}>Search projects, communities…</span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: '#fff',
            border: '1px solid var(--line)',
            borderRadius: 10,
            padding: '7px 12px',
            fontSize: 12.5,
            fontWeight: 600,
            color: 'var(--navy)',
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#1F8A5B', display: 'inline-block' }}></span>
          FY 2026 · ₦ Naira
        </div>
      </div>
    </header>
  );
}
