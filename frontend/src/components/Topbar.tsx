import { useRef, useState } from 'react';
import type { Community, Project } from '../types';
import { Icon } from './Icon';

export function Topbar({
  orgName,
  crumb,
  userName,
  userRole,
  onMenuClick,
  onLogout,
  projects,
  communities,
  goProjectDetail,
  goCommunityDetail,
}: {
  orgName: string;
  crumb: string;
  userName: string;
  userRole: string;
  onMenuClick: () => void;
  onLogout: () => void;
  projects: Project[];
  communities: Community[];
  goProjectDetail: (id: string) => void;
  goCommunityDetail: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const q = query.trim().toLowerCase();
  const matchedProjects = q ? projects.filter((p) => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)).slice(0, 5) : [];
  const matchedCommunities = q ? communities.filter((c) => c.name.toLowerCase().includes(q) || c.state.toLowerCase().includes(q)).slice(0, 5) : [];
  const showDropdown = focused && q.length > 0;

  const selectProject = (id: string) => {
    goProjectDetail(id);
    setQuery('');
    setFocused(false);
  };
  const selectCommunity = (id: string) => {
    goCommunityDetail(id);
    setQuery('');
    setFocused(false);
  };

  return (
    <header
      className="spims-topbar"
      style={{
        flexShrink: 0,
        background: '#fff',
        borderBottom: '1px solid var(--line)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 30px',
        gap: 14,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
        <button
          className="spims-hamburger"
          onClick={onMenuClick}
          aria-label="Toggle navigation"
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            flexShrink: 0,
            border: '1px solid var(--line)',
            borderRadius: 9,
            background: '#fff',
            color: 'var(--navy)',
            cursor: 'pointer',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
        <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
          {orgName}
        </span>
        <span style={{ color: 'var(--line)' }}>/</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {crumb}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div className="spims-topbar-search" style={{ position: 'relative' }}>
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
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                clearTimeout(blurTimeout.current);
                setFocused(true);
              }}
              onBlur={() => {
                blurTimeout.current = setTimeout(() => setFocused(false), 150);
              }}
              placeholder="Search projects, communities…"
              style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, fontFamily: 'inherit', color: 'var(--ink)', width: '100%' }}
            />
          </div>
          {showDropdown && (
            <div
              style={{
                position: 'absolute',
                top: '110%',
                left: 0,
                right: 0,
                background: '#fff',
                border: '1px solid var(--line)',
                borderRadius: 12,
                boxShadow: '0 20px 50px -15px rgba(17,28,85,0.35)',
                overflow: 'hidden',
                zIndex: 50,
                minWidth: 280,
              }}
            >
              {matchedProjects.length === 0 && matchedCommunities.length === 0 && (
                <div style={{ padding: '14px 16px', fontSize: 13, color: 'var(--muted)' }}>No matches for "{query}"</div>
              )}
              {matchedProjects.length > 0 && (
                <div>
                  <div style={{ padding: '8px 16px', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)', background: '#fafafe' }}>
                    Projects
                  </div>
                  {matchedProjects.map((p) => (
                    <div
                      key={p.id}
                      className="rowh"
                      onMouseDown={() => selectProject(p.id)}
                      style={{ padding: '10px 16px', cursor: 'pointer', fontSize: 13.5 }}
                    >
                      <div style={{ fontWeight: 600, color: 'var(--navy)' }}>{p.name}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{p.code} · {p.pillar}</div>
                    </div>
                  ))}
                </div>
              )}
              {matchedCommunities.length > 0 && (
                <div>
                  <div style={{ padding: '8px 16px', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)', background: '#fafafe' }}>
                    Communities
                  </div>
                  {matchedCommunities.map((c) => (
                    <div key={c.id} className="rowh" onMouseDown={() => selectCommunity(c.id)} style={{ padding: '10px 16px', cursor: 'pointer', fontSize: 13.5 }}>
                      <div style={{ fontWeight: 600, color: 'var(--navy)' }}>{c.name}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{c.lga}, {c.state}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div
          className="spims-topbar-fy"
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
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#1F8A5B', display: 'inline-block' }}></span>
          FY 2026 · ₦ Naira
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ textAlign: 'right', lineHeight: 1.2 }} className="spims-topbar-user">
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--navy)' }}>{userName}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{userRole}</div>
          </div>
          <button
            onClick={onLogout}
            style={{
              fontFamily: 'inherit',
              fontSize: 12.5,
              fontWeight: 600,
              color: 'var(--muted)',
              background: '#fff',
              border: '1px solid var(--line)',
              borderRadius: 9,
              padding: '8px 14px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
