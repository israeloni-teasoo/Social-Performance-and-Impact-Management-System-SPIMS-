import { formatCount } from '../analytics/metrics';
import { InfoTip } from './Tooltip';
import type { ReachProfile } from '../types';

const REACH_BLUE = '#2B4C9B';

/** The distinction the whole feature exists to enforce, in one reusable tooltip. */
export function ReachVsImpactTip({ width = 320 }: { width?: number }) {
  return (
    <InfoTip label="Reach vs. impact" width={width}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div>
          <strong>Reach</strong> counts everyone a programme interacted with — applicants, attendees, people screened, residents of a
          catchment area.
        </div>
        <div>
          <strong>Impact</strong> counts only those who actually received the intervention.
        </div>
        <div>
          They are reported separately on purpose. Someone who applied for a scholarship and did not receive one has been reached, but
          not impacted — counting them as impact overstates the result.
        </div>
      </div>
    </InfoTip>
  );
}

export function ReachPanel({ reach }: { reach: ReachProfile | undefined }) {
  if (!reach) {
    return (
      <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '22px 24px', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 8 }}>
          Reach vs. impact
          <ReachVsImpactTip />
        </div>
        <div style={{ fontSize: 13.5, color: 'var(--muted)' }}>
          This programme's reach hasn't been separated from its impact yet. Until it is, its interactions are excluded from the portfolio
          reach total rather than assumed to be zero.
        </div>
      </div>
    );
  }

  const notReached = Math.max(0, reach.total - reach.directBeneficiaries);
  const impactPct = reach.total === 0 ? 0 : (reach.directBeneficiaries / reach.total) * 100;

  return (
    <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '22px 24px', marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 18 }}>
        Reach vs. impact
        <ReachVsImpactTip />
      </div>

      <div style={{ display: 'flex', gap: 30, flexWrap: 'wrap', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
            Reach · interactions
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, color: REACH_BLUE, lineHeight: 1.1 }}>{formatCount(reach.total)}</div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>{reach.label}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
            Impact · people served
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--accent)', lineHeight: 1.1 }}>{formatCount(reach.directBeneficiaries)}</div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>received the intervention</div>
        </div>
      </div>

      <div
        style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', background: 'var(--bg)', marginBottom: 8 }}
        role="img"
        aria-label={`${formatCount(reach.directBeneficiaries)} of ${formatCount(reach.total)} interactions received the intervention`}
      >
        <span style={{ width: `${Math.max(impactPct, 0.6)}%`, background: 'var(--accent)' }} />
        <span style={{ flex: 1, background: 'rgba(43,76,155,0.28)' }} />
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 18 }}>
        {impactPct < 1 ? '<1' : impactPct.toFixed(1)}% of interactions converted into a delivered intervention ·{' '}
        {formatCount(notReached)} reached but not served
      </div>

      {reach.channels.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Where the interactions came from
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {reach.channels.map((c) => (
              <div key={c.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 13.5 }}>
                <span style={{ color: 'var(--ink)' }}>{c.label}</span>
                <span style={{ fontWeight: 700, color: 'var(--navy)', whiteSpace: 'nowrap' }}>{formatCount(c.value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.55, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
        {reach.note}
      </div>
    </div>
  );
}
