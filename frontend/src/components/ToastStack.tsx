import type { ToastItem } from '../useToastQueue';

const TONE_COLORS: Record<ToastItem['tone'], [string, string]> = {
  success: ['#111C55', '#1F8A5B'],
  info: ['#111C55', '#2B4C9B'],
  warning: ['#111C55', '#C0491E'],
};

export function ToastStack({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 400,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        maxWidth: 360,
      }}
    >
      {toasts.map((t) => {
        const [bg, accent] = TONE_COLORS[t.tone];
        return (
          <div
            key={t.id}
            onClick={() => onDismiss(t.id)}
            style={{
              background: bg,
              color: '#fff',
              borderRadius: 12,
              padding: '13px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              boxShadow: '0 16px 40px -12px rgba(0,0,0,0.5)',
              cursor: 'pointer',
              fontSize: 13.5,
              lineHeight: 1.4,
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: accent, flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{t.message}</span>
          </div>
        );
      })}
    </div>
  );
}
