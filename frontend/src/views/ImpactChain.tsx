import { useMemo, useState } from 'react';
import { h1, input, PILLAR_COLORS, STATUS_COLORS, subtitle } from '../ui';
import type { Community, Project, ProjectImpact } from '../types';

const PILLARS = ['Education', 'Health', 'Infrastructure', 'Economic Emp.'];
const STATUSES: Project['status'][] = ['On track', 'At risk', 'Delayed'];

function parseBudgetMillions(budget: string): number {
  const m = budget.match(/₦([\d.]+)([MB])/);
  if (!m) return 0;
  const value = Number(m[1]);
  return m[2] === 'B' ? value * 1000 : value;
}

function formatMillions(millions: number): string {
  if (millions >= 1000) return `₦${(millions / 1000).toFixed(2)}B`;
  return `₦${millions.toFixed(0)}M`;
}

export function ImpactChain({
  projects,
  impacts,
  communities,
  goProjectDetail,
}: {
  projects: Project[];
  impacts: Record<string, ProjectImpact>;
  communities: Community[];
  goProjectDetail: (id: string) => void;
}) {
  const [pillar, setPillar] = useState('All');
  const [communityId, setCommunityId] = useState('All');

  const community = communities.find((c) => c.id === communityId);
  const communityLabel = community ? `${community.name}, ${community.state}` : null;

  const filtered = useMemo(
    () =>
      projects.filter((p) => {
        if (pillar !== 'All' && p.pillar !== pillar) return false;
        if (communityLabel && !impacts[p.code]?.communitiesImpacted.includes(communityLabel)) return false;
        return true;
      }),
    [projects, impacts, pillar, communityLabel],
  );

  const totalInvestment = filtered.reduce((sum, p) => sum + parseBudgetMillions(p.budget), 0);
  const avgProgress = filtered.length ? Math.round(filtered.reduce((s, p) => s + Number(p.progPct.replace('%', '')), 0) / filtered.length) : 0;
  const communitiesReached = new Set(filtered.flatMap((p) => impacts[p.code]?.communitiesImpacted ?? [])).size;

  const byPillar = PILLARS.map((p) => ({
    name: p,
    value: filtered.filter((pr) => pr.pillar === p).reduce((s, pr) => s + parseBudgetMillions(pr.budget), 0),
  })).filter((row) => row.value > 0);
  const maxPillar = Math.max(1, ...byPillar.map((r) => r.value));

  const byStatus = STATUSES.map((s) => ({ status: s, count: filtered.filter((p) => p.status === s).length }));

  const byCommunity = communities
    .map((c) => ({ community: c, count: filtered.filter((p) => impacts[p.code]?.communitiesImpacted.includes(`${c.name}, ${c.state}`)).length }))
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count);
  const maxCommunity = Math.max(1, ...byCommunity.map((r) => r.count));

  return (
    <div>
      <h1 style={h1}>Impact Chain</h1>
      <p style={subtitle}>Portfolio-wide impact — filter by pillar and community to see where investment and results land.</p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 22, flexWrap: 'wrap' }}>
        <select value="FY2026" disabled style={{ ...input, width: 130 }}>
          <option>FY2026</option>
        </select>
        <select value={pillar} onChange={(e) => setPillar(e.target.value)} style={{ ...input, width: 180 }}>
          <option value="All">All pillars</option>
          {PILLARS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select value={communityId} onChange={(e) => setCommunityId(e.target.value)} style={{ ...input, width: 200 }}>
          <option value="All">All communities</option>
          {communities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid-4" style={{ marginBottom: 22 }}>
        <div style={{ background: 'var(--navy)', color: '#fff', borderRadius: 16, padding: '20px 22px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9EA1C0' }}>Investment</div>
          <div style={{ fontSize: 30, fontWeight: 800, marginTop: 6 }}>{formatMillions(totalInvestment)}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '20px 22px' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Projects</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--navy)', marginTop: 6 }}>{filtered.length}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '20px 22px' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Avg. progress</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--accent)', marginTop: 6 }}>{avgProgress}%</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '20px 22px' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Communities reached</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--navy)', marginTop: 6 }}>{communitiesReached}</div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: 18, marginBottom: 18 }}>
        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '22px 24px' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 18 }}>Investment by pillar</div>
          {byPillar.length === 0 && <div style={{ fontSize: 13, color: 'var(--muted)' }}>No projects match this filter.</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {byPillar.map((row) => {
              const [, fg] = PILLAR_COLORS[row.name] ?? ['#eee', '#555'];
              return (
                <div key={row.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ width: 110, fontSize: 12.5, fontWeight: 600, color: 'var(--ink)' }}>{row.name}</span>
                  <span style={{ flex: 1, height: 18, background: 'var(--bg)', borderRadius: 5, overflow: 'hidden' }}>
                    <span style={{ display: 'block', height: '100%', width: `${(row.value / maxPillar) * 100}%`, background: fg, borderRadius: 5 }} />
                  </span>
                  <span style={{ width: 80, fontSize: 12.5, fontWeight: 700, color: 'var(--navy)', textAlign: 'right' }}>{formatMillions(row.value)}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '22px 24px' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 18 }}>Delivery status</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {byStatus.map((row) => {
              const [, fg] = STATUS_COLORS[row.status] ?? ['#eee', '#555'];
              const pct = filtered.length ? (row.count / filtered.length) * 100 : 0;
              return (
                <div key={row.status} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ width: 90, fontSize: 12.5, fontWeight: 600, color: 'var(--ink)' }}>{row.status}</span>
                  <span style={{ flex: 1, height: 18, background: 'var(--bg)', borderRadius: 5, overflow: 'hidden' }}>
                    <span style={{ display: 'block', height: '100%', width: `${pct}%`, background: fg, borderRadius: 5 }} />
                  </span>
                  <span style={{ width: 30, fontSize: 12.5, fontWeight: 700, color: 'var(--navy)', textAlign: 'right' }}>{row.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {byCommunity.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '22px 24px', marginBottom: 18 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 18 }}>Projects by community</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {byCommunity.map((row) => (
              <div key={row.community.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 90, fontSize: 12.5, fontWeight: 600, color: 'var(--ink)' }}>{row.community.name}</span>
                <span style={{ flex: 1, height: 16, background: 'var(--bg)', borderRadius: 5, overflow: 'hidden' }}>
                  <span style={{ display: 'block', height: '100%', width: `${(row.count / maxCommunity) * 100}%`, background: '#2B4C9B', borderRadius: 5 }} />
                </span>
                <span style={{ width: 24, fontSize: 12.5, fontWeight: 700, color: 'var(--navy)', textAlign: 'right' }}>{row.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', margin: '4px 0 14px' }}>Impact highlights</div>
      {filtered.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '22px 24px', color: 'var(--muted)', fontSize: 13.5 }}>
          No projects match this filter.
        </div>
      ) : (
        <div className="grid-3">
          {filtered.map((p) => {
            const imp = impacts[p.code];
            const [, pillarFg] = PILLAR_COLORS[p.pillar] ?? ['#eee', '#555'];
            return (
              <button
                key={p.id}
                onClick={() => goProjectDetail(p.id)}
                className="card-lift"
                style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '18px 20px', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: pillarFg, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{p.pillar}</div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--navy)', marginBottom: 8 }}>{p.name}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)', lineHeight: 1.15 }}>{imp?.impactFigure ?? '—'}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{imp?.impactFigureLabel ?? 'Impact not yet mapped'}</div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
