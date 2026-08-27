import { h1, PILLAR_COLORS, pill, STATUS_COLORS } from '../ui';
import type { Community, Project, ProjectImpact } from '../types';

export function CommunityDetail({
  community,
  projects,
  impacts,
  goBack,
  goProjectDetail,
}: {
  community: Community;
  projects: Project[];
  impacts: Record<string, ProjectImpact>;
  goBack: () => void;
  goProjectDetail: (id: string) => void;
}) {
  const label = `${community.name}, ${community.state}`;
  const communityProjects = projects.filter((p) => impacts[p.code]?.communitiesImpacted.includes(label));
  const completed = communityProjects.filter((p) => p.progPct === '100%').length;
  const ongoing = communityProjects.length - completed;

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
        Back to communities
      </button>

      <h1 style={{ ...h1, margin: '0 0 4px' }}>{community.name}</h1>
      <p style={{ fontSize: 14.5, color: 'var(--muted)', margin: '0 0 20px' }}>
        {community.lga}, {community.state} · Population {community.pop} · CDC: {community.cdc}
      </p>

      <div className="grid-3" style={{ marginBottom: 22 }}>
        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '20px 22px' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>FY26 spend</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--navy)' }}>{community.spend}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '20px 22px' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Projects</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--navy)' }}>{communityProjects.length}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{ongoing} ongoing · {completed} completed</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '20px 22px' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Population</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy)' }}>{community.pop}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{community.lga}</div>
        </div>
      </div>

      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--navy)', marginBottom: 14 }}>Impact so far</div>
      {communityProjects.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '22px 24px', color: 'var(--muted)', fontSize: 13.5, marginBottom: 22 }}>
          No mapped projects for this community yet.
        </div>
      ) : (
        <div className="grid-3" style={{ marginBottom: 22 }}>
          {communityProjects.map((p) => {
            const imp = impacts[p.code];
            return (
              <div key={p.id} style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '18px 20px' }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>{p.name}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)', lineHeight: 1.15 }}>{imp?.impactFigure ?? '—'}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{imp?.impactFigureLabel ?? 'Impact not yet mapped'}</div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--navy)', marginBottom: 14 }}>Projects in {community.name}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 22 }}>
        {communityProjects.length === 0 && (
          <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '22px 24px', color: 'var(--muted)', fontSize: 13.5 }}>
            No projects mapped to this community yet.
          </div>
        )}
        {communityProjects.map((p) => {
          const [pillarBg, pillarFg] = PILLAR_COLORS[p.pillar] ?? ['#eee', '#555'];
          const [statusBg, statusFg] = STATUS_COLORS[p.status] ?? ['#eee', '#555'];
          return (
            <button
              key={p.id}
              onClick={() => goProjectDetail(p.id)}
              className="rowh"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                flexWrap: 'wrap',
                background: '#fff',
                border: '1px solid var(--line)',
                borderRadius: 14,
                padding: '16px 20px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                textAlign: 'left',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={pill(pillarBg, pillarFg)}>{p.pillar}</span>
                  <span style={pill(statusBg, statusFg)}>{p.status}</span>
                </div>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--navy)' }}>{p.name}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--navy)' }}>{p.budget}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{p.progress} complete</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
