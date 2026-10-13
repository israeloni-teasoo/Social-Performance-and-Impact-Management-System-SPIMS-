import { useState } from 'react';
import { assessProject } from '../analytics/completeness';
import type { Project, ProjectImpact } from '../types';

/**
 * What this project still needs, on the project's own page.
 *
 * A thin upload used to look exactly like a thorough one — the page rendered whatever it
 * had and said nothing about what it did not. On the screen whose entire purpose is to
 * show impact, that is the worst possible silence: a reader cannot tell a programme with
 * little impact from a programme whose impact nobody recorded.
 *
 * It names the column that fills each gap, because "add more detail" is not an
 * instruction anyone can act on, and it is shown to everyone rather than only to editors:
 * a reader who knows the record is 60% complete reads the rest of the page correctly.
 */
export function CompletenessPanel({ project, impact }: { project: Project; impact: ProjectImpact | undefined }) {
  const { score, gaps } = assessProject(project, impact);
  const [open, setOpen] = useState(false);

  if (gaps.length === 0) {
    return (
      <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '16px 22px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: '#1F8A5B' }}>Record complete</span>
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>Every field this project’s report draws on has been filled in.</span>
      </div>
    );
  }

  const essential = gaps.filter((g) => g.weight === 'essential');
  const tone = score >= 80 ? '#1F8A5B' : score >= 55 ? '#8A5A0B' : 'var(--accent)';

  return (
    <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '20px 24px', marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 3 }}>
            What this project still needs
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>
            {gaps.length} field{gaps.length === 1 ? '' : 's'} missing
            {essential.length > 0 && `, ${essential.length} of them essential to reporting impact`}. Everything on this page is
            drawn only from what has been recorded.
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: tone, lineHeight: 1 }}>{score}%</div>
            <div style={{ fontSize: 10.5, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>complete</div>
          </div>
          <button
            onClick={() => setOpen((o) => !o)}
            style={{ fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, color: 'var(--navy)', background: '#fff', border: '1px solid var(--line)', borderRadius: 8, padding: '8px 14px', cursor: 'pointer' }}
          >
            {open ? 'Hide' : 'Show what is missing'}
          </button>
        </div>
      </div>

      {open && (
        <div style={{ marginTop: 16, borderTop: '1px solid var(--line)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 13 }}>
          {gaps.map((g) => (
            <div key={g.what} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span
                style={{
                  flexShrink: 0,
                  marginTop: 2,
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                  padding: '3px 8px',
                  borderRadius: 5,
                  background: g.weight === 'essential' ? 'rgba(227,26,56,0.1)' : 'rgba(43,76,155,0.1)',
                  color: g.weight === 'essential' ? 'var(--accent)' : '#2B4C9B',
                  textTransform: 'uppercase',
                }}
              >
                {g.weight}
              </span>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--navy)' }}>{g.what}</div>
                <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5 }}>
                  {g.why} Fill it in at <span style={{ fontFamily: 'monospace', fontSize: 11.5 }}>{g.from}</span>.
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
