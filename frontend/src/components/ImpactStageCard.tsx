export type StageVariant = 'plain' | 'accentBorder' | 'navyFill' | 'accentFill';

export function ImpactStageCard({
  index,
  label,
  title,
  detail,
  bigFigure,
  bigFigureLabel,
  bullets,
  variant,
  badge,
}: {
  index: string;
  label: string;
  title: string;
  detail?: string;
  bigFigure?: string;
  bigFigureLabel?: string;
  bullets?: string[];
  variant: StageVariant;
  badge?: string;
}) {
  const styles = {
    plain: { background: '#fff', border: '1px solid var(--line)', color: undefined, labelColor: 'var(--muted)', detailColor: 'var(--ink)', detailBorder: '1px solid var(--line)' },
    accentBorder: { background: '#fff', border: '1px solid var(--accent)', color: undefined, labelColor: 'var(--accent)', detailColor: 'var(--ink)', detailBorder: '1px solid #F6D3D9' },
    navyFill: { background: '#2B4C9B', border: 'none', color: '#fff', labelColor: '#B9CBEB', detailColor: '#E4ECF8', detailBorder: '1px solid rgba(255,255,255,0.2)' },
    accentFill: { background: 'var(--accent)', border: 'none', color: '#fff', labelColor: '#FFD2D9', detailColor: '#FFE4E8', detailBorder: '1px solid rgba(255,255,255,0.28)' },
  }[variant];

  return (
    <div style={{ background: styles.background, border: styles.border, color: styles.color, borderRadius: 14, padding: '20px 18px', position: 'relative' }}>
      {badge && (
        <div
          style={{
            position: 'absolute',
            top: -10,
            left: 18,
            background: variant === 'accentFill' ? 'var(--navy)' : styles.background,
            fontSize: 9.5,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            padding: '3px 9px',
            borderRadius: 20,
            color: variant === 'accentFill' ? '#fff' : undefined,
          }}
        >
          {badge}
        </div>
      )}
      <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: styles.labelColor }}>
        {index} · {label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, margin: '10px 0 12px' }}>{title}</div>
      {bigFigure ? (
        <div style={{ borderTop: styles.detailBorder, paddingTop: 12 }}>
          <div style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.1 }}>{bigFigure}</div>
          {bigFigureLabel && <div style={{ fontSize: 12, color: styles.labelColor, marginTop: 4, marginBottom: bullets?.length ? 12 : 0 }}>{bigFigureLabel}</div>}
          {bullets && bullets.length > 0 && (
            <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {bullets.map((b, i) => (
                <li key={i} style={{ fontSize: 12.5, lineHeight: 1.4, color: styles.detailColor }}>
                  {b}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div style={{ fontSize: 13, lineHeight: 1.45, color: styles.detailColor, borderTop: styles.detailBorder, paddingTop: 12 }}>{detail}</div>
      )}
    </div>
  );
}
